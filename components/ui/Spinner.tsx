import React from 'react'
import styles from '../../styles/components/Spinner.module.css'

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  variant?: 'default' | 'dots' | 'pulse' | 'bars'
  color?: 'primary' | 'white' | 'dark'
  className?: string
  inline?: boolean
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  variant = 'default',
  color = 'primary',
  className = '',
  inline = false
}) => {
  const classes = [
    styles.spinner,
    styles[size],
    inline ? styles.inline : '',
    className
  ].filter(Boolean).join(' ')

  switch (variant) {
    case 'dots':
      return (
        <div className={`${styles.dots} ${classes}`}>
          <div className={`${styles.dot} ${styles[color]}`} />
          <div className={`${styles.dot} ${styles[color]}`} />
          <div className={`${styles.dot} ${styles[color]}`} />
        </div>
      )
    
    case 'pulse':
      return (
        <div className={`${styles.pulse} ${classes} ${styles[color]}`} />
      )
    
    case 'bars':
      return (
        <div className={`${styles.bars} ${classes}`}>
          <div className={`${styles.bar} ${styles[color]}`} />
          <div className={`${styles.bar} ${styles[color]}`} />
          <div className={`${styles.bar} ${styles[color]}`} />
          <div className={`${styles.bar} ${styles[color]}`} />
        </div>
      )
    
    default:
      return (
        <div className={`${styles.default} ${classes} ${styles[color]}`} />
      )
  }
}

export const LoadingContainer: React.FC<{ 
  text?: string
  size?: SpinnerProps['size']
  variant?: SpinnerProps['variant']
}> = ({ text, size = 'large', variant = 'default' }) => {
  return (
    <div className={styles.loadingContainer}>
      <Spinner size={size} variant={variant} />
      {text && <div className={styles.loadingText}>{text}</div>}
    </div>
  )
}

export const SpinnerOverlay: React.FC<{
  show: boolean
  text?: string
  dark?: boolean
}> = ({ show, text, dark = false }) => {
  if (!show) return null

  return (
    <div className={`${styles.overlay} ${dark ? styles.dark : ''}`}>
      <LoadingContainer text={text} />
    </div>
  )
}

export default Spinner