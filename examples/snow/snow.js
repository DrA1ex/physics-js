import {Vector2} from "../../lib/utils/vector.js";
import {CircleBody} from "../../lib/physics/body.js";
import * as Utils from "../common/utils.js";
import {State} from "../common/bootstrap.js";
import * as CollisionUtils from "../../lib/utils/geom.js";
import {SpriteRenderer, SpriteSeries} from "../../lib/render/sprite.js";
import {SnowDriftSegmentBody, SnowDriftStaticBody} from "./body.js";

export const Tags = {
    snowflake: "snowflake",
}

export class SnowCloud {
    static SnowColor = "#cce5ec";
    static SnowSpriteSeries = new SpriteSeries("./sprites/snowflakes.png", 6, 1, 32, 32, 3);

    #snowInterval = null;

    #engine;
    #worldBox;
    #options;

    #snowPeriod;
    #emitSnowPeriod;
    #preSnowDuration;
    #border;

    /**
     * @param {Bootstrap} engine
     * @param {BoundaryBox} worldBox
     * @param {number} snowPeriod
     * @param {number} emitSnowPeriod
     * @param {number} [preSnowDuration=5]
     * @param {number} [border = 10]
     * @param {Object} globalOptions
     */
    constructor(engine, worldBox, {snowPeriod, emitSnowPeriod, preSnowDuration = 5, border = 10}, globalOptions) {
        this.#engine = engine;
        this.#worldBox = worldBox;
        this.#options = globalOptions;

        this.#snowPeriod = snowPeriod;
        this.#emitSnowPeriod = emitSnowPeriod;
        this.#preSnowDuration = preSnowDuration;
        this.#border = border;
    }

    letItSnow() {
        if (this.#snowInterval !== null) {
            console.error("Already snowing");
            return;
        }

        const staticBodies = this.#engine.rigidBodies.filter(b => !b.active);
        const preSnowIterations = (1000 / this.#snowPeriod) * this.#preSnowDuration;
        for (let i = 0; i < preSnowIterations; i++) {
            const x = this.#border + Math.random() * (this.#worldBox.width - this.#border);
            const y = this.#worldBox.top + this.#border + Math.random() * this.#worldBox.height;
            const point = new Vector2(x, y);

            while (true) {
                const intersectingBody = staticBodies.find(b => CollisionUtils.isPointInsideBoundary(point, b.boundary));
                if (!intersectingBody) break;

                const {boundary} = intersectingBody;
                point.x = Math.random() < 0.5 ? boundary.left - Math.random() * this.#border * 4 : boundary.right + Math.random() * this.#border * 4;
                point.y = boundary.top - Math.random() * this.#border * 4;
            }

            this.#emitSnow(point);
        }

        this.#snowInterval = setInterval(this.#periodicSnow.bind(this), this.#snowPeriod);
    }

    setupInteractions() {
        let spawnPosition = null;
        let intervalId = null;
        let spawnedCount = 0;

        document.oncontextmenu = () => false;
        document.onmousedown = document.ontouchstart = (e) => {
            spawnedCount = 0;
            spawnPosition = Utils.getMousePos(e);
            intervalId = setInterval(() => {
                if (spawnPosition === null) return;

                this.#emitSnow(spawnPosition);
                ++spawnedCount;
            }, this.#emitSnowPeriod);

            e.preventDefault();
        }

        document.onmousemove = document.ontouchmove = (e) => {
            if (spawnPosition === null) return;

            spawnPosition = Utils.getMousePos(e);
            e.preventDefault();
        }

        document.onmouseup = document.ontouchend = (e) => {
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

        const x = this.#border + this.#worldBox.left + Math.random() * (this.#worldBox.width - this.#border * 2);
        const y = this.#worldBox.top + Math.random() * this.#border / 2;

        this.#emitSnow(new Vector2(x, y));
    }

    #emitSnow(origin) {
        if (origin.y >= this.#worldBox.bottom) return;

        const size = 3 + Math.floor(Math.random() * 5);

        const pos = Vector2.fromAngle(Math.random() * Math.PI * 2).scale(size).add(origin);
        Utils.clampBodyPosition(pos, this.#worldBox, size, this.#border);

        const body = new CircleBody(pos.x, pos.y, size, size / 2)
            .setTag(Tags.snowflake)
            .setFriction(this.#options.friction)
            .setRestitution(this.#options.restitution);

        const renderer = new SpriteRenderer(body, SnowCloud.SnowSpriteSeries, Math.floor(Math.random() * SnowCloud.SnowSpriteSeries.count));
        return this.#engine.addRigidBody(body, renderer);
    }
}

export class SnowDrift {
    #engine;
    #worldBox;

    segments;
    segmentsCount
    initialHeight;

    snowDriftBody;

    constructor(engine, worldBox, snowdriftSegmentCount, initialHeight) {
        this.#engine = engine;
        this.#worldBox = worldBox;

        this.segmentsCount = snowdriftSegmentCount;
        this.initialHeight = initialHeight;

        this.segments = new Array(this.segmentsCount);
        this.#init();
    }

    #init() {
        const bottom = this.#worldBox.bottom - 1;
        const xStep = this.#worldBox.width / this.segmentsCount;
        const lastPos = new Vector2(this.#worldBox.left, this.initialHeight / 2);

        for (let i = 0; i < this.segmentsCount; i++) {
            const x = lastPos.x + xStep;

            const yOffset = this.initialHeight / 3 - Math.random() * this.initialHeight / 2;
            const y = Math.max(0, Math.min(this.initialHeight, lastPos.y + yOffset));

            const segment = new SnowDriftSegmentBody(this, lastPos.x, bottom - lastPos.y, x, bottom - y);
            this.segments[i] = segment;
            this.#engine.addRigidBody(segment, segment.renderer);

            lastPos.x = x;
            lastPos.y = y;
        }

        this.snowDriftBody = new SnowDriftStaticBody(this.segments, this.#worldBox);
        this.#engine.addRigidBody(this.snowDriftBody, this.snowDriftBody.renderer);
    }

    onCollide(collision, segment, body) {
        const growthSizeFactor = 0.015;

        if (collision.result && body.active && body.tag === Tags.snowflake) {
            const index = this.segments.indexOf(segment);

            const growthSize = body.radius * growthSizeFactor;
            segment.updatePoints(new Vector2(0, -growthSize), new Vector2(0, -growthSize));

            // Back
            let currentGrowth = growthSize;
            for (let i = index - 1; i >= 0 && currentGrowth >= 1e-3; i--) {
                const nextGrowth = this.#fadeGrowth(growthSize, index - i);
                this.segments[i].updatePoints(new Vector2(0, -nextGrowth), new Vector2(0, -currentGrowth));
                currentGrowth = nextGrowth;
            }

            // Forward
            currentGrowth = growthSize;
            for (let i = index + 1; i < this.segmentsCount && currentGrowth >= 1e-3; i++) {
                const nextGrowth = this.#fadeGrowth(growthSize, i - index);
                this.segments[i].updatePoints(new Vector2(0, -currentGrowth), new Vector2(0, -nextGrowth));
                currentGrowth = nextGrowth;
            }

            body.setTag(null);
            this.#engine.destroyBody(body);
        }
    }

    #fadeGrowth(initial, k) {
        // Ease out cubic
        const x = k / 30;
        return initial * (1 - x) * (1 - x);
    }
}