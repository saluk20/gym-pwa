// Convierte el Excel/CSV de rutinas (windows-1252, separador ;) en src/data/routine.json
// Uso: node scripts/import-csv.mjs "<ruta al csv>"
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SRC = resolve(here, '../../../01-Inbox-Bruto/gym(5).csv');
const OUT = resolve(here, '../src/data/routine.json');

const num = (s) => {
  const t = (s ?? '').trim().replace(',', '.');
  if (t === '' || t.endsWith('%')) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

// "3 min" -> 180 · "45 seg" -> 45 · "2,30 min" -> 150 · "2,3" -> 150 (sin unidad: se asume m,ss)
export function parseRest(raw) {
  const m = (raw ?? '').trim().match(/^(\d+)(?:,(\d+))?\s*(min|seg)?$/i);
  if (!m) return { sec: null, ambiguous: true };
  const [, a, frac, unit] = m;
  if (unit?.toLowerCase() === 'seg') return { sec: Number(a), ambiguous: false };
  const secs = frac ? Number(frac.padEnd(2, '0').slice(0, 2)) : 0;
  return { sec: Number(a) * 60 + secs, ambiguous: !unit };
}

export function parseReps(raw) {
  const t = (raw ?? '').trim().toLowerCase();
  if (t === 'fallo') return { repMin: 0, repMax: null, failure: true };
  const m = t.match(/^(\d+)\s*a\s*(\d+)$/);
  if (m) return { repMin: Number(m[1]), repMax: Number(m[2]), failure: false };
  return { repMin: null, repMax: null, failure: false };
}

export function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.split(';'));
  const days = [];
  const warnings = [];
  let weeks = null;
  let i = 0;
  while (i < lines.length) {
    const row = lines[i];
    const title = (row[0] ?? '').replace(/["	]/g, '').trim();
    if (/^D[ií]a\s*\d/i.test(title) && row.some((c) => /^Semana 1$/.test(c.trim()))) {
      const blocks = [];
      row.forEach((c, idx) => {
        if (idx >= 6 && c.trim()) blocks.push({ label: c.trim(), start: idx });
      });
      const real = blocks.filter((b) => b.label !== 'Fin');
      weeks ??= real.map((b) => b.label);
      const n = Number(title.match(/\d+/)[0]);
      const name = title.replace(/^D[ií]a\s*\d+\s*:?\s*/i, '').trim();
      const day = { id: `d${n}`, n, name, exercises: [], lastWeek: -1 };
      i += 2; // cabecera de columnas
      let k = 0;
      while (i < lines.length && (lines[i][1] ?? '').trim()) {
        const c = lines[i];
        const rest = parseRest(c[5]);
        const reps = parseReps(c[3]);
        const ex = {
          id: `${day.id}e${++k}`,
          muscle: c[0].trim(),
          name: c[1].trim(),
          sets: Number(c[2]),
          repText: c[3].trim(),
          ...reps,
          rir: c[4].trim() === '-' ? '' : c[4].trim(),
          restSec: rest.sec,
          history: [],
        };
        if (rest.ambiguous) warnings.push(`${day.id} "${ex.name}": descanso "${c[5]}" sin unidad, asumido ${rest.sec}s`);
        real.forEach((b, wi) => {
          const weight = num(c[b.start]);
          const r = num(c[b.start + 1]);
          if (weight != null && r != null) {
            ex.history.push({ w: wi, weight, reps: r });
            day.lastWeek = Math.max(day.lastWeek, wi);
          } else if (weight != null || r != null) {
            warnings.push(`${day.id} "${ex.name}" ${b.label}: dato incompleto (peso=${c[b.start]}, reps=${c[b.start + 1]}), ignorado`);
          }
        });
        for (let h = 1; h < ex.history.length; h++) {
          const a = ex.history[h - 1].weight, b = ex.history[h].weight;
          if (a > 0 && (b / a > 1.8 || b / a < 0.55))
            warnings.push(`${day.id} "${ex.name}": salto de peso sospechoso ${a} -> ${b} kg (${weeks[ex.history[h].w]}) [revisar]`);
        }
        day.exercises.push(ex);
        i++;
      }
      days.push(day);
      continue;
    }
    i++;
  }
  return { weeks, days, warnings };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const src = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_SRC;
  const text = new TextDecoder('windows-1252').decode(readFileSync(src));
  const { weeks, days, warnings } = parseCsv(text);
  const out = { generatedFrom: 'gym(5).csv', weeks, days };
  writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
  console.log(`OK ${days.length} días, ${days.reduce((a, d) => a + d.exercises.length, 0)} ejercicios, ${weeks.length} semanas -> ${OUT}`);
  days.forEach((d) => console.log(` ${d.id} ${d.name}: ${d.exercises.length} ej., última semana con datos: ${d.lastWeek >= 0 ? weeks[d.lastWeek] : '—'}`));
  warnings.forEach((w) => console.log(' ! ' + w));
}

