import { Button } from "@/components/ui/button";

interface LibraryDeskModalProps {
    isOpen: boolean;
    signTexts: string[];
    selectedSignText: string | null;
    onSelectSignText: (signText: string) => void;
    onClose: () => void;
    onConfirm: () => void;
}

export const LibraryDeskModal = ({
    isOpen,
    signTexts,
    selectedSignText,
    onSelectSignText,
    onClose,
    onConfirm
}: LibraryDeskModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-[#989ced39]">
            <div className="w-[700px] max-h-[80vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <h2 className="text-3xl font-bold text-center">
                        📚 Bureau d'Information
                    </h2>
                    <p className="text-center text-blue-100 mt-2">
                        Sélectionnez un thème pour trouver son emplacement
                    </p>
                </div>

                {/* Content - Scrollable list */}
                <div className="flex-1 overflow-y-auto p-6">
                    {signTexts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">
                                Aucun thème disponible pour le moment.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 font-semibold mb-4">
                                {signTexts.length} thème{signTexts.length > 1 ? 's' : ''} disponible{signTexts.length > 1 ? 's' : ''} :
                            </p>
                            
                            {signTexts.map((signText, index) => (
                                <button
                                    key={index}
                                    onClick={() => onSelectSignText(signText)}
                                    className={`
                                        w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                                        ${selectedSignText === signText
                                            ? 'border-green-500 bg-green-50 shadow-md'
                                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`
                                                w-5 h-5 rounded-full border-2 flex items-center justify-center
                                                ${selectedSignText === signText
                                                    ? 'border-green-500 bg-green-500'
                                                    : 'border-gray-300'
                                                }
                                            `}>
                                                {selectedSignText === signText && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            
                                            <span className={`
                                                text-lg font-medium
                                                ${selectedSignText === signText
                                                    ? 'text-green-700'
                                                    : 'text-gray-800'
                                                }
                                            `}>
                                                {signText}
                                            </span>
                                        </div>
                                        
                                        {selectedSignText === signText && (
                                            <span className="text-green-600 text-sm font-semibold">
                                                Sélectionné ✓
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with buttons */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="flex justify-center space-x-4">
                        {/* Red Cancel Button */}
                        <Button
                            onClick={onClose}
                            className="bg-red-600 text-white hover:bg-red-700 px-8 py-3 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition-all"
                        >
                            ❌ Annuler
                        </Button>
                        
                        {/* Green Confirm Button */}
                        <Button
                            onClick={onConfirm}
                            disabled={!selectedSignText}
                            className={`
                                px-8 py-3 rounded-lg font-semibold text-lg shadow-md transition-all
                                ${selectedSignText
                                    ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }
                            `}
                        >
                            ✅ Confirmer
                        </Button>
                    </div>
                    
                    {!selectedSignText && signTexts.length > 0 && (
                        <p className="text-center text-sm text-gray-500 mt-3">
                            Veuillez sélectionner un thème pour continuer
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};