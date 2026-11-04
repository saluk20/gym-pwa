import { useStore, activeSession } from '../lib/store.js';
import { days, nextDay, cursorOf, dayDone, weeks, weekStats, plannedSets, estMinutes, isDeloadWeek } from '../lib/program.js';
import { recommend, appliedMode, MODES, iso, weekKey } from '../lib/plan.js';
import { fmtNum } from '../lib/feedback.js';
import { Rings } from '../components/Ring.jsx';
import Thumb from '../components/Thumb.jsx';
import { GearIcon, StarIcon, CheckIcon } from '../components/Icons.jsx';

const greeting = () => {
  const h = new Date().getHours();
  return h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
};

function Stat({ color, value, label }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <span className="text-[12px] text-muted">{label}</span>
      </div>
      <p className="text-[20px] font-semibold leading-tight tabular-nums">{value}</p>
    </div>
  );
}

function WeekStrip({ st }) {
  const mon = new Date(weekKey(Date.now()) + 'T12:00:00');
  const today = iso(Date.now());
  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {Array.from({ length: 7 }, (_, i) => {
        const d = new Date(mon); d.setDate(mon.getDate() + i);
        const key = iso(d.getTime());
        const did = st.sessions.some((s) => s.finishedAt && iso(s.finishedAt) === key);
        const star = st.events.some((e) => !e.deleted && e.date <= key && key <= (e.endDate || e.date));
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[11px] text-muted">{'LMXJVSD'[i]}</span>
            <span className={`grid h-9 w-9 place-items-center rounded-full text-[14px] font-semibold ${key === today ? 'bg-brand text-onbrand' : did ? 'bg-brand/20 text-brand' : ''}`}>{d.getDate()}</span>
            <span className="h-3 text-hot">{star && <StarIcon size={10} />}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Home({ go, openWorkout }) {
  const st = useStore();
  const { sessions, settings } = st;
  const ws = weekStats(sessions);
  const next = nextDay(st);
  const rec = recommend(st.events);
  const mode = appliedMode(st.modes);
  const open = activeSession(st);
  const totalPlanned = days.reduce((a, d) => a + plannedSets(d), 0);
  const volT = ws.volume / 1000;
  const rings = [ws.daysDone / days.length, ws.sets / totalPlanned, ws.prevVolume ? ws.volume / ws.prevVolume : ws.volume ? 1 : 0];

  return (
    <div className="px-5 pt-safe pb-nav">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[13px] capitalize text-muted">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-1 text-[28px] leading-tight">{greeting()}, {settings.name}</h1>
        </div>
        <button className="btn-round" aria-label="Ajustes" onClick={() => go('profile')}><GearIcon /></button>
      </header>

      <section className="card mt-5 p-4" aria-label="Semana">
        <WeekStrip st={st} />
        <button onClick={() => openWorkout(open ? open.dayId : next.id)} className="tap mt-3 flex w-full items-center justify-between rounded-pill bg-card2 py-2 pl-4 pr-2 text-left">
          <span className="min-w-0 truncate text-[14px]"><b>{open ? 'EN CURSO' : 'HOY'} · Día {(open ? open.dayId.slice(1) : next.n)}</b> · {weeks[cursorOf(next, st)]}</span>
          <span className="rounded-pill bg-brand px-4 py-2 text-[13px] font-semibold text-onbrand">{open ? 'Continuar' : 'Empezar'}</span>
        </button>
      </section>

      {(mode || rec) && (
        <button onClick={() => go('plan')} className="tap card mt-3 flex w-full items-center gap-3 p-4 text-left">
          <span className="rounded-pill bg-hot/20 px-3 py-1 text-[12px] font-semibold uppercase text-hot">{MODES[mode || rec.mode]}</span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{mode ? 'Modo aplicado esta semana' : `Recomendado: ${rec.reasons[0]}`}</span>
        </button>
      )}

      <section className="card mt-3 flex items-center gap-5 p-5" aria-label="Actividad semanal">
        <Rings values={rings} colors={['rgb(var(--c-brand))', 'rgb(var(--c-series))', 'rgb(var(--c-volume))']} />
        <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-4">
          <Stat color="rgb(var(--c-brand))" label="Días" value={`${ws.daysDone}/${days.length}`} />
          <Stat color="rgb(var(--c-series))" label="Series" value={ws.sets} />
          <Stat color="rgb(var(--c-volume))" label="Volumen" value={`${fmtNum(Math.round(volT * 10) / 10)} t`} />
          <Stat color="rgb(var(--c-hot))" label="Minutos" value={ws.minutes} />
        </div>
      </section>

      <div className="mt-7 flex items-center justify-between">
        <h2 className="text-[20px]">Rutina · {weeks[cursorOf(next, st)]}</h2>
        <button onClick={() => go('routines')} className="text-[14px] font-semibold text-brand">Ver todo</button>
      </div>

      <ul className="mt-3 space-y-3">
        {days.map((d) => {
          const done = dayDone(d, st);
          const isNext = !done && d.id === next.id;
          return (
            <li key={d.id}>
              <button onClick={() => openWorkout(d.id)} className="tap card flex w-full items-center gap-4 p-3 text-left">
                <Thumb title={d.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-muted">Día {d.n}{isDeloadWeek(cursorOf(d, st)) ? ' · descarga' : ''}</p>
                  <p className="truncate text-[16px] font-semibold">{d.name}</p>
                  <p className="text-[13px] text-muted">{d.exercises.length} ejercicios · ~{estMinutes(d)} min</p>
                </div>
                {done ? (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-onbrand"><CheckIcon size={16} /></span>
                ) : isNext ? (
                  <span className="rounded-pill bg-brand px-3 py-1 text-[12px] font-semibold text-onbrand">Siguiente</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
