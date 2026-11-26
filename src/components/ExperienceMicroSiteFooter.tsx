import { Link } from 'react-router';
import { getExperienceTheme } from '../content/experienceThemes';

export function ExperienceMicroSiteFooter({
  slug,
  appName,
}: {
  slug: string;
  appName: string;
}) {
  const theme = getExperienceTheme(slug);
  if (!theme) return null;

  return (
    <footer
      className="experience-microsite-footer"
      aria-label={`${appName} app site details and policies`}
      data-app-microsite-footer={theme.slug}
      data-experience-theme-name={theme.themeName}
    >
      <div className="experience-microsite-footer__identity">
        <p className="eyebrow">{theme.publisher} · {theme.themeName}</p>
        <p className="experience-microsite-footer__title">{appName}</p>
        <p className="experience-microsite-footer__meta">
          <span>Official page: https://nocharge.net/experiences/{theme.slug}/</span>
          <span aria-hidden="true">·</span>
          <span>Developer contact: {theme.supportEmail}</span>
        </p>
      </div>
      <nav className="experience-microsite-footer__nav" aria-label={`${appName} legal and site links`}>
        {theme.appLegalSlug ? (
          <>
            <Link to={`/privacy/${theme.appLegalSlug}/`} data-microsite-footer-link="privacy">
              Privacy Policy
            </Link>
            <Link to={`/terms/${theme.appLegalSlug}/`} data-microsite-footer-link="terms">
              Terms of Service
            </Link>
          </>
        ) : (
          <>
            <Link to="/privacy/" data-microsite-footer-link="site-privacy">
              NoCharge Privacy
            </Link>
            <Link to="/terms/" data-microsite-footer-link="site-terms">
              NoCharge Terms
            </Link>
          </>
        )}
        <Link to="/experiences/" data-microsite-footer-link="directory">
          All App Experiences
        </Link>
      </nav>
    </footer>
  );
}
