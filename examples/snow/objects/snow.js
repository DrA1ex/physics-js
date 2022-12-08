import {Vector2} from "../../../lib/utils/vector.js";
import {CircleBody} from "../../../lib/physics/body.js";
import * as Utils from "../../common/utils.js";
import {State} from "../../common/bootstrap.js";
import * as CollisionUtils from "../../../lib/utils/geom.js";
import {SpriteRenderer, SpriteSeries} from "../../../lib/render/sprite.js";
import {SnowDriftSegmentBody, SnowDriftStaticBody} from "./body.js";
import {Tags} from "./misc.js";
import Settings from "../settings.js";

export class SnowCloud {
    #initialized = false;

    /** @type {SpriteSeries} */
    #snowSpriteSeries = null;
    #snowInterval = null;

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
        this.#snowSpriteSeries = new SpriteSeries("./sprites/snowflakes.svg", 9, 1, 32, 32, 3);
        await this.#snowSpriteSeries.wait();

        this.#snowSpriteSeries.setupPreRendering(312, 32);
        this.#initialized = true;
    }

    letItSnow() {
        if (!this.#initialized) {
            throw new Error("Used before initialization. Call init method first");
        }

        if (this.#snowInterval !== null) {
            console.error("Already snowing");
            return;
        }

        const staticBodies = this.#engine.rigidBodies.filter(b => !b.active);
        const preSnowIterations = (1000 / Settings.Snow.EmitPeriod) * Settings.Snow.InitDuration;
        const border = Settings.Snow.Border;

        for (let i = 0; i < preSnowIterations; i++) {
            const x = border + Math.random() * (this.#worldBox.width - border);
            const y = this.#worldBox.top + border + Math.random() * this.#worldBox.height;
            const point = new Vector2(x, y);

            const intersectingBody = staticBodies.find(b => CollisionUtils.isPointInsideBoundary(point, b.boundary));
            if (intersectingBody) continue;

            this.#emitSnow(point);
        }

        this.#snowInterval = setInterval(this.#periodicSnow.bind(this), Settings.Snow.EmitPeriod);
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

    #periodicSnow() {
        if (this.#engine.state !== State.play) return;

        const border = Settings.Snow.Border;
        const x = border + this.#worldBox.left + Math.random() * (this.#worldBox.width - border * 2);
        const y = this.#worldBox.top + Math.random() * border / 2;

        this.#emitSnow(new Vector2(x, y));
    }

    #emitSnow(origin) {
        if (origin.y >= this.#worldBox.bottom) return;

        const size = 2 + Math.floor(Math.random() * 4);

        const pos = Vector2.fromAngle(Math.random() * Math.PI * 2).scale(size).add(origin);
        Utils.clampBodyPosition(pos, this.#worldBox, size, Settings.Snow.Border);

        const body = new CircleBody(pos.x, pos.y, size, size / 20)
            .setTag(Tags.snowflake)
            .setFriction(this.#options.friction)
            .setRestitution(this.#options.restitution);

        const renderer = new SpriteRenderer(body, this.#snowSpriteSeries, Math.floor(Math.random() * this.#snowSpriteSeries.count));
        return this.#engine.addRigidBody(body, renderer);
    }
}

export class SnowDrift {
    #engine;
    #worldBox;

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

        const bottom = this.#worldBox.bottom - initialHeight / 2;
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
    }

    onCollide(collision, segment, body) {
        const growthSizeFactor = 0.02;
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
}