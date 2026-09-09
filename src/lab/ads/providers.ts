/**
 * Vendor-agnostic ad provider contracts for the Lab section.
 *
 * These interfaces exist so the game runtime never imports a network SDK
 * directly. The lifecycle orchestrator (`./lifecycle.ts`) only ever talks to
 * this interface, which means:
 *
 *  - The loop, audio, and input suspension hooks are testable today with the
 *    `nullProvider`, before any network is chosen or approved.
 *  - Swapping Adsterra for another banner network, or adding a rewarded-video
 *    SDK, is a new file in `./providers/` and one line in the registry.
 *  - The calm Quiet Arcade keeps its single AdSense banner and never loads any
 *    of this code.
 *
 * Deliberately NOT modelled here: popunders, Smartlink/direct-link redirects,
 * auto-refresh, and anything that opens a top-level navigation. The main site
 * documents that it does not run those; the Lab inherits that commitment.
 */

export type BannerPlacement =
  /** 320×50 — mobile portrait and mobile landscape. */
  | 'mobile-banner'
  /** 728×90 — desktop and tablet, in-flow below the stage. */
  | 'leaderboard'
  /** 300×600 / 160×600 — desktop side rail only. */
  | 'side-rail';

export interface BannerSlotSpec {
  placement: BannerPlacement;
  /** Reserved so a late creative cannot shift layout (CLS budget is 0.1). */
  reserve: { width: number; height: number };
}

export interface BannerProvider {
  readonly id: string;
  /** Render into `container`. Rejects if the slot must stay empty. */
  mount(container: HTMLElement, spec: BannerSlotSpec): Promise<void>;
  destroy(): void;
}

export type RewardOutcome =
  /** The viewer completed the ad and the reward should be granted. */
  | { granted: true; placement: string }
  /** No reward. `reason` is safe to surface in the HUD. */
  | { granted: false; placement: string; reason: RewardDenial };

export type RewardDenial =
  | 'unavailable'
  | 'cancelled'
  | 'error'
  | 'consent-required';

export interface RewardedProvider {
  readonly id: string;
  /**
   * Pre-fetch creative. Returns true when a rewarded ad can be shown.
   *
   * Must be called before the prompt is rendered: a reward button that appears
   * and then fails is worse than no button at all, and rewarded ads have to be
   * user-initiated, so the offer must be truthful at the moment it is shown.
   */
  load(placement: string): Promise<boolean>;
  /**
   * Show the ad. The promise settles when the viewer closes it.
   *
   * Implementations must guarantee the ad is skippable or dismissible, and must
   * not require interaction to proceed. Refusing the ad must never block normal
   * use of the Lab.
   */
  show(placement: string): Promise<RewardOutcome>;
}

const noop = () => {};

/**
 * The default provider: resolves every load as unavailable.
 *
 * This is what ships. It keeps the Lab buildable, testable, and shippable while
 * the network decision is open, and it is the correct runtime behaviour for
 * visitors who have not consented or for whom no creative is available.
 */
export const nullBannerProvider: BannerProvider = {
  id: 'none',
  async mount() {
    /* Intentionally empty: the container keeps its reserved space. */
  },
  destroy: noop,
};

export const nullRewardedProvider: RewardedProvider = {
  id: 'none',
  async load() {
    return false;
  },
  async show(placement) {
    return { granted: false, placement, reason: 'unavailable' };
  },
};
