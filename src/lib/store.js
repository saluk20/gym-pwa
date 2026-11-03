import { useSyncExternalStore } from 'react';
import { dayById, suggestionFor, weeks, cursorOf } from './program.js';

const KEY = 'gym-pwa:v1';
const DEFAULTS = {
  settings: { name: 'Lucas', deload: 0.9, sound: true, steps: {} },
  sessions: [],
  rest: null, // { endsAt, total, label }
};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && Array.isArray(raw.sessions)) return { ...DEFAULTS, ...raw, settings: { ...DEFAULTS.settings, ...raw.settings } };
  } catch {}
  return structuredClone(DEFAULTS);
}

let state = load();
const subs = new Set();
function commit(next) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  subs.forEach((f) => f());
}
const subscribe = (f) => (subs.add(f), () => subs.delete(f));
export const useStore = () => useSyncExternalStore(subscribe, () => state);
export const getState = () => state;

const patchSession = (id, fn) =>
  commit({ ...state, sessions: state.sessions.map((s) => (s.id === id ? fn(s) : s)) });

export const activeSession = (st = state) => st.sessions.find((s) => !s.finishedAt) ?? null;

export const actions = {
  /** Abre (o retoma) la sesión de un día, con las series precargadas con la sugerencia de sobrecarga. */
  startSession(dayId) {
    const open = activeSession();
    if (open) {
      if (open.dayId === dayId) return open.id;
      // Hay otra sesión sin terminar: se descarta si está vacía, si no se retoma esa.
      const touched = Object.values(open.sets).some((a) => a.some((x) => x.done));
      if (touched) return open.id;
      commit({ ...state, sessions: state.sessions.filter((s) => s.id !== open.id) });
    }
    const day = dayById(dayId);
    const sets = {};
    for (const ex of day.exercises) {
      const sug = suggestionFor(ex, day, state);
      sets[ex.id] = Array.from({ length: ex.sets }, () => ({ w: sug.weight, r: sug.reps, done: false }));
    }
    const id = `s${Date.now()}`;
    commit({
      ...state,
      sessions: [...state.sessions, { id, dayId, weekIndex: cursorOf(day, state.sessions), startedAt: Date.now(), finishedAt: null, sets }],
    });
    return id;
  },
  updateSet(sid, exId, i, patch) {
    patchSession(sid, (s) => ({ ...s, sets: { ...s.sets, [exId]: s.sets[exId].map((x, k) => (k === i ? { ...x, ...patch } : x)) } }));
  },
  /** Marca/desmarca una serie. Al marcar, arranca el descanso automático del ejercicio. */
  toggleSet(sid, exId, i, restSec, label) {
    const s = state.sessions.find((x) => x.id === sid);
    const now = !s.sets[exId][i].done;
    patchSession(sid, (ss) => ({
      ...ss,
      sets: { ...ss.sets, [exId]: ss.sets[exId].map((x, k) => (k === i ? { ...x, done: now, at: now ? Date.now() : undefined } : x)) },
    }));
    if (now && restSec) actions.startRest(restSec, label);
    if (!now) actions.stopRest();
    return now;
  },
  addSet(sid, exId) {
    patchSession(sid, (s) => {
      const arr = s.sets[exId];
      const last = arr[arr.length - 1] ?? { w: 0, r: 8 };
      return { ...s, sets: { ...s.sets, [exId]: [...arr, { w: last.w, r: last.r, done: false }] } };
    });
  },
  removeSet(sid, exId) {
    patchSession(sid, (s) => (s.sets[exId].length > 1 ? { ...s, sets: { ...s.sets, [exId]: s.sets[exId].slice(0, -1) } } : s));
  },
  finishSession(sid) {
    const s = state.sessions.find((x) => x.id === sid);
    const any = Object.values(s.sets).some((a) => a.some((x) => x.done));
    if (!any) return commit({ ...state, sessions: state.sessions.filter((x) => x.id !== sid), rest: null });
    // Las series no marcadas no cuentan: se descartan para no contaminar la progresión.
    const sets = Object.fromEntries(Object.entries(s.sets).map(([k, a]) => [k, a.filter((x) => x.done)]).filter(([, a]) => a.length));
    commit({
      ...state,
      rest: null,
      sessions: state.sessions.map((x) => (x.id === sid ? { ...x, sets, finishedAt: Date.now() } : x)),
    });
  },
  discardSession(sid) {
    commit({ ...state, rest: null, sessions: state.sessions.filter((x) => x.id !== sid) });
  },
  startRest(sec, label = '') {
    commit({ ...state, rest: { endsAt: Date.now() + sec * 1000, total: sec, label } });
  },
  adjustRest(deltaSec) {
    if (!state.rest) return;
    const endsAt = Math.max(Date.now() + 1000, state.rest.endsAt + deltaSec * 1000);
    commit({ ...state, rest: { ...state.rest, endsAt, total: Math.max(1, state.rest.total + deltaSec) } });
  },
  stopRest() {
    if (state.rest) commit({ ...state, rest: null });
  },
  setSetting(patch) {
    commit({ ...state, settings: { ...state.settings, ...patch } });
  },
  setStep(exId, step) {
    commit({ ...state, settings: { ...state.settings, steps: { ...state.settings.steps, [exId]: step } } });
  },
  exportBackup() {
    return JSON.stringify({ app: 'gym-pwa', v: 1, exportedAt: new Date().toISOString(), settings: state.settings, sessions: state.sessions }, null, 1);
  },
  importBackup(text) {
    const d = JSON.parse(text);
    if (d.app !== 'gym-pwa' || !Array.isArray(d.sessions)) throw new Error('Archivo no válido');
    commit({ ...DEFAULTS, settings: { ...DEFAULTS.settings, ...d.settings }, sessions: d.sessions, rest: null });
  },
  resetAll() {
    commit(structuredClone(DEFAULTS));
  },
};

export const weekLabel = (wi) => weeks[wi];
