/* 

Two new features have been added to the game that allows players to recreate experiences
Similar to the JetsOnly Gauntlet mode.

The example .TS file provided here shows the different new functions you have access to.

*/

////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// USEFUL FUNCTIONS AND EVENTS ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

let cloudVFXArray: mod.VFX[] = [];

export function OnGameModeStarted() {
    // You can dynamically spawn blockingspheres using the SpawnObject function.
    // Note: The scale should be kept uniform.
    //    If it is set to a value greater or smaller than 1, it will impact the effective radius of the object,
    //    as the two values are multiplied together to determine the final radius of the BlockingSphere.
    const newBlockingSphere = mod.SpawnObject(mod.RuntimeSpawn_Common.BlockingSphere, mod.CreateVector(0, 500, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));

    // The SetBlockingSphereBoolParam function allows you to set the parameters of a blocking sphere.
    // The parameters are defined in the BlockingSphereBoolParam enum, and they control various aspects of the blocking sphere's behavior.

    // The following paramaters are the default values:
    mod.SetBlockingSphereBoolParam(newBlockingSphere, mod.BlockingSphereBoolParam.BlockSpotting, true);
    mod.SetBlockingSphereBoolParam(newBlockingSphere, mod.BlockingSphereBoolParam.BlockLocking, true);
    mod.SetBlockingSphereBoolParam(newBlockingSphere, mod.BlockingSphereBoolParam.JamIncomingMissiles, true);
    mod.SetBlockingSphereBoolParam(newBlockingSphere, mod.BlockingSphereBoolParam.RemoveTracerDart, false);
    mod.SetBlockingSphereBoolParam(newBlockingSphere, mod.BlockingSphereBoolParam.RemoveLaserPainting, false);
    mod.SetBlockingSphereBoolParam(newBlockingSphere, mod.BlockingSphereBoolParam.IsCloudBlockingVolume, true);

    // You can read the values of the blocking sphere parameters using the GetBlockingSphereBoolParam function.
    const blockSpotting = mod.GetBlockingSphereBoolParam(newBlockingSphere, mod.BlockingSphereBoolParam.BlockSpotting);
    const blockLocking = mod.GetBlockingSphereBoolParam(newBlockingSphere, mod.BlockingSphereBoolParam.BlockLocking);
    const jamIncomingMissiles = mod.GetBlockingSphereBoolParam(newBlockingSphere, mod.BlockingSphereBoolParam.JamIncomingMissiles);
    const removeTracerDart = mod.GetBlockingSphereBoolParam(newBlockingSphere, mod.BlockingSphereBoolParam.RemoveTracerDart);
    const removeLaserPainting = mod.GetBlockingSphereBoolParam(newBlockingSphere, mod.BlockingSphereBoolParam.RemoveLaserPainting);
    const isCloudBlockingVolume = mod.GetBlockingSphereBoolParam(newBlockingSphere, mod.BlockingSphereBoolParam.IsCloudBlockingVolume);

    // You can also set and get the radius of a blockingsphere using the SetBlockingSphereRadius and GetBlockingSphereRadius functions.
    mod.SetBlockingSphereRadius(newBlockingSphere, 170);
    const radius = mod.GetBlockingSphereRadius(newBlockingSphere);

    // You can unspawn a dynamically spawned BlockingSphere using the UnspawnObject function.
    mod.UnspawnObject(newBlockingSphere);

    // Six new cloud VFX have been added to the RuntimeSpawn_Common enum.
    //    FX_Cloud_Cluster: Large white cloud clusters, intended to have blockingspheres.
    //    FX_Cloud_Cluster_Towering: Immense white cloud clusters, intended to have blockingspheres.
    //    FX_Cloud_Cluster_Storm: Large dark storm clouds, intended to have blockingspheres.
    //    FX_Cloud_Fractus_Small: Small, wispy clouds, not intended to have blockingspheres.
    //    FX_Cloud_Fractus_Medium: Medium, wispy clouds, not intended to have blockingspheres.
    //    FX_Cloud_DistantBank: Distant cloud banks, not intended to have blockingspheres. Place at the origin of your level, as they will surround the area.

    // Clouds are quite large, and should be spawned at a high alitude, such as 500 meters above ground level.
    const newCloudCluster = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Cloud_Cluster, mod.CreateVector(0, 500, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    cloudVFXArray.push(newCloudCluster);
    
    const newCloudTowering = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Cloud_Cluster_Towering, mod.CreateVector(-1200, 500, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    cloudVFXArray.push(newCloudTowering);

    const newCloudStorm = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Cloud_Cluster_Storm, mod.CreateVector(1200, 500, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    cloudVFXArray.push(newCloudStorm);

    const newCloudFractusSmall = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Cloud_Fractus_Small, mod.CreateVector(0, 500, 1200), mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    cloudVFXArray.push(newCloudFractusSmall);

    const newCloudFractusMedium = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Cloud_Fractus_Medium, mod.CreateVector(0, 500, -1200), mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    cloudVFXArray.push(newCloudFractusMedium);

    const newCloudDistantBank = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Cloud_DistantBank, mod.CreateVector(0, 500, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    cloudVFXArray.push(newCloudDistantBank);
}

export function OnPlayerJoinGame(player: mod.Player) {
    // Cloud VFX are permanently visible once Enabled, at least until you disable them.
    // However, if a cloud VFX is enabled prior to a player joining a game, they will not see the cloud until a new EnableVFX call is made.
    // Therefore, it is a good practice to re-enable all cloud VFX when a new player joins.

    for (const cloud of cloudVFXArray) {
        mod.EnableVFX(cloud, true);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////
//////// Also check out '_StartHere_BasicTemplate' for more examples and references! ///////
////////////////////////////////////////////////////////////////////////////////////////////
