import { describe, expect, it } from 'vitest';

import { PrivacyAwareErrorReporter, routeTemplate, sanitizeError } from './error-monitoring';

describe('privacy-aware error reporting', () => {
  it('does not report before analytics consent and reports after consent', () => {
    const reports: unknown[] = [];
    const reporter = new PrivacyAwareErrorReporter({
      release: 'test-release',
      getRoute: () => '/games/memory-match/',
      send: (report) => reports.push(report),
    });

    expect(reporter.report(new Error('before consent'), 'https://nocharge.test')).toBe(false);
    expect(reports).toHaveLength(0);

    reporter.setAnalyticsConsent(true);
    expect(reporter.report(new Error('after consent'), 'https://nocharge.test')).toBe(true);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      description: 'Error: client error',
      routeTemplate: '/games/[slug]/',
      release: 'test-release',
    });
  });

  it('does not send queries, fragments, or user-entered game text', () => {
    const error = new Error('selected word: secret-path?token=private#fragment');
    error.stack = [
      'Error: selected word: secret-path?token=private#fragment',
      '  at game (https://nocharge.test/assets/game.js?token=private#fragment)',
      '  at vendor (https://third-party.test/trace.js?visitor=private)',
    ].join('\n');

    const sanitized = sanitizeError(error, 'https://nocharge.test');
    expect(sanitized.description).toBe('Error: client error');
    expect(sanitized.description).not.toContain('secret-path');
    expect(sanitized.description).not.toContain('token');
    expect(sanitized.stack).toContain('https://nocharge.test/assets/game.js');
    expect(sanitized.stack).not.toContain('?');
    expect(sanitized.stack).not.toContain('#');
    expect(sanitized.stack).not.toContain('third-party');
  });

  it('rate-limits repeated errors and sanitizes rejected promise reasons', () => {
    const reports: unknown[] = [];
    let now = 100;
    const reporter = new PrivacyAwareErrorReporter({
      release: 'test-release',
      now: () => now,
      maxReports: 2,
      windowMs: 1_000,
      send: (report) => reports.push(report),
    });
    reporter.setAnalyticsConsent(true);

    const rejection = { name: 'UnhandledRejection', message: 'card selection: private cards' };
    expect(reporter.report(rejection, 'https://nocharge.test')).toBe(true);
    expect(reporter.report(rejection, 'https://nocharge.test')).toBe(true);
    expect(reporter.report(rejection, 'https://nocharge.test')).toBe(false);
    expect(reports).toHaveLength(2);
    expect(JSON.stringify(reports)).not.toContain('private cards');

    now += 1_001;
    expect(reporter.report(rejection, 'https://nocharge.test')).toBe(true);
  });

  it('uses public route templates instead of arbitrary URLs', () => {
    expect(routeTemplate('/articles/how-diagonal-letter-paths-work/?secret=yes#read')).toBe('/articles/[slug]/');
    expect(routeTemplate('/unrecognised/private-route/')).toBe('/other/');
    expect(routeTemplate('/privacy/')).toBe('/privacy/');
  });
});
