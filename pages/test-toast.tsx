import { NextPage } from 'next'
import { useToast } from '../contexts/ToastContext'
import styles from '../styles/Home.module.css'

const TestToast: NextPage = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast()

  return (
    <div className={styles.container} style={{ padding: '2rem' }}>
      <h1>Test du système de Toast</h1>
      <p>Cliquez sur les boutons pour tester différents types de notifications :</p>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => showSuccess('Action réussie ! Le ticket a été mis à jour.')}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Toast Success
        </button>
        
        <button 
          onClick={() => showError('Erreur lors de la sauvegarde. Veuillez réessayer.')}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#ef4444', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Toast Error
        </button>
        
        <button 
          onClick={() => showWarning('Ce technicien n\'est pas disponible à cette date.')}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#f59e0b', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Toast Warning
        </button>
        
        <button 
          onClick={() => showInfo('Information : Le calendrier a été mis à jour.')}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Toast Info
        </button>
        
        <button 
          onClick={() => {
            showSuccess('Premier toast')
            setTimeout(() => showWarning('Deuxième toast'), 500)
            setTimeout(() => showError('Troisième toast'), 1000)
            setTimeout(() => showInfo('Quatrième toast'), 1500)
          }}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#8b5cf6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Tester plusieurs toasts
        </button>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <a href="/" style={{ color: '#3b82f6' }}>← Retour au calendrier</a>
      </div>
    </div>
  )
}

export default TestToast