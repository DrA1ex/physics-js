import {Property, SettingsBase, SettingsGroup} from "./base.js";
import {ComponentType} from "./enum.js";

export class RenderSettings extends SettingsBase {
    static Properties = {
        useDpr: Property.bool("dpr", true)
            .setName("Use DPR"),
    }
}

for (const prop of Object.values(RenderSettings.Properties)) {
    prop.setAffects(ComponentType.renderer);
}

export const RenderConfigGroup = {
    renderer: SettingsGroup.of(RenderSettings).setName("Renderer"),
}