import {Vector2} from "../../lib/utils/vector.js";
import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {CircleBody} from "../../lib/physics/body/circle.js";
import {WebglRenderer} from "../../lib/render/renderer/webgl/renderer.js";
import {SpriteObject} from "../../lib/render/renderer/webgl/objects/sprite.js";
import {ImageTexture} from "../../lib/render/renderer/webgl/misc/texture.js";
import {m4} from "../../lib/render/renderer/webgl/utils/m4.js";

import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import * as Utils from "../common/utils.js";
import {ResistanceForce} from "../../lib/physics/force.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";

const options = Params.parse({
    resistance: 1,
    restitution: 0.2,
    friction: 0.5
})
const BootstrapInstance = new Bootstrap(
    new WebglRenderer(document.getElementById("canvas"), options),
    Object.assign({solverBias: 0.5, solverBeta: 1}, options)
);

const {
    count, minSize, maxSize, gravity, particleScale, worldScale, minInteractionDistance
} = Params.parseSettings({
    count: {parser: Params.Parser.int, param: "count", default: 200},
    minSize: {parser: Params.Parser.int, param: "min_size", default: 10},
    maxSize: {parser: Params.Parser.int, param: "max_size", default: 20},
    gravity: {parser: Params.Parser.float, param: "gravity", default: 10},
    particleScale: {parser: Params.Parser.float, param: "p_scale", default: 10},
    worldScale: {parser: Params.Parser.float, param: "w_scale", default: 20},
    minInteractionDistance: {parser: Params.Parser.float, param: "scale", default: 0.01 ** 2},
});

const WorldRect = new BoundaryBox(
    -worldScale * BootstrapInstance.canvasWidth / 2,
    worldScale * BootstrapInstance.canvasWidth / 2,
    -worldScale * BootstrapInstance.canvasHeight / 2,
    worldScale * BootstrapInstance.canvasHeight / 2
);

let projMatrix = m4.projection(BootstrapInstance.canvasWidth, BootstrapInstance.canvasHeight, 2);
projMatrix = m4.translate(projMatrix, BootstrapInstance.canvasWidth / 2, BootstrapInstance.canvasHeight / 2, 0);
projMatrix = m4.scale(projMatrix, 1 / worldScale, 1 / worldScale, 1);

BootstrapInstance.renderer.setProjectionMatrix(projMatrix)
BootstrapInstance.addConstraint(new InsetConstraint(WorldRect))
BootstrapInstance.addForce(new ResistanceForce(options.resistance));

BootstrapInstance.renderer.setBlending(WebGL2RenderingContext.SRC_COLOR, WebGL2RenderingContext.ONE);

const particleTexture = new ImageTexture(new URL("./sprites/particle.png", import.meta.url));
particleTexture.glWrapS = WebGL2RenderingContext.CLAMP_TO_EDGE;
particleTexture.glWrapT = WebGL2RenderingContext.CLAMP_TO_EDGE;
particleTexture.glMin = WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR;
particleTexture.glMag = WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR;

await particleTexture.wait();

const minRadius = Math.min(WorldRect.width, WorldRect.height) / 2 * 0.6
const maxRadius = Math.min(WorldRect.width, WorldRect.height) / 2 * 0.8;

for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const size = minSize + Math.random() * Math.max(0, maxSize - minSize);

    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const position = Vector2.fromAngle(angle)
        .scale(radius)
        .add(WorldRect.center);

    Utils.clampBodyPosition(position, WorldRect, size);
    const body = new CircleBody(position.x, position.y, size)
        .setMass(size)
        .setVelocity(Vector2.fromAngle(Math.random() * Math.PI * 2).scale(gravity))
        .setFriction(options.friction)
        .setRestitution(options.restitution)
        .setTag("particle");

    const renderer = new SpriteObject(body);
    renderer.texture = particleTexture;
    renderer.color = Utils.randomColor(170, 255);
    renderer.scale = particleScale;

    BootstrapInstance.addRigidBody(body, renderer);

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

                const impulse = calculateForce(l1Boundary.center, l2Boundary.center, stepDelta).scale(mass1 * mass2);

                for (const item of l1Items) applyForce(item, impulse)

                const impulse2 = impulse.scaled(-1)
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

            const impulse = calculateForce(p1.position, p2.position, stepDelta)
                .scale(p1.mass * p2.mass);

            applyForce(p1, impulse);
            applyForce(p2, impulse.negate());
        }
    }
}

function calculateForce(p1, p2, stepDelta) {
    const delta = p1.delta(p2);
    const distSqr = delta.lengthSquared();
    if (distSqr < minInteractionDistance) {
        return new Vector2();
    }

    const force = -gravity / distSqr;
    return delta.scale(force * stepDelta);
}

function applyForce(body, impulse) {
    body.velocity.add(impulse.scaled(body.invertedMass));
}

while (true) {
    await BootstrapInstance.requestPhysicsFrame(gravityStep);
}