import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SettingsSectionProps {
    title: string;
    children: ReactNode;
    className?: string;
    visible?: boolean;
}

/**
 * Reusable section component for grouping settings
 * Provides a title and contains child settings
 */
export function SettingsSection({
    title,
    children,
    className,
    visible = true
}: SettingsSectionProps) {
    if (!visible) return null;

    return (
        <div className={cn('flex flex-col gap-4', className)}>
            {/* Section title */}
            <h3 className="text-lg font-semibold text-slate-300 tracking-wide">
                {title}
            </h3>

            {/* Section content */}
            <div className="flex flex-col gap-4 pl-1">
                {children}
            </div>
        </div>
    );
}
