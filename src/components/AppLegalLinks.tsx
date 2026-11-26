import { Link } from 'react-router';
import type { AppLegalSlug } from '../content/appLegalPolicies';

export function AppLegalLinks({ appSlug, draft = false }: { appSlug: AppLegalSlug; draft?: boolean }) {
  return (
    <nav className="app-legal-links" aria-label={`${appSlug} app policies`} data-app-legal-links={appSlug} data-legal-source-status={draft ? 'draft' : 'source-provided'}>
      <Link to={`/privacy/${appSlug}/`} data-app-legal-link="privacy" data-legal-status={draft ? 'draft' : 'source-provided'}>
        {draft ? 'Privacy policy draft' : 'Privacy policy'}
      </Link>
      <Link to={`/terms/${appSlug}/`} data-app-legal-link="terms" data-legal-status={draft ? 'draft' : 'source-provided'}>
        {draft ? 'Terms draft' : 'Terms'}
      </Link>
    </nav>
  );
}
