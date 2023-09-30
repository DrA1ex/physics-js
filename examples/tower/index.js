import {CircleBody} from "../../lib/physics/body/circle.js";
import {RectBody} from "../../lib/physics/body/rect.js";
import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {GravityForce, ResistanceForce} from "../../lib/physics/force.js";
import {CanvasRenderer} from "../../lib/render/renderer/canvas/renderer.js";
import {Bootstrap} from "../common/bootstrap.js";
import * as Utils from "../common/utils.js";
import {CommonBootstrapSettings} from "../common/settings/default.js";
import {SettingsController} from "../common/ui/controllers/settings.js";

const Settings = CommonBootstrapSettings.fromQueryParams({beta: 0.8, bias: 0.2});
const settingsCtrl = SettingsController.defaultCtrl(Settings);
const canvas = document.getElementById("canvas");
const BootstrapInstance = new Bootstrap(new CanvasRenderer(canvas, Settings.renderer), Settings);
settingsCtrl.subscribe(this, SettingsController.RECONFIGURE_EVENT, SettingsController.defaultReconfigure(BootstrapInstance));

const minBallSize = 10;
const maxBallSize = 30;

const blockWidth = 40;
const blockHeight = 30;

const widthDecrease = 0.7;
const towerWidth = 10;
const towerHeight = widthDecrease > 0 ? towerWidth / widthDecrease : towerWidth;

const bottomOffset = 60;
const bottom = BootstrapInstance.canvasHeight - bottomOffset - 1;

BootstrapInstance.addForce(new GravityForce(Settings.common.gravity));
BootstrapInstance.addForce(new ResistanceForce(Settings.common.resistance));

const WorldRect = new BoundaryBox(1, BootstrapInstance.canvasWidth - 1, 1, BootstrapInstance.canvasHeight - 1);
BootstrapInstance.addConstraint(new InsetConstraint(WorldRect, 0.3));
BootstrapInstance.addRect(WorldRect)

BootstrapInstance.addRigidBody(
    new RectBody(BootstrapInstance.canvasWidth / 2, bottom + bottomOffset / 2, BootstrapInstance.canvasWidth - 2, bottomOffset).setActive(false)
).renderer.strokeStyle = "black";

const x = BootstrapInstance.canvasWidth / 2;
let currentY = bottom - blockHeight / 2;
for (let i = 0; i < towerHeight; i++) {
    const width = Math.round(towerWidth - i * widthDecrease);
    const xRowOffset = x - width * blockWidth / 2;
    for (let j = 0; j < width; j++) {
        BootstrapInstance.addRigidBody(
            new RectBody(xRowOffset + j * blockWidth + j, currentY, blockWidth, blockHeight, blockHeight * blockWidth)
                .setInertiaFactor(6)
        );
    }

    currentY -= blockHeight;
}

for (const body of BootstrapInstance.rigidBodies) {
    body.setFriction(Settings.common.friction);
    body.setRestitution(Settings.common.restitution);
}

let startPoint = null;
let vectorId = null;
let creatingBody = null;
canvas.onmousedown = canvas.ontouchstart = (e) => {
    e.preventDefault();
    startPoint = Utils.getMousePos(e)

    if (!creatingBody) {
        const size = minBallSize + Math.random() * (maxBallSize - minBallSize);
        creatingBody = new CircleBody(0, 0, size, Math.PI * size * size * 5);
        BootstrapInstance.addRigidBody(creatingBody);
    }

    startPoint.y = Math.min(startPoint.y, bottom - creatingBody.radius);

    creatingBody.setPosition(startPoint);
    creatingBody.setActive(false);
}

function _constraintVectorLength(vector, maxLength) {
    const length = vector.length();
    const direction = vector.normalize()

    return direction.scale(Math.min(length, maxLength));
}

const maxSpeed = Settings.common.gravity * 20;
const maxDisplaySpeed = 50;
canvas.onmousemove = canvas.ontouchmove = (e) => {
    if (!startPoint) {
        return;
    }

    e.preventDefault();
    const pos = Utils.getMousePos(e);

    if (vectorId !== null) BootstrapInstance.removeShape(vectorId);
    vectorId = BootstrapInstance.addVector(startPoint, _constraintVectorLength(startPoint.delta(pos), maxDisplaySpeed), "red");
}

canvas.onmouseup = canvas.ontouchend = (e) => {
    if (!startPoint) {
        return;
    }

    e.preventDefault();
    const pos = Utils.getMousePos(e);

    creatingBody.setActive(true);
    creatingBody.setVelocity(_constraintVectorLength(startPoint.delta(pos).scale(maxSpeed / maxDisplaySpeed), maxSpeed));

    BootstrapInstance.removeShape(vectorId);
    startPoint = null;
    vectorId = null;
    creatingBody = null;
}

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();
