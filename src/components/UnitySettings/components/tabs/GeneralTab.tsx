import { 
    SettingsSection, 
    SettingsDropdown, 
    SettingsSlider, 
    SettingsToggle 
} from '../controls';
import { 
    EViewType, 
    EMapMovementType, 
    ControlSchemeName,
    SettingsState 
} from '../../types/settings.types';
import { 
    LABELS, 
    SLIDER_CONSTRAINTS,
    getSchemeVisibility 
} from '../../constants/settings.constants';

interface GeneralTabProps {
    settings: SettingsState;
    onViewTypeChange: (value: EViewType) => void;
    onZoomSensitivityChange: (value: number) => void;
    onCameraSensitivityChange: (value: number) => void;
    onMapMovementTypeChange: (value: EMapMovementType) => void;
    onToggleScheme: (schemeName: ControlSchemeName) => void;
    isSchemeActive: (schemeName: ControlSchemeName) => boolean;
}

/**
 * General settings tab
 * Contains: Camera, Controls, Map Movement sections
 */
export function GeneralTab({
    settings,
    onViewTypeChange,
    onZoomSensitivityChange,
    onCameraSensitivityChange,
    onMapMovementTypeChange,
    onToggleScheme,
    isSchemeActive
}: GeneralTabProps) {
    const { viewType, deviceType } = settings;
    const isIsometric = viewType === EViewType.ISOMETRIC;
    const schemeVisibility = getSchemeVisibility(viewType, deviceType);

    // View type dropdown options
    const viewTypeOptions = [
        { value: EViewType.ISOMETRIC, label: LABELS.viewTypes[EViewType.ISOMETRIC] },
        { value: EViewType.THIRD_PERSON, label: LABELS.viewTypes[EViewType.THIRD_PERSON] }
    ];

    // Map movement dropdown options
    const mapMovementOptions = [
        { value: EMapMovementType.GPS, label: LABELS.mapMovementTypes[EMapMovementType.GPS] },
        { value: EMapMovementType.AUTOMATIC, label: LABELS.mapMovementTypes[EMapMovementType.AUTOMATIC] },
        { value: EMapMovementType.TELEPORT, label: LABELS.mapMovementTypes[EMapMovementType.TELEPORT] }
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Camera Section */}
            <SettingsSection title={LABELS.sections.camera}>
                <SettingsDropdown
                    label={LABELS.settings.viewType}
                    value={viewType}
                    options={viewTypeOptions}
                    onChange={onViewTypeChange}
                />
            </SettingsSection>

            {/* Camera Zoom Section - Only for Isometric */}
            <SettingsSection 
                title={LABELS.sections.cameraZoom} 
                visible={isIsometric}
            >
                <SettingsSlider
                    label={LABELS.settings.zoomSpeed}
                    value={settings.isometricZoomSensitivity}
                    min={SLIDER_CONSTRAINTS.zoomSensitivity.min}
                    max={SLIDER_CONSTRAINTS.zoomSensitivity.max}
                    step={SLIDER_CONSTRAINTS.zoomSensitivity.step}
                    onChange={onZoomSensitivityChange}
                />
            </SettingsSection>

            {/* Camera Sensitivity Section - Only for Third Person */}
            <SettingsSection 
                title={LABELS.sections.cameraSensitivity} 
                visible={!isIsometric}
            >
                <SettingsSlider
                    label={LABELS.settings.cameraSensitivity}
                    value={settings.thirdPersonRotationSensitivity}
                    min={SLIDER_CONSTRAINTS.cameraSensitivity.min}
                    max={SLIDER_CONSTRAINTS.cameraSensitivity.max}
                    step={SLIDER_CONSTRAINTS.cameraSensitivity.step}
                    onChange={onCameraSensitivityChange}
                />
            </SettingsSection>

            {/* Movement Controls Section */}
            <SettingsSection title={LABELS.sections.movementControls}>
                <div className="grid grid-cols-2 gap-4">
                    {/* ZQSD Toggle */}
                    {schemeVisibility.zqsd && (
                        <SettingsToggle
                            label={LABELS.controlSchemes.ZQSD}
                            checked={isSchemeActive('ZQSD')}
                            onChange={() => onToggleScheme('ZQSD')}
                        />
                    )}

                    {/* Arrows Toggle */}
                    {schemeVisibility.arrows && (
                        <SettingsToggle
                            label={LABELS.controlSchemes.Arrows}
                            checked={isSchemeActive('Arrows')}
                            onChange={() => onToggleScheme('Arrows')}
                        />
                    )}

                    {/* Virtual Joystick Toggle */}
                    {schemeVisibility.joystick && (
                        <SettingsToggle
                            label={LABELS.controlSchemes.Joystick}
                            description={LABELS.controlSchemeDescriptions.Joystick}
                            checked={isSchemeActive('Joystick')}
                            onChange={() => onToggleScheme('Joystick')}
                        />
                    )}

                    {/* Point & Click Toggle */}
                    {schemeVisibility.pointAndClick && (
                        <SettingsToggle
                            label={LABELS.controlSchemes.PointAndClick}
                            description={LABELS.controlSchemeDescriptions.PointAndClick}
                            checked={isSchemeActive('PointAndClick')}
                            onChange={() => onToggleScheme('PointAndClick')}
                        />
                    )}
                </div>
            </SettingsSection>

            {/* Map Movement Section */}
            <SettingsSection title={LABELS.sections.mapMovement}>
                <SettingsDropdown
                    label={LABELS.settings.mapMovement}
                    value={settings.mapMovementType}
                    options={mapMovementOptions}
                    onChange={onMapMovementTypeChange}
                />
            </SettingsSection>

            {/* Interactions Section */}
            <SettingsSection title={LABELS.sections.interactions}>
                <p className="text-sm text-slate-400 italic">
                    {LABELS.interactionHint}
                </p>
            </SettingsSection>
        </div>
    );
}
