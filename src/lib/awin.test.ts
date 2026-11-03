import { describe, expect, it } from 'vitest';

import {
  AWIN_REL,
  AwinLinkError,
  assertAwinLabel,
  awinDisclosureLines,
  buildAwinHref,
  isAttributableAwinHref,
} from './awin';

const PID = '3025417';
const MID = '12345';

describe('buildAwinHref', () => {
  it('builds an awin1 click URL with the publisher, merchant and encoded destination', () => {
    const { href } = buildAwinHref({
      destination: 'https://www.brkox.com/products/lighting-kit?colour=warm',
      publisherId: PID,
      merchantId: MID,
      clickref: 'setup-bias-light',
    });

    const url = new URL(href);
    expect(url.hostname).toBe('www.awin1.com');
    expect(url.pathname).toBe('/cread.php');
    expect(url.searchParams.get('awinaffid')).toBe(PID);
    expect(url.searchParams.get('awinmid')).toBe(MID);
    expect(url.searchParams.get('clickref')).toBe('setup-bias-light');
    // The merchant URL survives a round trip, query string included.
    expect(url.searchParams.get('ued')).toBe('https://www.brkox.com/products/lighting-kit?colour=warm');
  });

  it('omits clickref when not supplied', () => {
    const { href } = buildAwinHref({ destination: 'https://www.brkox.com/x', publisherId: PID, merchantId: MID });
    expect(new URL(href).searchParams.has('clickref')).toBe(false);
  });

  it('rejects a non-numeric publisher id', () => {
    expect(() => buildAwinHref({ destination: 'https://www.brkox.com/x', publisherId: 'pub-3025417', merchantId: MID }))
      .toThrow(AwinLinkError);
  });

  it('rejects a non-numeric merchant id', () => {
    expect(() => buildAwinHref({ destination: 'https://www.brkox.com/x', publisherId: PID, merchantId: 'brkox' }))
      .toThrow(/MID/);
  });

  it('rejects a relative or non-https destination', () => {
    expect(() => buildAwinHref({ destination: '/x', publisherId: PID, merchantId: MID })).toThrow(/absolute/);
    expect(() => buildAwinHref({ destination: 'http://www.brkox.com/x', publisherId: PID, merchantId: MID })).toThrow(/https/);
  });

  it('rejects a clickref that Awin reports cannot use', () => {
    for (const bad of ['has space', 'emoji-🙂', 'a'.repeat(65), '']) {
      expect(() => buildAwinHref({ destination: 'https://www.brkox.com/x', publisherId: PID, merchantId: MID, clickref: bad }))
        .toThrow(AwinLinkError);
    }
  });
});

describe('isAttributableAwinHref', () => {
  const merchantDomains = ['brkox.com', 'www.brkox.com'];

  it('accepts our own cread link for the right publisher and merchant', () => {
    const { href } = buildAwinHref({ destination: 'https://www.brkox.com/x', publisherId: PID, merchantId: MID });
    expect(isAttributableAwinHref(href, { publisherId: PID, merchantId: MID, merchantDomains })).toBe(true);
  });

  it('rejects a cread link for another advertiser or publisher', () => {
    const { href } = buildAwinHref({ destination: 'https://www.brkox.com/x', publisherId: PID, merchantId: MID });
    expect(isAttributableAwinHref(href, { publisherId: '999999', merchantId: MID, merchantDomains })).toBe(false);
    expect(isAttributableAwinHref(href, { publisherId: PID, merchantId: '99999', merchantDomains })).toBe(false);
  });

  it('accepts a direct merchant URL only on an allowlisted domain', () => {
    expect(isAttributableAwinHref('https://www.brkox.com/x', { publisherId: PID, merchantId: MID, merchantDomains })).toBe(true);
    expect(isAttributableAwinHref('https://evil.example/x', { publisherId: PID, merchantId: MID, merchantDomains })).toBe(false);
  });

  it('rejects plain http and garbage', () => {
    expect(isAttributableAwinHref('http://www.brkox.com/x', { publisherId: PID, merchantId: MID, merchantDomains })).toBe(false);
    expect(isAttributableAwinHref('not a url', { publisherId: PID, merchantId: MID, merchantDomains })).toBe(false);
  });
});

describe('assertAwinLabel', () => {
  it('accepts a label that identifies itself as a paid link', () => {
    expect(() => assertAwinLabel('brkox LEGO lighting kit (paid link)')).not.toThrow();
  });

  it('requires the "(paid link)" marker', () => {
    expect(() => assertAwinLabel('brkox LEGO lighting kit')).toThrow(/must identify itself/);
  });

  it('rejects price, deal, stock, rating and superlative claims', () => {
    const labels = [
      'Cheapest lighting kit (paid link)',
      'brkox kit 20% off (paid link)',
      'brkox kit in stock (paid link)',
      '5 star lighting kit (paid link)',
      'Best lighting kit (paid link)',
    ];
    for (const label of labels) {
      expect(() => assertAwinLabel(label), label).toThrow(AwinLinkError);
    }
  });

  it('rejects an empty label', () => {
    expect(() => assertAwinLabel('   ')).toThrow();
  });
});

describe('disclosure contract', () => {
  it('states the Awin relationship and keeps the required Amazon statement', () => {
    const lines = awinDisclosureLines(PID);
    expect(lines.join(' ')).toContain('Awin');
    expect(lines.join(' ')).toContain('As an Amazon Associate I earn from qualifying purchases.');
  });

  it('requires sponsored nofollow noopener noreferrer, in that complete set', () => {
    expect(AWIN_REL.split(' ').sort()).toEqual(['nofollow', 'noopener', 'noreferrer', 'sponsored']);
  });
});
