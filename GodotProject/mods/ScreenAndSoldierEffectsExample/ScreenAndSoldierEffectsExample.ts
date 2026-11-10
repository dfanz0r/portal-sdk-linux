let Interactor_SpawnAssault: mod.InteractPoint;
let Interactor_SpawnSupport: mod.InteractPoint;
let Interactor_SpawnRecon: mod.InteractPoint;
let Interactor_SpawnEngineer: mod.InteractPoint;

let UIWidgets: [number, mod.UIWidget, mod.UIWidget, string][] = [];

const NoDisplayName = 'na';
const NoParam = 'N/A';
const NoDefault = 'N/A';
const NoMin = 'N/A';
const NoMax = 'N/A';
const RGBMin = [0, 0, 0];
const RGBMax = [1, 1, 1];

type SoldierEffect = [mod.SoldierEffects, string];
const soldierEffects: SoldierEffect[] = [
    [mod.SoldierEffects.FreezeStatusEffect, 'Freeze'],
    [mod.SoldierEffects.HeatStatusEffect, 'Heat'],
    [mod.SoldierEffects.VL7Effect, 'VL7'],
    [mod.SoldierEffects.ShadowSilhouette, 'ShadowSilhouette'],
    [mod.SoldierEffects.NecromorphEffects, 'NecromorphEffects'],
    [mod.SoldierEffects.HearWhispers, 'HearWhispers'],
    [mod.SoldierEffects.HearDroneLoop, 'HearDroneLoop'],
    [mod.SoldierEffects.HearFakeFootstepsAndGunshots, 'HearFakeFootstepsAndGunshots'],
    [mod.SoldierEffects.HearFakeMonsterNoises, 'HearFakeMonsterNoises'],
    [mod.SoldierEffects.HearFakeMonsterNoises2, 'HearFakeMonsterNoises2'],
];

//     ParamType, DisplayName, ScreenEffectParameter, DefaultValue, MinValue, MaxValue, SubParameters
type Parameter = [string, string, any, any, any, any, Parameter[]];
//     ScreenEffect, DisplayName, Parameters
type ScreenEffect = [mod.ScreenEffects, string, Parameter[]];

// Many of the minimum and maximum values found here are not the actual limits of the parameters, but rather reasonable ranges for demonstration purposes.
const screenEffects: ScreenEffect[] = [
    [mod.ScreenEffects.Stealth, 'Stealth', []], // Preset version of Vignette. Kept for backward compatibility.
    [mod.ScreenEffects.Saturated, 'Saturated', []], // Preset version of ColorCorrection. Kept for backward compatibility.
    [mod.ScreenEffects.VL7, 'VL7', []], // Preset combination of multiple VEs. Used for VL7 Clouds.
    [mod.ScreenEffects.Night, 'Night', []], // Preset combination of multiple VEs. Used to create night-time visual effects. Cannot presently be reproduced with current selection of exposed screen effects.
    [
        mod.ScreenEffects.ColorCorrection,
        'ColorCorrection', //Changes the saturation and overall colors of the screen.
        [
            [
                'base',
                NoDisplayName,
                NoParam,
                NoDefault,
                NoMin,
                NoMax,
                [
                    //This is a global saturation control. It is applied after offset, but before Shadows/Mids/Highs. At 1, it does not saturate or desaturate the screen at all.
                    // At 0, it turns the screen to grayscale. At 2, it makes every color pop.
                    ['float', 'Saturation', mod.ScreenEffectFloatParameters.ColorCorrection_Saturation, 0.641, 0, 2, []],
                    //This is a global brightness offset to allow small adjustments. It is applied before the rest of the adjustments.
                    ['vec3', 'Offset', mod.ScreenEffectVectorParameters.ColorCorrection_Offset, [1, 1, 1], RGBMin, RGBMax, []],
                    //Brighter pixels will multiply their RGB values by a lerp between this value and ColorCorrection_Mids.
                    ['vec3', 'Highs', mod.ScreenEffectVectorParameters.ColorCorrection_Highs, [1, 0.816, 0.39], RGBMin, RGBMax, []],
                    //Average pixels will multiply their RGB values by a lerp between this value, ColorCorrection_Shadows and ColorCorrection_Highs.
                    ['vec3', 'Mids', mod.ScreenEffectVectorParameters.ColorCorrection_Mids, [0.511, 0.552, 0.244], RGBMin, RGBMax, []],
                    //Darker pixels will multiply their RGB values by a lerp between this value and ColorCorrection_Mids.
                    ['vec3', 'Shadows', mod.ScreenEffectVectorParameters.ColorCorrection_Shadows, [0.055, 0.056, 0.04], RGBMin, RGBMax, []],
                ],
            ],
        ],
    ],
    [
        mod.ScreenEffects.DepthOfField,
        'DepthOfField', // Blurs objects in front of or behind a focal point.
        [
            [
                'base',
                NoDisplayName,
                NoParam,
                NoDefault,
                NoMin,
                NoMax,
                [
                    // Focus distance in meters.
                    ['float', 'FocusDistance', mod.ScreenEffectFloatParameters.DOF_FocusDistance, 10, 0.1, 10, []],
                    // Normalized strength factor for increasing/decreasing the defocus effect.
                    ['float', 'BlurFactor', mod.ScreenEffectFloatParameters.DOF_BlurFactor, 0.257, 0, 1, []],
                    // Add an extra defocus effect on the entire screen.
                    ['float', 'BlurAdd', mod.ScreenEffectFloatParameters.DOF_BlurAdd, 0.229, 0, 1, []],
                    // Override physical camera aperture.
                    ['float', 'Aperture', mod.ScreenEffectFloatParameters.DOF_Aperture, 8, 1, 64, []],
                    // Override physical camera sensor width.
                    ['float', 'SensorWidth', mod.ScreenEffectFloatParameters.DOF_SensorWidth, 36, 0.00001, 100, []],
                    // Anisotropy for simulating anamorphic lens effects. +ve = horizontal; -ve = vertical
                    ['float', 'Anisotropy', mod.ScreenEffectFloatParameters.DOF_Anisotropy, 0, -1, 1, []],
                    // Optical vignetting (cat eye) strength.
                    ['float', 'OpticalVignetting', mod.ScreenEffectFloatParameters.DOF_OpticalVignetting, 0, 0, 1, []],
                    // Enable composite near blur.
                    ['bool', 'EnableCompositeNearBlur', mod.ScreenEffectBoolParameters.DOF_EnableCompositeNearBlur, true, NoMin, NoMax, []],
                    // Enable Chromatic Aberration on bokeh.
                    ['bool', 'EnableChromaticAberration', mod.ScreenEffectBoolParameters.DOF_EnableChromaticAberration, false, NoMin, true, []],
                    // When using low resolution DoF, it's sometimes preferable to over-blur the DoF to avoid getting a pixelated result. This does have a small performance penalty.
                    ['bool', 'EnableOverBlurringUpsample', mod.ScreenEffectBoolParameters.DOF_EnableOverBlurringUpsample, false, NoMin, true, []],
                ],
            ],
            // Controls whether the behaviour of DepthOfField applies when aiming down sights.
            [
                'bool',
                'Ironsights',
                mod.ScreenEffectBoolParameters.DOF_Ironsights_Enable,
                false,
                NoMin,
                NoMax,
                [
                    // Fade the intensity of the Ironsight blur.
                    ['float', 'FadeIntensity', mod.ScreenEffectFloatParameters.DOF_Ironsights_FadeIntensity, 1, 0, 1, []],
                    // Distance from camera where the DoF should start to fade from unfocused to focused.
                    ['float', 'DistanceBeforeStartFade', mod.ScreenEffectFloatParameters.DOF_Ironsights_DistanceBeforeStartFade, 0.5, 0, 20, []],
                    // Distance from camera where the scene should be fully focused (clamped to minimum DistanceBeforeStartFade + 0.1).
                    ['float', 'FocalDistance', mod.ScreenEffectFloatParameters.DOF_Ironsights_FocalDistance, 1.5, 5, 40, []],
                    // Distance from camera where the DoF should start to fade from focused to unfocused. (0 = disabled)
                    ['float', 'DistanceStartFadeOut', mod.ScreenEffectFloatParameters.DOF_Ironsights_DistanceStartFadeOut, 0, 0, 20, []],
                    // Distance from camera where the scene should be fully unfocused (0 = disabled, clamped to minimum DistanceStartFadeOut + 0.1).
                    ['float', 'DistanceEndFadeOut', mod.ScreenEffectFloatParameters.DOF_Ironsights_DistanceEndFadeOut, 0, 15, 80, []],
                    //  Enables a circular mask that blurs from the edges of the screen towards the center.
                    [
                        'bool',
                        'CircleBlur',
                        mod.ScreenEffectBoolParameters.DOF_Ironsights_CircleBlur_Enable,
                        false,
                        NoMin,
                        true,
                        [
                            // Radius from the center of the screen to where the circular blur mask should start to have effect, measured in normalized vertical screen space.
                            ['float', 'Size', mod.ScreenEffectFloatParameters.DOF_Ironsights_CircleBlur_Size, 0.35, 0, 3, []],
                            // Radius from where the circular blur mask starts to where it should have full effect, set to 0 or less for a step function, measured in normalized vertical screen space.
                            ['float', 'FadeDistance', mod.ScreenEffectFloatParameters.DOF_Ironsights_CircleBlur_FadeDistance, 0, 0, 0.5, []],
                        ],
                    ],
                ],
            ],
        ],
    ],
    [
        mod.ScreenEffects.FilmGrain,
        'FilmGrain', // Adds noise and grain to the screen.
        [
            [
                'base',
                NoDisplayName,
                NoParam,
                NoDefault,
                NoMin,
                NoMax,
                [
                    // Controls the scale of the Film Grain texture's UV coordinates. Values closer to 0 make individual grain pixels appear larger; larger absolute values make them appear smaller.
                    // Negative values mirror the texture along that axis.
                    ['vec2', 'TextureScale', mod.ScreenEffectVectorParameters.FilmGrain_TextureScale, [0.4, 0.4], [-2, -2], [2, 2], []],
                    // Controls the multiplicative contribution of the Film Grain texture to each color channel of the underlying image.
                    ['vec3', 'ColorScale', mod.ScreenEffectVectorParameters.FilmGrain_ColorScale, [0.2, 0.2, 0.2], [-5, -5, -5], [5, 5, 5], []],
                    // Enables LinearFiltering of the texture.
                    ['bool', 'EnableLinearFiltering', mod.ScreenEffectBoolParameters.FilmGrain_EnableLinearFiltering, true, NoMin, NoMax, []],
                    // Determines if the FilmGrain texture is stable, or uses random coordinates every frame.
                    ['bool', 'Animate', mod.ScreenEffectBoolParameters.FilmGrain_Animate, true, NoMin, NoMax, []],
                    // Allows control over film grain near the middle of the screen.
                    ['float', 'CenterAttenuation', mod.ScreenEffectFloatParameters.FilmGrain_CenterAttenuation, 0.579, 0, 1, []],
                    // Width scaling for attenuation. Higher values spread the effect in a wider area.
                    ['float', 'CenterScaleWidth', mod.ScreenEffectFloatParameters.FilmGrain_CenterScaleWidth, 3, 0.5, 3, []],
                    // Height scaling for attenuation. Higher values spread the effect in a taller area.
                    ['float', 'CenterScaleHeight', mod.ScreenEffectFloatParameters.FilmGrain_CenterScaleHeight, 0.747, 0.5, 3, []],
                ],
            ],
            // Enables the additive Film Grain texture contribution. Unlike ColorScale, Luminance grain can brighten pixels and therefore remains visible over completely black areas.
            // The amount added can be varied according to the luminosity of the underlying pixel using the Shadow/Highlight controls.
            [
                'bool',
                'Luminance',
                mod.ScreenEffectBoolParameters.FilmGrain_Luminance_Enable,
                true,
                NoMin,
                NoMax,
                [
                    // The cut-off level of luminosity where GrainShadowIntensity amount of grain is applied. Luminosity values below this value will have GrainShadowIntensity amount of grain applied.
                    // Luminosity values above this will add an amount of grain between GrainShadowIntensity and GrainHighlightIntensity. This value must be smaller than or equal to GrainHighlightThreshold.
                    ['float', 'ShadowThreshold', mod.ScreenEffectFloatParameters.FilmGrain_Luminance_ShadowThreshold, 0.25, 0, 1, []],
                    // The level of luminosity where GrainHighlightIntensity amount of grain is applied. Luminosity values above this value will have GrainHighlightIntensity amount of grain applied.
                    // Luminosity values below this will add an amount of grain between GrainShadowIntensity and GrainHighlightIntensity. This value must be larger than or equal to GrainShadowThreshold.
                    ['float', 'HighlightThreshold', mod.ScreenEffectFloatParameters.FilmGrain_Luminance_HighlightThreshold, 0.85, 0, 1, []],
                    // The amount of grain added in shadows. This is usually a larger amount (higher value) than the amount of grain in highlight areas (Luminance_HighlightIntensity).
                    ['float', 'ShadowIntensity', mod.ScreenEffectFloatParameters.FilmGrain_Luminance_ShadowIntensity, 10, 0, 40, []],
                    // The amount of grain added in highlight. This is usually a smaller amount (lower value) than the amount of grain in shadow areas (Luminance_ShadowIntensity).
                    ['float', 'HighlightIntensity', mod.ScreenEffectFloatParameters.FilmGrain_Luminance_HighlightIntensity, 3, 0, 40, []],
                ],
            ],
        ],
    ],
    [
        mod.ScreenEffects.FilmicEffects,
        'FilmicEffects', // Adds lens distortion, chromatic aberration, and other effects that simulate the look of a physical camera.
        [
            // Enable/Disable chromatic aberration.
            [
                'bool',
                'ChromaticAberration',
                mod.ScreenEffectBoolParameters.FilmicEffects_ChromaticAberration_Enable,
                true,
                NoMin,
                NoMax,
                [
                    // Enable/Disable blue noise offsets in chromatic aberration. Increases smoothness when the effect is very strong. Not recommended when the effect is just a few pixels wide.
                    ['bool', 'EnableNoise', mod.ScreenEffectBoolParameters.FilmicEffects_ChromaticAberration_EnableNoise, true, NoMin, NoMax, []],
                    // The amount of chromatic aberration to apply.
                    ['float', 'Scale', mod.ScreenEffectFloatParameters.FilmicEffects_ChromaticAberration_Scale, 1.005, 1, 1.05, []],
                    // Second multiplicative scale slider to enable inversed chromatic aberration colors, and better control of the range. 1.0 is neutral
                    ['float', 'ScaleMultiply', mod.ScreenEffectFloatParameters.FilmicEffects_ChromaticAberration_ScaleMultiply, 3, -10, 20, []],
                    // The aspect ratio of the filmback. 1.0 is isotropic.
                    ['float', 'AspectRatio', mod.ScreenEffectFloatParameters.FilmicEffects_ChromaticAberration_AspectRatio, 0.357, 0.1, 10, []],
                    // Attenuation of the effect in the center of the screen. At 1.0 the effect is practically off.
                    ['float', 'Attenuation', mod.ScreenEffectFloatParameters.FilmicEffects_ChromaticAberration_Attenuation, 0.001, 0, 1, []],
                    // Maximum number of samples per direction around a center sample. 1 can only create primary colors while 3 also has secondary. Increases smoothness of the effect. More samples degrade performance
                    ['int', 'SampleCount', mod.ScreenEffectFloatParameters.FilmicEffects_ChromaticAberration_SampleCount, 7, 1, 7, []],
                ],
            ],
            // Enable/Disable vignetting.
            [
                'bool',
                'Vignetting',
                mod.ScreenEffectBoolParameters.FilmicEffects_Vignetting_Enable,
                true,
                NoMin,
                NoMax,
                [
                    // Distance from center of frame falloff exponent.
                    ['float', 'Falloff', mod.ScreenEffectFloatParameters.FilmicEffects_Vignetting_Falloff, 10, 1, 10, []],
                    // Percentage luminance loss at full falloff distance.
                    ['float', 'LuminancePercent', mod.ScreenEffectFloatParameters.FilmicEffects_Vignetting_LuminancePercent, 0.12, 0.001, 1, []],
                ],
            ],
            // Enable/Disable lens disortion.
            [
                'bool',
                'LensDistortion',
                mod.ScreenEffectBoolParameters.FilmicEffects_LensDistortion_Enable,
                true,
                NoMin,
                NoMax,
                [
                    // Lens distortion gain.
                    ['float', 'Gain', mod.ScreenEffectFloatParameters.FilmicEffects_LensDistortion_Gain, 0.06, -1, 4, []],
                    // Lens distortion cubic gain.
                    ['float', 'CubicGain', mod.ScreenEffectFloatParameters.FilmicEffects_LensDistortion_CubicGain, 0.05, -1, 4, []],
                    // Stretches the distortion to simulate an anamorphic lens. From -1 = only vertical distortion to 1 = only horizontal distortion.
                    ['float', 'Stretch', mod.ScreenEffectFloatParameters.FilmicEffects_LensDistortion_Stretch, 0.06, -1, 1, []],
                    // Allows control over distortion near the middle of the screen. Can be used as compensation to avoid blurring the center.
                    ['float', 'CenterAttenuation', mod.ScreenEffectFloatParameters.FilmicEffects_LensDistortion_CenterAttenuation, 0, 0, 1, []],
                    // Width scaling for attenuation. Higher values spread the effect in a wider area.
                    ['float', 'CenterScaleWidth', mod.ScreenEffectFloatParameters.FilmicEffects_LensDistortion_CenterScaleWidth, 1, 0.5, 2, []],
                    // Height scaling for attenuation. Higher values spread the effect in a taller area.
                    ['float', 'CenterScaleHeight', mod.ScreenEffectFloatParameters.FilmicEffects_LensDistortion_CenterScaleHeight, 1, 0.5, 2, []],
                ],
            ],
            // Enable/Disable frame flash.
            [
                'bool',
                'FrameFlash',
                mod.ScreenEffectBoolParameters.FilmicEffects_FrameFlash_Enable,
                true,
                NoMin,
                NoMax,
                [
                    // Multiplier on overall amount of frame flashing.
                    ['float', 'Gain', mod.ScreenEffectFloatParameters.FilmicEffects_FrameFlash_Gain, 0.05, 0, 1, []],
                ],
            ],
            // Enable/Disable depth flash.
            [
                'bool',
                'DepthFlash',
                mod.ScreenEffectBoolParameters.FilmicEffects_DepthFlash_Enable,
                false,
                NoMin,
                NoMax,
                [
                    // Constant atmospheric depth flash color.
                    [
                        'vec3',
                        'AtmosphereColor',
                        mod.ScreenEffectVectorParameters.FilmicEffects_DepthFlash_AtmosphereColor,
                        [0.417, 0.958, 0.974],
                        RGBMin,
                        RGBMax,
                        [],
                    ],
                    // The distance from camera where 50% of the flash color is mixed in.
                    ['float', 'HalfDistance', mod.ScreenEffectFloatParameters.FilmicEffects_DepthFlash_HalfDistance, 44109.59, 0.001, 100000, []],
                ],
            ],
        ],
    ],
    [
        mod.ScreenEffects.Fog,
        'Fog', // Configures various fog effects, including gradient fog, color fog, and participating media.
        [
            // Enables forward light scattering.
            [
                'bool',
                'ForwardLightScattering',
                mod.ScreenEffectBoolParameters.Fog_ForwardLightScattering_Enable,
                true,
                NoMin,
                NoMax,
                [
                    // The g parameter of the phase function (schlick approximation to Henyey-Greenstein). This represents the strength of forward scattering.
                    ['float', 'PhaseG', mod.ScreenEffectFloatParameters.Fog_ForwardLightScattering_PhaseG, 0, 0, 0.999, []],
                    // The strength of the forward scattered light (it should be in [0,1]).
                    ['float', 'Strength', mod.ScreenEffectFloatParameters.Fog_ForwardLightScattering_Strength, 0, 0, 5, []],
                    // The presence of the light shafts scattering as compared to the original non-blurred one. If 0, the GPU cost will go down.
                    ['float', 'Presence', mod.ScreenEffectFloatParameters.Fog_ForwardLightScattering_Presence, 0, 0, 1, []],
                    // The maximum length of the blur in screen space.
                    ['float', 'MaxBlurLength', mod.ScreenEffectFloatParameters.Fog_ForwardLightScattering_MaxBlurLength, 0.5, 0, 1, []],
                    // The light shafts exponential extinction value.
                    ['float', 'Extinction', mod.ScreenEffectFloatParameters.Fog_ForwardLightScattering_Extinction, 14, 0, 100, []],
                    // This allows to smooth the final result by extending the first blur (not correct but practically works very well).
                    ['float', 'Smoothness', mod.ScreenEffectFloatParameters.Fog_ForwardLightScattering_Smoothness, 4, 1, 32, []],
                ],
            ],
            // Enables the height fog.
            [
                'bool',
                'HeightFog',
                mod.ScreenEffectBoolParameters.Fog_HeightFog_Enable,
                true,
                NoMin,
                NoMax,
                [
                    // This value to controls whether the base follows the camera or not.
                    ['float', 'FollowCamera', mod.ScreenEffectFloatParameters.Fog_HeightFog_FollowCamera, 0, 0, 1, []],
                    // Height fog altitude in meters as compared to the ground level 0.
                    ['float', 'Altitude', mod.ScreenEffectFloatParameters.Fog_HeightFog_Altitude, 0, -10000, 10000, []],
                    // Height fog depth in meters (centered on the altitude).
                    ['float', 'Depth', mod.ScreenEffectFloatParameters.Fog_HeightFog_Depth, 50, 1, 10000, []],
                    // How far you an see in meters when inside the height fog.
                    ['float', 'VisibilityRange', mod.ScreenEffectFloatParameters.Fog_HeightFog_VisibilityRange, 30, 1, 10000, []],
                    // The distance at which the height fog curve will start, in meters.
                    ['float', 'StartDistance', mod.ScreenEffectFloatParameters.Fog_HeightFog_StartDistance, 0, 0, 40, []],
                    // The distance at which the height fog curve will stop, in meters.
                    ['float', 'EndDistance', mod.ScreenEffectFloatParameters.Fog_HeightFog_EndDistance, 350, 25, 200, []],
                ],
            ],
            // Enables general participating media rendering.
            [
                'bool',
                'ParticipatingMedia',
                mod.ScreenEffectBoolParameters.Fog_ParticipatingMedia_Enable,
                true,
                NoMin,
                NoMax,
                [
                    // Enables sun lighting on participating media.
                    ['bool', 'EnableSunLighting', mod.ScreenEffectBoolParameters.Fog_ParticipatingMedia_EnableSunLighting, true, NoMin, NoMax, []],
                    // Enables local lighting on participating media.
                    ['bool', 'EnableLocalLighting', mod.ScreenEffectBoolParameters.Fog_ParticipatingMedia_EnableLocalLighting, true, NoMin, NoMax, []],
                    // Enables extinction on participating media (self occlusion from view point). When disabled, the media will look like it is emissive.
                    ['bool', 'EnableExtinction', mod.ScreenEffectBoolParameters.Fog_ParticipatingMedia_EnableExtinction, true, NoMin, NoMax, []],
                    // Enables emissive and ambient on participating media. When disabled, computations are faster but you then lose the ambient/GI component.
                    [
                        'bool',
                        'EnableEmissiveAndAmbient',
                        mod.ScreenEffectBoolParameters.Fog_ParticipatingMedia_EnableEmissiveAndAmbient,
                        true,
                        NoMin,
                        NoMax,
                        [],
                    ],
                    // Enables sun volumetric shadows from participating media. The resolution and distribution follows the extinction cascade.
                    [
                        'bool',
                        'EnableSunVolumetricShadow',
                        mod.ScreenEffectBoolParameters.Fog_ParticipatingMedia_EnableSunVolumetricShadow,
                        false,
                        NoMin,
                        NoMax,
                        [],
                    ],
                    // Enables cloud shadow influence on participating media.
                    [
                        'bool',
                        'CloudShadow',
                        mod.ScreenEffectBoolParameters.Fog_ParticipatingMedia_CloudShadow_Enable,
                        false,
                        NoMin,
                        NoMax,
                        [
                            // Remaps the effect of the cloud shadow to interpolate between min/max. Anything below gets clamped to 0 anything above gets clamped to 1.
                            [
                                'vec2',
                                'IntensityRange',
                                mod.ScreenEffectVectorParameters.Fog_ParticipatingMedia_CloudShadow_IntensityRange,
                                [0, 1],
                                [0, 0],
                                [1, 1],
                                [],
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ],
    [
        mod.ScreenEffects.MotionBlur,
        'MotionBlur', // Adds motion blur effects to simulate the blurring of moving objects and camera motion.
        [
            // When enabled, use properties from the currently active physical camera to control the motion blur
            [
                'base',
                NoDisplayName,
                NoParam,
                NoDefault,
                NoMin,
                NoMax,
                [
                    // The distance from blur center to where the effect begins. A value of 0.5 equals half the screen width
                    ['float', 'Offset', mod.ScreenEffectFloatParameters.MotionBlur_Offset, 0, 0, 0.7, []],
                    // Determines how fast the effect increases with distance
                    ['float', 'Scale', mod.ScreenEffectFloatParameters.MotionBlur_Scale, 0.02, 0, 0.3, []],
                ],
            ],
        ],
    ],
    [
        mod.ScreenEffects.ToneMap,
        'ToneMap', // Adjusts the overall tone mapping of the scene, affecting brightness and contrast.
        [
            [
                'base',
                NoDisplayName,
                NoParam,
                NoDefault,
                NoMin,
                NoMax,
                [
                    // Manual absolute EV value. This value controls the overall exposition of the frame.
                    ['float', 'ExposureValue', mod.ScreenEffectFloatParameters.ToneMap_Exposure_Value, 10, 7, 12, []],
                    // Exposure compensation applied on top of the manual/automatic exposure. Values above 0 will over-exposed the image, values below 0 will under-exposes the image. In f-stop.
                    ['float', 'Compensation', mod.ScreenEffectFloatParameters.ToneMap_Exposure_Compensation, 1.4, -5, 5, []],
                    // EV adaptation time from high luminosity to low luminosity. In second/EV in average as the adaptation is non-linear.
                    ['float', 'DarkAdaptationTime', mod.ScreenEffectFloatParameters.ToneMap_Exposure_DarkAdaptationTime, 3, 0, 10, []],
                    // EV adaptation time from low luminosity to high luminosity. In second/EV in average as the adaptation is non-linear.
                    ['float', 'LightAdaptationTime', mod.ScreenEffectFloatParameters.ToneMap_Exposure_LightAdaptationTime, 1, 0, 10, []],
                ],
            ],
            // Enables/Disables LocalExposure settings
            [
                'bool',
                'LocalExposure',
                mod.ScreenEffectBoolParameters.ToneMap_LocalExposure_Enable,
                false,
                NoMin,
                NoMax,
                [
                    // Intensity of the effect, 0 is disabled.
                    ['float', 'Intensity', mod.ScreenEffectFloatParameters.ToneMap_LocalExposure_Intensity, 0, 0, 1.5, []],
                    // Scales the offset used for the exposure that brings shadows into view.
                    ['float', 'ShadowOffset', mod.ScreenEffectFloatParameters.ToneMap_LocalExposure_ShadowOffset, 2.5, 1, 4, []],
                    // Scales the offset used for the exposure that brings highlights into view.
                    ['float', 'HighlightOffset', mod.ScreenEffectFloatParameters.ToneMap_LocalExposure_HighlightOffset, 2, 1, 4, []],
                    // The gray value used when calculating how close the the pixel luminance value is to a given exposure.
                    ['float', 'MidGrayBias', mod.ScreenEffectFloatParameters.ToneMap_LocalExposure_MidGrayBias, 0, -0.25, 0.25, []],
                    // The coarsest mip determines the start mip/frequency to use when blending the luminance pyramids. A lower value gives higher dynamic compression but a more fake HDR look and more visible artifacts.
                    ['float', 'CoarsestMipLevel', mod.ScreenEffectFloatParameters.ToneMap_LocalExposure_CoarsestMipLevel, 8, 1, 10, []],
                    // How much we use the mid-gray distance when blending the 3 exposures together. Low values will just average the 3 exposures, high values give preference to pixels closest to mid-gray.
                    ['float', 'GaussianRadius', mod.ScreenEffectFloatParameters.ToneMap_LocalExposure_GaussianRadius, 5, 1, 10, []],
                    // The scale/strength of the clarity effect. Allow to re-introduce some of the contrast lost due to local exposure.
                    ['float', 'ClarityIntensity', mod.ScreenEffectFloatParameters.ToneMap_LocalExposure_ClarityIntensity, 0, 0, 1.5, []],
                    // Compare local luminance with that of global luminance (mip level controls local -> global)
                    ['float', 'ClarityCoarsestMipLevel', mod.ScreenEffectFloatParameters.ToneMap_LocalExposure_ClarityCoarsestMipLevel, 5, 0, 10, []],
                    // Limit how much we can lighten/darken a pixel
                    [
                        'vec2',
                        'ClarityLuminanceRange',
                        mod.ScreenEffectVectorParameters.ToneMap_LocalExposure_ClarityLuminanceRange,
                        [0.975, 1.01],
                        [0, 0],
                        [1, 1],
                        [],
                    ],
                ],
            ],
            // Bloom Category with no associated Bool control parameter
            [
                'virtual',
                'Bloom',
                NoParam,
                NoDefault,
                NoMin,
                NoMax,
                [
                    // Bloom color.
                    ['vec3', 'Scale', mod.ScreenEffectVectorParameters.ToneMap_Bloom_Scale, [0.05, 0.05, 0.05], RGBMin, RGBMax, []],
                    // Bloom sharpness.
                    ['float', 'GaussianSharpness', mod.ScreenEffectFloatParameters.ToneMap_Bloom_GaussianSharpness, 0.5, 0, 1, []],
                ],
            ],
            // LensEffects Category with no associated Bool control parameter
            [
                'virtual',
                'LensEffects',
                NoParam,
                NoDefault,
                NoMin,
                NoMax,
                [
                    // Dirt texture color addition to offset it
                    ['vec3', 'LensDirtBias', mod.ScreenEffectVectorParameters.ToneMap_LensEffects_LensDirtBias, [0, 0, 0], RGBMin, RGBMax, []],
                    // Dirt texture multiplier to increase the intensity
                    ['vec3', 'LensDirtFactor', mod.ScreenEffectVectorParameters.ToneMap_LensEffects_LensDirtFactor, [1, 1, 1], RGBMin, RGBMax, []],
                    // Dirt texture exponent to bring more constrast and crunch
                    ['vec3', 'LensDirtExponent', mod.ScreenEffectVectorParameters.ToneMap_LensEffects_LensDirtExponent, [1, 1, 1], RGBMin, RGBMax, []],
                    // Control where we start applying Lens Dirt based on the amount of Bloom on screen.
                    ['float', 'LensDirtBloomGainMin', mod.ScreenEffectFloatParameters.ToneMap_LensEffects_LensDirtBloomGainMin, 0, 0, 1, []],
                    // Control where we stop applying Lens Dirt based on the amount of Bloom on screen. Increasing this acts as a Lens Dirt fade in combination with BloomGainMin.
                    ['float', 'LensDirtBloomGainMax', mod.ScreenEffectFloatParameters.ToneMap_LensEffects_LensDirtBloomGainMax, 0, 0, 1, []],
                ],
            ],
        ],
    ],
    [
        mod.ScreenEffects.Vignette,
        'Vignette', // Adds a vignette effect, darkening the corners of the screen.
        [
            [
                'base',
                NoDisplayName,
                NoParam,
                NoDefault,
                NoMin,
                NoMax,
                [
                    // Scale factors for making vignette elliptical. Higher value equals narrower ellipse along that axis.
                    ['vec2', 'Scale', mod.ScreenEffectVectorParameters.Vignette_Scale, [1, 0.85], [0, 0], [1, 1], []],
                    // Offset the vignette horizontally and/or vertically.
                    ['vec2', 'Offset', mod.ScreenEffectVectorParameters.Vignette_Offset, [0, -0.05], [-0.5, -0.5], [0.5, 0.5], []],
                    // Exponent for radial function.
                    ['float', 'Exponent', mod.ScreenEffectFloatParameters.Vignette_Exponent, 0.1, 0.0001, 0.6, []],
                    // Vignette opacity
                    ['float', 'Opacity', mod.ScreenEffectFloatParameters.Vignette_Opacity, 0.685, 0, 1, []],
                ],
            ],
        ],
    ],
    [
        mod.ScreenEffects.WhiteBalance,
        'WhiteBalance', // Adjusts the white balance of the scene, affecting color temperature and tint.
        [
            [
                'base',
                NoDisplayName,
                NoParam,
                NoDefault,
                NoMin,
                NoMax,
                [
                    // Color temperature in kelvins. Lower values shift the image toward warmer orange/yellow tones; higher values shift it toward cooler blue tones.
                    // Uses controls comparable to Adobe Lightroom.
                    ['float', 'Temperature', mod.ScreenEffectFloatParameters.WhiteBalance_Temperature, 13428.58, 2000, 30000, []],
                    // Adjusts the image along the green–magenta tint axis. Negative values shift toward green; positive values shift toward magenta. Matches Adobe Lightroom controls.
                    ['float', 'Tint', mod.ScreenEffectFloatParameters.WhiteBalance_Tint, 39.818, -150, 150, []],
                ],
            ],
        ],
    ],
    [
        mod.ScreenEffects.UnitologyGlyphs,
        'UnitologyGlyphs', // Configures the appearance and behavior of Unitology glyphs on the screen.
        [
            [
                'base',
                NoDisplayName,
                NoParam,
                NoDefault,
                NoMin,
                NoMax,
                [
                    // Controls the scale of the Unitology texture's UV coordinates. Values closer to 0 make individual the letters appear larger; larger absolute values make them appear smaller and will show the texture tiling.
                    // Negative values mirror the texture along that axis.
                    ['vec2', 'TextureScale', mod.ScreenEffectVectorParameters.Unitology_TextureScale, [0.75, 0.75], [-2, -2], [2, 2], []],
                    // Controls the multiplicative contribution of the Glyphs texture to each color channel of the underlying image.
                    ['vec3', 'ColorScale', mod.ScreenEffectVectorParameters.Unitology_ColorScale, [0.75, 0.75, 0.75], [-5, -5, -5], [5, 5, 5], []],
                    // Enables LinearFiltering of the texture.
                    ['bool', 'EnableLinearFiltering', mod.ScreenEffectBoolParameters.Unitology_EnableLinearFiltering, true, NoMin, NoMax, []],
                    // Determines if the Unitology texture is stable, or uses random coordinates every frame.
                    ['bool', 'Animate', mod.ScreenEffectBoolParameters.Unitology_Animate, true, NoMin, NoMax, []],
                    // Allows control over glyphs near the middle of the screen.
                    ['float', 'CenterAttenuation', mod.ScreenEffectFloatParameters.Unitology_CenterAttenuation, 0.579, 0, 1, []],
                    // Width scaling for attenuation. Higher values spread the effect in a wider area.
                    ['float', 'CenterScaleWidth', mod.ScreenEffectFloatParameters.Unitology_CenterScaleWidth, 3, 0.5, 3, []],
                    // Height scaling for attenuation. Higher values spread the effect in a taller area.
                    ['float', 'CenterScaleHeight', mod.ScreenEffectFloatParameters.Unitology_CenterScaleHeight, 0.747, 0.5, 3, []],
                ],
            ],
            // Enables the additive Glyphs texture contribution. Unlike ColorScale, Luminance grain can brighten pixels and therefore remains visible over completely black areas.
            // The amount added can be varied according to the luminosity of the underlying pixel using the Shadow/Highlight controls.
            [
                'bool',
                'Luminance',
                mod.ScreenEffectBoolParameters.Unitology_Luminance_Enable,
                false,
                NoMin,
                NoMax,
                [
                    // The cut-off level of luminosity where ShadowIntensity is applied. Luminosity values below this value will have ShadowIntensity applied.
                    // Luminosity values above this will add an amount between ShadowIntensity and HighlightIntensity. This value must be smaller than or equal to HighlightThreshold.
                    ['float', 'ShadowThreshold', mod.ScreenEffectFloatParameters.Unitology_Luminance_ShadowThreshold, 0.25, 0, 1, []],
                    // The level of luminosity where HighlightIntensity is applied. Luminosity values above this value will have HighlightIntensity applied.
                    // Luminosity values below this will add an amount between ShadowIntensity and HighlightIntensity. This value must be larger than or equal to ShadowThreshold.
                    ['float', 'HighlightThreshold', mod.ScreenEffectFloatParameters.Unitology_Luminance_HighlightThreshold, 0.85, 0, 1, []],
                    // The amount of grain added in shadows. This is usually a larger amount (higher value) than the amount of grain in highlight areas (Luminance_HighlightIntensity).
                    ['float', 'ShadowIntensity', mod.ScreenEffectFloatParameters.Unitology_Luminance_ShadowIntensity, 10, -75, 75, []],
                    // The amount of grain added in highlight. This is usually a smaller amount (lower value) than the amount of grain in shadow areas (Luminance_ShadowIntensity).
                    ['float', 'HighlightIntensity', mod.ScreenEffectFloatParameters.Unitology_Luminance_HighlightIntensity, 3, -75, 75, []],
                ],
            ],
        ],
    ],
];

let activatedScreenEffects: [number, mod.ScreenEffects][] = [];
let activatedScreenEffectBoolParameters: mod.ScreenEffectBoolParameters[] = [];
let activatedScreenEffectFloatOscillators: [mod.ScreenEffectFloatParameters, number, number][] = [];
let activatedScreenEffectVectorOscillators: [mod.ScreenEffectVectorParameters, number[], number[], string[]][] = [];
let vectorOscillatorsValues: [mod.ScreenEffectVectorParameters, number, number, number][] = [];
let intParamValues: [mod.ScreenEffectFloatParameters, number, number, number][] = [];
let activateSoldierEffects: [number, mod.SoldierEffects][] = [];

const bgAlphaOff = 0.4;
const bgAlphaOn = 1;

const whiteColor = mod.CreateVector(1.0, 1.0, 1.0);
const blackColor = mod.CreateVector(0, 0, 0);
const opaque = 1;

export function OnPortalGadgetFireStart(player: mod.Player) {
    ShowPlayerInterface(player);
}

export function OnPlayerUIButtonEvent(player: mod.Player, buttonWidget: mod.UIWidget, buttonEvent: any) {
    const widgetName = mod.GetUIWidgetName(buttonWidget);
    const playerID = mod.GetObjId(player);

    // Update the tooltip label which button you just pressed. Unforunately, there is no OnHover buttonEvent.
    for (const iWidget of UIWidgets) {
        const [uiWidgetPlayerID, uiWidget, , uiWidgetTooltip] = iWidget;
        if (playerID == uiWidgetPlayerID) {
            if (widgetName == mod.GetUIWidgetName(uiWidget)) {
                const playerTooltipWidget = mod.FindUIWidgetWithName(`TooltipPlayerID${playerID}label`);
                mod.SetUITextLabel(playerTooltipWidget, mod.Message(uiWidgetTooltip));
                break;
            }
        }
    }

    if (widgetName.startsWith('CloseInterfaceButton')) {
        // Early out -- if you close interface, well, things get easy.
        HidePlayerInterface(player);
        return;
    }

    if (widgetName.startsWith('Enable')) {
        if (widgetName.startsWith('EnableEffect')) {
            const effectIndex = parseInt(widgetName.replace('EnableEffect', ''));
            if (!isNaN(effectIndex)) {
                const [effect] = screenEffects[effectIndex];
                const screenEffectPair: [number, mod.ScreenEffects] = [playerID, effect];

                let found = false;
                for (let i = 0; i < activatedScreenEffects.length; i++) {
                    if (activatedScreenEffects[i][0] === playerID && activatedScreenEffects[i][1] === effect) {
                        activatedScreenEffects.splice(i, 1);
                        mod.EnableScreenEffect(player, effect, false);
                        SetButtonAlpha(buttonWidget, false);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    activatedScreenEffects.push(screenEffectPair);
                    mod.EnableScreenEffect(player, effect, true);
                    SetButtonAlpha(buttonWidget, true);
                }
            }
        } else {
            const soldierEffectIndex = parseInt(widgetName.replace('EnableSE', ''));
            if (!isNaN(soldierEffectIndex)) {
                const [soldierEffect] = soldierEffects[soldierEffectIndex];
                const soldierEffectPair: [number, mod.SoldierEffects] = [playerID, soldierEffect];

                let found = false;
                for (let i = 0; i < activateSoldierEffects.length; i++) {
                    if (activateSoldierEffects[i][0] === playerID && activateSoldierEffects[i][1] === soldierEffect) {
                        activateSoldierEffects.splice(i, 1);
                        mod.SetSoldierEffect(player, soldierEffect, false);
                        SetButtonAlpha(buttonWidget, false);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    activateSoldierEffects.push(soldierEffectPair);
                    mod.SetSoldierEffect(player, soldierEffect, true);
                    SetButtonAlpha(buttonWidget, true);
                }
            }
        }
    } else {
        const [paramType, param, minValue, maxValue, vectorComponent] = FindParam(widgetName) as [string, any, any, any, string];
        if (paramType == 'float') {
            const oscillator: [mod.ScreenEffectFloatParameters, number, number] = [param, minValue, maxValue];
            const existingIndex = activatedScreenEffectFloatOscillators.findIndex((e) => e[0] === param);

            if (existingIndex !== -1) {
                activatedScreenEffectFloatOscillators.splice(existingIndex, 1);
                SetButtonAlphaForAll(buttonWidget, false);
            } else {
                activatedScreenEffectFloatOscillators.push(oscillator);
                SetButtonAlphaForAll(buttonWidget, true);
            }
        }
        if (paramType == 'bool') {
            if (activatedScreenEffectBoolParameters.includes(param)) {
                activatedScreenEffectBoolParameters = activatedScreenEffectBoolParameters.filter((e) => e !== param);
                mod.SetScreenEffectParameter(param, false);
                SetButtonAlphaForAll(buttonWidget, false);
            } else {
                activatedScreenEffectBoolParameters.push(param);
                mod.SetScreenEffectParameter(param, true);
                SetButtonAlphaForAll(buttonWidget, true);
            }
        }
        if (paramType == 'int') {
            for (const intValue of intParamValues) {
                if (intValue[0] == param) {
                    let newValue = intValue[1] + 1;
                    if (newValue > intValue[3]) {
                        newValue = intValue[2];
                    }
                    intValue[1] = newValue;
                    mod.SetScreenEffectParameter(intValue[0], newValue);
                }
            }
        }
        if (paramType.startsWith('vec')) {
            for (const [vectorParam, , , vectorComponents] of activatedScreenEffectVectorOscillators) {
                if (vectorParam == param) {
                    const index = vectorComponents.indexOf(vectorComponent);

                    if (index !== -1) {
                        vectorComponents.splice(index, 1);
                        SetButtonAlphaForAll(buttonWidget, false);
                    } else {
                        vectorComponents.push(vectorComponent);
                        SetButtonAlphaForAll(buttonWidget, true);
                    }
                    break;
                }
            }
        }
    }
    SetPlayerInterfaceVisibility(player, true);
}

function FindParam(widgetName: string): (string | number | any[] | null)[] | null {
    let returnParam: any = '';
    let paramType = '';
    let vectorComponent = '';
    let returnMin: any = '';
    let returnMax: any = '';
    const effectMatch = widgetName.match(/^E(\d+)C(\d+)(?:C(\d+))?(?:C(\d+))?([XYZ])?PlayerID\d+$/);

    if (effectMatch) {
        const effectIndex = parseInt(effectMatch[1]);
        const parameterIndex = parseInt(effectMatch[2]);
        const [, , parameters] = screenEffects[effectIndex];
        const [parameterType, , parameter, , min, max, children] = parameters[parameterIndex];
        if (effectMatch[5]) {
            vectorComponent = effectMatch[5];
        }
        if (effectMatch[3]) {
            let subParameterIndex = parseInt(effectMatch[3]);
            const [childParameterType, , childParameter, , childMin, childMax, subChildren] = children[subParameterIndex];
            if (effectMatch[4]) {
                let subChildParameterIndex = parseInt(effectMatch[4]);
                const [subChildParameterType, , subChildParameter, , subChildMin, subChildMax] = subChildren[subChildParameterIndex];
                paramType = subChildParameterType;
                returnParam = subChildParameter;
                returnMin = subChildMin;
                returnMax = subChildMax;
            } else {
                paramType = childParameterType;
                returnParam = childParameter;
                returnMin = childMin;
                returnMax = childMax;
            }
        } else {
            returnMin = min;
            returnMax = max;

            returnParam = parameter;
            paramType = parameterType as string;
        }
        return [paramType, returnParam, returnMin, returnMax, vectorComponent];
    }
    return null;
}

function SetButtonAlphaForAll(buttonWidget: mod.UIWidget, activated: boolean) {
    // Since ScreenEffects are universal to all players, Update the alpha of buttons for every player.

    let widgetName = mod.GetUIWidgetName(buttonWidget);
    widgetName = widgetName.replace(/PlayerID\d+$/i, '');

    for (const [, iWidget, ,] of UIWidgets) {
        let iWidgetName = mod.GetUIWidgetName(iWidget);
        iWidgetName = iWidgetName.replace(/PlayerID\d+$/i, '');
        if (widgetName == iWidgetName) {
            SetButtonAlpha(iWidget, activated);
        }
    }
}

function SetButtonAlpha(buttonWidget: mod.UIWidget, activated: boolean) {
    const bgAlpha = activated ? bgAlphaOn : bgAlphaOff;

    mod.SetUIWidgetBgAlpha(buttonWidget, bgAlpha);
    mod.SetUIButtonAlphaBase(buttonWidget, bgAlpha);
    mod.SetUIButtonAlphaDisabled(buttonWidget, bgAlpha);
    mod.SetUIButtonAlphaFocused(buttonWidget, bgAlpha);
    mod.SetUIButtonAlphaPressed(buttonWidget, bgAlpha);
    mod.SetUIButtonAlphaHover(buttonWidget, bgAlpha);
}

function HidePlayerInterface(player: mod.Player) {
    SetPlayerInterfaceVisibility(player, false);
}

function ShowPlayerInterface(player: mod.Player) {
    SetPlayerInterfaceVisibility(player, true);
}

function SetPlayerInterfaceVisibility(player: mod.Player, visibility: boolean) {
    const playerID = mod.GetObjId(player);

    for (const iWidget of UIWidgets) {
        const [widgetPlayerID, buttonWidget, labelWidget] = iWidget;
        if (widgetPlayerID == playerID) {
            if (visibility == false) {
                // We don't care if you're supposed to hide children or not, when the UI is closed, everything gets hidden.
                mod.SetUIWidgetVisible(buttonWidget, false);
                mod.SetUIWidgetVisible(labelWidget, false);
            } else {
                // But if the UI is open, let's only show the buttons when their parent control bool is on.
                let isVisible = false;
                const btnName = mod.GetUIWidgetName(buttonWidget);

                if (btnName.startsWith('Enable') || btnName.startsWith('CloseInterfaceButton') || btnName.startsWith('Tooltip')) {
                    // If the UI is open, we always show the main effect buttons, or the button to close the UI
                    isVisible = true;
                } else {
                    // Otherwise, we should check if the controlling BOOL is turned on.

                    const categoryMatch = btnName.match(/^E(\d+)C(\d+)(?:C(\d+))?(?:C(\d+))?([XYZ])?PlayerID\d+$/);

                    if (categoryMatch) {
                        const effectIndex = parseInt(categoryMatch[1], 10);
                        const [effect] = screenEffects[effectIndex];
                        for (let i = 0; i < activatedScreenEffects.length; i++) {
                            if (activatedScreenEffects[i][0] === playerID && activatedScreenEffects[i][1] === effect) {
                                isVisible = true;
                                break;
                            }
                        }
                    }
                }

                mod.SetUIWidgetVisible(buttonWidget, isVisible);
                mod.SetUIWidgetVisible(labelWidget, isVisible);
            }
        }
    }
    mod.EnableUIInputMode(visibility, player);
}

function CreateButton(
    player: mod.Player,
    name: string,
    posX: number,
    posY: number,
    width: number,
    height: number,
    text: string,
    btnEnabled: boolean,
    btnActivated: boolean,
    tooltip: string
) {
    const pos = mod.CreateVector(posX, posY, 0);
    const size = mod.CreateVector(width, height, 0);
    const buttonName = `${name}PlayerID${mod.GetObjId(player)}`;
    const labelName = `${buttonName}label`;
    const uiAnchor = mod.UIAnchor.CenterLeft;
    const textAnchor = mod.UIAnchor.Center;
    const root = mod.GetUIRoot();
    const visibility = false;
    const padding = 0;
    const bgColor = mod.CreateVector(0.8, 0.8, 0.8);
    const btnAlpha = btnActivated ? bgAlphaOn : bgAlphaOff;
    const textbgAlpha = 0;
    const bgFill = mod.UIBgFill.Solid;
    const textbgFilll = mod.UIBgFill.None;
    const baseColor = mod.CreateVector(0.8, 0.8, 0.8);
    const disabledColor = tooltip == 'Tooltip' ? mod.CreateVector(1, 1, 1) : mod.CreateVector(0.8, 0.8, 0.8);
    const disabledalpha = tooltip == 'Tooltip' ? 1.0 : 0.8;
    const pressedColor = mod.CreateVector(0.5, 0.5, 0.5);
    const hoverColor = mod.CreateVector(0.7, 0.9, 0.9);
    const focusedColor = mod.CreateVector(1, 1, 1);
    const uiDepth = mod.UIDepth.AboveGameUI;
    const fontSize = height * 0.8;

    mod.AddUIButton(
        buttonName,
        pos,
        size,
        uiAnchor,
        root,
        visibility,
        padding,
        bgColor,
        btnAlpha,
        bgFill,
        btnEnabled,
        baseColor,
        btnAlpha,
        disabledColor,
        disabledalpha,
        pressedColor,
        btnAlpha,
        hoverColor,
        btnAlpha,
        focusedColor,
        btnAlpha,
        uiDepth,
        player
    );
    let myButton = mod.FindUIWidgetWithName(buttonName);
    mod.AddUIText(
        labelName,
        pos,
        size,
        uiAnchor,
        root,
        visibility,
        padding,
        blackColor,
        textbgAlpha,
        textbgFilll,
        mod.Message(text),
        fontSize,
        blackColor,
        opaque,
        textAnchor,
        uiDepth,
        player
    );
    let myLabel = mod.FindUIWidgetWithName(labelName);

    let newWidgetEntry: [number, mod.UIWidget, mod.UIWidget, string] = [mod.GetObjId(player), myButton, myLabel, tooltip];
    UIWidgets.push(newWidgetEntry);
}

export async function OnPlayerDeployed(player: mod.Player) {
    let players = mod.AllPlayers();
    let n = mod.CountOf(players);
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        console.log('LOG> Found a player: ', mod.GetObjId(player));

        // Grant Recon Drone to the player. Could be useful to watch things from different angles.
        mod.AddEquipment(player, mod.Gadgets.Deployable_Recon_Drone, mod.InventorySlots.GadgetOne);

        // Grant the Portal Gadget to the player. Allows opening the User interface.
        mod.AddEquipment(player, mod.Gadgets.Misc_PortalGadget, mod.InventorySlots.GadgetTwo);
    } else {
        // Remove all equipment from AI players to avoid them killing us.
        if (GetRandomBool()) {
            mod.SetSoldierEffect(player, mod.SoldierEffects.ShadowSilhouette, true);
        }

        if (GetRandomBool()) {
            mod.SetSoldierEffect(player, mod.SoldierEffects.NecromorphEffects, true);
        }

        mod.RemoveEquipment(player, mod.InventorySlots.PrimaryWeapon);
        mod.RemoveEquipment(player, mod.InventorySlots.SecondaryWeapon);
        mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne);
        mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo);
        mod.RemoveEquipment(player, mod.InventorySlots.Throwable);
        mod.RemoveEquipment(player, mod.InventorySlots.MeleeWeapon);
    }
}

export async function OnPlayerInteract(player: mod.Player, interactPoint: mod.InteractPoint) {
    let ShowObjID = true;
    const interactPointId = mod.GetObjId(interactPoint);

    if (interactPointId < 100) {
        let soldierClass: mod.SoldierClass;

        // Wipe all AI
        for (let i = 0; i < 8; i++) {
            mod.UnspawnAllAIsFromAISpawner(mod.GetSpawner(10 + i)); // All Assault Spawners
            mod.UnspawnAllAIsFromAISpawner(mod.GetSpawner(20 + i)); // All Recon Spawners
            mod.UnspawnAllAIsFromAISpawner(mod.GetSpawner(30 + i)); // All Engineer Spawners
            mod.UnspawnAllAIsFromAISpawner(mod.GetSpawner(40 + i)); // All Support Spawners
        }

        await mod.Wait(0.5); // Wait for the AI to be unspawned before spawning new ones.

        if (mod.Equals(interactPoint, Interactor_SpawnAssault)) {
            soldierClass = mod.SoldierClass.Assault;
        }

        if (mod.Equals(interactPoint, Interactor_SpawnSupport)) {
            soldierClass = mod.SoldierClass.Support;
        }

        if (mod.Equals(interactPoint, Interactor_SpawnRecon)) {
            soldierClass = mod.SoldierClass.Recon;
        }

        if (mod.Equals(interactPoint, Interactor_SpawnEngineer)) {
            soldierClass = mod.SoldierClass.Engineer;
        }

        // Spawn 8 AI

        let baseSpawnerAI = mod.GetObjId(interactPoint) * 10;
        let soldierVariation = [
            mod.AIVariation.Random,
            mod.AIVariation.Skin1,
            mod.AIVariation.Skin2,
            mod.AIVariation.Skin3,
            mod.AIVariation.Skin4,
            mod.AIVariation.Skin5,
            mod.AIVariation.Skin6,
            mod.AIVariation.MarkedSoldier,
        ];
        let soldierNames = [
            mod.Message('random'),
            mod.Message('skin1'),
            mod.Message('skin2'),
            mod.Message('skin3'),
            mod.Message('skin4'),
            mod.Message('skin5'),
            mod.Message('skin6'),
            mod.Message('markedSoldier'),
        ];

        for (let i = 0; i < 8; i++) {
            const n = i % soldierVariation.length;
            mod.SpawnAIFromAISpawner(mod.GetSpawner(baseSpawnerAI + i), soldierClass!, soldierVariation[n], soldierNames[n]);
        }
    }
}

function updateIcons() {
    let spawnAssaultIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_SpawnAssault));
    mod.SetWorldIconColor(spawnAssaultIcon, whiteColor);
    mod.SetWorldIconText(spawnAssaultIcon, mod.Message('spawnAssault'));
    mod.EnableWorldIconText(spawnAssaultIcon, true);

    let spawnSupportIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_SpawnSupport));
    mod.SetWorldIconColor(spawnSupportIcon, whiteColor);
    mod.SetWorldIconText(spawnSupportIcon, mod.Message('spawnSupport'));
    mod.EnableWorldIconText(spawnSupportIcon, true);

    let spawnReconIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_SpawnRecon));
    mod.SetWorldIconColor(spawnReconIcon, whiteColor);
    mod.SetWorldIconText(spawnReconIcon, mod.Message('spawnRecon'));
    mod.EnableWorldIconText(spawnReconIcon, true);

    let spawnEngineerIcon = mod.GetWorldIcon(mod.GetObjId(Interactor_SpawnEngineer));
    mod.SetWorldIconColor(spawnEngineerIcon, whiteColor);
    mod.SetWorldIconText(spawnEngineerIcon, mod.Message('spawnEngineer'));
    mod.EnableWorldIconText(spawnEngineerIcon, true);
}

export function OnPlayerJoinGame(player: mod.Player) {
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        CreateUserInterface(player);
    }
}

function CreateUserInterface(player: mod.Player) {
    CreateButton(player, 'CloseInterfaceButton', 1700, -500, 40, 40, 'X', true, true, 'X');
    CreateButton(player, 'Tooltip', 650, 450, 600, 50, 'Tooltip', false, false, 'Tooltip');

    const leftButtonX = 350;
    let effectY = -500;

    for (const [elementIndex, [effect, effectName, categories]] of screenEffects.entries()) {
        // Creates the Primary Effect Toggle Button
        CreateButton(player, `EnableEffect${elementIndex}`, leftButtonX, effectY, 150, 20, effectName, true, false, effectName);

        let xOffset = 0;
        const minCategoryWidth = 130;
        let effectHeight = 0;

        for (const [categoryIndex, category] of categories.entries()) {
            const [parameterType, displayName, , defaultValue, , , children] = category;
            if (parameterType != 'base' && categoryIndex == 0) {
                // If the first category is Virtual or Bool, we offset the right.
                // This is so "Base" category and children appear directly under the Effect button.
                xOffset += 160;
            }

            // This measures the total Height required for the effect and its children.
            effectHeight = Math.max(effectHeight, 50);

            const toggleSpacing = 18;
            let xToggleOffset = 0;
            const childY = effectY + 37;
            for (const [childIndex, child] of children.entries()) {
                const [childParamType, childDisplayName, , childDefaultValue, , , subChildrens] = child;
                if (childParamType == 'vec3') {
                    CreateButton(
                        player,
                        `E${elementIndex}C${categoryIndex}C${childIndex}X`,
                        leftButtonX + xOffset + xToggleOffset,
                        childY - 17,
                        16,
                        16,
                        'X',
                        true,
                        false,
                        childDisplayName as string
                    );
                    CreateButton(
                        player,
                        `E${elementIndex}C${categoryIndex}C${childIndex}Y`,
                        leftButtonX + xOffset + xToggleOffset,
                        childY,
                        16,
                        16,
                        'Y',
                        true,
                        false,
                        childDisplayName as string
                    );
                    CreateButton(
                        player,
                        `E${elementIndex}C${categoryIndex}C${childIndex}Z`,
                        leftButtonX + xOffset + xToggleOffset,
                        childY + 17,
                        16,
                        16,
                        'Z',
                        true,
                        false,
                        childDisplayName as string
                    );
                } else if (childParamType == 'vec2') {
                    CreateButton(
                        player,
                        `E${elementIndex}C${categoryIndex}C${childIndex}X`,
                        leftButtonX + xOffset + xToggleOffset,
                        childY - 9,
                        16,
                        16,
                        'X',
                        true,
                        false,
                        childDisplayName as string
                    );
                    CreateButton(
                        player,
                        `E${elementIndex}C${categoryIndex}C${childIndex}Y`,
                        leftButtonX + xOffset + xToggleOffset,
                        childY + 9,
                        16,
                        16,
                        'Y',
                        true,
                        false,
                        childDisplayName as string
                    );
                } else if (childParamType == 'bool') {
                    let subChildrenWidth = Math.max(0, subChildrens.length - 1) * toggleSpacing + 16;

                    let xSubOffset = 0;
                    for (const [subChildIndex, subChild] of subChildrens.entries()) {
                        const [subChildParamType, subChildDisplayName, , subChildDefaultValue, ,] = subChild;
                        effectHeight = Math.max(effectHeight, 100);

                        if (subChildParamType == 'vec3') {
                            CreateButton(
                                player,
                                `E${elementIndex}C${categoryIndex}C${childIndex}C${subChildIndex}X`,
                                leftButtonX + xOffset + xToggleOffset + xSubOffset,
                                childY + 50 - 17,
                                16,
                                16,
                                'X',
                                true,
                                false,
                                subChildDisplayName as string
                            );
                            CreateButton(
                                player,
                                `E${elementIndex}C${categoryIndex}C${childIndex}C${subChildIndex}Y`,
                                leftButtonX + xOffset + xToggleOffset + xSubOffset,
                                childY + 50,
                                16,
                                16,
                                'Y',
                                true,
                                false,
                                subChildDisplayName as string
                            );
                            CreateButton(
                                player,
                                `E${elementIndex}C${categoryIndex}C${childIndex}C${subChildIndex}Z`,
                                leftButtonX + xOffset + xToggleOffset + xSubOffset,
                                childY + 50 + 17,
                                16,
                                16,
                                'Z',
                                true,
                                false,
                                subChildDisplayName as string
                            );
                        } else if (subChildParamType == 'vec2') {
                            CreateButton(
                                player,
                                `E${elementIndex}C${categoryIndex}C${childIndex}C${subChildIndex}X`,
                                leftButtonX + xOffset + xToggleOffset + xSubOffset,
                                childY + 50 - 9,
                                16,
                                16,
                                'X',
                                true,
                                false,
                                subChildDisplayName as string
                            );
                            CreateButton(
                                player,
                                `E${elementIndex}C${categoryIndex}C${childIndex}C${subChildIndex}Y`,
                                leftButtonX + xOffset + xToggleOffset + xSubOffset,
                                childY + 50 + 9,
                                16,
                                16,
                                'Y',
                                true,
                                false,
                                subChildDisplayName as string
                            );
                        } else {
                            let buttonActive = false;
                            if (subChildParamType == 'bool') {
                                buttonActive = subChildDefaultValue as boolean;
                            }
                            CreateButton(
                                player,
                                `E${elementIndex}C${categoryIndex}C${childIndex}C${subChildIndex}`,
                                leftButtonX + xOffset + xToggleOffset + xSubOffset,
                                childY + 50,
                                16,
                                16,
                                subChildParamType == 'bool' ? 'B' : subChildParamType == 'float' ? 'F' : 'I',
                                true,
                                buttonActive,
                                subChildDisplayName as string
                            );
                        }
                        xSubOffset += toggleSpacing;
                    }
                    let buttonActive = childDefaultValue as boolean;
                    CreateButton(
                        player,
                        `E${elementIndex}C${categoryIndex}C${childIndex}`,
                        leftButtonX + xOffset + xToggleOffset,
                        childY,
                        subChildrenWidth,
                        16,
                        childParamType == 'bool' ? 'B' : childParamType == 'float' ? 'F' : 'I',
                        true,
                        buttonActive,
                        childDisplayName as string
                    );
                    xToggleOffset += xSubOffset;
                } else {
                    CreateButton(
                        player,
                        `E${elementIndex}C${categoryIndex}C${childIndex}`,
                        leftButtonX + xOffset + xToggleOffset,
                        childY,
                        16,
                        16,
                        childParamType == 'bool' ? 'B' : childParamType == 'float' ? 'F' : 'I',
                        true,
                        false,
                        childDisplayName as string
                    );
                }
                xToggleOffset += toggleSpacing;
            }

            // We only create the buttons at the top once we know the total horizontal space used by this category.
            let categoryWidth = Math.max(130, xToggleOffset);

            if (parameterType == 'bool') {
                let buttonActive = defaultValue as boolean;
                CreateButton(
                    player,
                    `E${elementIndex}C${categoryIndex}`,
                    leftButtonX + xOffset,
                    effectY,
                    categoryWidth,
                    14,
                    displayName as string,
                    true,
                    buttonActive,
                    displayName as string
                );
            }
            if (parameterType == 'virtual') {
                // Virtual buttons are unclickable, because there's no Bool control parameter to control them, but they still house a subset of parameters.
                CreateButton(
                    player,
                    `E${elementIndex}C${categoryIndex}`,
                    leftButtonX + xOffset,
                    effectY,
                    categoryWidth,
                    14,
                    displayName as string,
                    false,
                    true,
                    displayName as string
                );
            }
            if (parameterType == 'base') {
                // Any "base" settings fall directly under the button of the Effect itself.
                // However, as Effects have larger buttons, we must extend the category width to accommodate them.

                categoryWidth = Math.max(160, xToggleOffset);
            }

            xOffset += Math.max(minCategoryWidth, categoryWidth) + 10;
        }
        effectY += 25 + effectHeight;
    }

    // Lists the Soldier Effects buttons on the right-hand side of the screen
    const soldierEffectsButtonX = 1400;
    effectY = -500;
    for (const [elementIndex, [soldierEffect, soldierEffectDisplayName]] of soldierEffects.entries()) {
        CreateButton(
            player,
            `EnableSE${elementIndex}`,
            soldierEffectsButtonX,
            effectY,
            200,
            20,
            soldierEffectDisplayName,
            true,
            false,
            soldierEffectDisplayName
        );
        effectY += 25;
    }
}

function initScreenEffectDefaultParameters() {
    // Initialize all screen effect parameters to their default value.
    for (const [, , categories] of screenEffects) {
        initScreenEffectDefaults(categories);
    }
}

function initScreenEffectDefaults(paramData: Parameter[]) {
    // Recursive function to initialize default values for all screen effect parameters, including nested children.
    for (const [parameterType, , parameter, defaultValue, minValue, maxValue, paramChildren] of paramData) {
        SetDefaultScreenEffectParameter(parameterType as string, parameter, defaultValue, minValue, maxValue);
        if (paramChildren.length > 0) {
            initScreenEffectDefaults(paramChildren);
        }
    }
}

export async function OnGameModeStarted() {
    console.log('Running Mod Script Dated: 2026-04-16 17:54:46.156379');

    Interactor_SpawnAssault = mod.GetInteractPoint(1);
    Interactor_SpawnRecon = mod.GetInteractPoint(2);
    Interactor_SpawnEngineer = mod.GetInteractPoint(3);
    Interactor_SpawnSupport = mod.GetInteractPoint(4);

    // World Icons do not have their text or images set in the mmt file and must be set at runtime. This call handles both the initial setup and any updates to the World Icon text or color when the player interacts with the Interact Points.
    updateIcons();

    initScreenEffectDefaultParameters();

    let t = 0.0; //Time at start
    let dT = 0.033; //Time between ticks / deltaTime

    while (true) {
        t += dT;

        for (const [oscillator, minValue, maxValue] of activatedScreenEffectFloatOscillators) {
            let frequency = 120;
            const lT = CosFromDegrees(t * frequency) * 0.5 + 0.5; // Calculate the oscillation value for the current time step, from 0 to 1
            const oscillationValue = minValue + lT * (maxValue - minValue); // Map the oscillation value to the range of the float parameter
            mod.SetScreenEffectParameter(oscillator, oscillationValue);
        }

        for (const [oscillator, minValue, maxValue, vectorComponents] of activatedScreenEffectVectorOscillators) {
            for (let i = 0; i < vectorOscillatorsValues.length; i++) {
                const [param, x, y, z] = vectorOscillatorsValues[i];

                if (param === oscillator) {
                    // Make a copy of the current values so we can modify them.
                    let foundValues = [x, y, z];
                    let hasChanged = false;

                    if (vectorComponents.includes('X')) {
                        let frequency = 115;
                        const lT = CosFromDegrees(t * frequency) * 0.5 + 0.5;
                        foundValues[0] = minValue[0] + lT * (maxValue[0] - minValue[0]);
                        vectorOscillatorsValues[i][1] = foundValues[0];
                        hasChanged = true;
                    }
                    if (vectorComponents.includes('Y')) {
                        let frequency = 120;
                        frequency--;
                        const lT = CosFromDegrees(t * frequency) * 0.5 + 0.5;
                        foundValues[1] = minValue[1] + lT * (maxValue[1] - minValue[1]);
                        vectorOscillatorsValues[i][2] = foundValues[1];
                        hasChanged = true;
                    }
                    if (vectorComponents.includes('Z')) {
                        let frequency = 125;
                        frequency--;
                        const lT = CosFromDegrees(t * frequency) * 0.5 + 0.5;
                        foundValues[2] = minValue[2] + lT * (maxValue[2] - minValue[2]);
                        vectorOscillatorsValues[i][3] = foundValues[2];
                        hasChanged = true;
                    }

                    if (hasChanged) {
                        const vectorValue = mod.CreateVector(foundValues[0], foundValues[1], foundValues[2]);
                        mod.SetScreenEffectParameter(oscillator, vectorValue);
                    }
                    break;
                }
            }
        }
        await mod.Wait(dT);
    }
}

function SetDefaultScreenEffectParameter(paramType: string, parameter: any, defaultValue: any, minValue: any, maxValue: any) {
    const validTypes = ['bool', 'float', 'int', 'vec2', 'vec3'];
    if (validTypes.includes(paramType)) {
        if (paramType.startsWith('vec')) {
            // All Vectors oscillators are created on Game Mode started, but they have no VectorComponent listed in the array, which means they do not oscillate.
            const vectorDefault = mod.CreateVector(defaultValue[0], defaultValue[1], defaultValue[2] ?? 0);
            mod.SetScreenEffectParameter(parameter, vectorDefault);
            vectorOscillatorsValues.push([parameter, defaultValue[0], defaultValue[1], defaultValue[2] ?? 0]);
            activatedScreenEffectVectorOscillators.push([
                parameter,
                [minValue[0], minValue[1], minValue[2] ?? 0],
                [maxValue[0], maxValue[1], maxValue[2] ?? 0],
                [],
            ]);
        } else {
            // Bool Parameters that are default True are added to the activatedScreenEffectBoolParameters array.
            mod.SetScreenEffectParameter(parameter, defaultValue);
            if (paramType == 'bool' && defaultValue == true) {
                activatedScreenEffectBoolParameters.push(parameter);
            }

            // Int params are added to the intParamValues array with default, min, and max values. Currently, this only applieso to a single parameter.
            if (paramType == 'int') {
                intParamValues.push([parameter, defaultValue, minValue, maxValue]);
            }
        }
    }
}

function CosFromDegrees(degrees: number) {
    // Using JS Math functions rather than calling the much more expensive mod.CosineFromDegrees function.
    return Math.cos(degrees * (Math.PI / 180));
}

function GetRandomBool() {
    return Math.random() < 0.5;
}
