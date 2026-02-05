import { Button } from "@/components/ui/button";

interface SignModalProps {
    isOpen: boolean;
    signText: string;
    signFilter: string;
    onClose: () => void;
}

export const SignModal = ({ isOpen, signText, signFilter, onClose }: SignModalProps) => {
    if (!isOpen) return null;

    const handleOpenResource = () => {
        // Base URL for edubase search
        const baseUrl = "https://edubase.eduscol.education.fr/recherche";
        
        // Parse the filter to extract discipline and search query
        // Filter format: "discipline[0]=Mathématiques&q=suite"
        const params = new URLSearchParams(signFilter);
        
        // Get the discipline value
        const discipline = params.get('discipline[0]');
        
        // Get the search query
        const searchQuery = params.get('q');
        
        // Construct URL with proper parameter order
        // Edubase expects: /recherche?discipline[0]=VALUE&q=QUERY
        const urlParams = new URLSearchParams();
        
        if (discipline) {
            urlParams.append('discipline[0]', discipline);
        }
        
        if (searchQuery) {
            urlParams.append('q', searchQuery);
        }
        
        const fullUrl = `${baseUrl}?${urlParams.toString()}`;
        
        console.log("Sign Modal - Opening resource in new tab:");
        console.log("  Base URL:", baseUrl);
        console.log("  Filter (raw):", signFilter);
        console.log("  Discipline:", discipline);
        console.log("  Search Query:", searchQuery);
        console.log("  Full URL:", fullUrl);
        
        // Open in new tab
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
        
        // Close the modal
        onClose();
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-[#989ced39]">
            <div className="w-[600px] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col p-6">
                {/* Icon Header */}
                <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
                    {signText}
                </h2>
                <p className="text-center text-gray-600 mb-6">
                    Ressources Éducatives
                </p>
                
                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                    <p className="text-sm font-semibold text-blue-800 mb-2">
                        📚 RESSOURCES DISPONIBLES
                    </p>
                    <p className="text-sm text-blue-900">
                        Accédez à des ressources pédagogiques sur le thème <strong>{signText}</strong> fournies par Édubase, la base de données des ressources fournie par le ministère de l’Éducation nationale.
                    </p>
                </div>

                {/* What you'll find */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                        Ce que vous trouverez :
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start">
                            <span className="text-green-600 mr-2 mt-0.5">✓</span>
                            <span>Ressources pédagogiques officielles</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-600 mr-2 mt-0.5">✓</span>
                            <span>Documents et activités pour enseignants</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-600 mr-2 mt-0.5">✓</span>
                            <span>Contenus validés par le Ministère de l'Éducation</span>
                        </li>
                    </ul>
                </div>

                {/* Buttons */}
                <div className="flex justify-center space-x-4">
                    {/* Green Open Button */}
                    <Button
                        onClick={handleOpenResource}
                        className="bg-green-600 text-white hover:bg-green-700 px-8 py-3 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Accéder aux ressources</span>
                    </Button>
                    
                    {/* Red Cancel Button */}
                    <Button
                        onClick={onClose}
                        className="bg-red-600 text-white hover:bg-red-700 px-8 py-3 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition-all"
                    >
                        Fermer
                    </Button>
                </div>

                {/* Footer note */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Les ressources s'ouvriront dans un nouvel onglet<br/>
                        <span className="text-blue-600">edubase.eduscol.education.fr</span>
                    </p>
                </div>
            </div>
        </div>
    );
};