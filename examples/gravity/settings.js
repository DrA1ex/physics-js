import {AppSettingsBase, SettingsBase, SettingsGroup, Property} from "../common/settings/base.js";
import {ComponentType} from "../common/settings/enum.js";

/**
 * @enum {string}
 */
export const GravityComponentType = {
    world: "world",
    particleLook: "particleLook",
    particleSizing: "particleSizing",
    physics: "physics",
    particleInitialization: "particleInitialization",
    ...ComponentType
}

class ParticleSettings extends SettingsBase {
    static Properties = {
        count: Property.int("count", 300)
            .setName("Particle count")
            .setConstraints(2, 10000)
            .setBreaks(GravityComponentType.particleInitialization),
        minSize: Property.float("min_size", 20)
            .setName("Particle min size")
            .setConstraints(0.1, 1000)
            .setAffects(GravityComponentType.particleSizing),
        maxSize: Property.float("max_size", 40)
            .setName("Particle max size")
            .setConstraints(0.1, 1000)
            .setAffects(GravityComponentType.particleSizing),
    }
}

class RenderSettings extends SettingsBase {
    static Properties = {
        particleScale: Property.float("p_scale", 20)
            .setName("Particle Scale").setDescription("Particle sprite scale")
            .setConstraints(0.1, 1000)
            .setAffects(GravityComponentType.particleLook),
        particleOpacity: Property.float("opacity", 1)
            .setName("Particle Opacity").setDescription("Particle sprite opacity")
            .setConstraints(0, 1)
            .setAffects(GravityComponentType.particleLook),
        particleBlending: Property.bool("blend", true)
            .setName("Particle Blending")
            .setAffects(GravityComponentType.renderer),
        particleColoring: Property.bool("color", true)
            .setName("Particle Coloring")
            .setAffects(GravityComponentType.particleLook),
        particleTextureUrl: Property.string("tex", new URL("./sprites/particle.png", import.meta.url))
            .setName("Particle texture url")
            .setBreaks(GravityComponentType.particleLook),
    }
}

class DisplaySettings extends SettingsBase {
    static Properties = {
        particleScale: Property.float("p_scale", 20)
            .setName("Particle Scale").setDescription("Particle sprite scale")
            .setConstraints(0.1, 1000)
            .setAffects(GravityComponentType.particleLook),
    }
}

class SimulationSettings extends SettingsBase {
    static Properties = {
        gravity: Property.float("gravity", 1000)
            .setName("Gravity force")
            .setConstraints(0, 10000)
            .setAffects(GravityComponentType.physics),
        minInteractionDistance: Property.float("min_distance", 0.01)
            .setName("Min interaction distance")
            .setConstraints(0, 100)
            .setAffects(GravityComponentType.physics),
    }

    get minInteractionDistanceSq() {return this.minInteractionDistance ** 2;}
}

class WorldSettings extends SettingsBase {
    static Properties = {
        worldScale: Property.float("w_scale", 40)
            .setName("World distance scale")
            .setConstraints(1, 10000)
            .setAffects(GravityComponentType.renderer)
            .setBreaks(GravityComponentType.world),
    }
}

export class GravityExampleSettings extends AppSettingsBase {
    static Types = {
        particle: SettingsGroup.of(ParticleSettings).setName("Particles"),
        simulation: SettingsGroup.of(SimulationSettings).setName("Simulation"),
        render: SettingsGroup.of(RenderSettings).setName("Render"),
        world: SettingsGroup.of(WorldSettings).setName("Display"),
    }
}