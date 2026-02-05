import { SettingsSection, SettingsSlider } from '../controls';
import { SettingsState } from '../../types/settings.types';
import { LABELS, SLIDER_CONSTRAINTS } from '../../constants/settings.constants';

interface SoundTabProps {
    settings: SettingsState;
    onEffectVolumeChange: (value: number) => void;
    onMusicVolumeChange: (value: number) => void;
    onMasterVolumeChange: (value: number) => void;
}

/**
 * Sound settings tab
 * Contains: Volume sliders for effects, music, and master
 */
export function SoundTab({
    settings,
    onEffectVolumeChange,
    onMusicVolumeChange,
    onMasterVolumeChange
}: SoundTabProps) {
    // Format volume as percentage
    const formatVolume = (value: number) => `${Math.round(value * 100)}%`;

    return (
        <div className="flex flex-col gap-6">
            <SettingsSection title={LABELS.sections.sound}>
                {/* Master Volume */}
                <SettingsSlider
                    label={LABELS.settings.masterVolume}
                    value={settings.masterVolume}
                    min={SLIDER_CONSTRAINTS.volume.min}
                    max={SLIDER_CONSTRAINTS.volume.max}
                    step={SLIDER_CONSTRAINTS.volume.step}
                    onChange={onMasterVolumeChange}
                    showValue
                    formatValue={formatVolume}
                />

                {/* Music Volume */}
                <SettingsSlider
                    label={LABELS.settings.musicVolume}
                    value={settings.musicVolume}
                    min={SLIDER_CONSTRAINTS.volume.min}
                    max={SLIDER_CONSTRAINTS.volume.max}
                    step={SLIDER_CONSTRAINTS.volume.step}
                    onChange={onMusicVolumeChange}
                    showValue
                    formatValue={formatVolume}
                />

                {/* Effects Volume */}
                <SettingsSlider
                    label={LABELS.settings.effectVolume}
                    value={settings.effectVolume}
                    min={SLIDER_CONSTRAINTS.volume.min}
                    max={SLIDER_CONSTRAINTS.volume.max}
                    step={SLIDER_CONSTRAINTS.volume.step}
                    onChange={onEffectVolumeChange}
                    showValue
                    formatValue={formatVolume}
                />
            </SettingsSection>
        </div>
    );
}
