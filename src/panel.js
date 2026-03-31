import { state } from './state.js';
import { CAT_ORDER, getCatColor } from './categories.js';
import { save, esc } from './storage.js';
import { mkIcon } from './map.js';

const panelOv = () => document.getElementById('panel-overlay');

export function openPanel() {
  panelOv().classList.add('open');
  renderCatFilters();
  renderList();
}

export function closePanel() {
  panelOv().classList.remove('open');
}

export function renderCatFilters() {
  const el = document.getElementById('cat-filters');
  const cats = CAT_ORDER.filter(c => state.places.some(p => p.category === c));
  if (cats.length < 2) { el.innerHTML = ''; return; }
  el.innerHTML = `<button class="cat-btn${state.activeCat === null ? ' active' : ''}" data-cat="__all"><span class="cat-dot" style="background:var(--accent)"></span>All</button>` +
    cats.map(c => {
      const n = state.places.filter(p => p.category === c).length;
      return `<button class="cat-btn${state.activeCat === c ? ' active' : ''}" data-cat="${esc(c)}"><span class="cat-dot" style="background:${getCatColor(c)}"></span>${esc(c)} <span style="opacity:.5">${n}</span></button>`;
    }).join('');
  el.querySelectorAll('.cat-btn').forEach(btn => {
    btn.onclick = () => {
      state.activeCat = btn.dataset.cat === '__all' ? null : btn.dataset.cat;
      renderCatFilters();
      renderList();
    };
  });
}

export function renderList() {
  const el = document.getElementById('panel-list'), footer = document.getElementById('panel-footer');
  const search = document.getElementById('panel-search').value.toLowerCase();
  const vc = state.places.filter(p => p.visited).length;
  document.getElementById('header-count').textContent = state.places.length ? `${vc}/${state.places.length} visited` : '';
  footer.style.display = state.places.length ? 'flex' : 'none';
  let filtered = state.places.map((p, i) => ({ ...p, _i: i }));
  if (state.activeFilter === 'visited') filtered = filtered.filter(p => p.visited);
  if (state.activeFilter === 'unvisited') filtered = filtered.filter(p => !p.visited);
  if (state.activeCat) filtered = filtered.filter(p => p.category === state.activeCat);
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || (p.note || '').toLowerCase().includes(search));
  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state"><svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg><p>${!state.places.length ? 'No places yet.<br>Press + to import.' : 'No results.'}</p></div>`;
    return;
  }

  el.innerHTML = filtered.map(p => {
    const dc = p.visited ? 'var(--visited)' : getCatColor(p.category);
    return `<div class="place-item${p.visited ? ' visited-item' : ''}" id="place-${p._i}"><span class="place-dot" style="background:${dc}"></span>
      <div class="place-item-body place-item-goto" data-i="${p._i}"><div class="place-item-name">${esc(p.name)}</div>${p.note ? `<div class="place-item-sub">${esc(p.note)}</div>` : `<div class="place-item-sub" style="color:${getCatColor(p.category)}">${esc(p.category)}</div>`}</div>
      <button class="visit-btn${p.visited ? ' is-visited' : ''}" data-i="${p._i}">${p.visited ? '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 9 7.5 13.5 15 5"/></svg>' : '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>'}</button></div>`;
  }).join('');

  el.querySelectorAll('.place-item-goto').forEach(div => {
    div.addEventListener('click', () => {
      const i = +div.dataset.i;
      closePanel();
      state.map.setView([state.places[i].lat, state.places[i].lng], 16, { animate: true });
      setTimeout(() => state.markers[i].openPopup(), 350);
    });
  });

  el.querySelectorAll('.visit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = +btn.dataset.i;
      state.places[i].visited = !state.places[i].visited;
      save();
      state.markers[i].setIcon(mkIcon(state.places[i]));
      updateBadge();
      renderList();
    });
  });

  if (state.scrollToIdx >= 0) {
    const target = document.getElementById('place-' + state.scrollToIdx);
    if (target) setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.style.background = 'var(--surface-2)';
      setTimeout(() => target.style.background = '', 1200);
    }, 100);
    state.scrollToIdx = -1;
  }
}

export function updateBadge() {
  const b = document.getElementById('badge');
  if (!state.places.length) { b.style.display = 'none'; return; }
  b.style.display = 'flex';
  const v = state.places.filter(p => p.visited).length;
  b.textContent = v === 0 ? state.places.length : `${state.places.length - v}/${state.places.length}`;
}
