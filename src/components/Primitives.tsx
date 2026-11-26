import { Link } from 'react-router';
import type { ReactNode } from 'react';
import type { AssetIconId } from '../assets/iconIds';
import { AdaptiveIcon } from './AdaptiveIcon';
import { ArrowIcon, DestinationGlyph, SparkIcon } from './Icons';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li><Link to="/">Home</Link></li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href ? <Link to={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function StatusBadge({ children = 'Coming soon' }: { children?: ReactNode }) {
  return <span className="status-badge"><span className="status-dot" aria-hidden="true" />{children}</span>;
}

export function PageIntro({
  eyebrow,
  title,
  lead,
  breadcrumb,
  status = true,
  tone = 'default',
  iconId,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  breadcrumb?: BreadcrumbItem[];
  status?: boolean;
  tone?: 'default' | 'compact';
  /** `null` reserves a structural placeholder for a section without an approved mapped icon. */
  iconId?: AssetIconId | null;
}) {
  return (
    <header className={`page-intro page-intro--${tone}`}>
      {breadcrumb && <Breadcrumbs items={breadcrumb} />}
      <div className="page-intro__eyebrow"><span>{eyebrow}</span>{status && <StatusBadge />}</div>
      <h1 className={iconId !== undefined ? 'page-intro__title' : undefined}>
        {iconId !== undefined && <AdaptiveIcon iconId={iconId} size={44} />}
        {iconId !== undefined ? <span>{title}</span> : title}
      </h1>
      <p className="page-intro__lead">{lead}</p>
    </header>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
  aside,
  id,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  aside?: ReactNode;
  id?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id}>{title}</h2>
        {children && <p className="section-heading__copy">{children}</p>}
      </div>
      {aside && <div className="section-heading__aside">{aside}</div>}
    </div>
  );
}

export function EmptyState({
  eyebrow = 'Nothing here yet',
  title,
  children,
  compact = false,
  kind = 'spark',
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  compact?: boolean;
  kind?: 'spark' | 'arcade' | 'apps' | 'tools' | 'guides' | 'discover' | 'shop';
}) {
  return (
    <div className={`empty-state${compact ? ' empty-state--compact' : ''}`}>
      <div className="empty-state__mark">
        {kind === 'spark' ? <SparkIcon /> : <DestinationGlyph kind={kind} />}
      </div>
      <div className="empty-state__copy">
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}

export function CategoryFilter({
  label,
  categories,
  selected,
  onChange,
}: {
  label: string;
  categories: readonly string[];
  selected: string;
  onChange: (category: string) => void;
}) {
  return (
    <div className="category-filter" role="group" aria-label={label}>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`category-chip${selected === category ? ' is-selected' : ''}`}
          aria-pressed={selected === category}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export function TextLink({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return <Link to={to} className={`text-link ${className}`.trim()}>{children}<ArrowIcon /></Link>;
}

export function DestinationRow({
  number,
  kind,
  title,
  description,
  href,
  tint,
  badge,
}: {
  number: string;
  kind: 'arcade' | 'apps' | 'tools' | 'guides' | 'discover' | 'shop';
  title: string;
  description: string;
  href: string;
  tint: 'lime' | 'peach' | 'blue' | 'lilac' | 'yellow' | 'mint';
  badge?: ReactNode;
}) {
  return (
    <Link to={href} className={`destination-row destination-row--${tint}`}>
      <span className="destination-row__number">{number}</span>
      <span className="destination-row__icon"><DestinationGlyph kind={kind} /></span>
      <span className="destination-row__body">
        <span className="destination-row__title">{title}<ArrowIcon /></span>
        <span className="destination-row__description">{description}</span>
      </span>
      {badge ?? <StatusBadge />}
    </Link>
  );
}
