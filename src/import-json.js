import { state } from './state.js';
import { esc } from './storage.js';

export function parseJsonFile(text) {
  try {
    const d = JSON.parse(text);
    const arr = Array.isArray(d) ? d : (d.places || []);
    return arr.filter(p => p.name && typeof p.lat === 'number' && typeof p.lng === 'number')
      .map(p => ({ name: p.name, note: p.note || '', url: p.url || '', lat: p.lat, lng: p.lng, visited: !!p.visited, category: p.category || null }));
  } catch (e) { return []; }
}

export function exportJson() {
  const data = JSON.stringify(state.places, null, 2);
  if (window.self !== window.top) { showCopyModal(data); return; }
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'saved-places.json';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function showCopyModal(data) {
  if (document.getElementById('copy-overlay')) return;
  const ov = document.createElement('div');
  ov.id = 'copy-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:20px;';
  ov.innerHTML = `<div style="background:var(--bg);border:1px solid var(--border);border-radius:16px;padding:24px;max-width:500px;width:100%;max-height:80vh;display:flex;flex-direction:column;gap:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;"><h3 style="font-size:17px;font-weight:700;">Export JSON</h3><button id="copy-close" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:20px;padding:4px 8px;">✕</button></div>
    <p style="font-size:13px;color:var(--text-dim);">Save the content as <strong style="color:var(--accent);">saved-places.json</strong></p>
    <textarea id="copy-text" readonly style="flex:1;min-height:200px;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:12px;font-family:'JetBrains Mono',monospace;font-size:11px;resize:none;outline:none;">${data.replace(/</g, '&lt;')}</textarea>
    <button id="copy-btn" style="padding:12px;border-radius:10px;background:var(--accent);color:#0a0a0a;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;">Copy to clipboard</button></div>`;
  document.body.appendChild(ov);
  ov.querySelector('#copy-close').onclick = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.querySelector('#copy-btn').onclick = () => {
    navigator.clipboard.writeText(data).then(() => {
      ov.querySelector('#copy-btn').textContent = '✓ Copied!';
      setTimeout(() => ov.remove(), 1000);
    });
  };
}
