import test from 'node:test';
import assert from 'node:assert/strict';
import { suggest, topSet, roundTo, lastPerformance } from '../src/lib/progression.js';

test('topSet finds highest weight and min reps at that weight', () => {
  const sets = [
    { w: 50, r: 10 },
    { w: 60, r: 8 },
    { w: 60, r: 9 }
  ];
  const res = topSet(sets);
  assert.deepEqual(res, { weight: 60, minReps: 8, count: 2 });
});

test('suggest increases weight when reps reach repMax', () => {
  const ex = { repMin: 8, repMax: 12, failure: false };
  const last = { weight: 40, minReps: 12 };
  const res = suggest(ex, last, { step: 2.5 });
  assert.equal(res.kind, 'weight');
  assert.equal(res.weight, 42.5);
  assert.equal(res.reps, 8);
});

test('suggest increments reps when within range', () => {
  const ex = { repMin: 8, repMax: 12, failure: false };
  const last = { weight: 40, minReps: 10 };
  const res = suggest(ex, last, { step: 2.5 });
  assert.equal(res.kind, 'reps');
  assert.equal(res.weight, 40);
  assert.equal(res.reps, 11);
});

test('roundTo rounds according to step', () => {
  assert.equal(roundTo(42.3, 2.5), 42.5);
  assert.equal(roundTo(41.1, 2.5), 40);
});

test('lastPerformance ignores alt history entries (e.g. machine occupied)', () => {
  const ex = {
    id: 'd1e4',
    history: [
      { w: 1, weight: 32, reps: 14, note: 'Máquina contractora' },
      { w: 4, weight: 5, reps: 18, note: 'Variante mancuernas (máquina ocupada)', alt: true }
    ]
  };
  const perf = lastPerformance(ex, []);
  assert.equal(perf.weight, 32);
  assert.equal(perf.minReps, 14);
});
