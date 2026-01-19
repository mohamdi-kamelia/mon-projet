import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface RSSItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
}

interface NewsStandModalProps {
    isOpen: boolean;
    xmlContent: string;
    errorMessage: string;
    onClose: () => void;
}

export const NewsStandModal = ({ isOpen, xmlContent, errorMessage, onClose }: NewsStandModalProps) => {
    const [newsItems, setNewsItems] = useState<RSSItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!isOpen) {
            setNewsItems([]);
            return;
        }

        // If we have an error message from Unity, don't try to parse
        if (errorMessage) {
            setNewsItems([]);
            return;
        }

        // If no XML content yet, show loading
        if (!xmlContent) {
            setLoading(true);
            return;
        }

        // Parse the XML content
        try {
            console.log("Parsing XML content...");
            console.log("XML Length:", xmlContent.length);
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

            // Check for parsing errors
            const parseError = xmlDoc.querySelector("parsererror");
            if (parseError) {
                console.error("XML parsing error:", parseError.textContent);
                throw new Error("Erreur lors de l'analyse du flux RSS");
            }

            // Extract items from the RSS feed
            const items = xmlDoc.querySelectorAll("item");
            console.log(`Found ${items.length} items in RSS feed`);
            
            const parsedItems: RSSItem[] = [];

            items.forEach((item, index) => {
                const title = item.querySelector("title")?.textContent || "Sans titre";
                const link = item.querySelector("link")?.textContent || "#";
                const description = item.querySelector("description")?.textContent || "Pas de description";
                const pubDate = item.querySelector("pubDate")?.textContent || "";

                console.log(`Item ${index + 1}:`, { title, pubDate });

                parsedItems.push({
                    title,
                    link,
                    description,
                    pubDate
                });
            });

            console.log(`Successfully parsed ${parsedItems.length} news items`);
            setNewsItems(parsedItems.slice(0, 10)); // Limit to 10 most recent items
            setLoading(false);

        } catch (err) {
            console.error("Error parsing RSS XML:", err);
            setNewsItems([]);
            setLoading(false);
        }
    }, [isOpen, xmlContent, errorMessage]);

    if (!isOpen) return null;

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        } catch {
            return dateString;
        }
    };

    const stripHtml = (html: string) => {
        if (!html) return "";
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    const truncateText = (text: string, maxLength: number = 200) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + "...";
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-[#989ced39]">
            <div className="w-[800px] max-h-[80vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
                    <h2 className="text-3xl font-bold text-white text-center">
                        📰 Actualités Éduscol
                    </h2>
                    <p className="text-blue-100 text-center mt-2 text-sm">
                        Dernières ressources et actualités du site Éduscol
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="ml-4 text-gray-600">Chargement des actualités...</p>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                            <p className="text-red-800 font-semibold mb-2">
                                ❌ Erreur de chargement
                            </p>
                            <p className="text-red-600 text-sm mb-3">
                                {errorMessage}
                            </p>
                            <p className="text-red-600 text-xs">
                                💡 <strong>Conseil:</strong> Vérifiez votre connexion Internet et réessayez.
                            </p>
                        </div>
                    )}

                    {!loading && !errorMessage && newsItems.length === 0 && xmlContent && (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📭</div>
                            <p className="text-gray-600 text-lg mb-2">
                                Aucune actualité disponible
                            </p>
                            <p className="text-gray-500 text-sm">
                                Le flux RSS ne contient aucun article pour le moment.
                            </p>
                        </div>
                    )}

                    {!loading && !errorMessage && newsItems.length > 0 && (
                        <div className="space-y-4">
                            {newsItems.map((item, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white hover:border-blue-300"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-800 flex-1">
                                            {item.title}
                                        </h3>
                                        <span className="flex-shrink-0 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                            Nouveau
                                        </span>
                                    </div>
                                    
                                    {item.pubDate && (
                                        <p className="text-xs text-gray-500 mb-2 flex items-center">
                                            <span className="mr-1">📅</span>
                                            {formatDate(item.pubDate)}
                                        </p>
                                    )}
                                    
                                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                        {truncateText(stripHtml(item.description), 180)}
                                    </p>
                                    
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                    >
                                        <span>Lire la suite</span>
                                        <svg 
                                            className="w-4 h-4 ml-1" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M14 5l7 7m0 0l-7 7m7-7H3" 
                                            />
                                        </svg>
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-center">
                    <Button
                        onClick={onClose}
                        className="bg-red-600 text-white hover:bg-red-700 px-8 py-3 rounded font-semibold text-lg"
                    >
                        Fermer
                    </Button>
                </div>
            </div>
        </div>
    );
};