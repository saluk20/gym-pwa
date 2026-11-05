// Sonido + vibración al terminar el descanso. AudioContext se desbloquea en el primer gesto del usuario.
let ctx;
export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {}
}
export function beep(times = 3) {
  try {
    unlockAudio();
    for (let i = 0; i < times; i++) {
      const t = ctx.currentTime + i * 0.22;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.18);
    }
  } catch {}
  navigator.vibrate?.([200, 100, 200, 100, 200]);
}

// Alarma en segundo plano (mejor esfuerzo): un WAV = silencio hasta el fin del descanso + pitidos.
// Se reproduce en un <audio> desde el gesto del usuario; el sistema lo mantiene vivo con la app en segundo plano.
const SR = 8000;
function alarmWav(silenceSec, ringSec = 90) {
  const n = Math.round((silenceSec + ringSec) * SR);
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const str = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVEfmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, SR, true); v.setUint32(28, SR, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, 'data'); v.setUint32(40, n, true);
  const px = new Uint8Array(buf, 44);
  px.fill(128);
  const start = Math.round(silenceSec * SR);
  for (let i = start; i < n; i++) {
    const t = (i - start) / SR;
    const ph = t % 1.2; // 3 pitidos de 0,16 s cada 1,2 s
    const k = Math.floor(ph / 0.22);
    if (k < 3 && ph - k * 0.22 < 0.16) px[i] = 128 + Math.round(Math.sin(2 * Math.PI * 880 * t) * 100);
  }
  return new Blob([buf], { type: 'audio/wav' });
}
let au, auUrl;
export function armAlarm(endsAt) {
  disarmAlarm();
  try {
    const secs = Math.max(0, (endsAt - Date.now()) / 1000);
    auUrl = URL.createObjectURL(alarmWav(secs));
    au = new Audio(auUrl);
    au.playsInline = true;
    au.play().catch(() => { au = null; });
  } catch {}
}
export function disarmAlarm() {
  try { au?.pause(); } catch {}
  if (auUrl) URL.revokeObjectURL(auUrl);
  au = auUrl = null;
}
/** true si el WAV de fondo está sonando (evita duplicar con el pitido en primer plano). */
export const alarmPlaying = () => !!au && !au.paused;

let lock;
export async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen');
    else if (!on && lock) {
      await lock.release();
      lock = null;
    }
  } catch {}
}
export const fmtClock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
export const fmtNum = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ','));
