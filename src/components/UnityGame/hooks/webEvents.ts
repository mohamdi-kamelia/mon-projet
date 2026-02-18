/**
 * Type-safe constants for Unity-React communication.
 * 
 * This file mirrors the event names used in Unity's React.jslib and WebInterractionManager.
 * When adding new interactions, add the constants here first, then use them everywhere.
 * 
 * Benefits:
 * - IDE autocomplete for all event names
 * - Compile-time errors if event names are misspelled
 * - Single source of truth for all event strings
 * - Safe refactoring - change in one place
 */

export const WebEvents = {
    // Target GameObjects in Unity
    RECEIVER_OBJECT: 'WebInteraction',
    CURSOR_MANAGER: 'CursorManager',

    // Cursor management methods
    Cursor: {
        SHOW: 'ShowModalCursor',
        HIDE: 'HideModalCursor',
    },

    // TV Interaction
    TV: {
        RECEIVE: 'ReceiveTVInteraction',
        CLOSE_MODAL: 'CloseTVModal',
        CLOSE_METHOD: 'CloseTVInteraction',
    },

    // Sign Interaction
    Sign: {
        RECEIVE: 'ReceiveSignInteraction',
        CLOSE_MODAL: 'CloseSignModal',
        CLOSE_METHOD: 'CloseSignInteraction',
    },

    // Library Desk / Help Desk Interaction
    LibraryDesk: {
        RECEIVE: 'ReceiveHelpDeskInteraction',
        CLOSE_MODAL: 'CloseHelpDeskModal',
        CLOSE_METHOD: 'CloseHelpDeskInteraction',
        CONFIRM_METHOD: 'ConfirmLibraryDeskSelection',
    },

    // NewsStand Interaction
    NewsStand: {
        RECEIVE: 'ReceiveNewsStandInteraction',
        RECEIVE_ERROR: 'ReceiveNewsStandInteractionError',
        CLOSE_MODAL: 'CloseNewsStandModal',
        CLOSE_METHOD: 'CloseNewsStandInteraction',
    },

    // Media/Poster Interaction
    Media: {
        RECEIVE: 'ReceiveMediaInteraction',
        CLOSE_MODAL: 'CloseMediaModal',
        CLOSE_METHOD: 'CloseMediaInteraction',
    },

    // Game Interaction (Chess, Connect4, etc.)
    Game: {
        RECEIVE: 'ReceiveGameInteraction',
        CLOSE_MODAL: 'CloseGameModal',
        CLOSE_METHOD: 'CloseGameInteraction',
    },

    // Jitsi Voice Chat
    Jitsi: {
        JOIN_ROOM: 'UnityJoinRoom',
        EXIT_ROOM: 'UnityExitRoom',
    },

    // Conference/Stream
    Conference: {
        JOIN: 'JoinConference',
        LEAVE: 'LeaveConference',
        SHOW: 'ShowConference',
        HIDE: 'HideConference',
    },
} as const;

// Type helper to extract event name types
export type WebEventName = typeof WebEvents[keyof typeof WebEvents];