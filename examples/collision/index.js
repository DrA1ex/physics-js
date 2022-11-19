import {Bootstrap, State} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import {BoundaryBox, CircleBody, RectBody} from "../../body.js";
import {Vector2} from "../../vector.js";
import {ConstraintType} from "../../enum.js";

const options = Params.parse()
const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);

BootstrapInstance.addConstraint({
    type: ConstraintType.inset,
    box: new BoundaryBox(0, BootstrapInstance.canvasWidth, 0, BootstrapInstance.canvasHeight),
    damper: new Vector2(0.3, 0.3),
});

const size = 50;
const distance = 200;
const center = new Vector2(BootstrapInstance.canvasWidth / 2, BootstrapInstance.canvasHeight / 2);

const count = 15;
const angleStep = Math.PI * 2 / count;
for (let i = 0; i < count; i++) {
    const position = Vector2.fromAngle(angleStep * i).scale(distance).add(center);

    let body;
    if (i % 2 === 0) {
        body = new CircleBody(position.x, position.y, size / 2, 1);
    } else {
        body = new RectBody(position.x, position.y, size, size, 1);
    }

    BootstrapInstance.addRigidBody(body.setRestitution(0.3));
}

BootstrapInstance.addRigidBody(new CircleBody(center.x + distance / 2, center.y + distance / 2, size));

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();

const timeout = 1000 / 60;
const delta = timeout / 1000 * options.slowMotion;
setInterval(() => {
    if (BootstrapInstance.state !== State.play) {
        return;
    }

    const count = BootstrapInstance.solver.rigidBodies.length;
    const rotatingBody = BootstrapInstance.solver.rigidBodies[count - 1];
    if (rotatingBody._angle === undefined) {
        rotatingBody._angle = 0;
        rotatingBody._position = rotatingBody.position.copy();
    }

    rotatingBody._angle += Math.PI / 2 * delta;
    const nextPosition = rotatingBody._position.rotated(rotatingBody._angle, new Vector2(center.x, center.y));
    rotatingBody.setVelocity(nextPosition.delta(rotatingBody.position).scale(2));

    for (const body of BootstrapInstance.solver.rigidBodies) {
        if (body === rotatingBody) {
            continue;
        }

        body.angularVelocity *= 0.3;
        body.angle += body.angularVelocity * delta;
        body.velocity.add(rotatingBody.position.delta(body.position).scaled(0.3 * delta));
    }
}, timeout);