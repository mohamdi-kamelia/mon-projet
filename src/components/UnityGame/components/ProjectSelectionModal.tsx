import React, { useEffect, useRef, useCallback } from 'react';
import { Project } from '../hooks/useUnityProjectSelection';

/**
 * Props for ProjectSelectionModal
 */
interface ProjectSelectionModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** List of available projects */
  projects: Project[];
  /** Currently selected project */
  selectedProject: Project | null;
  /** Error message if any */
  error: string | null;
  /** Loading state (during confirmation) */
  isLoading: boolean;
  /** Callback when a project is selected */
  onSelectProject: (project: Project) => void;
  /** Callback when selection is confirmed */
  onConfirm: () => void;
  /** Callback when modal is closed/cancelled */
  onClose: () => void;
  /** Function to focus the Unity canvas */
  focusUnityCanvas?: () => void;
}

/**
 * Project Selection Modal Component
 * 
 * Displays a grid of available projects with thumbnails, names, and descriptions.
 * User can select a project and confirm to enter the Project scene.
 * 
 * Location: src/components/UnityGame/components/ProjectSelectionModal.tsx
 */
export const ProjectSelectionModal: React.FC<ProjectSelectionModalProps> = ({
  isOpen,
  projects,
  selectedProject,
  error,
  isLoading,
  onSelectProject,
  onConfirm,
  onClose,
  focusUnityCanvas,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Handle close and refocus Unity canvas
  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
    if (focusUnityCanvas) {
      setTimeout(focusUnityCanvas, 100);
    }
  }, [onClose, focusUnityCanvas, isLoading]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (isLoading) return;
    onConfirm();
  }, [onConfirm, isLoading]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleClose();
    }
  }, [handleClose, isLoading]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-5"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-[#1a1a2e] rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl border border-white/10 outline-none"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 id="project-modal-title" className="text-white text-xl font-semibold m-0">
            Sélectionner un projet
          </h2>
          <button
            onClick={handleClose}
            className="bg-transparent border-none text-gray-400 text-2xl cursor-pointer p-1 rounded hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fermer"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 text-red-400 px-6 py-3 border-b border-red-500/30">
            {error}
          </div>
        )}

        {/* Project Grid */}
        <div className="flex-1 overflow-auto p-6">
          {projects.length === 0 ? (
            <div className="text-center text-gray-400 py-10 text-lg">
              Aucun projet disponible
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => (
                <ProjectCard
                  key={project.projectId}
                  project={project}
                  isSelected={selectedProject?.projectId === project.projectId}
                  onClick={() => onSelectProject(project)}
                  disabled={isLoading}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 bg-transparent text-gray-400 border border-gray-600 rounded-md cursor-pointer text-base hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-2.5 rounded-md text-base font-semibold transition-colors ${
              selectedProject && !isLoading
                ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!selectedProject || isLoading}
          >
            {isLoading ? 'Chargement...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual Project Card Component
 */
interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isSelected,
  onClick,
  disabled,
}) => {
  // Default placeholder image
  const thumbnailSrc = project.thumbnailUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"%3E%3Crect fill="%231a1a2e" width="400" height="225"/%3E%3Ctext x="50%25" y="50%25" fill="%23666" font-family="Arial" font-size="20" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

  return (
    <div
      className={`bg-[#16213e] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
        isSelected 
          ? 'border-green-500 shadow-[0_0_20px_rgba(76,175,80,0.3)]' 
          : 'border-transparent hover:border-white/20'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Thumbnail */}
      <div className="relative w-full pt-[56.25%] bg-[#0f0f23]">
        <img
          src={thumbnailSrc}
          alt={`${project.projectName} thumbnail`}
          className="absolute top-0 left-0 w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"%3E%3Crect fill="%231a1a2e" width="400" height="225"/%3E%3Ctext x="50%25" y="50%25" fill="%23666" font-family="Arial" font-size="20" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />
        {isSelected && (
          <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
            <span className="text-white text-5xl drop-shadow-lg">✓</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="m-0 mb-2 text-white text-base font-semibold truncate">
          {project.projectName}
        </h3>
        <p className="m-0 text-gray-400 text-sm leading-relaxed line-clamp-2">
          {project.projectDescription || 'Aucune description'}
        </p>
      </div>
    </div>
  );
};

export default ProjectSelectionModal;