import { Link } from 'react-router';
import { BrandMark } from '../components/Brand';
import { ArrowIcon } from '../components/Icons';

export function NotFoundPage() {
  return (
    <div className="page-container not-found-page">
      <div className="not-found-page__art" aria-hidden="true"><BrandMark /><span>404</span><i>✳</i></div>
      <div className="not-found-page__copy">
        <p className="eyebrow">Wrong turn, right place</p>
        <h1>This page isn’t here.<br /><em>Yet, maybe.</em></h1>
        <p>The address may be out of date, or the page may have wandered off. NoCharge hasn’t published this page.</p>
        <div className="not-found-page__actions">
          <Link className="button button--primary" to="/">Back to NoCharge <ArrowIcon /></Link>
          <Link className="text-link" to="/discover/">Explore destinations</Link>
        </div>
      </div>
    </div>
  );
}
