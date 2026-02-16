import { useUnityInteraction, UnityHookProps, InteractionConfig } from './useUnityInteraction';
import { WebEvents } from './webEvents';

// ============================================================================
// Data Types
// ============================================================================

interface GameData {
    gameType: string;
    roomID: string;
}

// ============================================================================
// Configuration
// ============================================================================

const gameConfig: InteractionConfig<GameData> = {
    name: 'Game',
    receiveEvent: WebEvents.Game.RECEIVE,
    closeEvent: WebEvents.Game.CLOSE_MODAL,
    closeMethod: WebEvents.Game.CLOSE_METHOD,

    parseData: (gameType: string, roomID: string): GameData | null => {
        if (!gameType || !roomID) return null;

        return {
            gameType,
            roomID,
        };
    },

    getDefaultData: () => ({ gameType: '', roomID: '' }),
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for Game interactions (Chess, Connect4, etc.).
 *
 * Opens a game modal with an embedded iframe for the selected game.
 *
 * @example
 * const { gameType, roomID, isOpen, onClose } = useUnityGame(props);
 */
export const useUnityGame = (props: UnityHookProps) => {
    const result = useUnityInteraction(gameConfig, props);

    return {
        gameType: result.data.gameType,
        roomID: result.data.roomID,
        isOpen: result.isOpen,
        onClose: result.onClose,
    };
};
