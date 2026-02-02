import React, { useState } from 'react';
import { Modal } from './modal';
import { IframeModalProps } from './types';

export const IframeModal: React.FC<IframeModalProps> = ({
  isOpen,
  onClose,
  src,
  title,
  iframeTitle = 'Embedded content',
  size = 'xl',
  allowFullScreen = true,
  sandbox,
  onLoad,
  onError,
  ...modalProps
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Reset states when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, src]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size} {...modalProps}>
      <div className="relative w-full" style={{ minHeight: '400px' }}>
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 text-sm">Chargement...</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center p-6">
              <svg
                className="w-16 h-16 text-red-500 mx-auto mb-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Erreur de chargement
              </h3>
              <p className="text-gray-600 mb-4">
                Impossible de charger le contenu. Veuillez réessayer.
              </p>
              <button
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          src={src}
          title={iframeTitle}
          className="w-full border-0 rounded-md"
          style={{
            height: '70vh',
            maxHeight: '600px',
            display: isLoading || hasError ? 'none' : 'block',
          }}
          allowFullScreen={allowFullScreen}
          sandbox={sandbox}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      </div>
    </Modal>
  );
};