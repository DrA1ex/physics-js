import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import {BoundaryBox, RectBody} from "../../body.js";
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

BootstrapInstance.run();