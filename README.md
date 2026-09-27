[# Pirate Battle

A small naval combat game built with **React, TypeScript and PixiJS** for the Jungle Gaming Frontend Game Developer challenge.

The game takes place in an isometric ocean arena where the player controls a pirate ship, fights different enemy types, avoids islands and survives until the match timer ends.

## Live Demo

https://pirate-battle-omega.vercel.app

## Features

- Isometric naval combat
- 16-direction ship rendering
- Player ship with:
  - front cannon
  - port broadside
  - starboard broadside
- Multiple enemy behaviors
  - Chaser
  - Shooter
- Enemy spawning during the match
- Islands and collision handling
- Health and match HUD
- Configurable game session duration
- Configurable enemy spawn interval
- Pause support
- Automatic pause when browser focus is lost
- Particle and combat effects
- Main menu
- Options screen
- Result screen
- Ranking
- Match history
- Persistent player and match data
- Desktop and mobile controls
- Simulated backend using MSW
- Network failure scenarios for testing
- Axios API client
- TanStack Query integration

The project uses a combination of **assets supplied with the challenge**, custom sprites and procedural visual elements.

## Running Locally

Requirements:

- Node.js 22+
- npm

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the production version:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The production build is generated in:

```text
dist/
```

## Controls

### Keyboard

| Key | Action |
|---|---|
| `W` | Move forward |
| `A` | Turn left |
| `D` | Turn right |
| `J` | Fire front cannon |
| `Q` | Fire port broadside |
| `E` | Fire starboard broadside |
| `Space` / `Esc` | Pause |

The front cannon fires in the direction the ship is currently facing.

The broadside cannons fire multiple projectiles from either side of the ship.

### Mobile

Touch controls are displayed when using the game on mobile devices and provide movement and weapon controls without requiring a keyboard.

## Gameplay

The goal is to survive the match while destroying enemy ships.

Two primary enemy behaviors are implemented:

### Chaser

Moves toward the player and attempts to remain close enough to apply pressure.

### Shooter

Tries to maintain a useful combat position and attacks the player with ranged projectiles.

Enemies continue spawning according to the configured spawn interval.

The match ends when:

- the game session timer reaches zero; or
- the player ship is destroyed.

The result is then recorded and displayed on the Result screen.

## Configuration

Gameplay options can be changed from the **Options** screen.

Currently configurable settings include:

- Game session time
- Enemy spawn time

The selected settings are persisted locally so they remain available after reloading the application.

## Ranking

The Ranking screen displays persisted match results using the simulated backend.

The browser is assigned a persistent player identifier so matches created by the same installation can be associated with the same player.

## Match History

Match History displays previous matches belonging to the current player.

Match data is persisted through the application's mocked API layer rather than being stored only inside the active game session.

## Networking

The networking layer is intentionally separated from the game implementation.

It uses:

- **Axios** for HTTP communication
- **TanStack Query** for server-state management
- **MSW** for the simulated backend
- persistent fixtures for ranking and match data

This allows the application to behave similarly to a frontend connected to a real backend while still remaining completely self-contained for the challenge.

## Network Scenarios

The project includes selectable network scenarios for testing different backend conditions.

They can be changed through the application's network scenario controls.

Scenarios are used to reproduce behavior such as:

- normal responses
- delayed responses
- failed requests
- timeout/retry situations
- ordering-related response conditions

The active scenario can also be reset back to the default state through the same controls.

This was implemented so failure handling can be tested without changing application code or requiring an external backend.

## Persistence

The application persists relevant information locally, including:

- player identity
- gameplay options
- match records
- ranking data
- mocked backend state

Pending match writes are handled separately so interrupted requests can be recovered instead of silently losing the result.

## Architecture

The project is split between the React application layer and the PixiJS game layer.

React is responsible for:

- screens and navigation
- configuration
- ranking
- match history
- network state
- result presentation

PixiJS is responsible for:

- rendering
- the game loop
- player movement
- enemies
- projectiles
- collisions
- particles
- the game world

The game exposes only the state required by the application instead of coupling React directly to internal gameplay systems.

Additional implementation notes are available in:

```text
ARCHITECTURE.md
```

## Rendering

The game uses an isometric-style projection and a larger world than the visible viewport.

Rendering work is limited to the relevant visible region where possible so the game does not need to render the entire map every frame.

Ships use multiple directional sprites to avoid visually rotating a single flat image and to preserve the intended isometric appearance.

Particle effects are used for movement and combat feedback.

## Testing

The repository contains automated tests covering application and game behavior, including unit/integration tests and browser-level tests.

The exact available commands can be listed with:

```bash
npm run
```

The project should always pass a production build before submission:

```bash
npm run build
```

The deployed production version can also be tested directly at:

https://pirate-battle-omega.vercel.app

## Mock Service Worker

MSW is initialized using:

```text
public/mockServiceWorker.js
```

Because the application uses Vite's base URL when registering the worker, the same configuration works in both local development and the deployed production build.

## Technical Decisions

The implementation intentionally keeps the game and application infrastructure relatively simple.

The main goals were:

- keep gameplay logic isolated from React
- avoid unnecessary abstractions
- keep network behavior replaceable
- make backend failure cases reproducible
- preserve predictable gameplay behavior
- keep rendering appropriate for a browser-based PixiJS game

Several systems use intentionally straightforward implementations rather than introducing additional frameworks or complex architecture for a small challenge project.

## Stack

- React
- TypeScript
- PixiJS
- Vite
- Axios
- TanStack Query
- MSW
- Playwright
- Vitest

## Repository

https://github.com/PedroGeometrias/batalha-naval
](http://localhost:4174/)
