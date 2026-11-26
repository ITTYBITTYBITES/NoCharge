import { PageIntro, SectionHeading } from '../components/Primitives';

function PrivacyPolicy() {
  return (
    <>
      <section className="section-spacing" aria-labelledby="privacy-information-title">
        <SectionHeading id="privacy-information-title" eyebrow="First-party site information" title="Information and processing" />
        <div className="prose">
          <p>NoCharge V2 does not require a user account and does not operate a server-side database for Arcade play or tool entries. The site is delivered as static pages. The hosting provider necessarily handles page requests and may process technical request information under its own policies; NoCharge does not receive a game score or tool input through a NoCharge account or game-service endpoint.</p>
          <p>Game and tool behavior varies by page. Current Arcade boards, scores, and most tool inputs are held in the open page and may reset when it is reloaded or closed. The current Arcade source does not save game scores in browser storage. Tools generally process entered values in the browser; the Singing Bowl Engine represents its shareable arrangement in the URL fragment rather than saving it to a NoCharge server.</p>
        </div>
      </section>

      <section className="section-spacing" aria-labelledby="privacy-storage-title">
        <SectionHeading id="privacy-storage-title" eyebrow="Your browser" title="Local storage and preferences" />
        <div className="prose">
          <p>The site uses this browser’s <code>localStorage</code> for two interface preferences: <code>nocharge-theme</code> stores the selected base theme, and <code>nocharge-seasonal-mode</code> stores the seasonal-theme preference. These values are local to the browser profile and are not game scores or account records. If browser settings block or clear local storage, a preference may not persist.</p>
          <p>The Storage Inspector is a user-initiated, read-only tool. After you press its scan button, it lists a narrow set of local-storage key names; it does not read stored values or change browser data. Use your browser’s site-data controls to clear local preferences. NoCharge does not provide an account-based export or deletion feature because this site has no user accounts or server-side game database.</p>
        </div>
      </section>

      <section className="section-spacing" aria-labelledby="privacy-tracking-title">
        <SectionHeading id="privacy-tracking-title" eyebrow="Current V2 configuration" title="Cookies, analytics, and advertising" />
        <div className="prose">
          <p>The current V2 site build has no configured third-party analytics provider and does not load third-party tracking, analytics, or advertising scripts on page load. No display-ad provider is active; AdSense and H5 Games Ads placements remain dormant. The current build makes no unsolicited third-party request when a page is opened. This describes the current implementation, not a promise about a future release.</p>
          <p>NoCharge does not use a tracking cookie or consent banner in the current V2 build. Your browser can still store the theme preferences described above. A third-party destination may use its own cookies or similar technologies after you choose to open it; those practices are governed by that destination’s notices and controls.</p>
        </div>
      </section>

      <section className="section-spacing" aria-labelledby="privacy-outbound-title">
        <SectionHeading id="privacy-outbound-title" eyebrow="Optional links" title="Amazon, Experiences, and other services" />
        <div className="prose">
          <p>Some Quiet Setup articles contain optional Amazon Associates links. They are visibly labeled “(paid link)”; NoCharge may earn a commission from a qualifying purchase. Each link-bearing article includes an Amazon disclosure and the statement “As an Amazon Associate I earn from qualifying purchases.” Selecting a link takes you to Amazon, where Amazon handles the visit, any cookies, checkout, and its own privacy practices. You do not need to buy anything to read Quiet Setup or use the Arcade.</p>
          <p><a href="/experiences/">Experiences</a> pages are static showcases, not embedded app or game demos. Google Play and itch.io destinations are ordinary outbound links and are contacted only if you select them. YouTube trailers show a local poster first; the YouTube player is created only after you press its Play button. Once opened, those external services apply their own privacy practices.</p>
        </div>
      </section>

      <section className="section-spacing" aria-labelledby="privacy-choices-title">
        <SectionHeading id="privacy-choices-title" eyebrow="Your choices" title="Clearing data and getting in touch" />
        <div className="prose">
          <p>You can clear the site’s local theme preferences through your browser’s site-data settings or block local storage in your browser. The current site has no NoCharge account, cloud game history, analytics consent control, or server-side game data to export or delete. Some page-session activity will also disappear when you close or reload the page.</p>
          <p>The <a href="/contact/">Contact</a> page does not provide a general contact form, support inbox, or privacy-request channel. It lists <a href="mailto:hello@nocharge.net">hello@nocharge.net</a> for accessibility-barrier reports only; no response time is promised. If you choose to email, you decide what information to include and send it through your email provider. For Amazon, the external store, Google Play, itch.io, or YouTube, use the privacy controls and contact information offered by that service.</p>
        </div>
      </section>
    </>
  );
}

function TermsOfUse() {
  return (
    <>
      <section className="section-spacing" aria-labelledby="terms-scope-title">
        <SectionHeading id="terms-scope-title" eyebrow="Website scope" title="Using NoCharge V2" />
        <div className="prose">
          <p>These terms describe the NoCharge V2 website: a static browser Arcade, client-side utilities, Quiet Setup articles, editorial guides, and static Experience showcases. The site requires a browser and network connection to load; it does not provide user accounts, cloud game saves, online matchmaking, or a promise that every page is available on every managed network.</p>
          <p>Game and tool controls, rules, and limitations vary by page. Read the instructions on the specific page before use. Active game and tool state is generally held in the open browser page and may reset when it is closed or reloaded. Do not enter sensitive information into a tool unless its page clearly describes the processing and you have decided the use is appropriate.</p>
        </div>
      </section>

      <section className="section-spacing" aria-labelledby="terms-content-title">
        <SectionHeading id="terms-content-title" eyebrow="Editorial content" title="Games, tools, and Quiet Setup" />
        <div className="prose">
          <p>NoCharge games and client-side utilities are provided for general use as described on their pages. They are not a substitute for professional advice or a guarantee of a particular result. Quiet Setup is editorial information; measurements, compatibility, prices, availability, and product details can change. Check the current manufacturer or seller information before making a purchase.</p>
          <p>Quiet Setup may include optional Amazon Associates links, marked “(paid link).” NoCharge may earn a commission from a qualifying purchase, and no purchase is required to use the site. The advertising disclosure and the relevant article provide the link disclosures.</p>
        </div>
      </section>

      <section className="section-spacing" aria-labelledby="terms-external-title">
        <SectionHeading id="terms-external-title" eyebrow="Separate destinations" title="Experience links" />
        <div className="prose">
          <p><a href="/experiences/">Experiences</a> pages are static showcases and do not host an app or game demo. Links to Google Play, itch.io, and other official destinations open only when selected; YouTube trailers load only after an explicit Play action. Third-party sites and services have their own terms, privacy notices, and availability.</p>
        </div>
      </section>

      <section className="section-spacing" aria-labelledby="terms-apps-title">
        <SectionHeading id="terms-apps-title" eyebrow="Separate app policies" title="Android apps are not covered by these website terms" />
        <div className="prose">
          <p>Google Play listings lead to apps published separately from this website. Where available, the app-specific legal routes at <code>/privacy/{'{app}'}/</code> and <code>/terms/{'{app}'}/</code> are separate from these website terms and apply to the named app only. Review the publisher’s current app listing and policy before installing or using an app.</p>
          <p>These website terms describe the NoCharge V2 site; they do not claim to be the terms of an external store, app publisher, Google Play, itch.io, or YouTube.</p>
        </div>
      </section>
    </>
  );
}

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const isPrivacy = kind === 'privacy';
  const title = isPrivacy ? 'Privacy' : 'Terms of use';
  const lead = isPrivacy
    ? 'How the current NoCharge V2 website handles browser preferences, game and tool activity, and optional links to external services.'
    : 'Terms for the NoCharge V2 website, including its browser Arcade, client-side utilities, Quiet Setup articles, and static Experience showcases.';

  return (
    <div className="page-container destination-page legal-page">
      <PageIntro
        eyebrow={isPrivacy ? 'V2 site privacy' : 'V2 website terms'}
        title={title}
        lead={lead}
        breadcrumb={[{ label: title }]}
        status={false}
      />
      {isPrivacy ? <PrivacyPolicy /> : <TermsOfUse />}
      <p className="legal-scope-note">These pages cover the NoCharge website only. The separate app-specific policies are not site-wide policies.</p>
    </div>
  );
}
