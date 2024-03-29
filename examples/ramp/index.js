import {CircleBody} from "../../lib/physics/body/circle.js";
import {LineBody} from "../../lib/physics/body/line.js";
import {Collider} from "../../lib/physics/collider/base.js";
import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {NoCollision} from "../../lib/physics/common/collision.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {GravityForce} from "../../lib/physics/force.js";
import {CanvasRenderer} from "../../lib/render/renderer/canvas/renderer.js";
import {Vector2} from "../../lib/utils/vector.js";
import {Bootstrap} from "../common/bootstrap.js";
import * as Utils from "../common/utils.js";
import {CommonBootstrapSettings, CommonSettings} from "../common/settings/default.js";
import {SettingsController} from "../common/ui/controllers/settings.js";

function cycloid(t, r) {
    return new Vector2(r * (t - Math.sin(t)), r * (1 - Math.cos(t)));
}

class NonInteractionCollider extends Collider {
    #collider;

    get order() {return this.#collider.order;}
    get type() {return this.#collider.type;}


    constructor(body, collider) {
        super(body);
        this.#collider = collider;
    }

    detectCollision(body2) {
        if (body2.collider instanceof NonInteractionCollider) {
            return NoCollision;
        }

        return this.#collider.detectCollision(body2);
    }
}

delete CommonSettings.Properties.resistance;
const Settings = CommonBootstrapSettings.fromQueryParams({friction: 0.5, restitution: 0.2});
const settingsCtrl = SettingsController.defaultCtrl(Settings);
const BootstrapInstance = new Bootstrap(new CanvasRenderer(document.getElementById("canvas"), Settings.renderer), Settings);
settingsCtrl.subscribe(this, SettingsController.RECONFIGURE_EVENT, SettingsController.defaultReconfigure(BootstrapInstance));

const {canvasWidth, canvasHeight} = BootstrapInstance;
const bottom = canvasHeight - 120;

const rampSegments = 100;
const rampWidth = canvasWidth * 2 / 3;
const rampHeight = canvasHeight / 2;
const ballRadius = 40;

const WorldRect = new BoundaryBox(1, canvasWidth, 1, bottom)
BootstrapInstance.addConstraint(new InsetConstraint(WorldRect, 0, 1));
BootstrapInstance.addRect(WorldRect)

BootstrapInstance.addForce(new GravityForce(Settings.common.gravity));

const cycloidPoints = [];
const step = Math.PI / rampSegments;
for (let i = 0; i < rampSegments; i++) {
    cycloidPoints.push(cycloid(i * step, 0.95).mul(new Vector2(0.15, 0.5)).add(new Vector2(0.05, 0)));
}

const rampSide = [new Vector2(0, 1), new Vector2(0, 0), new Vector2(0.01, 0), ...cycloidPoints];
const rampPoints = [...rampSide, ...rampSide.map(p => new Vector2(1 - p.x, p.y)).reverse()];

const yOffset = bottom - rampHeight;
const xOffset = canvasWidth / 2 - rampWidth / 2;
for (let i = 1; i < rampPoints.length; i++) {
    const prev = rampPoints[i - 1];
    const current = rampPoints[i];

    const body = new LineBody(
        xOffset + prev.x * rampWidth, yOffset + prev.y * rampHeight,
        xOffset + current.x * rampWidth, yOffset + current.y * rampHeight
    ).setActive(false);

    BootstrapInstance.addRigidBody(body);
    BootstrapInstance.getRenderObject(body).strokeStyle = "green";
}

const balls = [new CircleBody(xOffset + ballRadius + rampWidth * 0.05, yOffset - ballRadius - rampHeight * 0.05, ballRadius, 50)];
for (let i = 0; i < 6; i++) {
    const xPos = i % 2 === 0 ? ballRadius + rampWidth * 0.05 : -ballRadius + rampWidth * 0.95
    const vertexCount = 5 + i * 3;

    balls.push(
        Utils.createRegularPoly(
            new Vector2(
                xOffset + xPos,
                yOffset - ballRadius - rampHeight * 0.05
            ), vertexCount, ballRadius * 1.9
        ).setMass((i + 1) * 100)
    );
}

for (const ball of balls) {
    ball.collider = new NonInteractionCollider(ball, ball.collider);

    const {renderer} = BootstrapInstance.addRigidBody(ball);
    renderer.strokeStyle = "green";
    renderer.fillStyle = Utils.randomColor(128, 192);
    renderer.opacity = 0.3;
}

for (const body of BootstrapInstance.rigidBodies) {
    body.setFriction(Settings.common.friction);
    body.setRestitution(Settings.common.restitution);
}

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();
