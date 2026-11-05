/**
 * Removed: responsive banner mounting for the Lab.
 *
 * The Lab carried reserved Adsterra slots until display advertising was retired
 * in favour of Awin affiliate links (docs/AWIN_INTEGRATION.md). Nothing mounts
 * now, so the module that chose a placement and injected a network tag is gone.
 *
 * What remains of the advertising work is the part still worth keeping and
 * still tested: `gates.ts` (suspending the loop, audio and input while *any*
 * full-screen interruption owns the screen) and `lifecycle.ts`. They are
 * network-agnostic and stay unit-tested.
 */
export {};
