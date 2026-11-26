import { Link } from 'react-router';

export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={small ? 'brand-mark brand-mark--small' : 'brand-mark'}
      viewBox="0 0 48 48"
      fill="none"
    >
      <rect width="48" height="48" rx="15" fill="currentColor" />
      <path d="M12.5 34V14l23 20V14" stroke="#20252B" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="35.5" cy="34" r="2.6" fill="#FF775D" />
    </svg>
  );
}

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link to="/" className={`brand${footer ? ' brand--footer' : ''}`} aria-label="NoCharge home">
      <BrandMark />
      <span className="brand-wordmark"><strong>No</strong>Charge</span>
    </Link>
  );
}
