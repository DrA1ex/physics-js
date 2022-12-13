import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import {Vector2} from "../../lib/utils/vector.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import * as Utils from "../common/utils.js";
import {GravityForce} from "../../lib/physics/force.js";
import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {RectBody} from "../../lib/physics/body/rect.js";
import {CircleBody} from "../../lib/physics/body/circle.js";

const options = Params.parse({friction: 0.8, restitution: 0.3});
const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);

const size = 100;
const speed = Math.PI * 8;
const boxCount = 8;
const {canvasWidth, canvasHeight} = BootstrapInstance;
const bottom = canvasHeight - 1 - size / 4 - 100;

BootstrapInstance.addConstraint(new InsetConstraint(new BoundaryBox(1, canvasWidth, 1, bottom), 0, 1));
BootstrapInstance.addForce(new GravityForce(options.gravity));

BootstrapInstance.addRigidBody(new CircleBody(size / 2 + 1, bottom - size - 1, size / 2, 3).setAngularVelocity(speed));

const ramp = Utils.createRegularPoly(new Vector2(), 3, size,)
    .setScale(new Vector2(-3, 1))
    .setSkew(new Vector2(0, Math.PI / 6))
    .setActive(false);

ramp.setPosition(new Vector2(canvasWidth / 2 - ramp.boundary.width / 2, bottom - (ramp.boundary.bottom - ramp.position.y) - size / 4));
BootstrapInstance.addRigidBody(ramp);

const rampRenderer = BootstrapInstance.getRenderer(ramp);
rampRenderer.fill = true;
rampRenderer.renderDirection = false;
rampRenderer.fillStyle = "#3f3f3f";

const floor = new RectBody(canvasWidth / 2, bottom - size / 8, canvasWidth, size / 4).setActive(false);
BootstrapInstance.addRigidBody(floor);
const floorRenderer = BootstrapInstance.getRenderer(floor);
floorRenderer.fill = true;
floorRenderer.fillStyle = "#3f3f3f";

for (let i = 0; i < boxCount; i++) {
    const y = bottom - size / 2 - i * size / 2;
    BootstrapInstance.addRigidBody(new RectBody(canvasWidth / 2 + ramp.boundary.width + size, y, size / 2, size / 2))
}

for (const body of BootstrapInstance.rigidBodies) {
    body.setFriction(options.friction);
    body.setRestitution(options.restitution);
}


BootstrapInstance.enableHotKeys();
BootstrapInstance.run();
