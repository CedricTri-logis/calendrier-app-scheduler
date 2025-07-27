import React, { useEffect } from 'react'
import styles from '../../styles/components/Modal.module.css'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  size?: 'small' | 'medium' | 'large' | 'fullWidth'
  className?: string
  closeOnOverlay?: boolean
  showCloseButton?: boolean
}

interface ModalHeaderProps {
  children: React.ReactNode
  onClose?: () => void
  showCloseButton?: boolean
}

interface ModalBodyProps {
  children: React.ReactNode
  noPadding?: boolean
}

interface ModalFooterProps {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right' | 'spaceBetween'
}

const Modal: React.FC<ModalProps> & {
  Header: React.FC<ModalHeaderProps>
  Body: React.FC<ModalBodyProps>
  Footer: React.FC<ModalFooterProps>
  Title: React.FC<{ children: React.ReactNode }>
} = ({
  isOpen,
  onClose,
  children,
  size = 'medium',
  className = '',
  closeOnOverlay = true,
  showCloseButton = true
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalClasses = [
    styles.modal,
    styles[size],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={modalClasses}>
        {showCloseButton && !React.Children.toArray(children).some(
          child => React.isValidElement(child) && child.type === ModalHeader
        ) && (
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ children, onClose, showCloseButton = true }) => {
  return (
    <div className={styles.header}>
      {children}
      {showCloseButton && onClose && (
        <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

const ModalBody: React.FC<ModalBodyProps> = ({ children, noPadding = false }) => {
  const classes = [
    styles.body,
    noPadding ? styles.noPadding : ''
  ].filter(Boolean).join(' ')
  
  return <div className={classes}>{children}</div>
}

const ModalFooter: React.FC<ModalFooterProps> = ({ children, align = 'right' }) => {
  const alignClass = align === 'center' ? styles.centered :
                    align === 'spaceBetween' ? styles.spaceBetween : ''
  
  const classes = [
    styles.footer,
    alignClass
  ].filter(Boolean).join(' ')
  
  return <div className={classes}>{children}</div>
}

const ModalTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <h2 className={styles.title}>{children}</h2>
}

Modal.Header = ModalHeader
Modal.Body = ModalBody
Modal.Footer = ModalFooter
Modal.Title = ModalTitle

export default Modal