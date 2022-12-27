export class Layer {
    #canvas
    #ctx;

    #paths = [];
    #animations = [];

    get canvas() {return this.#canvas;}
    get ctx() {return this.#ctx;}
    get animations() {return this.#animations;}
    get paths() {return this.#paths;}

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(canvas, ctx) {
        this.#canvas = canvas;
        this.#ctx = ctx;
    }

    /**
     * @param {number} delta
     */
    render(delta) {
        for (const animation of this.animations) {
            animation.apply(this, delta);
        }

        for (const path of this.paths) {
            path.render(this.#ctx, delta);
        }
    }

    /**
     * @param {Path} path
     */
    addPath(path) {
        this.paths.push(path);
    }

    /**
     * @param {Path[]} paths
     */
    addPaths(paths) {
        for (const path of paths) {
            this.addPath(path);
        }
    }

    /**
     * @param {ILayerAnimation} animation
     */
    addAnimation(animation) {
        this.animations.push(animation);
    }
}