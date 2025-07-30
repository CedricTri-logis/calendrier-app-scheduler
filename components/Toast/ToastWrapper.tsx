import React from 'react'
import ToastContainer from './ToastContainer'
import { useToast } from '../../contexts/ToastContext'

export default function ToastWrapper() {
  const { toasts, removeToast } = useToast()
  
  return <ToastContainer toasts={toasts} onRemove={removeToast} />
}