import { HomeIcon, DumbbellIcon, ChartIcon, UserIcon } from './Icons.jsx';

const ITEMS = [
  { id: 'home', label: 'Inicio', Icon: HomeIcon },
  { id: 'workouts', label: 'Rutinas', Icon: DumbbellIcon },
  { id: 'stats', label: 'Progreso', Icon: ChartIcon },
  { id: 'profile', label: 'Perfil', Icon: UserIcon },
];

/** Píldora blanca flotante; el activo = píldora brand con icono relleno + etiqueta blanca */
export default function Nav({ tab, onTab }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-5" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
      <ul className="flex w-full max-w-[400px] items-center justify-between rounded-pill bg-card p-2 shadow-nav">
        {ITEMS.map(({ id, label, Icon }) => {
          const on = tab === id;
          return (
            <li key={id}>
              <button onClick={() => onTab(id)} aria-current={on ? 'page' : undefined} aria-label={label}
                className={`tap flex h-12 items-center gap-2 rounded-pill transition-all ${on ? 'bg-brand px-4 text-white' : 'w-12 justify-center text-muted'}`}>
                <Icon filled={on} />
                {on && <span className="text-[14px] font-semibold">{label}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
