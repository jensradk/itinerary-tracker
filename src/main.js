import 'leaflet/dist/leaflet.css';
import './style.css';

import { state } from './state.js';
import { assignCategories } from './categories.js';
import { initMap, renderMarkers } from './map.js';
import { openPanel, closePanel, renderList, renderCatFilters } from './panel.js';
import { save, loadFromStorage } from './storage.js';
import { openModal, initModal } from './modal.js';
import { exportJson } from './import-json.js';

// Initialize map
initMap();

// Panel wiring
document.getElementById('btn-list').onclick = openPanel;
document.getElementById('panel-close').onclick = closePanel;
document.getElementById('panel-overlay').onclick = e => {
  if (e.target === document.getElementById('panel-overlay')) closePanel();
};
document.getElementById('panel-search').oninput = () => renderList();
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeFilter = btn.dataset.filter;
    renderList();
  };
});

// Clear all places
let clearArmed = false, clearTimer = null;
const clearBtn = document.getElementById('btn-clear');
clearBtn.onclick = () => {
  if (!clearArmed) {
    clearArmed = true;
    clearBtn.textContent = '⚠ Press again to confirm';
    clearBtn.style.borderColor = '#ff6b6b';
    clearBtn.style.background = 'rgba(255,107,107,0.12)';
    clearTimer = setTimeout(() => {
      clearArmed = false;
      clearBtn.textContent = 'Reset all places';
      clearBtn.style.borderColor = '';
      clearBtn.style.background = '';
    }, 3000);
  } else {
    clearTimeout(clearTimer);
    clearArmed = false;
    state.places = [];
    save();
    renderMarkers();
    renderCatFilters();
    renderList();
    closePanel();
  }
};

// Export & Import buttons
document.getElementById('btn-export').onclick = exportJson;
document.getElementById('btn-import').onclick = openModal;

// Initialize modal (tabs, file handling, import buttons)
initModal();

// Geolocation
document.getElementById('btn-locate').onclick = () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    p => state.map.setView([p.coords.latitude, p.coords.longitude], 15, { animate: true }),
    () => {}
  );
};

// Load saved data
if (loadFromStorage()) {
  assignCategories(state.places);
  renderMarkers();
  renderCatFilters();
  renderList();
} else {
  renderList();
}
