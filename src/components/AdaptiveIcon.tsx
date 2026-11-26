import type { ReactNode } from 'react';
import { resolveAssetIcon } from '../assets/assetRegistry';
import type { AssetIconId } from '../assets/iconIds';

export interface AdaptiveIconProps {
  /** A semantic ID from the approved-only registry; never a caller-supplied file path. */
  iconId?: AssetIconId | null;
  /** CSS-pixel dimensions are explicit on both the wrapper and the inline SVG. */
  size?: number;
  /** Omit for a decorative icon beside visible text; set only when the icon conveys unique meaning. */
  alt?: string;
  /** Optional structural placeholder; the default is a theme-contrasted outline mark. */
  fallback?: ReactNode;
  className?: string;
}

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/**
 * Registry SVGs are local, audited, build-time imports—not user input. Remove
 * their standalone title/desc and accessibility attributes before applying the
 * semantics for this particular use. File integrity is checked by asset tests.
 */
function inlineSvgMarkup(svg: string, size: number, alt?: string): string {
  const withoutEmbeddedText = svg
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/giu, '')
    .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/giu, '');

  return withoutEmbeddedText.replace(/<svg\b([^>]*)>/iu, (_match, rawAttributes: string) => {
    const attributes = rawAttributes.replace(/\s(?:width|height|role|aria-labelledby|aria-label|aria-hidden|focusable|tabindex)="[^"]*"/giu, '');
    const semantics = alt
      ? ` role="img" aria-label="${escapeAttribute(alt)}"`
      : ' aria-hidden="true" focusable="false"';
    return `<svg${attributes} width="${size}" height="${size}"${semantics}>`;
  });
}

/**
 * Approved SVGs render inline so currentColor and the theme's icon CSS
 * properties inherit correctly. Inline vectors are present eagerly in the DOM
 * and require no image request or loading attribute.
 */
export function AdaptiveIcon({ iconId, size = 20, alt, fallback, className = '' }: AdaptiveIconProps) {
  const boundedSize = Number.isFinite(size) ? Math.min(512, Math.max(1, Math.round(size))) : 20;
  const accessibleName = alt?.trim() || undefined;
  const asset = resolveAssetIcon(iconId);
  const classes = `adaptive-icon${className ? ` ${className}` : ''}`;

  if (!asset) {
    return (
      <span
        className={`${classes} adaptive-icon--fallback`}
        data-icon-fallback="true"
        aria-hidden={accessibleName ? undefined : 'true'}
        role={accessibleName ? 'img' : undefined}
        aria-label={accessibleName}
        style={{ width: boundedSize, height: boundedSize }}
      >
        {fallback ?? <span className="adaptive-icon__fallback-mark" />}
      </span>
    );
  }

  return (
    <span
      className={classes}
      data-icon-id={asset.id}
      data-asset-id={asset.manifestAssetId}
      data-render-mode="inline-svg"
      aria-hidden={accessibleName ? undefined : 'true'}
      style={{ width: boundedSize, height: boundedSize }}
      dangerouslySetInnerHTML={{ __html: inlineSvgMarkup(asset.svgMarkup, boundedSize, accessibleName) }}
    />
  );
}
