// Sobrecarga progresiva (doble progresión), funciones puras.
// Regla: si en el peso máximo de la última vez TODAS las series llegaron al tope del rango -> sube peso y vuelve al mínimo del rango.
// Si no, mismo peso y +1 rep (acotado al rango). "fallo": siempre +1 rep, nunca sube peso.
// Semana "Descarga": peso = último × factor (ajustes), mismas reps.

export const DEFAULT_STEP = 2.5;

export const roundTo = (v, step) => Math.round(v / step) * step;
export const clean = (n) => Math.round(n * 100) / 100;

/** sets: [{w, r}] (solo las hechas). Devuelve el set "top": peso máximo y reps mínimas a ese peso. */
export function topSet(sets) {
  const v = sets.filter((s) => s.w != null && s.r > 0);
  if (!v.length) return null;
  const weight = Math.max(...v.map((s) => s.w));
  const at = v.filter((s) => s.w === weight);
  return { weight, minReps: Math.min(...at.map((s) => s.r)), count: at.length };
}

/**
 * Última marca del ejercicio. Prioriza lo registrado en la app (sesiones terminadas, la más reciente);
 * si no hay, usa el último dato del Excel.
 */
export function lastPerformance(ex, sessions) {
  const done = sessions
    .filter((s) => s.finishedAt && s.sets[ex.id])
    .sort((a, b) => b.finishedAt - a.finishedAt);
  for (const s of done) {
    const top = topSet(s.sets[ex.id].filter((x) => x.done));
    if (top) return { ...top, source: 'app', at: s.finishedAt, weekIndex: s.weekIndex };
  }
  const validHistory = ex.history.filter((x) => !x.alt);
  const h = (validHistory.length ? validHistory : ex.history).slice().sort((a, b) => b.w - a.w)[0];
  if (h) return { weight: h.weight, minReps: h.reps, count: 1, source: 'xls', weekIndex: h.w, note: h.note };
  return null;
}

/** ex.repMax null => "fallo". opts: { step, deload (factor), isDeload } */
export function suggest(ex, last, opts = {}) {
  const step = opts.step || DEFAULT_STEP;
  if (!last) return { kind: 'new', weight: 0, reps: ex.repMin || 8 };

  if (ex.failure) return { kind: 'reps', weight: last.weight, reps: last.minReps + 1 };

  if (opts.isDeload) {
    const w = Math.max(0, roundTo(last.weight * (opts.deload ?? 0.9), Math.min(step, 1.25)));
    return { kind: 'deload', weight: clean(w), reps: Math.min(ex.repMax, Math.max(ex.repMin, last.minReps)) };
  }
  if (last.minReps >= ex.repMax) return { kind: 'weight', weight: clean(last.weight + step), reps: ex.repMin };
  if (last.minReps < ex.repMin) return { kind: 'hold', weight: last.weight, reps: ex.repMin };
  return { kind: 'reps', weight: last.weight, reps: Math.min(ex.repMax, last.minReps + 1) };
}

export const KIND_LABEL = {
  new: 'Primera vez · elige peso',
  weight: 'Sube peso',
  reps: '+1 rep',
  hold: 'Mantén peso',
  deload: 'Descarga',
};
