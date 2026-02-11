import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react";

export function NameModal({userName, onUserNameChange} : {userName : string, onUserNameChange : (newUserName : string ) => void }) {

  const tempRef = useRef<string>(userName);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const hasNotifiedUnity = useRef<boolean>(false);

  // Tell Unity to show cursor when modal is open (once Unity loads)
  useEffect(() => {
    if (!isOpen) return;

    // Modal is open - try to tell Unity to show cursor
    const checkUnityAndShowCursor = () => {
      try {
        const unityCanvas = document.querySelector('#unity-canvas') as HTMLCanvasElement;
        if (unityCanvas && !hasNotifiedUnity.current) {
          // Unity canvas exists, now check if we can send messages
          const unityInstance = (window as any).UNSAFE__unityInstance;
          if (unityInstance && unityInstance.SendMessage) {
            console.log("NameModal: Telling Unity to show cursor");
            unityInstance.SendMessage("CursorManager", "ShowModalCursor");
            hasNotifiedUnity.current = true;
          }
        }
      } catch (error) {
        // Unity not ready yet, that's ok
      }
    };

    // Check immediately
    checkUnityAndShowCursor();

    // Keep checking every 500ms until Unity is ready
    const intervalId = setInterval(checkUnityAndShowCursor, 500);

    // Cleanup interval
    return () => clearInterval(intervalId);
  }, [isOpen]);

  // Manage focus when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Modal just closed - tell Unity to hide cursor and return focus
      console.log("NameModal closed - hiding cursor and returning focus to Unity");
      
      try {
        const unityInstance = (window as any).UNSAFE__unityInstance;
        if (unityInstance && unityInstance.SendMessage) {
          unityInstance.SendMessage("CursorManager", "HideModalCursor");
        }
      } catch (error) {
        console.warn("Could not notify Unity of cursor hide:", error);
      }

      // Return focus to Unity canvas
      setTimeout(() => {
        try {
          const unityCanvas = document.querySelector('#unity-canvas') as HTMLCanvasElement;
          if (unityCanvas) {
            unityCanvas.focus();
            console.log("Focus returned to Unity canvas after NameModal closed");
          } else {
            const canvas = document.querySelector('canvas') as HTMLCanvasElement;
            if (canvas) {
              canvas.focus();
              console.log("Focus returned to canvas (alternative selector)");
            }
          }
        } catch (error) {
          console.error("Failed to return focus to Unity canvas:", error);
        }
      }, 150);
    }
  }, [isOpen]);

  const handleValidate = () => {
    onUserNameChange(tempRef.current);
    setIsOpen(false);
  };

  const handleCancel = () => {
    console.log("User cancelled name input");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex bg-MainBlueMAM p-0 pr-3 max-w-sm h-full text-left ">  
          <div className="h-full aspect-square p-1">
            <Avatar className="h-full w-full">
              <AvatarImage
                src="/images/Logo_Plateforme_blanc.png"
                alt="Logo de la Plateforme"
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
          <div className="text-white h-full content-center">
            <p className="no-wrap">
              {userName != null && userName.trim() !== "" ? userName : "NOM Prénom"}{" "}
            </p>
            <p className="text-sm">Status</p>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profil utilisateur</DialogTitle>
          <DialogDescription>
            Profil temporaire, le temps de la session
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2">
          <div className="grid flex-1 gap-2">
            <Input
              id="userNameInput"
              defaultValue={userName}
              onChange={(e) => tempRef.current = e.target.value}
              autoFocus
              placeholder="Entrez votre nom"
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button 
              type="button" 
              className="bg-green-600 hover:bg-green-700 text-white hover:text-black"
              onClick={handleValidate}
            >
              Valider
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button 
              type="button" 
              variant="secondary"
              onClick={handleCancel}
            >
              Annuler
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}