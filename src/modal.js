import { state } from './state.js';
import { assignCategories } from './categories.js';
import { save, esc } from './storage.js';
import { renderMarkers } from './map.js';
import { renderCatFilters, renderList } from './panel.js';
import { csvToPlaces, batchGeocode, hasApiKey } from './import-csv.js';
import { parseJsonFile, exportJson } from './import-json.js';

let statusEl;

function setStatus(h) {
  statusEl.innerHTML = h;
  statusEl.classList.add('visible');
}

export function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
  if (state.manifestEntries === null) loadManifest();
}

export function closeModal() {
  const modalOv = document.getElementById('modal-overlay');
  modalOv.classList.remove('open');
  state.pendingCsvRows = null;
  state.pendingJsonPlaces = null;
  document.getElementById('csv-selected').classList.remove('visible');
  document.getElementById('json-selected').classList.remove('visible');
  statusEl.classList.remove('visible');
  statusEl.innerHTML = '';
  document.getElementById('file-csv').value = '';
  document.getElementById('file-json').value = '';
  document.getElementById('csv-btn-row-normal').style.display = 'flex';
  document.getElementById('csv-btn-row-stop').style.display = 'none';
}

async function loadManifest() {
  const el = document.getElementById('lib-content');
  try {
    const resp = await fetch('manifest.json', { cache: 'no-cache' });
    if (!resp.ok) throw new Error('not found');
    const data = await resp.json();
    state.manifestEntries = (Array.isArray(data) ? data : []).map(item => {
      if (typeof item === 'string') return { file: item, name: item.replace(/\.json$/i, '').replace(/[-_]/g, ' '), description: '' };
      return { file: item.file || '', name: item.name || item.file || '?', description: item.description || '' };
    }).filter(e => e.file);
    renderLibrary();
  } catch (e) {
    state.manifestEntries = [];
    el.innerHTML = `<div class="lib-empty">No <strong>manifest.json</strong> found.<br><br>
      <span style="font-size:12px;color:var(--text-dim)">Create a <code style="background:var(--surface-2);padding:2px 6px;border-radius:4px">manifest.json</code> in the same folder as the HTML file with a list of your JSON files, e.g.:<br><br>
      <code style="background:var(--surface-2);padding:6px 10px;border-radius:6px;display:block;text-align:left;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.6;white-space:pre">[
  { "file": "japan-2026.json",
    "name": "Japan 2026",
    "description": "Tokyo → Hakone → Kyoto → Osaka" }
]</code></span></div>`;
  }
}

function renderLibrary() {
  const el = document.getElementById('lib-content');
  if (!state.manifestEntries || !state.manifestEntries.length) {
    el.innerHTML = `<div class="lib-empty">No trips in manifest.json yet.</div>`;
    return;
  }
  el.innerHTML = `<div class="lib-grid">${state.manifestEntries.map((e, i) => `
    <button class="lib-card" data-idx="${i}">
      <div class="lib-card-icon">🗺</div>
      <div class="lib-card-body">
        <div class="lib-card-name">${esc(e.name)}</div>
        ${e.description ? `<div class="lib-card-desc">${esc(e.description)}</div>` : ''}
      </div>
      <div class="lib-card-arrow"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="7 4 13 9 7 14"/></svg></div>
    </button>`).join('')}</div>`;
  el.querySelectorAll('.lib-card').forEach(card => {
    card.addEventListener('click', () => loadFromLibrary(+card.dataset.idx, card));
  });
}

async function loadFromLibrary(idx, card) {
  const entry = state.manifestEntries[idx];
  if (!entry) return;
  card.classList.add('loading');
  setStatus(`<span class="spinner"></span> Loading <strong>${esc(entry.name)}</strong>…`);
  try {
    const resp = await fetch(entry.file, { cache: 'no-cache' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    const parsed = parseJsonFile(text);
    if (!parsed.length) { setStatus(`<span class="warn">⚠ No valid places in ${esc(entry.file)}</span>`); card.classList.remove('loading'); return; }
    state.places = parsed; assignCategories(state.places); save(); renderMarkers(); renderCatFilters(); renderList();
    setStatus(`✓ <span class="count">${state.places.length}</span> places loaded from <strong>${esc(entry.name)}</strong>`);
    setTimeout(closeModal, 800);
  } catch (e) {
    console.error(e);
    setStatus(`<span class="warn">⚠ Could not load ${esc(entry.file)}</span>`);
  }
  card.classList.remove('loading');
}

function loadCsvFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const parsed = csvToPlaces(e.target.result);
    if (!parsed.length) { setStatus('<span class="warn">⚠ No places found.</span>'); return; }
    state.pendingCsvRows = parsed;
    document.getElementById('csv-name').textContent = file.name;
    document.getElementById('csv-detail').textContent = `${parsed.length} places found`;
    document.getElementById('csv-selected').classList.add('visible');
    statusEl.classList.remove('visible');
  };
  reader.readAsText(file, 'utf-8');
}

function loadJsonFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const parsed = parseJsonFile(e.target.result);
    if (!parsed.length) { setStatus('<span class="warn">⚠ No valid places.</span>'); return; }
    state.pendingJsonPlaces = parsed;
    document.getElementById('json-name').textContent = file.name;
    document.getElementById('json-detail').textContent = `${parsed.length} places`;
    document.getElementById('json-selected').classList.add('visible');
    statusEl.classList.remove('visible');
  };
  reader.readAsText(file, 'utf-8');
}

export function initModal() {
  statusEl = document.getElementById('status');
  const modalOv = document.getElementById('modal-overlay');

  // Tabs
  document.querySelectorAll('.import-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.import-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.import-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      state.activeTab = tab.dataset.tab;
      document.getElementById('pane-' + state.activeTab).classList.add('active');
      statusEl.classList.remove('visible');
    };
  });

  // CSV file handling
  const dropCsv = document.getElementById('drop-csv'), fileCsv = document.getElementById('file-csv');
  dropCsv.onclick = () => fileCsv.click();
  dropCsv.ondragover = e => { e.preventDefault(); dropCsv.classList.add('dragover'); };
  dropCsv.ondragleave = () => dropCsv.classList.remove('dragover');
  dropCsv.ondrop = e => { e.preventDefault(); dropCsv.classList.remove('dragover'); if (e.dataTransfer.files[0]) loadCsvFile(e.dataTransfer.files[0]); };
  fileCsv.onchange = e => { if (e.target.files[0]) loadCsvFile(e.target.files[0]); };
  document.getElementById('csv-remove').onclick = () => { state.pendingCsvRows = null; document.getElementById('csv-selected').classList.remove('visible'); statusEl.classList.remove('visible'); fileCsv.value = ''; };

  // JSON file handling
  const dropJson = document.getElementById('drop-json'), fileJson = document.getElementById('file-json');
  dropJson.onclick = () => fileJson.click();
  dropJson.ondragover = e => { e.preventDefault(); dropJson.classList.add('dragover'); };
  dropJson.ondragleave = () => dropJson.classList.remove('dragover');
  dropJson.ondrop = e => { e.preventDefault(); dropJson.classList.remove('dragover'); if (e.dataTransfer.files[0]) loadJsonFile(e.dataTransfer.files[0]); };
  fileJson.onchange = e => { if (e.target.files[0]) loadJsonFile(e.target.files[0]); };
  document.getElementById('json-remove').onclick = () => { state.pendingJsonPlaces = null; document.getElementById('json-selected').classList.remove('visible'); statusEl.classList.remove('visible'); fileJson.value = ''; };

  // Import buttons
  document.getElementById('json-import-btn').onclick = () => {
    if (!state.pendingJsonPlaces?.length) { setStatus('<span class="warn">Choose a JSON file first.</span>'); return; }
    state.places = state.pendingJsonPlaces; assignCategories(state.places); save(); renderMarkers(); renderCatFilters(); renderList();
    setStatus(`✓ <span class="count">${state.places.length}</span> places loaded!`); setTimeout(closeModal, 700);
  };

  document.getElementById('modal-stop').onclick = () => { state.abortImport = true; };

  document.getElementById('csv-import-btn').onclick = async () => {
    if (!state.pendingCsvRows?.length) { setStatus('<span class="warn">Choose a CSV file first.</span>'); return; }
    document.getElementById('csv-import-btn').disabled = true;
    document.getElementById('csv-btn-row-normal').style.display = 'none';
    document.getElementById('csv-btn-row-stop').style.display = 'flex';
    state.abortImport = false;
    try {
      const usingApi = hasApiKey();
      setStatus(`<span class="spinner"></span> Geocoding <span class="count">${state.pendingCsvRows.length}</span> places…${!usingApi ? '<br><span class="warn">No API key — using free geocoding. This may take a while.</span>' : ''}`);
      const geocoded = await batchGeocode(state.pendingCsvRows, (done, total, found, label) => {
        setStatus(`<span class="spinner"></span> <span class="count">${done}/${total}</span> (${Math.round(done / total * 100)}%) — ${found} found — ${label}`);
      });
      if (geocoded.length > 0) {
        state.places = geocoded; assignCategories(state.places); save(); renderMarkers(); renderCatFilters(); renderList();
        const missed = state.pendingCsvRows.length - geocoded.length;
        setStatus(`${state.abortImport ? '⏹ Stopped. ' : '✓ '}<span class="count">${geocoded.length}</span> places imported!${missed > 0 ? ` <span class="warn">(${missed} not found)</span>` : ''}`);
        if (!state.abortImport && missed === 0) setTimeout(closeModal, 900);
      } else setStatus('<span class="warn">⚠ Could not find any places.</span>');
    } catch (e) { console.error(e); setStatus('<span class="warn">⚠ Something went wrong.</span>'); }
    document.getElementById('csv-import-btn').disabled = false;
    document.getElementById('csv-btn-row-normal').style.display = 'flex';
    document.getElementById('csv-btn-row-stop').style.display = 'none';
  };

  // Cancel buttons and overlay click
  document.querySelectorAll('.csv-cancel, .json-cancel').forEach(b => { b.onclick = closeModal; });
  modalOv.onclick = e => { if (e.target === modalOv) closeModal(); };
}
