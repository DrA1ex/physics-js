import {CircleBody} from "../../lib/physics/body/circle.js";
import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {ImageTexture} from "../../lib/render/renderer/webgl/misc/texture.js";
import {SpriteObject} from "../../lib/render/renderer/webgl/objects/sprite.js";
import {WebglRenderer} from "../../lib/render/renderer/webgl/renderer.js";
import {Vector2} from "../../lib/utils/vector.js";
import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";

const options = Params.parse({restitution: 1, bias: 0})
const BootstrapInstance = new Bootstrap(new WebglRenderer(document.getElementById("canvas"), options), options);

const WorldBox = new BoundaryBox(0, BootstrapInstance.renderer.canvasWidth, 0, BootstrapInstance.renderer.canvasHeight);
BootstrapInstance.addConstraint(new InsetConstraint(WorldBox, 0, 1));


const count = 100;
const minSize = 10;
const maxSize = 30;
const speed = 100;

const sprites = [
    new ImageTexture(new URL("./textures/1.png", import.meta.url)),
    new ImageTexture(new URL("./textures/2.png", import.meta.url)),
    new ImageTexture(new URL("./textures/3.png", import.meta.url)),
    new ImageTexture(new URL("./textures/4.png", import.meta.url)),
]

for (const sprite of sprites) {
    sprite.glWrapS = WebGL2RenderingContext.CLAMP_TO_EDGE;
    sprite.glWrapT = WebGL2RenderingContext.CLAMP_TO_EDGE;
    sprite.glMin = WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR;
}

await Promise.all(sprites.map(s => s.wait()));

for (let i = 0; i < count; i++) {
    const size = minSize + (maxSize - minSize) * Math.random();

    const body = new CircleBody(WorldBox.width * Math.random(), WorldBox.height * Math.random(), size)
        .setVelocity(Vector2.fromAngle(Math.PI * 2 * Math.random()).scale(speed))
        .setRestitution(options.restitution)
        .setMass(size);

    const renderObj = new SpriteObject(body);
    renderObj.texture = sprites[Math.floor(Math.random() * sprites.length)];

    BootstrapInstance.addRigidBody(body, renderObj);
}

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();
