// Sincronización local-first: pull → fusionar → push contra un Worker de Cloudflare (KV). Clave personal en el dispositivo.
import { actions, getState, onChange } from './store.js';

export const DEFAULT_URL = import.meta.env.VITE_SYNC_URL || '';
let busy = false, timer = null, dirty = false;

export const newKey = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 32);

export async function syncNow() {
  const { syncKey, syncUrl } = getState().device;
  const url = (syncUrl || DEFAULT_URL).replace(/\/$/, '');
  if (!syncKey || !url || busy) return;
  busy = true;
  try {
    const h = { Authorization: `Bearer ${syncKey}` };
    const r = await fetch(`${url}/data`, { headers: h });
    if (!r.ok && r.status !== 404) throw new Error(`GET ${r.status}`);
    const remote = r.status === 404 ? null : await r.json();
    const merged = actions.mergeRemote(remote);
    const p = await fetch(`${url}/data`, { method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(merged) });
    if (!p.ok) throw new Error(`PUT ${p.status}`);
    actions.setDevice({ lastSync: Date.now(), syncMsg: '' });
  } catch (e) {
    actions.setDevice({ syncMsg: navigator.onLine ? `Error: ${e.message}` : 'Sin conexión' });
  } finally {
    busy = false;
    dirty = false;
  }
}

const schedule = () => { clearTimeout(timer); timer = setTimeout(syncNow, 3000); };
export function startSync() {
  onChange(() => { if (!busy && getState().device.syncKey) { dirty = true; schedule(); } });
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && syncNow());
  addEventListener('online', syncNow);
  syncNow();
}
