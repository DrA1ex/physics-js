import {CircleBody} from "../../../lib/physics/body/circle.js";
import {LineBody} from "../../../lib/physics/body/line.js";
import {PolygonBody} from "../../../lib/physics/body/poly.js";
import {AnimationProperty, KeyframeType} from "../../../lib/render/animation/base.js";
import {Particle} from "../../../lib/render/particles/particle.js";
import {ParticleState, StateKeyframe} from "../../../lib/render/particles/state.js";
import {LineRenderer} from "../../../lib/render/renderer/canvas/objects/line.js";
import {PolygonBodyRenderer} from "../../../lib/render/renderer/canvas/objects/poly.js";
import {AnimatedSpriteRenderer, SpriteRenderer} from "../../../lib/render/renderer/canvas/objects/sprite.js";
import {Vector2} from "../../../lib/utils/vector.js";
import * as Utils from "../../common/utils.js";
import Settings from "../settings.js";
import {SmokeCollider, SmokeState, SnowdriftCollider, Tags, UnionPolyBody} from "./misc.js";

export class SnowDriftSegmentBody extends LineBody {
    #renderer;
    constructor(parent, xLast, yLast, x, y) {
        super(xLast, yLast, x, y);

        this.collider = new SnowdriftCollider(this, parent.onCollide.bind(parent));

        this.#renderer = new LineRenderer(this);
        this.#renderer.stroke = false;

        this.setTag(Tags.snowDrift);
        this.setActive(false);
        this.setFriction(0.3);
    }
    get renderer() {return this.#renderer;}
}

class SnowDriftRenderer extends PolygonBodyRenderer {
    constructor(body) {
        super(body);

        this.z = 3;
        this.renderDirection = false;
        this.fill = true;
        this.stroke = false;

        this.smooth = true;
        this.smoothCount = 4;
    }
}

export class SnowDriftStaticBody extends UnionPolyBody {
    renderer;

    constructor(segments, worldBox) {
        const pFirst = segments[0].points;
        const pLast = segments[segments.length - 1].points;

        const closedSegments = [
            new LineBody(worldBox.left, worldBox.bottom, worldBox.left, worldBox.bottom),
            new LineBody(worldBox.left, worldBox.bottom, pFirst[0].x, pFirst[0].y),
            ...segments,
            new LineBody(pLast[1].x, pLast[1].y, worldBox.right, worldBox.bottom),
            new LineBody(worldBox.right, worldBox.bottom, worldBox.right, worldBox.bottom),
        ];

        super(worldBox.center.x, worldBox.bottom, closedSegments)
            .setScale(new Vector2(1, 1.1))
            .setStatic(true);

        this.renderer = new SnowDriftRenderer(this);
    }
}

export class RoofSnowDriftBody extends PolygonBody {
    renderer;

    constructor(x, y, width, height, segmentsCnt, onCollide) {
        const yCut = Math.PI / 180 * 30;
        const xStep = width / (segmentsCnt - 1);
        const yStep = (Math.PI - yCut * 2) / segmentsCnt;
        const yOffset = height / 2;

        const points = new Array(segmentsCnt);
        let xCurrent = -width / 2;
        let yCurrent = yCut;
        for (let i = 0; i < segmentsCnt; i++) {
            const y = Math.sin(yCurrent);
            points[i] = new Vector2(xCurrent, yOffset - y * height);

            xCurrent += xStep;
            yCurrent += yStep;
        }

        super(x, y, [
            new Vector2(-width / 2, yOffset),
            ...points,
            new Vector2(width / 2, yOffset),
        ]);

        this.setTag(Tags.snowDrift);
        this.setActive(false);

        this.collider = new SnowdriftCollider(this, onCollide);

        this.renderer = new SnowDriftRenderer(this);
        this.renderer.smooth = false;
        this.renderer.z = 2;
    }
}

export class SnowParticle extends Particle {
    constructor(x, y, snowSprite, worldBox, options) {
        const size = 2 + Math.floor(Math.random() * 4);

        const pos = new Vector2(x, y);
        Utils.clampBodyPosition(pos, worldBox, size, Settings.Snow.Border);

        const body = new CircleBody(pos.x, pos.y, size, size / 20)
            .setTag(Tags.snowflake)
            .setFriction(options.friction)
            .setRestitution(options.restitution);

        const renderer = new SpriteRenderer(body, snowSprite, Math.floor(Math.random() * snowSprite.count));
        super(body, renderer);
    }
}

export class SmokeParticle extends Particle {

    /**
     * @param {number} x
     * @param {number} y
     * @param {SpriteSeries} smokeSprite
     */
    constructor(x, y, smokeSprite) {
        const smokeRadius = 5 + Math.random() * 15;
        const mass = 0.045 - Math.random() * 0.01;
        const smokeBody = new CircleBody(x, y, smokeRadius, mass)
            .setTag(Tags.smoke)
            .setAngle(Math.random() * Math.PI * 2)
            .setInertiaFactor(1000)
            .setRestitution(0)
            .setFriction(0);

        const renderer = new AnimatedSpriteRenderer(smokeBody, smokeSprite, Settings.Smoke.Framerate, Math.floor(Math.random() * smokeSprite.count));
        renderer.opacity = 0.05 + Math.random() * 0.25;

        super(smokeBody, renderer);
        smokeBody.collider = new SmokeCollider(this);

        this.addState(SmokeState.born, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.opacity, 0, 1, 500, KeyframeType.relative))
        );

        this.addState(SmokeState.active, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.radius, 1, 7, 7000, KeyframeType.relative))
            .addKeyframe(new StateKeyframe(AnimationProperty.opacity, 1, 0.2, 15000, KeyframeType.relative))
        );

        this.addState(SmokeState.fade, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.radius, 1, 7, 7000, KeyframeType.relative))
            .addKeyframe(new StateKeyframe(AnimationProperty.opacity, 1, 0.2, 15000, KeyframeType.relative))
        );

        this.addState(SmokeState.destroy, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.opacity, 1, 0, 1000, KeyframeType.relative))
        );

        this.addSequentialTransition([SmokeState.born, SmokeState.active, SmokeState.fade, SmokeState.destroy, Particle.DestroyState]);
    }
}