# quarter-rounding-kit

Rounds a date down, up, or to the nearest quarter boundary, returning the quarter start date and the quarter number.

```js
import { roundToQuarter, quarterStart, quarterNumber, quarterBoundary } from './src/index.js';

const d = new Date(Date.UTC(2024, 1, 15)); // 15 Feb 2024

const r = roundToQuarter(d, 'nearest');
r.date;    // 2024-04-01T00:00:00.000Z
r.quarter; // 2

quarterStart(d);        // 2024-01-01T00:00:00.000Z
quarterNumber(d);       // 1
quarterBoundary(d, 'up'); // 2024-04-01T00:00:00.000Z
```

All boundaries are computed in UTC. A quarter is a calendar concept, so anchoring it to local time would make the same instant fall into different quarters on different machines, and would shift the boundary at DST transitions.

## Why this exists

Bucketing timestamps by quarter sounds trivial until you need the midpoint rule and the exact-boundary behaviour spelled out. This library makes one decision for each direction and sticks to it:

- `'down'` returns the start of the quarter containing the input.
- `'up'` returns the start of the next quarter, **except** when the input is already exactly on a boundary, in which case it returns that boundary unchanged. This makes `'up'` idempotent on boundaries, which is what you want when re-running a bucketing pass.
- `'nearest'` rounds half up: an input exactly at the midpoint between two boundaries snaps to the later one.

The trade-off is that there is no `'strictly up'` mode that always advances even from a boundary. If you need that, add one day (or one millisecond) to the input before calling `quarterBoundary(d, 'up')`.

## Awkward edge

`roundToQuarter(d, 'up')` on 31 Dec 2024 returns `{ date: 2025-01-01, quarter: 1 }`. The quarter number is that of the *rounded* date, not the input, so it can wrap to 1 at a year boundary. That is deliberate: the returned quarter describes the bucket you landed in.

## Exports

- `quarterStart(date)` — Date at 00:00:00.000 UTC on the first day of the containing quarter.
- `quarterNumber(date)` — 1-based quarter number (1–4) for the given date.
- `quarterBoundary(date, direction)` — Date at the rounded boundary; `direction` is `'down'`, `'up'`, or `'nearest'`.
- `roundToQuarter(date, direction)` — `{ date, quarter }` for the rounded boundary.

Invalid dates throw `TypeError`; unknown directions throw `RangeError`.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

