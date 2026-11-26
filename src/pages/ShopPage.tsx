import { PageIntro } from '../components/Primitives';

/** Direct route retained for compatibility; the store destination is hidden. */
export function ShopPage() {
  return (
    <div className="page-container destination-page shop-page" data-shop-status="hidden">
      <PageIntro
        eyebrow="Unavailable"
        title="Shop"
        lead="The NoCharge store is unavailable. No listings, external store links, or checkout are offered here."
        status={false}
      />
      <section className="section-spacing shop-unavailable" aria-labelledby="shop-unavailable-title">
        <h2 id="shop-unavailable-title">No store destination is available</h2>
        <p>This route remains directly accessible, but there is no store handoff or commerce content on this page.</p>
      </section>
    </div>
  );
}
