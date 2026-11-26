import type { CSSProperties } from 'react';
import { AD_SLOT_LAYOUTS, getAdSlotStatus, MONETIZATION_CONFIG } from '../integrations/advertising';
import type { AdSlotId } from '../integrations/advertising';

export function AdSlot({ slotId }: { slotId: AdSlotId }) {
  const layout = AD_SLOT_LAYOUTS[slotId];
  const status = getAdSlotStatus();
  const dimensions = {
    '--ad-slot-height-desktop': `${layout.desktopMinHeight}px`,
    '--ad-slot-height-mobile': `${layout.mobileMinHeight}px`,
  } as CSSProperties;

  return (
    <aside
      className={`ad-slot ad-slot--${layout.sizeClass} ad-slot--${slotId}`}
      role="complementary"
      aria-label="Advertisement"
      aria-hidden={status === 'inactive'}
      data-ad-slot={slotId}
      data-ad-zone={layout.zone}
      data-ad-page-type={layout.pageType}
      data-ad-status={status}
      data-ad-enabled={String(status === 'active')}
      data-ad-network-requests={String(status === 'active' && MONETIZATION_CONFIG.networkRequestsAllowed)}
      data-ad-label="Advertisement"
      style={dimensions}
    >
      <span className="ad-slot__label" aria-hidden="true">Advertisements</span>
    </aside>
  );
}
