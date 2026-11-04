// Recomendación de modo semanal a partir de eventos futuros. Reglas fijas y transparentes (pautas generales, no consejo deportivo).
export const CFG = {
  compRestDays: 2, // competición en ≤2 días (o hoy) → Descanso
  compSoftDays: 7, // ≤7 días → Suave
  compPushMaxDays: 28, // 8–28 días → Apretar
  afterSoftDays: 7, // semana posterior a competición → Suave
  tripMinReturn: 7, // parada ≥7 días → Suave la semana de vuelta
};
export const MODES = { apretar: 'Apretar', normal: 'Normal', suave: 'Suave', descanso: 'Descanso' };
const RANK = { descanso: 3, suave: 2, normal: 1, apretar: 0 }; // gana el más conservador
export const MODE_HINT = {
  apretar: 'Sube al tope del rango de reps/peso sugerido; sin añadir series.',
  normal: 'Sigue el ciclo.',
  suave: '−1 serie por ejercicio, mismo peso.',
  descanso: 'Solo movilidad o una sesión ligera opcional.',
};

const DAY = 864e5;
export const iso = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const at0 = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
export const dayDiff = (from, toIso) => Math.round((at0(toIso) - at0(iso(from))) / DAY);
/** Lunes (ISO) de la semana de t. */
export const weekKey = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d.getTime()); };

/** Devuelve { mode, reasons: [...] } o null si no hay eventos relevantes (nunca se inventan recomendaciones). */
export function recommend(events, now = Date.now(), cfg = CFG) {
  const found = [];
  for (const e of events.filter((x) => !x.deleted)) {
    const end = e.endDate || e.date;
    const toStart = dayDiff(now, e.date), toEnd = dayDiff(now, end);
    const dur = dayDiff(at0(e.date), end) + 1;
    if (e.type === 'comp') {
      if (toStart < 0 && toStart >= -cfg.afterSoftDays) found.push(['suave', `Tras ${e.title} (hace ${-toStart} d)`]);
      else if (toStart >= 0 && toStart <= cfg.compRestDays) found.push(['descanso', toStart === 0 ? `${e.title} es hoy` : `${e.title} en ${toStart} d`]);
      else if (toStart > cfg.compRestDays && toStart <= cfg.compSoftDays) found.push(['suave', `${e.title} en ${toStart} d`]);
      else if (toStart > cfg.compSoftDays && toStart <= cfg.compPushMaxDays) found.push(['apretar', `${e.title} en ${toStart} d`]);
    } else if (e.type === 'trip') {
      if (toStart <= 0 && toEnd >= 0) found.push(['descanso', `${e.title}: en curso`]);
      else if (toEnd < 0 && toEnd >= -cfg.afterSoftDays && dur >= cfg.tripMinReturn) found.push(['suave', `Vuelta de ${e.title}`]);
    }
  }
  if (!found.length) return null;
  found.sort((a, b) => RANK[b[0]] - RANK[a[0]]);
  return { mode: found[0][0], reasons: found.filter((f) => f[0] === found[0][0]).map((f) => f[1]), others: found.slice(1).map((f) => `${MODES[f[0]]}: ${f[1]}`) };
}

/** Modo efectivo de la semana: el aplicado por el usuario ('' = quitado) o ninguno. */
export const appliedMode = (modes, t = Date.now()) => modes[weekKey(t)]?.mode || '';
