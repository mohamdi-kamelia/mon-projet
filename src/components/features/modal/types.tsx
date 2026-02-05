export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
}

export interface IframeModalProps extends Omit<ModalProps, 'children'> {
  src: string;
  iframeTitle?: string;
  allowFullScreen?: boolean;
  sandbox?: string;
  onLoad?: () => void;
  onError?: () => void;
}