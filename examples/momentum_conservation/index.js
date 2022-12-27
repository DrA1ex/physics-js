import {CanvasRenderer} from "../../lib/render/renderer/canvas/renderer.js";
import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import {Vector2} from "../../lib/utils/vector.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {RectBody} from "../../lib/physics/body/rect.js";
import {CircleBody} from "../../lib/physics/body/circle.js";

const options = Params.parse({friction: 0, restitution: 1, bias: 0, steps: 1, beta: 1})
const BootstrapInstance = new Bootstrap(new CanvasRenderer(document.getElementById("canvas"), options), options);

BootstrapInstance.addConstraint(
    new InsetConstraint(new BoundaryBox(0, BootstrapInstance.canvasWidth, 0, BootstrapInstance.canvasHeight), 1)
);

const blockSide = 500;
const blockWidth = 20;
const size = 40;
const speed = 1000;
const center = new Vector2(BootstrapInstance.canvasWidth / 2, BootstrapInstance.canvasHeight / 2);

BootstrapInstance.addRigidBody(new CircleBody(center.x - size / 2, center.y + size, size).setVelocity(new Vector2(0, -speed)));
BootstrapInstance.addRigidBody(new CircleBody(center.x + size / 2, center.y - size, size).setVelocity(new Vector2(0, speed)));
BootstrapInstance.addRigidBody(new CircleBody(center.x, center.y, size).setVelocity(new Vector2(speed, 0)));

BootstrapInstance.addRigidBody(new RectBody(center.x, center.y - blockSide / 2 - blockWidth / 2, blockSide, blockWidth).setAngle(0).setActive(false));
BootstrapInstance.addRigidBody(new RectBody(center.x - blockSide / 2 + blockWidth / 2, center.y, blockWidth, blockSide).setActive(false));
BootstrapInstance.addRigidBody(new RectBody(center.x + blockSide / 2 - blockWidth / 2, center.y, blockWidth, blockSide).setActive(false));
BootstrapInstance.addRigidBody(new RectBody(center.x, center.y + blockSide / 2 + blockWidth / 2, blockSide, blockWidth).setActive(false));

for (const body of BootstrapInstance.rigidBodies) {
    body.setFriction(options.friction);
    body.setRestitution(options.restitution);
}

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();
