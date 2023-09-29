import {DependantProperties, Property, SettingsBase, SettingsGroup} from "./base.js";
import {ComponentType} from "./enum.js";

export class DebugSettings extends SettingsBase {
    static Properties = {
        statistics: Property.bool("stats", true)
            .setName("Statistics"),

        debug: Property.bool("debug", false)
            .setName("Debug mode"),

        showBodies: Property.bool("debug_body", true)
            .setName("Show bodies"),
        showVectors: Property.bool("debug_vector", true)
            .setName("Show vectors"),
        showVectorLength: Property.bool("debug_vector_length", false)
            .setName("Show vector length"),
        showPoints: Property.bool("debug_vector", true)
            .setName("Show points"),

        showBoundary: Property.bool("debug_boundary", true)
            .setName("Show boundaries"),
        showVelocityVector: Property.bool("debug_velocity", true)
            .setName("Show velocity"),

        showNormalVector: Property.bool("debug_normal", false)
            .setName("Show normal"),
        showTangentVector: Property.bool("debug_tangent", false)
            .setName("Show tangent"),
        showContactVector: Property.bool("debug_contact", false)
            .setName("Show contact"),
        showWarmVector: Property.bool("debug_warming", false)
            .setName("Show warming"),

        debugTree: Property.bool("debug_tree", false)
            .setName("Debug tree"),
        showTreeLeafs: Property.bool("debug_tree_leafs", true)
            .setName("Show tree leafs"),
        showTreeSegments: Property.bool("debug_tree_segments", false)
            .setName("Show tree segments"),
        showTreeBoundaryCollision: Property.bool("debug_tree_collision", true)
            .setName("Show tree boundary collision"),

        vectorArrowSize: Property.float("vector_arrow_size", 2)
            .setName("Vector arrow size"),
        collisionSize: Property.float("collision_size", 4)
            .setName("Collision point size"),
    }

    static PropertiesDependencies = new Map([
        [this.Properties.debug, new DependantProperties([
            this.Properties.debugTree,
            this.Properties.showBodies,
            this.Properties.showVectors,
            this.Properties.showVectorLength,
            this.Properties.showPoints,
            this.Properties.showBoundary,
            this.Properties.showVelocityVector,
            this.Properties.showNormalVector,
            this.Properties.showTangentVector,
            this.Properties.showContactVector,
            this.Properties.showWarmVector,
        ])],

        [this.Properties.debugTree, new DependantProperties([
            this.Properties.showTreeLeafs,
            this.Properties.showTreeSegments,
            this.Properties.showTreeBoundaryCollision,
        ])]
    ])
}

for (const prop of Object.values(DebugSettings.Properties)) {
    prop.setAffects(ComponentType.debug);
}

export const DebugConfigGroup = {
    debug: SettingsGroup.of(DebugSettings).setName("Debug")
}