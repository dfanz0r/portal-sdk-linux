let normalScaleVector: mod.Vector = mod.CreateVector(1, 1, 1);
let EurocopterVehicleSpawner: mod.VehicleSpawner;
let CheetahVehicleSpawner: mod.VehicleSpawner;
let F22VehicleSpawner: mod.VehicleSpawner;
let F16VehicleSpawner: mod.VehicleSpawner;
let F74ASeacatVehicleSpawner: mod.VehicleSpawner;
let UH60VehicleSpawner: mod.VehicleSpawner;
let AH6MVehicleSpawner: mod.VehicleSpawner;
let AH64VehicleSpawner: mod.VehicleSpawner;
let JAS39VehicleSpawner: mod.VehicleSpawner;
let SU57VehicleSpawner: mod.VehicleSpawner;

let Interactor_EnableClouds: mod.InteractPoint;
let Interactor_MoveClouds: mod.InteractPoint;
let Interactor_DynamicClouds: mod.InteractPoint;

let Interactor_BlockLocking: mod.InteractPoint;
let Interactor_BlockSpotting: mod.InteractPoint;
let Interactor_JamIncomingMissiles: mod.InteractPoint;
let Interactor_RemoveLaserPainting: mod.InteractPoint;
let Interactor_RemoveTracerDart: mod.InteractPoint;
let Interactor_IsCloudBlockingVolume: mod.InteractPoint;
let Interactor_SetRadius: mod.InteractPoint;

let cloudEnabled: boolean = true;
let cloudMoved: boolean = false;
let dynamicClouds: boolean = false;

let blockLocking: boolean = true;
let blockSpotting: boolean = true;
let jamIncomingMissiles: boolean = true;
let removeLaserPainting: boolean = false;
let removeTracerDart: boolean = false;
let isCloudBlockingVolume: boolean = true;
let normalRadius: boolean = true;

const enabledColor: mod.Vector = mod.CreateVector(0.0, 1.0, 0.0);
const disabledColor: mod.Vector = mod.CreateVector(1.0, 0.0, 0.0);

let prespawnedBlockingSpheres: mod.BlockingSphere[] = [];

let spawnedVFXArray: mod.VFX[] = [];
type SpawnedBlockingSphereData = {
    sphere: mod.BlockingSphere;
    radius: number;
};
let spawnedBlockingSphereDataArray: SpawnedBlockingSphereData[] = [];

export function OnGameModeStarted() {
    console.log("Running Mod Script Dated: 2026-04-16 17:54:46.156379");
    console.log("Running Mod Script Dated: 2025-02-27 13:28:44.889481");

    // Calling mod.GetObject only once and storing the result in a variable is more efficient than calling it multiple times.
    // It also makes for cleaner code than comparing ObjID to hardcoded values.
    EurocopterVehicleSpawner = mod.GetVehicleSpawner(1);
    CheetahVehicleSpawner = mod.GetVehicleSpawner(2);
    F22VehicleSpawner = mod.GetVehicleSpawner(3);
    F16VehicleSpawner = mod.GetVehicleSpawner(4);
    F74ASeacatVehicleSpawner = mod.GetVehicleSpawner(5);
    UH60VehicleSpawner = mod.GetVehicleSpawner(6);
    AH6MVehicleSpawner = mod.GetVehicleSpawner(7);
    AH64VehicleSpawner = mod.GetVehicleSpawner(8);
    JAS39VehicleSpawner = mod.GetVehicleSpawner(9);
    SU57VehicleSpawner = mod.GetVehicleSpawner(10);

    // Those buttons are the left side of the map, and control the cloud VFX and the dynamic cloud spawning.
    Interactor_EnableClouds = mod.GetInteractPoint(11);
    Interactor_MoveClouds = mod.GetInteractPoint(12);
    Interactor_DynamicClouds = mod.GetInteractPoint(13);

    // Those buttons are on the right side of the map and control the BlockingSphere parameters.
    Interactor_BlockLocking = mod.GetInteractPoint(21);
    Interactor_BlockSpotting = mod.GetInteractPoint(22);
    Interactor_JamIncomingMissiles = mod.GetInteractPoint(23);
    Interactor_RemoveLaserPainting = mod.GetInteractPoint(24);
    Interactor_RemoveTracerDart = mod.GetInteractPoint(25);
    Interactor_IsCloudBlockingVolume = mod.GetInteractPoint(26);
    Interactor_SetRadius = mod.GetInteractPoint(27);

    // Interact Points are enabled by default, but it never hurts to explicitly turn them as part of the OnGameModeStarted event.
    mod.EnableInteractPoint(Interactor_EnableClouds, true);
    mod.EnableInteractPoint(Interactor_MoveClouds, true);
    mod.EnableInteractPoint(Interactor_DynamicClouds, true);
    mod.EnableInteractPoint(Interactor_BlockLocking, true);
    mod.EnableInteractPoint(Interactor_BlockSpotting, true);
    mod.EnableInteractPoint(Interactor_JamIncomingMissiles, true);
    mod.EnableInteractPoint(Interactor_RemoveLaserPainting, true);
    mod.EnableInteractPoint(Interactor_RemoveTracerDart, true);
    mod.EnableInteractPoint(Interactor_IsCloudBlockingVolume, true);
    mod.EnableInteractPoint(Interactor_SetRadius, true);

    // Pre-spawn the BlockingSpheres that are placed in the spatial data file. 
    // This allows us to modify their parameters at runtime using simple For Each statements in the future rather than a series of 3 for loops.
    for (let i = 11; i <= 17; i++) {
        const sphere = mod.GetBlockingSphere(i);
        prespawnedBlockingSpheres.push(sphere);
    }
    for (let i = 21; i <= 22; i++) {
        const sphere = mod.GetBlockingSphere(i);
        prespawnedBlockingSpheres.push(sphere);
    }
    for (let i = 31; i <= 34; i++) {
        const sphere = mod.GetBlockingSphere(i);
        prespawnedBlockingSpheres.push(sphere);
    }

    // World Icons do not have their text or images set in the spatial data file so we set at runtime. 
    // This call handles both the initial setup and any updates to the World Icon text or color when the player interacts with the Interact Points.
    UpdateIcons();

    // The first wave of vehicles spawns when the game mode starts.
    SpawnVehicles();
}

export function OnPlayerDeployed(player: mod.Player) {
    let players = mod.AllPlayers();
    let n = mod.CountOf(players);
    console.log("LOG> OnPlayerDeployed: player: ", mod.GetObjId(player), " Count of Players: ", n);
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        console.log("LOG> Found a player: ", mod.GetObjId(player));

        // Grant Recon Drone to the player. Could be useful to watch things from different angles.
        mod.AddEquipment(player, mod.Gadgets.Deployable_Recon_Drone, mod.InventorySlots.GadgetOne);

        // Grant the Portal Gadget to the player. Allows spawning a new batch of vehicles or toggle the Night ScreenEffect.
        mod.AddEquipment(player, mod.Gadgets.Misc_PortalGadget, mod.InventorySlots.GadgetTwo);

        SetCloudVFX(cloudEnabled);
    }
}

export function OnPortalGadgetFireStop(player: mod.Player) {
    // Primary weapon fire on the Portal Gadget respawns all vehicles.
    SpawnVehicles();
}

export function OnPortalGadgetAimStart(player: mod.Player) {
    // Going in ADS mode on the Portal Gadget enables the Night ScreenEffect.
    mod.EnableScreenEffect(player, mod.ScreenEffects.Night, true);
}

export function OnPortalGadgetLaserToggle(player: mod.Player) {
    // Toggling the Laser Pointer on the Portal Gadget disables the Night ScreenEffect.
    mod.EnableScreenEffect(player, mod.ScreenEffects.Night, false);
}

export function OnPlayerInteract(player: mod.Player, interactPoint: mod.InteractPoint) {
    if (mod.Equals(interactPoint, Interactor_EnableClouds)) {
        cloudEnabled = !cloudEnabled;
        SetCloudVFX(cloudEnabled);
    }

    if (mod.Equals(interactPoint, Interactor_MoveClouds)) {
        cloudMoved = !cloudMoved;
        MoveClouds(cloudMoved);
    }

    if (mod.Equals(interactPoint, Interactor_DynamicClouds)) {
        dynamicClouds = !dynamicClouds;
        SpawnDespawnClouds(dynamicClouds);
    }

    if (mod.Equals(interactPoint, Interactor_SetRadius)) {
        normalRadius = !normalRadius;
        SetBlockingSphereRadius(normalRadius);
    }

    if (mod.Equals(interactPoint, Interactor_BlockLocking)) {
        blockLocking = !blockLocking;
        SetBlockingBoolParam(mod.BlockingSphereBoolParam.BlockLocking, blockLocking);
    }

    if (mod.Equals(interactPoint, Interactor_BlockSpotting)) {
        blockSpotting = !blockSpotting;
        SetBlockingBoolParam(mod.BlockingSphereBoolParam.BlockSpotting, blockSpotting);
    }

    if (mod.Equals(interactPoint, Interactor_JamIncomingMissiles)) {
        jamIncomingMissiles = !jamIncomingMissiles;
        SetBlockingBoolParam(mod.BlockingSphereBoolParam.JamIncomingMissiles, jamIncomingMissiles);
    }

    if (mod.Equals(interactPoint, Interactor_RemoveLaserPainting)) {
        removeLaserPainting = !removeLaserPainting;
        SetBlockingBoolParam(mod.BlockingSphereBoolParam.RemoveLaserPainting, removeLaserPainting);
    }

    if (mod.Equals(interactPoint, Interactor_RemoveTracerDart)) {
        removeTracerDart = !removeTracerDart;
        SetBlockingBoolParam(mod.BlockingSphereBoolParam.RemoveTracerDart, removeTracerDart);
    }

    if (mod.Equals(interactPoint, Interactor_IsCloudBlockingVolume)) {
        isCloudBlockingVolume = !isCloudBlockingVolume;
        SetBlockingBoolParam(mod.BlockingSphereBoolParam.IsCloudBlockingVolume, isCloudBlockingVolume);
    }

    UpdateIcons();
}

function SetCloudVFX(showVFX: boolean) {
    // Make the spatial file VFX visible.
    for (let i = 1; i <= 6; i++) {
        mod.EnableVFX(mod.GetVFX(i), showVFX);
    }

    // Make the spawned VFX visible.
    for (const vfx of spawnedVFXArray) {
        mod.EnableVFX(vfx, showVFX);
    }
}

async function MoveClouds(move: boolean) {
    // VFX aren't intended to move after activating, as they are usually one-off and activate on demand.
    // Clouds are particular because they run permanently. 
    // Moving them requires turning them off and back on again, otherwise they will be stuck in their original position.

    for (let i = 1; i <= 6; i++) {
        mod.EnableVFX(mod.GetVFX(i), false);
    }
    for (const vfx of spawnedVFXArray) {
        mod.EnableVFX(vfx, false);
    }

    await mod.Wait(0.1); // Wait for the VFX to turn off before moving them, otherwise they will be stuck in their original position.

    // VFX can only be moved via the MoveVFX function. Despite the name, it sets the VFX to new coordinates rather than being delta movement.
    // GetObjectPosition doesn't update on MoveVFX so it will always return the spawn coordinate.
    for (let i = 1; i <= 6; i++) {
        let initialPos = mod.GetObjectPosition(mod.GetVFX(i));
        let initialRot = mod.GetObjectRotation(mod.GetVFX(i));
        let newPos = mod.Add(initialPos, mod.CreateVector(0, 0, move ? 900 : 0));
        mod.MoveVFX(mod.GetVFX(i), newPos, initialRot);
    }
    for (const vfx of spawnedVFXArray) {
        let initialPos = mod.GetObjectPosition(vfx);
        let initialRot = mod.GetObjectRotation(vfx);
        let newPos = mod.Add(initialPos, mod.CreateVector(0, 0, move ? 900 : 0));
        mod.MoveVFX(vfx, newPos, initialRot);
    }

    // For the blockingsphere, we can use the MoveObject function which moves objects via a relative vector.
    for (const sphere of prespawnedBlockingSpheres) {
        mod.MoveObject(sphere, mod.CreateVector(0, 0, 900 * (move ? 1 : -1)));
    }
    for (const sphereData of spawnedBlockingSphereDataArray) {
        mod.MoveObject(sphereData.sphere, mod.CreateVector(0, 0, 900 * (move ? 1 : -1)));
    }

    await mod.Wait(0.1); // Wait for the VFX to move

    // Then restore the visibility state of the VFX to what it was before moving them.
    for (let i = 1; i <= 6; i++) {
        mod.EnableVFX(mod.GetVFX(i), cloudEnabled);
    }
    for (const vfx of spawnedVFXArray) {
        mod.EnableVFX(vfx, cloudEnabled);
    }
}

function SpawnDespawnClouds(spawn: boolean) {
    if (spawn) {
        SpawnStormCloud(-900, 503.596, 0 + (cloudMoved ? 900 : 0), -17.6);
        SpawnToweringCloud(-900, 503.596, 900 + (cloudMoved ? 900 : 0), -89);
        SpawnCloudCluster(-900, 503.596, -971.735 + (cloudMoved ? 900 : 0), 63.2);
        SpawnFractusClouds(900, 303.596, 0 + (cloudMoved ? 900 : 0), 0);
        SpawnMediumFractusClouds(900, 303.596, -900 + (cloudMoved ? 900 : 0), 0);

        // Automatically set the new clouds to the same visibility state as the original clouds.
        for (const vfx of spawnedVFXArray) {
            mod.EnableVFX(vfx, cloudEnabled);
        }
    }
    else {
        for (const vfx of spawnedVFXArray) {
            mod.UnspawnObject(vfx);
        }
        for (const sphereData of spawnedBlockingSphereDataArray) {
            mod.UnspawnObject(sphereData.sphere);
        }
        spawnedVFXArray = [];
        spawnedBlockingSphereDataArray = [];
    }
}

function SetBlockingSphereRadius(normalRadius: boolean) {
    // Alter the radius of all pre-placed BlockingSpheres. Since we don't know their original radius, we can only scale them relative to their current size.
    const newRelativeRadiusMultiplier = normalRadius ? 2 : 0.5;
    for (const sphere of prespawnedBlockingSpheres) {
        mod.SetBlockingSphereRadius(sphere, mod.GetBlockingSphereRadius(sphere) * newRelativeRadiusMultiplier);
    }

    // For dynamically spawned BlockingSpheres, we can use the stored radius values to restore them to their original size.
    const newRadiusMultiplier = normalRadius ? 1 : 0.5;
    for (const sphereData of spawnedBlockingSphereDataArray) {
        mod.SetBlockingSphereRadius(sphereData.sphere, sphereData.radius * newRadiusMultiplier);
    }
}

function SetBlockingBoolParam(param: mod.BlockingSphereBoolParam, newValue: boolean) {
    for (const sphere of prespawnedBlockingSpheres) {
        mod.SetBlockingSphereBoolParam(sphere, param, newValue);
    }

    for (const sphereData of spawnedBlockingSphereDataArray) {
        mod.SetBlockingSphereBoolParam(sphereData.sphere, param, newValue);
    }
}

function UpdateIcons(): void {
    const cloudVFXIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_EnableClouds));
    DefaultIconActions(cloudVFXIcon, cloudEnabled, (cloudEnabled ? "Disable Cloud VFX" : "Enable Cloud VFX"), mod.WorldIconImages.Explosion);

    const moveCloudIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_MoveClouds));
    DefaultIconActions(moveCloudIcon, cloudMoved, (cloudMoved ? "Return Cloud VFX" : "Move Cloud VFX"), mod.WorldIconImages.SquadPing);

    const dynamicCloudIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_DynamicClouds));
    DefaultIconActions(dynamicCloudIcon, dynamicClouds, (dynamicClouds ? "Despawn Dynamic Clouds" : "Spawn Dynamic Clouds"), mod.WorldIconImages.Eye);

    const blockLockingIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_BlockLocking));
    DefaultIconActions(blockLockingIcon, blockLocking, (blockLocking ? "Remove BlockLocking" : "Enable BlockLocking"), mod.WorldIconImages.DangerPing);

    const blockSpottingIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_BlockSpotting));
    DefaultIconActions(blockSpottingIcon, blockSpotting, (blockSpotting ? "Remove BlockSpotting" : "Enable BlockSpotting"), mod.WorldIconImages.Cross);

    const blockIncomingMissilesIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_JamIncomingMissiles));
    DefaultIconActions(blockIncomingMissilesIcon, jamIncomingMissiles, (jamIncomingMissiles ? "Disable JamIncomingMissiles" : "Enable JamIncomingMissiles"), mod.WorldIconImages.BombArmed);

    const removeLaserPaintingIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_RemoveLaserPainting));
    DefaultIconActions(removeLaserPaintingIcon, removeLaserPainting, (removeLaserPainting ? "Disable RemoveLaserPainting" : "Enable RemoveLaserPainting"), mod.WorldIconImages.Triangle);

    const removeTracerDartIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_RemoveTracerDart));
    DefaultIconActions(removeTracerDartIcon, removeTracerDart, (removeTracerDart ? "Disable RemoveTracerDart" : "Enable RemoveTracerDart"), mod.WorldIconImages.Diffuse);

    const isCloudBlockingVolumeIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_IsCloudBlockingVolume));
    DefaultIconActions(isCloudBlockingVolumeIcon, isCloudBlockingVolume, (isCloudBlockingVolume ? "Disable IsCloudBlockingVolume" : "Enable IsCloudBlockingVolume"), mod.WorldIconImages.FilledPing);

    const setRadiusIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_SetRadius));
    DefaultIconActions(setRadiusIcon, normalRadius, (normalRadius ? "Shrink Radius" : "Restore Radius"), mod.WorldIconImages.EMP);
}

function DefaultIconActions(worldIcon: mod.WorldIcon, enabled: boolean, text: string, image: mod.WorldIconImages) {
    mod.SetWorldIconColor(worldIcon, enabled ? enabledColor : disabledColor);
    mod.SetWorldIconText(worldIcon, mod.Message(text));
    mod.EnableWorldIconText(worldIcon, true);
    mod.SetWorldIconImage(worldIcon, image);
    mod.EnableWorldIconImage(worldIcon, true);
}

function SpawnVehicles() {
    // This function calls the ForceVehicleSpawnerSpawn function for each vehicle spawner to spawn the vehicles in the game world.
    console.log("LOG> Spawning vehicles");

    mod.ForceVehicleSpawnerSpawn(EurocopterVehicleSpawner);
    mod.ForceVehicleSpawnerSpawn(CheetahVehicleSpawner);
    mod.ForceVehicleSpawnerSpawn(F22VehicleSpawner);
    mod.ForceVehicleSpawnerSpawn(F16VehicleSpawner);
    mod.ForceVehicleSpawnerSpawn(F74ASeacatVehicleSpawner);
    mod.ForceVehicleSpawnerSpawn(UH60VehicleSpawner);
    mod.ForceVehicleSpawnerSpawn(AH6MVehicleSpawner);
    mod.ForceVehicleSpawnerSpawn(AH64VehicleSpawner);
    mod.ForceVehicleSpawnerSpawn(JAS39VehicleSpawner);
    mod.ForceVehicleSpawnerSpawn(SU57VehicleSpawner);
}

function SpawnCloudCluster(x: number, y: number, z: number, r: number) {
    // Regular cloud clusters are large, white clouds. Those are intended to have blockingspheres.
    const cloudPos = mod.CreateVector(x, y, z);

    let newCloud = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Cloud_Cluster, cloudPos, mod.CreateVector(0, r, 0), normalScaleVector);
    spawnedVFXArray.push(newCloud);

    const localOffsets = [
        mod.CreateVector(-140.004196, -135.76431, -317.7465),
        mod.CreateVector(-38.176197, -67.62114, -119.62775),
        mod.CreateVector(60.72417, 13.936756, 136.90596),
        mod.CreateVector(180.79546, 33.77097, 335.0)
    ];

    const cloudRadius = [
        220,
        235,
        200,
        190
    ];

    SpawnBlockingSpheres(cloudPos, localOffsets, cloudRadius, r);
}

function SpawnStormCloud(x: number, y: number, z: number, r: number) {
    // Storm clouds are large, dark clouds. Those are intended to have blockingspheres.
    const cloudPos = mod.CreateVector(x, y, z);

    let newCloud = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Cloud_Cluster_Storm, cloudPos, mod.CreateVector(0, r, 0), normalScaleVector);
    spawnedVFXArray.push(newCloud);

    const localOffsets = [
        mod.CreateVector(-41.82876, -53.657864, -173.11038),
        mod.CreateVector(-198.99594, -53.657864, -100.299),
        mod.CreateVector(185.8363, -54.87007, -92.589905),
        mod.CreateVector(19.857292, -38.050877, 7.024159),
        mod.CreateVector(75.96141, 8.908564, 193.37967),
        mod.CreateVector(-177.64662, -23.31981, 106.577545),
        mod.CreateVector(-231.78645, -70.7518, -221.88759),
    ];

    const cloudRadius = [
        160,
        160,
        140,
        180,
        100,
        100,
        120
    ];

    SpawnBlockingSpheres(cloudPos, localOffsets, cloudRadius, r);

}

function SpawnToweringCloud(x: number, y: number, z: number, r: number) {
    // Towering cloud clusters are immense, white clouds. Those are intended to have blockingspheres.
    const cloudPos = mod.CreateVector(x, y, z);

    let newCloud = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Cloud_Cluster_Towering, cloudPos, mod.CreateVector(0, r, 0), normalScaleVector);
    spawnedVFXArray.push(newCloud);

    const localOffsets = [
        mod.CreateVector(-61.32762, 12.5663805, 225.67404),
        mod.CreateVector(-88.719635, 24.80692, -269.45358)
    ];

    const cloudRadius = [
        290,
        290
    ];

    SpawnBlockingSpheres(cloudPos, localOffsets, cloudRadius, r);
}

function SpawnBlockingSpheres(cloudPos: mod.Vector, localOffsets: mod.Vector[], cloudRadius: number[], r: number) {
    // This function spawns an array of BlockingSpheres around a cloud position. The localOffsets array contains the 
    // offsets of the BlockingSpheres relative to the cloud VFX, and the cloudRadius array contains the radius of each BlockingSphere.
    for (let i = 0; i < localOffsets.length; i++) {
        const offset = localOffsets[i];
        const radius = cloudRadius[i];
        const rotated = RotateY(offset, r);

        const worldPos = mod.CreateVector(
            mod.XComponentOf(cloudPos) + mod.XComponentOf(rotated),
            mod.YComponentOf(cloudPos) + mod.YComponentOf(rotated),
            mod.ZComponentOf(cloudPos) + mod.ZComponentOf(rotated)
        );

        const blockingSphere = mod.SpawnObject(
            mod.RuntimeSpawn_Common.BlockingSphere,
            worldPos,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(1, 1, 1)
        );

        // Store the spawned BlockingSphere and its radius in the spawnedBlockingSphereDataArray for future reference.
        const sphereData: SpawnedBlockingSphereData = {
            sphere: blockingSphere,
            radius: radius
        };
        spawnedBlockingSphereDataArray.push(sphereData);

        mod.SetBlockingSphereBoolParam(blockingSphere, mod.BlockingSphereBoolParam.BlockSpotting, blockSpotting);
        mod.SetBlockingSphereBoolParam(blockingSphere, mod.BlockingSphereBoolParam.BlockLocking, blockLocking);
        mod.SetBlockingSphereBoolParam(blockingSphere, mod.BlockingSphereBoolParam.JamIncomingMissiles, jamIncomingMissiles);
        mod.SetBlockingSphereBoolParam(blockingSphere, mod.BlockingSphereBoolParam.RemoveLaserPainting, removeLaserPainting);
        mod.SetBlockingSphereBoolParam(blockingSphere, mod.BlockingSphereBoolParam.RemoveTracerDart, removeTracerDart);
        mod.SetBlockingSphereBoolParam(blockingSphere, mod.BlockingSphereBoolParam.IsCloudBlockingVolume, isCloudBlockingVolume);
        mod.SetBlockingSphereRadius(blockingSphere, radius * (normalRadius ? 1 : 0.5));
    }
}

function RotateY(vec: mod.Vector, degrees: number) {
    // This function rotates a vector around the Y-axis by a given angle in degrees. 
    // It uses the cosine and sine functions to calculate the new X and Z components of the vector after rotation.
    const c = mod.CosineFromDegrees(degrees);
    const s = mod.SineFromDegrees(degrees);

    return mod.CreateVector(
        mod.XComponentOf(vec) * c + mod.ZComponentOf(vec) * s,
        mod.YComponentOf(vec),
        mod.XComponentOf(vec) * -s + mod.ZComponentOf(vec) * c
    );
}

function SpawnFractusClouds(x: number, y: number, z: number, r: number) {
    // Fractus clouds are tiny clouds that are intended to be used to touch up the skyline and fill in gaps between larger clouds.
    // They are not intended to be used together with BlockingSphere objects.
    const cloudPos = mod.CreateVector(x, y, z);

    let newCloud = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Cloud_Fractus_Small, cloudPos, mod.CreateVector(0, r, 0), normalScaleVector);
    spawnedVFXArray.push(newCloud);
}
function SpawnMediumFractusClouds(x: number, y: number, z: number, r: number) {
    // Fractus clouds are tiny clouds that are intended to be used to touch up the skyline and fill in gaps between larger clouds.
    // They are not intended to be used together with BlockingSphere objects.
    const cloudPos = mod.CreateVector(x, y, z);

    let newCloud = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Cloud_Fractus_Medium, cloudPos, mod.CreateVector(0, r, 0), normalScaleVector);
    spawnedVFXArray.push(newCloud);
}

function SpawnDistantClouds(x: number, y: number, z: number, r: number) {
    // DistantBank clouds are not intended to be used with BlockingSphere objects or be approachable by players.
    // Their spawn coordinate, however, should be near the center of the map, as they have VFX emitters encircling it.
    const cloudPos = mod.CreateVector(x, y, z);

    let newCloud = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Cloud_DistantBank, cloudPos, mod.CreateVector(0, r, 0), normalScaleVector);
    spawnedVFXArray.push(newCloud);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// NOTE: The following function is not used in the current implementation, but it serves as a demonstration of how to spawn a similar skyline as the Gauntlet Jets Only mode.
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function SpawnAllClouds() {
    // Coordinates currently assume (0, 30, 0) is the center of the map. If using a different map than MP_Portal_Sand, the coordinates will need to be adjusted accordingly.
    SpawnStormCloud(1093.55472, 736.901, -860.37946, -17.6235);
    SpawnStormCloud(-608.5253, 579.1054, -949.8187, 68.1209);
    SpawnStormCloud(413.00955, 727.6329, 898.4677, 55.0006);

    SpawnCloudCluster(370.5187, 571.15094, -1486.8931, 258.12);
    SpawnCloudCluster(-907.4736, 491.90372, 209.96152, 20.3456);
    SpawnCloudCluster(1246.4688, 580.53284, -19.61392, 193.6019);
    SpawnCloudCluster(57.01495, 707.4675, -193.42231, 16.8879);
    SpawnCloudCluster(-554.1606, 912.3606, 1332.2517, 32.9935);
    SpawnCloudCluster(-91.17395, 1194.3634, 217.5398, 7.9426);

    SpawnToweringCloud(0, 571.15094, 0, 0);

    SpawnDistantClouds(0, 900, 0, 0);

    SpawnFractusClouds(-87.2973, 1056.375, -1701.1432, 37.8851);
    SpawnFractusClouds(-718.3164, 829.8501, 522.04816, 37.8851);
    SpawnFractusClouds(-407.9252, 901.9562, -622.13208, 37.8851);
    SpawnFractusClouds(-520.1293, 688.13745, 339.53094, 37.8851);
    SpawnFractusClouds(273.8217, 1020.91284, -325.400223, 37.8851);
    SpawnFractusClouds(-225.5261, 795.9448, 202.25275, 37.8851);

    SpawnMediumFractusClouds(-274.2607, 885.94995, 548.6028, 37.8851);
    SpawnMediumFractusClouds(41.30237, 765.8365, -155.62733, 37.8851);
    SpawnMediumFractusClouds(-950.5044, 820.38855, 107.36005, 37.8851);
    SpawnMediumFractusClouds(784.42571, 352.67105, -213.68118, 37.8851);
    SpawnMediumFractusClouds(-683.1517, 423.94077, 367.53217, 37.8851);
    SpawnMediumFractusClouds(1082.88489, 769.9115, 309.65594, 37.8851);
    SpawnMediumFractusClouds(5.9523, 1056.375, 174.2646, 37.8851);
}