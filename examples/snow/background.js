import {AnimationAxis, AnimationDirection, AnimationMode, EasingFunctions} from "../../lib/render/animation/base.js";
import {ParametricAnimation} from "../../lib/render/animation/parametric.js";
import {SkewPathAnimation} from "../../lib/render/animation/skew.js";
import {Layer} from "../../lib/render/renderer/canvas/background/layer.js";
import {Path} from "../../lib/render/renderer/canvas/background/path.js";
import {LayeredRenderer} from "../../lib/render/renderer/canvas/background/renderer.js";
import * as ColorUtils from "../../lib/utils/color.js";
import {Vector2} from "../../lib/utils/vector.js";
import * as CommonUtils from "../common/utils.js";
import Settings from "./settings.js";
import * as SnowUtils from "./utils/common.js";

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

    updatePalette(mountainColorTop, mountainColorBottom, treeColorTop, treeColorBottom) {
        const mountainShadesCnt = this.staticLayers.reduce((p, c) => p + c.paths.length, 0) - 1;
        let i = 0;
        for (const layer of this.staticLayers) {
            for (const path of layer.paths) {
                path.setPalette({
                    fill: ColorUtils.colorBetween(mountainColorTop, mountainColorBottom, i / mountainShadesCnt),
                    stroke: "transparent"
                });

                ++i;
            }
        }

        const treeShadesCnt = this.dynamicLayers.length - 1;
        i = 0;
        for (const layer of this.dynamicLayers) {
            for (const path of layer.paths) {
                path.setPalette({
                    fill: ColorUtils.colorBetween(treeColorTop, treeColorBottom, i / treeShadesCnt),
                    stroke: "transparent"
                });
            }

            ++i;
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

        const wiggleSpeed = Settings.Background.Tree.WiggleSpeed;
        // FG Layer 1
        fgLayer1.addPaths(this.#generateTreePaths(50, SnowUtils.findPeaks(bgLayer2.paths[0].points)));
        this.#createTreeAnimation(fgLayer1, wiggleSpeed / 2);

        // FG Layer 2
        fgLayer2.addPaths(this.#generateTreePaths(75, SnowUtils.findPeaks(bgLayer3.paths[0].points)));
        this.#createTreeAnimation(fgLayer2, wiggleSpeed / 1.5);


        // FG Layer 3
        fgLayer3.addPaths(this.#generateTreePaths(150, SnowUtils.findPeaks(bgLayer4.paths[0].points), 3));
        this.#createTreeAnimation(fgLayer3, wiggleSpeed);
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
        const wiggle = Settings.Background.Tree.Wiggle
        const initial = Math.random() * wiggle;
        for (let path of layer.paths) {
            const parametric = new ParametricAnimation(0, wiggle, speed, initial)
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