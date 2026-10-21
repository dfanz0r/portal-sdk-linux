////////////////////
///// SETUP
////////////////////

const waterLevelChangeRate: number = 0.01;
const waterWaveAmplitudeChangeRate: number = 0.25;
const waterBeaufortScaleChangeRate: number = 1;

const powerUpTimerDuration: number = 60.0;

var currentWaterLevelTarget: number = 70;
var isRaisingWater: Boolean = false;

var powerUpTimer: any;
var playerWithPowerUp: any = null;

export async function OnGameModeStarted() {
    //ICON SETUP
    const worldIcon1: mod.WorldIcon = mod.GetWorldIcon(41);
    const worldIcon2: mod.WorldIcon = mod.GetWorldIcon(42);
    const worldIcon3: mod.WorldIcon = mod.GetWorldIcon(43);
    const worldIcon4: mod.WorldIcon = mod.GetWorldIcon(44);
    const worldIcon5: mod.WorldIcon = mod.GetWorldIcon(45);
    const worldIcon6: mod.WorldIcon = mod.GetWorldIcon(46);
    const WorldIcon7 = mod.GetWorldIcon(47);
    const WorldIcon8 = mod.GetWorldIcon(48);
    const WorldIcon9 = mod.GetWorldIcon(49);
    mod.EnableWorldIconText(worldIcon1, true);
    mod.EnableWorldIconText(worldIcon2, true);
    mod.EnableWorldIconText(worldIcon3, true);
    mod.EnableWorldIconText(worldIcon4, true);
    mod.EnableWorldIconText(worldIcon5, true);
    mod.EnableWorldIconText(worldIcon6, true);
    mod.EnableWorldIconText(WorldIcon7, true);
    mod.EnableWorldIconText(WorldIcon8, true);
    mod.EnableWorldIconText(WorldIcon9, true);
    mod.SetWorldIconText(worldIcon1, mod.Message('BEAUFORTSCALERAISE', 0));
    mod.SetWorldIconText(worldIcon2, mod.Message('BEAUFORTSCALELOWER', 0));
    mod.SetWorldIconText(worldIcon3, mod.Message('RAISEAMPLITUDE', 0));
    mod.SetWorldIconText(worldIcon4, mod.Message('LOWERAMPLITUDE', 0));
    mod.SetWorldIconText(worldIcon5, mod.Message('POWERUP', 0));
    mod.SetWorldIconText(worldIcon6, mod.Message('TUTORIAL', 0));
    mod.SetWorldIconText(worldIcon6, mod.Message('BEAUFORTSCALETUTORIAL', 0));
    mod.SetWorldIconText(worldIcon6, mod.Message('WAVEAMPLITUDETUTORIAL', 0));
    mod.SetWorldIconText(worldIcon6, mod.Message('POWERUPTUTORIAL', 0));

    powerUpTimer = mod.GlobalVariable(1);
}

export async function OnPlayerDeployed(eventPlayer: mod.Player) {
    mod.AddEquipment(eventPlayer, mod.Gadgets.Misc_PortalGadget);

    //Sets the player's breath time to 0.0 so they can drown immediately
    mod.SetPlayerBreathTime(eventPlayer, 10.0);
}

export function OngoingGlobal() {
    const currentWaterLevel = mod.GetWaterHeight();

    //This is the logic that raises and lowers the water level based on the target value
    if (currentWaterLevel < currentWaterLevelTarget && isRaisingWater == true) {
        mod.SetWaterLevel(currentWaterLevel + waterLevelChangeRate);
    } else if (currentWaterLevel > currentWaterLevelTarget && isRaisingWater == false) {
        mod.SetWaterLevel(currentWaterLevel - waterLevelChangeRate);
    }

    //This is the logic that handles the powerup timer and breath time
    if (mod.GetVariable(powerUpTimer) > 0.0) {
        const message1 = mod.Message('BREATHINGPOWERUP', mod.GetVariable(powerUpTimer));
        mod.DisplayHighlightedWorldLogMessage(message1);

        if (mod.GetVariable(powerUpTimer) >= powerUpTimerDuration) {
            mod.SetPlayerBreathTime(playerWithPowerUp, 0.0);
            mod.StopChasingVariable(powerUpTimer);
            mod.SetVariable(powerUpTimer, 0.0);
            playerWithPowerUp = null;
        }
    }
}

export function OnPortalGadgetFireStart(player: mod.Player) {
    currentWaterLevelTarget += 7;
    isRaisingWater = true;
}

export async function OnPortalGadgetAimStart(player: mod.Player) {
    currentWaterLevelTarget -= 7;
    isRaisingWater = false;
}

export async function OnPlayerInteract(player: mod.Player, interactPoint: mod.InteractPoint) {
    //Raises and lowers the Beaufort scale, the value should be between 0 and 12, with 0 being calm and 12 being hurricane force winds
    if (mod.GetObjId(interactPoint) == 1) {
        var currentBeaufortScale = mod.GetWaterBeaufortScale();
        mod.SetWaterBeaufortScale(currentBeaufortScale + waterBeaufortScaleChangeRate);

        currentBeaufortScale = mod.GetWaterBeaufortScale();
        
        var Message = mod.Message("NEWVALUE",currentBeaufortScale)
        mod.DisplayHighlightedWorldLogMessage(Message);
    }
    if (mod.GetObjId(interactPoint) == 2) {
        var currentBeaufortScale = mod.GetWaterBeaufortScale();
        mod.SetWaterBeaufortScale(currentBeaufortScale - waterBeaufortScaleChangeRate);

        currentBeaufortScale = mod.GetWaterBeaufortScale();
        
        var Message = mod.Message("NEWVALUE",currentBeaufortScale)
        mod.DisplayHighlightedWorldLogMessage(Message);
    }

    //Raises and lowers the wave amplitude, the value should be between 0 and 1, with 0 being no waves and 1 being very high waves
    if (mod.GetObjId(interactPoint) == 3) {
        var currentWaveAmplitude = mod.GetWaterWaveAmplitude();
        mod.SetWaterWaveAmplitude(currentWaveAmplitude + waterWaveAmplitudeChangeRate);

        currentWaveAmplitude = mod.GetWaterWaveAmplitude();

        var Message = mod.Message("NEWVALUE",currentWaveAmplitude)
        mod.DisplayHighlightedWorldLogMessage(Message);
    }
    if (mod.GetObjId(interactPoint) == 4) {
        var currentWaveAmplitude: number = mod.GetWaterWaveAmplitude();
        mod.SetWaterWaveAmplitude(currentWaveAmplitude - waterWaveAmplitudeChangeRate);

        currentWaveAmplitude = mod.GetWaterWaveAmplitude();

        var Message = mod.Message("NEWVALUE",currentWaveAmplitude)
        mod.DisplayHighlightedWorldLogMessage(Message);
    }

    //Gives the player a powerup that allows them to breathe underwater for 60 seconds
    if (mod.GetObjId(interactPoint) == 5) {
        playerWithPowerUp = player;
        mod.SetPlayerBreathTime(player, 999.0);
        mod.SetVariable(powerUpTimer, 0.0);
        mod.ChaseVariableOverTime(powerUpTimer, powerUpTimerDuration, powerUpTimerDuration);
    }
}

export async function OnPlayerEmerged(eventPlayer: mod.Player) {
    console.log(eventPlayer + ' emerged ');
}

export async function OnPlayerSubmerged(eventPlayer: mod.Player) {
    console.log(eventPlayer + ' submerged ');
}

export async function OnPlayerEnteredWater(eventPlayer: mod.Player) {
    console.log(eventPlayer + ' entered water ');
}

export async function OnPlayerExitedWater(eventPlayer: mod.Player) {
    console.log(eventPlayer + ' left water ');
}
