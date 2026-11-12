import test from 'node:test';
import assert from 'node:assert/strict';
import { keyOf } from '../src/lib/exkey.js';
import { pointsFor, exerciseList, ROUTINES, KEY_BY_ID } from '../src/lib/history.js';
import { lastPerformance, suggest } from '../src/lib/progression.js';
import { nextStartIso, daysUntil, currentMonday, routineWeeks, addDays, anchorAfter } from '../src/lib/schedule.js';
import next from '../src/data/next-routine.json' with { type: 'json' };
import current from '../src/data/routine.json' with { type: 'json' };

test('variantes del mismo ejercicio comparten clave; agarres distintos no', () => {
  assert.equal(keyOf('Jalón al pecho'), keyOf('Jalón al pecho agarre neutro'));
  assert.equal(keyOf('Remo T agarre neutro'), keyOf('Remo en T'));
  assert.notEqual(keyOf('Remo en T agarre abierto'), keyOf('Remo en T'));
  assert.notEqual(keyOf('Extensor de codo polea alta'), keyOf('Extensor de codo polea alta tumbado'));
});

test('Stats une rutinas antiguas, Excel actual y sesiones de la app en un ejercicio', () => {
  const key = keyOf('Remo en T');
  const base = pointsFor(key);
  const rids = new Set(base.map((p) => p.rid));
  assert.ok(rids.has('old-3') && rids.has('current'), 'old-3 y actual presentes');
  const idNext = next.days[0].exercises.find((e) => keyOf(e.name) === key).id;
  const s = { id: 's1', dayId: 'n1', weekIndex: 0, finishedAt: Date.now(), sets: { [idNext]: [{ w: 55, r: 9, done: true }] } };
  const withApp = pointsFor(key, [s]);
  assert.equal(withApp.length, base.length + 1);
  const last = withApp.at(-1);
  assert.equal(last.rid, 'next'); assert.equal(last.weight, 55);
  const order = withApp.map((p) => ROUTINES.findIndex((r) => r.id === p.rid));
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'orden cronológico por rutina');
});

test('no se pierden pesos del Excel antiguo (hojas 2–4)', () => {
  const total = ROUTINES.filter((r) => r.id.startsWith('old-')).flatMap((r) => exerciseList().flatMap((e) => pointsFor(e.key).filter((p) => p.rid === r.id)));
  assert.ok(total.length >= 200, `esperaba ≥200 registros antiguos, hay ${total.length}`);
});

test('rutina siguiente: ids únicos, sin colisión con la actual, claves y semillas coherentes', () => {
  const ids = next.days.flatMap((d) => d.exercises.map((e) => e.id));
  assert.equal(new Set(ids).size, ids.length);
  const cur = new Set(current.days.flatMap((d) => d.exercises.map((e) => e.id)));
  assert.ok(ids.every((id) => !cur.has(id)));
  assert.ok(ids.every((id) => KEY_BY_ID[id]));
  for (const e of next.days.flatMap((d) => d.exercises)) if (e.seed) assert.ok(e.seed.weight > 0 && e.seed.reps > 0);
});

test('la rutina nueva arranca desde el último peso de la actual (semilla) y desde la app si hay sesión', () => {
  const ex = next.days.flatMap((d) => d.exercises).find((e) => e.name === 'Contractora/Aperturas laterales');
  ex.key = keyOf(ex.name);
  assert.equal(lastPerformance(ex, []).source, 'prev');
  const curId = current.days.flatMap((d) => d.exercises).find((e) => keyOf(e.name) === ex.key).id;
  const s = { finishedAt: 5, weekIndex: 6, sets: { [curId]: [{ w: 70, r: 15, done: true }] } };
  const lp = lastPerformance(ex, [s]);
  assert.equal(lp.source, 'app'); assert.equal(lp.weight, 70);
});

test('rutina siguiente: 9 semanas con descarga, pierna el Día 2, sin abdomen', () => {
  assert.equal(next.weeks.length, 9);
  assert.ok(next.weeks.some((w) => /^Descarga/.test(w)));
  assert.equal(next.days[1].name, 'Pierna');
  assert.ok(!next.days.some((d) => d.exercises.some((e) => e.muscle === 'Abdomen')));
});

test('inicio de la rutina siguiente: lunes tras la última semana; se desplaza si te retrasas', () => {
  const now = new Date('2026-11-12T12:00:00').getTime();
  const s = (wi) => ({ weekIndex: wi });
  assert.equal(nextStartIso({}, 6, 19, now), '2027-02-15'); // ancla por defecto: S6 = lunes 9 nov
  assert.equal(new Date('2027-02-15T12:00:00').getDay(), 1);
  assert.equal(daysUntil('2027-02-15', now), 95);
  const late = new Date('2026-11-24T12:00:00').getTime(); // sigues en S6 dos semanas después
  assert.equal(nextStartIso({}, 6, 19, late), '2027-03-01');
});

test('semanas de descarga con fecha (actual y siguiente)', () => {
  const now = new Date('2026-11-12T12:00:00').getTime();
  const mon = currentMonday({}, 6, now);
  assert.equal(mon, '2026-11-09');
  const w = routineWeeks(current.weeks, addDays(mon, -42)).filter((x) => x.deload);
  assert.deepEqual(w.map((x) => x.mon), ['2026-11-30', '2027-01-11']);
  assert.equal(w[0].sun, '2026-12-06');
  const n = routineWeeks(next.weeks, '2027-02-15').filter((x) => x.deload);
  assert.deepEqual(n.map((x) => x.mon), ['2027-03-15']);
});

test('avanzar de semana desplaza el ancla (pronto no adelanta, tarde retrasa)', () => {
  const settings = { weekAnchor: { idx: 6, mon: '2026-11-09' }, weekIndex: 6 };
  const early = new Date('2026-11-13T12:00:00').getTime(); // terminas S6 el viernes
  assert.equal(anchorAfter(settings, 6, 7, false, early).mon, '2026-11-16');
  const late = new Date('2026-11-20T12:00:00').getTime(); // terminas S6 una semana tarde
  assert.equal(anchorAfter(settings, 6, 7, false, late).mon, '2026-11-23');
  assert.equal(anchorAfter(settings, 6, 4, true, early).mon, '2026-11-09'); // manual: la elegida es esta semana
});

test('la descarga usa el % del último entreno normal y la semana siguiente no parte del peso de descarga', () => {
  const ex = { ...current.days[1].exercises[2], key: keyOf(current.days[1].exercises[2].name) };
  const id = ex.id;
  const normal = { finishedAt: 1, weekIndex: 8, sets: { [id]: [{ w: 60, r: 14, done: true }] } };
  const deload = { finishedAt: 2, weekIndex: 9, sets: { [id]: [{ w: 54, r: 14, done: true }] } }; // 'Descarga 1'
  assert.equal(lastPerformance(ex, [normal, deload]).weight, 60);
  const sug = suggest(ex, lastPerformance(ex, [normal]), { step: 2.5, deload: 0.9, isDeload: true });
  assert.equal(sug.kind, 'deload'); assert.equal(sug.weight, 53.75); // 60 × 0,9 = 54 → múltiplo de 1,25 más cercano
});
