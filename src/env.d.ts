/// <reference types="astro/client" />

interface ImportMetaEnv {
  /**
   * Master switch for the Google AdSense banner. Off unless exactly 'true'.
   *
   * Off (the shipped default) means: no banner, no ad placeholder, no AdSense
   * tag, no Google Privacy & messaging tag, no footer ad-choices control. The
   * implementation stays in the repository so it can be switched back on
   * without a code change. See docs/ADVERTISING_STATE.md.
   */
  readonly PUBLIC_ADSENSE_ENABLED?: string;
  /**
   * Lab advertising is configured entirely through the environment so no
   * publisher or placement id is ever committed to the repository.
   *
   * Nothing loads — and nothing is rendered at all, including the reserved ad
   * containers and their "Advertisement" labels — unless
   * PUBLIC_ADSTERRA_ENABLED is exactly 'true'. That keeps the default build free
   * of third-party requests, which is what the `third-party: 0` performance
   * budget on the calm site is protecting.
   */
  readonly PUBLIC_ADSTERRA_ENABLED?: string;
  /** 320×50 mobile banner placement key. */
  readonly PUBLIC_ADSTERRA_KEY_MOBILE?: string;
  /** 728×90 leaderboard placement key. */
  readonly PUBLIC_ADSTERRA_KEY_LEADERBOARD?: string;
  /** 300×600 or 160×600 side-rail placement key. */
  readonly PUBLIC_ADSTERRA_KEY_RAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
