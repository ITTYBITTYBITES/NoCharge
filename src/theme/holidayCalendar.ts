export type HolidayWindowType = 'day' | 'week' | 'range';

/** 1-based Gregorian month/day used by recurring annual rules and ranges. */
export type MonthDay = Readonly<{
  month: number;
  day: number;
}>;

type FixedDateRule = Readonly<{
  type: 'fixed';
  month: number;
  day: number;
}>;

type NthWeekdayRule = Readonly<{
  type: 'nth-weekday';
  month: number;
  weekday: number;
  occurrence: number;
}>;

type LastWeekdayRule = Readonly<{
  type: 'last-weekday';
  month: number;
  weekday: number;
}>;

type EasterRule = Readonly<{
  type: 'easter';
}>;

type RangeDateRule = Readonly<{
  type: 'range';
  start: MonthDay;
  end: MonthDay;
}>;

type AnnualHolidayDateRule = FixedDateRule | NthWeekdayRule | LastWeekdayRule | EasterRule;

type HolidayMetadata = Readonly<{
  id: string;
  name: string;
  label: string;
  priority: number;
  badge?: string;
  greeting?: string;
}>;

export type HolidayEvent =
  | (HolidayMetadata & Readonly<{
    windowType: 'day' | 'week';
    dateRule: AnnualHolidayDateRule;
  }>)
  | (HolidayMetadata & Readonly<{
    windowType: 'range';
    dateRule: RangeDateRule;
  }>);

/**
 * `week` always means Sunday through Saturday, inclusive, in the visitor's
 * local calendar. `range` spans are inclusive; a month/day end before its start
 * crosses into the next year. Overlaps sort by day > week > range, then higher
 * priority, shorter actual span, nearer nominal anchor, and ascending event ID.
 */
export const holidayCalendar = [
  {
    id: 'new-years-day',
    name: "New Year's Day",
    label: 'New Year',
    badge: 'New Year',
    greeting: 'A bright start to the year.',
    windowType: 'week',
    priority: 80,
    dateRule: { type: 'fixed', month: 1, day: 1 },
  },
  {
    id: 'valentines-day',
    name: "Valentine's Day",
    label: 'Valentine',
    badge: "Valentine's",
    windowType: 'day',
    priority: 90,
    dateRule: { type: 'fixed', month: 2, day: 14 },
  },
  {
    id: 'st-patricks-day',
    name: "St. Patrick's Day",
    label: "St. Patrick's",
    badge: "St. Patrick's",
    windowType: 'day',
    priority: 80,
    dateRule: { type: 'fixed', month: 3, day: 17 },
  },
  {
    id: 'earth-day',
    name: 'Earth Day',
    label: 'Earth Day',
    badge: 'Earth Day',
    windowType: 'day',
    priority: 80,
    dateRule: { type: 'fixed', month: 4, day: 22 },
  },
  {
    id: 'independence-day',
    name: 'Independence Day',
    label: 'July 4',
    badge: 'Independence Day',
    windowType: 'week',
    priority: 95,
    dateRule: { type: 'fixed', month: 7, day: 4 },
  },
  {
    id: 'halloween',
    name: 'Halloween',
    label: 'Halloween',
    badge: 'Halloween',
    windowType: 'week',
    priority: 90,
    dateRule: { type: 'fixed', month: 10, day: 31 },
  },
  {
    id: 'veterans-day',
    name: "Veterans Day",
    label: 'Veterans',
    badge: 'Veterans Day',
    windowType: 'day',
    priority: 75,
    dateRule: { type: 'fixed', month: 11, day: 11 },
  },
  {
    id: 'christmas-day',
    name: 'Christmas Day',
    label: 'Christmas',
    badge: 'Christmas',
    windowType: 'day',
    priority: 100,
    dateRule: { type: 'fixed', month: 12, day: 25 },
  },
  {
    id: 'new-years-eve',
    name: "New Year's Eve",
    label: 'New Year’s Eve',
    badge: "New Year's Eve",
    windowType: 'day',
    priority: 95,
    dateRule: { type: 'fixed', month: 12, day: 31 },
  },
  {
    id: 'mlk-day',
    name: 'Martin Luther King Jr. Day',
    label: 'MLK Day',
    badge: 'MLK Day',
    windowType: 'week',
    priority: 80,
    dateRule: { type: 'nth-weekday', month: 1, weekday: 1, occurrence: 3 },
  },
  {
    id: 'presidents-day',
    name: "Presidents' Day",
    label: 'Presidents',
    badge: "Presidents' Day",
    windowType: 'week',
    priority: 75,
    dateRule: { type: 'nth-weekday', month: 2, weekday: 1, occurrence: 3 },
  },
  {
    id: 'easter-sunday',
    name: 'Easter Sunday',
    label: 'Easter',
    badge: 'Easter',
    windowType: 'week',
    priority: 70,
    dateRule: { type: 'easter' },
  },
  {
    id: 'memorial-day',
    name: 'Memorial Day',
    label: 'Memorial',
    badge: 'Memorial Day',
    windowType: 'week',
    priority: 85,
    dateRule: { type: 'last-weekday', month: 5, weekday: 1 },
  },
  {
    id: 'labor-day',
    name: 'Labor Day',
    label: 'Labor Day',
    badge: 'Labor Day',
    windowType: 'week',
    priority: 65,
    dateRule: { type: 'nth-weekday', month: 9, weekday: 1, occurrence: 1 },
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    label: 'Thanksgiving',
    badge: 'Thanksgiving',
    greeting: 'A little room for gratitude.',
    windowType: 'week',
    priority: 100,
    dateRule: { type: 'nth-weekday', month: 11, weekday: 4, occurrence: 4 },
  },
  {
    id: 'winter-holiday-season',
    name: 'Winter Holiday Season',
    label: 'Winter Season',
    badge: 'Winter Season',
    windowType: 'range',
    priority: 10,
    dateRule: { type: 'range', start: { month: 12, day: 20 }, end: { month: 12, day: 26 } },
  },
] as const satisfies readonly HolidayEvent[];

export type HolidayEventId = (typeof holidayCalendar)[number]['id'];
export type SeasonalPreference = 'auto' | 'standard';

export type HolidayWindow = Readonly<{
  start: Date;
  end: Date;
  anchor: Date;
}>;

export type HolidayMatch = Readonly<{
  event: HolidayEvent;
  window: HolidayWindow;
}>;

const WINDOW_SPECIFICITY: Record<HolidayWindowType, number> = {
  range: 1,
  week: 2,
  day: 3,
};

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

function localNoon(year: number, month: number, day: number): Date {
  const value = new Date(0);
  value.setFullYear(year, month - 1, day);
  value.setHours(12, 0, 0, 0);
  return value;
}

function addLocalDays(date: Date, amount: number): Date {
  const value = localNoon(date.getFullYear(), date.getMonth() + 1, date.getDate());
  value.setDate(value.getDate() + amount);
  return value;
}

function localDayNumber(date: Date): number {
  const utcDay = new Date(0);
  utcDay.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  utcDay.setUTCHours(0, 0, 0, 0);
  return Math.floor(utcDay.getTime() / DAY_MILLISECONDS);
}

function monthDayOrder(value: MonthDay): number {
  return value.month * 100 + value.day;
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number): Date {
  const first = localNoon(year, month, 1);
  const firstOffset = (weekday - first.getDay() + 7) % 7;
  return localNoon(year, month, 1 + firstOffset + (occurrence - 1) * 7);
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const last = localNoon(year, month + 1, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  return localNoon(year, month, last.getDate() - offset);
}

/** Gregorian Easter Sunday, using the Meeus/Jones/Butcher computus. */
export function gregorianEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return localNoon(year, month, day);
}

export function getNominalHolidayDate(event: HolidayEvent, year: number): Date {
  const rule = event.dateRule;
  if (rule.type === 'fixed') return localNoon(year, rule.month, rule.day);
  if (rule.type === 'nth-weekday') return nthWeekdayOfMonth(year, rule.month, rule.weekday, rule.occurrence);
  if (rule.type === 'last-weekday') return lastWeekdayOfMonth(year, rule.month, rule.weekday);
  if (rule.type === 'easter') return gregorianEasterSunday(year);
  return localNoon(year, rule.start.month, rule.start.day);
}

export function getHolidayWindow(event: HolidayEvent, year: number): HolidayWindow {
  const rule = event.dateRule;
  if (event.windowType === 'range' && rule.type === 'range') {
    const start = localNoon(year, rule.start.month, rule.start.day);
    const endYear = monthDayOrder(rule.end) < monthDayOrder(rule.start) ? year + 1 : year;
    return { start, end: localNoon(endYear, rule.end.month, rule.end.day), anchor: start };
  }

  const anchor = getNominalHolidayDate(event, year);
  if (event.windowType === 'day') return { start: anchor, end: anchor, anchor };
  const start = addLocalDays(anchor, -anchor.getDay());
  return { start, end: addLocalDays(start, 6), anchor };
}

export function getMatchingHolidayEvents(
  date: Date,
  registry: readonly HolidayEvent[] = holidayCalendar,
): HolidayMatch[] {
  if (Number.isNaN(date.getTime())) return [];
  const target = localDayNumber(date);
  const year = date.getFullYear();
  const matches: HolidayMatch[] = [];

  for (const event of registry) {
    for (let windowYear = year - 1; windowYear <= year + 1; windowYear += 1) {
      const window = getHolidayWindow(event, windowYear);
      if (target >= localDayNumber(window.start) && target <= localDayNumber(window.end)) {
        matches.push({ event, window });
      }
    }
  }

  return matches.sort((left, right) => {
    const specificity = WINDOW_SPECIFICITY[right.event.windowType] - WINDOW_SPECIFICITY[left.event.windowType];
    if (specificity !== 0) return specificity;
    const priority = right.event.priority - left.event.priority;
    if (priority !== 0) return priority;
    const leftDuration = localDayNumber(left.window.end) - localDayNumber(left.window.start);
    const rightDuration = localDayNumber(right.window.end) - localDayNumber(right.window.start);
    if (leftDuration !== rightDuration) return leftDuration - rightDuration;
    const leftDistance = Math.abs(target - localDayNumber(left.window.anchor));
    const rightDistance = Math.abs(target - localDayNumber(right.window.anchor));
    if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    return left.event.id.localeCompare(right.event.id);
  });
}

export function resolveHolidayEvent(
  date: Date,
  registry: readonly HolidayEvent[] = holidayCalendar,
): HolidayEvent | null {
  return getMatchingHolidayEvents(date, registry)[0]?.event ?? null;
}

export function findHolidayEvent(id: string, registry: readonly HolidayEvent[] = holidayCalendar): HolidayEvent | null {
  return registry.find((event) => event.id === id) ?? null;
}

/** Parse YYYY-MM-DD as a local date; native Date string parsing is UTC-based. */
export function parseLocalPreviewDate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = localNoon(year, month, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() + 1 !== month || parsed.getDate() !== day) return null;
  return parsed;
}

export type SeasonalResolution = Readonly<{
  preference: SeasonalPreference;
  event: HolidayEvent | null;
  isPreview: boolean;
}>;

export function resolveSeasonalSelection(input: Readonly<{
  date: Date;
  preference: SeasonalPreference;
  previewEvent?: string | null;
  previewDate?: string | null;
}>): SeasonalResolution {
  const previewEvent = input.previewEvent?.trim() ?? '';
  if (previewEvent === 'none') return { preference: input.preference, event: null, isPreview: true };
  if (previewEvent) {
    const selected = findHolidayEvent(previewEvent);
    if (selected) return { preference: input.preference, event: selected, isPreview: true };
  }

  const previewDate = parseLocalPreviewDate(input.previewDate);
  if (previewDate) {
    return { preference: input.preference, event: resolveHolidayEvent(previewDate), isPreview: true };
  }

  return {
    preference: input.preference,
    event: input.preference === 'auto' ? resolveHolidayEvent(input.date) : null,
    isPreview: false,
  };
}
