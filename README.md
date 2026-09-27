# Pirate Battle

A single-player naval shooter built with React, TypeScript, PixiJS, Axios, TanStack Query, and MSW. Sail an isometric tiled sea, fight Chasers and Shooters, and record finished voyages in a locally mocked ranking and match history.

## Run

Requires Node.js 24 or newer. From a clean checkout:

```sh
npm ci
npm run dev
```

For an optimized build, run `npm run build` then `npm run preview`. No environment variables or private API services are needed. The committed `public/mockServiceWorker.js` starts before React renders, including in the published build. Host at a secure HTTPS origin (or localhost) and serve the worker at the site's root.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Sail forward | W or Up | Sail |
| Steer | A / D or Left / Right | Turn left / Turn right |
| Bow cannon | J | Bow cannon |
| Three-shot port broadside | Q | Port cannons |
| Three-shot starboard broadside | E | Starboard cannons |
| Pause / resume | Space or Escape; resume also has a button | Pause / Resume |

Steering, movement, and firing can happen together. Switching tabs or losing focus pauses the simulation; resume requires an explicit action. Leaving combat abandons the match without adding a record. Desktop and mobile portrait/landscape are supported; the camera follows the ship through a 56×56 isometric sea. **Sound on / Sound off** in combat toggles cannon, impact, explosion, and quiet ocean ambience audio. The ocean pauses with the match; if the browser blocks automatic playback, the first gameplay input starts it.

The ocean creates only tiles intersecting the camera view, with a small margin while panning, and removes tiles and waves when they leave it. Moving player and enemy boats leave short lived foam behind their sterns. The simulation tracks wake distance so standing still does not produce particles; the renderer skips foam outside the view.

Options persist across refresh. **Game session time** accepts whole seconds from 60 through 180. **Enemy spawn time** accepts whole seconds from 2 through 30. A match copies both options at its start. The result persists locally after completion; Play Again creates fresh health, score, enemies, and timers. Player and enemy ships each have 16 direction frames (22.5° per frame). The three 4×4 PNG atlases in `src/assets/ships/` can be regenerated with `python3 scripts/generate_ships.py` (Pillow is only needed for regeneration). The ship artwork is original to this project; the water tiles came with the starter. The HUD icons and WAV sounds come from the challenge repository. Exact source paths and license status are in [`ASSET_CREDITS.md`](ASSET_CREDITS.md).

All balancing constants, map size, enemy behavior, projectile settings, and island locations are in `src/game/config.ts`. Only the two options above are exposed in the UI.

## Network scenarios

Open **Network scenarios** on the menu. Select a scenario, revisit Ranking or Match History, and use **Reset network data and records** to restore fixtures, clear pending submissions, and clear the last result.

| Scenario | Effect |
| --- | --- |
| success | Stored matches and eight fixture opponents |
| empty | Empty ranking and history responses |
| multiple-pages | Paginated fixtures (24 initial matches) |
| slow | 1.8-second responses |
| variable-latency | Repeating delays: 150, 900, 350, 1100 ms |
| out-of-order | Alternating 1200 and 100 ms responses |
| timeout | Response delayed past Axios's 3-second timeout |
| connection-failure | Network error |
| http-400 / http-500 | HTTP error responses |
| ranking-error / history-error | Failure restricted to one list |
| post-timeout | Store the match before the first response times out; retry returns that record |
| offline | HTTP 503 for lists and registration |

Scenario selection and confirmed records persist through refresh. A finished match is queued before the first request; the player can start another while it is pending. To exercise recovery, select **offline**, finish a match, refresh, switch to **success**, then choose **Retry oldest pending record**. The match ID makes retries idempotent. Rankings compare matches using the same two timing options and sort by score descending, duration ascending, completion time ascending, then match ID.

## Checks

```sh
npm run typecheck
npm run lint
npm run test:unit
npx playwright install chromium
npm run test:e2e
npm run build
```

Playwright runs desktop and mobile Chromium in isolated browser contexts. The game E2E tests use `?test=1` in development to observe state and advance the real simulation one fixed step at a time; they still send keyboard/touch input through the actual controls. Screenshot baselines are in `tests/e2e/visual.spec.ts-snapshots/`. Failed tests retain traces under `test-results/`; `playwright-report/` contains the latest HTML report. A copy of the passing report and a verification summary are included under `reports/`; generated scratch reports are ignored by git. `PIRATE_CHROMIUM=/absolute/path/to/chromium npm run test:e2e` can select a locally installed compatible Chromium binary.

## Remaining work

The game uses authored procedural sprites and simple collision shapes. Sound, a public deployment, and the challenge's full three-minute optimized-build profiling report are not included. Headless screenshot baselines can vary by fonts and GPU across operating systems. The untouched original `GameCanvas.tsx` and `ship.ts` remain as starter references; the playable game uses `BattleCanvas.tsx` and `simulation.ts`.
# batalha-naval
