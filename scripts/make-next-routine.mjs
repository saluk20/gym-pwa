// Genera src/data/next-routine.json (rutina siguiente) con pesos de partida tomados de la rutina actual.
// Uso: node scripts/make-next-routine.mjs
import fs from 'node:fs';
import { keyOf } from '../src/lib/exkey.js';
const R = (p) => JSON.parse(fs.readFileSync(new URL(`../src/data/${p}`, import.meta.url), 'utf8'));
const cur = R('routine.json');

// 9 semanas: tus bloques reales duran 4–8 semanas (Feb–Mar y Jun 2026), no 17–20.
const weeks = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Descarga 1', 'Semana 5', 'Semana 6', 'Semana 7', 'Semana 8'];

// [músculo, ejercicio, series, reps, RIR, descanso s]
const SPEC = [
  ['Espalda - Trapecio - Bíceps', [
    ['Espalda', 'Jalón al pecho agarre neutro', 3, '8 a 12', '1 a 3', 180],
    ['Espalda', 'Remo en T', 3, '8 a 12', '1 a 3', 180],
    ['Espalda', 'Pullover con cuerda', 3, '16 a 18', '0 a 1', 45],
    ['Trapecio', 'Elevaciones de hombro', 3, '10 a 12', '0 a 1', 120],
    ['Hombro', 'Contractora inversa', 3, '16 a 18', '0 a 1', 45],
    ['Biceps', 'Spider curl barra Z', 3, '6 a 8', '', 150],
    ['Biceps', 'Curl martillo de pie unilateral', 3, '8 a 10', '', 120],
  ]],
  ['Pierna', [
    ['Pierna', 'Sentadilla Hack / Pendular', 4, '8 a 10', '1 a 3', 240],
    ['Pierna', 'Peso muerto rumano', 3, '8 a 10', '1 a 3', 180],
    ['Pierna', 'Extensor de cuadriceps', 3, '10 a 12', '0 a 1', 120],
    ['Pierna', 'Curl femoral', 3, '10 a 15', '0 a 1', 150],
    ['Pierna', 'Aductores en maquina', 3, '10 a 12', '0 a 2', 90],
    ['Pierna', 'Gemelo en prensa', 4, '12 a 16', '0 a 1', 60],
  ]],
  ['Pecho - Hombro - Tríceps', [
    ['Pecho', 'Press inclinado multipower', 3, '6 a 8', '1 a 3', 240],
    ['Pecho', 'Superior en palanca agarre neutro', 3, '8 a 10', '', 180],
    ['Pecho', 'Contractora/Aperturas laterales', 3, '16 a 18', '', 45],
    ['Hombro', 'Superior en palanca agarre abierto', 3, '16 a 18', '', 45],
    ['Hombro', 'Elevaciones laterales en palanca', 4, '10 a 12', '', 150],
    ['Triceps', 'Extensor de codo polea baja katana', 3, '8 a 10', '0 a 2', 150],
    ['Triceps', 'Extensor de codo polea alta rodillas', 2, '10 a 12', '0 a 2', 150],
    ['Triceps', 'Fondos en paralelas', 3, 'fallo', '', 45],
  ]],
  ['Espalda - Hombro - Bíceps', [
    ['Espalda', 'Remo en T', 4, '6 a 8', '1 a 3', 240],
    ['Espalda', 'Remo unilateral en polea', 3, '8 a 10', '1 a 3', 180],
    ['Espalda', 'Jalón al pecho agarre neutro', 3, '16 a 18', '0 a 2', 45],
    ['Espalda', 'Extensión lumbar en banco', 3, '10 a 15', '0 a 1', 90],
    ['Trapecio', 'Elevaciones de hombro', 3, '16 a 18', '0 a 1', 90],
    ['Biceps', 'Curl con mancuernas de pie unilateral', 3, '6 a 8', '0 a 1', 150],
    ['Biceps', 'Curl martillo de pie unilateral', 3, '16 a 18', '0 a 1', 150],
    ['Biceps', 'Curl de bíceps Scott', 3, '16 a 18', '1 a 2', 45],
  ]],
  ['Pecho - Hombro - Tríceps', [
    ['Pecho', 'Press inclinado con mancuernas', 3, '6 a 8', '1 a 3', 180],
    ['Pecho', 'Contractora/Aperturas laterales', 3, '10 a 12', '0 a 1', 180],
    ['Hombro', 'Press militar', 4, '8 a 10', '1 a 3', 120],
    ['Hombro', 'Elevaciones laterales en palanca', 4, '16 a 18', '', 45],
    ['Triceps', 'Extensor de codo polea baja', 3, '8 a 10', '', 150],
    ['Triceps', 'Extensor de codo polea alta tumbado', 2, '8 a 10', '', 150],
    ['Triceps', 'Press frances con mancuerna', 3, '16 a 18', '1 a 2', 45],
  ]],
];

// Último dato (no alternativo) de la rutina actual, por ejercicio → peso de partida.
const last = new Map();
for (const d of cur.days) for (const e of d.exercises) {
  const h = e.history.filter((x) => !x.alt).sort((a, b) => b.w - a.w)[0];
  if (h && (!last.has(keyOf(e.name)) || h.w > last.get(keyOf(e.name)).w)) last.set(keyOf(e.name), h);
}

const days = SPEC.map(([name, exs], di) => ({
  id: `n${di + 1}`, n: di + 1, name,
  exercises: exs.map(([muscle, exName, sets, repText, rir, restSec], ei) => {
    const m = repText.match(/^(\d+) a (\d+)$/);
    const h = last.get(keyOf(exName));
    return {
      id: `n${di + 1}e${ei + 1}`, muscle, name: exName, sets, repText,
      repMin: m ? +m[1] : 0, repMax: m ? +m[2] : null, failure: repText === 'fallo', rir, restSec,
      history: [],
      ...(h ? { seed: { weight: h.weight, reps: h.reps, from: cur.weeks[h.w] } } : {}),
    };
  }),
}));

const out = {
  generatedFrom: 'make-next-routine.mjs',
  title: 'Rutina Febrero 2027',
  short: 'Feb 2027',
  weeks,
  days,
  changes: [
    'Pierna pasa al Día 2: la app propone el siguiente día pendiente en orden, así la pierna ya no se queda la última. El compuesto va primero (Hack), se añade peso muerto rumano para femoral y glúteo, y aductores baja de 7 a 3 series.',
    'Dura 9 semanas (4 + descarga + 4), no 17–20: tus bloques reales duran 4–8 semanas.',
    'Trapecio: 2 días (pesado en Día 1, ligero en Día 4) en vez de 1.',
    'Press inclinado: multipower en el Día 3 y mancuernas en el Día 5 (la de mancuernas bajó un 12 % en la actual).',
    'Día 1 pasa a llamarse «Bíceps»: en la actual se llama Tríceps pero solo entrena bíceps.',
    'Se mantienen los ejercicios que progresan (contractora, remo unilateral, laterales, curl Scott, extensión lumbar).',
  ],
};
fs.writeFileSync(new URL('../src/data/next-routine.json', import.meta.url), JSON.stringify(out, null, 1));
const vol = {}; for (const d of days) for (const e of d.exercises) vol[e.muscle] = (vol[e.muscle] ?? 0) + e.sets;
console.log('series/semana', vol, '· ejercicios con peso de partida:', days.flatMap((d) => d.exercises).filter((e) => e.seed).length, '/', days.flatMap((d) => d.exercises).length);
