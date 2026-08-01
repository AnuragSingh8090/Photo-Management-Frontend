import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ImageCapture from './components/ImageCapture'
import RecordsList from './components/RecordsList'
import ThemeToggle from './components/ThemeToggle'
import Login from './components/Login'
import ExpiryTimer from './components/ExpiryTimer'
import { fetchRecords, verifyAuth, logoutUser, checkHealth } from './services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { MdLogout } from 'react-icons/md'

// Camera SVG Icon
const CameraHeaderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9" style={{ color: 'var(--text-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [expiryTime, setExpiryTime] = useState(null)

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewRecord, setViewRecord] = useState(null)
  const [editMode, setEditMode] = useState(false)

  // Verify auth on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        await checkHealth()
      } catch (err) {
        toast.error('Backend not connected')
        setIsAuthLoading(false)
        return
      }

      try {
        const data = await verifyAuth()
        if (data.success) {
          setIsAuthenticated(true)
          setExpiryTime(data.expiresAt)
        }
      } catch (err) {
        setIsAuthenticated(false)
      } finally {
        setIsAuthLoading(false)
      }
    }

    initApp()
  }, [])

  // Security: Logout if localStorage is tampered with or token invalid
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleStorageChange = () => {
      console.warn("Security Alert: LocalStorage tampered with.");
      toast.error('Security alert: State modified. Logging out.');
      handleLogout();
    };

    const handleAuthError = () => {
      console.warn("Security Alert: Invalid Token.");
      toast.error('Session invalid or expired. Logging out.');
      handleLogout();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth_error', handleAuthError);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth_error', handleAuthError);
    }
  }, [isAuthenticated])

  // Load records on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadRecords()
    }
  }, [isAuthenticated])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const data = await fetchRecords()
      setRecords(data)
    } catch (error) {
      console.error(error)
      if (error.response?.status === 401) {
        handleLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (e) {
      console.error(e)
    }
    setIsAuthenticated(false)
    setExpiryTime(null)
  }

  if (isAuthLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer theme="dark" position="top-right" autoClose={2000} hideProgressBar={true} />
        <Login onLoginSuccess={(expiresAt) => {
          setIsAuthenticated(true)
          setExpiryTime(expiresAt)
        }} />
      </>
    )
  }

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: 'linear-gradient(to bottom right, var(--bg-gradient-from), var(--bg-gradient-to))' }}>
      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar={true}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={1}
      />

      {/* Header */}
      <div className="px-2 py-1.5 lg:px-4 lg:py-2 min-[1100px]:px-6 min-[1100px]:py-3 shadow-sm flex-shrink-0 flex items-center justify-between" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)' }}>
        <div className="flex items-center gap-1.5 lg:gap-2 min-[1100px]:gap-3">
          <CameraHeaderIcon />
          <div>
            <h1 className="text-base lg:text-xl min-[1100px]:text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Media Manager</h1>
            <p className="text-[10px] lg:text-xs min-[1100px]:text-sm" style={{ color: 'var(--text-secondary)' }}>Organize and manage your media</p>
          </div>
        </div>
        
        {/* Right Header Actions */}
        <div className="flex items-center gap-3 lg:gap-6 scale-75 lg:scale-90 min-[1100px]:scale-100 origin-right">
          <ExpiryTimer 
            expiresAt={expiryTime} 
            onExpired={() => {
              toast.error('Session expired!')
              handleLogout()
            }} 
          />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden md:gap-0">
        {/* LEFT SECTION - 70% - Camera/Upload */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full md:w-[70%] md:flex-1 flex flex-col p-2 lg:p-4 overflow-y-auto"
        >
          <ImageCapture 
            onSuccess={loadRecords} 
            viewRecord={viewRecord} 
            editMode={editMode}
            onClearView={() => { setViewRecord(null); setEditMode(false); }} 
          />
        </motion.div>

        {/* RIGHT SECTION - 30% - Records List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full md:w-[30%] md:min-w-[370px] md:max-w-[530px] flex flex-col h-[50vh] md:h-auto"
        >
          <RecordsList
            records={records}
            onDelete={loadRecords}
            loading={loading}
            onViewRecord={(record) => { setViewRecord(record); setEditMode(false); }}
            onEditRecord={(record) => { setViewRecord(record); setEditMode(true); }}
            activeRecordId={viewRecord?.id}
            editMode={editMode}
            onCancelEdit={() => { setViewRecord(null); setEditMode(false); }}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default App
