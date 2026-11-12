// Extrae los pesos registrados en las hojas antiguas (bloques EJERCICIO / DÍA-SESIÓN / SERIES / PESO / REPS).
// Uso: node scripts/import-old-logs.mjs <rutinas-antiguas.xlsx> <old-logs.json>
import XLSX from 'xlsx';
import fs from 'node:fs';
const [,, src, out] = process.argv;
const old = JSON.parse(fs.readFileSync(new URL('../src/data/old-routines.json', import.meta.url), 'utf8'));
const s = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const num = (v) => { if (v === '' || v == null) return null; const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const norm = (t) => s(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const STOP = new Set(['de', 'en', 'con', 'la', 'el', 'a', 'y', 'del']);
const toks = (t) => new Set(norm(t).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((w) => w && !STOP.has(w)));
const jac = (a, b) => { const i = [...a].filter((x) => b.has(x)).length; return i / (a.size + b.size - i || 1); };

const wb = XLSX.readFile(src);
const logs = [], warns = [];
for (const r of old.routines) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[r.sheet], { header: 1, defval: '' });
  const heads = [];
  rows.forEach((row, i) => row.forEach((c, k) => { if (norm(c) === 'ejercicio' && /dia\s*\/\s*sesi/.test(norm(row[k + 1]))) heads.push({ i, k }); }));
  const cols = [...new Set(heads.map((h) => h.k))].sort((a, b) => a - b);
  for (const k of cols) {
    const copies = new Set(); // el Excel repite a veces el bloque entero: se ignora la copia idéntica
    const day = cols.indexOf(k);
    const mine = heads.filter((h) => h.k === k).sort((a, b) => a.i - b.i);
    const candidates = r.days[day]?.exercises ?? [];
    mine.forEach((h, n) => {
      const end = mine[n + 1]?.i ?? rows.length;
      let name = '';
      const part = [];
      for (let i = h.i + 1; i < end; i++) {
        const row = rows[i];
        if (s(row[k - 1]) === '→') name = s(row[k]);
        else if (s(row[k])) name = s(row[k]);
        const session = num(row[k + 1]), sets = num(row[k + 2]), weight = num(row[k + 3]), reps = num(row[k + 4]);
        if (weight == null && reps == null) continue;
        if (!name) { warns.push(`[revisar] hoja ${r.sheet} fila ${i + 1}: peso sin ejercicio`); continue; }
        const best = candidates.map((c) => [jac(toks(name), toks(c.name)), c]).sort((a, b) => b[0] - a[0])[0];
        const full = best && best[0] >= 0.5 ? best[1].name : name;
        const rec = { routine: r.id, day: day + 1, name: full, session, sets, weight, reps };
        part.push(rec);
        if (full === name && !(best && best[0] >= 0.5)) warns.push(`[revisar] hoja ${r.sheet}: "${name}" sin ejercicio equivalente en el día ${day + 1}`);
      }
      const sig = JSON.stringify(part);
      if (copies.has(sig)) { warns.push(`copia idéntica ignorada: hoja ${r.sheet} día ${day + 1} (${part.length} registros)`); return; }
      copies.add(sig); logs.push(...part);
    });
  }
}
fs.writeFileSync(out, JSON.stringify({ generatedFrom: 'rutinas-antiguas.xlsx', logs }, null, 1));
const by = {}; for (const l of logs) (by[l.routine] ??= {})[l.name] = (by[l.routine][l.name] ?? 0) + 1;
console.log(JSON.stringify(by, null, 1)); console.log(logs.length, 'registros'); console.log([...new Set(warns)].length, 'avisos únicos');
