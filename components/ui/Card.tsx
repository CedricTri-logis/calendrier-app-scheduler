import React from 'react'
import styles from '../../styles/components/Card.module.css'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'small' | 'medium' | 'large'
  shadow?: 'none' | 'small' | 'medium' | 'large'
  hoverable?: boolean
  clickable?: boolean
  selected?: boolean
  bordered?: boolean
  onClick?: () => void
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
  compact?: boolean
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
  compact?: boolean
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>
  Body: React.FC<CardBodyProps>
  Footer: React.FC<CardFooterProps>
  Title: React.FC<{ children: React.ReactNode; className?: string }>
  Subtitle: React.FC<{ children: React.ReactNode; className?: string }>
} = ({
  children,
  className = '',
  padding = 'medium',
  shadow = 'small',
  hoverable = false,
  clickable = false,
  selected = false,
  bordered = false,
  onClick
}) => {
  const paddingClass = padding === 'none' ? styles.noPadding : styles[padding]
  const shadowClass = shadow === 'none' ? styles.noShadow : styles[`shadow${shadow.charAt(0).toUpperCase() + shadow.slice(1)}`]
  
  const classes = [
    styles.card,
    paddingClass,
    shadowClass,
    hoverable ? styles.hoverable : '',
    clickable ? styles.clickable : '',
    selected ? styles.selected : '',
    bordered ? styles.bordered : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  )
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', compact = false }) => {
  const classes = [
    styles.header,
    compact ? styles.compact : '',
    className
  ].filter(Boolean).join(' ')
  
  return <div className={classes}>{children}</div>
}

const CardBody: React.FC<CardBodyProps> = ({ children, className = '', noPadding = false }) => {
  const classes = [
    styles.body,
    noPadding ? styles.noPadding : '',
    className
  ].filter(Boolean).join(' ')
  
  return <div className={classes}>{children}</div>
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', compact = false }) => {
  const classes = [
    styles.footer,
    compact ? styles.compact : '',
    className
  ].filter(Boolean).join(' ')
  
  return <div className={classes}>{children}</div>
}

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <h3 className={`${styles.title} ${className}`}>{children}</h3>
}

const CardSubtitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <p className={`${styles.subtitle} ${className}`}>{children}</p>
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter
Card.Title = CardTitle
Card.Subtitle = CardSubtitle

export default Card