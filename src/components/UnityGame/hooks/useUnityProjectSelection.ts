import { useState, useEffect, useCallback } from 'react';

/**
 * Project metadata structure (matches Unity's SProjectMetadata)
 */
export interface Project {
  projectId: string;
  projectName: string;
  projectDescription: string;
  thumbnailUrl: string;
}

/**
 * Project list wrapper (matches Unity's SProjectListWrapper)
 */
interface ProjectListWrapper {
  projects: Project[];
}

/**
 * Hook return type
 */
interface UseUnityProjectSelectionReturn {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** List of available projects */
  projects: Project[];
  /** Currently selected project (before confirmation) */
  selectedProject: Project | null;
  /** Error message if any */
  error: string | null;
  /** Loading state (during confirmation) */
  isLoading: boolean;
  /** Select a project (does not confirm yet) */
  selectProject: (project: Project) => void;
  /** Confirm selection and notify Unity */
  confirmSelection: () => void;
  /** Cancel selection and close modal */
  cancelSelection: () => void;
  /** Close modal (same as cancel) */
  closeModal: () => void;
}

/**
 * Custom hook for managing project selection modal state.
 * 
 * Listens for Unity events:
 * - OpenProjectSelectionModal: Opens modal with project list
 * - CloseProjectSelectionModal: Closes modal
 * - ProjectSelectionError: Displays error message
 * 
 * Sends to Unity:
 * - ConfirmProjectSelection: When user confirms selection
 * - CancelProjectSelection: When user cancels
 * 
 * @param sendMessage - Function to send messages to Unity (from useUnityContext)
 * @param addEventListener - Function to add Unity event listeners
 * @param removeEventListener - Function to remove Unity event listeners
 */
export function useUnityProjectSelection(
  sendMessage: (objectName: string, methodName: string, value?: string | number) => void,
  addEventListener: (eventName: string, callback: (...args: any[]) => void) => void,
  removeEventListener: (eventName: string, callback: (...args: any[]) => void) => void
): UseUnityProjectSelectionReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Unity event: Open modal with project list
  const handleOpenModal = useCallback((projectsJson: string) => {
    console.log('[useUnityProjectSelection] OpenProjectSelectionModal received:', projectsJson);
    
    try {
      const wrapper: ProjectListWrapper = JSON.parse(projectsJson);
      setProjects(wrapper.projects || []);
      setSelectedProject(null);
      setError(null);
      setIsOpen(true);
      setIsLoading(false);
    } catch (e) {
      console.error('[useUnityProjectSelection] Failed to parse projects JSON:', e);
      setError('Échec du chargement des projets');
      setProjects([]);
    }
  }, []);

  // Handle Unity event: Close modal
  const handleCloseModal = useCallback(() => {
    console.log('[useUnityProjectSelection] CloseProjectSelectionModal received');
    setIsOpen(false);
    setSelectedProject(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Handle Unity event: Error
  const handleError = useCallback((errorMessage: string) => {
    console.log('[useUnityProjectSelection] ProjectSelectionError received:', errorMessage);
    setError(errorMessage);
    setIsLoading(false);
  }, []);

  // Subscribe to Unity events
  useEffect(() => {
    addEventListener('OpenProjectSelectionModal', handleOpenModal);
    addEventListener('CloseProjectSelectionModal', handleCloseModal);
    addEventListener('ProjectSelectionError', handleError);

    return () => {
      removeEventListener('OpenProjectSelectionModal', handleOpenModal);
      removeEventListener('CloseProjectSelectionModal', handleCloseModal);
      removeEventListener('ProjectSelectionError', handleError);
    };
  }, [addEventListener, removeEventListener, handleOpenModal, handleCloseModal, handleError]);

  // Select a project (does not confirm yet)
  const selectProject = useCallback((project: Project) => {
    console.log('[useUnityProjectSelection] Project selected:', project.projectName);
    setSelectedProject(project);
    setError(null);
  }, []);

  // Confirm selection and notify Unity
  const confirmSelection = useCallback(() => {
    if (!selectedProject) {
      setError('Veuillez sélectionner un projet');
      return;
    }

    console.log('[useUnityProjectSelection] Confirming selection:', selectedProject.projectId);
    setIsLoading(true);
    
    // Send to Unity
    sendMessage('WebInteraction', 'ConfirmProjectSelection', selectedProject.projectId);
  }, [selectedProject, sendMessage]);

  // Cancel selection
  const cancelSelection = useCallback(() => {
    console.log('[useUnityProjectSelection] Cancelling selection');
    
    // Send to Unity
    sendMessage('WebInteraction', 'CancelProjectSelection');
    
    // Close modal locally (Unity will also send CloseProjectSelectionModal)
    setIsOpen(false);
    setSelectedProject(null);
    setError(null);
  }, [sendMessage]);

  // Close modal (alias for cancel)
  const closeModal = cancelSelection;

  return {
    isOpen,
    projects,
    selectedProject,
    error,
    isLoading,
    selectProject,
    confirmSelection,
    cancelSelection,
    closeModal,
  };
}

export default useUnityProjectSelection;