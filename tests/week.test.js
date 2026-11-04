import test from 'node:test';
import assert from 'node:assert/strict';
import { days, nextDay, cursorOf, dayDone, weeks } from '../src/lib/program.js';

const st = (sessions = [], weekIndex = 5) => ({ sessions, settings: { weekIndex } });

test('todos los días comparten la semana global (S5), sin huecos', () => {
  const s = st();
  for (const d of days) assert.equal(weeks[cursorOf(d, s)], 'Semana 5');
});
test('el siguiente día es el primero no hecho en la semana actual', () => {
  const s = st();
  const pending = days.filter((d) => !dayDone(d, s));
  assert.equal(nextDay(s).id, pending[0].id);
});
test('una sesión terminada en la semana marca el día como hecho', () => {
  const d = days.find((x) => !dayDone(x, st()));
  const s = st([{ dayId: d.id, finishedAt: 1, weekIndex: 5 }]);
  assert.ok(dayDone(d, s));
});

test('suggestionFor funciona con el estado completo (regresión pantalla negra)', async () => {
  const { suggestionFor } = await import('../src/lib/program.js');
  const s = { sessions: [], settings: { weekIndex: 5, deload: 0.9, steps: {} } };
  for (const d of days) for (const e of d.exercises) assert.ok(suggestionFor(e, d, s).kind);
});
