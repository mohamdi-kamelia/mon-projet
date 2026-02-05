import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface SettingsToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

/**
 * Reusable toggle/checkbox component for settings
 * Styled to match the Unity settings UI with circular blue checkmark
 */
export function SettingsToggle({
    label,
    description,
    checked,
    onChange,
    disabled = false,
    className
}: SettingsToggleProps) {
    const handleClick = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) {
                onChange(!checked);
            }
        }
    };

    return (
        <div className={cn('flex flex-col gap-1', className)}>
            <div 
                className={cn(
                    'flex items-center gap-3 cursor-pointer group',
                    disabled && 'cursor-not-allowed opacity-50'
                )}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                role="checkbox"
                aria-checked={checked}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
            >
                {/* Circular checkbox */}
                <div
                    className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center',
                        'border-2 transition-all duration-150',
                        checked
                            ? 'bg-[#237ECE] border-[#237ECE]'
                            : 'bg-transparent border-slate-500 group-hover:border-slate-400'
                    )}
                >
                    {checked && (
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    )}
                </div>

                {/* Label */}
                <span className={cn(
                    'text-sm font-medium',
                    checked ? 'text-white' : 'text-slate-300'
                )}>
                    {label}
                </span>
            </div>

            {/* Description */}
            {description && (
                <p className="text-xs text-slate-500 ml-9 italic">
                    {description}
                </p>
            )}
        </div>
    );
}
