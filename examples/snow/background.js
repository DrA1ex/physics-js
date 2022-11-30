import * as CommonUtils from "../common/utils.js";
import {Vector2} from "../../lib/utils/vector.js";
import {BoundaryBox} from "../../lib/physics/body.js";
import * as SnowUtils from "./utils.js";
import {EasingFunctions, ParametricAnimation, SkewAnimationAxis, SkewLayerAnimation} from "../../lib/render/animation.js";

const LayerType = {
    mountain: "mountain",
    tree: "tree"
}

const BackgroundPalette = [
    "#b0cdd9",
    "#e4f2f8"
]

const MountainPalette = [
    {fill: "#cbdfe7", stroke: "#bed7e1"},
    {fill: "#b7d0da", stroke: "#a9c7d3"},
    {fill: "#a3c5d3", stroke: "#8fbecd"},
    {fill: "#98bfce", stroke: "#85b9c9"},
    {fill: "#8db6c5", stroke: "#84b2c2"},
    {fill: "#85afbf", stroke: "#8db6c5"},
]

const TreePalette = [
    {fill: "#c2d3dc", stroke: "transparent"},
    {fill: "#618f9c", stroke: "transparent"},
    {fill: "#618f9c", stroke: "transparent"}
];

const TreeWiggle = Math.PI / 180 * 10;
const TreeWiggleSpeed = Math.PI / 180 * 3;

export class BackgroundDrawer {
    #dpr;
    #canvasWidth;
    #canvasHeight;

    #staticLayers = []
    #dynamicLayers = []

    constructor() {
        this.#initLayers();
        this.#drawStaticContent();
    }

    render(_, delta) {
        this.#drawDynamicContent(delta);
    }

    #drawStaticContent() {
        for (const layer of this.#staticLayers) {
            this.#drawLayers(layer.ctx, layer.paths);
        }
    }

    #drawDynamicContent(delta) {
        for (const layer of this.#dynamicLayers) {
            layer.ctx.clearRect(0, 0, this.#canvasWidth, this.#canvasHeight);

            layer.animation?.apply(layer, delta);
            this.#drawLayers(layer.ctx, layer.paths);
        }
    }

    #drawLayers(ctx, layers) {
        for (const {type, color, alpha, points} of layers) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color.fill;
            ctx.strokeStyle = color.stroke;

            if (type === LayerType.mountain) {
                this.#drawPath(ctx, points);
            } else if (type === LayerType.tree) {
                this.#drawPath(ctx, points);
            }
        }

        ctx.globalAlpha = 1;
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

    #initLayers() {
        // Create layers
        const bgLayer1 = this.#createLayer(false)
        const fgLayer1 = this.#createLayer(true);
        const bgLayer2 = this.#createLayer(false);
        const fgLayer2 = this.#createLayer(true);
        const bgLayer3 = this.#createLayer(false);
        const fgLayer3 = this.#createLayer(true);
        const bgLayer4 = this.#createLayer(false);

        // BG Layer 1
        bgLayer1.canvas.style.background = `linear-gradient(10deg, ${BackgroundPalette.join(", ")})`;
        bgLayer1.paths.push(this.#createLayerPath(
            LayerType.mountain, MountainPalette[0],
            this.#generateMountainPath(
                this.#canvasHeight * 0.1, 100, 200,
                i => (Math.sin(i / 25) + Math.cos(i / 15) + Math.sin(i / 5)) / 3
            ),
        ));

        // BG Layer 2

        bgLayer2.paths.push(this.#createLayerPath(
            LayerType.mountain, MountainPalette[1],
            this.#generateMountainPath(
                this.#canvasHeight * 0.3, 100, 200,
                i => (Math.sin(i / 13) + Math.sin(i / 11) + Math.cos(i / 7) + Math.sin(i / 5)) / 4
            )
        ));

        // BG Layer 3
        bgLayer3.paths.push(
            this.#createLayerPath(
                LayerType.mountain, MountainPalette[2],
                this.#generateMountainPath(
                    this.#canvasHeight * 0.5, 70, 200,
                    i => (Math.sin(i / 30) + Math.cos(i / 11) + Math.sin(i / 9)) / 3
                )
            ), this.#createLayerPath(
                LayerType.mountain, MountainPalette[3],
                this.#generateMountainPath(
                    this.#canvasHeight * 0.6, 70, 200,
                    i => (Math.sin(i / 25) + Math.cos(i / 20) + Math.sin(i / 10)) / 3
                )
            )
        );

        // BG Layer 4
        bgLayer4.paths.push(this.#createLayerPath(
                LayerType.mountain, MountainPalette[4],
                this.#generateMountainPath(
                    this.#canvasHeight * 0.7, 40, 200,
                    i => (Math.sin(i / 28) + Math.cos(i / 17) + Math.sin(i / 7)) / 3
                )
            ), this.#createLayerPath(
                LayerType.mountain, MountainPalette[5],
                this.#generateMountainPath(
                    this.#canvasHeight * 0.8, 40, 200,
                    i => (Math.sin(i / 30) + Math.cos(i / 21) + Math.sin(i / 7)) / 3
                )
            )
        );

        // FG Layer 1
        fgLayer1.paths.push(...this.#generateTreeLayerForMountain(50, TreePalette[0], bgLayer2.paths[0].points));
        fgLayer1.boundary = BoundaryBox.fromPoints(fgLayer1.paths.map(c => c.points).flat());
        fgLayer1.animation = new SkewLayerAnimation(
            SkewAnimationAxis.x,
            new ParametricAnimation(-TreeWiggle, TreeWiggle, TreeWiggleSpeed / 3).setEasing(EasingFunctions.easeInOutSine),
            new Vector2(0, 1)
        )

        // FG Layer 2
        fgLayer2.paths.push(...this.#generateTreeLayerForMountain(75, TreePalette[1], bgLayer3.paths[0].points));
        fgLayer2.boundary = BoundaryBox.fromPoints(fgLayer1.paths.map(c => c.points).flat());
        fgLayer2.animation = new SkewLayerAnimation(
            SkewAnimationAxis.x,
            new ParametricAnimation(-TreeWiggle, TreeWiggle, TreeWiggleSpeed / 2).setEasing(EasingFunctions.easeInOutSine),
            new Vector2(0, 1)
        )

        // FG Layer 3
        fgLayer3.paths.push(...this.#generateTreeLayerForMountain(150, TreePalette[2], bgLayer4.paths[0].points, 3));
        fgLayer3.boundary = BoundaryBox.fromPoints(fgLayer1.paths.map(c => c.points).flat());
        fgLayer3.animation = new SkewLayerAnimation(
            SkewAnimationAxis.x,
            new ParametricAnimation(-TreeWiggle, TreeWiggle, TreeWiggleSpeed).setEasing(EasingFunctions.easeInOutSine),
            new Vector2(0, 1)
        )
    }

    #createLayer(dynamic) {
        const [canvas, ctx] = this.#createCanvas();
        const layer = {canvas, ctx, paths: [], animation: null, boundary: null};

        if (dynamic) {
            this.#dynamicLayers.push(layer);
        } else {
            this.#staticLayers.push(layer);
        }

        return layer;
    }

    #generateTreeLayerForMountain(height, palette, mountainPath, step = 1) {
        const treeLayer = []
        const mountainPeaks = SnowUtils.findPeaks(mountainPath);
        for (let i = 0; i < mountainPeaks.length; i += step) {
            const point = mountainPeaks[i];

            const treePath = this.#createLayerPath(
                LayerType.tree, palette,
                this.#generateTreePath(point.x, point.y, height, height / 3, 2 + Math.floor(Math.random() * 3))
            );
            treeLayer.push(treePath);
        }

        return treeLayer;
    }

    #createLayerPath(type, palette, points, alpha = 1) {
        return {type: type, color: palette, alpha: alpha, points: points}
    }

    #generateMountainPath(yOffset, height, count, fn, border = 20) {
        const seed = Math.floor(Math.random() * count);
        const xStep = (this.#canvasWidth + border * 2) / count;

        const points = new Array(count);
        let x = -border;
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

    #generateTreePath(xOffset, yOffset, height, base, count) {
        const width = height / 3;
        const xStep = width * 3 / 5;
        const result = new Array(5 * count);

        let xCurrent = xOffset - (width + xStep * (count - 1)) / 2;
        for (let i = 0; i < count; i++) {
            const treeHeight = height * (2 + Math.random()) / 3;
            const y = yOffset + base / 2;

            result[i * 5] = new Vector2(xCurrent, y + base);
            result[i * 5 + 1] = new Vector2(xCurrent, y);
            result[i * 5 + 2] = new Vector2(xCurrent + width / 2, y - treeHeight);
            result[i * 5 + 3] = new Vector2(xCurrent + width, y);
            result[i * 5 + 4] = new Vector2(xCurrent + width, y + base);

            xCurrent += xStep + Math.random() * width * 2 / 5;
        }

        return result;
    }
}