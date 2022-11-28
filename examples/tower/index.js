import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import {BoundaryBox, CircleBody, RectBody} from "../../lib/physics/body.js";
import {GravityForce, ResistanceForce} from "../../lib/physics/force.js";
import * as Utils from "../common/utils.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";


const options = Params.parse({beta: 0.8, bias: 0.2});
const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);

const minBallSize = 10;
const maxBallSize = 30;

const blockWidth = 40;
const blockHeight = 30;

const widthDecrease = 0.7;
const towerWidth = 10;
const towerHeight = widthDecrease > 0 ? towerWidth / widthDecrease : towerWidth;

const bottomOffset = 60;
const bottom = BootstrapInstance.canvasHeight - bottomOffset - 1;

BootstrapInstance.addForce(new GravityForce(options.gravity));
BootstrapInstance.addForce(new ResistanceForce(options.resistance));

BootstrapInstance.addConstraint(
    new InsetConstraint(new BoundaryBox(1, BootstrapInstance.canvasWidth - 1, 1, BootstrapInstance.canvasHeight - 1), 0.3)
);

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
    body.setFriction(options.friction);
    body.setRestitution(options.restitution);
}

let startPoint = null;
let vectorId = null;
let creatingBody = null;
document.onmousedown = document.ontouchstart = (e) => {
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

const maxSpeed = options.gravity * 20;
const maxDisplaySpeed = 50;
document.onmousemove = document.ontouchmove = (e) => {
    if (!startPoint) {
        return;
    }

    e.preventDefault();
    const pos = Utils.getMousePos(e);

    if (vectorId !== null) BootstrapInstance.removeVector(vectorId);
    vectorId = BootstrapInstance.addVector(startPoint, _constraintVectorLength(startPoint.delta(pos), maxDisplaySpeed), "red");
}

document.onmouseup = document.ontouchend = (e) => {
    if (!startPoint) {
        return;
    }

    e.preventDefault();
    const pos = Utils.getMousePos(e);

    creatingBody.setActive(true);
    creatingBody.setVelocity(_constraintVectorLength(startPoint.delta(pos).scale(maxSpeed / maxDisplaySpeed), maxSpeed));

    BootstrapInstance.removeVector(vectorId);
    startPoint = null;
    vectorId = null;
    creatingBody = null;
}

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();
