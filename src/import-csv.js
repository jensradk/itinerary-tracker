import { state } from './state.js';

export function parseCsv(text) {
  const rows = []; let cur = []; let f = ''; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') { f += '"'; i++; }
      else if (c === '"') inQ = false;
      else f += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { cur.push(f); f = ''; }
      else if (c === '\n' || (c === '\r' && n === '\n')) {
        cur.push(f); f = '';
        if (cur.some(x => x.trim())) rows.push(cur);
        cur = [];
        if (c === '\r') i++;
      } else f += c;
    }
  }
  cur.push(f);
  if (cur.some(x => x.trim())) rows.push(cur);
  return rows;
}

export function csvToPlaces(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const hdr = rows[0].map(h => h.trim().toLowerCase());
  const ni = hdr.findIndex(h => ['titel', 'title', 'name', 'navn'].includes(h));
  const noi = hdr.findIndex(h => ['note', 'noter', 'description', 'kommentar', 'comment'].includes(h));
  const ui = hdr.findIndex(h => ['webadresse', 'url', 'web address', 'link', 'google maps url'].includes(h));
  if (ni === -1) return [];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i], name = (r[ni] || '').trim();
    if (!name) continue;
    out.push({ name, note: noi >= 0 ? (r[noi] || '').trim() : '', url: ui >= 0 ? (r[ui] || '').trim() : '' });
  }
  return out;
}

async function geocodeWithClaude(items, onProgress) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const BATCH = 25, results = [];
  for (let s = 0; s < items.length; s += BATCH) {
    if (state.abortImport) break;
    const batch = items.slice(s, s + BATCH);
    const bn = Math.floor(s / BATCH) + 1, tb = Math.ceil(items.length / BATCH);
    onProgress(s, items.length, results.length, `Batch ${bn}/${tb}`);
    const list = batch.map((p, i) => `${i + 1}. ${p.name}${p.url ? ' — ' + p.url : ''}`).join('\n');
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: 'You are a geocoding assistant. Given place names (some with Google Maps URLs), return lat/lng. Return ONLY a JSON array: [{"idx":1,"lat":35.68,"lng":139.76},...]. Be precise.',
          messages: [{ role: 'user', content: `Coordinates for these ${batch.length} places:\n\n${list}` }]
        })
      });
      const data = await resp.json();
      const text = (data.content || []).map(b => b.text || '').join('');
      const parsed = JSON.parse(text.replace(/```json\s?|```/g, '').trim());
      for (const c of parsed) {
        const i = c.idx - 1;
        if (i >= 0 && i < batch.length && c.lat && c.lng) {
          results.push({ name: batch[i].name, note: batch[i].note, url: batch[i].url, lat: c.lat, lng: c.lng, visited: false });
        }
      }
    } catch (e) { console.error('Geocode error:', e); }
  }
  return results;
}

async function geocodeWithNominatim(items, onProgress) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    if (state.abortImport) break;
    const p = items[i];
    onProgress(i, items.length, results.length, `Place ${i + 1}/${items.length}`);
    try {
      const query = p.name;
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'ItineraryTracker/1.0' }
      });
      const data = await resp.json();
      if (data.length > 0) {
        results.push({ name: p.name, note: p.note, url: p.url, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), visited: false });
      }
    } catch (e) { console.error('Nominatim error:', e); }
    // Rate limit: 1 request per second
    if (i < items.length - 1) await new Promise(r => setTimeout(r, 1100));
  }
  return results;
}

export async function batchGeocode(items, onProgress) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (apiKey) {
    return geocodeWithClaude(items, onProgress);
  } else {
    return geocodeWithNominatim(items, onProgress);
  }
}

export function hasApiKey() {
  return !!import.meta.env.VITE_ANTHROPIC_API_KEY;
}
