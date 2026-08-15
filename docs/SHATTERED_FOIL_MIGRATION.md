# Shattered Foil storage migration

NoCharge uses IndexedDB database `nocharge-shattered-foil`, schema version 1. The database stores no consent data.

The previous `ittybittybites.github.io` deployment is a different origin, so NoCharge cannot read its localStorage or IndexedDB. The inspected original currently stores audio/privacy preferences but does not expose a complete game-data export. PR #7 therefore starts a new local profile and provides versioned JSON export/import for future NoCharge transfers.

The importer accepts only `{ format: "nocharge-shattered-foil", version: 1 }`, validates session records, and rejects malformed or unknown versions. The legacy NoCharge localStorage key `nocharge:shattered-foil:v1` is migrated once into IndexedDB and removed. Adding export to the old deployment requires a separate change to that repository; no cross-origin bridge or hidden tracking channel is introduced here.
