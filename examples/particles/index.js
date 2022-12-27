import {CircleBody} from "../../lib/physics/body/circle.js";
import {RectBody} from "../../lib/physics/body/rect.js";
import {CircleCollider} from "../../lib/physics/collider/circle.js";
import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {GlobalWind, ResistanceForce} from "../../lib/physics/force.js";
import {AnimationProperty, EasingFunctions, KeyframeType} from "../../lib/render/animation/base.js";
import {LinerRateProvider, NumericValueProvider, VectorValueProvider} from "../../lib/render/misc/provider.js";
import {ParticleEmitter} from "../../lib/render/particles/emitter.js";
import {Particle} from "../../lib/render/particles/particle.js";
import {ParticleState, StateKeyframe} from "../../lib/render/particles/state.js";
import {RendererMapping} from "../../lib/render/renderer/canvas/mapping.js";
import {CircleBodyRenderer} from "../../lib/render/renderer/canvas/objects/circle.js";
import {RectBodyRenderer} from "../../lib/render/renderer/canvas/objects/rect.js";
import {CanvasRenderer} from "../../lib/render/renderer/canvas/renderer.js";
import {Vector2} from "../../lib/utils/vector.js";
import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";

const Tags = {
    world: "world"
}

const SmokeState = {
    born: "born",
    dark: "dark",
    light: "light",
    fade: "fade",
    destroy: "destroy"
}

class SmokeCollider extends CircleCollider {
    particle;

    constructor(particle) {
        super(particle.body);

        this.particle = particle;
    }

    shouldCollide(body2) {
        return !(body2.collider instanceof SmokeCollider);
    }

    onCollide(collision, body2) {
        if (body2.tag === Tags.world) {
            this.particle.setState(SmokeState.destroy);
        }
    }
}

class SmokeParticle extends Particle {
    constructor(x, y, sizeProvider, massProvider, opacityProvider) {
        const size = sizeProvider.next(1);

        const body = new CircleBody(x, y - size, size, massProvider.next(1))
            .setRestitution(0)
            .setFriction(0);

        const renderer = new CircleBodyRenderer(body);
        renderer.stroke = false;
        renderer.renderDirection = false;
        renderer.opacity = opacityProvider.next(1);

        super(body, renderer);
        body.collider = new SmokeCollider(this);

        this.addState(SmokeState.born, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.opacity, 0, 1, 500, KeyframeType.relative))
            .addKeyframe(new StateKeyframe(AnimationProperty.fillStyle, null, "#ce4327", 500, KeyframeType.relative))
        );

        this.addState(SmokeState.dark, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.radius, 1, 2, 6000, KeyframeType.relative))
            .addKeyframe(new StateKeyframe(AnimationProperty.fillStyle, null, "#000000", 2000, KeyframeType.relative)
                .setEasing(EasingFunctions.easeInCubic)
            )
        );

        this.addState(SmokeState.light, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.opacity, 1, 0.2, 10000, KeyframeType.relative))
            .addKeyframe(new StateKeyframe(AnimationProperty.radius, 1, 2, 20000, KeyframeType.relative))
            .addKeyframe(new StateKeyframe(AnimationProperty.fillStyle, null, "#b0b0b0", 5000, KeyframeType.relative)
                .setEasing(EasingFunctions.easeInCubic)
            )
        );

        this.addState(SmokeState.fade, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.opacity, 1, 0, 3000, KeyframeType.relative))
            .addKeyframe(new StateKeyframe(AnimationProperty.fillStyle, null, "#ffffff", 3000, KeyframeType.relative))
        );

        this.addState(SmokeState.destroy, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.opacity, 1, 0, 1000, KeyframeType.relative))
            .addKeyframe(new StateKeyframe(AnimationProperty.fillStyle, null, "#ffffff", 1000, KeyframeType.relative))
        );

        this.addSequentialTransition([SmokeState.born, SmokeState.dark, SmokeState.light, SmokeState.fade, SmokeState.destroy, Particle.DestroyState]);
    }
}

class BarrierRenderer extends RectBodyRenderer {
    constructor(body) {
        super(body);

        this.stroke = false;
        this.fill = true;
        this.fillStyle = "#3a224f";
    }
}

class BarrierBody extends RectBody {
}

const options = Params.parse({resistance: 0.997})
const BootstrapInstance = new Bootstrap(new CanvasRenderer(document.getElementById("canvas"), options), options);

const border = -1;
const WorldBox = new BoundaryBox(border, BootstrapInstance.canvasWidth - border * 2, border, BootstrapInstance.canvasHeight - border * 2);
const worldConstraint = new InsetConstraint(WorldBox);
worldConstraint.constraintBody.setTag(Tags.world);

BootstrapInstance.addConstraint(worldConstraint);

BootstrapInstance.addForce(new ResistanceForce(options.resistance));
BootstrapInstance.addForce(new GlobalWind(new Vector2(0.3, -2)));

RendererMapping.set(BarrierBody, BarrierRenderer);

BootstrapInstance.addRigidBody(
    new BarrierBody(WorldBox.center.x + 100, WorldBox.bottom - 200, 50, 400)
        .setActive(false)
        .setAngle(-Math.PI / 5)
);

BootstrapInstance.addRigidBody(
    new BarrierBody(WorldBox.center.x - 200, WorldBox.bottom - 400, 50, 400)
        .setActive(false)
        .setAngle(Math.PI / 6)
);

BootstrapInstance.addRigidBody(
    new BarrierBody(WorldBox.center.x + 80, WorldBox.bottom - 575, 50, 400)
        .setActive(false)
        .setAngle(Math.PI / 2.1)
);

const emitter = new ParticleEmitter(
    SmokeParticle,
    VectorValueProvider.fromPoint(new Vector2(WorldBox.center.x, WorldBox.bottom)).setSpread(15, 5),
    new LinerRateProvider(30)
).setParticleArguments(
    NumericValueProvider.fromValue(15, 10), //size
    NumericValueProvider.fromValue(0.06, 0.01), //mass
    NumericValueProvider.fromValue(0.15, 0.01, EasingFunctions.easeInCirc), //opacity
);

BootstrapInstance.addParticleEmitter(emitter);

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();