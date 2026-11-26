import { Link } from 'react-router';
import { footerNavigation } from '../siteNavigation';
import { Brand } from './Brand';
import { ArrowIcon } from './Icons';

const exploreLinks = [
  { label: 'Arcade', to: '/arcade/' },
  { label: 'App Experiences', to: '/experiences/' },
  { label: 'Tools', to: '/tools/' },
  { label: 'Guides', to: '/guides/' },
  { label: 'Discover', to: '/discover/' },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand-block">
          <Brand footer />
          <p>A fresh home for play, practical tools and things worth exploring.</p>
          <Link className="footer-note-link" to="/about/">What we’re building <ArrowIcon /></Link>
        </div>
        <div className="site-footer__link-group">
          <h2>Explore</h2>
          <ul>{exploreLinks.map((link) => <li key={link.to}><Link to={link.to}>{link.label}</Link></li>)}</ul>
        </div>
        <div className="site-footer__link-group">
          <h2>NoCharge</h2>
          <ul>{footerNavigation.map((link) => <li key={link.to}><Link to={link.to}>{link.label}</Link></li>)}</ul>
        </div>
        <div className="site-footer__closing">
          <span className="footer-sticker" aria-hidden="true">CURIOUS<br />BY NATURE</span>
          <p>The foundation is here.<br />The good stuff comes next.</p>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© NoCharge</span>
        <span>Built for the next good click.</span>
        <a href="#top" className="back-to-top">Back to top <span aria-hidden="true">↑</span></a>
      </div>
    </footer>
  );
}
