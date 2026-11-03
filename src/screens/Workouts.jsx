import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { days, cursorOf, weeks, suggestionFor } from '../lib/program.js';
import { KIND_LABEL } from '../lib/progression.js';
import { fmtNum } from '../lib/feedback.js';
import Thumb from '../components/Thumb.jsx';
import { PlayIcon } from '../components/Icons.jsx';

export default function Workouts({ openWorkout }) {
  const st = useStore();
  const [sel, setSel] = useState(days[0].id);
  const day = days.find((d) => d.id === sel);
  return (
    <div className="px-5 pt-safe pb-nav">
      <h1 className="mt-4 text-[26px]">Rutinas</h1>
      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
        {days.map((d) => (
          <button key={d.id} onClick={() => setSel(d.id)}
            className={`tap shrink-0 rounded-pill px-4 py-2 text-[14px] font-semibold ${sel === d.id ? 'bg-brand text-white' : 'bg-card text-muted shadow-card'}`}>
            Día {d.n}
          </button>
        ))}
      </div>

      <div className="card mt-4 flex items-center gap-4 p-4">
        <Thumb title={day.name} size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold">{day.name}</p>
          <p className="text-[13px] text-muted">Próxima: {weeks[cursorOf(day, st.sessions)]}</p>
        </div>
        <button onClick={() => openWorkout(day.id)} className="tap grid h-12 w-12 place-items-center rounded-full bg-brand text-white" aria-label="Empezar entreno"><PlayIcon /></button>
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
                <span className="rounded-pill bg-canvas px-2.5 py-1 font-semibold text-brand">{KIND_LABEL[s.kind]}</span>{' '}
                {s.kind !== 'new' && <span className="font-semibold">{fmtNum(s.weight)} kg × {s.reps}</span>}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
