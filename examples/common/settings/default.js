import {AppSettingsBase, Property, SettingsBase, SettingsGroup} from "./base.js";
import {RenderConfigGroup} from "./renderer.js";
import {SolverConfigGroup} from "./solver.js";
import {DebugConfigGroup} from "./debug.js";

export class DefaultBootstrapSettings extends AppSettingsBase {
    static Types = {
        ...RenderConfigGroup,
        ...SolverConfigGroup,
        ...DebugConfigGroup,
    }
}

export class CommonSettings extends SettingsBase {
    static Properties = {
        gravity: Property.float("resistance", 100)
            .setName("Gravity")
            .setConstraints(-10000, 10000),
        resistance: Property.float("resistance", 1)
            .setName("Resistance")
            .setConstraints(0, 1),
        friction: Property.float("friction", 0.5)
            .setName("Friction")
            .setConstraints(0, 1),
        restitution: Property.float("restitution", 0.2)
            .setName("Restitution")
            .setConstraints(0, 1),
    }
}

export class CommonBootstrapSettings extends AppSettingsBase {
    static Types = {
        common: SettingsGroup.of(CommonSettings).setName("Common"),
        ...RenderConfigGroup,
        ...SolverConfigGroup,
        ...DebugConfigGroup,
    }
}