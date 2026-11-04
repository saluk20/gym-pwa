import { useSyncExternalStore } from 'react';
import { dayById, suggestionFor, weeks, cursorOf, weekComplete, lastWeekIndex, DEFAULT_WEEK } from './program.js';
import { weekKey } from './plan.js';

const KEY = 'gym-pwa:v1';
const DEFAULTS = {
  settings: { name: 'Lucas', deload: 0.9, sound: true, steps: {}, weekIndex: DEFAULT_WEEK, updatedAt: 0 },
  sessions: [],
  events: [], // { id, title, date, endDate, type: 'comp'|'trip'|'otro', main, updatedAt, deleted }
  modes: {}, // { [lunes ISO]: { mode, updatedAt } } modo aplicado a esa semana ('' = quitado)
  device: { theme: 'dark', accent: 'ember', syncKey: '', lastSync: 0, syncMsg: '' },
  rest: null, // { endsAt, total, label }
};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && Array.isArray(raw.sessions)) return { ...structuredClone(DEFAULTS), ...raw, settings: { ...DEFAULTS.settings, ...raw.settings }, device: { ...DEFAULTS.device, ...raw.device } };
  } catch {}
  return structuredClone(DEFAULTS);
}

export function applyTheme(d) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = d.theme;
  document.documentElement.dataset.accent = d.accent;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', d.theme === 'dark' ? '#0E0E10' : '#F2F2EF');
}
let state = load();
applyTheme(state.device);
const subs = new Set();
const hooks = new Set(); // cambios locales (para sincronizar)
export const onChange = (f) => (hooks.add(f), () => hooks.delete(f));
function commit(next) {
  state = next;
  applyTheme(state.device);
  hooks.forEach((f) => f());
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
    const soft = state.modes[weekKey(Date.now())]?.mode === 'suave';
    for (const ex of day.exercises) {
      const sug = suggestionFor(ex, day, state);
      const n = soft ? Math.max(1, ex.sets - 1) : ex.sets; // modo Suave: −1 serie, mismo peso
      sets[ex.id] = Array.from({ length: n }, () => ({ w: sug.weight, r: sug.reps, done: false }));
    }
    const id = `s${Date.now()}`;
    commit({
      ...state,
      sessions: [...state.sessions, { id, dayId, weekIndex: cursorOf(day, state), startedAt: Date.now(), finishedAt: null, sets }],
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
      sessions: state.sessions.map((x) => (x.id === sid ? { ...x, sets, finishedAt: Date.now(), updatedAt: Date.now() } : x)),
    });
    // Semana completa (todos los días hechos) → avanza a la siguiente.
    if (weekComplete(state) && state.settings.weekIndex < lastWeekIndex) actions.setSetting({ weekIndex: state.settings.weekIndex + 1 });
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
    commit({ ...state, settings: { ...state.settings, ...patch, updatedAt: Date.now() } });
  },
  setStep(exId, step) {
    commit({ ...state, settings: { ...state.settings, steps: { ...state.settings.steps, [exId]: step }, updatedAt: Date.now() } });
  },
  setDevice(patch) {
    commit({ ...state, device: { ...state.device, ...patch } });
  },
  addEvent(ev) {
    commit({ ...state, events: [...state.events, { ...ev, id: `e${Date.now()}`, updatedAt: Date.now() }] });
  },
  deleteEvent(id) {
    commit({ ...state, events: state.events.map((e) => (e.id === id ? { ...e, deleted: true, updatedAt: Date.now() } : e)) });
  },
  setMode(key, mode) {
    commit({ ...state, modes: { ...state.modes, [key]: { mode, updatedAt: Date.now() } } });
  },
  exportBackup() {
    const { settings, sessions, events, modes } = state;
    return JSON.stringify({ app: 'gym-pwa', v: 2, exportedAt: new Date().toISOString(), settings, sessions, events, modes }, null, 1);
  },
  importBackup(text) {
    const d = JSON.parse(text);
    if (d.app !== 'gym-pwa' || !Array.isArray(d.sessions)) throw new Error('Archivo no válido');
    commit({ ...state, ...mergeDocs(localDoc(state), d), rest: null });
  },
  /** Fusiona un documento remoto con el local (sync). Devuelve el documento resultante. */
  mergeRemote(remote) {
    const m = mergeDocs(localDoc(state), remote || {});
    commit({ ...state, ...m });
    return snapshot(state);
  },
  resetAll() {
    commit({ ...structuredClone(DEFAULTS), settings: state.settings, device: state.device });
  },
};

export const snapshot = (s) => ({ settings: s.settings, sessions: s.sessions.filter((x) => x.finishedAt), events: s.events, modes: s.modes });

const localDoc = (s) => ({ ...snapshot(s), openSessions: s.sessions.filter((x) => !x.finishedAt) });
const byUpdated = (a, b) => ((b?.updatedAt ?? 0) > (a?.updatedAt ?? 0) ? b : a);
/** Unión sin pérdidas: sesiones por id (gana la más reciente), eventos y modos por updatedAt, ajustes por updatedAt. */
export function mergeDocs(local, remote) {
  const mergeList = (a = [], b = []) => {
    const m = new Map();
    for (const x of [...a, ...b]) m.set(x.id, m.has(x.id) ? byUpdated(m.get(x.id), x) : x);
    return [...m.values()];
  };
  const open = (local.openSessions ?? []);
  const modes = { ...(remote.modes ?? {}) };
  for (const [k, v] of Object.entries(local.modes ?? {})) modes[k] = byUpdated(modes[k], v);
  const rs = remote.settings, ls = local.settings;
  const settings = rs && (rs.updatedAt ?? 0) > (ls.updatedAt ?? 0) ? { ...ls, ...rs } : ls;
  return { settings, sessions: [...mergeList(local.sessions, remote.sessions ?? []), ...open], events: mergeList(local.events, remote.events ?? []), modes };
}

export const weekLabel = (wi) => weeks[wi];
