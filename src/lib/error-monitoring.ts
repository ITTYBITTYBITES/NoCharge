export type AnalyticsConsent = { analytics?: boolean };

type Gtag = (command: 'event', eventName: string, parameters: Record<string, unknown>) => void;

type ConsentApi = {
  get: () => AnalyticsConsent;
};

type BrowserWindow = Window & {
  gtag?: Gtag;
  NoChargeConsent?: ConsentApi;
};

export type SanitizedError = {
  description: string;
  stack?: string;
  fingerprint: string;
};

export type ErrorReport = SanitizedError & {
  routeTemplate: string;
  release: string;
  fatal: boolean;
};

export type ErrorReporterOptions = {
  release: string;
  now?: () => number;
  getRoute?: () => string;
  send?: (report: ErrorReport) => void;
  maxReports?: number;
  windowMs?: number;
};

const MESSAGE_LIMIT = 180;
const STACK_LIMIT = 600;
const STACK_LINES = 5;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REPORTS = 3;

function truncate(value: string, limit: number): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > limit ? `${compact.slice(0, Math.max(0, limit - 1))}…` : compact;
}

/** Removes query strings, fragments, quoted payloads, and explicit game data. */
export function sanitizeMessage(value: unknown): string {
  let message = String(value ?? '');
  message = message.replace(/https?:\/\/[^\s)]+/gi, '[url]');
  message = message.replace(/(?:\?|#)[^\s)]+/g, '');
  message = message.replace(/(["'`])[^\n"'`]{1,240}\1/g, '[redacted]');
  message = message.replace(
    /\b(?:word|selected\s*word|selection|card\s*selection|game\s*path|path|letter\s*path)\s*[:=]\s*[^,;\n]+/gi,
    '[redacted]',
  );
  return truncate(message, MESSAGE_LIMIT);
}

function errorName(value: unknown): string {
  if (value && typeof value === 'object' && 'name' in value && typeof value.name === 'string') {
    const name = value.name.replace(/[^A-Za-z0-9 _-]/g, '').trim();
    if (name) return truncate(name, 48);
  }
  return 'Error';
}

function errorMessage(value: unknown): string {
  if (value && typeof value === 'object' && 'message' in value) return sanitizeMessage(value.message);
  return sanitizeMessage(value);
}

function errorStack(value: unknown, origin?: string): string | undefined {
  if (!value || typeof value !== 'object' || !('stack' in value) || typeof value.stack !== 'string') return undefined;
  if (!origin) return undefined;

  const lines = value.stack
    .split('\n')
    .slice(1)
    .filter((line) => line.includes(origin))
    .map((line) =>
      line
        .replace(/https?:\/\/[^\s):]+(?:\/[^\s):?#]*)?(?:\?[^\s):#]*)?(?:#[^\s):]*)?/gi, (url) => {
          try {
            const parsed = new URL(url);
            return `${parsed.origin}${parsed.pathname}`;
          } catch {
            return '[url]';
          }
        }),
    )
    .map((line) => truncate(line, 180))
    .slice(0, STACK_LINES);

  const stack = truncate(lines.join('\n'), STACK_LIMIT);
  return stack || undefined;
}

function hash(value: string): string {
  // A short in-memory fingerprint is enough for rate limiting. The original
  // message is never persisted or sent as an analytics event parameter.
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

/**
 * Error text may contain form values or game selections. The analytics event
 * therefore uses a controlled category-only description. Sanitized/truncated
 * text only contributes to an in-memory rate-limit fingerprint and is never
 * put in local storage, IndexedDB, an event payload, or a URL.
 */
export function sanitizeError(value: unknown, origin?: string): SanitizedError {
  const name = errorName(value);
  const message = errorMessage(value);
  const stack = errorStack(value, origin);
  return {
    description: `${name}: client error`,
    ...(stack ? { stack } : {}),
    fingerprint: hash(`${name}\n${message}\n${stack ?? ''}`),
  };
}

/** Return a route shape instead of an arbitrary path or sensitive URL. */
export function routeTemplate(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0] || '/';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;

  if (/^\/games\/[^/]+\/$/.test(withSlash)) return '/games/[slug]/';
  if (/^\/guides\/[^/]+\/$/.test(withSlash)) return '/guides/[slug]/';
  if (/^\/articles\/[^/]+\/$/.test(withSlash)) return '/articles/[slug]/';

  const publicRoutes = new Set([
    '/',
    '/arcade/',
    '/guides/',
    '/articles/',
    '/about/',
    '/terms/',
    '/advertising/',
    '/changelog/',
    '/privacy/',
  ]);
  return publicRoutes.has(withSlash) ? withSlash : '/other/';
}

export class PrivacyAwareErrorReporter {
  private readonly now: () => number;
  private readonly getRoute: () => string;
  private readonly send: (report: ErrorReport) => void;
  private readonly seen = new Map<string, { count: number; startedAt: number }>();
  private readonly maxReports: number;
  private readonly windowMs: number;
  private reporting = false;
  private analyticsAllowed = false;

  constructor(private readonly options: ErrorReporterOptions) {
    this.now = options.now ?? (() => Date.now());
    this.getRoute = options.getRoute ?? (() => '/');
    this.send = options.send ?? (() => {});
    this.maxReports = options.maxReports ?? DEFAULT_MAX_REPORTS;
    this.windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  }

  setAnalyticsConsent(allowed: boolean): void {
    this.analyticsAllowed = allowed;
  }

  report(value: unknown, origin?: string, fatal = false): boolean {
    if (!this.analyticsAllowed || this.reporting) return false;
    const sanitized = sanitizeError(value, origin);
    const now = this.now();
    const previous = this.seen.get(sanitized.fingerprint);
    if (previous && now - previous.startedAt < this.windowMs) {
      if (previous.count >= this.maxReports) return false;
      previous.count += 1;
    } else {
      this.seen.set(sanitized.fingerprint, { count: 1, startedAt: now });
    }

    this.reporting = true;
    try {
      this.send({
        ...sanitized,
        routeTemplate: routeTemplate(this.getRoute()),
        release: this.options.release,
        fatal,
      });
      return true;
    } catch {
      // Reporting must never trigger another report or disrupt gameplay.
      return false;
    } finally {
      this.reporting = false;
    }
  }
}

/** Attach consent-gated browser listeners. Returns a cleanup function for tests. */
export function startPrivacyAwareErrorReporting(release: string): () => void {
  if (typeof window === 'undefined') return () => {};
  const browserWindow = window as BrowserWindow;
  const reporter = new PrivacyAwareErrorReporter({
    release,
    getRoute: () => window.location.pathname,
    send: (report) => {
      const gtag = browserWindow.gtag;
      // Do not queue data for a vendor that is absent. Existing consented GA
      // setup owns loading its script; this module never loads a new vendor.
      if (typeof gtag !== 'function') return;
      gtag('event', 'exception', {
        description: report.description,
        fatal: report.fatal,
        route_template: report.routeTemplate,
        release: report.release,
        ...(report.stack ? { stack: report.stack } : {}),
      });
    },
  });

  const applyConsent = (choice?: AnalyticsConsent) => reporter.setAnalyticsConsent(choice?.analytics === true);
  applyConsent(browserWindow.NoChargeConsent?.get());

  const onConsent = (event: Event) => applyConsent((event as CustomEvent<AnalyticsConsent>).detail);
  const onError = (event: ErrorEvent) => {
    reporter.report(event.error ?? { name: 'ResourceError', message: event.message }, window.location.origin, false);
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    reporter.report(event.reason, window.location.origin, false);
  };

  window.addEventListener('nocharge:consentchange', onConsent);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  // Astro may defer component scripts; check once more after this task so a
  // persisted consent choice is observed regardless of script ordering.
  queueMicrotask(() => applyConsent(browserWindow.NoChargeConsent?.get()));

  return () => {
    window.removeEventListener('nocharge:consentchange', onConsent);
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
