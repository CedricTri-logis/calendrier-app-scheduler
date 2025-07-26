import React, { forwardRef } from 'react'
import styles from '../../styles/components/Input.module.css'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  required?: boolean
  inputSize?: 'small' | 'medium' | 'large'
  variant?: 'input' | 'textarea' | 'select'
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  success?: boolean
  options?: Array<{ value: string; label: string }>
  // Textarea specific props
  rows?: number
  cols?: number
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, InputProps>(({
  label,
  error,
  helperText,
  fullWidth = true,
  required = false,
  inputSize = 'medium',
  variant = 'input',
  iconLeft,
  iconRight,
  success = false,
  options = [],
  className = '',
  ...props
}, ref) => {
  const wrapperClasses = [
    styles.inputWrapper,
    fullWidth ? '' : styles.inline,
    inputSize !== 'medium' ? styles[inputSize] : '',
    error ? styles.error : '',
    success ? styles.success : '',
    iconLeft ? styles.withIconLeft : '',
    iconRight ? styles.withIconRight : '',
    className
  ].filter(Boolean).join(' ')

  const inputClasses = [
    styles.input,
    variant === 'textarea' ? styles.textarea : '',
    variant === 'select' ? styles.select : '',
    error ? styles.inputError : ''
  ].filter(Boolean).join(' ')

  const labelClasses = [
    styles.label,
    required ? styles.required : ''
  ].filter(Boolean).join(' ')

  const renderInput = () => {
    switch (variant) {
      case 'textarea':
        return (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={inputClasses}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        )
      case 'select':
        return (
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            className={inputClasses}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      default:
        return (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            className={inputClasses}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )
    }
  }

  return (
    <div className={wrapperClasses}>
      {label && <label className={labelClasses}>{label}</label>}
      {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
      {renderInput()}
      {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
      {error && <span className={styles.errorMessage}>{error}</span>}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  )
})

Input.displayName = 'Input'

export default Input