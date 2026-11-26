/**
 * Future analytics seam. No provider is configured and nothing is sent in this
 * build. A privacy-reviewed adapter can be attached later without coupling page
 * components to a vendor SDK.
 */
export type NoChargeEvent =
  | { type: 'game_engagement'; action: 'start' | 'complete' | 'pause'; contentId: string }
  | { type: 'tool_usage'; toolId: string; action: 'use' }
  | { type: 'experience_engagement'; experienceId: string; action: 'start' | 'complete' }
  | { type: 'guide_engagement'; guideId: string; action: 'open' | 'complete' }
  | { type: 'google_play_outbound_click'; experienceId: string }
  | { type: 'shop_outbound_click'; destination: 'square-online'; brandSlug?: string; storeId?: string };

export type OutboundClickEvent = Extract<NoChargeEvent, { type: 'google_play_outbound_click' | 'shop_outbound_click' }>;

export interface AnalyticsAdapter {
  track(event: NoChargeEvent): void;
}

declare global {
  interface Window {
    __NOCHARGE_ANALYTICS__?: AnalyticsAdapter;
  }
}

export function trackNoChargeEvent(event: NoChargeEvent): void {
  if (typeof window === 'undefined') return;
  window.__NOCHARGE_ANALYTICS__?.track(event);
}

/** Outbound events stay inactive until a privacy-reviewed adapter is explicitly configured. */
export function trackOutboundClick(event: OutboundClickEvent): void {
  trackNoChargeEvent(event);
}
