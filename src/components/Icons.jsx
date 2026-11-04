const P = ({ children, size = 22, fill = 'none', sw = 1.8, ...r }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...r}>
    {children}
  </svg>
);
export const HomeIcon = ({ filled, ...p }) => (
  <P {...p} fill={filled ? 'currentColor' : 'none'}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></P>
);
export const DumbbellIcon = (p) => (
  <P {...p}><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" /></P>
);
export const ChartIcon = (p) => (<P {...p}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></P>);
export const UserIcon = (p) => (<P {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></P>);
export const SearchIcon = (p) => (<P {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></P>);
export const BellIcon = ({ off, ...p }) => (
  <P {...p}><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4" />{off && <path d="M4 4l16 16" />}</P>
);
export const CheckIcon = (p) => (<P {...p} sw={2.6}><path d="m5 12.5 4.5 4.5L19 7.5" /></P>);
export const PlusIcon = (p) => (<P {...p} sw={2.4}><path d="M12 5v14M5 12h14" /></P>);
export const MinusIcon = (p) => (<P {...p} sw={2.4}><path d="M5 12h14" /></P>);
export const ChevronLeft = (p) => (<P {...p}><path d="m15 5-7 7 7 7" /></P>);
export const ChevronRight = (p) => (<P {...p}><path d="m9 5 7 7-7 7" /></P>);
export const ClockIcon = (p) => (<P {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></P>);
export const PlayIcon = (p) => (<P {...p} fill="currentColor" sw={0}><path d="M8 5v14l11-7z" /></P>);
export const BoltIcon = (p) => (<P {...p}><path d="M13 3 5 14h6l-1 7 8-11h-6z" /></P>);
export const CalendarIcon = (p) => (<P {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></P>);
export const ListIcon = (p) => (<P {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></P>);
export const GearIcon = (p) => (<P {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" /></P>);
export const StarIcon = (p) => (<P {...p} fill="currentColor" sw={1}><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" /></P>);
export const TrashIcon = (p) => (<P {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></P>);
