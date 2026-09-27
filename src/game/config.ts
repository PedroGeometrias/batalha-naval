// All balancing values live here. Options are copied when a match begins.
export const GAMEPLAY = {
  mapTiles: 56,
  tileWidth: 64,
  tileHeight: 32,
  playerHealth: 100,
  playerSpeed: 168,
  playerTurnSpeed: 2.7,
  shipRadius: 17,
  spawnAvoidDistance: 330,
  maxEnemies: 28,
  chaserHealth: 3,
  chaserSpeed: 83,
  chaserDamage: 16,
  shooterHealth: 4,
  shooterSpeed: 65,
  shooterRange: 340,
  shooterStopRange: 220,
  shooterCooldown: 2.0,
  frontCooldown: 0.25,
  broadsideCooldown: 1.1,
  frontDamage: 1,
  broadsideDamage: 1,
  hostileDamage: 9,
  frontProjectileSpeed: 410,
  hostileProjectileSpeed: 250,
  projectileLifetime: 2.0,
} as const;

export type Island = { x: number; y: number; rx: number; ry: number; color: number };
export function tileCenter(col: number, row: number) {
  return { x: (col - row) * 32 + 32, y: (col + row) * 16 + 16 };
}
const island = (col: number, row: number, rx: number, ry: number, color: number): Island =>
  ({ ...tileCenter(col, row), rx, ry, color });

export const ISLANDS: Island[] = [
  island(15, 14, 115, 67, 0x609175),
  island(33, 25, 125, 65, 0x628a74),
  island(18, 39, 120, 70, 0x547d6d),
  island(41, 16, 100, 56, 0x638a6b),
  island(42, 42, 135, 73, 0x739771),
  island(7, 29, 100, 60, 0x557f70),
  island(27, 8, 108, 63, 0x689b77),
];
