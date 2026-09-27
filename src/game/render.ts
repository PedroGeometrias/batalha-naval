import { Application, Assets, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import playerAtlas from '../assets/ships/player.png';
import chaserAtlas from '../assets/ships/chaser.png';
import shooterAtlas from '../assets/ships/shooter.png';
import { GAMEPLAY, ISLANDS, tileCenter } from './config';
import { create_ocean } from './render_ocean';
import type { Game, Ship, ShipKind } from './simulation';

const FRAME = 96;
type ShipView = { sprite: Sprite; health: Graphics };
type Frames = Record<ShipKind, Texture[]>;

function frames(texture: Texture): Texture[] {
  return Array.from({ length: 16 }, (_, index) => new Texture({
    source: texture.source,
    frame: new Rectangle((index % 4)*FRAME, Math.floor(index / 4)*FRAME, FRAME, FRAME),
  }));
}
function heading(angle: number): number {
  return ((Math.round(angle * 16 / (Math.PI*2)) % 16) + 16) % 16;
}

function makeIslands(): Graphics {
  const land = new Graphics();
  ISLANDS.forEach((island, index) => {
    const { x, y, rx, ry } = island;
    land.ellipse(x, y+12, rx+15, ry+10).fill(0x102f44);
    land.ellipse(x, y+6, rx+10, ry+10).fill(0xf1c88a);
    land.ellipse(x, y, rx, ry).fill(island.color);
    land.ellipse(x-rx*.33, y-ry*.25, rx*.42, ry*.37).fill(0x85ae7f);
    land.ellipse(x+rx*.26, y+ry*.22, rx*.32, ry*.26).fill(0x426f5e);
    // Rocks, docks, and palm canopies make the silhouettes readable when zoomed out.
    for (let n = 0; n < 4; n++) {
      const seed = index*13 + n*23;
      const px = x + Math.sin(seed)*rx*.68;
      const py = y + Math.cos(seed*1.7)*ry*.55;
      land.ellipse(px+4, py+4, 13, 6).fill(0x3e675c);
      land.ellipse(px, py, 11, 6).fill(0x9ca69a);
      land.ellipse(px-2, py-2, 6, 3).fill(0xd9caae);
    }
    const palmX = x-rx*.21, palmY = y-ry*.08;
    land.ellipse(palmX+6, palmY+10, 22, 9).fill(0x3d7157);
    land.moveTo(palmX, palmY+9).lineTo(palmX+4, palmY-21).stroke({ color: 0x81583e, width: 5 });
    for (let n = 0; n < 6; n++) {
      const a = n*Math.PI/3;
      land.moveTo(palmX+4, palmY-22)
        .quadraticCurveTo(palmX+Math.cos(a)*15, palmY-30+Math.sin(a)*7,
          palmX+Math.cos(a)*27, palmY-23+Math.sin(a)*12)
        .stroke({ color: n%2 ? 0x355b42 : 0x4b8156, width: 6 });
    }
  });
  return land;
}

export async function createBattleView(app: Application) {
  const [playerTexture, chaserTexture, shooterTexture] = await Promise.all([
    Assets.load<Texture>(playerAtlas), Assets.load<Texture>(chaserAtlas), Assets.load<Texture>(shooterAtlas),
  ]);
  const textures: Frames = { player: frames(playerTexture), chaser: frames(chaserTexture), shooter: frames(shooterTexture) };
  const center = tileCenter(GAMEPLAY.mapTiles/2, GAMEPLAY.mapTiles/2);
  const ocean = await create_ocean(GAMEPLAY.mapTiles, GAMEPLAY.mapTiles, {
    left: center.x-app.screen.width/2-96, right: center.x+app.screen.width/2+96,
    top: center.y-app.screen.height/2-96, bottom: center.y+app.screen.height/2+96,
  });
  const world = new Container();
  const projectiles = new Graphics();
  const effects = new Graphics();
  const wakes = new Graphics();
  const ships = new Container();
  world.addChild(ocean.container, wakes, makeIslands(), projectiles, ships, effects);
  app.stage.addChild(world);
  const views = new Map<number, ShipView>();
  let cameraX: number | null = null, cameraY: number | null = null;

  function updateShip(ship: Ship) {
    let view = views.get(ship.id);
    if (!view) {
      const sprite = new Sprite(textures[ship.kind][heading(ship.angle)]);
      sprite.anchor.set(0.5);
      sprite.scale.set(.8);
      const health = new Graphics();
      ships.addChild(sprite, health);
      view = { sprite, health };
      views.set(ship.id, view);
    }
    view.sprite.position.set(ship.x, ship.y);
    view.sprite.texture = textures[ship.kind][heading(ship.angle)];
    view.sprite.alpha = .7 + .3 * ship.hp / ship.maxHp;
    view.health.clear().roundRect(ship.x-20, ship.y-39, 40, 6, 2).fill(0x102834)
      .roundRect(ship.x-19, ship.y-38, 38 * ship.hp/ship.maxHp, 4, 1)
      .fill(ship.kind === 'player' ? 0x78e8c6 : 0xffb178);
  }

  function render(game: Game, dt: number) {
    cameraX = cameraX === null ? game.player.x : cameraX + (game.player.x-cameraX)*(dt === 0 ? 1 : Math.min(1, dt*7));
    cameraY = cameraY === null ? game.player.y : cameraY + (game.player.y-cameraY)*(dt === 0 ? 1 : Math.min(1, dt*7));
    world.position.set(app.screen.width/2-cameraX, app.screen.height/2-cameraY);
    const view = { left: cameraX-app.screen.width/2-96, right: cameraX+app.screen.width/2+96,
      top: cameraY-app.screen.height/2-96, bottom: cameraY+app.screen.height/2+96 };
    ocean.setViewport(view);
    if (dt > 0) ocean.update(dt);
    wakes.clear();
    for (const foam of game.wakes) {
      if (foam.x < view.left || foam.x > view.right || foam.y < view.top || foam.y > view.bottom) continue;
      const fade = 1-foam.age/foam.life;
      const radius = foam.size*(1+foam.age/foam.life);
      wakes.ellipse(foam.x, foam.y, radius*1.6, radius*.8)
        .fill({ color: 0xc8f8ee, alpha: fade*.12 })
        .stroke({ color: 0xd7fbef, width: 1, alpha: fade*.45 });
      wakes.circle(foam.x, foam.y, radius*.32).fill({ color: 0xf0fff6, alpha: fade*.32 });
    }
    const active = new Set([game.player.id, ...game.enemies.map(enemy => enemy.id)]);
    updateShip(game.player);
    for (const enemy of game.enemies) updateShip(enemy);
    for (const [id, view] of views) if (!active.has(id)) {
      view.sprite.destroy(); view.health.destroy(); views.delete(id);
    }
    projectiles.clear();
    for (const shot of game.projectiles) {
      projectiles.circle(shot.x, shot.y, shot.owner === 'player' ? 4 : 5)
        .fill(shot.owner === 'player' ? 0xffe5ae : 0xff765e);
      projectiles.circle(shot.x, shot.y, 8).stroke({ color: shot.owner === 'player' ? 0xfff1c9 : 0xffb783, width: 1, alpha: .5 });
    }
    effects.clear();
    for (const effect of game.effects) {
      const progress = effect.age / effect.life;
      effects.circle(effect.x, effect.y, effect.size*(.35+progress*.8))
        .stroke({ color: effect.color, width: 3, alpha: 1-progress });
      effects.circle(effect.x, effect.y, effect.size*.3*(1-progress))
        .fill({ color: effect.color, alpha: .6*(1-progress) });
    }
  }

  return { render, tileCount: ocean.visibleTileCount, destroy() {
    world.destroy({ children: true });
    for (const atlas of Object.values(textures)) for (const texture of atlas) texture.destroy();
  } };
}
