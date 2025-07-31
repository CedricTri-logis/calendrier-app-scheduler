import { useState, useEffect } from 'react'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // Check if it's a touch device
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Check screen width (typical mobile breakpoint)
      const isSmallScreen = window.innerWidth <= 768
      
      // Check user agent for mobile devices
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isMobileUserAgent = mobileRegex.test(navigator.userAgent)
      
      // Consider it mobile if it's either a touch device with small screen or has mobile user agent
      setIsMobile((isTouchDevice && isSmallScreen) || isMobileUserAgent)
    }

    // Check on mount
    checkMobile()

    // Check on resize
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return isMobile
}