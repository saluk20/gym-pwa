import { HomeIcon, DumbbellIcon, ChartIcon, CalendarIcon, ListIcon, PlayIcon } from './Icons.jsx';

const LEFT = [{ id: 'home', label: 'Home', Icon: HomeIcon }, { id: 'plan', label: 'Plan', Icon: CalendarIcon }];
const RIGHT = [{ id: 'stats', label: 'Stats', Icon: ChartIcon }, { id: 'routines', label: 'Rutinas', Icon: ListIcon }];

function Item({ id, label, Icon, tab, onTab }) {
  return (
    <li className="flex-1">
      <button onClick={() => onTab(id)} aria-current={tab === id ? 'page' : undefined}
        className={`tap flex h-14 w-full flex-col items-center justify-center gap-0.5 ${tab === id ? 'text-brand' : 'text-muted'}`}>
        <Icon filled={tab === id} size={22} />
        <span className="text-[11px] font-semibold">{label}</span>
      </button>
    </li>
  );
}

/** Barra anclada de 5 ítems; el central redondo «Empezar» (o «Continuar» si hay sesión abierta). */
export default function Nav({ tab, onTab, onStart, resume }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-card shadow-nav" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <ul className="mx-auto flex h-[72px] max-w-[430px] items-center px-2">
        {LEFT.map((i) => <Item key={i.id} {...i} tab={tab} onTab={onTab} />)}
        <li className="flex-1">
          <button onClick={onStart} aria-label={resume ? 'Continuar entreno' : 'Empezar entreno'}
            className="tap mx-auto -mt-5 grid h-16 w-16 place-items-center rounded-full bg-brand text-onbrand shadow-lg">
            {resume ? <PlayIcon size={26} /> : <DumbbellIcon size={28} />}
          </button>
          <span className="block text-center text-[11px] font-semibold text-brand">{resume ? 'Continuar' : 'Empezar'}</span>
        </li>
        {RIGHT.map((i) => <Item key={i.id} {...i} tab={tab} onTab={onTab} />)}
      </ul>
    </nav>
  );
}
