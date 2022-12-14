import * as CommonUtils from "../../lib/utils/common.js";
import Settings, {Themes} from "./settings.js";
import * as Utils from "./utils/common.js";
import * as GeoUtils from "./utils/geo.js";

export class ThemeManager {
    #lastProps = {};
    #initialized = false;

    #engine;
    #worldBox;
    #bgDrawer;
    #house;
    #snowCloud;
    #snowDrift;
    #theme;

    constructor(engine, worldBox, bgDrawer, house, snowCloud, snowDrift) {
        this.#engine = engine;
        this.#worldBox = worldBox;
        this.#bgDrawer = bgDrawer;
        this.#house = house;
        this.#snowCloud = snowCloud;
        this.#snowDrift = snowDrift;

        this.#theme = Settings.Sun.Theme;
    }

    /**
     * @param {string} name
     * @return {Promise}
     */
    async setTheme(name) {
        document.body.classList.remove(...Settings.Style.Themes);
        document.body.classList.add(name);
        this.#theme = name;

        await this.updateStyling();
    }

    async setupAstroSync(lat, lon) {
        const _update = async () => {
            const now = new Date();
            const currentHour = now.getHours() + now.getMinutes() / 60;

            const periods = Settings.Sun.Periods;
            const periodsCnt = periods.length;

            let theme = periods[periodsCnt - 1].theme;
            for (let i = 0; i < periodsCnt; i++) {
                const period = periods[i];
                const hour = GeoUtils.sunPosition(now, lat, lon, period.config.azimuth)[period.config.kind];

                if (currentHour < hour) {
                    theme = periods[(periodsCnt + i - 1) % periodsCnt].theme;
                    break;
                }
            }

            await this.setTheme(Themes[theme]);
            setTimeout(_update, 60 * 1000);
        }

        await _update();
    }

    setupPeriodicChange(initialTheme, period) {
        let index = Settings.Style.Themes.indexOf(initialTheme);

        const _update = async () => {
            const themes = Settings.Style.Themes;
            await this.setTheme(themes[++index % themes.length]);
            setTimeout(_update, period);
        };

        setTimeout(_update, period);
    }

    async updateStyling(animated = true) {
        const [nextProps, hasChanges] = this.#collectStyleProps(this.#lastProps);

        if (!this.#initialized) {
            await this.#applyTheme(nextProps)
            this.#initialized = true;
            this.#engine.statsExtra["Theme"] = this.#theme;
        } else if (hasChanges) {
            if (animated) {
                this.#engine.statsExtra["Theme"] = "changing";
                await this.#animateThemeChanges(this.#lastProps, nextProps);
            } else {
                await this.#applyTheme(nextProps);
            }

            this.#engine.statsExtra["Theme"] = this.#theme;
        }

        this.#lastProps = nextProps;
    }

    watch() {
        setTimeout(this.#watchImpl.bind(this), Settings.Style.WatchInterval);
    }

    async #watchImpl() {
        await this.updateStyling(false);
        setTimeout(this.#watchImpl.bind(this), Settings.Style.WatchInterval);
    }

    /**
     * @param {Object} lastProps
     * @return {[Object, boolean]}
     */
    #collectStyleProps(lastProps) {
        const nextProps = {}
        let hasChanges = false;
        for (const prop of Object.keys(Settings.Style.Properties)) {
            nextProps[prop] = Utils.getCssVariable(prop);
            if (nextProps[prop] !== lastProps[prop]) {
                hasChanges = true;
            }
        }

        return [nextProps, hasChanges];
    }

    /**
     * @param {Object} props
     * @return {Promise}
     */
    async #applyTheme(props) {
        const bg = document.getElementById("container");
        bg.style.setProperty("--bg-color-1", props["--bg-color-1"]);
        bg.style.setProperty("--bg-color-2", props["--bg-color-2"]);
        bg.style.setProperty("--bg-color-3", props["--bg-color-3"]);

        const [angle] = CommonUtils.parseAngle(props["--sun-angle"]);

        const orbitOffsetX = this.#worldBox.center.x + Settings.Sun.Orbit.OffsetX * this.#worldBox.width;
        const orbitOffsetY = this.#worldBox.center.y + Settings.Sun.Orbit.OffsetY * this.#worldBox.height;
        const orbitWidth = Settings.Sun.Orbit.Width * this.#worldBox.width;
        const orbitHeight = Settings.Sun.Orbit.Height * this.#worldBox.height;

        bg.style.setProperty("--sun-angle", props["--sun-angle"]);
        bg.style.setProperty("--sun-position-x", `${orbitOffsetX + Math.cos(angle) * orbitWidth}px`);
        bg.style.setProperty("--sun-position-y", `${orbitOffsetY + Math.sin(angle) * orbitHeight}px`);

        const snowColor = props["--snow-color"];
        this.#snowCloud.snowSprite.setupFilter(snowColor, "color");
        this.#snowDrift.snowDriftBody.renderer.fillStyle = snowColor;

        this.#bgDrawer.updatePalette(
            props["--mountain-color-top"], props["--mountain-color-bottom"],
            props["--tree-color-top"], props["--tree-color-bottom"],
        );

        await this.#house.updateStyle(props);
    }

    /**
     * @param {Object} lastProps
     * @param {Object} nextProps
     * @return {Promise}
     */
    async #animateThemeChanges(lastProps, nextProps) {
        const animations = {};
        for (const [key, animationType] of Object.entries(Settings.Style.Properties)) {
            animations[key] = new animationType(lastProps[key], nextProps[key], Settings.Style.Animation.Step)
                .setEasing(Settings.Style.Animation.Easing);
        }

        let hasNextValue = true;
        const currentProps = {};
        while (hasNextValue) {
            hasNextValue = false;

            const t = performance.now();
            await this.#engine.requestRenderFrame(async (delta) => {
                for (const [key, animation] of Object.entries(animations)) {
                    currentProps[key] = animation.next(Math.max(delta, Settings.Style.Animation.Interval / 1000));
                    hasNextValue ||= animation.hasNextValue();
                }

                await this.#applyTheme(currentProps)
            });

            const waitTime = Settings.Style.Animation.Interval - (performance.now() - t);
            if (hasNextValue && waitTime > 0) {
                await Utils.delay(waitTime);
            }
        }
    }
}