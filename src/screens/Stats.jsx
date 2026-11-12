import { useMemo, useState } from 'react';
import { useStore } from '../lib/store.js';
import { weekStats } from '../lib/program.js';
import { exerciseList, pointsFor, ROUTINES, e1rm } from '../lib/history.js';
import { fmtNum } from '../lib/feedback.js';

const kg = (p) => `${fmtNum(p.weight)} kg${p.reps ? ` × ${p.reps}` : ''}`;

function Chart({ pts, useReps }) {
  if (pts.length < 2) return <p className="py-8 text-center text-[14px] text-muted">Aún no hay suficientes datos para la gráfica.</p>;
  const W = 320, H = 130, pad = 10;
  const ys = pts.map((p) => (useReps ? p.reps ?? 0 : p.weight));
  const lo = Math.min(...ys), hi = Math.max(...ys), span = hi - lo || 1;
  const xy = pts.map((p, i) => [pad + (i * (W - 2 * pad)) / (pts.length - 1), H - pad - ((ys[i] - lo) / span) * (H - 2 * pad)]);
  const cuts = pts.map((p, i) => (i && p.rid !== pts[i - 1].rid ? (xy[i][0] + xy[i - 1][0]) / 2 : null)).filter((x) => x != null);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={useReps ? 'Evolución de las repeticiones' : 'Evolución del peso en kilos'}>
      {cuts.map((x, i) => <line key={i} x1={x} x2={x} y1="2" y2={H - 2} className="stroke-muted" strokeOpacity="0.35" strokeDasharray="3 4" />)}
      <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" className="stroke-brand" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" strokeWidth="2" className={`stroke-brand ${pts[i].src === 'app' ? 'fill-brand' : 'fill-card'}`} />)}
    </svg>
  );
}

/** Mejor marca por rutina (peso máx; a igual peso, más reps). */
function byRoutine(pts) {
  const rows = [];
  for (const r of ROUTINES) {
    const mine = pts.filter((p) => p.rid === r.id);
    if (!mine.length) continue;
    const best = mine.reduce((a, b) => (b.weight > a.weight || (b.weight === a.weight && (b.reps ?? 0) > (a.reps ?? 0)) ? b : a));
    rows.push({ r, n: mine.length, best, e: Math.max(0, ...mine.map((p) => e1rm(p) ?? 0)) });
  }
  return rows;
}

export default function Stats() {
  const { sessions } = useStore();
  const all = useMemo(() => exerciseList(sessions), [sessions]);
  const [q, setQ] = useState('');
  const [onlyData, setOnlyData] = useState(true);
  const [key, setKey] = useState(all[0].key);
  const ex = all.find((e) => e.key === key) ?? all[0];
  const pts = pointsFor(ex.key, sessions);
  const useReps = pts.length > 0 && pts.every((p) => !p.weight);
  const best = pts.reduce((a, p) => (!a || p.weight > a.weight || (p.weight === a.weight && (p.reps ?? 0) > (a.reps ?? 0)) ? p : a), null);
  const rows = byRoutine(pts);
  const ws = weekStats(sessions);
  const list = all.filter((e) => (!onlyData || e.n > 0) && (e.name + e.muscle).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="px-5 pt-safe pb-nav">
      <h1 className="mt-4 text-[26px]">Progreso</h1>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[['Sesiones', sessions.filter((s) => s.finishedAt && !s.skipped).length], ['Series sem.', ws.sets], ['Vol. sem. (kg)', fmtNum(Math.round(ws.volume))]].map(([l, v]) => (
          <div key={l} className="card p-3"><p className="text-[11px] text-muted">{l}</p><p className="text-[20px] font-semibold tabular-nums">{v}</p></div>
        ))}
      </div>

      <section className="card mt-4 p-4">
        <p className="text-[12px] text-muted">{ex.muscle}{rows.length > 1 ? ` · en ${rows.length} rutinas` : ''}</p>
        <h2 className="text-[18px]">{ex.name}</h2>
        <p className="mb-2 mt-1 text-[13px] text-muted">
          {useReps ? 'Repeticiones (peso corporal)' : 'Peso del mejor set'}{best && !useReps ? ` · récord ${kg(best)}` : ''} · ○ Excel / antiguas · ● app · líneas = cambio de rutina
        </p>
        <Chart pts={pts} useReps={useReps} />
        {rows.length > 0 && (
          <ul className="mt-3 divide-y divide-canvas text-[13px]" aria-label="Mejor marca por rutina">
            {rows.map(({ r, n, best: b, e }) => (
              <li key={r.id} className="flex items-baseline justify-between gap-3 py-2">
                <span className="min-w-0 truncate text-muted">{r.label} <span className="text-[11px]">({n})</span></span>
                <span className="shrink-0 font-semibold tabular-nums">{kg(b)}{e ? <span className="ml-1 text-[11px] font-normal text-muted">1RM≈{fmtNum(Math.round(e))}</span> : null}</span>
              </li>
            ))}
          </ul>
        )}
        {pts.length === 0 && <p className="py-6 text-center text-[14px] text-muted">Sin registros todavía.</p>}
        {pts.length > 0 && (
          <>
            <h3 className="mt-4 text-[13px] text-muted">Últimos registros</h3>
            <ul className="divide-y divide-canvas text-[14px]">
              {[...pts].reverse().slice(0, 6).map((p, i) => (
                <li key={i} className="flex justify-between py-2"><span className="text-muted">{p.label}</span><span className="font-semibold tabular-nums">{kg(p)}</span></li>
              ))}
            </ul>
          </>
        )}
      </section>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ejercicio…" aria-label="Buscar ejercicio"
        className="mt-4 h-12 w-full rounded-pill bg-card px-5 text-[15px] shadow-card" />
      <label className="mt-3 flex items-center gap-2 text-[13px] text-muted"><input type="checkbox" checked={onlyData} onChange={(e) => setOnlyData(e.target.checked)} /> Solo con registros</label>
      <ul className="mt-3 space-y-2">
        {list.map((e) => (
          <li key={e.key}>
            <button onClick={() => { setKey(e.key); window.scrollTo?.(0, 0); }} className={`tap card flex w-full items-center justify-between p-3 text-left ${e.key === ex.key ? 'ring-2 ring-brand' : ''}`}>
              <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{e.name}</span><span className="text-[12px] text-muted">{e.muscle}</span></span>
              <span className="text-[12px] text-muted">{e.n} registros</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
