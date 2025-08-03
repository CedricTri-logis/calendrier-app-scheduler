import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTickets } from '../hooks/useTickets'
import { useTechnicians } from '../hooks/useTechnicians'
import { useSchedules } from '../hooks/useSchedules'

export default function TestDebug() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...')
  const [errors, setErrors] = useState<string[]>([])
  
  const { tickets, loading: loadingTickets, error: ticketsError } = useTickets()
  const { technicians, loading: loadingTechnicians, error: techniciansError } = useTechnicians()
  const { schedules, loading: loadingSchedules, error: schedulesError } = useSchedules()

  useEffect(() => {
    async function testConnection() {
      try {
        setConnectionStatus('Testing Supabase connection...')
        
        // Test connection
        const { data, error, count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })

        if (error) {
          setErrors(prev => [...prev, `Connection error: ${error.message}`])
          setConnectionStatus('❌ Connection failed')
        } else {
          setConnectionStatus('✅ Supabase connection OK')
        }
      } catch (err) {
        setErrors(prev => [...prev, `Test error: ${err instanceof Error ? err.message : 'Unknown error'}`])
        setConnectionStatus('❌ Test failed')
      }
    }

    testConnection()
  }, [])

  // Collect all errors
  useEffect(() => {
    const allErrors = []
    if (ticketsError) allErrors.push(`Tickets error: ${ticketsError}`)
    if (techniciansError) allErrors.push(`Technicians error: ${techniciansError}`)
    if (schedulesError) allErrors.push(`Schedules error: ${schedulesError}`)
    setErrors(allErrors)
  }, [ticketsError, techniciansError, schedulesError])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', marginBottom: '2rem' }}>🔍 Debug Calendar Application</h1>
      
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h2>Connection Status</h2>
          <p style={{ fontSize: '18px', margin: '1rem 0' }}>{connectionStatus}</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h2>Environment</h2>
          <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...</p>
          <p><strong>Schema:</strong> calendar</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3>📋 Tickets</h3>
          <p><strong>Loading:</strong> {loadingTickets ? '⏳ Yes' : '✅ No'}</p>
          <p><strong>Count:</strong> {tickets.length}</p>
          <p><strong>Error:</strong> {ticketsError || '✅ None'}</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3>👥 Technicians</h3>
          <p><strong>Loading:</strong> {loadingTechnicians ? '⏳ Yes' : '✅ No'}</p>
          <p><strong>Count:</strong> {technicians.length}</p>
          <p><strong>Error:</strong> {techniciansError || '✅ None'}</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3>📅 Schedules</h3>
          <p><strong>Loading:</strong> {loadingSchedules ? '⏳ Yes' : '✅ No'}</p>
          <p><strong>Count:</strong> {schedules.length}</p>
          <p><strong>Error:</strong> {schedulesError || '✅ None'}</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div style={{ backgroundColor: '#ffebee', padding: '1rem', borderRadius: '8px', border: '1px solid #f44336', marginBottom: '2rem' }}>
          <h3 style={{ color: '#c62828', margin: '0 0 1rem 0' }}>❌ Errors Detected</h3>
          {errors.map((error, index) => (
            <p key={index} style={{ color: '#c62828', margin: '0.5rem 0' }}>{error}</p>
          ))}
        </div>
      )}

      {tickets.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '2rem' }}>
          <h3>🎫 Sample Tickets</h3>
          {tickets.slice(0, 5).map(ticket => (
            <div key={ticket.id} style={{ 
              padding: '0.5rem', 
              margin: '0.5rem 0', 
              backgroundColor: ticket.color || '#f5f5f5', 
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              <strong>{ticket.title}</strong> - {ticket.technician_name || 'No technician'} 
              {ticket.date && ` - ${ticket.date}`}
            </div>
          ))}
        </div>
      )}

      {technicians.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '2rem' }}>
          <h3>👨‍🔧 Sample Technicians</h3>
          {technicians.slice(0, 5).map(tech => (
            <div key={tech.id} style={{ 
              padding: '0.5rem', 
              margin: '0.5rem 0', 
              backgroundColor: tech.color || '#f5f5f5', 
              borderRadius: '4px',
              border: '1px solid #ddd',
              color: 'white'
            }}>
              <strong>{tech.name}</strong> - {tech.active ? '✅ Active' : '❌ Inactive'}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <a href="/" style={{ 
          backgroundColor: '#1976d2', 
          color: 'white', 
          padding: '1rem 2rem', 
          borderRadius: '8px', 
          textDecoration: 'none',
          display: 'inline-block'
        }}>
          🏠 Return to Calendar
        </a>
      </div>
    </div>
  )
}