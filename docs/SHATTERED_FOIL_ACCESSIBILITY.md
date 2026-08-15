# Shattered Foil accessibility verification

Automated Playwright/axe coverage scans the entry and each of the five active mode boards. Browser tests exercise keyboard activation, visible focus, invalid-move announcements, left-handed mode, four-color suits, consent layering, and mobile layout. Card controls expose rank, suit, color, face state, pile context, and selection state. Drag is optional.

Manual assistive-technology applications are not installed in the CI/sandbox environment. NVDA/Firefox, VoiceOver/Safari and iOS, and TalkBack/Android remain owner-device verification items before production release; this is an environment limitation, not a hidden feature deferral. The implementation retains native buttons, landmarks, live regions, reduced motion, responsive overflow, and sound-independent state for those tests.
