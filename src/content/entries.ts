import type { GuideArticle, ToolItem } from './schemas';

export const toolEntries: readonly ToolItem[] = [
  {
    id: 'tool-word-counter',
    slug: 'word-counter',
    status: 'published',
    title: 'Word Counter',
    summary: 'Measure words, characters, punctuation-ended sentences, and a rough reading time while you write. The browser does the counting in this page; your text is not submitted or saved.',
    section: 'tools',
    kind: 'tool',
    category: 'Writing',
    tags: ['writing', 'word count', 'text', 'local processing'],
    featured: true,
    publishedAt: '2026-11-16',
    updatedAt: '2026-11-16',
    seo: {
      title: 'Word Counter — count words and characters locally | NoCharge Tools',
      description: 'Count words, Unicode code points, punctuation-marked sentences, and estimated reading time in a browser tool that keeps the text in the current page.',
    },
    relatedSlugs: ['json-workbench', 'a-local-first-workflow-for-browser-tools'],
    moduleId: 'word-counter',
    moduleLoader: () => import('../modules/tools/WordCounter'),
    instructions: 'Type or paste prose into the editor to update its counts immediately. The calculations use only the text currently in the field; this module does not submit or save it. Clear the editor before leaving if you do not want the text visible in the open page.',
    controls: [
      'Type or paste into the labeled text area; counts recalculate as the value changes.',
      'Read the word, character, sentence, and reading-time totals in the statistics panel.',
      'Choose Clear text to remove the current value from this page.',
    ],
    howItWorks: [
      'A word is a run of Unicode letters or digits. An apostrophe inside a run stays with that word, so a contraction such as “we’re” counts once; a hyphen separates two runs. Punctuation by itself is not a word, and multiple spaces or line breaks do not create extra words. This is a practical editorial convention rather than a dictionary-specific definition.',
      'The character total counts Unicode code points, not bytes, UTF-16 storage units, or what a person perceives as one visual symbol. The second character total removes every character that JavaScript recognizes as whitespace before counting. A combined emoji can contain several code points, so its visible appearance may not correspond to its character total.',
      'Sentence counting looks for groups of period, question-mark, or exclamation-mark punctuation that end before whitespace or the end of the input. If text contains words but no such ending mark, it is treated as one unfinished sentence. Abbreviations, initials, and decimal points can make punctuation-based counts differ from a human editor’s interpretation.',
      'Reading time is a planning estimate at two hundred words per minute. The tool rounds a non-empty result up to a whole minute and shows at least one minute. It does not know the reader, the complexity of the writing, or whether a person will pause to study a diagram or reread a paragraph.',
    ],
    workedExample: {
      scenario: 'A short line contains a contraction, a hyphenated compound, uneven spacing, and a final question mark.',
      input: 'We’re testing this browser counter. Does it work?',
      steps: [
        'The letter-and-digit rule finds eight word runs; the apostrophe keeps “We’re” together.',
        'The period and question mark each close one sentence group, so the sentence total is two.',
        'Spaces are removed only for the no-spaces character statistic; punctuation remains part of both character totals.',
      ],
      result: 'The panel reports eight words, two punctuation-ended sentences, and a one-minute reading estimate. Counts are estimates under the stated rules, not an editorial judgment about the text.',
    },
    pitfalls: [
      'A compound joined with a hyphen counts as two word runs, while a contraction with an internal apostrophe counts as one. Use the result that matches your publication’s own counting policy.',
      'A period in an abbreviation or decimal can be read as sentence-ending punctuation when it is followed by whitespace. Review the source text if a sentence limit has legal or editorial consequences.',
      'The character figure is a Unicode code-point count. Some emoji and accented letter sequences contain multiple code points even though they appear as one glyph on screen.',
      'The reading estimate assumes a fixed pace and does not account for headings, tables, specialist vocabulary, or pauses. Treat it as a rough planning aid rather than a promised duration.',
    ],
    faq: [
      {
        question: 'Does the counter send text to a server?',
        answer: 'No. The counting functions run in the open page and update from the editor value. This module makes no request with the entered text and does not write it to browser storage.',
      },
      {
        question: 'Why can my count differ from a word processor?',
        answer: 'Different products make different choices about hyphens, apostrophes, numbers, abbreviations, and language-specific segmentation. This page publishes its own counting convention so you can decide whether it fits your task.',
      },
      {
        question: 'Does Clear text erase a saved document?',
        answer: 'There is no saved document in this tool. Clear text empties only the current editor in the current page; it cannot remove a source file or content kept in another application.',
      },
    ],
  },
  {
    id: 'tool-json-workbench',
    slug: 'json-workbench',
    status: 'published',
    title: 'JSON Workbench',
    summary: 'Parse a JSON value in the browser, then produce readable or compact JSON with separate actions and a visible parser message when the input is invalid.',
    section: 'tools',
    kind: 'tool',
    category: 'Developer utilities',
    tags: ['json', 'formatting', 'validation', 'developer tools', 'local processing'],
    featured: false,
    publishedAt: '2026-11-16',
    updatedAt: '2026-11-16',
    seo: {
      title: 'JSON Workbench — validate and format JSON locally | NoCharge Tools',
      description: 'Parse a JSON value, format it with two-space indentation, or minify it in your browser. Input stays in this page and parser errors remain visible.',
    },
    relatedSlugs: ['word-counter', 'a-local-first-workflow-for-browser-tools'],
    moduleId: 'json-workbench',
    moduleLoader: () => import('../modules/tools/JsonWorkbench'),
    instructions: 'Paste a JSON value into the input and choose Format JSON or Minify JSON. Valid input is parsed and serialized into the result panel. When parsing fails, the source stays available for editing and the tool reports the browser parser’s message.',
    controls: [
      'Choose Format JSON to serialize a valid value with two spaces of indentation.',
      'Choose Minify JSON to remove optional whitespace from a valid value.',
      'Use Clear to remove the current input, result, and status message from the page.',
    ],
    howItWorks: [
      'The workbench calls the browser’s built-in JSON parser on the complete input. Standard JSON values include objects, arrays, strings, numbers, booleans, and null. The parser rejects JavaScript-only syntax such as comments, single-quoted strings, trailing commas, and unquoted property names because those are not JSON.',
      'If parsing succeeds, the tool serializes the resulting value again. The readable action uses two spaces per indentation level; the compact action asks the serializer to omit optional spacing. Both outputs represent the parsed data, rather than preserving the original line breaks, number spelling, or spacing choices.',
      'Serialization can normalize details that were present in the source. For example, insignificant whitespace is removed, escape sequences may be emitted in a different form, and object-key order follows JavaScript’s property-order rules. A repeated object key is not preserved as two independent fields after parsing; the browser value contains the property selected by its parser behavior.',
      'A parse error clears the result so an older valid output cannot be mistaken for the latest attempt. The source text remains in the editor, and the status reports the parser detail returned by the browser. Exact error wording can vary between browser engines, so use the location and message as a clue rather than a portable diagnostic format.',
      'All parsing and serialization happen in the page. There is no file upload, account, remote validator, or automatic save. Very large values still consume memory and run on the main thread, so a huge document may make the tab feel unresponsive even though it never leaves the browser.',
    ],
    workedExample: {
      scenario: 'A small object has the right JSON meaning but no spaces or line breaks, and you want a version that is easier to review.',
      input: '{"label":"North","active":true,"count":3}',
      steps: [
        'Choose Format JSON. The parser creates an object with a string, a boolean, and a number.',
        'The serializer writes those fields over several lines and indents each property by two spaces.',
        'Choose Minify JSON to generate a compact representation of the same parsed object.',
      ],
      result: 'The two outputs describe the same JSON value. If you replace the input with a trailing comma or a comment, parsing fails and the result area is cleared instead of showing stale output.',
    },
    pitfalls: [
      'JSON is stricter than JavaScript object-literal syntax. A browser console may accept a form that this parser correctly rejects as JSON.',
      'Formatting and minifying do not prove that a document follows an application-specific schema. A syntactically valid value can still have missing fields or the wrong types for another program.',
      'Re-serialization can change whitespace, escape spelling, and ordering details. Keep an untouched copy when byte-for-byte preservation or a digital signature matters.',
      'Parser message text is supplied by the browser engine and can change. Do not build automated tooling around the exact wording shown here.',
    ],
    faq: [
      {
        question: 'Can the workbench check a JSON schema?',
        answer: 'No. It checks whether the input can be parsed as JSON and then formats the resulting value. Schema validation requires a separate, known schema and is outside this tool’s behavior.',
      },
      {
        question: 'Can I use comments or a trailing comma?',
        answer: 'No. Those are common in some JavaScript configurations but are not part of standard JSON syntax. Remove them before formatting, or use a parser specifically designed for the extended format you have.',
      },
      {
        question: 'Is my input stored when I leave?',
        answer: 'The module keeps its working value in page state only. It does not save to local storage or send the JSON to a service. Clear the editor when you are finished if you want the visible value removed before closing the tab.',
      },
    ],
  },
  {
    id: 'tool-contrast-checker',
    slug: 'contrast-checker',
    status: 'published',
    title: 'Contrast Checker',
    summary: 'Calculate a WCAG 2.x contrast ratio for two opaque six-digit sRGB colors, then compare the result with text thresholds without treating a ratio as a full accessibility audit.',
    section: 'tools',
    kind: 'tool',
    category: 'Accessibility',
    tags: ['accessibility', 'contrast', 'color', 'wcag', 'design systems'],
    featured: true,
    publishedAt: '2026-11-16',
    updatedAt: '2026-11-16',
    seo: {
      title: 'Contrast Checker — calculate WCAG color ratios | NoCharge Tools',
      description: 'Compare two opaque six-digit sRGB colors with the WCAG 2.x contrast formula and view AA and AAA text thresholds in a local browser utility.',
    },
    relatedSlugs: ['a-practical-guide-to-interface-contrast', 'a-local-first-workflow-for-browser-tools'],
    moduleId: 'contrast-checker',
    moduleLoader: () => import('../modules/tools/ContrastChecker'),
    instructions: 'Choose a foreground and background color or enter each as a six-digit hex value. The tool computes the WCAG 2.x ratio from the two current colors and compares it with normal- and large-text thresholds. It does not inspect another page or certify a component.',
    controls: [
      'Use either color picker or the adjacent hex field to set the foreground color.',
      'Set the background color the same way; invalid text is reported rather than used.',
      'Read the ratio and AA/AAA text comparisons in the live result panel.',
      'Use Swap colors to reverse foreground and background; the ratio itself remains unchanged.',
    ],
    howItWorks: [
      'Each hex input must contain a hash sign followed by six hexadecimal digits, representing opaque red, green, and blue channels. The tool does not accept alpha transparency, shorthand notation, named colors, gradients, images, or a color profile embedded in an asset. A color picker writes the same six-digit representation as the text field.',
      'For each channel, the checker converts the encoded sRGB value into linear light. Values at or below 0.04045 are divided by 12.92; larger values use the standard power curve ((value + 0.055) / 1.055) raised to 2.4. The three channels are combined into relative luminance using weights 0.2126 for red, 0.7152 for green, and 0.0722 for blue.',
      'The higher luminance becomes the lighter color and the lower becomes the darker one. The ratio is (lighter + 0.05) divided by (darker + 0.05). The page makes its threshold decisions using the unrounded result, while the visible number is rounded to two decimal places. Swapping the two inputs does not change this ratio.',
      'The result compares WCAG 2.x text contrast thresholds: 4.5:1 for normal text at AA, 3:1 for large text at AA, 7:1 for normal text at AAA, and 4.5:1 for large text at AAA. The tool names the threshold category; it does not decide whether text qualifies as large or verify how that color is rendered in a real interface.',
      'The calculation takes place in the browser from the current input values. Nothing is uploaded, saved as a preference, or inspected from another site. A useful review still checks the actual rendered component in its real theme, state, size, and surrounding background.',
    ],
    workedExample: {
      scenario: 'Compare pure white text with a pure black background, the maximum separation in the standard sRGB range.',
      input: 'Foreground #FFFFFF; background #000000.',
      steps: [
        'White has relative luminance 1.0 and black has relative luminance 0.0.',
        'Add 0.05 to each luminance, then divide 1.05 by 0.05.',
        'Compare the unrounded ratio against the four text thresholds shown by the result panel.',
      ],
      result: 'The ratio is 21:1, so it exceeds the listed AA and AAA thresholds for both normal and large text. That arithmetic result applies only to these two opaque colors; it does not assess font rendering or the surrounding interface.',
    },
    pitfalls: [
      'A passing color pair does not prove that a complete page is accessible. Names, keyboard operation, focus visibility, layout, text sizing, and meaningful use of color need separate review.',
      'The formula assumes opaque sRGB colors. Alpha blending, gradients, background images, overlays, and antialiased glyph edges can change the effective colors seen on screen.',
      'Large-text thresholds apply only when text meets the applicable size and weight definition. A heading tag alone does not make its text large for the criterion.',
      'A high ratio cannot guarantee comfortable reading for every person or display. Use it as one measurable check, not as a personal readability verdict.',
    ],
    faq: [
      {
        question: 'Does this check a whole website automatically?',
        answer: 'No. The tool calculates the pair entered into its controls. To assess a page, identify the foreground and actual rendered background for each relevant text state, including surfaces and themes that change during interaction.',
      },
      {
        question: 'Why does the tool accept only six-digit hex?',
        answer: 'A six-digit value directly specifies opaque red, green, and blue sRGB channels, which keeps the calculation explicit. Transparency and layered colors require first resolving the final composite background, a step this utility does not perform.',
      },
      {
        question: 'Is the displayed ratio rounded before checking AA?',
        answer: 'No. The pass comparison uses the full computed ratio. Only the number shown in the interface is rounded to two decimal places, so a displayed boundary value can conceal a very small difference in the underlying result.',
      },
    ],
  },
];

export const guideArticles: readonly GuideArticle[] = [
  {
    id: 'guide-interface-contrast',
    slug: 'a-practical-guide-to-interface-contrast',
    status: 'published',
    title: 'A practical guide to checking interface contrast',
    summary: 'A repeatable workflow for checking text contrast in real components, themes, states, and layered backgrounds, with clear limits on what a ratio can prove.',
    section: 'guides',
    kind: 'guide',
    category: 'Accessible design',
    tags: ['accessibility', 'contrast', 'color', 'design systems', 'testing'],
    featured: true,
    publishedAt: '2026-11-16',
    updatedAt: '2026-11-16',
    seo: {
      title: 'A practical guide to checking interface contrast | NoCharge Guides',
      description: 'Review text contrast across interface themes, rendered states, translucent layers, and gradients with a repeatable workflow and honest limits.',
    },
    relatedSlugs: ['contrast-checker', 'a-local-first-workflow-for-browser-tools'],
    sections: [
      {
        heading: 'Begin with meaning, not the palette',
        paragraphs: [
          'A contrast review is easier to use when it starts with the words on a page instead of a spreadsheet of brand colors. Find the text that explains an action, identifies a field, reports an error, or tells someone what happened. Small labels and quiet captions can carry important meaning, so include them even when a design system calls them secondary.',
          'The WCAG 2.x contrast criterion compares text with its immediate background. For AA, normal-sized text uses a 4.5:1 minimum and qualifying large text uses 3:1. The AAA text levels are higher: 7:1 for normal text and 4.5:1 for large text. First establish which level and scope you are evaluating; do not quietly substitute a house preference for the criterion itself.',
          'Make an inventory of what is visible in a real task. Include field labels, instructions, validation messages, navigation, status badges, captions, and text inside controls. If a word is needed to understand a choice or result, it belongs in the review even when it appears only after an interaction.',
        ],
      },
      {
        heading: 'Understand what a ratio can and cannot say',
        paragraphs: [
          'The ratio is calculated from relative luminance, a measure of the light reflected or emitted by a color in the sRGB model. It ranges from 1:1 for equal luminance to 21:1 for black against white. Hue names alone are not enough: two colors can feel different while carrying nearly the same luminance, or appear similar while producing a useful separation.',
          'A calculation is only as good as the colors supplied to it. Opaque hex values are straightforward; a translucent foreground or background must first be composited in the order the browser displays it. A card on a tinted panel over an image can involve several layers. A gradient also contains a range of possible backgrounds, so inspect the least favorable point that can appear under the text.',
          'The ratio does not measure font shape, weight, antialiasing, visual crowding, or the comfort of every reader. It does not tell you whether text is meaningful, whether an icon is recognizable, or whether an action can be completed with a keyboard. Keep the numeric result in its lane and write down the other questions that need a separate check.',
        ],
      },
      {
        heading: 'Use a checker for the pair you actually see',
        paragraphs: [
          'A small calculator is a good first pass for a pair of opaque colors. Choose the foreground and the background directly behind the glyphs, not a nearby token that looks related. Compare the full result with the applicable threshold, then retain the exact pair and interface state in your notes so another person can reproduce the check.',
          'When a color token is used over several surfaces, check each combination or deliberately constrain the component to one verified surface. If a brand token appears in both light and dark themes, treat those as separate cases. A pair that passes on a cream card may fail when the card becomes transparent or the text changes to a muted role.',
          'If a calculator says the ratio passes but the words still seem difficult to find, do not stop at the number. Check whether the text is too small, thin, crowded, hidden by nearby decoration, or dependent on color alone. A successful contrast result answers one measurable question, not every question about perception.',
        ],
      },
      {
        heading: 'Walk through states and layouts',
        paragraphs: [
          'Review a component through the states people encounter: default, hover, focus, pressed, selected, disabled, loading, and error. Some states replace the background without changing the text color; others put the same text on a different layer. The keyboard focus outline needs its own consideration because a text ratio does not measure the outline against adjacent surfaces.',
          'Repeat the review at the widths where the layout changes. Text can wrap onto a banner, a caption can move below a tinted image, or an inline control can become a full-width button. Seasonal themes and user-selected display preferences can also alter color tokens. Capture the rendered view when a static token list cannot show which layers meet on screen.',
          'Prioritize the combinations that communicate action or state. A decorative illustration may have different requirements from a label that tells someone which choice is selected. Record why a text element is in scope rather than assuming that every pale pixel must be treated identically.',
        ],
      },
      {
        heading: 'Run a reproducible review',
        paragraphs: [
          'A written method makes a small design review easier to repeat after a component or theme changes. Scope the route, state, viewport, and display mode before calculating anything. Save the names of the roles and surfaces, not just raw color values, so the result remains useful when tokens are reorganized.',
        ],
        steps: [
          'List the pages, themes, viewport widths, and interaction states that the review covers.',
          'Identify meaningful text and the exact rendered surface immediately behind each line.',
          'Resolve transparency and layered backgrounds before entering an opaque pair into the calculator.',
          'Compare the unrounded ratio with the applicable text threshold and record the result with its context.',
          'Retest after changing a shared token, then inspect focus, reflow, and color-independent cues separately.',
        ],
      },
      {
        heading: 'Fix recurring causes instead of isolated symptoms',
        paragraphs: [
          'A repeated failure across many pages often points to a semantic token rather than a single screen. If secondary text is consistently too faint, update the role that names that text instead of adding slightly darker one-off values everywhere. A component-specific exception can still be right when it has a truly different background or meaning; document the reason so later edits do not undo it.',
          'A local fix should also preserve the rest of the interface. Darkening one label may create a new mismatch with its icon, hover state, or disabled treatment. Re-run the route and state matrix after changing a token because shared values can affect more pages than the one where the first issue appeared.',
          'Automated checks help prevent known color pairs from regressing, while manual review covers gradients, artwork, motion, and unusual compositing. Keep both: a screenshot can reveal an unexpected background, and a repeatable numeric check can confirm that a deliberate correction continues to meet its target.',
        ],
      },
      {
        heading: 'Report the result without overstating it',
        paragraphs: [
          'Describe what was measured, where it appeared, and which threshold applied. “The body-text token on the default panel measured 5.2:1 at the desktop state” is more useful than “the page is accessible.” The first statement can be checked and reproduced; the second implies a much broader review that one color pair cannot establish.',
          'If a pair falls short, record the problem and the next action in plain language. It may require a darker text token, a more solid surface, a different placement, or a non-color label. If a pair passes, keep the scope attached to the result and continue with keyboard operation, focus visibility, reflow, and other relevant checks.',
        ],
      },
    ],
  },
  {
    id: 'guide-local-browser-tools',
    slug: 'a-local-first-workflow-for-browser-tools',
    status: 'published',
    title: 'A local-first workflow for browser tools',
    summary: 'Choose browser utilities with clear data boundaries, limit what you enter, inspect the output, and finish with an intentional cleanup step.',
    section: 'guides',
    kind: 'guide',
    category: 'Privacy & everyday tools',
    tags: ['privacy', 'browser tools', 'local-first', 'data hygiene', 'workflow'],
    featured: true,
    publishedAt: '2026-11-16',
    updatedAt: '2026-11-16',
    seo: {
      title: 'A local-first workflow for browser tools | NoCharge Guides',
      description: 'Use browser utilities carefully by minimizing input, verifying processing and storage behavior, reviewing output, and clearing the working session.',
    },
    relatedSlugs: ['word-counter', 'json-workbench', 'contrast-checker'],
    sections: [
      {
        heading: 'Decide what the task really needs',
        paragraphs: [
          'Before opening a utility, describe the result you want in one sentence. A short word limit may need only the paragraph being edited; a JSON formatter needs only the value you intend to inspect. Starting with the task makes it easier to notice when a page asks for more material than the job requires.',
          'Reduce the input before you paste it. Replace personal names with neutral labels, remove access tokens and private identifiers, and keep only the rows or fields that explain the issue. A small, representative excerpt is often enough to test a method without exposing the full source.',
          'Some material should not go into a general-purpose browser form at all. Passwords, recovery phrases, private keys, session cookies, regulated records, and confidential customer data deserve a tool and process that have been specifically approved for that purpose. Convenience is not evidence that a destination is appropriate.',
        ],
      },
      {
        heading: 'Understand the page and the processing boundary',
        paragraphs: [
          'A web page can run its calculation in the browser while still downloading its own scripts, fonts, or images from a server. That ordinary page loading is different from sending the text you enter to a processing service. Look for a precise explanation of what stays in the page, what is stored, and whether any action transmits your input.',
          'A phrase such as “private” or “secure” does not explain a data flow by itself. Prefer concrete descriptions: which button performs a calculation, whether an account is involved, whether a result is retained, and where any upload goes. If those details matter and cannot be established, use harmless material or choose another workflow.',
          'For a task that is meant to stay local, you can verify the implementation or observe network activity in the browser developer tools. Check the relevant action, not only the initial page request, and pay attention to optional integrations. Local processing is a useful boundary, but it does not protect a document you later copy into a shared folder or message.',
        ],
      },
      {
        heading: 'Prefer one clear operation at a time',
        paragraphs: [
          'Choose a utility that explains what it changes and shows the result before you depend on it. A counter should name its counting convention; a formatter should distinguish parsing from schema validation; a contrast calculator should state which two colors its ratio uses. A visible result is easier to review than an unexplained one-click transformation.',
          'Separate inspection from commitment. Keep a copy of the source before editing a document, and compare the output with what you expected. A successful display does not prove a file is valid for the next program or that all important information survived serialization.',
          'Use the narrowest action that completes the job. If a page offers export, sync, or sharing, those controls create additional destinations and should be chosen deliberately. Do not assume a tool needs access to a clipboard, account, or file permission merely because the feature appears beside its main calculation.',
        ],
      },
      {
        heading: 'Handle results as carefully as inputs',
        paragraphs: [
          'A result can reveal as much as the original. A cleaned table may still include account numbers; a diagnostic message can quote a sensitive field; a URL can preserve a query value in browser history. Review what you plan to copy and share only the smallest result that helps the recipient.',
          'Keep an authoritative source somewhere you control before using a temporary browser result for an important decision. An open tab is not a backup, and a formatted output is not proof of correctness. If a tool produces a downloadable file, confirm its name and destination before you overwrite anything.',
          'When the result is meant for another application, check the receiving application’s expectations. JSON syntax can be valid while required fields are missing; a character count can follow a different convention from a publisher’s form. Carry forward the method along with the result when the distinction matters.',
        ],
      },
      {
        heading: 'Finish with a tidy session',
        paragraphs: [
          'Page-local input may remain visible until a tab closes or reloads, even when the tool does not retain it after the session. Clear the editor when the task ends, close the page when appropriate, and avoid putting private material into a URL. Browser history, copied links, screenshots, and shared devices are separate places where information can linger.',
          'A clear button usually empties a field in the open page; it cannot erase a file you copied from, an output saved elsewhere, or a browser backup. Use the right cleanup control for each destination and do not treat a page reset as a universal deletion operation.',
          'If you use a shared computer, review the browser profile and download location before leaving. Sign out of any service you intentionally used and follow the organization’s process for temporary files. The tool’s own description only covers its part of the workflow.',
        ],
      },
      {
        heading: 'A repeatable before-and-after checklist',
        paragraphs: [
          'A short routine is easier to follow than a promise to remember every risk. Use it for ordinary browser utilities, then add the requirements of your workplace or subject area whenever the data has higher stakes.',
        ],
        steps: [
          'Name the task and reduce the input to the smallest useful excerpt before opening the page.',
          'Read the processing, storage, and sharing explanation; do not infer behavior from the tool’s appearance.',
          'Keep a separate source copy, run one understandable operation, and inspect the output before relying on it.',
          'Check whether the result contains information that should not travel to its next destination.',
          'Clear the current field, close the page if appropriate, and clean up any separate downloads or copies.',
        ],
      },
      {
        heading: 'Know when local processing is not enough',
        paragraphs: [
          'Local-first describes where a particular calculation happens; it is not a general certification of privacy, security, accuracy, or suitability. The browser and device may be shared, compromised, backed up, or managed by an organization. A page can also include unrelated services that follow their own rules.',
          'For regulated work, business records, medical details, financial identifiers, or code containing credentials, use the approved system and consult the responsible policy owner. A convenient public utility should not replace a reviewed workflow. When in doubt, ask whether the input may be used there before testing with real data.',
          'The aim is not to avoid every online tool. It is to make each handoff visible, keep unnecessary material out of the page, and leave with a result you understand. That modest discipline makes everyday utilities easier to assess without claiming more protection than the workflow actually provides.',
        ],
      },
    ],
  },
];
