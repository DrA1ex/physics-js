import {BoundaryBox, PolygonBody, RectBody} from "../../lib/physics/body.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {GlobalWind, GravityForce, ResistanceForce} from "../../lib/physics/force.js";
import {Sprite, SpriteRenderer} from "../../lib/render/sprite.js";
import {Vector2} from "../../lib/utils/vector.js";

import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import * as CommonUtils from "../common/utils.js";

import {BackgroundDrawer} from "./background.js";
import {SnowCloud, SnowDrift, Tags} from "./snow.js";
import {WorldBorderCollider} from "./misc.js";
import {HouseFlue} from "./flue.js";
import {RoofSnowDriftBody} from "./body.js";
import {SvgWrapper} from "../../lib/render/svg.js";
import * as ColorUtils from "../common/color.js";
import * as Utils from "./utils.js";

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

const options = Params.parse({
    restitution: 0, friction: 0.8, overlap: 0.5, beta: 1, bias: 0.1, stats: false, tree_cnt: 13, dpr: !CommonUtils.isMobile()
});

const snowOptions = Params.parseSettings({
    watch: {parser: Params.Parser.bool, param: "watch", default: false},
    top: {parser: Params.Parser.float, param: "offset_top", default: -40},
    bottom: {parser: Params.Parser.float, param: "offset_bottom", default: -1},

    snowSpawnPeriod: {parser: Params.Parser.float, param: "snow_spawn_fq", default: 1000 / 160},
    snowPeriod: {parser: Params.Parser.float, param: "snow_emit_fq", default: 1000 / 80},

    snowdriftSegmentCount: {parser: Params.Parser.float, param: "sd_seg_cnt", default: 200},
    snowDriftInitialHeight: {parser: Params.Parser.float, param: "sd_height", default: 30},

    houseWidth: {parser: Params.Parser.float, param: "house_w", default: 400},
    houseHeight: {parser: Params.Parser.float, param: "house_h", default: 250},
    houseFlueWidth: {parser: Params.Parser.float, param: "flue_w", default: 30},

    roofSnowDriftPointsCount: {parser: Params.Parser.float, param: "roof_seg_cnt", default: 30},
    roofSnowDriftWidth: {parser: Params.Parser.float, param: "roof_sd_w", default: 246},
    roofSnowDriftHeight: {parser: Params.Parser.float, param: "roof_sd_h", default: 10},
});

const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);
const {canvasWidth, canvasHeight} = BootstrapInstance;

BootstrapInstance.addForce(new GravityForce(options.gravity));
BootstrapInstance.addForce(new ResistanceForce(options.resistance));
BootstrapInstance.addForce(new GlobalWind(new Vector2(-1.2, -5)));

const top = snowOptions.top;
const bottom = canvasHeight - snowOptions.bottom;

const borderConstraint = new InsetConstraint(new BoundaryBox(-100, canvasWidth + 100, top, bottom), 0.3);
borderConstraint.constraintBody.collider = new WorldBorderCollider(borderConstraint.constraintBody, BootstrapInstance);
borderConstraint.constraintBody.setTag(Tags.worldBorder);
BootstrapInstance.addConstraint(borderConstraint);

const worldBox = borderConstraint.box;

const bgDrawer = new BackgroundDrawer(worldBox, options);
BootstrapInstance.addRenderStep(bgDrawer);

const {snowSpawnPeriod, snowPeriod} = snowOptions;
const {snowdriftSegmentCount, snowDriftInitialHeight} = snowOptions;
const {houseWidth, houseHeight, houseFlueWidth} = snowOptions;
const houseFlueHeight = houseFlueWidth * 1.7;

const houseSvg = await SvgWrapper.fromRemote("./sprites/house.svg");
const houseSprite = new Sprite(houseSvg.getSource());
await houseSprite.wait();
houseSprite.setupPreRendering(houseWidth, houseHeight);

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

const roof = new PolygonBody(canvasWidth / 2, bottom - houseHeight / 2, roofPoly)
    .setTag(Tags.house)
    .setActive(false);
BootstrapInstance.addRigidBody(roof).renderer.stroke = false;

const {roofSnowDriftPointsCount, roofSnowDriftWidth, roofSnowDriftHeight} = snowOptions;

const roofSnowDrift = new RoofSnowDriftBody(
    roof.position.x - 4, roof.boundary.top + 4,
    roofSnowDriftWidth, roofSnowDriftHeight, roofSnowDriftPointsCount,
    (c, sd, body) => {if (body.tag === Tags.snowflake) BootstrapInstance.destroyBody(body)}
).setSkew(new Vector2(Math.PI / 8)).setAngle(-Math.PI / 180 * 0.5);
BootstrapInstance.addRigidBody(roofSnowDrift, roofSnowDrift.renderer).renderer.stroke = false;

const houseBase = new PolygonBody(canvasWidth / 2, bottom - houseHeight / 2, houseBasePoly)
    .setTag(Tags.house)
    .setActive(false);
BootstrapInstance.addRigidBody(houseBase).renderer.stroke = false;

const houseFlue = new HouseFlue(BootstrapInstance, canvasWidth / 2 + houseFlueWidth, bottom - houseHeight, houseFlueWidth, houseFlueHeight);
await houseFlue.init();
houseFlue.run();

const houseSpriteRenderer = new SpriteRenderer(
    new RectBody(canvasWidth / 2, bottom - houseHeight / 2, houseWidth, houseHeight),
    houseSprite,
);
houseSpriteRenderer.z = 2;
BootstrapInstance.addRenderStep(houseSpriteRenderer);

const snowCloudOptions = {snowPeriod: snowPeriod, emitSnowPeriod: snowSpawnPeriod};
const snowCloud = new SnowCloud(BootstrapInstance, worldBox, snowCloudOptions, options);
await snowCloud.init();

snowCloud.setupInteractions();
snowCloud.letItSnow();

const snowDrift = new SnowDrift(BootstrapInstance, worldBox, snowdriftSegmentCount, snowDriftInitialHeight);

let lastProps = {};
let initialized = false;
await monitorChanges();

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();

document.getElementById("loader").style.display = "none";
document.getElementById("hint").style.display = null;

async function monitorChanges() {
    const props = [
        "--bg-color-1",
        "--bg-color-2",
        "--bg-color-3",
        "--snow-color",
        "--smoke-color",
        "--mountain-color-top",
        "--mountain-color-bottom",
        "--tree-color-top",
        "--tree-color-bottom",
        "--house-fill",
        "--light-color"
    ];

    let hasChanges = false;
    const nextProps = {}
    for (const prop of props) {
        nextProps[prop] = Utils.getCssVariable(prop);
        if (nextProps[prop] !== lastProps[prop]) {
            hasChanges = true;
        }
    }

    if (!initialized) {
        await applyTheme(nextProps);
        initialized = true;
    } else if (hasChanges) {
        for (let i = 0; i <= 1; i += 0.01) {
            const current = {};
            for (const key of Object.keys(nextProps)) {
                current[key] = ColorUtils.colorBetween(lastProps[key], nextProps[key], i);
            }

            await applyTheme(current);
            await new Promise(r => setTimeout(r, 1000 / 10));
            console.log(`Step: ${i}`)
        }
    }

    lastProps = nextProps;

    if (snowOptions.watch) {
        setTimeout(monitorChanges, 1000);
    }
}

async function applyTheme(props) {
    const bg = document.getElementById("background");
    bg.style.setProperty("--bg-color-1", props["--bg-color-1"]);
    bg.style.setProperty("--bg-color-2", props["--bg-color-2"]);
    bg.style.setProperty("--bg-color-3", props["--bg-color-3"]);

    const smokeColor = props["--smoke-color"];
    const snowColor = props["--snow-color"];

    houseFlue.smokeSprite.setupFilter(smokeColor);
    snowCloud.snowSprite.setupFilter(snowColor, "color");

    snowDrift.snowDriftBody.renderer.fillStyle = snowColor;
    roofSnowDrift.renderer.fillStyle = snowColor;

    bgDrawer.updatePalette(
        props["--mountain-color-top"], props["--mountain-color-bottom"],
        props["--tree-color-top"], props["--tree-color-bottom"],
    );

    const houseFill = props["--house-fill"];
    const houseStroke = ColorUtils.shadeColor(houseFill, -0.2);

    const houseShadow = ColorUtils.shadeColor(houseFill, -0.4);
    const houseHighlights = ColorUtils.shadeColor(houseFill, 1.5);
    const houseLight = props["--light-color"];

    const roofFill = snowColor;
    const roofStroke = ColorUtils.shadeColor(roofFill, -0.2);

    houseFlue.houseFlue.renderer.fillStyle = houseFill;
    houseFlue.houseFlue.renderer.strokeStyle = houseStroke;
    houseSvg.setProperty("--house-fill", houseFill);
    houseSvg.setProperty("--house-stroke", houseStroke);
    houseSvg.setProperty("--shadow-color", houseShadow);
    houseSvg.setProperty("--roof-fill", roofFill);
    houseSvg.setProperty("--roof-stroke", roofStroke);
    houseSvg.setProperty("--light-color", houseLight);
    houseSvg.setProperty("--highlight-color", houseHighlights);

    houseSprite.updateSource(houseSvg.getSource());
    await houseSprite.wait();
}

let i = 0;
const themes = ["blue-theme", "sunset-theme", "night-theme"];
const origClass = document.body.className;
setInterval(() => {
    document.body.className = `${origClass} ${themes[i % themes.length]}`;
    i += 1;
}, 10000);