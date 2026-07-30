import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ImageCapture from './components/ImageCapture'
import RecordForm from './components/RecordForm'
import RecordsList from './components/RecordsList'
import ThemeToggle from './components/ThemeToggle'
import { fetchRecords } from './services/api'
import { motion } from 'framer-motion'

// Camera SVG Icon
const CameraHeaderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9" style={{ color: 'var(--text-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)

function App() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingRecord, setEditingRecord] = useState(null)

  // Load records on component mount
  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const data = await fetchRecords()
      setRecords(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (image) => {
    setSelectedImage(image)
    setEditingId(null)
    setEditingRecord(null)
  }

  const handleEdit = (record) => {
    setSelectedImage(null)
    setEditingId(record.id)
    setEditingRecord(record)
  }

  const handleCancel = () => {
    setSelectedImage(null)
    setEditingId(null)
    setEditingRecord(null)
  }

  const handleSuccess = () => {
    loadRecords()
    setSelectedImage(null)
    setEditingId(null)
    setEditingRecord(null)
    toast.success('Done!', { autoClose: 1500 })
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
      <div className="px-6 py-3 shadow-sm flex-shrink-0 flex items-center justify-between" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)' }}>
        <div className="flex items-center gap-3">
          <CameraHeaderIcon />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Photo Manager</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Organize and manage your photos</p>
          </div>
        </div>
        
        {/* Theme Toggle */}
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* LEFT SECTION - 70% - Camera/Upload */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-[70%] flex flex-col p-4 overflow-y-auto"
        >
          <ImageCapture 
            onImageSelect={handleImageSelect} 
            onSuccess={loadRecords}
            editingRecord={editingRecord}
            onCancelEdit={handleCancel}
          />
        </motion.div>

        {/* RIGHT SECTION - 30% - Records List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-[30%] flex flex-col"
        >
          <RecordsList
            records={records}
            onEdit={handleEdit}
            onDelete={loadRecords}
            loading={loading}
            editingId={editingId}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default App
