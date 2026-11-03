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
   * Awin affiliate program master switch. Off unless exactly 'true'.
   *
   * Off (the shipped default) means: no MasterTag request, no Awin link, no
   * Awin CSP widening, and no "recommended gear" module. The components stay in
   * the repository so the program can be switched on without a code change.
   * See docs/AWIN_INTEGRATION.md.
   */
  readonly PUBLIC_AWIN_ENABLED?: string;
  /** Awin advertiser id (MID) for brkox. Numeric, from Awin → Advertisers. */
  readonly PUBLIC_AWIN_MID_BRKOX?: string;
  /** Awin advertiser id (MID) for Shenzhen Cangyu Technology. */
  readonly PUBLIC_AWIN_MID_CANGYU?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
