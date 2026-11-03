import { useStore, activeSession, actions } from '../lib/store.js';
import { days, nextDay, cursorOf, weeks, weekStats, plannedSets, estMinutes, isDeloadWeek } from '../lib/program.js';
import { fmtNum } from '../lib/feedback.js';
import { Rings } from '../components/Ring.jsx';
import Thumb from '../components/Thumb.jsx';
import { SearchIcon, BellIcon, CheckIcon } from '../components/Icons.jsx';

const greeting = () => {
  const h = new Date().getHours();
  return h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
};
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

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

export default function Home({ go, openWorkout }) {
  const st = useStore();
  const { sessions, settings } = st;
  const ws = weekStats(sessions);
  const next = nextDay(sessions);
  const open = activeSession(st);
  const totalPlanned = days.reduce((a, d) => a + plannedSets(d), 0);
  const volT = ws.volume / 1000;
  const rings = [ws.daysDone / days.length, ws.sets / totalPlanned, ws.prevVolume ? ws.volume / ws.prevVolume : ws.volume ? 1 : 0];
  const doneToday = (d) => sessions.some((s) => s.dayId === d.id && s.finishedAt && sameDay(s.finishedAt, Date.now()));

  return (
    <div className="px-5 pt-safe pb-nav">
      <header className="flex items-center justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-brand text-[18px] font-semibold text-white" aria-label="Perfil">
          {settings.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex gap-3">
          <button className="btn-round" aria-label="Buscar ejercicio" onClick={() => go('stats')}><SearchIcon /></button>
          <button className="btn-round" aria-label={settings.sound ? 'Silenciar descanso' : 'Activar sonido'} onClick={() => actions.setSetting({ sound: !settings.sound })}>
            <BellIcon off={!settings.sound} className={settings.sound ? '' : 'text-muted'} />
          </button>
        </div>
      </header>

      <h1 className="mt-6 text-[26px] leading-tight">{greeting()}, {settings.name}</h1>
      <p className="mt-1 text-[14px] text-muted">Esta semana · {ws.daysDone} de {days.length} días</p>

      <section className="card mt-5 flex items-center gap-5 p-5" aria-label="Actividad semanal">
        <Rings values={rings} colors={['#F2704F', '#F5A524', '#4C8DFF']} />
        <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-4">
          <Stat color="#F2704F" label="Días" value={`${ws.daysDone}/${days.length}`} />
          <Stat color="#F5A524" label="Series" value={ws.sets} />
          <Stat color="#4C8DFF" label="Volumen" value={`${fmtNum(Math.round(volT * 10) / 10)} t`} />
          <Stat color="#FF4D6D" label="Minutos" value={ws.minutes} />
        </div>
      </section>

      {open && (
        <button onClick={() => openWorkout(open.dayId)} className="tap card mt-4 flex w-full items-center justify-between border-2 border-brand p-4 text-left">
          <div>
            <p className="text-[12px] font-semibold text-brand">Entreno en curso</p>
            <p className="text-[16px] font-semibold">Día {open.dayId.slice(1)} · continuar</p>
          </div>
          <span className="rounded-pill bg-brand px-4 py-2 text-[14px] font-semibold text-white">Continuar</span>
        </button>
      )}

      <div className="mt-7 flex items-center justify-between">
        <h2 className="text-[20px]">Rutina</h2>
        <button onClick={() => go('workouts')} className="text-[14px] font-semibold text-brand">Ver todo</button>
      </div>

      <ul className="mt-3 space-y-3">
        {days.map((d) => {
          const wi = cursorOf(d, sessions);
          const done = doneToday(d);
          const isNext = !done && d.id === next.id;
          return (
            <li key={d.id}>
              <button onClick={() => openWorkout(d.id)} className="tap card flex w-full items-center gap-4 p-3 text-left">
                <Thumb title={d.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-muted">Día {d.n} · {weeks[wi]}{isDeloadWeek(wi) ? ' ⬇' : ''}</p>
                  <p className="truncate text-[16px] font-semibold">{d.name}</p>
                  <p className="text-[13px] text-muted">{d.exercises.length} ejercicios · ~{estMinutes(d)} min</p>
                </div>
                {done ? (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white"><CheckIcon size={16} /></span>
                ) : isNext ? (
                  <span className="rounded-pill bg-brand px-3 py-1 text-[12px] font-semibold text-white">Siguiente</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
