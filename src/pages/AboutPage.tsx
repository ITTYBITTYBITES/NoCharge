import { Link } from 'react-router';
import { DestinationGlyph } from '../components/Icons';
import { PageIntro, SectionHeading } from '../components/Primitives';

const plans = [
  { title: 'Arcade', note: 'Free browser games', icon: 'arcade' as const },
  { title: 'App Experiences', note: 'Static app and release showcases', icon: 'apps' as const },
  { title: 'Tools', note: 'Useful online helpers', icon: 'tools' as const },
  { title: 'Guides', note: 'Articles and how-tos', icon: 'guides' as const },
  { title: 'Discover', note: 'Curated ways to explore', icon: 'discover' as const },
];

export function AboutPage() {
  return (
    <div className="page-container destination-page about-page">
      <PageIntro
        eyebrow="About this project"
        title="A useful place, made for the web."
        lead="NoCharge is a growing destination for browser games, static app and release showcases, practical online tools, guides, and discovery."
        breadcrumb={[{ label: 'About' }]}
        status={false}
      />
      <section className="about-statement" aria-label="About NoCharge and this foundation phase">
        <div className="about-statement__badge">IN THE MAKING <span>✳</span></div>
        <p>NoCharge is still growing. Published content is organized by purpose, and publisher app pages remain static showcases rather than local versions of those apps.</p>
      </section>
      <section className="section-spacing" aria-labelledby="about-destinations-title">
        <SectionHeading id="about-destinations-title" eyebrow="What NoCharge is being built to offer" title="Five clear places to start." />
        <div className="about-plan-list">
          {plans.map((item, index) => (
            <div className="about-plan" key={item.title}>
              <span className="about-plan__number">0{index + 1}</span>
              <span className="about-plan__icon"><DestinationGlyph kind={item.icon} /></span>
              <div><h3>{item.title}</h3><p>{item.note}</p></div>
              <span className="about-plan__state">Planned</span>
            </div>
          ))}
        </div>
      </section>
      <section className="about-bottom section-spacing">
        <div><p className="eyebrow">A note about the current phase</p><h2>Nothing here is pretending to be finished.</h2></div>
        <div><p>App and release pages distinguish publisher information from NoCharge tools and games. The Privacy and Terms pages describe this website; app-specific policies are separate.</p><Link to="/contact/" className="text-link">Accessibility barrier reports: limited contact details <span aria-hidden="true">→</span></Link></div>
      </section>
    </div>
  );
}
