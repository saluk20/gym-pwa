import { useEffect, useState } from 'react';
import { actions, useStore } from '../lib/store.js';
import { beep, alarmPlaying, fmtClock } from '../lib/feedback.js';
import { TimerRing } from './Ring.jsx';

/** Cronómetro de descanso automático: basado en marca de tiempo (sobrevive a segundo plano / recarga). */
export default function RestTimer({ bottom = 16 }) {
  const { rest, settings } = useStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!rest) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [rest?.endsAt]);

  const left = rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0;
  const done = rest && left === 0;

  useEffect(() => {
    if (!done) return;
    // Suena hasta que se pulsa «Desactivar alerta». En segundo plano lo hace el WAV; si no suena, pitidos en primer plano.
    const ring = () => {
      if (!settings.sound) return navigator.vibrate?.([200, 100, 200]);
      if (!alarmPlaying()) beep(3);
      else navigator.vibrate?.([200, 100, 200]);
    };
    ring();
    const t = setInterval(ring, 2500);
    return () => clearInterval(t);
  }, [done, rest?.endsAt]);

  if (!rest) return null;
  if (done)
    return (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-6" role="alertdialog" aria-live="assertive" aria-label="Descanso terminado">
        <div className="card w-full max-w-[340px] p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand text-3xl text-onbrand">⏰</div>
          <h2 className="mt-4 text-[22px]">¡Descanso terminado!</h2>
          <p className="mt-1 text-[14px] text-muted">A por la siguiente serie</p>
          <button onClick={() => actions.stopRest()} className="tap mt-5 h-14 w-full rounded-pill bg-brand text-[17px] font-semibold text-onbrand">Desactivar alerta</button>
        </div>
      </div>
    );
  return (
    <div className="fixed inset-x-0 z-40 flex justify-center px-4" style={{ bottom: `calc(${bottom}px + env(safe-area-inset-bottom))` }} role="timer" aria-live="off">
      <div className={`flex w-full max-w-[400px] items-center gap-3 rounded-card p-3 shadow-nav ${done ? 'bg-brand text-onbrand' : 'bg-card'}`}>
        <div className="relative grid place-items-center">
          <TimerRing progress={done ? 1 : left / rest.total} />
          {done && <span className="absolute text-xl">✓</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[12px] ${done ? 'text-onbrand/80' : 'text-muted'}`}>{done ? '¡A la siguiente serie!' : 'Descanso'}</p>
          <p className="text-[28px] font-semibold leading-none tabular-nums">{fmtClock(left)}</p>
        </div>
        {!done && (
          <>
            <button onClick={() => actions.adjustRest(-15)} className="tap h-10 rounded-pill bg-card2 px-3 text-[14px] font-semibold">−15</button>
            <button onClick={() => actions.adjustRest(15)} className="tap h-10 rounded-pill bg-card2 px-3 text-[14px] font-semibold">+15</button>
          </>
        )}
        <button onClick={() => actions.stopRest()} className={`tap h-10 rounded-pill px-4 text-[14px] font-semibold ${done ? 'bg-card2 text-brand' : 'bg-ink text-canvas'}`}>
          {done ? 'Ok' : 'Saltar'}
        </button>
      </div>
    </div>
  );
}
