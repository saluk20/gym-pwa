import { useState } from 'react';
import { useStore, actions } from '../lib/store.js';
import { recommend, appliedMode, MODES, MODE_HINT, iso, weekKey } from '../lib/plan.js';
import { weeks, currentWeek } from '../lib/program.js';
import { ChevronLeft, ChevronRight, PlusIcon, StarIcon, TrashIcon } from '../components/Icons.jsx';

const TYPES = { comp: 'Competición / Prueba', trip: 'Viaje / Parada', otro: 'Otro' };
const MODE_COLOR = { apretar: 'bg-hot/20 text-hot', normal: 'bg-card2 text-muted', suave: 'bg-active/20 text-active', descanso: 'bg-rest/20 text-rest' };

function EventForm({ onClose }) {
  const [f, setF] = useState({ title: '', date: iso(Date.now()), endDate: '', type: 'comp', main: true });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const ok = f.title.trim() && f.date;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-[420px] space-y-3 p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[20px]">Nuevo evento</h2>
        <input autoFocus placeholder="Título (p. ej. Competición Jerez)" value={f.title} onChange={(e) => set('title', e.target.value)} className="h-12 w-full rounded-pill bg-card2 px-4 text-[16px]" />
        <div className="flex gap-2">
          {Object.entries(TYPES).map(([k, v]) => (
            <button key={k} onClick={() => set('type', k)} className={`tap flex-1 rounded-pill px-2 py-2 text-[12px] font-semibold ${f.type === k ? 'bg-brand text-onbrand' : 'bg-card2 text-muted'}`}>{v}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[12px] text-muted">Desde<input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} className="mt-1 h-11 w-full rounded-pill bg-card2 px-3 text-[15px] text-ink" /></label>
          <label className="text-[12px] text-muted">Hasta (opcional)<input type="date" value={f.endDate} min={f.date} onChange={(e) => set('endDate', e.target.value)} className="mt-1 h-11 w-full rounded-pill bg-card2 px-3 text-[15px] text-ink" /></label>
        </div>
        <button disabled={!ok} onClick={() => { actions.addEvent({ ...f, title: f.title.trim(), endDate: f.endDate || '' }); onClose(); }} className="tap h-12 w-full rounded-pill bg-brand text-[16px] font-semibold text-onbrand disabled:opacity-40">Guardar</button>
      </div>
    </div>
  );
}

function Calendar({ events, sessions }) {
  const [m, setM] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const first = (m.getDay() + 6) % 7;
  const n = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const today = iso(Date.now());
  const cells = [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => iso(new Date(m.getFullYear(), m.getMonth(), i + 1).getTime()))];
  const done = new Set(sessions.filter((s) => s.finishedAt).map((s) => iso(s.finishedAt)));
  const evOn = (k) => events.some((e) => e.date <= k && k <= (e.endDate || e.date));
  return (
    <section className="card mt-4 p-4" aria-label="Calendario">
      <div className="flex items-center justify-between">
        <button className="tap p-2" aria-label="Mes anterior" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() - 1, 1))}><ChevronLeft /></button>
        <p className="text-[16px] font-semibold capitalize">{m.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
        <button className="tap p-2" aria-label="Mes siguiente" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() + 1, 1))}><ChevronRight /></button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-1 text-center">
        {[...'LMXJVSD'].map((d, i) => <span key={i} className="text-[11px] text-muted">{d}</span>)}
        {cells.map((k, i) => k ? (
          <div key={i} className="flex flex-col items-center">
            <span className={`grid h-9 w-9 place-items-center rounded-full text-[14px] ${k === today ? 'bg-brand font-semibold text-onbrand' : evOn(k) ? 'bg-hot/20 font-semibold text-hot' : ''}`}>{Number(k.slice(8))}</span>
            <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${done.has(k) ? 'bg-brand' : ''}`} />
          </div>
        ) : <span key={i} />)}
      </div>
      <p className="mt-2 flex items-center gap-3 text-[11px] text-muted"><span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" /> entreno hecho <span className="inline-block h-2.5 w-2.5 rounded-full bg-hot/40" /> evento</p>
    </section>
  );
}

export default function Plan() {
  const st = useStore();
  const [adding, setAdding] = useState(false);
  const events = st.events.filter((e) => !e.deleted).sort((a, b) => a.date.localeCompare(b.date));
  const rec = recommend(events);
  const key = weekKey(Date.now());
  const applied = appliedMode(st.modes);
  const upcoming = events.filter((e) => (e.endDate || e.date) >= iso(Date.now()));

  return (
    <div className="px-5 pt-safe pb-nav">
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-[28px]">Plan</h1>
        <button className="btn-round" aria-label="Añadir evento" onClick={() => setAdding(true)}><PlusIcon /></button>
      </div>

      <section className="card mt-4 p-5" aria-label="Recomendación">
        {applied && <p className="mb-2 text-[12px] text-muted">Modo de esta semana (aplicado)</p>}
        {rec || applied ? (
          <>
            <span className={`rounded-pill px-3 py-1 text-[12px] font-semibold uppercase ${MODE_COLOR[applied || rec.mode]}`}>{MODES[applied || rec.mode]}</span>
            <p className="mt-3 text-[15px]">{MODE_HINT[applied || rec.mode]}</p>
            {rec && <p className="mt-1 text-[13px] text-muted">Motivo: {rec.reasons.join(' · ')}{rec.others.length ? ` (también: ${rec.others.join('; ')})` : ''}</p>}
            <div className="mt-4 flex gap-2">
              {applied ? (
                <button onClick={() => actions.setMode(key, '')} className="tap h-11 flex-1 rounded-pill bg-card2 text-[14px] font-semibold">Quitar modo</button>
              ) : (
                <>
                  <button onClick={() => actions.setMode(key, rec.mode)} className="tap h-11 flex-1 rounded-pill bg-brand text-[14px] font-semibold text-onbrand">Aplicar a esta semana</button>
                  <button onClick={() => actions.setMode(key, 'normal')} className="tap h-11 rounded-pill bg-card2 px-5 text-[14px] font-semibold">Ignorar</button>
                </>
              )}
            </div>
            <p className="mt-3 text-[11px] text-muted">Pautas generales, no consejo médico ni deportivo. Solo «Suave» cambia el entreno (−1 serie).</p>
          </>
        ) : (
          <p className="text-[15px]">Sigue tu ciclo · {weeks[currentWeek(st)]}. Añade competiciones o viajes y te propongo cómo ajustar la semana.</p>
        )}
      </section>

      <Calendar events={events} sessions={st.sessions} />

      <h2 className="mt-6 text-[20px]">Próximos eventos</h2>
      <ul className="mt-3 space-y-2">
        {upcoming.length === 0 && <li className="text-[14px] text-muted">Ninguno todavía.</li>}
        {upcoming.map((e) => (
          <li key={e.id} className="card flex items-center gap-3 p-4">
            <span className="text-hot"><StarIcon size={18} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{e.title}</p>
              <p className="text-[12px] text-muted">{TYPES[e.type]} · {e.date}{e.endDate ? ` → ${e.endDate}` : ''}</p>
            </div>
            <button aria-label="Eliminar evento" className="tap p-2 text-danger" onClick={() => confirm(`¿Eliminar «${e.title}»?`) && actions.deleteEvent(e.id)}><TrashIcon size={18} /></button>
          </li>
        ))}
      </ul>
      {adding && <EventForm onClose={() => setAdding(false)} />}
    </div>
  );
}
