import {Vector2} from "../../lib/utils/vector.js";
import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {CircleBody} from "../../lib/physics/body/circle.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {WebglRenderer} from "../../lib/render/renderer/webgl/renderer.js";

import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import * as Utils from "../common/utils.js";

const options = Params.parse()
const BootstrapInstance = new Bootstrap(
    new WebglRenderer(document.getElementById("canvas"), options),
    Object.assign({solverBias: 0.1}, options)
);

const WorldRect = new BoundaryBox(0, BootstrapInstance.canvasWidth, 0, BootstrapInstance.canvasHeight);
BootstrapInstance.addConstraint(new InsetConstraint(WorldRect, 0.3));
BootstrapInstance.addRect(WorldRect);

const {count, minSize, maxSize, gravity} = Params.parseSettings({
    count: {parser: Params.Parser.int, param: "count", default: 100},
    minSize: {parser: Params.Parser.int, param: "min_size", default: 5},
    maxSize: {parser: Params.Parser.int, param: "max_size", default: 10},
    gravity: {parser: Params.Parser.float, param: "gravity", default: 10}
});

for (let i = 0; i < count; i++) {
    const size = minSize + Math.random() * Math.max(0, maxSize - minSize);

    const position = new Vector2(
        BootstrapInstance.canvasWidth * Math.random(),
        BootstrapInstance.canvasHeight * Math.random()
    );

    Utils.clampBodyPosition(position, WorldRect, size);
    const body = new CircleBody(position.x, position.y, size / 2, size);

    const {renderer} = BootstrapInstance.addRigidBody(
        body.setFriction(options.friction)
            .setTag("particle")
    );

    renderer.color = Utils.randomColor(100, 200);
}

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();

function gravityStep() {
    BootstrapInstance.clearShapes();
    const tree = BootstrapInstance.solver.stepInfo.tree;
    if (tree) {
        processNode(tree.root);
    }
}

function processNode(node) {
    if (node.leafs.length > 0) {
        const stepDelta = BootstrapInstance.solver.stepInfo.delta;
        const count = node.leafs.length;
        for (let i = 0; i < count; i++) {
            const l1 = node.leafs[i];
            const l1Items = l1.items.filter(body => body.tag === "particle");

            if (!l1Items.length) continue;

            const l1Boundary = BoundaryBox.fromBodies(l1Items);
            const mass1 = l1Items.reduce((p, c) => p + c.mass, 0);

            for (let j = i + 1; j < count; j++) {
                const l2 = node.leafs[j];
                const l2Items = l2.items.filter(body => body.tag === "particle");

                if (!l2Items.length) continue;

                const l2Boundary = BoundaryBox.fromBodies(l2Items);
                const mass2 = l2Items.reduce((p, c) => p + c.mass, 0);

                const impulse = calculateForce(l1Boundary.center, l2Boundary.center, stepDelta);

                const impulse1 = impulse.scaled(mass2);
                for (const item of l1Items) applyForce(item, impulse1)

                const impulse2 = impulse.scaled(-mass1);
                for (const item of l2Items) applyForce(item, impulse2)
            }

            processNode(l1);
        }
    } else {
        processLeaf(node);
    }
}

function processLeaf(leaf) {
    const items = leaf.items.filter(body => body.tag === "particle");

    const stepDelta = BootstrapInstance.solver.stepInfo.delta;
    const count = items.length;
    for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
            const p1 = items[i];
            const p2 = items[j];

            const impulse = calculateForce(p1.position, p2.position, stepDelta);

            applyForce(p1, impulse.scaled(p2.mass));
            applyForce(p2, impulse.scaled(p1.mass).negate());
        }
    }
}

function calculateForce(p1, p2, stepDelta) {
    const delta = p1.delta(p2);
    const distSqr = delta.lengthSquared();

    const force = -gravity / distSqr;
    return delta.scale(force * stepDelta);
}

function applyForce(body, impulse) {
    body.velocity.add(impulse.scaled(body.invertedMass));
}

while (true) {
    await BootstrapInstance.requestPhysicsFrame(gravityStep);
}