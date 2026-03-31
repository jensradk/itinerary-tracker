import L from 'leaflet';
import { state } from './state.js';
import { getCatColor } from './categories.js';
import { save, esc } from './storage.js';
import { updateBadge, openPanel } from './panel.js';

function getInitials(name) {
  const w = (name || '').trim().split(/\s+/);
  return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : (w[0] || '??').slice(0, 2).toUpperCase();
}

export function mkIcon(p) {
  const color = p.visited ? '#6c6c78' : getCatColor(p.category);
  const l = getInitials(p.name).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return L.divIcon({
    className: '',
    html: `<div class="place-marker${p.visited ? ' visited' : ''}" style="background:${color}"><span class="marker-letter">${l}</span></div>`,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -36]
  });
}

export function initMap() {
  state.map = L.map('map', { zoomControl: false, center: [36.2, 138.2], zoom: 6 });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(state.map);
  state.markerLayer = L.layerGroup().addTo(state.map);
}

export function renderMarkers() {
  state.markerLayer.clearLayers();
  state.markers = [];
  state.places.forEach((p, i) => {
    state.markers.push(
      L.marker([p.lat, p.lng], { icon: mkIcon(p) })
        .bindPopup(() => buildPopup(i), { maxWidth: 280, closeButton: false })
        .addTo(state.markerLayer)
    );
  });
  updateBadge();
  if (state.places.length > 0) {
    state.map.fitBounds(L.featureGroup(state.markers).getBounds().pad(0.1), { maxZoom: 15 });
  }
}

function buildPopup(i) {
  const p = state.places[i], cc = getCatColor(p.category);
  const gmapsUrl = p.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.lat + ',' + p.lng)}`;
  const div = document.createElement('div');
  div.className = 'popup-card';
  let tags = `<span class="popup-tag" style="background:${cc}22;color:${cc}">${esc(p.category)}</span>`;
  if (p.visited) tags += `<span class="popup-tag" style="background:rgba(58,158,151,0.12);color:#3a9e97"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5 6.5 4.5 9.5 10.5 3"/></svg> Visited</span>`;
  const visitLabel = p.visited ? 'Mark as not visited' : 'Mark as visited';
  const visitIcon = p.visited
    ? '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>'
    : '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 8 6 12 14 4"/></svg>';
  div.innerHTML = `<h3>${esc(p.name)}</h3>${p.note ? `<div class="popup-note">${esc(p.note)}</div>` : ''}<div class="popup-tags">${tags}</div>
    <div class="popup-btns"><a class="open-gmaps" href="${esc(gmapsUrl)}" target="_blank" rel="noopener"><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg> Open in Google Maps</a>
      <button class="toggle-visited" data-idx="${i}">${visitIcon} ${visitLabel}</button>
      <button class="show-in-list" data-idx="${i}"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="5" x2="13" y2="5"/><line x1="3" y1="8.5" x2="13" y2="8.5"/><line x1="3" y1="12" x2="9" y2="12"/></svg> Show in list</button></div>`;
  div.querySelector('.toggle-visited').addEventListener('click', () => {
    state.places[i].visited = !state.places[i].visited;
    save();
    state.markers[i].setIcon(mkIcon(state.places[i]));
    updateBadge();
    state.markers[i].getPopup().setContent(buildPopup(i));
  });
  div.querySelector('.show-in-list').addEventListener('click', () => {
    state.map.closePopup();
    state.scrollToIdx = i;
    openPanel();
  });
  return div;
}
