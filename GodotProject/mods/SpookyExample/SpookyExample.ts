let mainPlayer: any = undefined;
let spawnedSoldiers: any[] = [];

let TickCooldown = 0.0;
let TickInterval = 4.0;
let SpawnTickCooldown = 0.0;
const SpawnInterval = 5.0;

let DeltaTime = 0.02;
const spectrumCycleDegreesPerSecond = 30;

const AISpawners = [
    { SpawnerObjId: 50, hasSpawned: false },
    { SpawnerObjId: 51, hasSpawned: false },
    { SpawnerObjId: 52, hasSpawned: false },
    { SpawnerObjId: 53, hasSpawned: false },
    { SpawnerObjId: 54, hasSpawned: false },
    { SpawnerObjId: 55, hasSpawned: false },
    { SpawnerObjId: 56, hasSpawned: false },
    { SpawnerObjId: 57, hasSpawned: false },
    { SpawnerObjId: 58, hasSpawned: false },
    { SpawnerObjId: 59, hasSpawned: false },
    { SpawnerObjId: 60, hasSpawned: false },
    { SpawnerObjId: 61, hasSpawned: false },
    { SpawnerObjId: 62, hasSpawned: false },
    { SpawnerObjId: 63, hasSpawned: false },
    { SpawnerObjId: 64, hasSpawned: false },
    { SpawnerObjId: 65, hasSpawned: false },
    { SpawnerObjId: 66, hasSpawned: false },
    { SpawnerObjId: 67, hasSpawned: false },
    { SpawnerObjId: 68, hasSpawned: false },
    { SpawnerObjId: 69, hasSpawned: false },
    { SpawnerObjId: 70, hasSpawned: false },
    { SpawnerObjId: 71, hasSpawned: false },
    { SpawnerObjId: 72, hasSpawned: false },
    { SpawnerObjId: 73, hasSpawned: false },
    { SpawnerObjId: 74, hasSpawned: false },
    { SpawnerObjId: 75, hasSpawned: false },
];

const DefaultHorrorEffects = [
    mod.ScreenEffects.FilmGrain,
    mod.ScreenEffects.UnitologyGlyphs,
    mod.ScreenEffects.ToneMap,
    mod.ScreenEffects.ColorCorrection,
];

let CoreAmbience: any = undefined;
let ChaseAmbience: any = undefined;
const SFXStingers = [
    mod.RuntimeSpawn_Common.SFX_Levels_Nevada_MP_Spooky_Spots_WhatCrawlsAbove_OneShot3D,
    mod.RuntimeSpawn_Common.SFX_Levels_Nevada_MP_Spooky_Spots_WhatCriesAfar_OneShot3D,
    mod.RuntimeSpawn_Common.SFX_Levels_Nevada_MP_Spooky_Spots_WhatLurksBehind_OneShot3D,
    mod.RuntimeSpawn_Common.SFX_Levels_Nevada_MP_Spooky_BigWorld_WhisperPad_OneShot3D,
    mod.RuntimeSpawn_Common.SFX_Levels_Nevada_MP_Spooky_BigWorld_Waterphone_OneShot3D,
    mod.RuntimeSpawn_Common.SFX_Levels_Nevada_MP_Spooky_BigWorld_VentMetalKnocks_OneShot3D,
    mod.RuntimeSpawn_Common.SFX_Levels_Nevada_MP_Spooky_BigWorld_Pipes_OneShot3D,
];

const SpawnedSFXs: any[] = [];

let FogWallVFX: any = undefined;

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function lerp(min: number, max: number, t: number): number {
    return min + (max - min) * t;
}

function getSpectrumColor(hueDegrees: number): [number, number, number] {
    const hue = ((hueDegrees % 360) + 360) % 360;
    const secondary = 1 - Math.abs((hue / 60) % 2 - 1);

    if (hue < 60) return [1, secondary, 0];
    if (hue < 120) return [secondary, 1, 0];
    if (hue < 180) return [0, 1, secondary];
    if (hue < 240) return [0, secondary, 1];
    if (hue < 300) return [secondary, 0, 1];
    return [1, 0, secondary];
}

export async function OnPlayerDeployed(player: mod.Player) {
    let players = mod.AllPlayers();
    let n = mod.CountOf(players);
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        console.log('LOG> Found a player: ', mod.GetObjId(player));

        mod.SetSoldierEffect(player, mod.SoldierEffects.HearWhispers, true);
        mod.SetSoldierEffect(player, mod.SoldierEffects.HearDroneLoop, true);

        mod.SetSoldierEffect(player, mod.SoldierEffects.HearFakeFootstepsAndGunshots, true);
        mod.SetSoldierEffect(player, mod.SoldierEffects.HearFakeMonsterNoises, true);
        mod.SetSoldierEffect(player, mod.SoldierEffects.HearFakeMonsterNoises2, true);

        mod.SetScreenEffectParameter(mod.ScreenEffectBoolParameters.Unitology_Animate, true);

        mod.SetScreenEffectParameter(mod.ScreenEffectBoolParameters.FilmGrain_EnableLinearFiltering, true);
        mod.SetScreenEffectParameter(mod.ScreenEffectBoolParameters.FilmGrain_Animate, true);
        mod.SetScreenEffectParameter(mod.ScreenEffectBoolParameters.FilmGrain_Luminance_Enable, true); // Needed to be able to make the screen turn to out-of-sync TV as we get closer to center.

        const fg_TextureScale = mod.CreateVector(0.8, 0.8, 0); // Small values = bigger, chunkier grains.
        mod.SetScreenEffectParameter(mod.ScreenEffectVectorParameters.FilmGrain_TextureScale, fg_TextureScale);
        const fg_ColorScale = mod.CreateVector(1, 1, 1); // We want the full range of the grain texture to affect the screen
        mod.SetScreenEffectParameter(mod.ScreenEffectVectorParameters.FilmGrain_ColorScale, fg_ColorScale);
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_CenterAttenuation, 0.9); // Makes the center of the screen a bit more visible
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_CenterScaleWidth, 3); // Increases the X scale of the texture used for center attenuation.
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_CenterScaleHeight, 3); // Increases the Y scale of the texture used for center attenuation.
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_Luminance_ShadowThreshold, 0.15); // For RGB values below (0.15, 0.15, 0.15), we apply very little film grain luminance.
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_Luminance_HighlightThreshold, 0.5); // From RGB values above (0.5, 0.5, 0.5), we apply the full effect of film grain luminance.
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_Luminance_ShadowIntensity, 0.0); // This makes film grain invisible by default
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_Luminance_HighlightIntensity, 0.0); // This makes film grain invisible by default

        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.ToneMap_Exposure_DarkAdaptationTime, 0); // Eliminates the time needed for the character to be able to see underground at the start of the mode.
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.ToneMap_Exposure_Value, 10.0); // Lower this number = brighter baseline. Higher number = darker.
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.ToneMap_Exposure_Compensation, 1.4); // Higher number = brighter highlights. Lower number = darker highlights.

        //Adds a surreal blue-ish glow to our purple lights, while retaining the necromorph glowing red eyes.
        mod.SetScreenEffectParameter(mod.ScreenEffectVectorParameters.ToneMap_Bloom_Scale, mod.CreateVector(0.41, 0.064, 1.0));
        mod.SetScreenEffectParameter(mod.ScreenEffectVectorParameters.ToneMap_LensEffects_LensDirtBias, mod.CreateVector(1.0, 0.198, 0.817));
        mod.SetScreenEffectParameter(mod.ScreenEffectVectorParameters.ToneMap_LensEffects_LensDirtFactor, mod.CreateVector(1.0, 1.0, 1.0));
        mod.SetScreenEffectParameter(mod.ScreenEffectVectorParameters.ToneMap_LensEffects_LensDirtExponent, mod.CreateVector(0.042, 0.04, 1.0));
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.ToneMap_LensEffects_LensDirtBloomGainMin, 0.253);
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.ToneMap_LensEffects_LensDirtBloomGainMax, 1);

        mod.RemoveEquipment(player, mod.InventorySlots.PrimaryWeapon);
        mod.RemoveEquipment(player, mod.InventorySlots.SecondaryWeapon);
        mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne);
        mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo);
        mod.RemoveEquipment(player, mod.InventorySlots.Throwable);
        mod.AddEquipment(player, mod.Weapons.Shotgun_M1014, mod.InventorySlots.PrimaryWeapon);

        mainPlayer = player;

        for (let i = 0; i < DefaultHorrorEffects.length; i++) {
            mod.EnableScreenEffect(mainPlayer, DefaultHorrorEffects[i], true);
        }

        const cc_Saturation = 1.0;

        let cc_Offset = mod.CreateVector(1.0, 1.0, 1.0);
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.ColorCorrection_Saturation, cc_Saturation);      
        mod.SetScreenEffectParameter(mod.ScreenEffectVectorParameters.ColorCorrection_Offset, cc_Offset);        

        //Trigger VFXs
        FogWallVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, mod.CreateVector(550, 105, -274), mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
        mod.EnableVFX(mod.GetVFX(FogWallVFX), true);

        //Trigger SFXs
        CoreAmbience = mod.SpawnObject(
            mod.RuntimeSpawn_Common.SFX_Gamemodes_Spooky_Shrine_Armed_SimpleLoop3D,
            mod.CreateVector(682, 106, -417),
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(1, 1, 1)
        );
        mod.PlaySound(CoreAmbience, 3.0, mainPlayer);

        ChaseAmbience = mod.SpawnObject(
            mod.RuntimeSpawn_Common.SFX_Gamemodes_Spooky_Shrine_Idle_SimpleLoop3D,
            mod.CreateVector(536, 105, -264),
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(1, 1, 1)
        );
        mod.PlaySound(ChaseAmbience, 1.0, mainPlayer);

        for (let i = 0; i < SFXStingers.length; i++) {
            const NewSFX = mod.SpawnObject(SFXStingers[i], mod.CreateVector(1, 1, 1), mod.CreateVector(1, 1, 1), mod.CreateVector(1, 1, 1));
            SpawnedSFXs.push(NewSFX);
        }

    }
    else
    {
        spawnedSoldiers.push(player);
        mod.SetSoldierEffect(player, mod.SoldierEffects.ShadowSilhouette, true);
        mod.SetSoldierEffect(player, mod.SoldierEffects.NecromorphEffects, true);
        mod.AIDefendPositionBehavior(player, mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition), 2, 10);

        mod.RemoveEquipment(player, mod.InventorySlots.PrimaryWeapon);
        mod.RemoveEquipment(player, mod.InventorySlots.SecondaryWeapon);
        mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne);
        mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo);
        mod.RemoveEquipment(player, mod.InventorySlots.Throwable);

        // Forcing AI to walk speed
        mod.AISetMoveSpeed(player, mod.MoveSpeed.Walk);
        // And possibly further reducing it so they are Inenvitable Doom rather than murder machines.
        mod.SetPlayerMovementSpeedMultiplier(player, 0.5);

        while (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
            if (mainPlayer && mod.GetSoldierState(mainPlayer, mod.SoldierStateBool.IsAlive)) {
                const playerPos = mod.GetSoldierState(mainPlayer, mod.SoldierStateVector.GetPosition);
                const aiPOS = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
                const distanceToPlayer = mod.DistanceBetween(playerPos, aiPOS);

                const playerFacing = mod.GetSoldierState(mainPlayer, mod.SoldierStateVector.GetFacingDirection);

                const distanceFromBack = 1.5;
                const locationBehindPlayer = mod.CreateVector(
                    mod.XComponentOf(playerPos) - mod.XComponentOf(playerFacing) * distanceFromBack,
                    mod.YComponentOf(playerPos) - mod.YComponentOf(playerFacing) * distanceFromBack,
                    mod.ZComponentOf(playerPos) - mod.ZComponentOf(playerFacing) * distanceFromBack
                );

                if (distanceToPlayer < 8) {
                    // When you're close enough, go for the kill.
                    mod.AIValidatedMoveToBehavior(player, locationBehindPlayer);
                } else if (distanceToPlayer < 16) {
                    // Let's make them move to watch you spookily when they're still sorta far.
                    mod.AILOSMoveToBehavior(player, locationBehindPlayer);
                } else {
                    // Otherwise, we const them loiter around their current position.
                    mod.AIDefendPositionBehavior(player, aiPOS, 2, 10);
                }
            }

            // Every ~3.5 seconds, we issue a new order.
            await mod.Wait(GetRandom(2, 5));
        }
    }
}

function GetRandom(min: number, max: number) {
    const floatRandom = Math.random();
    const difference = max - min;
    const randomDifference = floatRandom * difference;
    const randomRange = randomDifference + min;
    return randomRange;
}

export function OnPlayerDied(eventPlayer: mod.Player, otherPlayer: mod.Player) {
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier) == false) {
        return;
    }

    spawnedSoldiers = spawnedSoldiers.filter((ai) => !mod.Equals(ai, eventPlayer));

    console.log('Remaining spawned soldiers: ', spawnedSoldiers.length);
}

export function OngoingGlobal() {
    SpawnTickCooldown += DeltaTime;

    if (SpawnTickCooldown >= SpawnInterval) {
        const soldierClass = mod.SoldierClass.Assault;
        const soldierVariation = mod.AIVariation.Random;
        const soldierNames = mod.Message('markedSoldier');

        for (let i = 0; i < AISpawners.length; i++) {
            if (AISpawners[i].hasSpawned == false) {
                mod.SpawnAIFromAISpawner(mod.GetSpawner(AISpawners[i].SpawnerObjId), soldierClass, soldierVariation, soldierNames);
                AISpawners[i].hasSpawned = true;
                console.log('Spawned AI from spawner: ', AISpawners[i].SpawnerObjId);
            }
        }

        SpawnTickCooldown = 0;
    }
}

export function UpdateParametersBasedOnProximity() {
    // Produces a value from 1 to 0, based on the player's proximity to the center position. 1.0 when at the center, 0.0 when at >=225 meters.
    const dist = mod.DistanceBetween(mod.GetSoldierState(mainPlayer, mod.SoldierStateVector.GetPosition), mod.CreateVector(687, 107, -421));

    const maxDistance = 225;

    const proximity = clamp(1 - dist / maxDistance, 0, 1);

    return proximity;
}

export async function OnGameModeStarted() {
    console.log('Running Mod Script Dated: 2026-04-16 17:54:46.156379');

    const soldierClass = mod.SoldierClass.Assault;
    const soldierVariation = mod.AIVariation.Random;
    const soldierNames = mod.Message('markedSoldier');

    //Spawn AIs
    for (let i = 0; i < AISpawners.length; i++) {
        mod.SpawnAIFromAISpawner(mod.GetSpawner(AISpawners[i].SpawnerObjId), soldierClass, soldierVariation, soldierNames);
        AISpawners[i].hasSpawned = true;
    }

    let t = 0.0; //Time at start
    const dT = 0.033; //Time between ticks / deltaTime

    while (true) {
        t += dT;

        if (mainPlayer) {
            const PlayerPosition = mod.GetSoldierState(mainPlayer, mod.SoldierStateVector.GetPosition);
            const SFXPosition = mod.GetObjectPosition(ChaseAmbience);
            const NewSFXPosition = mod.Subtract(PlayerPosition, SFXPosition);

            mod.MoveObject(ChaseAmbience, NewSFXPosition);         

            const proximity = UpdateParametersBasedOnProximity();

            const ccSaturation = 1 - proximity ** 0.8;
            mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.ColorCorrection_Saturation, ccSaturation); // Turn down saturation as proximity increases, so the amount of screen grain also turns
            // the screen black and white.
            if (proximity < 0.7) {
                // Close to the marker, we fire up the film grain effect
                mod.EnableScreenEffect(mainPlayer, mod.ScreenEffects.FilmGrain, true);
                mod.EnableScreenEffect(mainPlayer, mod.ScreenEffects.UnitologyGlyphs, false);
                const exponentialPromixityEffect = ((0.7 - proximity) * 1.4) ** 2; // This makes it so the effect ramps up aggressively near the marker, but remains subtle when farther away.
                mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_Luminance_ShadowIntensity, exponentialPromixityEffect * 5); // Shadow/dark areas (i.e. soldiers) remain mostly free of film grain
                mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_Luminance_HighlightIntensity, exponentialPromixityEffect * 100); // But as you get closer to the center, the rest of the screen becomes riddled by it.
            } else {
                mod.EnableScreenEffect(mainPlayer, mod.ScreenEffects.FilmGrain, false);
                mod.EnableScreenEffect(mainPlayer, mod.ScreenEffects.UnitologyGlyphs, true);

                const unitologyStart = 0.7;

                // 0 at start of Unitology range, 1 when fully at target
                let unitologyProgress = (proximity - unitologyStart) / (1.0 - unitologyStart);
                unitologyProgress = clamp(unitologyProgress, 0, 1);

                // Slow ramp at first, strong ramp only very close
                const easedProgress = unitologyProgress ** 3;

                const un_ca_Amount = 1.0 - easedProgress;
                const un_ca_Scale = 3.0 - 2.4 * easedProgress;

                mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.Unitology_CenterAttenuation, un_ca_Amount);
                mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.Unitology_CenterScaleWidth, un_ca_Scale);
                mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.Unitology_CenterScaleHeight, un_ca_Scale);
            }

            const un_ca_Amount = lerp(1.0, 0.6, proximity);

            const [red, green, blue] = getSpectrumColor(t * spectrumCycleDegreesPerSecond);
            const colorCorrectionTint = mod.CreateVector(
                0.55 + red * 0.45,
                0.55 + green * 0.45,
                0.55 + blue * 0.45
            );
            mod.SetScreenEffectParameter(mod.ScreenEffectVectorParameters.ColorCorrection_Shadows, colorCorrectionTint);
            mod.SetScreenEffectParameter(mod.ScreenEffectVectorParameters.ColorCorrection_Mids, colorCorrectionTint);
            mod.SetScreenEffectParameter(mod.ScreenEffectVectorParameters.ColorCorrection_Highs, colorCorrectionTint);

            TickCooldown += dT;
            if (TickCooldown >= TickInterval) {
                const SpookySFX = mod.SpawnObject(
                    mod.RuntimeSpawn_Common.SFX_Destruction_Buildings_SolarArray_Large_Distant_OneShot3D,
                    mod.GetSoldierState(mainPlayer, mod.SoldierStateVector.GetPosition),
                    mod.CreateVector(0, 0, 0),
                    mod.CreateVector(1, 1, 1)
                );
                mod.PlaySound(SpookySFX, 1.0, mainPlayer);

                const RandomSFX = SpawnedSFXs[Math.floor(Math.random() * SpawnedSFXs.length)];
                mod.MoveObject(RandomSFX, mod.GetSoldierState(mainPlayer, mod.SoldierStateVector.GetPosition));
                mod.PlaySound(RandomSFX, 2.0, mainPlayer);

                const finalTickInterval = lerp(4.0, 1.0, proximity);
                TickCooldown = 0;
                TickInterval = finalTickInterval;
            }
        }

        // This part is fun. It's a very small oscilliation, but it does make the film grain effect feel more organic.
        const fg_CenterAttenuation = mod.CosineFromDegrees(t * 177) * 0.05 + 0.9; // Range 0.85 to 0.5
        const fg_CenterScaleWidth = mod.CosineFromDegrees(t * 174) * 0.2 + 2.8; // Range 2.6 to 3.0
        const fg_CenterScaleHeight = mod.CosineFromDegrees(t * 171) * 0.2 + 2.8; // Range 2.6 to 3.0
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_CenterAttenuation, fg_CenterAttenuation);
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_CenterScaleWidth, fg_CenterScaleWidth);
        mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_CenterScaleHeight, fg_CenterScaleHeight);

        await mod.Wait(dT);
    }
}
