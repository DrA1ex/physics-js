import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import {BoundaryBox, CircleBody, RectBody} from "../../lib/physics/body.js";
import {Vector2} from "../../lib/utils/vector.js";
import {GravityForce, ResistanceForce} from "../../lib/physics/force.js";
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

const bottom = BootstrapInstance.canvasHeight - 60 - 1;

BootstrapInstance.addForce(new GravityForce(options.gravity));
BootstrapInstance.addForce(new ResistanceForce(options.resistance));
BootstrapInstance.addConstraint(new InsetConstraint(new BoundaryBox(1, BootstrapInstance.canvasWidth - 1, 1, bottom), 0.3));

const x = BootstrapInstance.canvasWidth / 2;
let currentY = bottom - blockHeight / 2;
for (let i = 0; i < towerHeight; i++) {
    const width = Math.round(towerWidth - i * widthDecrease);
    const xRowOffset = x - width * blockWidth / 2;
    for (let j = 0; j < width; j++) {
        BootstrapInstance.addRigidBody(new RectBody(xRowOffset + j * blockWidth + j, currentY, blockWidth, blockHeight, blockHeight * blockWidth));
    }

    currentY -= blockHeight - 1;
}

for (const body of BootstrapInstance.rigidBodies) {
    body.setFriction(options.friction);
    body.setRestitution(options.restitution);
}

function getMousePos(e) {
    const point = (e.touches && e.touches[0] || e.changedTouches && e.changedTouches[0]) ?? e;
    const bcr = e.target.getBoundingClientRect();

    return new Vector2(point.clientX - bcr.x, point.clientY - bcr.y);
}

let startPoint = null;
let vectorId = null;
let creatingBody = null;
canvas.onmousedown = canvas.ontouchstart = (e) => {
    e.preventDefault();
    startPoint = getMousePos(e)

    if (!creatingBody) {
        const size = minBallSize + Math.random() * (maxBallSize - minBallSize);
        creatingBody = new CircleBody(startPoint.x, startPoint.y, size, Math.PI * size * size);
        BootstrapInstance.addRigidBody(creatingBody);
    }

    creatingBody.setPosition(startPoint, startPoint);
    creatingBody.setActive(false);
}

function _constraintVectorLength(vector, maxLength) {
    const length = vector.length();
    const direction = vector.normalize()

    return direction.scale(Math.min(length, maxLength));
}

const maxSpeed = options.gravity * 10;
const maxDisplaySpeed = 50;
canvas.onmousemove = canvas.ontouchmove = (e) => {
    if (!startPoint) {
        return;
    }

    e.preventDefault();
    const pos = getMousePos(e);

    if (vectorId !== null) BootstrapInstance.removeVector(vectorId);
    vectorId = BootstrapInstance.addVector(startPoint, _constraintVectorLength(startPoint.delta(pos), maxDisplaySpeed), "red");
}

canvas.onmouseup = canvas.ontouchend = (e) => {
    if (!startPoint) {
        return;
    }

    e.preventDefault();
    const pos = getMousePos(e);

    creatingBody.setActive(true);
    creatingBody.setVelocity(_constraintVectorLength(startPoint.delta(pos).scale(maxSpeed / maxDisplaySpeed), maxSpeed));

    BootstrapInstance.removeVector(vectorId);
    startPoint = null;
    vectorId = null;
    creatingBody = null;
}

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();
