import {CircleBody} from "../../lib/physics/body/circle.js";
import {PolygonBody} from "../../lib/physics/body/poly.js";
import {RectBody} from "../../lib/physics/body/rect.js";
import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {CanvasRenderer} from "../../lib/render/renderer/canvas/renderer.js";
import {Vector2} from "../../lib/utils/vector.js";
import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";

const options = Params.parse({restitution: 1});
const BootstrapInstance = new Bootstrap(
    new CanvasRenderer(document.getElementById("canvas"), options),
    Object.assign({solverBias: 0.01}, options)
);

const WorldRect = new BoundaryBox(0, BootstrapInstance.canvasWidth, 0, BootstrapInstance.canvasHeight);
BootstrapInstance.addConstraint(new InsetConstraint(WorldRect, 0.3));
BootstrapInstance.addRect(WorldRect)

const size = 100;
const distance = size * 1.5;
const speed = distance * 2;
const center = new Vector2(BootstrapInstance.canvasWidth / 2, BootstrapInstance.canvasHeight / 2);

BootstrapInstance.addRigidBody(new CircleBody(center.x + distance, center.y + distance, size / 2, 1).setActive(false));
BootstrapInstance.addRigidBody(new RectBody(center.x - distance, center.y + distance, size, size, 1).setActive(false));

const trianglePoints = [new Vector2(0, -size / 2), new Vector2(size / 2, size / 2), new Vector2(-size / 2, size / 2)];
BootstrapInstance.addRigidBody(new PolygonBody(center.x + distance, center.y - distance, trianglePoints, 1).setActive(false));
BootstrapInstance.addRigidBody(new PolygonBody(center.x - distance, center.y - distance, trianglePoints, 1).setAngle(Math.PI / 4).setActive(false));

BootstrapInstance.addRigidBody(new PolygonBody(center.x + distance * 2, center.y + distance - 1, trianglePoints).setVelocity(new Vector2(-speed, 0)));
BootstrapInstance.addRigidBody(new RectBody(center.x - distance * 2, center.y + distance + 1, size, size).setVelocity(new Vector2(speed, 0)));

BootstrapInstance.addRigidBody(new CircleBody(center.x + distance * 2, center.y - distance - 1, size / 2).setVelocity(new Vector2(-speed, 0)));
BootstrapInstance.addRigidBody(new CircleBody(center.x - distance * 2, center.y - distance + 1, size / 2).setVelocity(new Vector2(speed, 0)));

for (const body of BootstrapInstance.rigidBodies) {
    body.setFriction(options.friction);
    body.setRestitution(options.restitution);
}

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();
