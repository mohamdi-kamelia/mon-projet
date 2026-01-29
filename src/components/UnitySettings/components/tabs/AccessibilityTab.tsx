import { SettingsSection } from '../controls';

/**
 * Accessibility settings tab
 * Currently empty placeholder
 */
export function AccessibilityTab() {
    return (
        <div className="flex flex-col gap-6">
            <SettingsSection title="Accessibilité">
                <div className="bg-[#1e2a3a]/50 border border-slate-700/50 rounded-lg p-6 text-center">
                    <p className="text-slate-400">
                        Paramètres d'accessibilité à venir.
                    </p>
                </div>
            </SettingsSection>
        </div>
    );
}