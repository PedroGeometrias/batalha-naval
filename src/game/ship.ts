import {
    Graphics
}from "pixi.js";

// some constants
const SPEED = 200;
const ROTATION_SPEED = 2.5;

export type Ship = {
    x:number;
    y:number;
    rotation:number;
};

export function create_ship(x:number, y:number):Ship{
    return {x, y, rotation:0};
}

export function create_ship_graphics():Graphics{
    return new Graphics()
        // temporary ship polygon, we are gonna use a sprite for this [GREP_THIS_LATER]
        .poly([
            25, 0,
            -20, -14,
            -12, 0,
            -20, 14,
        ])
        // temp ship is white
        .fill(0xffffff);
}

export function render_ship(
    ship: Ship,
    graphics: Graphics,
){
    graphics.x = ship.x;
    graphics.y = ship.y;
    graphics.rotation = ship.rotation;
}

export function update_ship(ship: Ship, keys: Set<string>, dt:number){
    if (keys.has("KeyA")) {
        ship.rotation -= ROTATION_SPEED * dt;
    }

    if (keys.has("KeyD")) {
        ship.rotation += ROTATION_SPEED * dt;
    }

    // moving it, we also should do a circle like movement
    if (keys.has("KeyW")) {
        ship.x += Math.cos(ship.rotation) * SPEED * dt;
        ship.y += Math.sin(ship.rotation) * SPEED * dt;
    }
}
