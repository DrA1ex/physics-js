import {Bootstrap} from "../common/bootstrap.js";
import {ResistanceForce} from "../../lib/physics/force.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {GravityComponentType, GravityExampleSettings} from "./settings.js";
import {SettingsController} from "../common/ui/controllers/settings.js";
import {Dialog, DialogPositionEnum, DialogTypeEnum} from "../common/ui/controls/dialog.js";
import {Button} from "../common/ui/controls/button.js";
import {GravityPhysics} from "./physics.js";
import {Label} from "../common/ui/controls/label.js";
import {GravityWorld} from "./world.js";
import {GravityRender} from "./render.js";
import {updateUrl} from "../common/utils.js";
import * as Utils from "../common/utils.js";
import {SolverSettings} from "../common/settings/solver.js";

SolverSettings.Properties.bias.defaultValue = 0.5;
SolverSettings.Properties.beta.defaultValue = 1;

let Settings = GravityExampleSettings.fromQueryParams();
const settingsCtrl = new SettingsController(document.getElementById("settings-content"), this);
const settingsDialog = Dialog.byId("settings", settingsCtrl.root);

settingsDialog.type = DialogTypeEnum.popover;
settingsDialog.position = DialogPositionEnum.right;

settingsCtrl.subscribe(this, SettingsController.RECONFIGURE_EVENT, (sender, data) => reconfigure(data));
settingsCtrl.configure(Settings);

const bSettings = Button.byId("settings-button");
bSettings.setOnClick(() => {
    bSettings.setEnabled(false);
    settingsDialog.show();
})

settingsDialog.setOnDismissed(() => {
    bSettings.setEnabled(true);
});

const lblPause = Label.byId("pause-label");

document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
        BootstrapInstance.pause();
    } else {
        BootstrapInstance.play();
    }

    lblPause.setVisibility(document.hidden);
});

const RenderInstance = new GravityRender(document.getElementById("canvas"), Settings)
const BootstrapInstance = new Bootstrap(
    RenderInstance.renderer,
    Settings,
    //Object.assign({solverBias: 0.5, solverBeta: 1}, options)
);

RenderInstance.initialize();
const GravityInstance = new GravityPhysics(BootstrapInstance, Settings);
const WorldInstance = new GravityWorld(BootstrapInstance, Settings);
await WorldInstance.initialize();

const Resistance = new ResistanceForce(Settings.world.resistance)
BootstrapInstance.addConstraint(new InsetConstraint(WorldInstance.worldRect))
BootstrapInstance.addForce(Resistance);

BootstrapInstance.debug?.setViewMatrix(RenderInstance.canvasMatrix);
BootstrapInstance.enableHotKeys();
BootstrapInstance.run();

async function reconfigure(newSettings) {
    const diff = Settings.compare(newSettings);

    Settings = newSettings;
    updateUrl(Settings);

    Utils.updateUrl(Settings);

    if (diff.affects.has(GravityComponentType.physics)) {
        GravityInstance.reconfigure(Settings);
    }

    if (diff.affects.has(GravityComponentType.renderer)) {
        RenderInstance.reconfigure(Settings);
    }

    await WorldInstance.reconfigure(Settings, {
        affected: {
            sizing: diff.affects.has(GravityComponentType.particleSizing),
            look: diff.affects.has(GravityComponentType.particleLook)
        },
        broken: {
            world: diff.breaks.has(GravityComponentType.world),
            sprite: diff.breaks.has(GravityComponentType.particleLook),
            particles: diff.breaks.has(GravityComponentType.particleInitialization)
        }
    });

    BootstrapInstance.configure(Settings);
    BootstrapInstance.debug?.setViewMatrix(RenderInstance.canvasMatrix);
    Resistance.resistance = Settings.world.resistance;
}

// noinspection InfiniteLoopJS
while (true) {
    await BootstrapInstance.requestPhysicsFrame(GravityInstance.gravityStep.bind(GravityInstance));
}