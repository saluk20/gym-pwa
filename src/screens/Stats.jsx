import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { days, timeline, weekStats } from '../lib/program.js';
import { fmtNum } from '../lib/feedback.js';

function Chart({ pts }) {
  if (pts.length < 2) return <p className="py-8 text-center text-[14px] text-muted">Aún no hay suficientes datos para la gráfica.</p>;
  const W = 320, H = 130, pad = 10;
  const ys = pts.map((p) => p.score);
  const lo = Math.min(...ys), hi = Math.max(...ys), span = hi - lo || 1;
  const xy = pts.map((p, i) => [pad + (i * (W - 2 * pad)) / (pts.length - 1), H - pad - ((p.score - lo) / span) * (H - 2 * pad)]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Evolución del score peso por reps">
      <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" stroke="#F2704F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill={pts[i].src === 'app' ? '#F2704F' : '#fff'} stroke="#F2704F" strokeWidth="2" />)}
    </svg>
  );
}

export default function Stats() {
  const { sessions } = useStore();
  const all = days.flatMap((d) => d.exercises.map((e) => ({ ...e, day: d })));
  const [q, setQ] = useState('');
  const [id, setId] = useState(all.find((e) => e.history.length > 1)?.id ?? all[0].id);
  const ex = all.find((e) => e.id === id);
  const pts = timeline(ex, sessions);
  const best = pts.reduce((a, p) => (p.weight > a ? p.weight : a), 0);
  const ws = weekStats(sessions);
  const list = all.filter((e) => (e.name + e.muscle).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="px-5 pt-safe pb-nav">
      <h1 className="mt-4 text-[26px]">Progreso</h1>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[['Sesiones', sessions.filter((s) => s.finishedAt).length], ['Series sem.', ws.sets], ['Vol. sem. (kg)', fmtNum(Math.round(ws.volume))]].map(([l, v]) => (
          <div key={l} className="card p-3"><p className="text-[11px] text-muted">{l}</p><p className="text-[20px] font-semibold tabular-nums">{v}</p></div>
        ))}
      </div>

      <section className="card mt-4 p-4">
        <p className="text-[12px] text-muted">{ex.muscle} · Día {ex.day.n}</p>
        <h2 className="text-[18px]">{ex.name}</h2>
        <p className="mb-2 mt-1 text-[13px] text-muted">Score = peso × reps · máx. {fmtNum(best)} kg · ○ Excel · ● app</p>
        <Chart pts={pts} />
        <ul className="mt-2 divide-y divide-canvas text-[14px]">
          {[...pts].reverse().slice(0, 6).map((p, i) => (
            <li key={i} className="flex justify-between py-2"><span className="text-muted">{p.label}</span><span className="font-semibold tabular-nums">{fmtNum(p.weight)} kg × {p.reps}</span></li>
          ))}
        </ul>
      </section>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ejercicio…" aria-label="Buscar ejercicio"
        className="mt-4 h-12 w-full rounded-pill bg-card px-5 text-[15px] shadow-card" />
      <ul className="mt-3 space-y-2">
        {list.map((e) => (
          <li key={e.id}>
            <button onClick={() => { setId(e.id); window.scrollTo?.(0, 0); }} className={`tap card flex w-full items-center justify-between p-3 text-left ${e.id === id ? 'ring-2 ring-brand' : ''}`}>
              <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{e.name}</span><span className="text-[12px] text-muted">Día {e.day.n} · {e.muscle}</span></span>
              <span className="text-[12px] text-muted">{e.history.length + sessions.filter((s) => s.finishedAt && s.sets[e.id]).length} registros</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
