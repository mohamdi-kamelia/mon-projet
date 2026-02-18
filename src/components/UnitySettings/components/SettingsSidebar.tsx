import { cn } from '@/lib/utils';
import { SettingsTab } from '../types/settings.types';
import { LABELS } from '../constants/settings.constants';
import { Settings, Volume2, Accessibility, User } from 'lucide-react';

interface SettingsSidebarProps {
    activeTab: SettingsTab;
    onTabChange: (tab: SettingsTab) => void;
}

/**
 * Settings sidebar component
 * Displays navigation tabs on the left side
 */
export function SettingsSidebar({
    activeTab,
    onTabChange
}: SettingsSidebarProps) {
    // Defines the order of tabs
    const tabs: SettingsTab[] = ['general', 'sound', 'accessibility', 'avatar'];

    // Map tabs to their icons
    const icons: Record<SettingsTab, React.ReactNode> = {
        general: <Settings className="w-4 h-4" />,
        sound: <Volume2 className="w-4 h-4" />,
        accessibility: <Accessibility className="w-4 h-4" />,
        avatar: <User className="w-4 h-4" />
    };

    return (
        <div className="flex flex-col gap-2 min-w-[180px]">
            {/* Title */}
            <h2 className="text-xl font-bold text-slate-200 tracking-widest uppercase mb-4 px-2">
                Paramètres
            </h2>

            {/* Tab buttons */}
            <nav className="flex flex-col gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={cn(
                            'px-4 py-3 rounded-lg text-left transition-all duration-150',
                            'text-sm font-medium flex items-center gap-3',
                            activeTab === tab
                                ? 'bg-[#237ECE] text-white shadow-md'
                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-blue-400'
                        )}
                    >
                        {icons[tab]}
                        {LABELS.tabs[tab]}
                    </button>
                ))}
            </nav>
        </div>
    );
}