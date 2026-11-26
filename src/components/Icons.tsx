import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function ArrowIcon(props: IconProps) {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}><path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function SearchIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

export function MenuIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

export function CloseIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

export function SystemThemeIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><rect x="3.5" y="4.2" width="17" height="12.3" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 20h8m-4-3.5V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="10.35" r="2.1" fill="currentColor"/></svg>;
}

export function LightThemeIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><circle cx="12" cy="12" r="3.7" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2.7v2m0 14.6v2m9.3-9.3h-2M4.7 12h-2m15.88-6.58-1.42 1.42M6.84 17.16l-1.42 1.42m13.16 0-1.42-1.42M6.84 6.84 5.42 5.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

export function DarkThemeIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="M20.2 15.4A8.7 8.7 0 0 1 8.6 3.8 8.9 8.9 0 1 0 20.2 15.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function SparkIcon(props: IconProps) {
  return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" {...props}><path d="M20 3.5 23.7 16l12.8 4-12.8 4L20 36.5 16.2 24l-12.7-4 12.7-4L20 3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="32.5" cy="8" r="2" fill="currentColor"/><circle cx="8" cy="31" r="1.7" fill="currentColor"/></svg>;
}

export function DestinationGlyph({ kind, ...props }: IconProps & { kind: 'arcade' | 'apps' | 'tools' | 'guides' | 'discover' | 'shop' }) {
  const common = { ...props, viewBox: '0 0 48 48', fill: 'none', 'aria-hidden': true as const };
  if (kind === 'arcade') return <svg {...common}><path d="M13 18.5h22a7 7 0 0 1 6.8 8.8l-1.6 6.2a4 4 0 0 1-6.4 2l-5.2-4H19.4l-5.2 4a4 4 0 0 1-6.4-2l-1.6-6.2a7 7 0 0 1 6.8-8.8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M15 23v8m-4-4h8m12-2h.1m4 4h.1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><path d="m19 14 5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (kind === 'apps') return <svg {...common}><rect x="13" y="5" width="22" height="38" rx="6" stroke="currentColor" strokeWidth="2"/><path d="M19 11h10M21 37h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M24 18v10m-5-5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (kind === 'tools') return <svg {...common}><path d="M27.8 9.2a9.5 9.5 0 0 0-12.5 12.5L7 30a4.2 4.2 0 1 0 5.9 5.9l8.3-8.3a9.5 9.5 0 0 0 12.5-12.5l-5.6 5.6-5-1.3-1.3-5 6-5.2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>;
  if (kind === 'guides') return <svg {...common}><path d="M9 7.5A4.5 4.5 0 0 1 13.5 3H37v34H13.5A4.5 4.5 0 0 0 9 41.5v-34Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M9 8v33.5m8-29h13m-13 7h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (kind === 'shop') return <svg {...common}><path d="M8 18h32l-2.5 22H10.5L8 18Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M16 19v-5a8 8 0 0 1 16 0v5M17 27h.1m14.8 0h.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  return <svg {...common}><circle cx="22" cy="23" r="15" stroke="currentColor" strokeWidth="2"/><circle cx="22" cy="23" r="7" stroke="currentColor" strokeWidth="2"/><path d="m33 12 8-8m-4 0h4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="16" cy="21" r="1.2" fill="currentColor"/><circle cx="27" cy="25" r="1.2" fill="currentColor"/></svg>;
}
