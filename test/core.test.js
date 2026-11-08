import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  quarterBoundary,
  quarterStart,
  quarterNumber,
  roundToQuarter,
} from '../src/index.js';

const utc = (y, m, d, h = 0, mi = 0, s = 0, ms = 0) =>
  new Date(Date.UTC(y, m - 1, d, h, mi, s, ms));

const eq = (actual, expected) => {
  assert.ok(actual instanceof Date, 'expected a Date');
  assert.equal(actual.getTime(), expected.getTime());
};

test('quarterStart returns the first day of the containing quarter', () => {
  eq(quarterStart(utc(2024, 2, 15)), utc(2024, 1, 1));
  eq(quarterStart(utc(2024, 3, 31, 23, 59, 59)), utc(2024, 1, 1));
  eq(quarterStart(utc(2024, 4, 1)), utc(2024, 4, 1));
  eq(quarterStart(utc(2024, 12, 31)), utc(2024, 10, 1));
});

test('quarterStart normalises time-of-day to midnight UTC', () => {
  eq(quarterStart(utc(2024, 5, 17, 13, 45, 12, 345)), utc(2024, 4, 1));
});

test('quarterNumber is 1-based', () => {
  assert.equal(quarterNumber(utc(2024, 1, 1)), 1);
  assert.equal(quarterNumber(utc(2024, 3, 31)), 1);
  assert.equal(quarterNumber(utc(2024, 4, 1)), 2);
  assert.equal(quarterNumber(utc(2024, 6, 30)), 2);
  assert.equal(quarterNumber(utc(2024, 7, 1)), 3);
  assert.equal(quarterNumber(utc(2024, 9, 30)), 3);
  assert.equal(quarterNumber(utc(2024, 10, 1)), 4);
  assert.equal(quarterNumber(utc(2024, 12, 31)), 4);
});

test('quarterBoundary down snaps to the containing quarter', () => {
  eq(quarterBoundary(utc(2024, 2, 29), 'down'), utc(2024, 1, 1));
  eq(quarterBoundary(utc(2024, 4, 1), 'down'), utc(2024, 4, 1));
  eq(quarterBoundary(utc(2024, 11, 5), 'down'), utc(2024, 10, 1));
});

test('quarterBoundary up advances to the next quarter', () => {
  eq(quarterBoundary(utc(2024, 2, 15), 'up'), utc(2024, 4, 1));
  eq(quarterBoundary(utc(2024, 12, 31), 'up'), utc(2025, 1, 1));
});

test('quarterBoundary up is idempotent on an exact boundary', () => {
  eq(quarterBoundary(utc(2024, 4, 1), 'up'), utc(2024, 4, 1));
  eq(quarterBoundary(utc(2024, 1, 1), 'up'), utc(2024, 1, 1));
});

test('quarterBoundary nearest rounds half up', () => {
  // Q1 2024 spans Jan 1 to Apr 1 (91 days in a leap year).
  // Midpoint is Jan 1 + 45.5 days = Feb 15 12:00 UTC.
  eq(quarterBoundary(utc(2024, 2, 15, 11, 59, 59), 'nearest'), utc(2024, 1, 1));
  eq(quarterBoundary(utc(2024, 2, 15, 12, 0, 0), 'nearest'), utc(2024, 4, 1));
  eq(quarterBoundary(utc(2024, 2, 15, 12, 0, 1), 'nearest'), utc(2024, 4, 1));
});

test('quarterBoundary nearest is stable just before and after a boundary', () => {
  eq(quarterBoundary(utc(2024, 3, 31, 23, 59, 59), 'nearest'), utc(2024, 4, 1));
  eq(quarterBoundary(utc(2024, 4, 1, 0, 0, 1), 'nearest'), utc(2024, 4, 1));
});

test('quarterBoundary rejects invalid directions', () => {
  assert.throws(() => quarterBoundary(utc(2024, 1, 1), 'sideways'), RangeError);
  assert.throws(() => quarterBoundary(utc(2024, 1, 1), undefined), RangeError);
});

test('quarterBoundary rejects invalid dates', () => {
  assert.throws(() => quarterBoundary(new Date(NaN), 'down'), TypeError);
  assert.throws(() => quarterBoundary('2024-01-01', 'down'), TypeError);
});

test('roundToQuarter reports the quarter of the rounded date', () => {
  const down = roundToQuarter(utc(2024, 2, 15), 'down');
  eq(down.date, utc(2024, 1, 1));
  assert.equal(down.quarter, 1);

  const up = roundToQuarter(utc(2024, 11, 5), 'up');
  eq(up.date, utc(2025, 1, 1));
  assert.equal(up.quarter, 1);

  const nearest = roundToQuarter(utc(2024, 8, 15), 'nearest');
  eq(nearest.date, utc(2024, 7, 1));
  assert.equal(nearest.quarter, 3);
});
