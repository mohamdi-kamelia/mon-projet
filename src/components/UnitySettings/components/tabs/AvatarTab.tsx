import { useState } from 'react';
import { SettingsSection } from '../controls';
import { LABELS } from '../../constants/settings.constants';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AvatarTabProps {
    onEnterCustomization: () => void;
    onCloseModal: () => void;
    portalContainer?: HTMLElement | null;
}

export function AvatarTab({ onEnterCustomization, onCloseModal, portalContainer }: AvatarTabProps) {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleConfirm = () => {
        setShowConfirmDialog(false);
        onCloseModal();
        onEnterCustomization();
    };

    return (
        <div className="flex flex-col gap-6">
            <SettingsSection title={LABELS.sections.avatar}>
                <div className="flex flex-col gap-6 items-start">
                    <p className="text-slate-300">
                        Personnalisez votre avatar dans un espace dédié.
                    </p>
                    
                    <button
                        onClick={() => setShowConfirmDialog(true)}
                        className="px-6 py-3 bg-[#237ECE] hover:bg-[#2a8fe0] text-white rounded-lg font-medium shadow-md transition-colors duration-200 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Personnaliser mon avatar
                    </button>
                </div>
            </SettingsSection>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-md" container={portalContainer}>
                    <DialogHeader>
                        <DialogTitle>Confirmation</DialogTitle>
                        <DialogDescription>
                            Voulez-vous quitter la scène actuelle pour personnaliser votre avatar ?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowConfirmDialog(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="button"
                            className="bg-[#237ECE] hover:bg-[#2a8fe0] text-white"
                            onClick={handleConfirm}
                        >
                            Confirmer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}