import { PageIntro, SectionHeading } from '../components/Primitives';

/**
 * This page describes the current V2 configuration. It does not activate or
 * authorize any future advertising or affiliate integration.
 */
export function AdvertisingPage() {
  return (
    <div className="page-container destination-page legal-page advertising-page" data-advertising-status="current-v2-no-display-ads">
      <PageIntro
        eyebrow="Current V2 disclosure"
        title="Advertising Disclosure"
        lead="No display advertising is served in V2. Optional Amazon Associates links appear in Quiet Setup; the former non-Amazon affiliate program and its links are no longer used."
        breadcrumb={[{ label: 'Advertising Disclosure' }]}
        status={false}
      />

      <section className="section-spacing advertising-policy" aria-labelledby="advertising-display-title">
        <SectionHeading
          id="advertising-display-title"
          eyebrow="Current V2 state"
          title="Display advertising"
        />
        <div className="advertising-policy__body">
          <p>No display advertising is served in the current V2 build. AdSense and H5 Games Ads placements and adapters remain dormant; reserved ad slots are inert. No publisher ID, advertising SDK, or ad-network request is active. This page does not authorize an activation.</p>
        </div>
      </section>

      <section className="section-spacing advertising-policy" aria-labelledby="advertising-retired-title">
        <SectionHeading
          id="advertising-retired-title"
          eyebrow="V2 scope"
          title="Non-Amazon affiliate activity"
        />
        <div className="advertising-policy__body">
          <p>The former non-Amazon affiliate program and its links are no longer used. V2 has no active non-Amazon affiliate links, replacement tracking, or merchant-referral activity.</p>
        </div>
      </section>

      <section className="section-spacing advertising-policy" aria-labelledby="advertising-amazon-title">
        <SectionHeading
          id="advertising-amazon-title"
          eyebrow="Optional paid links"
          title="Amazon Associates in Quiet Setup"
        >
          Some Quiet Setup articles contain optional Amazon product or search links using the Associates tag <code>nocharge-20</code>. NoCharge may earn a commission from qualifying purchases.
        </SectionHeading>
        <ul className="advertising-policy__list">
          <li>Each article with an Amazon link displays this disclosure before its first paid link:</li>
        </ul>
        <blockquote className="advertising-policy__quote">
          <p>“This article contains Amazon affiliate links. If you make a qualifying purchase through one of these links, NoCharge may earn a commission.”</p>
        </blockquote>
        <ul className="advertising-policy__list">
          <li>Each link-bearing article also includes the statement: “As an Amazon Associate I earn from qualifying purchases.”</li>
          <li>Amazon links are visibly labeled “(paid link)”, open in a new tab, and use <code>rel="sponsored nofollow noopener noreferrer"</code>.</li>
          <li>The links are optional. No purchase is needed to use NoCharge, and Quiet Setup articles retain no-purchase alternatives and relevant limitations.</li>
          <li>An Amazon link is followed only if you select it. Amazon then handles its own site, cookies, checkout, and privacy practices. NoCharge does not receive complete order details.</li>
        </ul>
      </section>

      <p className="legal-scope-note">This disclosure describes the current V2 implementation. Any future advertising provider, publisher ID, affiliate relationship, or tracking change requires separate review and approval; this page does not activate one.</p>
    </div>
  );
}
