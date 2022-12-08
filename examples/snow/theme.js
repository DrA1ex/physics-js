import {EasingFunctions} from "../../lib/render/animation.js";

import Settings, {Themes} from "./settings.js";
import * as GeoUtils from "./utils/geo.js";
import * as Utils from "./utils/common.js";

export class ThemeManager {
    #lastProps = {};
    #initialized = false;

    #bgDrawer;
    #house;
    #snowCloud;
    #snowDrift;

    constructor(bgDrawer, house, snowCloud, snowDrift) {
        this.#bgDrawer = bgDrawer;
        this.#house = house;
        this.#snowCloud = snowCloud;
        this.#snowDrift = snowDrift;

    }

    /**
     * @param {string} name
     * @return {Promise}
     */
    async setTheme(name) {
        document.body.classList.remove(...Settings.Style.Themes);
        document.body.classList.add(name);

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
        } else if (hasChanges) {
            if (animated) {
                await this.#animateThemeChanges(this.#lastProps, nextProps);
            } else {
                await this.#applyTheme(nextProps);
            }
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

        bg.style.setProperty("--sun-position-x", props["--sun-position-x"]);
        bg.style.setProperty("--sun-position-y", props["--sun-position-y"]);

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
                .setEasing(EasingFunctions.easeInOutCubic);
        }

        let hasNextValue = true;
        const currentProps = {};
        while (hasNextValue) {
            hasNextValue = false;
            for (const [key, animation] of Object.entries(animations)) {
                currentProps[key] = animation.next(Settings.Style.Animation.Interval / 1000);
                hasNextValue ||= animation.hasNextValue();
            }

            await this.#applyTheme(currentProps);
            await Utils.delay(Settings.Style.Animation.Interval);
        }
    }
}