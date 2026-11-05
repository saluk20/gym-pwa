import test from 'node:test';
import assert from 'node:assert/strict';
import { days, warmupRows } from '../src/lib/program.js';

test('calentamiento solo en el 1.er ejercicio de cada grupo del día (no pierna)', () => {
  for (const d of days) {
    const withWarm = d.exercises.filter((e) => warmupRows(d, e, 60, 2.5)).map((e) => e.muscle);
    assert.equal(new Set(withWarm).size, withWarm.length);
  }
  const d1 = days.find((d) => d.id === 'd1');
  assert.deepEqual(d1.exercises.map((e) => !!warmupRows(d1, e, 60, 2.5)), [true, false, false, true, true, false]);
  const d3 = days.find((d) => d.id === 'd3');
  assert.ok(d3.exercises.every((e) => !warmupRows(d3, e, 60, 2.5)));
});

test('2 calentamientos de 90 s + 1 aproximación de 180 s, pesos ascendentes', () => {
  const d = days[0];
  const r = warmupRows(d, d.exercises[0], 68, 2.5);
  assert.deepEqual(r.map((x) => [x.kind, x.restSec]), [['cal', 90], ['cal', 90], ['apr', 180]]);
  assert.ok(r[0].w < r[1].w && r[1].w < r[2].w && r[2].w < 68);
});
