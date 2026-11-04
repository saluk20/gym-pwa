import test from 'node:test';
import assert from 'node:assert/strict';
import { recommend, weekKey, dayDiff } from '../src/lib/plan.js';

const now = new Date(2026, 10, 4, 12).getTime(); // 2026-11-04
const ev = (type, date, endDate, title = 'X') => ({ id: date, type, date, endDate, title });

test('sin eventos no hay recomendación', () => assert.equal(recommend([], now), null));
test('competición en 20 días → apretar', () => assert.equal(recommend([ev('comp', '2026-11-24')], now).mode, 'apretar'));
test('competición en 5 días → suave', () => assert.equal(recommend([ev('comp', '2026-11-09')], now).mode, 'suave'));
test('competición en 2 días → descanso', () => assert.equal(recommend([ev('comp', '2026-11-06')], now).mode, 'descanso'));
test('viaje en curso → descanso', () => assert.equal(recommend([ev('trip', '2026-11-03', '2026-11-10')], now).mode, 'descanso'));
test('tras competición → suave', () => assert.equal(recommend([ev('comp', '2026-11-01')], now).mode, 'suave'));
test('conflicto: gana el más conservador', () => {
  const r = recommend([ev('comp', '2026-11-24'), ev('trip', '2026-11-04', '2026-11-08')], now);
  assert.equal(r.mode, 'descanso');
});
test('weekKey devuelve el lunes', () => { assert.equal(weekKey(now), '2026-11-02'); assert.equal(dayDiff(now, '2026-11-09'), 5); });
