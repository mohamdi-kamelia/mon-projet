import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { InteractionPromptProps } from '../types/interactionPrompt.types';
import { Hand } from 'lucide-react';

/**
 * Interaction Prompt Component
 * Features:
 * - Continuous breathing animation on the icon
 * - Different text for desktop (Press F) vs mobile (Tap)
 */
export function InteractionPrompt({
    isVisible,
    isMobile,
    onInteract
}: InteractionPromptProps) {
    // Animation state for breathing effect
    const [isAnimating, setIsAnimating] = useState(false);

    // Start animation when prompt becomes visible
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => setIsAnimating(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <>
            {/* Breathing animation keyframes */}
            <style>{`
                @keyframes breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.25); } /* Increased scale slightly for visibility */
                }
                .interaction-icon-breathe {
                    animation: breathe 2s ease-in-out infinite;
                }
            `}</style>

            <div
                className={cn(
                    'absolute bottom-24 left-1/2 -translate-x-1/2 z-40',
                    'animate-in fade-in slide-in-from-bottom-4 duration-300'
                )}
            >
                <button
                    onClick={onInteract}
                    className={cn(
                        // Layout & Dimensions
                        'h-[68px] px-6',
                        'flex items-center gap-4',
                        
                        // Visual Style (Gray/Blue Theme)
                        'bg-gray-800/80 backdrop-blur-sm',
                        'border border-transparent',
                        'rounded-lg shadow-lg',
                        
                        // Hover Effects
                        'hover:bg-gray-700 hover:border-slate-500/50',
                        'transition-all duration-200',
                        
                        // Interaction
                        'cursor-pointer group select-none'
                    )}
                >
                    {/* Interaction Icon with Breathing Animation */}
                    <Hand className={cn(
                        "w-8 h-8 text-blue-400",
                        isAnimating && "interaction-icon-breathe" 
                    )} />

                    {/* Vertical Separator */}
                    <div className="h-8 w-px bg-gray-600/50" />

                    {/* Text & Keycap Container */}
                    <div className="flex flex-col items-start justify-center gap-0.5">
                        {/* Upper Label */}
                        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider leading-none">
                            Interaction possible
                        </span>

                        {/* Main Action Text */}
                        <div className="flex items-center gap-2">
                            <span className="text-gray-200 text-sm font-medium whitespace-nowrap">
                                {isMobile ? "Appuyez ici" : "Interagir avec"}
                            </span>

                            {/* Desktop Keycap */}
                            {!isMobile && (
                                <kbd className={cn(
                                    "bg-gray-700 text-white",
                                    "px-2 py-0.5 rounded",
                                    "border border-gray-600",
                                    "text-sm font-bold font-mono",
                                    "min-w-[24px] text-center",
                                    "shadow-[0_2px_0_rgba(0,0,0,0.2)]"
                                )}>
                                    F
                                </kbd>
                            )}
                        </div>
                    </div>
                </button>
            </div>
        </>
    );
}