import {LinerRateProvider, NumericValueProvider, VectorValueProvider} from "../../../lib/render/misc/provider.js";
import {SpriteSeries} from "../../../lib/render/renderer/canvas/misc/sprite_series.js";
import {ParticleEmitter} from "../../../lib/render/particles/emitter.js";
import * as CommonUtils from "../../../lib/utils/common.js";
import * as CollisionUtils from "../../../lib/utils/geom.js";
import {Vector2} from "../../../lib/utils/vector.js";
import * as Utils from "../../common/utils.js";

import Settings from "../settings.js";
import {SnowDriftSegmentBody, SnowDriftStaticBody, SnowParticle} from "./body.js";
import {Tags} from "./misc.js";


const SnowflakesSpriteUrl = new URL("../sprites/snowflakes.svg", import.meta.url)

export class SnowCloud {
    #initialized = false;

    /** @type {SpriteSeries} */
    #snowSpriteSeries = null;
    #snowEmitter = null;

    #engine;
    #worldBox;
    #options;

    get snowSprite() {return this.#snowSpriteSeries;}


    /**
     * @param {Bootstrap} engine
     * @param {BoundaryBox} worldBox
     * @param {Object} globalOptions
     */
    constructor(engine, worldBox, globalOptions) {
        this.#engine = engine;
        this.#worldBox = worldBox;
        this.#options = globalOptions;
    }

    async init() {
        this.#snowSpriteSeries = new SpriteSeries(SnowflakesSpriteUrl, 9, 1, 32, 32, 0);
        await this.#snowSpriteSeries.wait();

        this.#snowSpriteSeries.setupPreRendering(this.#snowSpriteSeries.count * this.#snowSpriteSeries.width, this.#snowSpriteSeries.height);
        this.#initialized = true;
    }

    letItSnow() {
        if (!this.#initialized) {
            throw new Error("Used before initialization. Call init method first");
        }

        if (this.#snowEmitter !== null) {
            console.error("Already snowing");
            return;
        }

        const staticBodies = this.#engine.rigidBodies.filter(b => !b.active);
        const preSnowIterations = (1000 / Settings.Snow.EmitPeriod) * Settings.Snow.InitDuration;
        const border = Settings.Snow.Border;

        for (let i = 0; i < preSnowIterations; i++) {
            const x = border + Math.random() * (this.#worldBox.width - border);
            const y = this.#worldBox.top + border + Math.random() * (this.#worldBox.height + Settings.World.OffsetBottom);
            const point = new Vector2(x, y);

            const intersectingBody = staticBodies.find(b => CollisionUtils.isPointInsideBoundary(point, b.boundary));
            if (intersectingBody) continue;

            this.#emitSnow(point);
        }

        this.#snowEmitter = new ParticleEmitter(
            SnowParticle,
            new VectorValueProvider(
                new NumericValueProvider(this.#worldBox.center.x).setSpread(this.#worldBox.width),
                new NumericValueProvider(this.#worldBox.top + border / 2).setSpread(border),
            ),
            new LinerRateProvider(1000 / Settings.Snow.EmitPeriod)
        ).setParticleArguments(this.#snowSpriteSeries, this.#worldBox, this.#options);

        this.#engine.addParticleEmitter(this.#snowEmitter);
    }

    setupInteractions() {
        if (!this.#initialized) {
            throw new Error("Used before initialization. Call init method first");
        }

        let spawnPosition = null;
        let intervalId = null;
        let spawnedCount = 0;

        this.#engine.canvas.oncontextmenu = () => false;
        this.#engine.canvas.onmousedown = document.ontouchstart = (e) => {
            spawnedCount = 0;
            spawnPosition = Utils.getMousePos(e);
            intervalId = setInterval(() => {
                if (spawnPosition === null) return;

                this.#emitSnow(spawnPosition);
                ++spawnedCount;
            }, Settings.Snow.SpawnInterval);

            e.preventDefault();
        }

        this.#engine.canvas.onmousemove = document.ontouchmove = (e) => {
            if (spawnPosition === null) return;

            spawnPosition = Utils.getMousePos(e);
            e.preventDefault();
        }

        this.#engine.canvas.onmouseup = document.ontouchend = (e) => {
            clearInterval(intervalId);

            if (spawnPosition && spawnedCount === 0) {
                this.#emitSnow(spawnPosition);
            }

            spawnPosition = null;
            intervalId = null;

            e.preventDefault();
        }
    }

    #emitSnow(origin) {
        if (origin.y >= this.#worldBox.bottom) return;

        const pos = Vector2.fromAngle(Math.random() * Math.PI * 2).scale(4).add(origin);
        const snow = new SnowParticle(pos.x, pos.y, this.#snowSpriteSeries, this.#worldBox, this.#options);
        this.#engine.addParticle(snow);
    }
}

export class SnowDrift {
    #engine;
    #worldBox;

    /** @type{SnowDriftSegmentBody[]} */
    segments;

    snowDriftBody;

    constructor(engine, worldBox) {
        this.#engine = engine;
        this.#worldBox = worldBox;

        this.segments = new Array(Settings.SnowDrift.Segments);
        this.#init();
    }

    #init() {
        const segmentsCount = Settings.SnowDrift.Segments;
        const initialHeight = Settings.SnowDrift.Height;

        const bottom = this.#worldBox.bottom + Settings.World.OffsetBottom - initialHeight / 2;
        const xStep = this.#worldBox.width / segmentsCount;
        const lastPos = new Vector2(this.#worldBox.left, initialHeight / 2);

        for (let i = 0; i < segmentsCount; i++) {
            const x = lastPos.x + xStep;

            const yOffset = (0.5 - Math.random()) * initialHeight / 2;
            const y = Math.max(0, Math.min(initialHeight, lastPos.y + yOffset));

            const segment = new SnowDriftSegmentBody(this, lastPos.x, bottom - lastPos.y, x, bottom - y);
            this.segments[i] = segment;
            this.#engine.addRigidBody(segment, segment.renderer);

            lastPos.x = x;
            lastPos.y = y;
        }

        this.snowDriftBody = new SnowDriftStaticBody(this.segments, this.#worldBox);
        this.#engine.addRenderStep(this.snowDriftBody.renderer);

        const _snowDriftReducer = async () => {
            await this.#reduceSnowDrift();
            setTimeout(_snowDriftReducer, Settings.Snow.Reducing.CheckInterval);
        }

        setTimeout(_snowDriftReducer, Settings.Snow.Reducing.CheckInterval);
    }

    onCollide(collision, segment, body) {
        const growthSizeFactor = Settings.Snow.GrowthFactor;
        if (collision.result && body.active && body.tag === Tags.snowflake) {
            this.#growth(this.segments.indexOf(segment), body.radius * growthSizeFactor);

            body.setActive(false);
            this.#engine.destroyBody(body);
        }
    }

    #growth(index, growthSize) {
        const segment = this.segments[index];
        segment.updatePoints(new Vector2(0, -growthSize), new Vector2(0, -growthSize));

        // Back
        let currentGrowth = growthSize;
        for (let i = index - 1; i >= 0 && currentGrowth >= 1e-3; i--) {
            const nextGrowth = growthSize * this.#fadeGrowth(index - i);
            this.segments[i].updatePoints(new Vector2(0, -nextGrowth), new Vector2(0, -currentGrowth));
            currentGrowth = nextGrowth;
        }

        // Forward
        currentGrowth = growthSize;
        for (let i = index + 1; i < Settings.SnowDrift.Segments && currentGrowth >= 1e-3; i++) {
            const nextGrowth = growthSize * this.#fadeGrowth(i - index);
            this.segments[i].updatePoints(new Vector2(0, -currentGrowth), new Vector2(0, -nextGrowth));
            currentGrowth = nextGrowth;
        }
    }

    #fadeGrowth(k) {
        // Ease out cubic
        const x = k / 30;
        return (1 - x) * (1 - x);
    }

    async #reduceSnowDrift() {
        let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;
        for (const segment of this.segments) {
            const height = this.#worldBox.bottom - segment.boundary.top;
            if (height < min) min = height;
            if (height > max) max = height;
        }

        if (max > Settings.SnowDrift.MaxHeight) {
            const yOffset = this.#worldBox.bottom + Settings.World.OffsetBottom - Settings.SnowDrift.Height / 2;
            const size = Math.max(1, max - min);

            const deltas = new Array(this.segments.length);
            const prevHeights = [0, 0];
            const xStep = this.segments[0].points[1].x - this.segments[0].points[0].x;
            for (let i = 0; i < this.segments.length; i++) {
                const segment = this.segments[i];

                const height = this.#worldBox.bottom - segment.points[1].y - min;
                const desiredHeight = (height / size) * Settings.SnowDrift.Height;
                let relativeHeight = CommonUtils.clamp(
                    -Settings.SnowDrift.Height / 3, Settings.SnowDrift.Height / 3,
                    this.#getHeightDifference(xStep, prevHeights[0], prevHeights[1], height)
                );

                deltas[i] = Math.max(0, yOffset - segment.points[1].y - desiredHeight - relativeHeight);
                prevHeights[0] = prevHeights[1];
                prevHeights[1] = height;
            }

            const stepCount = Settings.Snow.Reducing.StepCount;
            const step = 1 / stepCount;
            for (let k = 0; k < stepCount; k++) {
                await this.#engine.requestPhysicsFrame(() => {
                    let prevDelta = deltas[0];
                    for (let i = 0; i < deltas.length; i++) {
                        const delta = deltas[i];
                        this.segments[i].updatePoints(
                            new Vector2(0, prevDelta * step),
                            new Vector2(0, delta * step)
                        );

                        prevDelta = delta;
                    }
                });
            }
        }
    }

    #getHeightDifference(xStep, y1, y2, y3) {
        if (y2 === y3) {
            return 0;
        }

        const p1 = new Vector2(0, y1);
        const p2 = new Vector2(xStep, y2);
        const p3 = new Vector2(xStep * 2, y3);

        const vector1to2 = p2.delta(p1);
        const vector1to3 = p3.delta(p1);

        const length1to2 = vector1to2.length();
        const angle1 = vector1to3.angle(vector1to2);

        const delta = length1to2 * Math.sin(angle1);
        return y2 < y3 ? delta : -delta;
    }
}