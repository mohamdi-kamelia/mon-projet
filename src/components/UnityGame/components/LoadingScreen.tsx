import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
    progress: number;
}

export const LoadingScreen = ({ progress }: LoadingScreenProps) => {
    const loadingPercentage = Math.round(progress * 100);

    return (
        <div className='relative flex-grow'>
            <div className='absolute bg-RedPlateforme content-center justify-items-center w-full h-full'>
                <h4 className='text-2xl text-white'>Chargement ....</h4>
                <Progress className='mt-5 text-stone-100 max-w-100' value={loadingPercentage} />
            </div>
        </div>
    );
};