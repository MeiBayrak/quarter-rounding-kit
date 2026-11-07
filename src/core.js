const MS_PER_DAY = 24 * 60 * 60 * 1000;

function assertDate(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
    throw new TypeError('Expected a valid Date instance');
  }
}

/**
 * Returns a new Date at 00:00:00.000 UTC on the first day of the calendar quarter
 * that contains `date`. Calendar quarters start on Jan 1, Apr 1, Jul 1, and Oct 1.
 *
 * We use UTC boundaries rather than local time because a quarter is a calendar
 * concept, and local-time boundaries would shift with DST and the host timezone,
 * making the same instant map to different quarters on different machines.
 */
export function quarterStart(date) {
  assertDate(date);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const quarter = Math.floor(month / 3);
  return new Date(Date.UTC(year, quarter * 3, 1, 0, 0, 0, 0));
}

/**
 * Returns the 1-based calendar quarter number (1, 2, 3, or 4) for `date`.
 */
export function quarterNumber(date) {
  assertDate(date);
  return Math.floor(date.getUTCMonth() / 3) + 1;
}

/**
 * Rounds `date` to a quarter boundary according to `direction`.
 *
 * - 'down'    : snap to the start of the quarter containing `date`.
 * - 'up'      : snap to the start of the next quarter, except when `date` is
 *               already exactly on a boundary, in which case it is returned unchanged.
 * - 'nearest' : snap to the closer boundary; exact midpoints round up to the next
 *               quarter, matching the common "round half up" convention.
 *
 * The returned Date is always at 00:00:00.000 UTC.
 */
export function quarterBoundary(date, direction) {
  assertDate(date);
  const valid = ['down', 'up', 'nearest'];
  if (!valid.includes(direction)) {
    throw new RangeError(`direction must be one of ${valid.join(', ')}`);
  }

  const start = quarterStart(date);
  if (direction === 'down') {
    return start;
  }

  const next = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 1, 0, 0, 0, 0));

  if (direction === 'up') {
    // If the input is already exactly on the boundary, keep it there.
    return date.getTime() === start.getTime() ? start : next;
  }

  // direction === 'nearest'
  const elapsed = date.getTime() - start.getTime();
  const span = next.getTime() - start.getTime();
  // Half-open midpoint: elapsed >= span/2 rounds up.
  return elapsed * 2 >= span ? next : start;
}

/**
 * Convenience wrapper that returns both the rounded boundary and the quarter
 * number of the *rounded* date. Rounding up across a year boundary therefore
 * yields Q1 of the next year, which is the behaviour callers usually want when
 * bucketing timestamps.
 */
export function roundToQuarter(date, direction) {
  const boundary = quarterBoundary(date, direction);
  return {
    date: boundary,
    quarter: quarterNumber(boundary),
  };
}
