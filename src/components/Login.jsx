import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { loginUser } from '../services/api'
import { toast } from 'react-toastify'
import { MdLogin, MdVpnKey, MdVisibility, MdVisibilityOff } from 'react-icons/md'

const CameraHeaderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)

const Login = ({ onLoginSuccess }) => {
  // Key format: 14 chars + '-' + 8 chars = 23 chars total. 
  // We only track the 22 alphanumeric characters in our state array.
  const [keyParts, setKeyParts] = useState(Array(22).fill(''))
  const [loading, setLoading] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  // Auto-submit when all fields are filled
  useEffect(() => {
    if (keyParts.every(part => part !== '') && !loading) {
      const part1 = keyParts.slice(0, 14).join('')
      const part2 = keyParts.slice(14).join('')
      attemptLogin(`${part1}-${part2}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyParts])

  const attemptLogin = async (fullKey) => {
    if (loading) return
    setLoading(true)
    try {
      const data = await loginUser(fullKey)
      if (data.success) {
        toast.success('Access Granted')
        onLoginSuccess(data.expiresAt)
      }
    } catch (error) {
      // Clear fields and refocus on error
      setKeyParts(Array(22).fill(''))
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }

      if (error.code === 'ERR_NETWORK' || !error.response) {
        toast.error('Failed to connect to server')
      } else {
        toast.error(error.response?.data?.message || 'Invalid key. Access denied.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!keyParts[index] && index > 0) {
        // If current is empty, focus previous and delete
        e.preventDefault()
        const newParts = [...keyParts]
        newParts[index - 1] = ''
        setKeyParts(newParts)
        inputRefs.current[index - 1].focus()
      } else {
        // Delete current
        const newParts = [...keyParts]
        newParts[index] = ''
        setKeyParts(newParts)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus()
    } else if (e.key === 'ArrowRight' && index < 21) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleChange = (e, index) => {
    const val = e.target.value.toUpperCase()
    // Ignore non-alphanumeric except hyphen logic
    const sanitized = val.replace(/[^A-Z0-9]/g, '')
    
    if (sanitized) {
      const newParts = [...keyParts]
      newParts[index] = sanitized[sanitized.length - 1]
      setKeyParts(newParts)
      
      // Auto-advance
      if (index < 21) {
        inputRefs.current[index + 1].focus()
      }
    } else {
      // If user typed invalid char, clear if they replaced something
      const newParts = [...keyParts]
      newParts[index] = ''
      setKeyParts(newParts)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').toUpperCase()
    const sanitized = pastedData.replace(/[^A-Z0-9-]/g, '')
    // Strip hyphens to just get the 22 alphanumeric chars
    const chars = sanitized.replace(/-/g, '').slice(0, 22)
    
    if (chars.length > 0) {
      const newParts = [...keyParts]
      for (let i = 0; i < chars.length; i++) {
        newParts[i] = chars[i]
      }
      setKeyParts(newParts)
      
      // Focus the next empty input, or the last one if full
      const nextFocus = Math.min(chars.length, 21)
      inputRefs.current[nextFocus].focus()
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    
    const part1 = keyParts.slice(0, 14).join('')
    const part2 = keyParts.slice(14).join('')
    if (part1.length < 14 || part2.length < 8) {
      toast.error('Please enter the full 23-character key')
      return
    }
    
    const fullKey = `${part1}-${part2}`
    await attemptLogin(fullKey)
  }

  const renderBoxes = (startIndex, endIndex) => {
    return keyParts.slice(startIndex, endIndex).map((val, i) => {
      const actualIndex = startIndex + i
      return (
        <input
          key={actualIndex}
          ref={el => inputRefs.current[actualIndex] = el}
          type={showKey ? "text" : "password"}
          maxLength={1}
          value={val}
          placeholder="*"
          onChange={(e) => handleChange(e, actualIndex)}
          onKeyDown={(e) => handleKeyDown(e, actualIndex)}
          onPaste={handlePaste}
          className="w-7 h-9 md:w-8 md:h-10 bg-black/60 border border-white/20 rounded-md text-white text-center font-mono text-base md:text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase placeholder-gray-500"
        />
      )
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* Background Image - Fit Contain */}
      <div 
        className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-70"
        style={{ backgroundImage: "url('/Thumbnail.png')" }}
      />
      
      {/* Full Screen Blur Overlay Modal */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center backdrop-blur-[6px] bg-black/40"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-[95vw] xl:max-w-6xl mx-4 p-6 md:p-8 rounded-2xl shadow-2xl bg-black/60 border border-white/10 backdrop-blur-md"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4">
              <CameraHeaderIcon />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">Media Manager</h1>
            <p className="text-gray-300 text-sm">Enter your security key to login</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-8 items-center">
            
            <div className="flex flex-row items-center justify-center gap-2 md:gap-4 w-full">
              {/* Key Icon on Left */}
              <div className="hidden sm:flex items-center justify-center">
                <MdVpnKey className="text-gray-400 w-6 h-6 md:w-8 md:h-8" />
              </div>

              {/* Boxes Container */}
              <div className="flex flex-col xl:flex-row items-center gap-2 xl:gap-3">
                {/* First Part: 14 chars */}
                <div className="flex flex-wrap justify-center gap-1 md:gap-1.5">
                  {renderBoxes(0, 14)}
                </div>
                
                {/* Hyphen (hidden on small, shown on xl) */}
                <span className="text-white/50 text-2xl font-light hidden xl:inline">-</span>
                
                {/* Second Part: 8 chars */}
                <div className="flex items-center gap-2 xl:gap-0">
                  <span className="text-white/50 text-2xl font-light xl:hidden">-</span>
                  <div className="flex flex-wrap justify-center gap-1 md:gap-1.5">
                    {renderBoxes(14, 22)}
                  </div>
                </div>
              </div>

              {/* Eye Icon on Right */}
              <button 
                type="button" 
                onClick={() => setShowKey(!showKey)}
                className="flex items-center justify-center text-gray-400 hover:text-white transition-colors p-2"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <MdVisibilityOff className="w-6 h-6 md:w-8 md:h-8" /> : <MdVisibility className="w-6 h-6 md:w-8 md:h-8" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-md py-3 px-4 bg-white hover:bg-gray-300 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)]"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <MdLogin size={20} />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Login

