// Redirection simple vers la page principale
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Calendar() {
  const router = useRouter()
  
  useEffect(() => {
    // Rediriger vers index après un court délai
    router.push('/')
  }, [router])
  
  return null
}