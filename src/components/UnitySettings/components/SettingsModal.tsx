import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsSidebar } from './SettingsSidebar';
import { GeneralTab, SoundTab, AccessibilityTab, AvatarTab } from './tabs';
import { UseUnitySettingsReturn } from '../types/settings.types';

interface SettingsModalProps {
    settingsHook: UseUnitySettingsReturn;
    portalContainer?: HTMLElement | null;
}

/**
 * Main Settings Modal component
 * Displays the settings UI with sidebar navigation and tab content
 */
export function SettingsModal({ settingsHook, portalContainer }: SettingsModalProps) {
    const {
        settings,
        isOpen,
        activeTab,
        isLoading,
        closeModal,
        setActiveTab,
        setViewType,
        setZoomSensitivity,
        setCameraSensitivity,
        setMapMovementType,
        setEffectVolume,
        setMusicVolume,
        setMasterVolume,
        toggleControlScheme,
        isSchemeActive,
        enterAvatarCustomization
    } = settingsHook;

    // Handle ESC key to close modal
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
            closeModal();
        }
    }, [isOpen, closeModal]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Custom styles for slider */}
            <style>{`
                .settings-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 6px;
                    border-radius: 3px;
                    background: linear-gradient(
                        to right,
                        #237ECE 0%,
                        #237ECE var(--slider-percentage, 50%),
                        #374151 var(--slider-percentage, 50%),
                        #374151 100%
                    );
                    cursor: pointer;
                }

                .settings-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid #237ECE;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    transition: transform 0.1s ease;
                }

                .settings-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                }

                .settings-slider::-webkit-slider-thumb:active {
                    transform: scale(0.95);
                }

                .settings-slider::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid #237ECE;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .settings-slider::-moz-range-track {
                    height: 6px;
                    border-radius: 3px;
                    background: #374151;
                }

                .settings-slider:focus {
                    outline: none;
                }

                .settings-slider:focus::-webkit-slider-thumb {
                    box-shadow: 0 0 0 3px rgba(35, 126, 206, 0.3);
                }
            `}</style>

            {/* Backdrop */}
            <div
                className={cn(
                    'absolute inset-0 z-50',
                    'bg-black/60 backdrop-blur-sm',
                    'flex items-center justify-center p-4',
                    'animate-in fade-in duration-200'
                )}
                onClick={handleBackdropClick}
            >
                {/* Modal container */}
                <div
                    className={cn(
                        'relative w-full max-w-6xl h-[65vh]',
                        'bg-gradient-to-br from-[#1a2332] to-[#0f1520]',
                        'rounded-xl shadow-2xl border border-slate-700/50',
                        'flex overflow-hidden',
                        'animate-in zoom-in-95 duration-200'
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={closeModal}
                        className={cn(
                            'absolute top-4 right-4 z-10',
                            'p-2 rounded-lg',
                            'text-slate-400 hover:text-blue-400 hover:bg-slate-700/50',
                            'transition-colors duration-150'
                        )}
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Sidebar */}
                    <div className="w-56 bg-[#0d1117] border-r border-slate-700/50 p-6">
                        <SettingsSidebar
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />
                    </div>

                    {/* Content area */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        {/* Tab title - Dynamic based on active tab */}
                        <h2 className="text-2xl font-semibold text-slate-100 mb-6">
                            {activeTab === 'general' && 'Paramètres généraux'}
                            {activeTab === 'sound' && 'Paramètres audio'}
                            {activeTab === 'accessibility' && 'Accessibilité'}
                            {activeTab === 'avatar' && 'Personnalisation'}
                        </h2>

                        {/* Loading state */}
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 border-2 border-[#237ECE] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-slate-400 text-sm">
                                        Chargement des paramètres...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* General Tab */}
                                {activeTab === 'general' && (
                                    <GeneralTab
                                        settings={settings}
                                        onViewTypeChange={setViewType}
                                        onZoomSensitivityChange={setZoomSensitivity}
                                        onCameraSensitivityChange={setCameraSensitivity}
                                        onMapMovementTypeChange={setMapMovementType}
                                        onToggleScheme={toggleControlScheme}
                                        isSchemeActive={isSchemeActive}
                                    />
                                )}

                                {/* Sound Tab */}
                                {activeTab === 'sound' && (
                                    <SoundTab
                                        settings={settings}
                                        onEffectVolumeChange={setEffectVolume}
                                        onMusicVolumeChange={setMusicVolume}
                                        onMasterVolumeChange={setMasterVolume}
                                    />
                                )}

                                {/* Accessibility Tab */}
                                {activeTab === 'accessibility' && (
                                    <AccessibilityTab />
                                )}

                                {/* Avatar Tab */}
                                {activeTab === 'avatar' && (
                                    <AvatarTab 
                                        onEnterCustomization={enterAvatarCustomization}
                                        onCloseModal={closeModal}
                                        portalContainer={portalContainer}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}