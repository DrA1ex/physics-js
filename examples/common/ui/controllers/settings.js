import {ControllerBase} from "./base.js";
import {View} from "../controls/base.js";
import {PropertyType, ReadOnlyProperty} from "../../settings/base.js";
import {Select} from "../controls/select.js";
import {Input, InputType} from "../controls/input.js";
import {Checkbox} from "../controls/checkbox.js";
import {Label} from "../controls/label.js";

import view from "./views/settings.js";
import {Dialog, DialogPositionEnum, DialogTypeEnum} from "../controls/dialog.js";
import {Button} from "../controls/button.js";
import * as Utils from "../../utils.js";

/**
 * @template {AppSettingsBase} SettingsT
 */
export class SettingsController extends ControllerBase {
    static RECONFIGURE_EVENT = "start_recording";

    /**
     * @param {SettingsT} settings
     * @param contentId
     * @param buttonId
     * @param type
     * @param position
     * @return {SettingsController}
     */
    static defaultCtrl(settings, {
        contentId = "settings-content", buttonId = "settings-button",
        type = DialogTypeEnum.popover,
        position = DialogPositionEnum.right
    } = {}) {
        const settingsCtrl = new SettingsController(document.getElementById(contentId), this);
        const settingsDialog = Dialog.byId("settings", settingsCtrl.root);

        settingsDialog.type = type;
        settingsDialog.position = position;

        settingsCtrl.configure(settings);

        const bSettings = Button.byId(buttonId);
        bSettings.setOnClick(() => {
            bSettings.setEnabled(false);
            settingsDialog.show();
        })

        settingsDialog.setOnDismissed(() => {
            bSettings.setEnabled(true);
        });

        return settingsCtrl;
    }

    static defaultReconfigure(bootstrap) {
        return function (_, newSettings) {
            Utils.updateUrl(newSettings);
            bootstrap.configure(newSettings);
        }
    }

    /** @type {SettingsT} */
    settings;
    /** @type {{[string]: {[string]: InputControl}}} */
    config;
    /** @type {Map<Property, {key: string, groupKey: string, group: SettingsGroup, control: InputControl|Label}>} */
    propData;

    constructor(root, parentCtrl) {
        const viewControl = new View(root, view)
        super(viewControl.element, parentCtrl);

        this.content = this.root.getElementsByClassName("settings-content")[0];
    }

    /**
     * @param {SettingsT} settings
     */
    configure(settings) {
        this.settings = settings;
        this.config = {};
        this.propData = new Map();

        while (this.content.firstChild) {
            this.content.removeChild(this.content.lastChild);
        }

        for (const [key, group] of Object.entries(this.settings.constructor.Types)) {
            if (group.name) {
                this.config[key] = {};
                this._createBlock(this.config[key], key, group, this.settings[key]);
            }
        }

        for (const prop of this.propData.keys()) {
            const {key, groupKey, control: propControl} = this.propData.get(prop);
            const deps = this.settings[groupKey].constructor.PropertiesDependencies.get(prop);

            if (deps?.properties?.length > 0) {
                const value = !!this.settings[groupKey][key] && propControl.enabled;

                for (const depProp of deps.properties) {
                    if (!(depProp instanceof ReadOnlyProperty)) {
                        this.propData.get(depProp).control.setEnabled(value);
                    }
                }
            }
        }
    }

    onParameterChanged(prop, suppressEvent = false) {
        const config = this.getConfig();
        const {control, key, groupKey} = this.propData.get(prop);
        const value = config[groupKey][key];

        if (prop instanceof ReadOnlyProperty) {
            control.setText(prop.format(value));
        } else {
            control.setValue(value);
            if (!suppressEvent) {
                this.emitEvent(SettingsController.RECONFIGURE_EVENT, config);
            }

            const deps = config[groupKey].constructor.PropertiesDependencies.get(prop);
            if (deps && deps.properties.length > 0) {
                for (const depProp of deps.properties) {
                    if (!(depProp instanceof ReadOnlyProperty)) {
                        const depValue = !!value && control.enabled;

                        const invert = deps.options.invert && (deps.options.invert === true || deps.options.invert[depProp.key] === true);
                        this.propData.get(depProp).control.setEnabled(invert ? !depValue : depValue);
                    }

                    this.onParameterChanged(depProp, true);
                }
            }
        }
    }

    getConfig() {
        const config = {};

        for (const [blockKey, block] of Object.entries(this.config)) {
            const blockConfig = {}
            for (const [key, control] of Object.entries(block)) {
                let value = control.getValue();
                if (value instanceof String) {
                    value = value && value !== "null" && value.trim() !== "" ? value.trim() : null;
                }

                blockConfig[key] = value;
            }

            config[blockKey] = blockConfig;
        }

        return this.settings.constructor.deserialize(config);
    }

    _createBlock(config, groupKey, group, value) {
        const h3 = document.createElement("h3");
        h3.innerText = group.name;
        this.content.appendChild(h3);

        const block = document.createElement("div");
        block.classList.add("settings-block");
        this._createBlockEntries(config, groupKey, group, block, value);
        this.content.appendChild(block);
    }

    /**
     * @param {object} config
     * @param {string} groupKey
     * @param {SettingsGroup} group
     * @param {HTMLElement} parent
     * @param {SettingsBase} groupValue
     * @private
     */
    _createBlockEntries(config, groupKey, group, parent, groupValue) {
        let count = 0;
        for (const [key, prop] of Object.entries(groupValue.constructor.Properties)) {
            const caption = document.createElement("div");
            caption.innerText = prop.name || key;
            caption.classList.add("settings-caption")
            if (prop.description) {
                caption.setAttribute("data-tooltip", prop.description);
            }
            parent.appendChild(caption);


            const control = this._createBlockInput(prop, groupValue[key]);
            control.addClass("settings-input");
            control.setOnChange(() => this.onParameterChanged(prop));

            this.propData.set(prop, {
                key,
                groupKey,
                group,
                control
            });

            parent.appendChild(control.element);

            config[key] = control;
            count += 1;
        }

        for (const [key, prop] of Object.entries(groupValue.constructor.ReadOnlyProperties)) {
            const caption = document.createElement("div");
            caption.innerText = prop.name || key;
            caption.classList.add("settings-caption")
            if (prop.description) {
                caption.setAttribute("data-tooltip", prop.description);
            }
            parent.appendChild(caption);

            const label = new Label(document.createElement("div"));
            label.setText(prop.format(groupValue[key]));
            label.addClass("settings-input");
            parent.appendChild(label.element);

            this.propData.set(prop, {
                key,
                groupKey,
                group,
                control: label
            });

            count += 1;
        }

        parent.style.gridTemplateRows = `repeat(${count}, 2em)`;
    }

    /**
     * @param {Property} property
     * @param {*} value
     * @returns {InputControl}
     * @private
     */
    _createBlockInput(property, value) {
        let control;
        switch (property.type) {
            case PropertyType.enum:
                control = this._createSelect(property.enumType, value);
                break;

            case PropertyType.int:
                control = this._createInput(value, InputType.int)
                break;

            case PropertyType.float:
                control = this._createInput(value, InputType.float)
                break;

            case PropertyType.bool:
                control = this._createCheckbox(value);
                break;

            default:
            case PropertyType.string:
                control = this._createInput(value, InputType.text)
                break;
        }

        return control;
    }

    _createInput(value, type) {
        const input = new Input(document.createElement("input"), type);
        input.setValue(value);

        return input;
    }

    _createCheckbox(value) {
        const e = document.createElement("input");
        const input = new Checkbox(e);
        input.setValue(value);

        return input;
    }

    _createSelect(type, value) {
        const select = new Select(document.createElement("select"));
        select.setOptions(Object.keys(type));

        const entry = value && Object.entries(type).find(([k, v]) => v === value);
        if (entry) {
            select.select(entry[0]);
        }

        return select;
    }
}