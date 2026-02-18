import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SettingsDropdownOption<T> {
    value: T;
    label: string;
}

interface SettingsDropdownProps<T> {
    label: string;
    value: T;
    options: SettingsDropdownOption<T>[];
    onChange: (value: T) => void;
    className?: string;
}

/**
 * Reusable dropdown component for settings
 * Styled to match the Unity settings UI with blue accent
 */
export function SettingsDropdown<T extends string | number>({
    label,
    value,
    options,
    onChange,
    className
}: SettingsDropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: T) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <label className="text-sm text-slate-400 font-medium">
                {label}
            </label>
            <div ref={dropdownRef} className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5',
                        '!bg-[#237ECE] hover:!bg-[#2a8fe0] !text-white',
                        'rounded-md transition-colors duration-150',
                        'text-sm font-medium',
                        'focus:outline-none focus:ring-2 focus:ring-[#237ECE]/50'
                    )}
                >
                    <span>{selectedOption?.label ?? 'Select...'}</span>
                    <ChevronDown 
                        className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            isOpen && 'transform rotate-180'
                        )} 
                    />
                </button>

                {isOpen && (
                    <div className={cn(
                        'absolute z-50 w-full mt-1',
                        'bg-[#1e2a3a] border border-slate-600/50 rounded-md shadow-lg',
                        'py-1 max-h-60 overflow-auto'
                    )}>
                        {options.map((option) => (
                        <button
                            key={String(option.value)}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={cn(
                                'w-full px-4 py-2 text-left text-sm',
                                'transition-colors duration-150',
                                option.value === value
                                    ? '!bg-[#237ECE] !text-white hover:!bg-[#2a8fe0]'
                                    : '!text-blue-400 !bg-transparent hover:!bg-slate-700/50'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                    </div>
                )}
            </div>
        </div>
    );
}
