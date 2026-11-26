/**
 * Central monetization policy for NOCHARGE V2.
 * Environment settings are read and validated, but Phase 6A keeps a hard
 * activation/network kill switch. Nothing in this module loads a provider or
 * makes a third-party request, even if future-intent variables are present.
 */
export interface MonetizationEnvironment {
  VITE_ADSENSE_CLIENT_ID?: string;
  VITE_ADS_ENABLED?: string;
  VITE_H5_ADS_ENABLED?: string;
}

export interface MonetizationConfig {
  /** Hard-coded Phase 6A activation gate; do not enable in this phase. */
  enabled: false;
  /** Hard-coded Phase 6A network gate; do not enable in this phase. */
  networkRequestsAllowed: false;
  adsense: Readonly<{
    enabled: false;
    requestedEnabled: boolean;
    publisherIdValid: boolean;
  }>;
  h5GamesAds: Readonly<{
    enabled: false;
    requestedEnabled: boolean;
  }>;
}

function envFlag(value: string | undefined): boolean {
  return value?.trim().toLocaleLowerCase() === 'true';
}

/**
 * Parse future activation intent while always returning the locked Phase 6A
 * runtime config. The publisher ID is validated but deliberately never
 * exported, rendered, or used to construct a provider URL.
 */
export function createMonetizationConfig(environment: MonetizationEnvironment): MonetizationConfig {
  const publisherId = environment.VITE_ADSENSE_CLIENT_ID?.trim() ?? '';
  const publisherIdValid = /^ca-pub-\d{16}$/u.test(publisherId);
  return Object.freeze({
    enabled: false,
    networkRequestsAllowed: false,
    adsense: Object.freeze({
      enabled: false,
      requestedEnabled: envFlag(environment.VITE_ADS_ENABLED),
      publisherIdValid,
    }),
    h5GamesAds: Object.freeze({
      enabled: false,
      requestedEnabled: envFlag(environment.VITE_H5_ADS_ENABLED),
    }),
  });
}

export const MONETIZATION_CONFIG = createMonetizationConfig(import.meta.env);

export type AdPageType =
  | 'home'
  | 'arcade-hub'
  | 'experiences-hub'
  | 'tools-hub'
  | 'guides-hub'
  | 'discover'
  | 'arcade-detail'
  | 'experience-detail'
  | 'tools-detail'
  | 'guides-detail';

export type AdSlotZone =
  | 'page-footer'
  | 'directory-footer'
  | 'arcade-companion-banner'
  | 'experience-after-interaction'
  | 'post-documentation-footer'
  | 'mid-editorial';

export interface AdSlotLayout {
  pageType: AdPageType;
  zone: AdSlotZone;
  desktopMinHeight: number;
  mobileMinHeight: number;
  sizeClass: 'compact' | 'editorial' | 'game-companion';
}

/**
 * Reserved dimensions are present even while the visual placeholder is hidden.
 * Desktop is the 1440px QA target; mobile is the 390px QA target.
 */
export const AD_SLOT_LAYOUTS = {
  'home-footer': { pageType: 'home', zone: 'page-footer', desktopMinHeight: 90, mobileMinHeight: 100, sizeClass: 'compact' },
  'arcade-hub-footer': { pageType: 'arcade-hub', zone: 'directory-footer', desktopMinHeight: 90, mobileMinHeight: 100, sizeClass: 'compact' },
  'experiences-hub-footer': { pageType: 'experiences-hub', zone: 'directory-footer', desktopMinHeight: 90, mobileMinHeight: 100, sizeClass: 'compact' },
  'tools-hub-footer': { pageType: 'tools-hub', zone: 'directory-footer', desktopMinHeight: 90, mobileMinHeight: 100, sizeClass: 'compact' },
  'guides-hub-footer': { pageType: 'guides-hub', zone: 'directory-footer', desktopMinHeight: 90, mobileMinHeight: 100, sizeClass: 'compact' },
  'discover-footer': { pageType: 'discover', zone: 'directory-footer', desktopMinHeight: 90, mobileMinHeight: 100, sizeClass: 'compact' },
  'arcade-detail-companion': { pageType: 'arcade-detail', zone: 'arcade-companion-banner', desktopMinHeight: 120, mobileMinHeight: 100, sizeClass: 'game-companion' },
  'experience-detail-after-interaction': { pageType: 'experience-detail', zone: 'experience-after-interaction', desktopMinHeight: 120, mobileMinHeight: 100, sizeClass: 'game-companion' },
  'tools-detail-post-documentation': { pageType: 'tools-detail', zone: 'post-documentation-footer', desktopMinHeight: 280, mobileMinHeight: 250, sizeClass: 'editorial' },
  'guides-detail-mid-editorial': { pageType: 'guides-detail', zone: 'mid-editorial', desktopMinHeight: 280, mobileMinHeight: 250, sizeClass: 'editorial' },
} as const satisfies Record<string, AdSlotLayout>;

export type AdSlotId = keyof typeof AD_SLOT_LAYOUTS;
export type AdSlotStatus = 'active' | 'inactive';

export function getAdSlotStatus(config: MonetizationConfig = MONETIZATION_CONFIG): AdSlotStatus {
  return config.enabled
    && config.networkRequestsAllowed
    && config.adsense.enabled
    ? 'active'
    : 'inactive';
}

export interface GameAdEligibility {
  contentId: string;
  contentType: 'game' | 'tool' | 'guide' | 'experience' | 'shop';
  published: boolean;
  h5AdsEligible: boolean;
}

export type H5GameBreakType = 'preroll' | 'next' | 'reward';

export interface H5GameAdBreakResult {
  status: 'inactive';
  type: H5GameBreakType;
}

export interface H5GameAdCallbacks {
  /** Pause gameplay and mute audio synchronously immediately before an actual ad. */
  onBeforeAd?: () => void;
  /** Restore the previous pause/audio state after an actual ad ends. */
  onAfterAd?: () => void;
  /** A dismissed rewarded ad must not grant the game reward. */
  onAdDismissed?: () => void;
  /** Always advance a preroll caller; it also runs when this adapter is inactive. */
  onBreakDone?: (result: H5GameAdBreakResult) => void;
}

export interface H5GameAdBreakRequest extends H5GameAdCallbacks {
  type: H5GameBreakType;
  name?: string;
}

export interface H5GamesAdsAdapter {
  init(context: GameAdEligibility): Promise<{ status: 'inactive' }>;
  requestBreak(request: H5GameAdBreakRequest): Promise<H5GameAdBreakResult>;
  /** Provider lifecycle entry points; all are inert until separately activated. */
  onBeforeAd(): void;
  onAfterAd(): void;
  onAdDismissed(): void;
}

export const H5_GAMES_ADS_ENABLED = MONETIZATION_CONFIG.enabled
  && MONETIZATION_CONFIG.networkRequestsAllowed
  && MONETIZATION_CONFIG.h5GamesAds.enabled;

export function canInitializeH5GamesAds(context: GameAdEligibility): boolean {
  return H5_GAMES_ADS_ENABLED
    && MONETIZATION_CONFIG.networkRequestsAllowed
    && context.contentType === 'game'
    && context.published
    && context.h5AdsEligible;
}

/**
 * Dormant, typed H5 lifecycle seam. The inactive adapter never pauses or mutes
 * a game and never requests a break; it resolves immediately so the game can
 * continue. Lifecycle callbacks are reserved for a reviewed future provider.
 */
export const h5GamesAdsAdapter: H5GamesAdsAdapter = Object.freeze({
  init(_context: GameAdEligibility): Promise<{ status: 'inactive' }> {
    return Promise.resolve({ status: 'inactive' });
  },
  requestBreak(request: H5GameAdBreakRequest): Promise<H5GameAdBreakResult> {
    const result: H5GameAdBreakResult = { status: 'inactive', type: request.type };
    return Promise.resolve().then(() => {
      request.onBreakDone?.(result);
      return result;
    });
  },
  onBeforeAd() {
    // No ad is running, so gameplay must never be paused or muted here.
  },
  onAfterAd() {
    // No ad is running, so there is no game state to restore here.
  },
  onAdDismissed() {
    // No rewarded ad is running, so a dismissal cannot grant game progress.
  },
});

/** Backwards-compatible named entry point; this remains a safe inactive no-op. */
export function initializeH5GamesAds(context: GameAdEligibility): Promise<{ status: 'inactive' }> {
  return h5GamesAdsAdapter.init(context);
}
