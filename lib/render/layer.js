import {BoundaryBox} from "../physics/common/boundary.js";

export class Path {
    static DefaultPalette = {fill: "black", stroke: "gray"}

    #alpha = 1;
    #lineWidth = 1;
    #palette;
    #points;
    #animations = [];

    get alpha() {return this.#alpha;}
    get palette() {return this.#palette;}
    get points() {return this.#points;}
    get boundary() {
        const b = BoundaryBox.fromPoints(this.#points);
        const lw = this.#lineWidth;
        return b.update(b.left - lw, b.right + lw, b.top - lw, b.bottom + lw);
    }

    get animations() {return this.#animations;}

    constructor(points, palette = null) {
        this.#points = points;
        this.#palette = palette ?? Object.assign({}, Path.DefaultPalette)
    }

    setAlpha(value) {
        this.#alpha = value;

        return this;
    }

    setLineWidth(value) {
        this.#lineWidth = value;

        return this;
    }

    setPalette(palette) {
        this.#palette.fill = palette.fill;
        this.#palette.stroke = palette.stroke;

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
        ctx.lineWidth = this.#lineWidth;

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