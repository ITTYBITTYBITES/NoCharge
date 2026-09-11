/// <reference types="astro/client" />

interface ImportMetaEnv {
  /**
   * Lab advertising is configured entirely through the environment so no
   * publisher or placement id is ever committed to the repository.
   *
   * Nothing loads unless PUBLIC_ADSTERRA_ENABLED is exactly 'true'. That keeps
   * the default build free of third-party requests, which is what the
   * `third-party: 0` performance budget on the calm site is protecting.
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
