/**
 * Advertising consent gate for non-Google networks in the Lab.
 *
 * Why this exists and why it defaults to `false`:
 *
 * The calm site has no advertising consent flag of its own. Google's Privacy &
 * messaging platform is the consent mechanism for AdSense, and the official
 * AdSense tag reads those choices itself. That arrangement is documented on
 * `/advertising/` and asserted in `tests/e2e/consent.spec.ts`.
 *
 * A non-Google network is not covered by that. Google's consent message does
 * not produce consent for a third party, so loading one in the EEA without its
 * own basis is an open legal exposure — flagged in `AUDIT.md` and recorded as
 * step 9 of the build order in `docs/LAB_INTEGRATION_AUDIT.md`.
 *
 * Until that is resolved this gate returns false and **no third-party ad loads
 * anywhere on the site**. The slot still renders and reserves its space, so the
 * layout is final and testable; it is simply never filled.
 *
 * Resolving this properly means supplying a real resolver: a TCF-registered CMP
 * that lists the network as a vendor, or a documented legal basis for the
 * regions actually served.
 */

export type AdvertisingConsentResolver = () => boolean;

let resolver: AdvertisingConsentResolver = () => false;

export function setAdvertisingConsentResolver(next: AdvertisingConsentResolver): void {
  resolver = next;
}

/** True only when a real consent basis has been wired up and granted. */
export function hasAdvertisingConsent(): boolean {
  try {
    return resolver() === true;
  } catch {
    // A broken consent check must fail closed, never open.
    return false;
  }
}

/** Test-only reset. */
export function resetAdvertisingConsentForTests(): void {
  resolver = () => false;
}
