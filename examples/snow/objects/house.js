import {SvgWrapper} from "../../../lib/render/svg.js";
import {Sprite, SpriteRenderer} from "../../../lib/render/sprite.js";
import {Vector2} from "../../../lib/utils/vector.js";
import {PolygonBody, RectBody} from "../../../lib/physics/body.js";
import {Tags} from "./misc.js";
import {RoofSnowDriftBody} from "./body.js";
import {HouseFlue} from "./flue.js";
import Settings from "../settings.js";
import * as ColorUtils from "../../../lib/utils/color.js";

const HouseSize = new Vector2(Settings.House.Width, Settings.House.Height);
const RoofPoly = [
    new Vector2(-0.4453, -0.0396), new Vector2(-0.5000, -0.0393),
    new Vector2(-0.3146, -0.4856), new Vector2(0.3031, -0.5000),
    new Vector2(0.5000, -0.0367),
].map(v => v.mul(HouseSize));

const HouseBasePoly = [
    new Vector2(-0.4428, 0.5000), new Vector2(-0.4453, -0.0396),
    new Vector2(0.4264, -0.0380), new Vector2(0.4277, 0.4981)
].map(v => v.mul(HouseSize));


export class House {
    #engine;
    #worldBox;

    houseSvg;
    houseSprite;

    roof;
    base;

    roofSnow;
    flue;

    constructor(engine, worldBox) {
        this.#engine = engine;
        this.#worldBox = worldBox;
    }

    async init() {
        this.houseSvg = await SvgWrapper.fromRemote("./sprites/house.svg");
        this.houseSprite = new Sprite(this.houseSvg.getSource());
        await this.houseSprite.wait();
        this.houseSprite.setupPreRendering(Settings.House.Width, Settings.House.Height);

        const houseSpriteRenderer = new SpriteRenderer(
            new RectBody(
                this.#worldBox.center.x, this.#worldBox.bottom - Settings.House.Height / 2,
                Settings.House.Width, Settings.House.Height,
            ),
            this.houseSprite,
        );

        houseSpriteRenderer.z = 2;
        this.#engine.addRenderStep(houseSpriteRenderer);

        this.roof = new PolygonBody(this.#worldBox.center.x, this.#worldBox.bottom - Settings.House.Height / 2, RoofPoly)
            .setTag(Tags.house)
            .setActive(false);

        this.base = new PolygonBody(this.#worldBox.center.x, this.#worldBox.bottom - Settings.House.Height / 2, HouseBasePoly)
            .setTag(Tags.house)
            .setActive(false);

        this.roofSnow = new RoofSnowDriftBody(
            this.roof.position.x - 4, this.roof.boundary.top + 4,
            Settings.House.RoofSnow.Width, Settings.House.RoofSnow.Height, Settings.House.RoofSnow.Segments,
            (c, sd, body) => {if (body.tag === Tags.snowflake) this.#engine.destroyBody(body)}
        ).setSkew(new Vector2(Math.PI / 8)).setAngle(-Math.PI / 180 * 0.5);

        this.#engine.addRigidBody(this.roof).renderer.stroke = false;
        this.#engine.addRigidBody(this.base).renderer.stroke = false;
        this.#engine.addRigidBody(this.roofSnow, this.roofSnow.renderer);

        this.flue = new HouseFlue(
            this.#engine,
            this.#worldBox.center.x + Settings.House.Flue.Width,
            this.#worldBox.bottom - Settings.House.Height,
            Settings.House.Flue.Width, Settings.House.Flue.Height,
        );

        await this.flue.init();
        this.flue.run();
    }

    async updateStyle(props) {
        const smokeColor = props["--smoke-color"];
        const snowColor = props["--snow-color"];

        this.flue.smokeSprite.setupFilter(smokeColor);
        this.roofSnow.renderer.fillStyle = snowColor;

        const houseFill = props["--house-fill"];
        const houseStroke = ColorUtils.shadeColor(houseFill, -0.2);

        const houseShadow = ColorUtils.shadeColor(houseFill, -0.4);
        const houseHighlights = ColorUtils.shadeColor(houseFill, 1.5);
        const houseLight = props["--light-color"];

        const roofFill = snowColor;
        const roofStroke = ColorUtils.shadeColor(roofFill, -0.2);

        this.flue.houseFlue.renderer.fillStyle = houseFill;
        this.flue.houseFlue.renderer.strokeStyle = houseStroke;
        this.houseSvg.setProperty("--house-fill", houseFill);
        this.houseSvg.setProperty("--house-stroke", houseStroke);
        this.houseSvg.setProperty("--shadow-color", houseShadow);
        this.houseSvg.setProperty("--roof-fill", roofFill);
        this.houseSvg.setProperty("--roof-stroke", roofStroke);
        this.houseSvg.setProperty("--light-color", houseLight);
        this.houseSvg.setProperty("--highlight-color", houseHighlights);

        this.houseSprite.updateSource(this.houseSvg.getSource());
        await this.houseSprite.wait();
    }
}