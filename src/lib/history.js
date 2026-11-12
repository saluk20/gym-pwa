// Historial de pesos por ejercicio unificado entre rutinas antiguas, actual y siguiente (las sesiones de la app se añaden aparte).
import oldRoutines from '../data/old-routines.json' with { type: 'json' };
import oldLogs from '../data/old-logs.json' with { type: 'json' };
import current from '../data/routine.json' with { type: 'json' };
import next from '../data/next-routine.json' with { type: 'json' };
import { keyOf } from './exkey.js';

/** Orden cronológico de las rutinas (las hojas del Excel van de la más antigua a la más reciente). */
export const ROUTINES = [
  ...oldRoutines.routines.map((r) => ({ id: r.id, label: r.title.replace(/^Rutina\s+/i, ''), short: r.title.replace(/^Rutina\s+/i, '').replace(/\s*20\d\d/g, '').replace(/\s*-\s*/g, '–') })),
  { id: 'current', label: 'Retoma Octubre', short: 'Retoma Oct' },
  { id: 'next', label: next.title, short: next.short },
];
const order = Object.fromEntries(ROUTINES.map((r, i) => [r.id, i]));

/** exId (de la rutina actual o siguiente) → clave de ejercicio. */
export const KEY_BY_ID = {};
export const META = {}; // key → { name, muscle }
for (const rt of [current, next]) for (const d of rt.days) for (const e of d.exercises) { KEY_BY_ID[e.id] = keyOf(e.name); META[keyOf(e.name)] = { name: e.name, muscle: e.muscle }; }
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
for (const r of oldRoutines.routines) for (const d of r.days) for (const e of d.exercises) META[keyOf(e.name)] ??= { name: e.name, muscle: e.muscle };
// Ejercicios anotados solo en el registro de una hoja (nombres libres): se muestran tal cual, sin músculo.
for (const l of oldLogs.logs) META[keyOf(l.name)] ??= { name: cap(l.name.toLowerCase()), muscle: '' };

/** Sesión hecha en una semana de descarga (sus pesos son al 90 %: no deben servir de base para progresar). */
export const isDeloadSession = (s) => {
  const rt = Object.keys(s.sets)[0]?.startsWith('n') ? next : current;
  return /^Descarga/i.test(rt.weeks[s.weekIndex] ?? '');
};

const wkLabel = (w) => String(w).replace('Semana ', 'S');

/** Puntos del Excel y de las rutinas antiguas, por clave. Cada punto: { key, rid, ord, label, weight, reps, src }. */
function staticPoints() {
  const pts = [];
  for (const l of oldLogs.logs) {
    if (l.weight == null && l.reps == null) continue;
    pts.push({ key: keyOf(l.name), rid: l.routine, ord: order[l.routine] * 1000 + (l.session ?? 0), label: `${ROUTINES[order[l.routine]].short} · ses. ${l.session}`, weight: l.weight ?? 0, reps: l.reps, src: 'old' });
  }
  current.days.forEach((d) => d.exercises.forEach((e) => e.history.forEach((h) => {
    pts.push({ key: keyOf(e.name), rid: 'current', ord: order.current * 1000 + h.w, label: `${ROUTINES[order.current].short} · ${wkLabel(current.weeks[h.w])}`, weight: h.weight, reps: h.reps, src: 'xls', alt: !!h.alt });
  })));
  return pts;
}
const STATIC = staticPoints();

/** Todos los puntos de un ejercicio (por clave), ordenados cronológicamente, incluyendo las sesiones terminadas de la app. */
export function pointsFor(key, sessions = []) {
  const pts = STATIC.filter((p) => p.key === key);
  for (const s of sessions) {
    if (!s.finishedAt) continue;
    for (const [exId, sets] of Object.entries(s.sets)) {
      if (KEY_BY_ID[exId] !== key) continue;
      const done = sets.filter((x) => x.done && x.r > 0);
      if (!done.length) continue;
      const best = done.reduce((a, b) => ((b.w || 0) * b.r > (a.w || 0) * a.r ? b : a));
      const rid = exId.startsWith('n') ? 'next' : 'current';
      const rt = rid === 'next' ? next : current;
      pts.push({ key, rid, ord: order[rid] * 1000 + 500 + s.finishedAt / 1e13, label: `${ROUTINES[order[rid]].short} · ${wkLabel(rt.weeks[s.weekIndex] ?? '')}`, weight: best.w || 0, reps: best.r, src: 'app', at: s.finishedAt });
    }
  }
  return pts.sort((a, b) => a.ord - b.ord);
}

/** Lista de ejercicios con datos (estáticos o de sesiones), con su recuento. */
export function exerciseList(sessions = []) {
  const keys = new Set(STATIC.map((p) => p.key));
  for (const s of sessions) if (s.finishedAt) for (const id of Object.keys(s.sets)) if (KEY_BY_ID[id]) keys.add(KEY_BY_ID[id]);
  for (const k of Object.keys(META)) if (current.days.concat(next.days).some((d) => d.exercises.some((e) => keyOf(e.name) === k))) keys.add(k);
  return [...keys].map((key) => ({ key, ...(META[key] ?? { name: key, muscle: '' }), n: pointsFor(key, sessions).length })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
}

/** Estimación de 1RM (Epley); 0 kg o sin reps → null. */
export const e1rm = (p) => (p.weight > 0 && p.reps > 0 ? Math.round(p.weight * (1 + p.reps / 30) * 10) / 10 : null);
