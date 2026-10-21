/* 

The new water feature offers dynamic water level and wave amplitude control.

The example .TS file provided here shows examples of how to use both in custom experiences.

Creators will be able to change water level, beaufort scale, and wave amplitude through different actions.
In addition, they will also have access to a per-player action to set the underwater breathing time, which affects when a character will start drowning.

New mutators will also be available on the Web to control similar water settings.

*/

////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// USEFUL FUNCTIONS //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

// Sets the water level/height. Players can use this to flood the map or create other interesting behaviors.
mod.SetWaterLevel(100);

//Disables the water feature entirely, which will also remove any water from the map.
mod.EnableWater(false);

//Sets the beaufort scale, which controls the wave height and wind strength. The value should be between 0 and 12, with 0 being calm and 12 being hurricane force winds
mod.SetWaterBeaufortScale(12);

//Sets the wave amplitude, the value should be between 0 and 1, this is an extra lever on top of the beaufort scale for more granular water control.
mod.SetWaterWaveAmplitude(1);

//Sets the player's breath time, which controls how long a player can stay underwater before they start drowning. The value is in seconds.
const player = mod.GetPlayer(0);
mod.SetPlayerBreathTime(player, 30.0);

//All of the different water parameters have their own getter functions as well, which can be used to read the current values of the water parameters.
mod.GetWaterHeight();
mod.GetWaterBeaufortScale();
mod.GetWaterWaveAmplitude();
mod.GetWaterIsEnabled();

////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// USEFUL EVENTS /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

// Fired when a player surfaces from underwater.
export async function OnPlayerEmerged(eventPlayer: mod.Player) {
    console.log(eventPlayer + ' emerged');
}

// Fired when a player submerges underwater.
export async function OnPlayerSubmerged(eventPlayer: mod.Player) {
    console.log(eventPlayer + ' submerged');
}

//  Fires when a player enters water, even if not submerged.
export async function OnPlayerEnteredWater(eventPlayer: mod.Player) {
    console.log(eventPlayer + ' entered water');
}

// Fires when a player fully exits the water.
export async function OnPlayerExitedWater(eventPlayer: mod.Player) {
    console.log(eventPlayer + ' left water');
}

////////////////////////////////////////////////////////////////////////////////////////////
//////// Also check out '_StartHere_BasicTemplate' for more examples and references! ///////
////////////////////////////////////////////////////////////////////////////////////////////
