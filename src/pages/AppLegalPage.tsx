import { Link, useLocation, useParams } from 'react-router';
import { PageIntro } from '../components/Primitives';
import { getAppLegalRecord, type AppLegalKind, type AppLegalSection as AppLegalSectionData } from '../content/appLegalPolicies';
import { getExperienceTheme } from '../content/experienceThemes';
import { NotFoundPage } from './NotFoundPage';

function LegalSection({ section }: { section: AppLegalSectionData }) {
  return (
    <section className="app-legal-section">
      <h2>{section.heading}</h2>
      {section.paragraphs?.map((paragraph, index) => <p key={`paragraph-${index}`}>{paragraph}</p>)}
      {section.items && (
        <ul>{section.items.map((item, index) => <li key={`item-${index}`}>{item}</li>)}</ul>
      )}
      {section.table && (
        <div className="app-legal-table-wrap">
          <table>
            <thead><tr>{section.table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>{section.table.rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`cell-${cellIndex}`}>{cell}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {section.links?.length ? (
        <p className="app-legal-reference-links">
          {section.links.map((link, index) => (
            <span key={link.href}>
              {index > 0 && ' · '}
              <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label} <span aria-hidden="true">↗</span></a>
            </span>
          ))}
        </p>
      ) : null}
    </section>
  );
}

export function AppLegalPage() {
  const { appSlug } = useParams();
  const location = useLocation();
  const record = getAppLegalRecord(appSlug);
  if (!record) return <NotFoundPage />;

  const kind: AppLegalKind = location.pathname.startsWith('/terms/') ? 'terms' : 'privacy';
  const title = kind === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
  const sourceUrl = record.sourceUrls[kind];
  const sections = record.policies?.[kind];
  const isDraft = record.status === 'publisher-draft' || !sections;
  const theme = getExperienceTheme(record.slug);

  return (
    <article
      className="page-container destination-page legal-page app-legal-page"
      data-app-legal-route={record.slug}
      data-app-legal-kind={kind}
      data-app-legal-status={isDraft ? 'draft' : 'source-provided'}
      data-experience-theme={record.slug}
      data-experience-personality={theme?.personality}
    >
      <PageIntro
        eyebrow={`${record.publisher} · App-specific document`}
        title={`${record.appName} ${title}`}
        lead={isDraft
          ? 'The publisher source supplied for this app is still marked as a draft. This page does not present it as a completed policy.'
          : `Publisher-supplied ${kind === 'privacy' ? 'privacy policy' : 'terms'} text for the Android app ${record.appName}.`}
        breadcrumb={[
          { label: 'Experiences', href: '/experiences/' },
          { label: record.appName, href: `/experiences/${record.slug}/` },
          { label: title },
        ]}
        status={false}
      />
      <div className="app-legal-meta">
        <span><strong>Publisher:</strong> {record.publisher}</span>
        <span><strong>Last updated:</strong> {record.lastUpdated}</span>
        <span><strong>App site:</strong> <Link to={`/experiences/${record.slug}/`}>nocharge.net/experiences/{record.slug}/</Link></span>
      </div>

      {isDraft ? (
        <section className="legal-warning app-legal-draft-warning" role="note" data-app-legal-draft-warning>
          <span className="legal-warning__icon" aria-hidden="true">!</span>
          <div>
            <strong>Publisher draft · not a final policy</strong>
            <p>The supplied repository labels this document “complete before publishing” and says not to publish it unchanged. Publisher/contact values and release configuration still require confirmation. No draft clauses or unresolved placeholders are reproduced here as final legal text.</p>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" data-app-legal-source-link={kind}>
              Review the publisher’s source draft <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      ) : (
        <>
          <aside className="app-legal-source-note" role="note">
            The text below is supplied by the app publisher. Consult the linked source for the publisher’s current version.
            {' '}<a href={sourceUrl} target="_blank" rel="noopener noreferrer" data-app-legal-source-link={kind}>View publisher source <span aria-hidden="true">↗</span></a>
          </aside>
          <div className="app-legal-content">
            {sections?.map((section) => <LegalSection key={section.heading} section={section} />)}
          </div>
        </>
      )}

      <nav className="app-legal-document-nav" aria-label={`${record.appName} policy documents`}>
        {kind === 'privacy'
          ? <Link to={`/terms/${record.slug}/`}>Read {isDraft ? 'terms draft' : 'Terms of Service'} <span aria-hidden="true">→</span></Link>
          : <Link to={`/privacy/${record.slug}/`}>Read {isDraft ? 'privacy policy draft' : 'Privacy Policy'} <span aria-hidden="true">→</span></Link>}
        <Link to={`/experiences/${record.slug}/`}>Back to {record.appName} <span aria-hidden="true">→</span></Link>
      </nav>
    </article>
  );
}
