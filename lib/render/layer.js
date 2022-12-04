import {BoundaryBox} from "../physics/body.js";

export class Path {
    #alpha = 1;
    #palette;
    #points;
    #animations = [];

    get alpha() {return this.#alpha;}
    get palette() {return this.#palette;}
    get points() {return this.#points;}
    get boundary() {return BoundaryBox.fromPoints(this.#points);}

    get animations() {return this.#animations;}

    constructor(points, palette) {
        this.#palette = palette;
        this.#points = points;
    }

    setAlpha(value) {
        this.#alpha = value;

        return this;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} delta
     */
    render(ctx, delta) {
        for (const animation of this.animations) {
            animation.apply(this, delta);
        }

        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.palette.fill;
        ctx.strokeStyle = this.palette.stroke;

        ctx.beginPath();
        ctx.moveTo(this.#points[0].x, this.#points[0].y)
        for (let i = 1; i <= this.#points.length; i++) {
            const point = this.#points[i % this.#points.length];
            ctx.lineTo(point.x, point.y);
        }

        ctx.stroke();
        ctx.fill();

        ctx.globalAlpha = 1;
    }

    /**
     * @param {IPathAnimation} animation
     */
    addAnimation(animation) {
        this.animations.push(animation);
    }
}

export class Layer {
    #canvas
    #ctx;
    #boundary;

    #paths = [];
    #animations = [];

    get canvas() {return this.#canvas;}
    get ctx() {return this.#ctx;}
    get boundary() {return this.#boundary;}
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

        if (this.#boundary) {
            const pathBoundary = path.boundary;
            this.#boundary.update(
                Math.min(this.#boundary.left, pathBoundary.left),
                Math.max(this.#boundary.right, pathBoundary.right),
                Math.min(this.#boundary.top, pathBoundary.top),
                Math.max(this.#boundary.bottom, pathBoundary.bottom),
            );
        } else {
            this.#boundary = path.boundary;
        }
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