import { useState, useEffect } from 'react'

const ExpiryTimer = ({ expiresAt, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!expiresAt) return

    const calculateTimeLeft = () => {
      const difference = expiresAt - Date.now()
      
      if (difference <= 0) {
        setTimeLeft('00:00')
        onExpired()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const seconds = Math.floor((difference / 1000) % 60)
      
      let formatted = ''
      if (days > 0) {
        formatted += `${days}d `
      }
      if (hours > 0 || days > 0) {
        formatted += `${hours.toString().padStart(2, '0')}:`
      }
      formatted += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      
      setTimeLeft(formatted)
    }

    // Initial call
    calculateTimeLeft()

    // Setup interval
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [expiresAt, onExpired])

  if (!timeLeft) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg shadow-inner">
      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
        Key expires in
      </span>
      <span className="text-red-600 dark:text-red-400 font-mono font-bold text-sm">
        {timeLeft}
      </span>
    </div>
  )
}

export default ExpiryTimer
