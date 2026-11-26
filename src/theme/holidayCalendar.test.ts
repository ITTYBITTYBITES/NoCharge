import {
  findHolidayEvent,
  getHolidayWindow,
  getMatchingHolidayEvents,
  gregorianEasterSunday,
  holidayCalendar,
  parseLocalPreviewDate,
  resolveHolidayEvent,
  resolveSeasonalSelection,
} from './holidayCalendar';
import type { HolidayEvent, HolidayWindowType } from './holidayCalendar';

function makeDate(year: number, month: number, day: number): Date {
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date;
}

function equal(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

function truthy(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const fixedCases: ReadonlyArray<readonly [number, number, number, string]> = [
  [2026, 1, 1, 'new-years-day'],
  [2026, 2, 14, 'valentines-day'],
  [2026, 3, 17, 'st-patricks-day'],
  [2026, 4, 22, 'earth-day'],
  [2026, 7, 4, 'independence-day'],
  [2026, 10, 31, 'halloween'],
  [2026, 11, 11, 'veterans-day'],
  [2026, 12, 25, 'christmas-day'],
  [2026, 12, 31, 'new-years-eve'],
];
for (const [year, month, day, id] of fixedCases) {
  equal(resolveHolidayEvent(makeDate(year, month, day))?.id, id, `${id} fixed date`);
}

const floatingCases: ReadonlyArray<readonly [number, number, number, string]> = [
  [2026, 1, 19, 'mlk-day'],
  [2026, 2, 16, 'presidents-day'],
  [2026, 4, 5, 'easter-sunday'],
  [2026, 5, 25, 'memorial-day'],
  [2026, 9, 7, 'labor-day'],
  [2026, 11, 26, 'thanksgiving'],
];
for (const [year, month, day, id] of floatingCases) {
  equal(resolveHolidayEvent(makeDate(year, month, day))?.id, id, `${id} floating date`);
}

equal(gregorianEasterSunday(2024).getMonth(), 2, 'Easter 2024 month');
equal(gregorianEasterSunday(2024).getDate(), 31, 'Easter 2024 day');
equal(gregorianEasterSunday(2000).getMonth(), 3, 'Easter 2000 month');
equal(gregorianEasterSunday(2000).getDate(), 23, 'Easter 2000 day');

const winter = findHolidayEvent('winter-holiday-season');
truthy(winter, 'winter range is registered');
for (const [month, day] of [[12, 20], [12, 23], [12, 26]] as const) {
  truthy(getMatchingHolidayEvents(makeDate(2026, month, day)).some(({ event }) => event.id === winter.id), `winter range includes ${month}/${day}`);
}
equal(getMatchingHolidayEvents(makeDate(2026, 12, 19)).some(({ event }) => event.id === winter.id), false, 'winter range excludes day before start');
equal(getMatchingHolidayEvents(makeDate(2026, 12, 27)).some(({ event }) => event.id === winter.id), false, 'winter range excludes day after end');

const crossYearRange: HolidayEvent = {
  id: 'cross-year-check', name: 'Cross-Year Check', label: 'Cross Year', windowType: 'range', priority: 0,
  dateRule: { type: 'range', start: { month: 12, day: 28 }, end: { month: 1, day: 3 } },
};
truthy(getMatchingHolidayEvents(makeDate(2027, 1, 2), [crossYearRange]).some(({ event }) => event.id === crossYearRange.id), 'month/day range can cross into the following year');
equal(getMatchingHolidayEvents(makeDate(2027, 1, 4), [crossYearRange]).length, 0, 'cross-year month/day range is inclusive and bounded');

const christmas = findHolidayEvent('christmas-day');
truthy(christmas, 'Christmas is registered');
const christmasWindow = getHolidayWindow(christmas, 2026);
equal(christmasWindow.start.getMonth(), 11, 'Christmas day is in December');
equal(christmasWindow.start.getDate(), 25, 'Christmas day window starts on December 25');
equal(christmasWindow.end.getDate(), 25, 'Christmas day window ends on December 25');
equal(resolveHolidayEvent(makeDate(2026, 12, 24))?.id, 'winter-holiday-season', 'winter range covers December 24');
equal(resolveHolidayEvent(makeDate(2026, 12, 25))?.id, 'christmas-day', 'one-day event beats overlapping range');
equal(resolveHolidayEvent(makeDate(2026, 12, 26))?.id, 'winter-holiday-season', 'winter range covers December 26');

equal(resolveHolidayEvent(makeDate(2025, 12, 28))?.id, 'new-years-day', 'New Year week handles prior-calendar-year days');
equal(resolveHolidayEvent(makeDate(2026, 1, 3))?.id, 'new-years-day', 'New Year Sunday-start week includes its last day');
equal(resolveHolidayEvent(makeDate(2027, 1, 2))?.id, 'new-years-day', 'New Year week handles next calendar year');
equal(resolveHolidayEvent(makeDate(2026, 6, 4)), null, 'ordinary date has no event');
equal(resolveHolidayEvent(new Date(Number.NaN)), null, 'invalid date resolves to no event');

equal(parseLocalPreviewDate('2026-02-14')?.getDate(), 14, 'valid preview date parses locally');
equal(parseLocalPreviewDate('2026-02-30'), null, 'impossible preview date is rejected');
equal(parseLocalPreviewDate('02/14/2026'), null, 'non-ISO preview date is rejected');
equal(parseLocalPreviewDate('2026-2-14'), null, 'non-padded preview date is rejected');
equal(resolveSeasonalSelection({ date: makeDate(2026, 2, 14), preference: 'standard' }).event, null, 'standard preference suppresses automatic event');
equal(resolveSeasonalSelection({ date: makeDate(2026, 2, 14), preference: 'auto' }).event?.id, 'valentines-day', 'auto uses local date');
equal(resolveSeasonalSelection({ date: makeDate(2026, 2, 14), preference: 'standard', previewEvent: 'halloween' }).event?.id, 'halloween', 'valid preview event overrides preference');
equal(resolveSeasonalSelection({ date: makeDate(2026, 2, 14), preference: 'auto', previewEvent: 'unknown-event' }).event?.id, 'valentines-day', 'invalid event preview safely falls back to date resolution');
equal(resolveSeasonalSelection({ date: makeDate(2026, 6, 4), preference: 'auto', previewDate: '2026-02-14' }).event?.id, 'valentines-day', 'valid date preview resolves event');
equal(resolveSeasonalSelection({ date: makeDate(2026, 6, 4), preference: 'auto', previewDate: '2026-02-30' }).event, null, 'invalid date preview safely falls back');
equal(resolveSeasonalSelection({ date: makeDate(2026, 2, 14), preference: 'auto', previewEvent: 'none' }).event, null, 'none preview forces neutral event');

const overlapRegistry: readonly HolidayEvent[] = [
  {
    id: 'overlap-range', name: 'Range', label: 'Range', windowType: 'range', priority: 100,
    dateRule: { type: 'range', start: { month: 5, day: 1 }, end: { month: 5, day: 31 } },
  },
  {
    id: 'overlap-week-low', name: 'Week Low', label: 'Week Low', windowType: 'week', priority: 10,
    dateRule: { type: 'fixed', month: 5, day: 18 },
  },
  {
    id: 'overlap-week-high', name: 'Week High', label: 'Week High', windowType: 'week', priority: 20,
    dateRule: { type: 'fixed', month: 5, day: 20 },
  },
  {
    id: 'overlap-day', name: 'Day', label: 'Day', windowType: 'day', priority: 0,
    dateRule: { type: 'fixed', month: 5, day: 19 },
  },
];
equal(resolveHolidayEvent(makeDate(2026, 5, 19), overlapRegistry)?.id, 'overlap-day', 'day specificity wins before numeric priority');
equal(resolveHolidayEvent(makeDate(2026, 5, 20), overlapRegistry)?.id, 'overlap-week-high', 'higher priority wins between equally specific events');
equal(resolveHolidayEvent(makeDate(2026, 5, 17), overlapRegistry)?.id, 'overlap-week-high', 'week priority resolves ties irrespective of anchor distance');

const rangeTieRegistry: readonly HolidayEvent[] = [
  {
    id: 'long-range', name: 'Long Range', label: 'Long', windowType: 'range', priority: 4,
    dateRule: { type: 'range', start: { month: 5, day: 1 }, end: { month: 5, day: 31 } },
  },
  {
    id: 'short-range', name: 'Short Range', label: 'Short', windowType: 'range', priority: 4,
    dateRule: { type: 'range', start: { month: 5, day: 18 }, end: { month: 5, day: 22 } },
  },
];
equal(resolveHolidayEvent(makeDate(2026, 5, 20), rangeTieRegistry)?.id, 'short-range', 'shorter span wins when specificity and priority tie');

const anchorTieRegistry: readonly HolidayEvent[] = [
  {
    id: 'far-anchor', name: 'Far Anchor', label: 'Far', windowType: 'range', priority: 4,
    dateRule: { type: 'range', start: { month: 5, day: 10 }, end: { month: 5, day: 20 } },
  },
  {
    id: 'near-anchor', name: 'Near Anchor', label: 'Near', windowType: 'range', priority: 4,
    dateRule: { type: 'range', start: { month: 5, day: 18 }, end: { month: 5, day: 28 } },
  },
];
equal(resolveHolidayEvent(makeDate(2026, 5, 19), anchorTieRegistry)?.id, 'near-anchor', 'nearer range anchor wins after equal duration and priority');

const idTieRegistry: readonly HolidayEvent[] = [
  {
    id: 'tie-b', name: 'Tie B', label: 'B', windowType: 'range', priority: 4,
    dateRule: { type: 'range', start: { month: 5, day: 18 }, end: { month: 5, day: 22 } },
  },
  {
    id: 'tie-a', name: 'Tie A', label: 'A', windowType: 'range', priority: 4,
    dateRule: { type: 'range', start: { month: 5, day: 18 }, end: { month: 5, day: 22 } },
  },
];
equal(resolveHolidayEvent(makeDate(2026, 5, 20), idTieRegistry)?.id, 'tie-a', 'ascending event ID is the final deterministic tie-break');

const dstWeek: HolidayEvent = {
  id: 'dst-week-check', name: 'DST Week', label: 'DST', windowType: 'week', priority: 0,
  dateRule: { type: 'fixed', month: 3, day: 9 },
};
const dstWindow = getHolidayWindow(dstWeek, 2026);
equal(dstWindow.start.getMonth(), 2, 'DST-spanning week begins in March');
equal(dstWindow.start.getDate(), 8, 'DST-spanning week begins on Sunday');
equal(dstWindow.end.getDate(), 14, 'DST-spanning week still ends six calendar days later');
equal(
  Math.round((dstWindow.end.getTime() - dstWindow.start.getTime()) / (24 * 60 * 60 * 1000)),
  6,
  'DST-spanning week uses local calendar days, not elapsed 24-hour intervals',
);

const expectedWindowTypes: Readonly<Record<string, HolidayWindowType>> = {
  'new-years-day': 'week',
  'valentines-day': 'day',
  'st-patricks-day': 'day',
  'earth-day': 'day',
  'independence-day': 'week',
  halloween: 'week',
  'veterans-day': 'day',
  'christmas-day': 'day',
  'new-years-eve': 'day',
  'mlk-day': 'week',
  'presidents-day': 'week',
  'easter-sunday': 'week',
  'memorial-day': 'week',
  'labor-day': 'week',
  thanksgiving: 'week',
  'winter-holiday-season': 'range',
};
equal(holidayCalendar.length, 16, 'all requested event dates plus winter range are registered');
for (const event of holidayCalendar) {
  equal(event.windowType, expectedWindowTypes[event.id], `${event.id} configured window type`);
  truthy(event.name && event.label && Number.isFinite(event.priority), `${event.id} metadata is complete`);
}

console.log('Holiday calendar tests passed (16 registered events, windows, dates, priorities, previews, and fallback).');
