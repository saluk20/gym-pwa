import { useRef, useState } from 'react';
import { useStore, actions } from '../lib/store.js';

export default function Profile() {
  const { settings, sessions } = useStore();
  const file = useRef();
  const [msg, setMsg] = useState('');

  const exportJson = () => {
    const blob = new Blob([actions.exportBackup()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gym-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setMsg('Copia descargada.');
  };
  const importJson = async (e) => {
    try {
      actions.importBackup(await e.target.files[0].text());
      setMsg('Copia restaurada.');
    } catch (err) {
      setMsg('Error: ' + err.message);
    }
    e.target.value = '';
  };

  return (
    <div className="px-5 pt-safe pb-nav">
      <h1 className="mt-4 text-[26px]">Perfil</h1>

      <section className="card mt-4 space-y-4 p-4">
        <label className="block">
          <span className="text-[12px] text-muted">Nombre</span>
          <input value={settings.name} onChange={(e) => actions.setSetting({ name: e.target.value })} className="mt-1 h-11 w-full rounded-pill bg-canvas px-4 text-[16px]" />
        </label>
        <label className="block">
          <span className="text-[12px] text-muted">Descarga: peso = último × {Math.round(settings.deload * 100)} %</span>
          <input type="range" min="0.5" max="1" step="0.05" value={settings.deload} onChange={(e) => actions.setSetting({ deload: Number(e.target.value) })} className="mt-2 w-full accent-brand" />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-[15px]">Sonido al acabar el descanso</span>
          <input type="checkbox" checked={settings.sound} onChange={(e) => actions.setSetting({ sound: e.target.checked })} className="h-6 w-6 accent-brand" />
        </label>
      </section>

      <section className="card mt-4 p-4">
        <h2 className="text-[17px]">Datos</h2>
        <p className="mt-1 text-[13px] text-muted">Todo se guarda en este dispositivo ({sessions.filter((s) => s.finishedAt).length} sesiones). Haz copia de vez en cuando: si borras los datos de Safari se pierden.</p>
        <div className="mt-3 flex gap-2">
          <button onClick={exportJson} className="tap h-11 flex-1 rounded-pill bg-brand text-[14px] font-semibold text-white">Exportar copia</button>
          <button onClick={() => file.current.click()} className="tap h-11 flex-1 rounded-pill bg-canvas text-[14px] font-semibold">Restaurar</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={importJson} />
        </div>
        {msg && <p className="mt-2 text-[13px] text-muted" role="status">{msg}</p>}
        <button onClick={() => confirm('¿Borrar todos los entrenos registrados en la app? (El histórico del Excel se conserva)') && actions.resetAll()} className="tap mt-3 h-11 w-full text-[14px] font-semibold text-heart">Borrar registros de la app</button>
      </section>
    </div>
  );
}
