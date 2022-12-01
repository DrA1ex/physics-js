import {BoundaryBox, PolygonBody, RectBody} from "../../lib/physics/body.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {GravityForce, ResistanceForce, WindForce} from "../../lib/physics/force.js";
import {Sprite, SpriteRenderer} from "../../lib/render/sprite.js";
import {Vector2} from "../../lib/utils/vector.js";

import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import * as CommonUtils from "../common/utils.js";

import {BackgroundDrawer} from "./background.js";
import {SnowCloud, SnowDrift} from "./snow.js";
import {WorldBorderCollider} from "./misc.js";

CommonUtils.applyViewportScale([
    {media: "(orientation: landscape) and (max-width: 500px)", scale: 0.25},
    {media: "(orientation: landscape) and (max-width: 900px)", scale: 0.5},
    {media: "(orientation: landscape) and (max-width: 1200px)", scale: 0.75},
    {media: "(orientation: landscape) and (max-width: 1400px)", scale: 1},
    {media: "(orientation: portrait) and (max-height: 500px)", scale: 0.25},
    {media: "(orientation: portrait) and (max-height: 900px)", scale: 0.5},
    {media: "(orientation: portrait) and (max-height: 1200px)", scale: 0.75},
    {media: "(orientation: portrait) and (max-height: 1400px)", scale: 1},
]);

addEventListener("error", (event) => {
    alert(event.error?.stack ?? event.message);
});

const options = Params.parse({restitution: 0, friction: 0.8, overlap: 0.5, beta: 1, stats: false, tree_cnt: 13, warming: false});
const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);
const {canvasWidth, canvasHeight} = BootstrapInstance;

BootstrapInstance.addForce(new GravityForce(options.gravity));
BootstrapInstance.addForce(new ResistanceForce(options.resistance));
BootstrapInstance.addForce(new WindForce(new Vector2(-5, -5)));

const top = -40;
const bottom = canvasHeight - 1;

const borderConstraint = new InsetConstraint(new BoundaryBox(-100, canvasWidth + 100, top, bottom), 0.3);
borderConstraint.constraintBody.collider = new WorldBorderCollider(borderConstraint.constraintBody, BootstrapInstance);
BootstrapInstance.addConstraint(borderConstraint);

const worldBox = borderConstraint.box;

const bgDrawer = new BackgroundDrawer(worldBox, options);
BootstrapInstance.addRenderStep(bgDrawer);

const snowSpawnPeriod = 1000 / 120;
const snowPeriod = 1000 / 60;

const snowdriftSegmentCount = 200;
const snowDriftInitialHeight = 30;

const houseSprite = new Sprite("./sprites/house.png");

const houseWidth = 400;
const houseHeight = 250;

const houseSize = new Vector2(houseWidth, houseHeight);

const roofPoly = [
    new Vector2(-0.4453, -0.0396), new Vector2(-0.5000, -0.0393),
    new Vector2(-0.3146, -0.4856), new Vector2(0.3031, -0.5000),
    new Vector2(0.5000, -0.0367),
].map(v => v.mul(houseSize));

const houseBasePoly = [
    new Vector2(-0.4428, 0.5000), new Vector2(-0.4453, -0.0396),
    new Vector2(0.4264, -0.0380), new Vector2(0.4277, 0.4981)
].map(v => v.mul(houseSize));

const roof = new PolygonBody(canvasWidth / 2, bottom - houseHeight / 2, roofPoly).setActive(false);
BootstrapInstance.addRigidBody(roof).renderer.stroke = false;

const houseBase = new PolygonBody(canvasWidth / 2, bottom - houseHeight / 2, houseBasePoly).setActive(false);
BootstrapInstance.addRigidBody(houseBase).renderer.stroke = false;

BootstrapInstance.addRenderStep(
    new SpriteRenderer(
        new RectBody(canvasWidth / 2, bottom - houseHeight / 2, houseWidth, houseHeight),
        houseSprite,
    )
);

const snowCloudOptions = {snowPeriod: snowPeriod, emitSnowPeriod: snowSpawnPeriod};
const snowCloud = new SnowCloud(BootstrapInstance, worldBox, snowCloudOptions, options);
await snowCloud.init();

snowCloud.setupInteractions();
snowCloud.letItSnow();

const snowDrift = new SnowDrift(BootstrapInstance, worldBox, snowdriftSegmentCount, snowDriftInitialHeight);

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();

document.getElementById("loader").style.display = "none";
document.getElementById("hint").style.display = null;
