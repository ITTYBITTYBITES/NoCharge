export type AppLegalSlug = 'coosjoint' | 'twosecondwitness' | 'profivue' | 'rideside';
export type AppLegalKind = 'privacy' | 'terms';

export interface AppLegalSection {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
  table?: {
    headers: readonly string[];
    rows: readonly (readonly string[])[];
  };
  links?: readonly { label: string; href: string }[];
}

export interface AppLegalRecord {
  slug: AppLegalSlug;
  appName: string;
  publisher: string;
  lastUpdated: string;
  status: 'source-provided' | 'publisher-draft';
  sourceUrls: Readonly<Record<AppLegalKind, string>>;
  policies?: Readonly<Partial<Record<AppLegalKind, readonly AppLegalSection[]>>>;
}

const rawSource = 'https://raw.githubusercontent.com/ITTYBITTYBITES/privacy-policy/main';

export const appLegalRecords: Readonly<Record<AppLegalSlug, AppLegalRecord>> = {
  coosjoint: {
    slug: 'coosjoint',
    appName: "Coo's Joint — Idle Coffee Syndicate",
    publisher: 'ITTYBITTYBITES',
    lastUpdated: 'November 26, 2026',
    status: 'source-provided',
    sourceUrls: {
      privacy: `${rawSource}/cooscafe/index.html`,
      terms: `${rawSource}/cooscafe/terms.html`,
    },
    policies: {
      privacy: [
        {
          heading: '1. Overview and local-first storage',
          paragraphs: [
            "Coo's Joint — Idle Coffee Syndicate is a single-player Android idle café game published by ITTYBITTYBITES. Core progression is saved locally on your device inside the app's private storage area (user://coos_joint_save_v1.json).",
          ],
          items: [
            'Local game save — Star Beans and other in-game currencies, café ownership, managers, upgrades, settings, statistics, story/progression flags, and save timestamps.',
            'No player account or publisher cloud-save database — the game does not send your local save file to an ITTYBITTYBITES server.',
            'Deleting local data — use the in-game reset option, clear the app’s storage in Android settings, or uninstall the app. Android system backup behavior depends on your device settings.',
          ],
        },
        {
          heading: '2. Advertising — Google AdMob',
          paragraphs: [
            'The game may offer optional, user-initiated rewarded video advertisements served through Google Mobile Ads (AdMob). You choose whether to start a rewarded-ad flow; ads are never required to play.',
          ],
          items: [
            'When ads are enabled and requested, Google Mobile Ads and its ad partners may automatically collect or process device identifiers (such as the Android Advertising ID or App Set ID), IP address (used to estimate general location), ad interactions, and diagnostic signals for ad delivery, measurement, security, and fraud prevention.',
            'You can reset or delete your Android Advertising ID and limit ad personalization at any time in Android Settings → Privacy → Ads.',
            'Users in the European Economic Area (EEA), the UK, and other regulated regions are presented with applicable consent choices before personalized ads are served.',
          ],
          links: [
            { label: "Google's Privacy Policy", href: 'https://policies.google.com/privacy' },
            { label: 'Google Mobile Ads Android Data Disclosure', href: 'https://developers.google.com/admob/android/privacy/play-data-disclosure' },
          ],
        },
        {
          heading: '3. In-app purchases — Google Play Billing',
          paragraphs: [
            'The current Android release does not require real-money purchases or subscriptions, and all in-game currencies have no cash value. If optional in-app purchases are offered in a future release, all payments and refunds are processed exclusively by Google Play. ITTYBITTYBITES never sees, receives, or stores your payment card or billing details.',
          ],
          links: [
            { label: 'Google Payments Privacy Notice', href: 'https://payments.google.com/payments/apis-secure/get_legal_document?ldo=0&ldt=privacynotice' },
          ],
        },
        {
          heading: '4. What the Game does NOT collect',
          items: [
            'No account registration, sign-in, or email collection inside the game.',
            'No access to your contacts, photos, camera, microphone, or precise GPS location.',
            'No chat, social network, or user-to-user messaging features.',
            'No separate gameplay-analytics or telemetry SDK operated by ITTYBITTYBITES.',
            'No sale of personal information by ITTYBITTYBITES.',
          ],
        },
        {
          heading: '5. Device permissions',
          table: {
            headers: ['Permission', 'Why'],
            rows: [
              ['Internet', 'Required to request optional Google AdMob rewarded ads and connect with Google Play services.'],
              ['Advertising ID (AD_ID)', 'Used by Google Mobile Ads for ad delivery, measurement, and honoring Android ad-personalization controls.'],
            ],
          },
        },
        {
          heading: '6. Audience and children’s privacy',
          paragraphs: [
            "Coo's Joint — Idle Coffee Syndicate is intended for adults aged 18 and older and is not directed to children. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has sent personal information via email, contact us at hello@nocharge.net so we can promptly review and remove it.",
          ],
        },
        {
          heading: '7. Support messages, retention, and your choices',
          items: [
            'Clear local game progress at any time using the in-game reset control, Android app-storage settings, or by uninstalling the app.',
            'If you email support, we use your email address and message only to respond, troubleshoot, and maintain required security records; please do not send passwords or payment details.',
            'Manage ad personalization and Advertising ID preferences in your Android device settings or in-app consent controls where available.',
          ],
        },
        {
          heading: '8. Changes to this policy',
          paragraphs: [
            'We may update this Privacy Policy when the game, third-party SDKs, or legal requirements change. Updates are published at https://nocharge.net/privacy/coosjoint/ with a revised “Last updated” date.',
          ],
        },
        {
          heading: '9. Contact',
          paragraphs: [
            'Publisher: ITTYBITTYBITES',
            'Email: hello@nocharge.net',
            'Official app page: https://nocharge.net/experiences/coosjoint/',
          ],
        },
      ],
      terms: [
        {
          heading: '1. Agreement and eligibility',
          paragraphs: [
            "These Terms of Service (“Terms”) are between you and ITTYBITTYBITES (“Publisher,” “we,” “us,” or “our”) and govern your use of the Android game Coo's Joint — Idle Coffee Syndicate (“Game”). By installing or using the Game, you agree to these Terms. The Game is intended for adults aged 18 and older. These Terms supplement, and do not replace, the Google Play Terms of Service or mandatory consumer rights under applicable law.",
          ],
        },
        {
          heading: '2. Limited license',
          paragraphs: [
            'Subject to these Terms and Google Play’s terms, we grant you a personal, limited, non-exclusive, non-transferable, revocable license to install and play the Game on Android devices you own or control for personal, non-commercial entertainment. The Game is licensed, not sold.',
          ],
        },
        {
          heading: '3. Intellectual property',
          paragraphs: [
            "All code, artwork, audio, stylized bird-noir characters, dialogue, UI, and the ITTYBITTYBITES and Coo's Joint marks are owned by ITTYBITTYBITES or its licensors and protected by intellectual-property laws. Third-party engines, fonts, and SDKs remain subject to their respective licenses.",
          ],
        },
        {
          heading: '4. Gameplay, local saves, and virtual items',
          paragraphs: [
            'The Game is a single-player idle café game that stores progress locally on your device (user://coos_joint_save_v1.json). We do not operate a player-account or cloud-save server; local progress may be lost if you clear app storage, uninstall the Game, or change devices.',
            'Star Beans, Breadcrumbs, Feathers, and other in-game currencies or unlocks are virtual gameplay items only. They have no monetary value, cannot be exchanged for real money or goods, and cannot be traded or sold outside the Game. If a future update introduces optional paid items through Google Play Billing, Google Play’s billing and refund policies apply.',
          ],
        },
        {
          heading: '5. Advertising and third-party services',
          paragraphs: [
            'The Game may display optional rewarded video advertisements provided by Google AdMob. In-game bonuses are granted only after a completed ad view as reported by the ad network; ad availability is not guaranteed. We do not endorse third-party advertised products or services.',
          ],
        },
        {
          heading: '6. Acceptable use',
          paragraphs: ['You agree not to:'],
          items: [
            'modify, decompile, or reverse-engineer the Game except where expressly permitted by applicable law;',
            'tamper with rewarded-ad callbacks, manipulate in-game currencies, or use automated exploits;',
            'redistribute, sell, rent, or commercially exploit the Game or its assets without written permission; or',
            'remove or obscure copyright, trademark, or proprietary notices.',
          ],
        },
        {
          heading: '7. Updates, availability, and termination',
          paragraphs: [
            'We may update, rebalance, suspend, or discontinue features of the Game at any time. You may stop using the Game at any time by uninstalling it. We may revoke your license if you materially breach these Terms. Sections covering intellectual property, disclaimers, and limitation of liability survive termination.',
          ],
        },
        {
          heading: '8. Disclaimer and limitation of liability',
          paragraphs: [
            'To the maximum extent permitted by applicable law, the Game is provided “as is” and “as available” without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, or uninterrupted availability. To the maximum extent permitted by law, ITTYBITTYBITES is not liable for indirect, incidental, special, or consequential damages, or loss of local save data. Nothing in these Terms excludes or limits any warranty or statutory consumer right that cannot legally be waived.',
          ],
        },
        {
          heading: '9. Changes to these Terms',
          paragraphs: [
            'We may update these Terms from time to time. The current version is published at https://nocharge.net/terms/coosjoint/ with an updated date. Continued use of the Game after updated Terms are posted constitutes acceptance.',
          ],
        },
        {
          heading: '10. Contact',
          paragraphs: [
            'Publisher: ITTYBITTYBITES',
            'Email: hello@nocharge.net',
            'Official app page: https://nocharge.net/experiences/coosjoint/',
            'These Terms are separate from — and do not replace — the Google Play Terms of Service or the Coo’s Joint Privacy Policy.',
          ],
        },
      ],
    },
  },
  twosecondwitness: {
    slug: 'twosecondwitness',
    appName: 'The 2-Second Witness',
    publisher: 'ITTYBITTYBITES',
    lastUpdated: 'September 1, 2026',
    status: 'source-provided',
    sourceUrls: {
      privacy: `${rawSource}/index.html`,
      terms: `${rawSource}/terms/index.html`,
    },
    policies: {
      privacy: [
        {
          heading: '1. Information the Game stores — on your device only',
          paragraphs: [
            "The Game saves your progress in local files inside the app's private storage on your device:",
          ],
          items: [
            'Game progress — experience points, rank, statistics (runs, best depth, best streak), per-world mastery, daily-challenge state, and settings.',
            'Unlocks — which optional worlds you have unlocked.',
            "Entitlements — whether Director's Access or a Season Pass is active on this device.",
          ],
        },
        {
          heading: '2. Advertising — Google AdMob',
          paragraphs: [
            'The Game shows ads through Google AdMob (banner and rewarded video ads):',
          ],
          items: [
            "Google and its partners may collect identifiers and device information when ads are shown — including the advertising ID — and may use that data as described in Google's Privacy Policy.",
            'You can reset or delete your advertising ID in your Android settings at any time, and limit ad personalization there too.',
            "If you purchase Director's Access or an active Season Pass, the Game stops requesting banner ads on its own screens. (Rewarded ads remain available only when you choose to watch them for a bonus.)",
            'Users in the European Economic Area, the UK, and other regulated regions are shown a consent choice before personalized ads are served.',
          ],
          links: [{ label: "Google's Privacy Policy", href: 'https://policies.google.com/privacy' }],
        },
        {
          heading: '3. Purchases — Google Play Billing',
          paragraphs: [
            'All purchases (Director\'s Access — one-time; Season Pass — time-limited) are processed entirely by Google Play. We never see, receive, or store your payment card, billing address, or transaction details. Google\'s handling of payment information is described in the Google Payments Privacy Notice. Purchase entitlements are stored locally (see section 1) and can be restored with the “Restore Purchases” option in the Game\'s store.',
          ],
          links: [{ label: 'Google Payments Privacy Notice', href: 'https://payments.google.com/payments/apis-secure/get_legal_document?ldo=0&ldt=privacynotice' }],
        },
        {
          heading: '4. What the Game does NOT do',
          items: [
            'No account creation, sign-in, or email collection.',
            'No location, contacts, photos, microphone, or camera access.',
            'No social features, chat, or user-to-user communication.',
            'No analytics or crash-reporting SDKs run by us.',
            'No selling or sharing of personal information by us — we have nothing to sell.',
          ],
        },
        {
          heading: '5. Device permissions',
          table: {
            headers: ['Permission', 'Why'],
            rows: [
              ['Internet', 'Required to load ads and connect to Google Play Billing.'],
              ['Advertising ID (AD_ID)', 'Lets AdMob serve (and let you limit) relevant ads.'],
              ['Vibrate', 'Optional haptic feedback on answers (system-controlled).'],
            ],
          },
        },
        {
          heading: '6. Children',
          paragraphs: [
            "The Game is a memory arcade game and does not collect personal information from anyone, including children. It contains no chat, no user-generated content, and no direct contact features. Ad content is delivered by Google AdMob under Google's Play Families policies where applicable.",
          ],
        },
        {
          heading: '7. Your choices',
          items: [
            'Delete all Game data: uninstall the app or clear its storage in Android settings.',
            'Limit ad personalization: reset/delete your advertising ID or opt out of ads personalization in Android settings.',
            'Ads-supported play: rewarded ads are always optional — the Game never requires watching one to progress.',
          ],
        },
        {
          heading: '8. Changes to this policy',
          paragraphs: [
            'If this policy changes, the updated version will be published at this address and the in-game agreement screen will always link to the current version.',
          ],
        },
        {
          heading: '9. Contact',
          paragraphs: ['Email: hello@nocharge.net'],
        },
      ],
      terms: [
        {
          heading: '1. License',
          paragraphs: [
            'We grant you a personal, non-exclusive, non-transferable, revocable license to install and play the Game on devices you own or control, for personal, non-commercial use. The Game is licensed to you, not sold.',
          ],
        },
        {
          heading: '2. Your account with Google',
          paragraphs: [
            'The Game uses no accounts of its own. Downloads, purchases, and refunds are handled through your Google account under the Google Play Terms of Service.',
          ],
        },
        {
          heading: '3. In-app purchases',
          paragraphs: [
            "Director's Access — a one-time purchase that permanently removes the need to unlock worlds via ads and hides banner ads on this Google Play account.",
            'Season Pass — a time-limited entitlement (90 days from activation) with the same benefits plus doubled experience rewards while active.',
            'All pricing, payment, and refunds are processed by Google Play under Google\'s policies; we do not handle payments and cannot issue refunds ourselves. In-game currency values (XP), unlocks, and progress have no monetary value, cannot be traded, and cannot be exchanged for money. Purchases are tied to your Google Play account and restore on reinstall via “Restore Purchases” in the Game\'s store.',
          ],
        },
        {
          heading: '4. Advertising',
          paragraphs: [
            'The Game displays third-party advertisements (Google AdMob), including optional rewarded videos that grant in-game bonuses. Bonus rewards are granted only after a complete ad view as reported by the ad provider; if an ad fails to load, no reward is owed. We do not endorse anything advertised.',
          ],
        },
        {
          heading: '5. Acceptable use',
          paragraphs: ['You agree not to:'],
          items: [
            'modify, decompile, or reverse-engineer the Game (except where law permits);',
            'circumvent purchase or ad systems;',
            'use bots, exploits, or automated play; or',
            'redistribute the Game or its assets without permission.',
          ],
        },
        {
          heading: '6. Intellectual property',
          paragraphs: [
            'All content in the Game — code, art, audio, fonts, names, and the ITTYBITTYBITES and The 2-Second Witness marks — is owned by us or our licensors and is protected by intellectual-property laws.',
          ],
        },
        {
          heading: '7. Availability',
          paragraphs: [
            'The Game is provided “as is” and “as available.” We may update, change, suspend, or discontinue any part of it at any time. Local progress could be lost if you uninstall the Game or clear its data; keeping backups of your device is your responsibility.',
          ],
        },
        {
          heading: '8. Disclaimer and limitation of liability',
          paragraphs: [
            'To the maximum extent permitted by law, the Game is provided without warranties of any kind, express or implied, including fitness for a particular purpose. We are not liable for indirect, incidental, or consequential damages. Where law does not allow exclusion of certain warranties or limits, this section applies to the maximum extent allowed, and nothing in these Terms affects statutory consumer rights you may have.',
          ],
        },
        {
          heading: '9. Termination',
          paragraphs: ['We may revoke your license if you breach these Terms. Sections 6, 8, and 10 survive termination.'],
        },
        {
          heading: '10. Changes to these Terms',
          paragraphs: ['Updated Terms will be published at this address; the in-game agreement screen always links to the current version. Material changes take effect when published.'],
        },
        {
          heading: '11. Contact',
          paragraphs: [
            'Email: hello@nocharge.net',
            'These Terms are separate from — and do not replace — the Google Play Terms of Service or our Privacy Policy.',
          ],
        },
      ],
    },
  },
  profivue: {
    slug: 'profivue',
    appName: 'ProfiVue',
    publisher: 'ITTYBITTYBITES',
    lastUpdated: 'November 26, 2026',
    status: 'source-provided',
    sourceUrls: {
      privacy: `${rawSource}/profivue/index.html`,
      terms: `${rawSource}/profivue/terms.html`,
    },
    policies: {
      privacy: [
        {
          heading: '1. Information Collection and Use',
          paragraphs: ['ProfiVue is designed to respect your privacy. No player or user account is required, and your app data is stored locally on your device.'],
          items: [
            "Local Data: Your calculation history and custom marketplace profiles are stored strictly on your device's local database. We do not have access to this data.",
            'Advertising Data: We use Google AdMob to serve ads. AdMob may collect and use your Advertising ID for personalizing ads. You can manage this in your Android device settings.',
          ],
        },
        {
          heading: '2. Data Safety',
          paragraphs: [
            'We do not collect, transmit, or share any personal information with third parties, except for the automated data collected by Google AdMob for advertising purposes.',
          ],
        },
        {
          heading: '3. Third-Party Services',
          paragraphs: ['Our app uses Google Play Services and AdMob. Please refer to their privacy policies:'],
          links: [{ label: 'Google Privacy & Terms', href: 'https://policies.google.com/privacy' }],
        },
        {
          heading: '4. Your Choices and Local Data Deletion',
          items: [
            'Delete all local app data at any time by clearing ProfiVue storage in Android settings or uninstalling the application.',
            'Reset or delete your Android Advertising ID and opt out of ad personalization in Android Settings → Privacy → Ads.',
          ],
        },
        {
          heading: '5. Contact',
          paragraphs: [
            'Publisher: ITTYBITTYBITES (Itty Bitty Bites)',
            'Email: hello@nocharge.net',
            'Official app page: https://nocharge.net/experiences/profivue/',
          ],
        },
      ],
      terms: [
        {
          heading: '1. Acceptance of Terms',
          paragraphs: ['By installing or using ProfiVue, you agree to these terms. If you do not agree, do not use the application.'],
        },
        {
          heading: '2. Use of Service',
          paragraphs: [
            'ProfiVue is a financial calculator intended for estimation purposes only. While we strive for accuracy, we do not guarantee the results. You are responsible for verifying all fees, taxes, and shipping costs directly with the relevant marketplace.',
          ],
        },
        {
          heading: '3. Monetization & Ads',
          paragraphs: [
            'The app is free to use and supported by advertisements. You may have the option to watch “Rewarded Videos” to unlock premium features for a limited time. These ads are served by third-party networks.',
          ],
        },
        {
          heading: '4. Limitation of Liability',
          paragraphs: [
            'ITTYBITTYBITES (Itty Bitty Bites) is not liable for any financial losses, incorrect pricing decisions, or business damages resulting from the use of this application.',
          ],
        },
        {
          heading: '5. Changes to Terms',
          paragraphs: ['We reserve the right to modify these terms at any time. Your continued use of the app signifies acceptance of updated terms.'],
        },
        {
          heading: '6. Contact',
          paragraphs: [
            'Publisher: ITTYBITTYBITES (Itty Bitty Bites)',
            'Email: hello@nocharge.net',
            'Official app page: https://nocharge.net/experiences/profivue/',
          ],
        },
      ],
    },
  },
  rideside: {
    slug: 'rideside',
    appName: 'RideSide: Jet Ski & PWC Checklist',
    publisher: 'ITTYBITTYBITES',
    lastUpdated: 'August 1, 2026',
    status: 'source-provided',
    sourceUrls: {
      privacy: `${rawSource}/rideside/index.html`,
      terms: `${rawSource}/rideside/terms.html`,
    },
    policies: {
      privacy: [
        {
          heading: '1. No Personal Information Collected',
          paragraphs: [
            'The App does not collect, transmit, or share any of your personally identifiable information. We have no backend servers, and we do not maintain profiles online. We do not collect or request access to:',
          ],
          items: [
            'Your name, email address, phone number, or billing information.',
            'Your contacts, microphone, photos, or system accounts.',
          ],
        },
        {
          heading: '2. Offline Local Storage Only',
          paragraphs: [
            'All data you input remains local on your device. The App writes metadata straight to lightweight local files inside your device’s secure private sandbox:',
          ],
          items: [
            'Watercraft profile registries (Name, Type, Manufacturer, Model, Year, Notes).',
            'Trip checklists, custom items, and category structures.',
            'Launch location markers and notes.',
            'Optional expense logs associated with checklists.',
          ],
        },
        {
          heading: '3. Location Services & Map Navigation Handoff',
          paragraphs: [
            'In accordance with our privacy core values, RideSide does not collect your GPS locations or track your ride routes. When you select a saved launch location to get directions, the App hands off the destination address or coordinate markers directly to your device’s native navigation application (such as Google Maps or Waze) via Android System Intents.',
          ],
        },
        {
          heading: '4. Third-Party Services (Advertising)',
          paragraphs: [
            'To keep the application free, the App displays non-intrusive banner ads on the Home and History screens, and optional video ads to unlock PDF exports and memory card visual overlays. These are served by Google AdMob. AdMob may utilize your device’s advertising identifier (AD_ID) to display ads. You can disable, reset, or block this identifier at any time inside your Android system settings (Settings → Privacy → Ads).',
          ],
        },
        {
          heading: '5. Children’s Privacy',
          paragraphs: [
            'RideSide is a utility application designed for adult PWC and recreational boat operators. We do not knowingly collect or request personal information from children under 13.',
          ],
        },
        {
          heading: '6. Changes to This Privacy Policy',
          paragraphs: ['We may update our Privacy Policy from time to time. We will post any changes on this page and update the “Last updated” date at the top of the policy.'],
        },
        {
          heading: '7. Contact Us',
          paragraphs: ['If you have any questions or concerns regarding this Privacy Policy, please contact us at ittybittybitesgames@gmail.com.'],
        },
      ],
      terms: [
        {
          heading: '1. Agreement to Terms',
          paragraphs: ['By downloading, installing, or using the App, you agree to be bound by these Terms. If you do not agree to these Terms, please immediately delete and uninstall the App from your device.'],
        },
        {
          heading: '2. Use of the App & Licence',
          paragraphs: [
            'We grant you a limited, non-exclusive, non-transferable, and revocable license to use the App on your mobile device for your personal, non-commercial recreational planning purposes only. You agree not to copy, reverse-engineer, decompile, or modify any portion of the App’s compiled source code.',
          ],
        },
        {
          heading: '3. Disclaimer of Liability & Assumption of Risk',
          paragraphs: [
            'You explicitly understand and agree that marine sports and personal watercraft operation carry inherent hazards. RideSide is provided on an “as-is” and “as-available” basis. Under no circumstances shall ITTYBITTYBITES or its developers be held liable for any damages, injury, accidents, loss of life, or equipment failures that occur before, during, or after watercraft operation. You assume full personal responsibility for:',
          ],
          items: [
            'Checking and verifying that all local safety gear (e.g. Life Jackets, Flares, Fire Extinguishers) is operational.',
            'Inspecting your vehicle, trailer, tow hitches, and watercraft drain plugs.',
            'Adhering to maritime pilot regulations, speed limits, and navigational charts.',
          ],
        },
        {
          heading: '4. Data & Standalone Storage',
          paragraphs: [
            'Because RideSide is offline-first, we do not monitor, sync, or back up your data to any cloud storage. You are solely responsible for exporting and backing up your watercraft, trip histories, and expense logs. We are not responsible for any local data loss resulting from device damage, OS updates, or app uninstallation.',
          ],
        },
        {
          heading: '5. Advertising & Premium Features',
          paragraphs: [
            'The App displays standard advertisements served by Google AdMob. Optional visual memory exports are unlocked by watching rewarded video advertisements. You agree not to block, tamper with, or manipulate ad display codes within the App.',
          ],
        },
        {
          heading: '6. Termination',
          paragraphs: ['We reserve the right to terminate or suspend your access to the App at any time, without prior notice, if we believe you are violating these Terms or engaging in illegal behavior.'],
        },
        {
          heading: '7. Governing Law',
          paragraphs: ['These Terms shall be governed by and construed in accordance with the laws of the jurisdiction of the developer (ITTYBITTYBITES), without regard to its conflict of law provisions.'],
        },
        {
          heading: '8. Contact Us',
          paragraphs: ['If you have any questions or feedback regarding these Terms, please contact us at ittybittybitesgames@gmail.com.'],
        },
      ],
    },
  },
};

export const APP_LEGAL_SLUGS = Object.keys(appLegalRecords) as AppLegalSlug[];

export function getAppLegalRecord(slug: string | undefined): AppLegalRecord | undefined {
  if (!slug || !Object.hasOwn(appLegalRecords, slug)) return undefined;
  return appLegalRecords[slug as AppLegalSlug];
}
