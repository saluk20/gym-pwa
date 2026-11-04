import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { days, cursorOf, weeks, suggestionFor } from '../lib/program.js';
import old from '../data/old-routines.json';
import { KIND_LABEL } from '../lib/progression.js';
import { fmtNum } from '../lib/feedback.js';
import Thumb from '../components/Thumb.jsx';
import { PlayIcon } from '../components/Icons.jsx';

const restTxt = (s) => (s == null ? '[revisar]' : s % 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min` : s >= 60 ? `${s / 60} min` : `${s} s`);

function OldRoutine({ r, onBack }) {
  const [di, setDi] = useState(0);
  const day = r.days[di];
  return (
    <div className="px-5 pt-safe pb-nav">
      <button onClick={onBack} className="tap mt-4 text-[14px] font-semibold text-brand">← Rutinas</button>
      <h1 className="mt-2 text-[24px] leading-tight">{r.title}</h1>
      <p className="text-[13px] text-muted">Archivo de solo lectura · {r.days.length} días</p>
      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
        {r.days.map((d, i) => (
          <button key={i} onClick={() => setDi(i)} className={`tap shrink-0 rounded-pill px-4 py-2 text-[14px] font-semibold ${di === i ? 'bg-brand text-onbrand' : 'bg-card text-muted shadow-card'}`}>Día {i + 1}</button>
        ))}
      </div>
      <p className="mt-4 text-[17px] font-semibold">{day.name}</p>
      <ul className="mt-3 space-y-3">
        {day.exercises.map((e, i) => (
          <li key={i} className="card p-4">
            <p className="text-[12px] text-muted">{e.muscle}</p>
            <p className="text-[16px] font-semibold">{e.name}</p>
            <p className="mt-1 text-[13px] text-muted">{e.sets ?? '[revisar]'} × {e.reps || '[revisar]'}{e.rir && e.rir !== '-' ? ` · RIR ${e.rir}` : ''} · descanso {restTxt(e.restSec)}</p>
            {e.log.length > 0 && <p className="mt-2 text-[12px] text-muted">{e.log.map((l) => `${l.w}: ${l.weight ?? '?'}×${l.reps ?? '?'}`).join(' · ')}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Routines({ openWorkout }) {
  const [oldId, setOldId] = useState(null);
  const sel0 = old.routines.find((r) => r.id === oldId);
  if (sel0) return <OldRoutine r={sel0} onBack={() => setOldId(null)} />;
  return <Active openWorkout={openWorkout} onOld={setOldId} />;
}

function Active({ openWorkout, onOld }) {
  const st = useStore();
  const [sel, setSel] = useState(days[0].id);
  const day = days.find((d) => d.id === sel);
  return (
    <div className="px-5 pt-safe pb-nav">
      <h1 className="mt-4 text-[28px]">Rutinas</h1>
      <p className="text-[13px] text-muted">Activa · Rutina retoma Octubre</p>
      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
        {days.map((d) => (
          <button key={d.id} onClick={() => setSel(d.id)}
            className={`tap shrink-0 rounded-pill px-4 py-2 text-[14px] font-semibold ${sel === d.id ? 'bg-brand text-onbrand' : 'bg-card text-muted shadow-card'}`}>
            Día {d.n}
          </button>
        ))}
      </div>

      <div className="card mt-4 flex items-center gap-4 p-4">
        <Thumb title={day.name} size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold">{day.name}</p>
          <p className="text-[13px] text-muted">Próxima: {weeks[cursorOf(day, st)]}</p>
        </div>
        <button onClick={() => openWorkout(day.id)} className="tap grid h-12 w-12 place-items-center rounded-full bg-brand text-onbrand" aria-label="Empezar entreno"><PlayIcon /></button>
      </div>

      <ul className="mt-4 space-y-3">
        {day.exercises.map((ex) => {
          const s = suggestionFor(ex, day, st);
          return (
            <li key={ex.id} className="card p-4">
              <p className="text-[12px] text-muted">{ex.muscle}</p>
              <p className="text-[16px] font-semibold">{ex.name}</p>
              <p className="mt-1 text-[13px] text-muted">
                {ex.sets} × {ex.repText}{ex.rir ? ` · RIR ${ex.rir}` : ''} · descanso {fmtNum(Math.round(((ex.restSec ?? 0) / 60) * 10) / 10)} min
              </p>
              <p className="mt-2 text-[13px]">
                <span className="rounded-pill bg-card2 px-2.5 py-1 font-semibold text-brand">{KIND_LABEL[s.kind]}</span>{' '}
                {s.kind !== 'new' && <span className="font-semibold">{fmtNum(s.weight)} kg × {s.reps}</span>}
              </p>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 text-[20px]">Antiguas</h2>
      <p className="text-[13px] text-muted">Importadas de tu Excel (solo plan, sin pesos registrados).</p>
      <ul className="mt-3 space-y-3">
        {old.routines.map((r) => (
          <li key={r.id}>
            <button onClick={() => onOld(r.id)} className="tap card flex w-full items-center justify-between p-4 text-left">
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold">{r.title}</p>
                <p className="text-[13px] text-muted">{r.days.length} días · {r.days.reduce((a, d) => a + d.exercises.length, 0)} ejercicios</p>
              </div>
              <span className="text-muted">›</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
