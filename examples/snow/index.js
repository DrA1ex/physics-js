import {BoundaryBox, RectBody} from "../../lib/physics/body.js";
import {GravityForce, ResistanceForce, WindForce} from "../../lib/physics/force.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {Vector2} from "../../lib/utils/vector.js";
import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import * as CommonUtils from "../common/utils.js";
import {SnowCloud, SnowDrift} from "./snow.js";
import {WorldBorderCollider} from "./misc.js";


const options = Params.parse({restitution: 0, friction: 0.8, overlap: 0.5, beta: 1, stats: false, tree_cnt: 13, warming: false});
const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);
const {canvasWidth, canvasHeight} = BootstrapInstance;

BootstrapInstance.addForce(new GravityForce(options.gravity));
BootstrapInstance.addForce(new ResistanceForce(options.resistance));
BootstrapInstance.addForce(new WindForce(new Vector2(2, -5)));

const top = -40;
const bottom = canvasHeight - 1;

const snowSpawnPeriod = 1000 / 120;
const snowPeriod = 1000 / 60;

const snowdriftSegmentCount = 200;
const snowDriftInitialHeight = 20;

const houseSize = 200;
const roofSize = 180;

const borderConstraint = new InsetConstraint(new BoundaryBox(-100, canvasWidth + 100, top, bottom), 0.3);
borderConstraint.constraintBody.collider = new WorldBorderCollider(borderConstraint.constraintBody, BootstrapInstance);
BootstrapInstance.addConstraint(borderConstraint);

const worldBox = borderConstraint.box;

const house = BootstrapInstance.addRigidBody(
    new RectBody(canvasWidth / 2, bottom - houseSize / 2, houseSize, houseSize)
        .setActive(false)
)

house.renderer.fill = true;
house.renderer.fillStyle = "#bdbdbd"
house.renderer.strokeStyle = "#424242"

const roof = BootstrapInstance.addRigidBody(
    CommonUtils.createRegularPoly(new Vector2(canvasWidth / 2, house.body.boundary.top - roofSize / 6), 3, roofSize)
        .setScale(new Vector2(0.75, 2))
        .setAngle(-Math.PI / 2)
        .setFriction(0.9)
        .setActive(false)
);

roof.renderer.fill = true
roof.renderer.renderDirection = false;
roof.renderer.fillStyle = "#832d2d"
roof.renderer.strokeStyle = "#5e2828"

const snowCloudOptions = {snowPeriod: snowPeriod, emitSnowPeriod: snowSpawnPeriod};
const snowCloud = new SnowCloud(BootstrapInstance, worldBox, snowCloudOptions, options);

snowCloud.setupInteractions();
snowCloud.letItSnow();

const snowDrift = new SnowDrift(BootstrapInstance, worldBox, snowdriftSegmentCount, snowDriftInitialHeight);

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();