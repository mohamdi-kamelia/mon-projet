import { cn } from '@/lib/utils';

interface SettingsSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    className?: string;
    showValue?: boolean;
    formatValue?: (value: number) => string;
}

/**
 * Reusable slider component for settings
 * Styled to match the Unity settings UI
 */
export function SettingsSlider({
    label,
    value,
    min,
    max,
    step = 0.01,
    onChange,
    className,
    showValue = false,
    formatValue = (v) => v.toFixed(2)
}: SettingsSliderProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        onChange(newValue);
    };

    // Calculate percentage for custom styling
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className="flex items-center justify-between">
                <label className="text-sm text-slate-400 font-medium">
                    {label}
                </label>
                {showValue && (
                    <span className="text-sm text-slate-500 tabular-nums">
                        {formatValue(value)}
                    </span>
                )}
            </div>
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={handleChange}
                    className="settings-slider w-full"
                    style={{
                        '--slider-percentage': `${percentage}%`
                    } as React.CSSProperties}
                />
            </div>
        </div>
    );
}

// Add this CSS to your global styles or component
// The styles are defined in the SettingsModal component's style tag
