# Itinerary Tracker

Trip planner with interactive Leaflet maps, place categorization, and Google Takeout CSV import with geocoding.

## Setup

```bash
npm install
npm run dev
```

## Import places

Three ways to add places:

- **Library** — Pre-configured trip JSON files listed in `public/manifest.json`
- **JSON file** — Upload a JSON file with `name`, `lat`, `lng` fields
- **CSV file** — Upload a Google Takeout CSV; places are geocoded automatically

## Geocoding

CSV import needs geocoding (place names → coordinates). Two backends:

- **With API key** — Set `VITE_ANTHROPIC_API_KEY` in `.env` for fast batch geocoding via Claude
- **Without API key** — Falls back to OpenStreetMap Nominatim (free, ~1 place/second)

## Build

```bash
npm run build    # Production build to dist/
npm run preview  # Preview production build
```
