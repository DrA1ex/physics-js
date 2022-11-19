import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import {BoundaryBox, CircleBody, RectBody} from "../../body.js";
import {Vector2} from "../../vector.js";
import {ConstraintType} from "../../enum.js";
import {GravityForce, ResistanceForce} from "../../force.js";


const options = Params.parse()
const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);

const size = 25;
const towerWidth = 4;
const widthDecrease = 3;
const towerHeight = towerWidth * widthDecrease;
const bottom = BootstrapInstance.canvasHeight - size * 2;

BootstrapInstance.addForce(new GravityForce(options.gravity));
BootstrapInstance.addForce(new ResistanceForce(options.resistance));
BootstrapInstance.addConstraint({
    type: ConstraintType.inset,
    box: new BoundaryBox(0, BootstrapInstance.canvasWidth, 0, bottom),
    damper: new Vector2(0.3, 0.3),
});

const x = BootstrapInstance.canvasWidth / 2;
let currentY = bottom - size / 2;
for (let i = 0; i < towerHeight; i++) {
    for (let j = 0; j < towerWidth - Math.floor(i / widthDecrease); j++) {
        BootstrapInstance.addRigidBody(new RectBody(x + size / 2 + j * size, currentY, size, size, 1));
        BootstrapInstance.addRigidBody(new RectBody(x - size / 2 - j * size, currentY, size, size, 1));
    }

    currentY -= size;
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

canvas.onmousemove = canvas.ontouchmove = (e) => {
    if (!startPoint) {
        return;
    }

    e.preventDefault();
    const pos = getMousePos(e);

    if (vectorId !== null) BootstrapInstance.removeVector(vectorId);
    vectorId = BootstrapInstance.addVector(startPoint, startPoint.delta(pos).scale(0.5), "red");
}

canvas.onmouseup = canvas.ontouchend = (e) => {
    if (!startPoint) {
        return;
    }

    e.preventDefault();
    const pos = getMousePos(e);

    creatingBody.setActive(true);
    creatingBody.setVelocity(startPoint.delta(pos).scale(2));

    BootstrapInstance.removeVector(vectorId);
    startPoint = null;
    vectorId = null;
    creatingBody = null;
}

BootstrapInstance.run();