import { useEffect, useState } from 'react';
import { useStore, actions } from '../lib/store.js';
import { dayById, suggestionFor, weeks, stepOf, sessionSets, sessionVolume, isDeloadWeek } from '../lib/program.js';
import { KIND_LABEL } from '../lib/progression.js';
import { fmtNum, fmtClock, keepAwake, unlockAudio } from '../lib/feedback.js';
import RestTimer from '../components/RestTimer.jsx';
import { ChevronLeft, CheckIcon, PlusIcon, MinusIcon } from '../components/Icons.jsx';

const STEPS = [1, 1.25, 2, 2.5, 5];

/** − valor + ; el valor también se puede teclear. */
function Stepper({ value, step, onChange, label, wide }) {
  const [txt, setTxt] = useState(null);
  const commit = () => {
    const n = parseFloat(String(txt).replace(',', '.'));
    if (Number.isFinite(n) && n >= 0) onChange(Math.round(n * 100) / 100);
    setTxt(null);
  };
  const bump = (d) => onChange(Math.max(0, Math.round((value + d) * 100) / 100));
  return (
    <div className="flex items-center" role="group" aria-label={label}>
      <button onClick={() => bump(-step)} aria-label={`${label} menos`} className="tap grid h-11 w-11 place-items-center rounded-full bg-card2"><MinusIcon size={18} /></button>
      <input
        inputMode="decimal" aria-label={label}
        value={txt ?? fmtNum(value)}
        onFocus={(e) => (setTxt(fmtNum(value)), e.target.select())}
        onChange={(e) => setTxt(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        className={`${wide ? 'w-[58px]' : 'w-[40px]'} bg-transparent text-center text-[20px] font-semibold tabular-nums`}
      />
      <button onClick={() => bump(step)} aria-label={`${label} más`} className="tap grid h-11 w-11 place-items-center rounded-full bg-card2"><PlusIcon size={18} /></button>
    </div>
  );
}

function ExerciseCard({ ex, day, session, state, onSetDone }) {
  const rows = session.sets[ex.id];
  const step = stepOf(ex, state.settings);
  const sug = suggestionFor(ex, day, { ...state, sessions: state.sessions.filter((s) => s.id !== session.id) });
  const doneN = rows.filter((r) => r.done).length;
  const cycleStep = () => actions.setStep(ex.id, STEPS[(STEPS.indexOf(step) + 1) % STEPS.length] ?? 2.5);

  return (
    <section className="card p-4" aria-label={ex.name}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] text-muted">{ex.muscle}</p>
          <h3 className="text-[17px] leading-snug">{ex.name}</h3>
        </div>
        <span className="shrink-0 rounded-pill bg-card2 px-3 py-1 text-[12px] font-semibold tabular-nums">{doneN}/{rows.length}</span>
      </div>
      <p className="mt-1 text-[13px] text-muted">
        {ex.sets} × {ex.repText}{ex.rir ? ` · RIR ${ex.rir}` : ''} · descanso {fmtClock(ex.restSec ?? 0)}
      </p>
      <p className="mt-2 text-[13px]">
        <span className={`rounded-pill px-2.5 py-1 font-semibold ${sug.kind === 'weight' ? 'bg-brand text-onbrand' : 'bg-card2 text-brand'}`}>{KIND_LABEL[sug.kind]}</span>
        {sug.last && (
          <span className="ml-2 text-muted">
            Última: {fmtNum(sug.last.weight)} kg × {sug.last.minReps}{sug.last.source === 'xls' ? ' (Excel)' : ''}
          </span>
        )}
      </p>

      {session.warm?.[ex.id] && (
        <ol className="mt-3 space-y-2" aria-label="Calentamiento y aproximación">
          {session.warm[ex.id].map((r, i) => (
            <li key={i} className={`flex items-center justify-between gap-1 rounded-[20px] border border-dashed border-brand/40 p-2 ${r.done ? 'bg-brand/10' : ''}`}>
              <span className="w-12 text-center text-[11px] font-semibold leading-tight text-brand">{r.kind === 'cal' ? 'Calent.' : 'Aprox.'}<br /><span className="text-muted">{fmtClock(r.restSec)}</span></span>
              <Stepper label="Peso" wide value={r.w} step={step} onChange={(w) => actions.updateWarm(session.id, ex.id, i, { w })} />
              <Stepper label="Repeticiones" value={r.r} step={1} onChange={(v) => actions.updateWarm(session.id, ex.id, i, { r: v })} />
              <button onClick={() => { unlockAudio(); actions.toggleWarm(session.id, ex.id, i, ex.name); }} aria-pressed={r.done} aria-label={r.done ? 'Desmarcar' : 'Completar calentamiento'}
                className={`tap grid h-12 w-12 shrink-0 place-items-center rounded-full ${r.done ? 'bg-brand text-onbrand' : 'border-2 border-brand/40 text-brand'}`}>
                <CheckIcon size={22} />
              </button>
            </li>
          ))}
        </ol>
      )}
      <ol className="mt-3 space-y-2">
        {rows.map((r, i) => (
          <li key={i} className={`flex items-center justify-between gap-1 rounded-[20px] p-2 transition-colors ${r.done ? 'bg-brand/10' : 'bg-card2'}`}>
            <span className="w-5 text-center text-[13px] font-semibold text-muted">{i + 1}</span>
            <div className="flex flex-col items-center">
              <Stepper label="Peso" wide value={r.w} step={step} onChange={(w) => actions.updateSet(session.id, ex.id, i, { w })} />
            </div>
            <Stepper label="Repeticiones" value={r.r} step={1} onChange={(v) => actions.updateSet(session.id, ex.id, i, { r: v })} />
            <button
              onClick={() => onSetDone(ex, i)} aria-pressed={r.done} aria-label={r.done ? 'Desmarcar serie' : 'Completar serie'}
              className={`tap grid h-12 w-12 shrink-0 place-items-center rounded-full ${r.done ? 'bg-brand text-onbrand' : 'border-2 border-brand/40 text-brand'}`}>
              <CheckIcon size={22} />
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex items-center justify-between text-[13px]">
        <div className="flex gap-2">
          <button onClick={() => actions.addSet(session.id, ex.id)} className="tap rounded-pill bg-card2 px-3 py-2 font-semibold">+ serie</button>
          {rows.length > 1 && <button onClick={() => actions.removeSet(session.id, ex.id)} className="tap rounded-pill bg-card2 px-3 py-2 font-semibold">− serie</button>}
        </div>
        <button onClick={cycleStep} className="tap rounded-pill bg-card2 px-3 py-2 font-semibold" aria-label="Cambiar salto de peso">salto {fmtNum(step)} kg</button>
      </div>
    </section>
  );
}

export default function Workout({ dayId, onClose }) {
  const state = useStore();
  const day = dayById(dayId);
  const [sid, setSid] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { setSid(actions.startSession(dayId)); }, [dayId]);
  useEffect(() => {
    keepAwake(true);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => (keepAwake(false), clearInterval(t));
  }, []);

  const session = state.sessions.find((s) => s.id === sid);
  if (!session) return null;

  const onSetDone = (ex, i) => {
    unlockAudio();
    const cur = session.sets[ex.id][i];
    const remaining = Object.values(session.sets).flat().filter((x) => !x.done).length;
    const becomesDone = !cur.done;
    const rest = becomesDone && remaining === 1 ? 0 : ex.restSec; // última serie del día: sin descanso
    actions.toggleSet(session.id, ex.id, i, rest, ex.name);
    if (becomesDone) // el peso elegido se arrastra a las series pendientes del ejercicio
      session.sets[ex.id].forEach((x, k) => { if (k > i && !x.done && x.w !== cur.w) actions.updateSet(session.id, ex.id, k, { w: cur.w }); });
  };

  const wi = session.weekIndex;
  const nDone = sessionSets(session);
  const total = Object.values(session.sets).flat().length;
  const finish = () => { actions.finishSession(session.id); onClose(); };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas">
      <div className="mx-auto max-w-[430px] px-5 pt-safe" style={{ paddingBottom: 'calc(150px + env(safe-area-inset-bottom))' }}>
        <header className="sticky top-0 z-10 -mx-5 flex items-center justify-between bg-canvas/95 px-5 pb-3 pt-2 backdrop-blur">
          <button onClick={onClose} className="btn-round" aria-label="Volver"><ChevronLeft /></button>
          <div className="text-center">
            <p className="text-[12px] text-muted">{weeks[wi]}{isDeloadWeek(wi) ? ' · descarga' : ''} · {fmtClock(Math.floor((now - session.startedAt) / 1000))}</p>
            <p className="text-[15px] font-semibold">Día {day.n} · {nDone}/{total} series</p>
          </div>
          <button onClick={() => setConfirm(true)} className="tap h-11 rounded-pill bg-ink px-4 text-[14px] font-semibold text-canvas">Terminar</button>
        </header>

        <div className="mt-2 space-y-4">
          {day.exercises.map((ex) => (
            <ExerciseCard key={ex.id} ex={ex} day={day} session={session} state={state} onSetDone={onSetDone} />
          ))}
        </div>
      </div>

      <RestTimer bottom={16} />

      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 p-4" onClick={() => setConfirm(false)}>
          <div className="card w-full max-w-[400px] p-5" onClick={(e) => e.stopPropagation()} style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
            <h2 className="text-[20px]">Terminar entreno</h2>
            <p className="mt-1 text-[14px] text-muted">{nDone} series · {fmtNum(Math.round(sessionVolume(session)))} kg de volumen. Solo cuentan las series marcadas ✓.</p>
            <button onClick={finish} className="tap mt-4 h-12 w-full rounded-pill bg-brand text-[16px] font-semibold text-onbrand">{nDone ? 'Guardar' : 'Salir sin guardar'}</button>
            <button onClick={() => setConfirm(false)} className="tap mt-2 h-12 w-full rounded-pill bg-card2 text-[16px] font-semibold">Seguir entrenando</button>
            {nDone > 0 && (
              <button onClick={() => { actions.discardSession(session.id); onClose(); }} className="tap mt-2 h-12 w-full text-[14px] font-semibold text-danger">Descartar entreno</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
