import type { GameOptions } from '../settings';
import { GAMEPLAY as C, ISLANDS, tileCenter } from './config.ts';

export type Controls = {
  forward: boolean; left: boolean; right: boolean;
  front: boolean; broadsideLeft: boolean; broadsideRight: boolean;
};
export type ShipKind = 'player' | 'chaser' | 'shooter';
export type Ship = { id: number; kind: ShipKind; x: number; y: number; angle: number;
  hp: number; maxHp: number; cooldown: number };
export type Projectile = { id: number; x: number; y: number; vx: number; vy: number;
  owner: 'player' | 'enemy'; damage: number; life: number };
export type Effect = { id: number; x: number; y: number; age: number;
  life: number; size: number; color: number };
export type Wake = { x: number; y: number; age: number; life: number; size: number };
export type SoundEvent = 'cannon' | 'hit' | 'explosion';
export type Game = { player: Ship; enemies: Ship[]; projectiles: Projectile[]; effects: Effect[];
  wakes: Wake[]; wakeTravel: Map<number, number>; soundEvents: SoundEvent[];
  score: number; elapsed: number; remaining: number; spawnClock: number; spawnCount: number;
  frontCooldown: number; broadsideCooldown: number; ended: 'time' | 'death' | null;
  options: GameOptions; nextId: number; seed: number };

export function withinArena(x: number, y: number, margin = 1): boolean {
  const a = (x - 32) / 32;
  const b = (y - 16) / 16;
  const col = (a + b) / 2;
  const row = (b - a) / 2;
  return col >= margin && row >= margin && col <= C.mapTiles - 1 - margin
    && row <= C.mapTiles - 1 - margin;
}

export function hitsIsland(x: number, y: number, radius = 0): boolean {
  return ISLANDS.some(land => {
    const dx = (x - land.x) / (land.rx + radius);
    const dy = (y - land.y) / (land.ry + radius);
    return dx*dx + dy*dy < 1;
  });
}

export function createGame(options: GameOptions, seed = 81027): Game {
  const center = tileCenter(C.mapTiles / 2, C.mapTiles / 2);
  return { player: { id: 0, kind: 'player', ...center, angle: 0,
      hp: C.playerHealth, maxHp: C.playerHealth, cooldown: 0 },
    enemies: [], projectiles: [], effects: [], wakes: [], wakeTravel: new Map(),
    soundEvents: [], score: 0, elapsed: 0,
    remaining: options.sessionTime, spawnClock: 0, spawnCount: 0,
    frontCooldown: 0, broadsideCooldown: 0, ended: null, options: { ...options },
    nextId: 1, seed: seed || 1 };
}

function random(game: Game): number {
  let x = game.seed;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  game.seed = x;
  return (x >>> 0) / 4294967296;
}
function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function effect(game: Game, x: number, y: number, color: number, size: number, life = 0.34) {
  game.effects.push({ id: game.nextId++, x, y, age: 0, life, color, size });
}
function move(ship: Ship, x: number, y: number) {
  const startX = ship.x, startY = ship.y;
  if (withinArena(x, ship.y, 1.2) && !hitsIsland(x, ship.y, C.shipRadius)) ship.x = x;
  if (withinArena(ship.x, y, 1.2) && !hitsIsland(ship.x, y, C.shipRadius)) ship.y = y;
  return Math.hypot(ship.x-startX, ship.y-startY);
}
function leaveWake(game: Game, ship: Ship, distance: number) {
  if (distance === 0) return;
  const travelled = (game.wakeTravel.get(ship.id) ?? 0) + distance;
  game.wakeTravel.set(ship.id, travelled % 12);
  if (travelled < 12) return;
  const behindX = ship.x - Math.cos(ship.angle)*27;
  const behindY = ship.y - Math.sin(ship.angle)*27;
  for (const side of [-1, 1]) {
    const variation = Math.sin(ship.id*13 + game.elapsed*47 + side*19);
    const spread = side*(8 + variation*3);
    game.wakes.push({ x: behindX + Math.sin(ship.angle)*spread + variation*2,
      y: behindY - Math.cos(ship.angle)*spread + variation,
      age: 0, life: .6 + Math.abs(variation)*.2, size: 3 + Math.abs(variation)*1.2 });
  }
}
function shoot(game: Game, x: number, y: number, angle: number, owner: 'player' | 'enemy', damage: number, speed: number) {
  const vx = Math.cos(angle), vy = Math.sin(angle);
  game.projectiles.push({ id: game.nextId++, x: x + vx*21, y: y + vy*21,
    vx: vx*speed, vy: vy*speed, owner, damage, life: C.projectileLifetime });
  effect(game, x + vx*23, y + vy*23, owner === 'player' ? 0xffdb8b : 0xff866d, 13, 0.14);
}
function spawn(game: Game) {
  if (game.enemies.length >= C.maxEnemies) return;
  const kind = game.spawnCount++ % 2 === 0 ? 'chaser' : 'shooter';
  for (let attempt = 0; attempt < 80; attempt++) {
    const col = 3 + random(game)*(C.mapTiles - 6);
    const row = 3 + random(game)*(C.mapTiles - 6);
    const point = tileCenter(col, row);
    if (dist(point, game.player) < C.spawnAvoidDistance || hitsIsland(point.x, point.y, C.shipRadius)
      || game.enemies.some(enemy => dist(enemy, point) < 65)) continue;
    const hp = kind === 'chaser' ? C.chaserHealth : C.shooterHealth;
    game.enemies.push({ id: game.nextId++, kind, ...point,
      angle: Math.atan2(game.player.y-point.y, game.player.x-point.x),
      hp, maxHp: hp, cooldown: 0.6 + random(game) });
    effect(game, point.x, point.y, 0xa9e4d4, 28, 0.5);
    break;
  }
}

export function stepGame(game: Game, input: Controls, delta: number): void {
  if (game.ended || delta <= 0) return;
  const dt = Math.min(delta, 0.1);
  game.elapsed += dt;
  game.remaining = Math.max(0, game.options.sessionTime - game.elapsed);
  if (game.remaining === 0) { game.ended = 'time'; return; }

  const ship = game.player;
  ship.angle += (Number(input.right) - Number(input.left)) * C.playerTurnSpeed * dt;
  if (input.forward) leaveWake(game, ship, move(ship, ship.x + Math.cos(ship.angle)*C.playerSpeed*dt,
    ship.y + Math.sin(ship.angle)*C.playerSpeed*dt));

  game.frontCooldown = Math.max(0, game.frontCooldown - dt);
  game.broadsideCooldown = Math.max(0, game.broadsideCooldown - dt);
  if (input.front && game.frontCooldown === 0) {
    shoot(game, ship.x, ship.y, ship.angle, 'player', C.frontDamage, C.frontProjectileSpeed);
    game.soundEvents.push('cannon');
    game.frontCooldown = C.frontCooldown;
  }
  if ((input.broadsideLeft || input.broadsideRight) && game.broadsideCooldown === 0) {
    const direction = input.broadsideLeft ? -1 : 1;
    const angle = ship.angle + direction*Math.PI/2;
    for (const offset of [-13, 0, 13]) shoot(game,
      ship.x + Math.cos(ship.angle)*offset, ship.y + Math.sin(ship.angle)*offset,
      angle, 'player', C.broadsideDamage, C.frontProjectileSpeed);
    game.soundEvents.push('cannon');
    game.broadsideCooldown = C.broadsideCooldown;
  }

  game.spawnClock += dt;
  while (game.spawnClock >= game.options.spawnTime) {
    game.spawnClock -= game.options.spawnTime;
    spawn(game);
  }

  for (const enemy of game.enemies) {
    const distance = dist(enemy, ship);
    const angle = Math.atan2(ship.y-enemy.y, ship.x-enemy.x);
    enemy.angle = angle;
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);
    if (enemy.kind === 'chaser' || distance > C.shooterStopRange) {
      const speed = enemy.kind === 'chaser' ? C.chaserSpeed : C.shooterSpeed;
      leaveWake(game, enemy, move(enemy, enemy.x + Math.cos(angle)*speed*dt,
        enemy.y + Math.sin(angle)*speed*dt));
    }
    if (enemy.kind === 'shooter' && distance < C.shooterRange && enemy.cooldown === 0) {
      shoot(game, enemy.x, enemy.y, angle, 'enemy', C.hostileDamage, C.hostileProjectileSpeed);
      game.soundEvents.push('cannon');
      enemy.cooldown = C.shooterCooldown;
    }
    if (enemy.kind === 'chaser' && dist(enemy, ship) < C.shipRadius*1.8) {
      ship.hp = Math.max(0, ship.hp - C.chaserDamage);
      enemy.hp = 0;
      effect(game, enemy.x, enemy.y, 0xffac73, 38, 0.45);
      effect(game, ship.x, ship.y, 0xff6565, 22);
      game.soundEvents.push('explosion', 'hit');
    }
  }
  game.enemies = game.enemies.filter(enemy => enemy.hp > 0);

  for (const projectile of game.projectiles) {
    projectile.x += projectile.vx*dt;
    projectile.y += projectile.vy*dt;
    projectile.life -= dt;
    if (projectile.life <= 0 || !withinArena(projectile.x, projectile.y, 0)
      || hitsIsland(projectile.x, projectile.y, 3)) {
      projectile.life = 0;
      if (hitsIsland(projectile.x, projectile.y, 3)) {
        effect(game, projectile.x, projectile.y, 0xf4dfa7, 11);
        game.soundEvents.push('hit');
      }
      continue;
    }
    if (projectile.owner === 'player') {
      const target = game.enemies.find(enemy => enemy.hp > 0 && dist(enemy, projectile) < C.shipRadius);
      if (target) {
        target.hp = Math.max(0, target.hp - projectile.damage);
        projectile.life = 0;
        effect(game, projectile.x, projectile.y, 0xffde95, target.hp ? 13 : 38, target.hp ? 0.25 : 0.55);
        game.soundEvents.push(target.hp ? 'hit' : 'explosion');
        if (target.hp === 0) game.score++;
      }
    } else if (dist(ship, projectile) < C.shipRadius) {
      ship.hp = Math.max(0, ship.hp - projectile.damage);
      projectile.life = 0;
      effect(game, ship.x, ship.y, 0xff7373, 25);
      game.soundEvents.push('hit');
    }
  }
  game.enemies = game.enemies.filter(enemy => enemy.hp > 0);
  game.projectiles = game.projectiles.filter(projectile => projectile.life > 0);
  for (const wake of game.wakes) wake.age += dt;
  game.wakes = game.wakes.filter(wake => wake.age < wake.life);
  for (const id of game.wakeTravel.keys()) {
    if (id !== ship.id && !game.enemies.some(enemy => enemy.id === id)) game.wakeTravel.delete(id);
  }
  for (const visual of game.effects) visual.age += dt;
  game.effects = game.effects.filter(visual => visual.age < visual.life);
  if (ship.hp === 0) game.ended = 'death';
}
