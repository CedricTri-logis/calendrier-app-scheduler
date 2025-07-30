import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import styles from '../styles/ModernHome.module.css'
import { LoadingContainer } from '../components/ui/Spinner'
import { useSchedules } from '../hooks/useSchedules'
import { useTechnicians } from '../hooks/useTechnicians'
import { isHourAvailable } from '../utils/scheduleHelpers'
import { formatDateForDB } from '../utils/dateHelpers'

const DebugSchedules: NextPage = () => {
  const { schedules, loading: loadingSchedules } = useSchedules()
  const { technicians, loading: loadingTechnicians } = useTechnicians()
  const [selectedDate, setSelectedDate] = useState(formatDateForDB(new Date()))
  const [hourAvailability, setHourAvailability] = useState<{ [key: string]: any }>({})

  useEffect(() => {
    if (schedules && technicians && selectedDate) {
      const availability: { [key: string]: any } = {}
      
      technicians.forEach(tech => {
        if (tech.active && tech.name !== 'Non assigné') {
          availability[tech.id] = {
            name: tech.name,
            hours: {}
          }
          
          // Tester chaque heure de 7h à 18h
          for (let hour = 7; hour <= 18; hour++) {
            const isAvailable = isHourAvailable(hour, selectedDate, schedules, tech.id)
            availability[tech.id].hours[hour] = isAvailable
            
            // Debug spécifique pour 14h
            if (hour === 14) {
              const daySchedules = schedules.filter(s => 
                s.date === selectedDate && s.technician_id === tech.id
              )
              
              console.log(`Debug 14h pour ${tech.name}:`, {
                date: selectedDate,
                schedules: daySchedules,
                isAvailable
              })
            }
          }
        }
      })
      
      setHourAvailability(availability)
    }
  }, [schedules, technicians, selectedDate])

  if (loadingSchedules || loadingTechnicians) {
    return (
      <div className={styles.container}>
        <LoadingContainer text="Chargement des données..." size="xlarge" />
      </div>
    )
  }

  const schedulesForDate = schedules.filter(s => s.date === selectedDate)

  return (
    <div className={styles.container}>
      <Head>
        <title>Debug Schedules</title>
      </Head>

      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Debug des Horaires</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <label>
            Date : 
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>

        <h2>Horaires dans la base de données pour {selectedDate}</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Technicien</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Type</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Début</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Fin</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {schedulesForDate.map((schedule, index) => {
              const tech = technicians.find(t => t.id === schedule.technician_id)
              return (
                <tr key={index}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {tech?.name || `ID: ${schedule.technician_id}`}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: schedule.type === 'available' ? '#d4edda' : '#f8d7da',
                      color: schedule.type === 'available' ? '#155724' : '#721c24'
                    }}>
                      {schedule.type}
                    </span>
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{schedule.start_time}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{schedule.end_time}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{schedule.notes || '-'}</td>
                </tr>
              )
            })}
            {schedulesForDate.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Aucun horaire défini pour cette date
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h2>Disponibilité par heure (résultat de isHourAvailable)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Technicien</th>
              {Array.from({ length: 12 }, (_, i) => i + 7).map(hour => (
                <th key={hour} style={{ 
                  padding: '10px', 
                  border: '1px solid #ddd',
                  backgroundColor: hour === 14 ? '#ffffcc' : '#f0f0f0'
                }}>
                  {hour}h
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(hourAvailability).map(([techId, data]) => (
              <tr key={techId}>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                  {data.name}
                </td>
                {Array.from({ length: 12 }, (_, i) => i + 7).map(hour => (
                  <td
                    key={hour}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      backgroundColor: data.hours[hour] ? '#d4edda' : '#f8d7da',
                      color: data.hours[hour] ? '#155724' : '#721c24',
                      textAlign: 'center',
                      fontWeight: hour === 14 ? 'bold' : 'normal'
                    }}
                  >
                    {data.hours[hour] ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Légende</h3>
          <ul>
            <li>La colonne 14h est mise en évidence en jaune</li>
            <li>✓ = Disponible (affiché en vert)</li>
            <li>✗ = Non disponible (affiché en rouge)</li>
            <li>Ouvrez la console pour voir les détails de debug pour 14h</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default DebugSchedules