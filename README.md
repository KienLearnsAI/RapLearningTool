# Rap Flow Workbench (MVP)

A lightweight writing-first web app for rappers and songwriters to analyze a beat and map bars line-by-line.

## Features

- Upload one beat at a time (`mp3` / `wav`) with file validation (max 100MB, 10min).
- Deterministic browser-side BPM estimate with confidence and optional half/double-time alternatives on ambiguous results.
- Approximate groove/beat type guess (`boom bap`, `trap`, `drill-like`, `melodic / slow groove`, `other / unknown`).
- Waveform rendering with beat and bar grid overlays.
- Current playback bar + beat display.
- Lyrics textarea where each non-empty line is one bar.
- Word-first chunking and approximate syllable count.
- 4-beat flow lane per line with 8/16/32 subdivision toggle (default 16).
- Density labels (`Too short`, `Balanced`, `Dense`, `Very dense`) and quick hints.
- Drag chunks left/right with grid snapping and per-line reset.
- Local persistence via `localStorage` for lyrics, BPM override, downbeat offset, chunk edits, and subdivision setting.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Architecture decisions

- **Client-side only**: no backend, no auth, no database.
- **Deterministic core analysis**:
  - BPM via Web Audio API decode + envelope autocorrelation.
  - Beat grid/bar markers from BPM + global downbeat offset in 4/4.
  - Groove estimate from lightweight BPM/energy heuristics.
- **Modular logic split**:
  - `src/lib/audioAnalysis.ts` → BPM + confidence + beat-type heuristics.
  - `src/lib/beatGrid.ts` → beat/bar marker generation + playback position helpers.
  - `src/lib/lyrics.ts` → line parsing, chunking, syllable estimate, density classification.
  - UI components isolated in `src/components/*`.

## Known limitations

- BPM can be less reliable with ambient intros or weak transients.
- Downbeat alignment may require manual nudging.
- Beat type classification is intentionally approximate.
- Text-only chunk mapping estimates writing flow, not actual vocal performance timing.
- Syllable estimation is heuristic and imperfect.
