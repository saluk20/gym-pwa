// Estado derivado del programa: semana actual por día, siguiente día, métricas semanales.
import routine from '../data/routine.json' with { type: 'json' };
import { lastPerformance, suggest, DEFAULT_STEP } from './progression.js';

export const { days, weeks } = routine;
export const dayById = (id) => days.find((d) => d.id === id);
export const exById = (id) => days.flatMap((d) => d.exercises).find((e) => e.id === id);
const LAST_WEEK = weeks.length - 1;

export const DEFAULT_WEEK = 5; // "Semana 5" (índice en weeks)

/** Semana global del ciclo: la misma para todos los días (nunca se arranca desde un hueco). */
export const currentWeek = (state) => Math.min(LAST_WEEK, Math.max(0, state.settings.weekIndex ?? DEFAULT_WEEK));
export const cursorOf = (_day, state) => currentWeek(state);
export const isDeloadWeek = (wi) => /^Descarga/i.test(weeks[wi] ?? '');

/** Un día está hecho en la semana wi si hay sesión terminada de esa semana o dato del Excel de esa semana. */
export function dayDone(day, state, wi = currentWeek(state)) {
  return (
    state.sessions.some((s) => s.dayId === day.id && s.finishedAt && s.weekIndex === wi) ||
    day.exercises.some((e) => e.history.some((h) => h.w === wi))
  );
}
/** Día siguiente = primero del orden del programa que no está hecho en la semana actual. */
export const nextDay = (state) => days.find((d) => !dayDone(d, state)) ?? days[0];
/** Si todos los días están hechos en la semana actual, pasa a la siguiente. */
export const weekComplete = (state) => days.every((d) => dayDone(d, state));
export const lastWeekIndex = LAST_WEEK;

export const stepOf = (ex, settings) => settings.steps?.[ex.id] ?? DEFAULT_STEP;

const norm = (m) => String(m).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const WARMUP_MUSCLES = ['espalda', 'pecho', 'trapecio', 'hombro', 'biceps', 'triceps', 'abdomen'];
/** Calentamiento (2 × 90 s) + aproximación (1 × 180 s) antes del 1.er ejercicio de cada grupo del día. Pesos: % del peso de trabajo, editables. */
export function warmupRows(day, ex, workW, step) {
  const m = norm(ex.muscle);
  if (!WARMUP_MUSCLES.includes(m)) return null;
  if (day.exercises.find((e) => norm(e.muscle) === m)?.id !== ex.id) return null;
  const rw = (p) => (workW > 0 ? Math.max(step, Math.round((workW * p) / step) * step) : 0);
  return [
    { kind: 'cal', w: rw(0.4), r: 12, restSec: 90, done: false },
    { kind: 'cal', w: rw(0.6), r: 8, restSec: 90, done: false },
    { kind: 'apr', w: rw(0.8), r: 4, restSec: 180, done: false },
  ];
}

export function suggestionFor(ex, day, state) {
  const { sessions, settings } = state;
  const last = lastPerformance(ex, sessions);
  const wi = cursorOf(day, state);
  return {
    last,
    ...suggest(ex, last, { step: stepOf(ex, settings), deload: settings.deload, isDeload: isDeloadWeek(wi) }),
  };
}

export const setScore = (s) => (s.done ? (s.w || 0) * (s.r || 0) : 0);
export const sessionVolume = (s) =>
  Object.values(s.sets).reduce((a, arr) => a + arr.reduce((b, x) => b + setScore(x), 0), 0);
export const sessionSets = (s) =>
  Object.values(s.sets).reduce((a, arr) => a + arr.filter((x) => x.done).length, 0);

export const plannedSets = (day) => day.exercises.reduce((a, e) => a + e.sets, 0);
export const estMinutes = (day) =>
  Math.round(day.exercises.reduce((a, e) => a + e.sets * ((e.restSec || 90) + 40), 0) / 60);

const startOfWeek = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
};

export function weekStats(sessions, now = Date.now()) {
  const w0 = startOfWeek(now);
  const prev0 = w0 - 7 * 864e5;
  const fin = sessions.filter((s) => s.finishedAt);
  const cur = fin.filter((s) => s.finishedAt >= w0);
  const prev = fin.filter((s) => s.finishedAt >= prev0 && s.finishedAt < w0);
  const sum = (arr, f) => arr.reduce((a, s) => a + f(s), 0);
  return {
    daysDone: new Set(cur.map((s) => s.dayId)).size,
    sets: sum(cur, sessionSets),
    volume: sum(cur, sessionVolume),
    prevVolume: sum(prev, sessionVolume),
    minutes: Math.round(sum(cur, (s) => (s.finishedAt - s.startedAt) / 6e4)),
  };
}

/** Serie temporal de un ejercicio: Excel + sesiones de la app. score = peso × reps del set top. */
export function timeline(ex, sessions) {
  const pts = ex.history.map((h) => ({
    label: weeks[h.w].replace('Semana ', 'S'),
    weight: h.weight,
    reps: h.reps,
    score: h.weight * h.reps,
    src: 'xls',
  }));
  sessions
    .filter((s) => s.finishedAt && s.sets[ex.id])
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .forEach((s) => {
      const done = s.sets[ex.id].filter((x) => x.done && x.r > 0);
      if (!done.length) return;
      const best = done.reduce((a, b) => ((b.w || 0) * b.r > (a.w || 0) * a.r ? b : a));
      pts.push({
        label: weeks[s.weekIndex].replace('Semana ', 'S'),
        weight: best.w || 0,
        reps: best.r,
        score: (best.w || 0) * best.r,
        src: 'app',
        at: s.finishedAt,
      });
    });
  return pts;
}
