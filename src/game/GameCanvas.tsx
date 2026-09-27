import{ 
    useEffect, useRef 
}from "react";
import{ 
    Application, 
}from "pixi.js";
import { 
    create_ship, 
    create_ship_graphics, 
    render_ship, 
    update_ship
}from "./ship";
import { create_ocean} from "./render_ocean";

function get_keys() {
    // storing te current held keys
    const keys = new Set<string>();

    // pressed
    function keyDown(event: KeyboardEvent) {
        keys.add(event.code);
    }

    // not pressed
    function keyUp(event: KeyboardEvent) {
        keys.delete(event.code);
    }

    // liseting for the keys, we don't do this inside the events checks because moviment should
    // be driven b the game loop, not key board reapeting timing
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    return {
        keys,

        destroy() {
            window.removeEventListener("keydown", keyDown);
            window.removeEventListener("keyup", keyUp);
        },
    };
}

// main game guy, here we create the main html element for the game
export function GameCanvas() {
    // this will give us a reference that will point at the html element created here, so for now it's null
    const containerRef = useRef<HTMLDivElement>(null);

    // this runs the code after react has mounted the component
    useEffect(() => {
        // so the container now is an real DOM element
        const container = containerRef.current;
        // checking if it's null
        if(!container){
            return;
        }
        // pixi central object
        const app = new Application();
        // setting up some flags
        let destroyed = false;
        let initialized = false;

        // we asynchroniusly initialize that pixi object
        async function init(container: HTMLDivElement) {
            await app.init({
                // this object resizes to the current container size
                resizeTo: container,
                // background color
                background: "#163f5c",
                // smooths the renderer edge
                antialias: true,
            });
            initialized = true;

            // while wating for init, react may have destroyed the compenent
            if (destroyed) {
                app.destroy(true);
                return;
            }
            // now pixis has created the canvas, that's the html object, and we are gonna return it
            container.appendChild(app.canvas);
            // ship is a Graphics object 
            const ship = create_ship(app.screen.width / 2, app.screen.height/ 2); 
            const ship_graphics = create_ship_graphics();

            //ocean obj
            const ocean = await create_ocean(20,20);
            ocean.container.x = app.screen.width / 2;
            ocean.container.y = 50;
            app.stage.addChild(ocean.container);


            // adding the ship to pixi scene graph
            app.stage.addChild(ship_graphics);
            const input = get_keys(); 
            // this is the game loop, pixi ticker will call this every frame
            app.ticker.add((ticker) => {
                // elapsed time in milliseconds into seconds
                const dt = ticker.deltaMS / 1000;
                update_ship(ship, input.keys, dt);
                render_ship(ship, ship_graphics);
                ocean.update(dt);

                // here we update the ship
            });
        }

        // initi
        void init(container);

        return () => {
            destroyed = true;

             // Do NOT destroy a Pixi Application before app.init()
             // has completed.
            if (initialized) {
                app.destroy(true);
            }
        };
    }, []);

    return <div ref={containerRef} className="game-canvas" />;
}
