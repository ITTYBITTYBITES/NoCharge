/**
 * StateSerializer — Encode/decode bowl state to/from URL hash.
 * Compact Base64 payload for shareable URLs and iframe embeds.
 */

/**
 * @typedef {{ x: number, y: number, freq: number, profile: 'bronze' | 'quartz' }} BowlState
 */

/**
 * Encode a list of bowl states into a compact Base64 URL hash.
 * Each bowl is packed as 8 bytes:
 *   - x: uint16 (0–65535, normalized to canvas width)
 *   - y: uint16 (0–65535, normalized to canvas height)
 *   - freq: uint16 (mapped from 100–880 Hz)
 *   - profile: uint8 (0=bronze, 1=quartz)
 *   - reserved: uint8
 *
 * @param {BowlState[]} bowls
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {string}
 */
export function encodeState(bowls, canvasWidth, canvasHeight) {
  const bytes = new Uint8Array(bowls.length * 8);
  const view = new DataView(bytes.buffer);

  for (let i = 0; i < bowls.length; i++) {
    const bowl = bowls[i];
    const offset = i * 8;
    const nx = Math.round(Math.max(0, Math.min(1, bowl.x / canvasWidth)) * 65535);
    const ny = Math.round(Math.max(0, Math.min(1, bowl.y / canvasHeight)) * 65535);
    const freqNorm = Math.round(
      Math.max(0, Math.min(1, (bowl.freq - 100) / 780)) * 65535
    );
    const profileByte = bowl.profile === 'quartz' ? 1 : 0;

    view.setUint16(offset, nx, false);
    view.setUint16(offset + 2, ny, false);
    view.setUint16(offset + 4, freqNorm, false);
    view.setUint16(offset + 6, profileByte, false);
  }

  // URL-safe Base64 encoding
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return base64;
}

/**
 * Decode a URL hash payload back into bowl states.
 * @param {string} hash - Base64 encoded string (with or without leading #)
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {BowlState[]}
 */
export function decodeState(hash, canvasWidth, canvasHeight) {
  const cleaned = hash.replace(/^#/, '');
  if (!cleaned) return [];

  try {
    // Restore standard Base64 padding
    let base64 = cleaned.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const view = new DataView(bytes.buffer);
    const bowlCount = Math.floor(bytes.length / 8);
    const bowls = [];

    for (let i = 0; i < bowlCount; i++) {
      const offset = i * 8;
      if (offset + 8 > bytes.length) break;

      const nx = view.getUint16(offset, false);
      const ny = view.getUint16(offset + 2, false);
      const freqNorm = view.getUint16(offset + 4, false);
      const profileByte = view.getUint16(offset + 6, false);

      bowls.push({
        x: (nx / 65535) * canvasWidth,
        y: (ny / 65535) * canvasHeight,
        freq: Math.round(100 + (freqNorm / 65535) * 780),
        profile: profileByte === 1 ? 'quartz' : 'bronze',
      });
    }

    return bowls;
  } catch {
    return [];
  }
}

/**
 * Update the browser URL hash without navigating.
 * @param {BowlState[]} bowls
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 */
export function pushStateToHash(bowls, canvasWidth, canvasHeight) {
  const encoded = encodeState(bowls, canvasWidth, canvasHeight);
  const newHash = encoded ? `#${encoded}` : '';
  if (window.location.hash !== newHash) {
    history.replaceState(null, '', newHash || window.location.pathname + window.location.search);
  }
}

/**
 * Read bowl states from the current URL hash.
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {BowlState[]}
 */
export function readStateFromHash(canvasWidth, canvasHeight) {
  return decodeState(window.location.hash, canvasWidth, canvasHeight);
}

/**
 * Generate an embed iframe snippet.
 * @param {BowlState[]} bowls
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @param {string} [baseUrl] - Origin for the embed URL
 * @returns {string} HTML string for an iframe embed
 */
export function generateEmbedCode(bowls, canvasWidth, canvasHeight, baseUrl) {
  const origin = baseUrl || `${window.location.origin}`;
  const encoded = encodeState(bowls, canvasWidth, canvasHeight);
  const hashPart = encoded ? `#${encoded}` : '';
  const embedUrl = `${origin}/embed/sound-engine/${hashPart}`;

  return `<iframe src="${embedUrl}" width="600" height="400" title="NoCharge Singing Bowl Engine" sandbox="allow-scripts allow-same-origin" style="border:0;border-radius:12px;"></iframe>`;
}
