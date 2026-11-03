/** Tres anillos concéntricos (steps/brand, calories/amber, active/blue en el diseño). values: 0..1 */
export function Rings({ values, colors, size = 112, stroke = 11, gap = 4 }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Progreso semanal">
      {values.map((v, i) => {
        const r = c - stroke / 2 - i * (stroke + gap);
        const len = 2 * Math.PI * r;
        return (
          <g key={i} transform={`rotate(-90 ${c} ${c})`}>
            <circle cx={c} cy={c} r={r} fill="none" stroke={colors[i]} strokeOpacity=".16" strokeWidth={stroke} />
            <circle cx={c} cy={c} r={r} fill="none" stroke={colors[i]} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={`${Math.max(0.001, Math.min(1, v)) * len} ${len}`} style={{ transition: 'stroke-dasharray .6s ease' }} />
          </g>
        );
      })}
    </svg>
  );
}

/** Anillo único para el cronómetro de descanso */
export function TimerRing({ progress, size = 52, stroke = 5 }) {
  const r = (size - stroke) / 2, len = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F2704F" strokeOpacity=".18" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F2704F" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${Math.max(0, Math.min(1, progress)) * len} ${len}`} />
    </svg>
  );
}
