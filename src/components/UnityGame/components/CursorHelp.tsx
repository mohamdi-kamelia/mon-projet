import { MousePointer2 } from 'lucide-react';

interface CursorHelpProps {
    isVisible: boolean;
}

export function CursorHelp({ isVisible }: CursorHelpProps) {
    if (!isVisible) return null;

    return (
        <div 
            className="absolute top-10 right-56 z-40 h-[68px] px-5 bg-gray-800/80 rounded-lg shadow-lg backdrop-blur-sm flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300 border border-transparent hover:border-slate-600/50 transition-colors select-none"
        >
            {/* Visual Icon matching the blue accent style */}
            <MousePointer2 className="w-8 h-8 text-blue-400" />
            
            {/* Vertical Separator */}
            <div className="h-8 w-px bg-gray-600/50" />

            {/* Text & Keycap */}
            <div className="flex flex-col items-start justify-center gap-0.5">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider leading-none">
                    Afficher Curseur
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-xs font-medium">Appuyez sur</span>
                    {/* Keycap Style */}
                    <kbd className="bg-gray-700 text-white px-2 py-0.5 rounded border border-gray-600 text-sm font-bold font-mono min-w-[24px] text-center shadow-[0_2px_0_rgba(0,0,0,0.2)]">
                        P
                    </kbd>
                </div>
            </div>
        </div>
    );
}