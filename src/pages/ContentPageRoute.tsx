import { useParams } from 'react-router';
import { getPublishedBySlug } from '../content/registry';
import type { ContentSection } from '../content/schemas';
import { DetailPageTemplate } from '../templates/DetailPageTemplate';
import { NotFoundPage } from './NotFoundPage';

export function ContentPageRoute({ section }: { section: ContentSection }) {
  const { slug } = useParams();
  const entry = getPublishedBySlug(section, slug ?? '');
  if (!entry) return <NotFoundPage />;
  return <DetailPageTemplate entry={entry} />;
}
