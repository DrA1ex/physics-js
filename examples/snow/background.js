import * as CommonUtils from "../common/utils.js";
import {Vector2} from "../../lib/utils/vector.js";
import * as SnowUtils from "./utils.js";
import {AnimationAxis, AnimationDirection, AnimationMode, EasingFunctions, ParametricAnimation, SkewPathAnimation} from "../../lib/render/animation.js";
import {Layer, Path} from "../../lib/render/layer.js";
import {LayeredRenderer} from "../../lib/render/background.js";
import * as ColorUtils from "../common/color.js";


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

    updatePalette(mountainColor, treeColor, mountainStep = -0.08, treeStep = -0.25) {
        let factor = 0;
        for (const layer of this.staticLayers) {
            for (const path of layer.paths) {
                path.setPalette({fill: ColorUtils.shadeColor(mountainColor, factor), stroke: "transparent"});

                factor += mountainStep;
            }
        }

        factor = 0;
        for (const layer of this.dynamicLayers) {
            for (const path of layer.paths) {
                path.setPalette({fill: ColorUtils.shadeColor(treeColor, factor), stroke: "transparent"});
            }

            factor += treeStep;
        }

        this.invalidateContent();
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
        const bgLayer2 = this.#createLayer(false)
        const fgLayer2 = this.#createLayer(true);
        const bgLayer3 = this.#createLayer(false);
        const fgLayer3 = this.#createLayer(true);
        const bgLayer4 = this.#createLayer(false);

        // BG Layer 1
        bgLayer1.addPath(new Path(
            SnowUtils.generateMountainPoints(
                this.#worldBox,
                this.#canvasHeight * 0.25, 100, this.#mountainSegments,
                i => (Math.sin(i / 25) + Math.cos(i / 15) + Math.sin(i / 5)) / 3
            )
        ));

        // BG Layer 2
        bgLayer2.addPath(new Path(
            SnowUtils.generateMountainPoints(
                this.#worldBox,
                this.#canvasHeight * 0.35, 100, this.#mountainSegments,
                i => (Math.sin(i / 13) + Math.sin(i / 11) + Math.cos(i / 7) + Math.sin(i / 5)) / 4
            )
        ));

        // BG Layer 3
        bgLayer3.addPath(new Path(
            SnowUtils.generateMountainPoints(
                this.#worldBox,
                this.#canvasHeight * 0.5, 70, this.#mountainSegments,
                i => (Math.sin(i / 30) + Math.cos(i / 11) + Math.sin(i / 9)) / 3
            )
        ));

        // BG Layer 3
        bgLayer3.addPath(new Path(
            SnowUtils.generateMountainPoints(
                this.#worldBox,
                this.#canvasHeight * 0.6, 70, this.#mountainSegments,
                i => (Math.sin(i / 25) + Math.cos(i / 20) + Math.sin(i / 10)) / 3
            )
        ));

        // BG Layer 4
        bgLayer4.addPath(new Path(
            SnowUtils.generateMountainPoints(
                this.#worldBox,
                this.#canvasHeight * 0.7, 40, this.#mountainSegments,
                i => (Math.sin(i / 28) + Math.cos(i / 17) + Math.sin(i / 7)) / 3
            )
        ));

        bgLayer4.addPath(new Path(
            SnowUtils.generateMountainPoints(
                this.#worldBox,
                this.#canvasHeight * 0.8, 40, this.#mountainSegments,
                i => (Math.sin(i / 30) + Math.cos(i / 21) + Math.sin(i / 7)) / 3
            )
        ));

        // FG Layer 1
        fgLayer1.addPaths(this.#generateTreePaths(50, SnowUtils.findPeaks(bgLayer2.paths[0].points)));
        this.#createTreeAnimation(fgLayer1, TreeWiggleSpeed / 2);

        // FG Layer 2
        fgLayer2.addPaths(this.#generateTreePaths(75, SnowUtils.findPeaks(bgLayer3.paths[0].points)));
        this.#createTreeAnimation(fgLayer2, TreeWiggleSpeed / 1.5);


        // FG Layer 3
        fgLayer3.addPaths(this.#generateTreePaths(150, SnowUtils.findPeaks(bgLayer4.paths[0].points), 3));
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

    #generateTreePaths(height, points, step = 1) {
        const treePaths = []
        for (let i = 0; i < points.length; i += step) {
            const point = points[i];
            treePaths.push(new Path(
                SnowUtils.generateTreePoints(point.x, point.y, height, height / 3, 2 + Math.floor(Math.random() * 3)),
            ));
        }

        return treePaths;
    }
}