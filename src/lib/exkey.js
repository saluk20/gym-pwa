// Identidad de ejercicio entre rutinas: nombre normalizado + equivalencias explícitas (variantes de agarre/escritura).
export const norm = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// [nombre canónico, ...variantes que son el mismo ejercicio]. Solo se unen equivalentes claros; el resto queda separado.
const GROUPS = [
  ['jalon al pecho', 'jalon al pecho agarre neutro'],
  ['remo en t', 'remo en t agarre neutro', 'remo t agarre neutro'],
  ['contractora', 'contractora/aperturas laterales', 'contractors pecho'],
  ['curl femoral', 'curl femoral tumbado', 'femoral tumbado en maquina'],
  ['sentadilla hack', 'sentadilla en maquina hack', 'sentadilla hack / pendular', 'hacka', 'sentadilla pendular'],
  ['extensor de cuadriceps', 'extension de cuadriceps'],
  ['elevaciones de hombro', 'elevaciones de hombro (trapecio)'],
  ['elevaciones laterales en palanca', 'laterales en palanca'],
  ['elevaciones laterales en polea baja', 'elevaciones laterales polea baja'],
  ['extensor de codo polea alta rodillas', 'extensor de codo rodillas'],
  ['press inclinado multipower', 'pres banca inclinado multipower', 'press banca inclinado multipower'],
  ['banca plano en palanca', 'banco plano en palanca'],
  ['press frances con barra', 'press frances barra z'],
  ['press frances con mancuerna', 'frances con mancuernas'],
  ['pullover con cuerda', 'pullover', 'pullover con cuerda baja'],
  ['curl de biceps scott', 'curl banco scott', 'curl banco scott barra z', 'curl scott en maquina'],
  ['curl martillo sentado', 'martillo unilateral sentado'],
  ['pajaro en banco inclinado', 'pajaros en banco'],
];
const CANON = new Map(GROUPS.flatMap(([c, ...v]) => [c, ...v].map((n) => [n, c])));
export const keyOf = (name) => { const n = norm(name); return CANON.get(n) ?? n; };
