import type { ReactNode } from 'react';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell" id="top">
      <SiteHeader />
      <main id="main-content" className="site-main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
