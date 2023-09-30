import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {GlobalWind, GravityForce, ResistanceForce} from "../../lib/physics/force.js";
import {CanvasRenderer} from "../../lib/render/renderer/canvas/renderer.js";
import {Vector2} from "../../lib/utils/vector.js";

import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import * as CommonUtils from "../common/utils.js";
import {BackgroundDrawer} from "./background.js";
import {House} from "./objects/house.js";
import {Tags, WorldBorderCollider} from "./objects/misc.js";
import {SnowCloud, SnowDrift} from "./objects/snow.js";

import Settings, {SunMode} from "./settings.js";
import {ThemeManager} from "./theme.js";
import * as GeoUtils from "./utils/geo.js";
import {DefaultBootstrapSettings} from "../common/settings/default.js";

CommonUtils.installGlobalErrorHook();
document.body.classList.add(Settings.Sun.Theme);

const loaderState = document.getElementById("loader-state");
loaderState.innerText = "Initialize engine...";

const options = Params.parse();

const EngineSettings = DefaultBootstrapSettings.fromQueryParams({
    restitution: 0, friction: 0.8, overlap: 0.5, beta: 1, bias: 0.1, treeMaxCount: 13,
    statistics: false, useDpr: Settings.Preset.dpr
})

const BootstrapInstance = new Bootstrap(
    new CanvasRenderer(document.getElementById("canvas"), EngineSettings.renderer), EngineSettings);
BootstrapInstance.statsExtra["Preset"] = Settings.Preset.name;

BootstrapInstance.addForce(new GravityForce(options.gravity));
BootstrapInstance.addForce(new ResistanceForce(options.resistance));
BootstrapInstance.addForce(new GlobalWind(new Vector2(-1.2, -5)));

const WorldBox = new BoundaryBox(
    -Settings.World.Border, BootstrapInstance.canvasWidth + Settings.World.Border,
    Settings.World.OffsetTop, BootstrapInstance.canvasHeight
);

const borderConstraint = new InsetConstraint(WorldBox, 0.3);
borderConstraint.constraintBody.collider = new WorldBorderCollider(borderConstraint.constraintBody, BootstrapInstance);
borderConstraint.constraintBody.setTag(Tags.worldBorder);
BootstrapInstance.addConstraint(borderConstraint);

loaderState.innerText = "Initialize background...";

const bgDrawer = new BackgroundDrawer(WorldBox, options);
BootstrapInstance.addRenderStep(bgDrawer);

loaderState.innerText = "Initialize objects...";

const house = new House(BootstrapInstance, WorldBox);
await house.init();

const snowCloud = new SnowCloud(BootstrapInstance, WorldBox, options);
await snowCloud.init();

snowCloud.setupInteractions();
snowCloud.letItSnow();

const snowDrift = new SnowDrift(BootstrapInstance, WorldBox);

const themeManager = new ThemeManager(BootstrapInstance, WorldBox, bgDrawer, house, snowCloud, snowDrift);

loaderState.innerText = "Initialize sun positioning...";


let coords = null;
if (Settings.Sun.Mode === SunMode.sync) {
    if (Settings.Sun.Coordinates.Detect) {
        const gps = await GeoUtils.getGeoPosition();
        if (gps) coords = {lat: gps.coords.latitude, lon: gps.coords.longitude};
    }
    if (!coords && Settings.Sun.Coordinates.Lat && Settings.Sun.Coordinates.Lon) {
        coords = {lat: Settings.Sun.Coordinates.Lat, lon: Settings.Sun.Coordinates.Lon};
    }
}

loaderState.innerText = "Apply style...";

if (Settings.Sun.Mode === SunMode.sync && coords) {
    BootstrapInstance.statsExtra["Sun mode"] = SunMode.sync;
    await themeManager.setupAstroSync(coords.lat, coords.lon);
} else if (Settings.Sun.Mode === SunMode.fixed) {
    BootstrapInstance.statsExtra["Sun mode"] = SunMode.fixed;
    await themeManager.updateStyling();
    if (Settings.Style.Watch) themeManager.watch();
} else {
    BootstrapInstance.statsExtra["Sun mode"] = SunMode.periodic;
    await themeManager.setTheme(Settings.Sun.Theme);
    themeManager.setupPeriodicChange(Settings.Sun.Theme, Settings.Sun.Interval * 1000);
}

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();

document.getElementById("loader").style.display = "none";
document.getElementById("hint").style.display = null;