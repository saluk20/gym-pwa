// Miniatura por grupo muscular (sin fotos con licencia: degradado + icono; se puede sustituir por fotos en public/).
const TINT = {
  Espalda: ['#FFE3DA', '#F2704F'],
  Pecho: ['#FFE9C7', '#F5A524'],
  Pierna: ['#DDE9FF', '#4C8DFF'],
  default: ['#F0E6E1', '#F2704F'],
};
export default function Thumb({ title, size = 64 }) {
  const key = Object.keys(TINT).find((k) => title.includes(k)) ?? 'default';
  const [a, b] = TINT[key];
  return (
    <div className="grid shrink-0 place-items-center rounded-[18px]" style={{ width: size, height: size, background: `linear-gradient(135deg, ${a}, #fff)` }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke={b} strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
      </svg>
    </div>
  );
}
