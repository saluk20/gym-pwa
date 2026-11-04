import { useRef, useState } from 'react';
import { useStore, actions } from '../lib/store.js';
import { syncNow, newKey, DEFAULT_URL } from '../lib/sync.js';
import { weeks, currentWeek, lastWeekIndex } from '../lib/program.js';

const ACCENTS = [['ember', 'Naranja', '#FF6B35'], ['rojo', 'Rojo', '#E5383B'], ['blanco', 'Blanco', '#F3F0EB']];

function Row({ children }) { return <div className="flex items-center justify-between gap-3">{children}</div>; }
const Seg = ({ on, onClick, children }) => (
  <button onClick={onClick} className={`tap h-10 flex-1 rounded-pill px-3 text-[13px] font-semibold ${on ? 'bg-brand text-onbrand' : 'bg-card2 text-muted'}`}>{children}</button>
);

export default function Profile({ go }) {
  const st = useStore();
  const { settings, sessions, device } = st;
  const file = useRef();
  const [msg, setMsg] = useState('');
  const [keyIn, setKeyIn] = useState('');
  const wi = currentWeek(st);

  const exportJson = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([actions.exportBackup()], { type: 'application/json' }));
    a.download = `gym-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setMsg('Copia descargada.');
  };
  const importJson = async (e) => {
    try { actions.importBackup(await e.target.files[0].text()); setMsg('Copia fusionada con tus datos.'); }
    catch (err) { setMsg('Error: ' + err.message); }
    e.target.value = '';
  };
  const url = device.syncUrl || DEFAULT_URL;
  const status = !device.syncKey ? 'Sin conectar' : device.syncMsg || (device.lastSync ? `Sincronizado ${new Date(device.lastSync).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}` : 'Pendiente');

  return (
    <div className="px-5 pt-safe pb-nav">
      <button onClick={() => go('home')} className="tap mt-4 text-[14px] font-semibold text-brand">← Home</button>
      <h1 className="mt-2 text-[28px]">Ajustes</h1>

      <section className="card mt-4 space-y-4 p-4">
        <label className="block">
          <span className="text-[12px] text-muted">Nombre</span>
          <input value={settings.name} onChange={(e) => actions.setSetting({ name: e.target.value })} className="mt-1 h-11 w-full rounded-pill bg-card2 px-4 text-[16px]" />
        </label>
        <Row>
          <div>
            <p className="text-[15px]">Semana del ciclo</p>
            <p className="text-[12px] text-muted">Igual para los 5 días. Avanza sola al completar todos.</p>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Semana anterior" className="tap grid h-10 w-10 place-items-center rounded-full bg-card2" onClick={() => actions.setSetting({ weekIndex: Math.max(0, wi - 1) })}>−</button>
            <span className="min-w-[78px] text-center text-[14px] font-semibold">{weeks[wi]}</span>
            <button aria-label="Semana siguiente" className="tap grid h-10 w-10 place-items-center rounded-full bg-card2" onClick={() => actions.setSetting({ weekIndex: Math.min(lastWeekIndex, wi + 1) })}>+</button>
          </div>
        </Row>
        <label className="block">
          <span className="text-[12px] text-muted">Descarga: peso = último × {Math.round(settings.deload * 100)} %</span>
          <input type="range" min="0.5" max="1" step="0.05" value={settings.deload} onChange={(e) => actions.setSetting({ deload: Number(e.target.value) })} className="mt-2 w-full accent-brand" />
        </label>
        <Row>
          <span className="text-[15px]">Sonido al acabar el descanso</span>
          <input type="checkbox" checked={settings.sound} onChange={(e) => actions.setSetting({ sound: e.target.checked })} className="h-6 w-6 accent-brand" />
        </Row>
      </section>

      <section className="card mt-4 space-y-3 p-4">
        <h2 className="text-[17px]">Aspecto (este dispositivo)</h2>
        <div className="flex gap-2">
          <Seg on={device.theme === 'dark'} onClick={() => actions.setDevice({ theme: 'dark' })}>Oscuro</Seg>
          <Seg on={device.theme === 'light'} onClick={() => actions.setDevice({ theme: 'light' })}>Claro</Seg>
        </div>
        <div className="flex gap-2">
          {ACCENTS.map(([id, label, c]) => (
            <Seg key={id} on={device.accent === id} onClick={() => actions.setDevice({ accent: id })}>
              <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: c }} />{label}
            </Seg>
          ))}
        </div>
      </section>

      <section className="card mt-4 p-4">
        <h2 className="text-[17px]">Sincronización</h2>
        <p className="mt-1 text-[13px] text-muted">{status}. Una clave personal une tu móvil y tu ordenador desde cualquier red.</p>
        {!url && <p className="mt-2 text-[13px] text-danger">Falta la URL del servidor de sincronización [revisar].</p>}
        {!device.syncKey ? (
          <div className="mt-3 space-y-2">
            <button disabled={!url} onClick={() => { actions.setDevice({ syncKey: newKey() }); syncNow(); }} className="tap h-11 w-full rounded-pill bg-brand text-[14px] font-semibold text-onbrand disabled:opacity-40">Crear clave (primer dispositivo)</button>
            <div className="flex gap-2">
              <input value={keyIn} onChange={(e) => setKeyIn(e.target.value.trim())} placeholder="Pegar clave de otro dispositivo" className="h-11 min-w-0 flex-1 rounded-pill bg-card2 px-4 text-[14px]" />
              <button disabled={keyIn.length < 24 || !url} onClick={() => { actions.setDevice({ syncKey: keyIn }); setKeyIn(''); syncNow(); }} className="tap h-11 rounded-pill bg-card2 px-4 text-[14px] font-semibold disabled:opacity-40">Unir</button>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="break-all rounded-[16px] bg-card2 p-3 text-[12px] tabular-nums" onClick={() => navigator.clipboard?.writeText(device.syncKey).then(() => setMsg('Clave copiada.'))}>{device.syncKey}</p>
            <p className="text-[12px] text-muted">Toca para copiar. Pégala en el otro dispositivo. No la compartas: quien la tenga ve tus datos.</p>
            <div className="flex gap-2">
              <button onClick={syncNow} className="tap h-11 flex-1 rounded-pill bg-brand text-[14px] font-semibold text-onbrand">Sincronizar ahora</button>
              <button onClick={() => confirm('¿Desconectar este dispositivo? Los datos locales se conservan.') && actions.setDevice({ syncKey: '', lastSync: 0, syncMsg: '' })} className="tap h-11 rounded-pill bg-card2 px-4 text-[14px] font-semibold">Desconectar</button>
            </div>
          </div>
        )}
      </section>

      <section className="card mt-4 p-4">
        <h2 className="text-[17px]">Copia de seguridad</h2>
        <p className="mt-1 text-[13px] text-muted">{sessions.filter((s) => s.finishedAt).length} sesiones guardadas en este dispositivo.</p>
        <div className="mt-3 flex gap-2">
          <button onClick={exportJson} className="tap h-11 flex-1 rounded-pill bg-brand text-[14px] font-semibold text-onbrand">Exportar</button>
          <button onClick={() => file.current.click()} className="tap h-11 flex-1 rounded-pill bg-card2 text-[14px] font-semibold">Importar</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={importJson} />
        </div>
        {msg && <p className="mt-2 text-[13px] text-muted" role="status">{msg}</p>}
        <button onClick={() => confirm('¿Borrar todos los entrenos de este dispositivo? Si la sincronización está activa, volverán desde la nube.') && actions.resetAll()} className="tap mt-3 h-11 w-full text-[14px] font-semibold text-danger">Borrar registros de este dispositivo</button>
      </section>
    </div>
  );
}
