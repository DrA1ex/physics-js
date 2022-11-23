import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import {BoundaryBox, CircleBody, RectBody} from "../../lib/physics/body.js";
import {Vector2} from "../../lib/utils/vector.js";
import {GravityForce, ResistanceForce} from "../../lib/physics/force.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";


const options = Params.parse()
const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);

const size = 25;
const towerWidth = 5;
const widthDecrease = 3;
const towerHeight = towerWidth * widthDecrease;
const bottom = BootstrapInstance.canvasHeight - 60 - 1;

BootstrapInstance.addForce(new GravityForce(options.gravity));
BootstrapInstance.addForce(new ResistanceForce(options.resistance));
BootstrapInstance.addConstraint(new InsetConstraint(new BoundaryBox(1, BootstrapInstance.canvasWidth - 1, 1, bottom), 0.3));

const x = BootstrapInstance.canvasWidth / 2;
let currentY = bottom - size / 2;
for (let i = 0; i < towerHeight; i++) {
    if (widthDecrease !== 0) {
        for (let j = 0; j < towerWidth - Math.floor(i / widthDecrease); j++) {
            BootstrapInstance.addRigidBody(new RectBody(x + size / 2 + j * size, currentY, size, size, 1));
            BootstrapInstance.addRigidBody(new RectBody(x - size / 2 - j * size, currentY, size, size, 1));
        }
    } else {
        BootstrapInstance.addRigidBody(new RectBody(x + size / 2, currentY, size, size, 1));
    }

    currentY -= size - 1;
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
        creatingBody = new CircleBody(startPoint.x, startPoint.y, size, 50);
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
const maxDisplaySpeed = 100;
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
