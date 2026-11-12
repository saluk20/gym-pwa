// Fechas del programa. Cada semana del programa ocupa una semana natural (lunes–domingo).
// settings.weekAnchor = { idx, mon }: la semana `idx` empieza el lunes `mon`. Si te retrasas, todo lo posterior se desplaza solo.
const DAY = 864e5;
export const iso = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const mondayOf = (t) => { const d = new Date(t); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
export const addDays = (isoDate, n) => { const [y, m, d] = isoDate.split('-').map(Number); return iso(new Date(y, m - 1, d + n, 12).getTime()); };
/** Confirmado por el usuario el 2026-11-12: «voy por la S6» (semana del lunes 9 nov). Solo se usa si aún no hay ancla guardada. */
export const DEFAULT_ANCHOR = { idx: 6, mon: '2026-11-09' };

/** Lunes de la semana actual del programa (nunca anterior a la semana natural en curso: si vas con retraso, se desplaza). */
export function currentMonday(settings, weekIndex, now = Date.now()) {
  const a = settings?.weekAnchor ?? DEFAULT_ANCHOR;
  const planned = addDays(a.mon, 7 * (weekIndex - a.idx));
  const today = iso(mondayOf(now));
  return planned > today ? planned : today;
}
/** Ancla tras avanzar a la semana siguiente (auto) o tras fijarla a mano (manual: la semana elegida es esta). */
export const anchorAfter = (settings, fromIdx, toIdx, manual, now = Date.now()) =>
  ({ idx: toIdx, mon: manual ? iso(mondayOf(now)) : addDays(currentMonday(settings, fromIdx, now), 7 * (toIdx - fromIdx)) });

/** Semanas de una rutina con sus fechas: [{ label, mon, sun, deload }]. */
export const routineWeeks = (weeks, firstMon) => weeks.map((label, i) => ({ label, mon: addDays(firstMon, 7 * i), sun: addDays(firstMon, 7 * i + 6), deload: /^Descarga/i.test(label) }));
/** Lunes en que empieza la rutina siguiente: el posterior al final de la última semana. */
export const nextStartIso = (settings, weekIndex, lastIndex, now = Date.now()) => addDays(currentMonday(settings, weekIndex, now), 7 * (lastIndex - weekIndex + 1));

export const daysUntil = (isoDate, now = Date.now()) => { const [y, m, d] = isoDate.split('-').map(Number); return Math.round((new Date(y, m - 1, d, 12).getTime() - new Date(now).setHours(12, 0, 0, 0)) / DAY); };
const fmt = (o) => (isoDate) => new Date(isoDate + 'T12:00:00').toLocaleDateString('es-ES', o);
export const fmtLong = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const fmtShort = fmt({ day: 'numeric', month: 'short' });
