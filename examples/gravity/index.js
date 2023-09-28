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

const renderer = new WebglRenderer(document.getElementById("canvas"), options);
const BootstrapInstance = new Bootstrap(
    renderer,
    Object.assign({solverBias: 0.5, solverBeta: 1}, options)
);

const {
    count, minSize, maxSize, gravity, particleScale, particleOpacity, worldScale, minInteractionDistance,
    particleTextureUrl, particleBlending, particleColoring
} = Params.parseSettings({
    count: {parser: Params.Parser.int, param: "count", default: 200},
    minSize: {parser: Params.Parser.int, param: "min_size", default: 10},
    maxSize: {parser: Params.Parser.int, param: "max_size", default: 20},
    gravity: {parser: Params.Parser.float, param: "gravity", default: 10},
    particleScale: {parser: Params.Parser.float, param: "p_scale", default: 20},
    particleOpacity: {parser: Params.Parser.float, param: "opacity", default: 1},
    worldScale: {parser: Params.Parser.float, param: "w_scale", default: 40},
    minInteractionDistance: {parser: Params.Parser.float, param: "scale", default: 0.01 ** 2},

    particleBlending: {parser: Params.Parser.bool, param: "blend", default: true},
    particleColoring: {parser: Params.Parser.bool, param: "color", default: true},
    particleTextureUrl: {
        parser: Params.Parser.string,
        param: "tex",
        default: new URL("./sprites/particle.png", import.meta.url)
    }
});


const WorldRect = new BoundaryBox(
    -worldScale * renderer.canvasWidth / 2,
    worldScale * renderer.canvasWidth / 2,
    -worldScale * renderer.canvasHeight / 2,
    worldScale * renderer.canvasHeight / 2
);

let projMatrix = m4.projection(renderer.canvasWidth, renderer.canvasHeight, 2);
projMatrix = m4.translate(projMatrix, renderer.canvasWidth / 2, renderer.canvasHeight / 2, 0);
projMatrix = m4.scale(projMatrix, 1 / worldScale, 1 / worldScale, 1);

BootstrapInstance.renderer.setProjectionMatrix(projMatrix)
BootstrapInstance.addConstraint(new InsetConstraint(WorldRect))
BootstrapInstance.addForce(new ResistanceForce(options.resistance));

if (particleBlending) {
    BootstrapInstance.renderer.setBlending(WebGL2RenderingContext.SRC_COLOR, WebGL2RenderingContext.ONE);
}

const particleTexture = new ImageTexture(particleTextureUrl);
particleTexture.glWrapS = WebGL2RenderingContext.CLAMP_TO_EDGE;
particleTexture.glWrapT = WebGL2RenderingContext.CLAMP_TO_EDGE;
particleTexture.glMin = WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR;

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
    if (particleColoring) {
        renderer.color = Utils.randomColor(170, 255);
    }
    renderer.opacity = particleOpacity;
    renderer.scale = particleScale;

    BootstrapInstance.addRigidBody(body, renderer);

}

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();

function gravityStep() {
    const tree = BootstrapInstance.solver.stepInfo.tree;
    if (tree) {
        calculateTree(tree);
    }
}

/**
 * @param {SpatialTree} tree
 */
function calculateTree(tree) {
    return calculateLeaf(tree.root, new Vector2());
}

/**
 * @param {SpatialLeaf} leaf
 * @param {Vector2} pForce
 */
function calculateLeaf(leaf, pForce) {
    const blocks = leaf.leafs;
    if (blocks.length > 0) {
        calculateLeafBlock(blocks, pForce);
    } else {
        calculateLeafData(leaf, pForce);
    }
}

/**
 *
 * @param {SpatialLeaf[]} blocks
 * @param {Vector2} pForce
 */
function calculateLeafBlock(blocks, pForce) {
    for (let i = 0; i < blocks.length; i++) {
        const blockCenter = blocks[i].boundary.center;
        const iForce = pForce.copy();

        for (let j = 0; j < blocks.length; j++) {
            if (i === j) continue;

            const mass = blocks[j].items
                .filter(b => b.tag === "particle")
                .reduce((p, c) => p + c.mass, 0);

            const g = gravity * mass;
            calculateForce(blockCenter, blocks[j].boundary.center, g, iForce);
        }

        calculateLeaf(blocks[i], iForce);
    }
}

/**
 *
 * @param {SpatialLeaf} leaf
 * @param {Vector2} pForce
 */
function calculateLeafData(leaf, pForce) {
    for (let i = 0; i < leaf.items.length; i++) {
        const attractor = leaf.items[i];
        attractor.velocity.add(pForce);

        for (let j = 0; j < leaf.items.length; j++) {
            if (i === j) continue;

            const particle = leaf.items[j];
            calculateForce(particle.position, attractor.position, gravity * attractor.mass, particle);
        }
    }
}

/**
 * @param {Vector2} p1
 * @param {Vector2} p2
 * @param {number} g
 * @param {Vector2|Body} out
 */
function calculateForce(p1, p2, g, out) {
    const dx = p1.x - p2.x,
        dy = p1.y - p2.y;

    const distSquare = dx * dx + dy * dy;
    if (distSquare < minInteractionDistance) return;

    const force = -g / distSquare;
    if (out.velocity !== undefined) {
        out.velocity.x += dx * force;
        out.velocity.y += dy * force;
    } else {
        out.x += dx * force;
        out.y += dy * force;
    }
}

// noinspection InfiniteLoopJS
while (true) {
    await BootstrapInstance.requestPhysicsFrame(gravityStep);
}