import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import {BoundaryBox, CircleBody, PolygonBody, RectBody} from "../../body.js";
import {Vector2} from "../../vector.js";
import {ConstraintType} from "../../enum.js";

const options = Params.parse()
const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);

BootstrapInstance.addConstraint({
    type: ConstraintType.inset,
    box: new BoundaryBox(0, BootstrapInstance.canvasWidth, 0, BootstrapInstance.canvasHeight),
    damper: new Vector2(1, 1),
});

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

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();
