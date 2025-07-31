import { NextPage } from 'next'
import { useToast as useToastHook } from '../hooks/useToast'
import ToastContainer from '../components/Toast/ToastContainer'

const TestToastSimple: NextPage = () => {
  const { toasts, showToast, removeToast } = useToastHook()

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Test Simple du Toast</h1>
      <p>Toasts actifs: {toasts.length}</p>
      
      <button 
        onClick={() => showToast('Test direct du hook!', 'success')}
        style={{ 
          padding: '0.5rem 1rem', 
          backgroundColor: '#10b981', 
          color: 'white', 
          border: 'none', 
          borderRadius: '0.5rem',
          cursor: 'pointer',
          marginRight: '1rem'
        }}
      >
        Ajouter Toast
      </button>
      
      <button 
        onClick={() => showToast('Erreur test!', 'error')}
        style={{ 
          padding: '0.5rem 1rem', 
          backgroundColor: '#ef4444', 
          color: 'white', 
          border: 'none', 
          borderRadius: '0.5rem',
          cursor: 'pointer'
        }}
      >
        Ajouter Erreur
      </button>
      
      <div style={{ marginTop: '2rem' }}>
        <h3>Toasts actuels:</h3>
        <pre>{JSON.stringify(toasts, null, 2)}</pre>
      </div>
      
      {/* ToastContainer directement */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default TestToastSimple