import Settings from "./settings.js";
import * as Utils from "./utils.js";
import * as ColorUtils from "../common/color.js";

export class ThemeManager {
    static Themes = ["dawn-theme", "day-theme", "sunset-theme", "dusk-theme", "night-theme"];

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
        document.body.classList.remove(...ThemeManager.Themes);
        document.body.classList.add(name);

        await this.updateStyling();
    }

    async updateStyling() {
        const [nextProps, hasChanges] = this.#collectStyleProps(this.#lastProps);

        if (!this.#initialized) {
            await this.#applyTheme(nextProps)
            this.#initialized = true;
        } else if (hasChanges) {
            await this.#animateThemeChanges(this.#lastProps, nextProps);
        }

        this.#lastProps = nextProps;
    }

    watch() {
        setTimeout(this.#watchImpl.bind(this), Settings.Style.WatchInterval);
    }

    async #watchImpl() {
        await this.updateStyling();
        setTimeout(this.#watchImpl.bind(this), Settings.Style.WatchInterval);
    }

    /**
     * @param {Object} lastProps
     * @return {[Object, boolean]}
     */
    #collectStyleProps(lastProps) {
        const nextProps = {}
        let hasChanges = false;
        for (const prop of Settings.Style.Properties) {
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
        const bg = document.getElementById("background");
        bg.style.setProperty("--bg-color-1", props["--bg-color-1"]);
        bg.style.setProperty("--bg-color-2", props["--bg-color-2"]);
        bg.style.setProperty("--bg-color-3", props["--bg-color-3"]);

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
     * @param {Object} props
     * @return {Promise}
     */
    async #animateThemeChanges(lastProps, props) {
        for (let i = 0; i <= 1; i += Settings.Style.Animation.Step) {
            const current = {};
            for (const key of Object.keys(props)) {
                current[key] = ColorUtils.colorBetween(lastProps[key], props[key], i);
            }

            await this.#applyTheme(current);
            await Utils.delay(Settings.Style.Animation.Interval);
        }
    }
}