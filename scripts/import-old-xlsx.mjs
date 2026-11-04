import XLSX from 'xlsx';
import fs from 'node:fs';
const [,, src, out] = process.argv;
const wb = XLSX.readFile(src);
const s = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const num = (v) => { if (v === '' || v == null) return null; const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const restSec = (t) => { // "3 min" "45 seg" "2,30 min" -> 2:30
  const bare = s(t).match(/^([\d.,]+)$/); if (bare) { const v = +bare[1].replace(',', '.'); return /^\d[.,]3$/.test(bare[1]) ? Math.floor(v) * 60 + 30 : v >= 10 ? Math.round(v) : null; }
  const m = s(t).toLowerCase().match(/^([\d.,]+)\s*(min|seg|s)/); if (!m) return null;
  const v = m[1].replace(',', '.');
  if (m[2] !== 'min') return Math.round(+v);
  const [a, b = '0'] = m[1].split(/[.,]/);
  return b.length === 2 && +b >= 10 && +b < 60 ? +a * 60 + +b : Math.round(+v * 60);
};
const routines = [], warns = [];
for (const name of wb.SheetNames.filter((n) => ['1','2','3','4','5'].includes(n))) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
  const title = rows.slice(0, 4).flat().map(s).find((x) => /^rutina/i.test(x)) || `Hoja ${name}`;
  const days = [];
  for (let i = 0; i < rows.length; i++) {
    const hdr = rows[i + 1];
    if (!hdr || !hdr.some((c) => /^m[uú]sculo$/i.test(s(c)))) continue;
    const c0 = hdr.findIndex((c) => /^m[uú]sculo$/i.test(s(c)));
    const col = (re) => hdr.findIndex((c) => re.test(s(c)));
    const ci = { ex: col(/^ejercicio$/i), sets: col(/^series$/i), reps: col(/^reps obj/i), rir: col(/^rir$/i), rest: col(/^desc/i) };
    const titleRow = rows[i];
    const dayName = s(titleRow.find((c) => /d[ií]a/i.test(s(c)))).replace(/^d[ií]a\s*\d*\s*[:\-]?\s*/i, '') || `Día ${days.length + 1}`;
    const weeks = [];
    titleRow.forEach((c, k) => { if (/^(semana|back off|descarga)/i.test(s(c))) weeks.push({ label: s(c), c: k }); });
    for (const w of weeks) { // Peso/Reps buscados por cabecera
      for (let k = w.c; k < w.c + 4; k++) { const h = s(hdr[k]).toLowerCase(); if (h === 'peso') w.p = k; if (h === 'reps') w.r = k; }
    }
    const exs = [];
    for (let j = i + 2; j < rows.length && s(rows[j][ci.ex]); j++) {
      const r = rows[j];
      const rt = restSec(r[ci.rest]);
      if (s(r[ci.rest]) && rt == null) warns.push(`[revisar] hoja ${name} ${s(r[ci.ex])}: descanso "${s(r[ci.rest])}"`);
      const log = [];
      for (const w of weeks) { const p = num(r[w.p]), rp = num(r[w.r]); if (p != null || rp != null) log.push({ w: w.label, weight: p, reps: rp }); }
      exs.push({ muscle: s(r[c0]), name: s(r[ci.ex]), sets: num(r[ci.sets]), reps: s(r[ci.reps]), rir: s(r[ci.rir]), restSec: rt, log });
    }
    days.push({ name: dayName, exercises: exs });
  }
  routines.push({ id: `old-${name}`, sheet: name, title, days });
}
fs.writeFileSync(out, JSON.stringify({ generatedFrom: 'rutinas-antiguas.xlsx', routines, warns }, null, 1));
for (const r of routines) console.log(r.sheet, JSON.stringify(r.title), r.days.length + ' días', r.days.map((d) => d.name + ':' + d.exercises.length + '/' + d.exercises.reduce((a, e) => a + e.log.length, 0)).join(' | '));
console.log(warns);
