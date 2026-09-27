import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame, withinArena, type Controls } from '../src/game/simulation.ts';
import { visibleTiles } from '../src/game/visible_tiles.ts';

const idle: Controls = { forward: false, left: false, right: false, front: false, broadsideLeft: false, broadsideRight: false };

test('forward movement and rotation are based on elapsed seconds', () => {
  const game = createGame({ sessionTime: 120, spawnTime: 10 });
  const x = game.player.x;
  stepGame(game, { ...idle, forward: true, right: true }, 0.1);
  assert.ok(game.player.x > x);
  assert.ok(game.player.angle > 0);
});

test('only tiles intersecting the camera rectangle are selected', () => {
  const near = visibleTiles(56, 56, { left: -250, top: 700, right: 250, bottom: 1100 });
  const far = visibleTiles(56, 56, { left: 600, top: 700, right: 1100, bottom: 1100 });
  assert.ok(near.length > 0 && near.length < 56*56);
  assert.ok(far.length > 0 && far.length < 56*56);
  assert.ok(near.every(tile => tile.x < 250 && tile.x+64 > -250
    && tile.y < 1100 && tile.y+32 > 700));
  assert.ok(near.some(tile => !far.some(other => other.id === tile.id)));
  assert.deepEqual(visibleTiles(56, 56, { left: 5000, top: 5000, right: 5400, bottom: 5400 }), []);
});

test('moving boats leave temporary wake foam and stationary boats do not', () => {
  const game = createGame({ sessionTime: 120, spawnTime: 10 });
  for (let i = 0; i < 30; i++) stepGame(game, idle, 1/60);
  assert.equal(game.wakes.length, 0);
  for (let i = 0; i < 30; i++) stepGame(game, { ...idle, forward: true }, 1/60);
  assert.ok(game.wakes.length > 0);
  assert.ok(game.wakes.every(foam => foam.x < game.player.x));
  for (let i = 0; i < 90; i++) stepGame(game, idle, 1/60);
  assert.equal(game.wakes.length, 0);
  game.enemies.push({ id: 901, kind: 'chaser', x: game.player.x+400, y: game.player.y,
    angle: Math.PI, hp: 4, maxHp: 4, cooldown: 0 });
  for (let i = 0; i < 30; i++) stepGame(game, idle, 1/60);
  assert.ok(game.wakes.length > 0);
});

test('a ship cannot leave the diamond shaped sea', () => {
  const game = createGame({ sessionTime: 120, spawnTime: 10 });
  for (let i = 0; i < 500; i++) stepGame(game, { ...idle, forward: true }, 0.05);
  assert.equal(withinArena(game.player.x, game.player.y), true);
});

test('both enemy types spawn during a default match', () => {
  const game = createGame({ sessionTime: 120, spawnTime: 10 });
  for (let i = 0; i < 210; i++) stepGame(game, idle, 0.1);
  assert.ok(game.enemies.some(enemy => enemy.kind === 'chaser'));
  assert.ok(game.enemies.some(enemy => enemy.kind === 'shooter'));
});

test('a projectile scores for one enemy only and an ended match stays stopped', () => {
  const game = createGame({ sessionTime: 120, spawnTime: 10 });
  game.enemies = [{ id: 999, kind: 'chaser', x: game.player.x + 90, y: game.player.y,
    angle: 0, hp: 1, maxHp: 1, cooldown: 0 }];
  stepGame(game, { ...idle, front: true }, 0.01);
  for (let i = 0; i < 20; i++) stepGame(game, idle, 0.02);
  assert.equal(game.score, 1);
  assert.equal(game.enemies.length, 0);
  game.elapsed = game.options.sessionTime - 0.01;
  stepGame(game, idle, 0.02);
  assert.equal(game.ended, 'time');
  const score = game.score;
  const elapsed = game.elapsed;
  stepGame(game, { ...idle, front: true, forward: true }, 10);
  assert.equal(game.score, score);
  assert.equal(game.elapsed, elapsed);
});

test('islands block ships and projectiles', async () => {
  const { ISLANDS, GAMEPLAY } = await import('../src/game/config.ts');
  const game = createGame({ sessionTime: 120, spawnTime: 10 });
  const land = ISLANDS[0];
  game.player.x = land.x - land.rx - GAMEPLAY.shipRadius - 2;
  game.player.y = land.y;
  const before = game.player.x;
  stepGame(game, { ...idle, forward: true }, 0.1);
  assert.equal(game.player.x, before);
  game.projectiles.push({ id: 1001, x: land.x-land.rx-3, y: land.y,
    vx: 150, vy: 0, owner: 'player', damage: 1, life: 1 });
  stepGame(game, idle, 0.02);
  assert.equal(game.projectiles.length, 0);
});

test('front and broadside weapons use independent cooldowns', () => {
  const game = createGame({ sessionTime: 120, spawnTime: 10 });
  for (let i = 0; i < 5; i++) stepGame(game, { ...idle, front: true }, 0.02);
  assert.equal(game.projectiles.length, 1);
  stepGame(game, { ...idle, broadsideLeft: true }, 0.02);
  assert.equal(game.projectiles.length, 4);
});

test('combat emits one sound cue per volley and one when the player is hit', () => {
  const game = createGame({ sessionTime: 120, spawnTime: 10 });
  stepGame(game, { ...idle, front: true }, .02);
  assert.deepEqual(game.soundEvents, ['cannon']);
  game.soundEvents.length = 0;
  stepGame(game, { ...idle, broadsideRight: true }, .02);
  assert.deepEqual(game.soundEvents, ['cannon']);
  game.soundEvents.length = 0;
  game.projectiles.push({ id: 1002, x: game.player.x, y: game.player.y,
    vx: 0, vy: 0, owner: 'enemy', damage: 1, life: 1 });
  stepGame(game, idle, .02);
  assert.deepEqual(game.soundEvents, ['hit']);
});

test('Shooter attacks in range and a fatal hit ends combat', () => {
  const game = createGame({ sessionTime: 120, spawnTime: 10 });
  game.enemies.push({ id: 901, kind: 'shooter', x: game.player.x + 220, y: game.player.y - 100,
    angle: 0, hp: 4, maxHp: 4, cooldown: 0 });
  stepGame(game, idle, 0.02);
  assert.equal(game.projectiles.filter(p => p.owner === 'enemy').length, 1);
  game.player.hp = 1;
  game.projectiles.push({ id: 902, x: game.player.x, y: game.player.y,
    vx: 0, vy: 0, owner: 'enemy', damage: 9, life: 1 });
  stepGame(game, idle, 0.02);
  assert.equal(game.ended, 'death');
  const newGame = createGame(game.options);
  assert.equal(newGame.player.hp, 100);
  assert.equal(newGame.score, 0);
  assert.equal(newGame.ended, null);
});
