import {Property, SettingsBase, SettingsGroup} from "./base.js";
import {ComponentType} from "./enum.js";

export class SolverSettings extends SettingsBase {
    static Properties = {
        steps: Property.int("steps", 6)
            .setName("Steps")
            .setConstraints(1, 20),
        slowMotion: Property.float("slow_motion", 1)
            .setName("Slow motion")
            .setConstraints(0.01, 1),
        bias: Property.float("bias", 0.2)
            .setName("Velocity bias")
            .setConstraints(0, 1),
        beta: Property.float("beta", 0.5)
            .setName("Position correction beta")
            .setConstraints(0, 1),
        overlap: Property.float("overlap", 1)
            .setName("Allowed overlap")
            .setConstraints(0, 10),
        warming: Property.bool("warming", true)
            .setName("Warming"),
        treeDivider: Property.int("tree_divider", 2)
            .setName("Tree divider")
            .setConstraints(2, 16),
        treeMaxCount: Property.int("tree_cnt", 4)
            .setName("Tree max segment count")
            .setConstraints(2, 1000)
    }
}

for (const prop of Object.values(SolverSettings.Properties)) {
    prop.setAffects(ComponentType.solver);
}

export const SolverConfigGroup = {
    solver: SettingsGroup.of(SolverSettings).setName("Solver")
}