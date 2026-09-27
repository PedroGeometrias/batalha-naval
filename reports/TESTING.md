# Verification record

Run from a clean `npm ci` installation on Linux x86-64 with Chromium 153.0.8010.0:

- `npm run build`: passed (Vite reports an informational large-chunk warning).
- `npm run lint`: passed.
- `npm run test:unit`: 13 passed, including camera tile selection, wake lifetime, and combat audio cue counts.
- `PIRATE_CHROMIUM=/tmp/pirate-chromium npm run test:e2e -- --workers=2`: 20 passed, 4 intentionally skipped (desktop touch-only test and three mobile screenshot comparisons against desktop baselines).

The accompanying HTML report is in `reports/playwright-report/index.html`. Three reference screenshots are versioned under `tests/e2e/visual.spec.ts-snapshots/`; the arena baseline was refreshed for the HUD icons and sound button, then passed. The browser tests confirmed that wake particles appear during travel and expire after stopping, active tile counts remain below the full map on desktop and mobile, and the sound button toggles. A manual moving-boat screenshot at 1280×800 showed 1,507 of 3,136 water tiles active with the 96-pixel camera margin. A browser request check returned HTTP 200 for the ocean and combat WAV files. No browser test failures occurred, so no failure traces were generated. A public deployment and a three-minute optimized-build performance profile have not been completed.
