import * as CommonUtils from "../common/utils.js";
import {Vector2} from "../../lib/utils/vector.js";
import * as SnowUtils from "./utils.js";
import {AnimationAxis, AnimationDirection, AnimationMode, EasingFunctions, ParametricAnimation, SkewPathAnimation} from "../../lib/render/animation.js";
import {Layer, Path} from "../../lib/render/layer.js";
import {LayeredRenderer} from "../../lib/render/background.js";


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
const TreeWiggleSpeed = Math.PI / 180 * 2;

export class BackgroundDrawer extends LayeredRenderer {
    #worldBox;
    #options;

    #scale;
    #dpr;
    #canvasWidth;
    #canvasHeight;

    #mountainSegments;

    /**
     * @param {BoundaryBox} worldBox
     * @param {{useDpr?: boolean, scale?: number}} options
     */
    constructor(worldBox, options) {
        super();

        this.#worldBox = worldBox;
        this.#options = options;
        this.#scale = options.scale ?? 1;
        this.#mountainSegments = 200 * this.#scale;

        this.#initLayers();
    }

    #createCanvas() {
        const canvas = document.createElement("canvas");
        canvas.classList.add("canvas");

        document.body.appendChild(canvas);

        const {dpr, canvasWidth, canvasHeight} = CommonUtils.initCanvas(canvas, this.#options.useDpr);
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
        bgLayer1.addPath(new Path(
            SnowUtils.generateMountainPoints(
                this.#worldBox,
                this.#canvasHeight * 0.2, 100, this.#mountainSegments,
                i => (Math.sin(i / 25) + Math.cos(i / 15) + Math.sin(i / 5)) / 3
            ), MountainPalette[0]
        ));

        // BG Layer 2
        bgLayer2.addPath(new Path(
            SnowUtils.generateMountainPoints(
                this.#worldBox,
                this.#canvasHeight * 0.35, 100, this.#mountainSegments,
                i => (Math.sin(i / 13) + Math.sin(i / 11) + Math.cos(i / 7) + Math.sin(i / 5)) / 4
            ), MountainPalette[1]
        ));

        // BG Layer 3
        bgLayer3.addPath(new Path(
            SnowUtils.generateMountainPoints(
                this.#worldBox,
                this.#canvasHeight * 0.5, 70, this.#mountainSegments,
                i => (Math.sin(i / 30) + Math.cos(i / 11) + Math.sin(i / 9)) / 3
            ), MountainPalette[2],
        ));

        bgLayer3.addPath(new Path(
            SnowUtils.generateMountainPoints(
                this.#worldBox,
                this.#canvasHeight * 0.6, 70, this.#mountainSegments,
                i => (Math.sin(i / 25) + Math.cos(i / 20) + Math.sin(i / 10)) / 3
            ), MountainPalette[3]
        ));

        // BG Layer 4
        bgLayer4.addPath(new Path(
            SnowUtils.generateMountainPoints(
                this.#worldBox,
                this.#canvasHeight * 0.7, 40, this.#mountainSegments,
                i => (Math.sin(i / 28) + Math.cos(i / 17) + Math.sin(i / 7)) / 3
            ), MountainPalette[4]
        ));

        bgLayer4.addPath(new Path(
            SnowUtils.generateMountainPoints(
                this.#worldBox,
                this.#canvasHeight * 0.8, 40, this.#mountainSegments,
                i => (Math.sin(i / 30) + Math.cos(i / 21) + Math.sin(i / 7)) / 3
            ), MountainPalette[5]
        ));

        // FG Layer 1
        fgLayer1.addPaths(this.#generateTreePaths(50, TreePalette[0], bgLayer2.paths[0].points));
        this.#createTreeAnimation(fgLayer1, TreeWiggleSpeed / 2);

        // FG Layer 2
        fgLayer2.addPaths(this.#generateTreePaths(75, TreePalette[1], bgLayer3.paths[0].points));
        this.#createTreeAnimation(fgLayer2, TreeWiggleSpeed / 1.5);


        // FG Layer 3
        fgLayer3.addPaths(this.#generateTreePaths(150, TreePalette[2], bgLayer4.paths[0].points, 3));
        this.#createTreeAnimation(fgLayer3, TreeWiggleSpeed);
    }

    #createLayer(dynamic) {
        const [canvas, ctx] = this.#createCanvas();
        const layer = new Layer(canvas, ctx);

        if (dynamic) {
            this.addDynamicLayer(layer);
        } else {
            this.addStaticLayer(layer);
        }

        return layer;
    }

    #createTreeAnimation(layer, speed) {
        const initial = Math.random() * TreeWiggle;
        for (let path of layer.paths) {
            const parametric = new ParametricAnimation(0, TreeWiggle, speed, initial)
                .setMode(AnimationMode.repeating)
                .setDirection(AnimationDirection.both)
                .setEasing(EasingFunctions.easeInOutSine);
            path.addAnimation(new SkewPathAnimation([AnimationAxis.x], parametric, new Vector2(0, 1)));
        }
    }

    #generateTreePaths(height, palette, mountainPath, step = 1) {
        const treePaths = []
        const mountainPeaks = SnowUtils.findPeaks(mountainPath);
        for (let i = 0; i < mountainPeaks.length; i += step) {
            const point = mountainPeaks[i];
            treePaths.push(new Path(
                SnowUtils.generateTreePoints(point.x, point.y, height, height / 3, 2 + Math.floor(Math.random() * 3)),
                palette
            ));
        }

        return treePaths;
    }
}