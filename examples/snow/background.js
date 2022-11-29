import * as CommonUtils from "../common/utils.js";
import {Vector2} from "../../lib/utils/vector.js";
import {BoundaryBox} from "../../lib/physics/body.js";

export class BackgroundDrawer {
    #dpr;
    #canvasWidth;
    #canvasHeight;

    #bgCanvas;
    #bgCtx;

    #fgCanvas;
    #fgCtx;


    constructor() {
        [this.#bgCanvas, this.#bgCtx] = this.#createCanvas();
        [this.#fgCanvas, this.#fgCtx] = this.#createCanvas();

        const color1 = "#b0cdd9"
        const color2 = "#e4f2f8"
        this.#bgCanvas.style.background = `linear-gradient(10deg, ${color1}, ${color2})`;
    }

    run() {
        this.#drawBg();
    }

    #createCanvas() {
        const canvas = document.createElement("canvas");
        canvas.classList.add("canvas");

        document.body.appendChild(canvas);

        const {dpr, canvasWidth, canvasHeight} = CommonUtils.initCanvas(canvas);
        if (this.#dpr === undefined) {
            this.#dpr = dpr;
            this.#canvasWidth = canvasWidth;
            this.#canvasHeight = canvasHeight;
        }

        const ctx = canvas.getContext("2d");
        ctx.scale(this.#dpr, this.#dpr);

        return [canvas, ctx];
    }

    #drawBg() {
        this.#bgCtx.globalAlpha = 0.2;

        this.#bgCtx.fillStyle = "#457886";
        this.#bgCtx.strokeStyle = "#147186";

        this.#drawPath(this.#bgCtx, this.#generatePath(
            this.#canvasHeight / 10, 100, 200,
            i => (Math.sin(i / 25) + Math.cos(i / 15) + Math.sin(i / 5)) / 3
        ));

        this.#drawPath(this.#bgCtx, this.#generatePath(
            this.#canvasHeight * 3 / 10, 100, 200,
            i => (Math.sin(i / 13) + Math.sin(i / 11) + Math.cos(i / 7) + Math.sin(i / 5)) / 4
        ));

        this.#bgCtx.fillStyle = "#6dabbd";
        this.#bgCtx.strokeStyle = "#2494ae";

        this.#drawPath(this.#bgCtx, this.#generatePath(
            this.#canvasHeight * 5 / 10, 70, 200,
            i => (Math.sin(i / 30) + Math.cos(i / 11) + Math.sin(i / 9)) / 3
        ));

        this.#drawPath(this.#bgCtx, this.#generatePath(
            this.#canvasHeight * 6 / 10, 70, 200,
            i => (Math.sin(i / 25) + Math.cos(i / 20) + Math.sin(i / 10)) / 3
        ));

        this.#bgCtx.fillStyle = "#457886";
        this.#bgCtx.strokeStyle = "#147186";

        this.#drawPath(this.#bgCtx, this.#generatePath(
            this.#canvasHeight * 7 / 10, 40, 200,
            i => (Math.sin(i / 28) + Math.cos(i / 17) + Math.sin(i / 7)) / 3
        ));

        this.#drawPath(this.#bgCtx, this.#generatePath(
            this.#canvasHeight * 8 / 10, 40, 200,
            i => (Math.sin(i / 30) + Math.cos(i / 21) + Math.sin(i / 7)) / 3
        ));

        this.#bgCtx.globalAlpha = 1;
    }

    #generatePath(yOffset, height, count, fn) {
        const seed = Math.floor(Math.random() * count);
        const xStep = this.#canvasWidth / count;

        const points = new Array(count);
        let x = 0;
        for (let i = 0; i < points.length; i++) {
            const y = height * fn(seed + i);
            points[i] = new Vector2(x, yOffset + y);

            x += xStep;
        }

        const b = BoundaryBox.fromPoints(points);
        return [
            new Vector2(b.left, this.#canvasHeight),
            ...points,
            new Vector2(b.right, this.#canvasHeight),
        ];
    }

    #drawPath(ctx, path) {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y)
        for (let i = 1; i <= path.length; i++) {
            const point = path[i % path.length];
            ctx.lineTo(point.x, point.y);
        }

        ctx.stroke();
        ctx.fill();
    }
}