import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import styles from '../styles/Home.module.css'

interface MigrationStatus {
  techniciansTable: boolean
  schedulesTable: boolean
  ticketsUpdated: boolean
  viewCreated: boolean
  technicianCount: number
  scheduleCount: number
  error?: string
}

export default function MigrationStatus() {
  const [status, setStatus] = useState<MigrationStatus>({
    techniciansTable: false,
    schedulesTable: false,
    ticketsUpdated: false,
    viewCreated: false,
    technicianCount: 0,
    scheduleCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkMigrationStatus()
  }, [])

  const checkMigrationStatus = async () => {
    try {
      setLoading(true)
      const newStatus: MigrationStatus = {
        techniciansTable: false,
        schedulesTable: false,
        ticketsUpdated: false,
        viewCreated: false,
        technicianCount: 0,
        scheduleCount: 0
      }

      // 1. Vérifier la table technicians
      const { data: technicians, error: techError } = await supabase
        .from('technicians')
        .select('*')
      
      if (!techError) {
        newStatus.techniciansTable = true
        newStatus.technicianCount = technicians?.length || 0
      }

      // 2. Vérifier la table schedules
      const { data: schedules, error: schedError } = await supabase
        .from('schedules')
        .select('*')
        .limit(100)
      
      if (!schedError) {
        newStatus.schedulesTable = true
        newStatus.scheduleCount = schedules?.length || 0
      }

      // 3. Vérifier si tickets a technician_id
      const { data: tickets, error: ticketError } = await supabase
        .from('tickets')
        .select('id, technician_id')
        .limit(1)
      
      if (!ticketError && tickets && tickets.length > 0) {
        newStatus.ticketsUpdated = 'technician_id' in tickets[0]
      }

      // 4. Vérifier la vue tickets_with_technician
      const { data: viewData, error: viewError } = await supabase
        .from('tickets_with_technician')
        .select('*')
        .limit(1)
      
      if (!viewError) {
        newStatus.viewCreated = true
      }

      setStatus(newStatus)
    } catch (error) {
      console.error('Erreur lors de la vérification:', error)
      setStatus(prev => ({ ...prev, error: error.message }))
    } finally {
      setLoading(false)
    }
  }

  const getMigrationInstructions = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    return `${baseUrl}/sql`
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <h1>Vérification du statut de migration...</h1>
      </div>
    )
  }

  const allMigrationsComplete = 
    status.techniciansTable && 
    status.schedulesTable && 
    status.ticketsUpdated && 
    status.viewCreated

  return (
    <div className={styles.container} style={{ padding: '2rem' }}>
      <h1>📊 Statut de Migration - Module Horaires Techniciens</h1>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>État des Tables :</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <div>
            {status.techniciansTable ? '✅' : '❌'} Table `technicians` 
            {status.techniciansTable && ` (${status.technicianCount} techniciens)`}
          </div>
          
          <div>
            {status.schedulesTable ? '✅' : '❌'} Table `schedules`
            {status.schedulesTable && ` (${status.scheduleCount} horaires créés)`}
          </div>
          
          <div>
            {status.ticketsUpdated ? '✅' : '❌'} Table `tickets` mise à jour (technician_id)
          </div>
          
          <div>
            {status.viewCreated ? '✅' : '❌'} Vue `tickets_with_technician`
          </div>
        </div>

        {status.error && (
          <div style={{ color: 'red', marginTop: '1rem' }}>
            Erreur : {status.error}
          </div>
        )}
      </div>

      {!allMigrationsComplete && (
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <h3>⚠️ Migrations non complétées</h3>
          <p>Pour exécuter les migrations :</p>
          <ol>
            <li>
              Allez sur votre <a href={getMigrationInstructions()} target="_blank" rel="noopener noreferrer">
                éditeur SQL Supabase
              </a>
            </li>
            <li>Exécutez les scripts dans l'ordre :
              <ul>
                <li>01-create-technicians-table.sql</li>
                <li>02-create-schedules-table.sql</li>
                <li>03-migrate-tickets-table.sql</li>
              </ul>
            </li>
            <li>Rafraîchissez cette page pour vérifier</li>
          </ol>
        </div>
      )}

      {allMigrationsComplete && (
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#d4edda', borderRadius: '8px' }}>
          <h3>✅ Toutes les migrations sont complétées !</h3>
          <p>Le module de gestion des horaires est prêt à être utilisé.</p>
          <p>
            <a href="/">Retour au calendrier</a>
          </p>
        </div>
      )}

      <button 
        onClick={checkMigrationStatus} 
        style={{ 
          marginTop: '2rem', 
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🔄 Rafraîchir le statut
      </button>
    </div>
  )
}