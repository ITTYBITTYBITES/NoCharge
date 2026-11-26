import { useEffect } from 'react';
import type { PageSEO } from '../site';

function setMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function updatePageSEO(seo: PageSEO): void {
  document.title = seo.title;
  setMeta('name', 'description', seo.description);
  setMeta('name', 'robots', seo.robots);
  setMeta('property', 'og:title', seo.title);
  setMeta('property', 'og:description', seo.description);
  setMeta('name', 'twitter:title', seo.title);
  setMeta('name', 'twitter:description', seo.description);

  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (seo.canonical) {
    const link = canonical ?? document.createElement('link');
    link.rel = 'canonical';
    link.href = seo.canonical;
    if (!canonical) document.head.appendChild(link);
    setMeta('property', 'og:url', seo.canonical);
  } else {
    canonical?.remove();
    document.head.querySelector('meta[property="og:url"]')?.remove();
  }

  const structuredData = document.getElementById('structured-data');
  if (seo.structuredData) {
    const script = structuredData ?? document.createElement('script');
    script.id = 'structured-data';
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(seo.structuredData).split('<').join(String.fromCharCode(92) + 'u003c');
    if (!structuredData) document.head.appendChild(script);
  } else {
    structuredData?.remove();
  }
}

export function usePageSEO(seo: PageSEO | null): void {
  useEffect(() => {
    if (seo) updatePageSEO(seo);
  }, [seo?.title, seo?.description, seo?.robots, seo?.canonical, seo?.structuredData]);
}
