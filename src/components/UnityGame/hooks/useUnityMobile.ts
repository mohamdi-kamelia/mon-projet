import { useState, useEffect } from 'react';

interface UseUnityMobileProps {
    isLoaded: boolean;
    unityInstance: any;
}

export const useUnityMobile = ({ isLoaded, unityInstance }: UseUnityMobileProps) => {
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        const checkMobile = () => {
            const isMobileDevice = /Mobi|iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            console.log("Is Mobile Detected?", isMobileDevice);
            setIsMobile(isMobileDevice);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            unityInstance?.SendMessage(
                "WebInteraction",
                "IsMobile",
                isMobile ? 1 : 0
            );
        }
    }, [isLoaded, isMobile, unityInstance]);

    return { isMobile };
};