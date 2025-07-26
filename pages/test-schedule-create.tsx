import { useState } from 'react'
import { useSchedules } from '../hooks/useSchedules'
import Button from '../components/ui/Button'

export default function TestScheduleCreate() {
  const { createSchedule } = useSchedules()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTestCreate = async () => {
    setLoading(true)
    console.log('Starting test creation...')
    
    try {
      const testData = {
        technician_id: 1, // Assumant que le technicien ID 1 existe
        date: '2025-07-14',
        start_time: '09:00',
        end_time: '17:00',
        type: 'available' as const,
        notes: 'Test schedule creation'
      }
      
      console.log('Creating schedule with data:', testData)
      const result = await createSchedule(testData)
      console.log('Creation result:', result)
      setResult(result)
    } catch (error) {
      console.error('Error during test:', error)
      setResult({ error: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Test Schedule Creation</h1>
      
      <Button 
        onClick={handleTestCreate} 
        disabled={loading}
        variant="primary"
      >
        {loading ? 'Creating...' : 'Test Create Schedule'}
      </Button>
      
      {result && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Result:</h2>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '1rem', 
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '2rem' }}>
        <p>Check the browser console for detailed logs.</p>
        <p>
          <a href="/schedules" style={{ color: '#0070f3' }}>
            ← Back to schedules
          </a>
        </p>
      </div>
    </div>
  )
}