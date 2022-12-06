import {BoundaryBox} from "../../lib/physics/body.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {GlobalWind, GravityForce, ResistanceForce} from "../../lib/physics/force.js";
import {Vector2} from "../../lib/utils/vector.js";

import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import * as CommonUtils from "../common/utils.js";

import {BackgroundDrawer} from "./background.js";
import {SnowCloud, SnowDrift} from "./snow.js";
import {Tags, WorldBorderCollider} from "./misc.js";
import Settings from "./settings.js";
import {House} from "./house.js";
import {ThemeManager} from "./theme.js";

CommonUtils.installGlobalErrorHook();

const options = Params.parse({
    restitution: 0, friction: 0.8, overlap: 0.5, beta: 1, bias: 0.1, stats: false, tree_cnt: 13, dpr: !CommonUtils.isMobile()
});

const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);

BootstrapInstance.addForce(new GravityForce(options.gravity));
BootstrapInstance.addForce(new ResistanceForce(options.resistance));
BootstrapInstance.addForce(new GlobalWind(new Vector2(-1.2, -5)));

const WorldBox = new BoundaryBox(
    -Settings.World.Border, BootstrapInstance.canvasWidth + Settings.World.Border,
    Settings.World.OffsetTop, BootstrapInstance.canvasHeight + Settings.World.OffsetBottom
);

const borderConstraint = new InsetConstraint(WorldBox, 0.3);
borderConstraint.constraintBody.collider = new WorldBorderCollider(borderConstraint.constraintBody, BootstrapInstance);
borderConstraint.constraintBody.setTag(Tags.worldBorder);
BootstrapInstance.addConstraint(borderConstraint);

const bgDrawer = new BackgroundDrawer(WorldBox, options);
BootstrapInstance.addRenderStep(bgDrawer);

const house = new House(BootstrapInstance, WorldBox);
await house.init();

const snowCloud = new SnowCloud(BootstrapInstance, WorldBox, options);
await snowCloud.init();

snowCloud.setupInteractions();
snowCloud.letItSnow();

const snowDrift = new SnowDrift(BootstrapInstance, WorldBox);

const themeManager = new ThemeManager(bgDrawer, house, snowCloud, snowDrift);
await themeManager.updateStyling();

if (Settings.Style.Watch) {
    themeManager.watch();
}

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();

document.getElementById("loader").style.display = "none";
document.getElementById("hint").style.display = null;