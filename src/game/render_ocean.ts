import {
    AnimatedSprite,
    Assets,
    Container,
    Sprite,
} from "pixi.js";

import water0 from "../assets/water-0001.png";

import wave1 from "../assets/water-0002.png";
import wave2 from "../assets/water-0003.png";
import wave3 from "../assets/water-0004.png";
import wave4 from "../assets/water-0005.png";
import { visibleTiles, type Viewport } from './visible_tiles';

export type Ocean = {
    container: Container;
    update: (dt: number) => void;
    setViewport: (view: Viewport) => void;
    visibleTileCount: () => number;
};

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

// since isometric relies on rhombus shaped tiles, we walk on the x and y axis diagonally, so half right
// and half down
function world_to_screen(x: number, y: number) {
    return {
        x: ((x - y) * TILE_WIDTH) / 2,
        y: ((x + y) * TILE_HEIGHT) / 2,
    };
}

export async function create_ocean(
    width: number,
    height: number,
    initialViewport?: Viewport,
): Promise<Ocean> {
    const ocean = new Container();

    const water_layer = new Container();
    const wave_layer = new Container();

    ocean.addChild(water_layer);
    ocean.addChild(wave_layer);

    const water_texture = await Assets.load(water0);

    const wave_textures = await Promise.all([
        Assets.load(wave1),
        Assets.load(wave2),
        Assets.load(wave3),
        Assets.load(wave4),
    ]);

    const tile_positions: { x: number; y: number }[] = [];
    const tiles = new Map<number, Sprite>();

    function setViewport(view: Viewport) {
        const selected = visibleTiles(width, height, view);
        const wanted = new Set(selected.map(tile => tile.id));
        for (const [id, sprite] of tiles) {
            if (!wanted.has(id)) {
                sprite.destroy();
                tiles.delete(id);
            }
        }
        tile_positions.length = 0;
        for (const tile of selected) {
            if (!tiles.has(tile.id)) {
                const sprite = new Sprite(water_texture);
                const position = world_to_screen(tile.id % width, Math.floor(tile.id / width));
                sprite.position.set(position.x, position.y);
                water_layer.addChild(sprite);
                tiles.set(tile.id, sprite);
            }
            tile_positions.push({ x: tile.x, y: tile.y });
        }
        for (const wave of [...wave_layer.children]) {
            if (wave.x+TILE_WIDTH < view.left || wave.x > view.right
                || wave.y+TILE_HEIGHT < view.top || wave.y > view.bottom) wave.destroy();
        }
    }

    setViewport(initialViewport ?? { left: -height*32, top: 0,
        right: width*32+TILE_WIDTH, bottom: (width+height)*16+TILE_HEIGHT });

    let wave_timer = 0;

    function spawn_wave(){
        if (!tile_positions.length) return;
        const index = Math.floor(
            Math.random() * tile_positions.length
        );

        const position = tile_positions[index];

        const wave = new AnimatedSprite(wave_textures);

        wave.x = position.x;
        wave.y = position.y;

        wave.loop = false;
        wave.animationSpeed = 0.01;

        wave.onComplete = () => {
            wave.destroy();
        };

        wave_layer.addChild(wave);

        wave.play();
    }

    function update_ocean(dt: number){
        wave_timer -= dt;

        if(wave_timer <= 0){
            spawn_wave();

            // another wave in roughly 0.5 - 1.5 seconds
            wave_timer = 10.5 + Math.random();
        }
    }

    return {
        container: ocean,
        update: update_ocean,
        setViewport,
        visibleTileCount: () => tiles.size,
    };
}
