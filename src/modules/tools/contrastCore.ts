const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/iu;

export function isSixDigitHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const encoded = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return encoded <= 0.04045 ? encoded / 12.92 : ((encoded + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function calculateContrastRatio(foreground: string, background: string): number | null {
  if (!isSixDigitHexColor(foreground) || !isSixDigitHexColor(background)) return null;
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrastThreshold(ratio: number, threshold: number): boolean {
  return ratio >= threshold;
}
