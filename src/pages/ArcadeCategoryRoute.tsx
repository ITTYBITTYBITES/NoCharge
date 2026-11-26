import { useParams } from 'react-router';
import { getPublishedBySection } from '../content/registry';
import { SectionLandingTemplate } from '../templates/SectionLandingTemplate';
import { NotFoundPage } from './NotFoundPage';

function categorySlug(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

export function ArcadeCategoryRoute() {
  const { slug } = useParams();
  const category = getPublishedBySection('arcade').map((entry) => entry.category).find((value) => categorySlug(value) === slug);
  if (!category) return <NotFoundPage />;
  return <SectionLandingTemplate section="arcade" initialCategory={category} />;
}
