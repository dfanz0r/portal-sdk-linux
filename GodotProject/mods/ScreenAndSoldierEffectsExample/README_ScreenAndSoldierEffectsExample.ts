/* 
Inspired by the SpookyRush collaboration event, this month’s release introduces several new visual
features designed to expand creative options for our community.

The accompanying example TypeScript file demonstrates how to implement and configure ten new screen effects,
seven new soldier effects, seven AI variations, and over one hundred exposed screen effect parameters.

The majority of these exposed parameters correspond directly to the internal controls used by our technical art teams. 
While fine-tuning these numerical values to achieve a specific aesthetic may require some experimentation, 
our priority was to provide comprehensive parameter access rather than limiting options to a predefined set of configurations.

Please note that the following combinations are mutually exclusive and will override each other if activated simultaneously:
  - Saturated and ColorCorrection
  - FilmGrain and UnitologyGlyphs
  - Stealth and Vignette

We look forward to seeing the community collaborate, share configurations, and explore the capabilities of these new visual tools.
*/

////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////// USEFUL FUNCTIONS AND EVENTS ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

export function OnGameModeStarted() {
    // When utilizing the SpawnAIFromAISpawner function, you can now specify the visual AI variation for the spawned soldier.
    // Each class includes six standard skin variations, which were previously assigned automatically.
    // Additionally, you can spawn soldiers of any class as "MarkedSoldiers"—the blood-splattered variants featured in the SpookyRush mode.
    mod.SpawnAIFromAISpawner(mod.GetSpawner(1), mod.SoldierClass.Assault, mod.AIVariation.Skin1, mod.Message('Bloody Soldier'));

    // Individual screen effect parameters can be configured using the SetScreenEffectParameter function.
    // Parameters are categorized into three selection lists: Boolean, Float, and Vector.
    // Note: Not all screen effects utilize all three parameter types.
    mod.SetScreenEffectParameter(mod.ScreenEffectBoolParameters.FilmGrain_Luminance_Enable, true);
    mod.SetScreenEffectParameter(mod.ScreenEffectFloatParameters.FilmGrain_CenterAttenuation, 0.5);
    mod.SetScreenEffectParameter(mod.ScreenEffectVectorParameters.FilmGrain_ColorScale, mod.CreateVector(0.8, -1.0, 1));

    // The new screen effects are toggled using the same workflow as existing effects (such as Night or VL7).
    // The ten new screen effects are: ColorCorrection, DepthOfField, FilmGrain, FilmicEffects, Fog,
    //                                 MotionBlur, ToneMap, UnitologyGlyphs, Vignette, and WhiteBalance.
    mod.EnableScreenEffect(mod.GetPlayer(0), mod.ScreenEffects.MotionBlur, true);

    // Five new audio-only soldier effects have been added: HearWhispers, HearDroneLoop, HearMonsterNoises, HearMonsterNoises2, and HearFakeFootstepsAndGunshots.
    // These effects are local to the target soldier and will only be heard by that specific player. Consequently, they have no functional effect when applied to AI-controlled units.
    mod.SetSoldierEffect(mod.GetPlayer(0), mod.SoldierEffects.HearWhispers, true);

    // Two new visual soldier effects have been added: NecromorphEffects and ShadowSilhouette.
    // Both effects are applied directly to a soldier and are visible globally to all players. These are compatible with both player-controlled and AI-controlled units.
    mod.SetSoldierEffect(mod.GetPlayer(0), mod.SoldierEffects.NecromorphEffects, true);
}

////////////////////////////////////////////////////////////////////////////////////////////////
////////// Also check out '_StartHere_BasicTemplate' for more examples and references! /////////
////////////////////////////////////////////////////////////////////////////////////////////////
