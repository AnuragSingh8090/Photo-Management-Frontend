import { useState } from 'react'
import { motion } from 'framer-motion'
import { loginUser } from '../services/api'
import { toast } from 'react-toastify'
import { MdVpnKey, MdLogin } from 'react-icons/md'

const CameraHeaderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)

const Login = ({ onLoginSuccess }) => {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!key.trim()) return

    setLoading(true)
    try {
      const data = await loginUser(key)
      if (data.success) {
        toast.success('Access Granted')
        onLoginSuccess(data.expiresAt)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid key. Access denied.')
    } finally {
      setLoading(false)
    }
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
          className="w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl bg-black/40 border border-white/10"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4">
              <CameraHeaderIcon />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">Media Manager</h1>
            <p className="text-gray-300 text-sm">Enter your security key to login</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MdVpnKey className="text-gray-400 w-5 h-5" />
              </div>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter security key..."
                className="w-full pl-12 pr-4 py-3 bg-black/60 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-center tracking-widest"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !key.trim()}
              className="w-full py-3 px-4 bg-white hover:bg-gray-300 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
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
