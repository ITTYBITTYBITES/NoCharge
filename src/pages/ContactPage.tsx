import { PageIntro, SectionHeading, StatusBadge } from '../components/Primitives';

const otherChannels = [
  { title: 'General questions', description: 'No general contact inbox is provided.', kind: '01' },
  { title: 'General feedback', description: 'The email address is reserved for accessibility-barrier reports.', kind: '02' },
  { title: 'Partnership enquiries', description: 'No partnership enquiries channel is provided.', kind: '03' },
];

export function ContactPage() {
  return (
    <div className="page-container destination-page contact-page">
      <PageIntro
        eyebrow="Limited contact"
        title="Report an accessibility barrier"
        lead="For accessibility-barrier reports only, email hello@nocharge.net. No general contact form or support inbox is live."
        breadcrumb={[{ label: 'Contact' }]}
        status={false}
      />
      <section className="contact-status-panel" aria-label="Accessibility barrier reporting contact">
        <div className="contact-status-panel__mark" aria-hidden="true">✳</div>
        <div>
          <p className="eyebrow">Accessibility reports only</p>
          <h2>Tell us what blocked access.</h2>
          <p>This address is for accessibility-barrier reports only. No response time is promised. Please do not use it for general support or privacy requests; those channels are not live.</p>
          <p><a className="text-link" href="mailto:hello@nocharge.net">hello@nocharge.net</a></p>
          <StatusBadge>Limited channel</StatusBadge>
        </div>
      </section>
      <section className="section-spacing" aria-labelledby="contact-structure-title">
        <SectionHeading id="contact-structure-title" eyebrow="Other enquiries" title="Other contact channels are not provided." />
        <div className="contact-channel-list">
          {otherChannels.map((channel) => <article className="contact-channel" key={channel.kind}><span>{channel.kind}</span><div><h3>{channel.title}</h3><p>{channel.description}</p></div><small>Unavailable</small></article>)}
        </div>
      </section>
      <p className="legal-scope-note">This limited address is not a general support or response-time commitment.</p>
    </div>
  );
}
