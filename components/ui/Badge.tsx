import React from 'react'
import styles from '../../styles/components/Badge.module.css'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'small' | 'medium' | 'large'
  type?: 'default' | 'solid' | 'outline'
  shape?: 'pill' | 'rounded' | 'square'
  clickable?: boolean
  removable?: boolean
  icon?: React.ReactNode
  className?: string
  onClick?: () => void
  onRemove?: () => void
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  type = 'default',
  shape = 'pill',
  clickable = false,
  removable = false,
  icon,
  className = '',
  onClick,
  onRemove
}) => {
  const classes = [
    styles.badge,
    styles[variant],
    styles[size],
    type !== 'default' ? styles[type] : '',
    shape !== 'pill' ? styles[shape] : '',
    clickable ? styles.clickable : '',
    removable ? styles.removable : '',
    icon ? styles.withIcon : '',
    className
  ].filter(Boolean).join(' ')

  const handleClick = (e: React.MouseEvent) => {
    if (clickable && onClick) {
      onClick()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove()
    }
  }

  return (
    <span className={classes} onClick={handleClick}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
      {removable && (
        <button
          className={styles.removeButton}
          onClick={handleRemove}
          aria-label="Remove"
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      )}
    </span>
  )
}

export const BadgeGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return <div className={`${styles.group} ${className}`}>{children}</div>
}

export default Badge