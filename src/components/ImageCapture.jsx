import { useState, useRef, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { MdSave, MdCancel, MdClose, MdDelete, MdAdd, MdVideocam, MdStop, MdPlayArrow } from 'react-icons/md'
import { saveRecord, updateRecord, addMediaToRecord, deleteMediaFromRecord } from '../services/api'
import { getCurrentDate, getCurrentTime, formatTime } from '../utils/dateTime'
import DeleteConfirmModal from './DeleteConfirmModal'

// SVG Icons
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 lg:w-4 lg:h-4 min-[1100px]:w-5 min-[1100px]:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)

const CameraLargeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 lg:w-12 lg:h-12 min-[1100px]:w-16 min-[1100px]:h-16" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 lg:w-4 lg:h-4 min-[1100px]:w-5 min-[1100px]:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 lg:w-4 lg:h-4 min-[1100px]:w-5 min-[1100px]:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 lg:w-3.5 lg:h-3.5 min-[1100px]:w-4 min-[1100px]:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 lg:w-3.5 lg:h-3.5 min-[1100px]:w-4 min-[1100px]:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 lg:w-4 lg:h-4 min-[1100px]:w-5 min-[1100px]:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

/**
 * Determine if a file is image or video
 */
const getFileType = (file) => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'unknown'
}

/**
 * ImageCapture Component
 * Multi-media upload with camera photo capture and video recording
 */
function ImageCapture({ onSuccess, viewRecord, onClearView, editMode }) {
  const [isAddMode, setIsAddMode] = useState(true) // Whether the main area shows Add options
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaFiles, setMediaFiles] = useState([]) // { file: File, preview: string, type: 'image'|'video' }
  const [selectedIndex, setSelectedIndex] = useState(0) // Which media is currently previewed
  
  const [deleteTarget, setDeleteTarget] = useState(null) // index to delete
  const [previewMedia, setPreviewMedia] = useState(null) // { url, type } for fullscreen modal
  const [deletedMediaNames, setDeletedMediaNames] = useState([]) // keep track of deleted filenames in edit mode
  const [videoDurations, setVideoDurations] = useState({}) // keep track of video durations
  
  const webcamRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const dateDropdownRef = useRef(null)
  const timeDropdownRef = useRef(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false)
  
  // Date picker state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  
  // Time picker state
  const [selectedHours, setSelectedHours] = useState(new Date().getHours())
  const [selectedMinutes, setSelectedMinutes] = useState(new Date().getMinutes())
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().getHours() >= 12 ? 'PM' : 'AM')

  const isViewMode = Boolean(viewRecord) && !editMode
  const isEditMode = Boolean(viewRecord) && editMode

  // Handle View Mode population
  useEffect(() => {
    if (viewRecord) {
      setIsAddMode(false)
      setIsCameraActive(false)
      
      setFormData({
        name: viewRecord.name || '',
        date: viewRecord.date || '',
        time: viewRecord.time || ''
      })
      
      const mappedMedia = (viewRecord.media || []).map(m => ({
        ...m,
        preview: m.url, // map url to preview for rendering
      }))
      setMediaFiles(mappedMedia)
      setSelectedIndex(0)
      setDeletedMediaNames([])
    } else {
      // Clear state when viewRecord becomes null (cancelled from list)
      setMediaFiles(prev => {
        prev.forEach(m => {
          if (m.type === 'video' && m.preview.startsWith('blob:')) {
            URL.revokeObjectURL(m.preview)
          }
        })
        return []
      })
      setFormData({
        name: '',
        date: getCurrentDate(),
        time: getCurrentTime(),
      })
      setErrors({})
      setIsCameraActive(false)
      setIsRecording(false)
      setIsAddMode(true)
      setSelectedIndex(0)
      setDeletedMediaNames([])
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [viewRecord, editMode])

  useEffect(() => {
    if (mediaFiles.length === 0 && !isViewMode && !isEditMode) {
      const interval = setInterval(() => {
        setFormData(prev => ({
          ...prev,
          date: getCurrentDate(),
          time: getCurrentTime(),
        }))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [mediaFiles.length, isViewMode])

  // Initialize date/time when first file is added
  useEffect(() => {
    if (mediaFiles.length > 0 && (!formData.date || !formData.time)) {
      setFormData(prev => ({
        ...prev,
        date: getCurrentDate(),
        time: getCurrentTime(),
      }))
    }
  }, [mediaFiles.length])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false)
        setShowMonthDropdown(false)
        setShowYearDropdown(false)
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target)) {
        setIsTimeDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev + 1 >= 600) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop()
              setIsRecording(false)
              toast.info('10 minuites reached')
            }
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      setRecordingTime(0)
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [isRecording])

  /**
   * Capture photo from webcam
   */
  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        const blob = dataURItoBlob(imageSrc)
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
        
        setMediaFiles(prev => {
          const newArr = [...prev, { file, preview: imageSrc, type: 'image' }]
          setSelectedIndex(newArr.length - 1)
          return newArr
        })
        
        setIsCameraActive(false)
        setIsAddMode(false)
        
        if (mediaFiles.length === 0) {
          setFormData(prev => ({
            ...prev,
            date: getCurrentDate(),
            time: getCurrentTime(),
          }))
        }
      }
    }
  }

  /**
   * Start video recording
   */
  const startRecording = useCallback(() => {
    if (!webcamRef.current || !webcamRef.current.video) return
    
    const stream = webcamRef.current.video.srcObject
    if (!stream) return
    
    recordedChunksRef.current = []
    
    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' })
        const videoUrl = URL.createObjectURL(blob)
        
        setMediaFiles(prev => {
          const newArr = [...prev, { file, preview: videoUrl, type: 'video' }]
          setSelectedIndex(newArr.length - 1)
          return newArr
        })
        
        setIsCameraActive(false)
        setIsAddMode(false)
        
        if (mediaFiles.length === 0) {
          setFormData(prev => ({
            ...prev,
            date: getCurrentDate(),
            time: getCurrentTime(),
          }))
        }
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // collect data every 100ms
      setIsRecording(true)
    } catch (err) {
      console.error('MediaRecorder error:', err)
      toast.error('Video recording not supported in this browser', { autoClose: 2000 })
    }
  }, [mediaFiles.length])

  /**
   * Stop video recording
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  /**
   * Handle file upload from device
   */
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    const newMediaFiles = []
    let processed = 0

    files.forEach(file => {
      const type = getFileType(file)
      if (type === 'unknown') {
        toast.error(`${file.name} is not a supported format`, { autoClose: 1500 })
        processed++
        return
      }

      if (type === 'image') {
        const reader = new FileReader()
        reader.onload = (event) => {
          newMediaFiles.push({
            file,
            preview: event.target.result,
            type: 'image'
          })
          processed++
          if (processed === files.length) {
            setMediaFiles(prev => {
              const newArr = [...prev, ...newMediaFiles]
              setSelectedIndex(newArr.length - 1)
              return newArr
            })
            setIsAddMode(false)
            if (mediaFiles.length === 0 && newMediaFiles.length > 0) {
              setFormData(prev => ({
                ...prev,
                date: getCurrentDate(),
                time: getCurrentTime(),
              }))
            }
          }
        }
        reader.readAsDataURL(file)
      } else {
        // Video
        const videoUrl = URL.createObjectURL(file)
        newMediaFiles.push({
          file,
          preview: videoUrl,
          type: 'video'
        })
        processed++
        if (processed === files.length) {
          setMediaFiles(prev => {
            const newArr = [...prev, ...newMediaFiles]
            setSelectedIndex(newArr.length - 1)
            return newArr
          })
          setIsAddMode(false)
          if (mediaFiles.length === 0 && newMediaFiles.length > 0) {
            setFormData(prev => ({
              ...prev,
              date: getCurrentDate(),
              time: getCurrentTime(),
            }))
          }
        }
      }
    })

    e.target.value = ''
  }

  /**
   * Convert data URI to blob
   */
  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1])
    const mimeString = dataURI.split(',')[0].match(/:(.*?);/)[1]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    return new Blob([ab], { type: mimeString })
  }

  /**
   * Delete a media file from the list
   */
  const handleDeleteMedia = (indexToDelete) => {
    const fileToDelete = mediaFiles[indexToDelete]
    
    // Revoke object URL if it's a blob
    if (fileToDelete.preview && fileToDelete.preview.startsWith('blob:')) {
      URL.revokeObjectURL(fileToDelete.preview)
    }
    
    // Track deleted filenames in edit mode
    if (isEditMode && fileToDelete.fileName) {
      setDeletedMediaNames(prev => [...prev, fileToDelete.fileName])
    }

    setMediaFiles(prev => {
      const updated = prev.filter((_, i) => i !== indexToDelete)
      
      // Adjust selected index
      if (updated.length === 0) {
        setIsAddMode(true)
        setSelectedIndex(0)
      } else if (indexToDelete === selectedIndex) {
        setSelectedIndex(0)
      } else if (indexToDelete < selectedIndex) {
        setSelectedIndex(selectedIndex - 1)
      }
      
      return updated
    })
    setDeleteTarget(null)
    toast.success('Removed', { autoClose: 1000 })
  }

  /**
   * Format recording time
   */
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (mediaFiles.length === 0) {
      toast.error('Please add at least one photo or video', { autoClose: 1500 })
      return false
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  /**
   * Handle date change from custom picker
   */
  const handleDateChange = (newDate) => {
    setFormData((prev) => ({
      ...prev,
      date: newDate,
    }))
    setIsDateDropdownOpen(false)
  }

  /**
   * Handle time change from custom picker
   */
  const handleTimeChange = (newTime) => {
    setFormData((prev) => ({
      ...prev,
      time: newTime,
    }))
    setIsTimeDropdownOpen(false)
  }

  /**
   * Generate days in month
   */
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  /**
   * Get current date parts
   */
  const getDateParts = () => {
    if (!formData.date) return { year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() }
    const [year, month, day] = formData.date.split('-').map(Number)
    return { year, month: month - 1, day }
  }

  // Update picker state when dropdown opens
  useEffect(() => {
    if (isDateDropdownOpen) {
      const { year, month } = getDateParts()
      setSelectedYear(year)
      setSelectedMonth(month)
    }
  }, [isDateDropdownOpen])

  useEffect(() => {
    if (isTimeDropdownOpen) {
      const [hours, minutes] = formData.time ? formData.time.split(':').map(Number) : [new Date().getHours(), new Date().getMinutes()]
      setSelectedHours(hours % 12 || 12)
      setSelectedMinutes(minutes)
      setSelectedPeriod(hours >= 12 ? 'PM' : 'AM')
    }
  }, [isTimeDropdownOpen])

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    if (isEditMode) {
      try {
        setLoading(true)
        
        // Update text details
        await updateRecord(viewRecord.id, formData)
        
        // Add new media
        const newFiles = mediaFiles.filter(m => m.file && !m.fileName)
        for (const m of newFiles) {
           await addMediaToRecord(viewRecord.id, m.file)
        }
        
        // Delete removed media
        for (const fileName of deletedMediaNames) {
           await deleteMediaFromRecord(viewRecord.id, fileName)
        }
        
        toast.success('Record updated successfully!')
        handleCancel() // to clear view modes
        onSuccess && onSuccess()
      } catch (error) {
        console.error('Error updating record:', error)
        toast.error('Failed to update record')
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)

    try {
      await saveRecord({
        name: formData.name,
        date: formData.date,
        time: formData.time,
        description: '',
        files: mediaFiles.map(m => m.file),
      })
      toast.success('Record saved successfully', { autoClose: 2000 })
      
      // Clear form and media
      setMediaFiles([])
      setFormData({
        name: '',
        date: getCurrentDate(),
        time: getCurrentTime(),
      })
      setErrors({})
      setIsAddMode(true)
      setIsCameraActive(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to save record', { autoClose: 2000 })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (isViewMode || isEditMode) {
      onClearView && onClearView()
      return
    }
    // Revoke all blob URLs
    mediaFiles.forEach(m => {
      if (m.type === 'video' && m.preview.startsWith('blob:')) {
        URL.revokeObjectURL(m.preview)
      }
    })
    setMediaFiles([])
    setFormData({
      name: '',
      date: getCurrentDate(),
      time: getCurrentTime(),
    })
    setErrors({})
    setIsCameraActive(false)
    setIsRecording(false)
    setIsAddMode(true)
    setSelectedIndex(0)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const hasMedia = mediaFiles.length > 0
  const isFormDisabled = !formData.name.trim() || !formData.date || !formData.time || !hasMedia || (isViewMode && mediaFiles[selectedIndex]?.isStored)
  
  const currentPreview = mediaFiles[selectedIndex]

  return (
    <>
      <div className="h-full flex flex-col min-[1100px]:flex-row gap-3 min-[1100px]:gap-4 p-3 min-[1100px]:p-4 rounded-lg shadow-sm overflow-hidden" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
        
        {/* LEFT: Main Display Area (Camera / Upload / Preview) */}
        <div className="flex-1 relative rounded-lg overflow-hidden flex flex-col" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <AnimatePresence mode="wait">
            {isAddMode || !hasMedia ? (
              isCameraActive ? (
                // Camera / Recording View
                <motion.div
                  key="camera"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      width: 1280,
                      height: 720,
                      facingMode: 'user',
                    }}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Recording indicator */}
                  {isRecording && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-20 recording-pulse">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      <span className="font-bold text-sm">{formatRecordingTime(recordingTime)}</span>
                    </div>
                  )}

                  {/* Camera Controls */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                    <button
                      onClick={() => {
                        if (isRecording) stopRecording()
                        setIsCameraActive(false)
                        if (hasMedia) setIsAddMode(false) // Go back to preview if we have media
                      }}
                      className="btn-hover font-semibold rounded-lg py-2 px-4 transition-smooth flex items-center justify-center gap-2 whitespace-nowrap min-w-[110px] lg:min-w-[130px] text-xs lg:text-sm"
                      style={{ 
                        background: '#4b5563', 
                        color: 'white',
                        boxShadow: 'var(--shadow-lg)' 
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
                      onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                    >
                      <XIcon />
                      Cancel
                    </button>
                    
                    {!isRecording && (
                      <button
                        onClick={capturePhoto}
                        className="btn-hover font-semibold rounded-lg py-2 px-4 transition-smooth flex items-center justify-center gap-2 whitespace-nowrap min-w-[110px] lg:min-w-[130px] text-xs lg:text-sm"
                        style={{ 
                          background: '#16a34a', 
                          color: 'white',
                          boxShadow: 'var(--shadow-lg)' 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                      >
                        <CameraIcon />
                        Capture Photo
                      </button>
                    )}
                    
                    {isRecording ? (
                      <button
                        onClick={stopRecording}
                        className="btn-hover font-semibold rounded-lg py-2 px-4 transition-smooth flex items-center justify-center gap-2 whitespace-nowrap min-w-[110px] lg:min-w-[130px] text-xs lg:text-sm"
                        style={{ 
                          background: '#dc2626', 
                          color: 'white',
                          boxShadow: 'var(--shadow-lg)' 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                      >
                        <MdStop size={20} />
                        Stop Recording
                      </button>
                    ) : (
                      <button
                        onClick={startRecording}
                        className="btn-hover font-semibold rounded-lg py-2 px-4 transition-smooth flex items-center justify-center gap-2 whitespace-nowrap min-w-[110px] lg:min-w-[130px] text-xs lg:text-sm"
                        style={{ 
                          background: '#dc2626', 
                          color: 'white',
                          boxShadow: 'var(--shadow-lg)' 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                      >
                        <MdVideocam size={20} />
                        Record Video
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                // Upload Options View
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col items-center justify-center relative"
                >
                  {hasMedia && (
                    <button
                      onClick={() => setIsAddMode(false)}
                      className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-smooth shadow-md"
                      title="Back to Preview"
                    >
                      <MdClose size={20} />
                    </button>
                  )}
                  <div className="flex flex-col gap-3 items-center">
                    <CameraLargeIcon />
                    <p className="text-base mt-6 mb-6" style={{ color: 'var(--text-secondary)' }}>
                      {hasMedia ? 'Add more media' : 'No media selected'}
                    </p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsCameraActive(true)}
                        className="btn-hover font-semibold rounded-lg py-2 px-6 flex items-center justify-center gap-2 transition-smooth min-w-[120px]"
                        style={{ 
                          background: 'var(--accent-blue)', 
                          color: 'white',
                          boxShadow: 'var(--shadow-sm)' 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                      >
                        <CameraIcon />
                        <span>Camera</span>
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-hover font-semibold rounded-lg py-2 px-6 flex items-center justify-center gap-2 transition-smooth min-w-[120px]"
                        style={{ 
                          background: 'var(--accent-blue)', 
                          color: 'white',
                          boxShadow: 'var(--shadow-sm)' 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                      >
                        <UploadIcon />
                        <span>Upload</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            ) : (
              // Media Preview View
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex items-center justify-center relative group bg-black/5"
              >
                {currentPreview?.type === 'image' ? (
                  <div className="w-full h-full p-[30px]">
                    <img
                      src={currentPreview.preview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full relative flex items-center justify-center">
                    <video
                      src={currentPreview?.preview}
                      className="w-full h-full object-contain"
                      muted
                      preload="metadata"
                      controls
                    />
                  </div>
                )}
                
                {/* Top right actions (always visible) */}
                <div className="absolute top-3 right-3 flex gap-2 z-10 transition-opacity">
                  <button
                    onClick={() => setPreviewMedia({ url: currentPreview?.preview, type: currentPreview?.type })}
                    className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-800 hover:bg-gray-100 hover:scale-110 transition-smooth dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    title="View Fullscreen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                  {!isViewMode && (
                    <button
                      onClick={() => setDeleteTarget(selectedIndex)}
                      className="w-9 h-9 rounded-full bg-red-600/90 shadow-md flex items-center justify-center text-white hover:bg-red-600 hover:scale-110 transition-smooth"
                      title="Delete Media"
                    >
                      <MdDelete size={18} />
                    </button>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full min-[1100px]:w-[35%] min-[1100px]:min-w-[280px] min-[1100px]:max-w-[350px] flex flex-col shrink-0 overflow-hidden h-full">
          
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="shrink-0">
              <h2 className="text-base lg:text-lg min-[1100px]:text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Record Details
            </h2>

            {/* Name Field */}
            <div className="mb-3">
              <label className="block text-[11px] lg:text-xs min-[1100px]:text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter record name"
                disabled={isViewMode}
                className={`w-full px-2 py-1 lg:px-3 lg:py-1.5 min-[1100px]:px-4 min-[1100px]:py-2 text-xs lg:text-sm min-[1100px]:text-base rounded-lg border transition-smooth focus:outline-none focus:ring-2 ${isViewMode ? 'opacity-80 cursor-not-allowed bg-gray-100' : ''}`}
                style={{ 
                  background: isViewMode ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => {
                  if(!isViewMode) {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-blue-light)'
                  }
                }}
                onBlur={(e) => {
                  if(!isViewMode) {
                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              />
              {errors.name && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs mt-1">
                  {errors.name}
                </motion.p>
              )}
            </div>

            {/* Date Field */}
            <div className="mb-3">
              <label className="block text-[11px] lg:text-xs min-[1100px]:text-sm font-semibold text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={dateDropdownRef}>
                <div
                  onClick={() => hasMedia && !isViewMode && setIsDateDropdownOpen(!isDateDropdownOpen)}
                  className={`w-full px-2 py-1 lg:px-3 lg:py-1.5 min-[1100px]:px-4 min-[1100px]:py-2 text-xs lg:text-sm min-[1100px]:text-base rounded-lg border transition-smooth flex items-center gap-1 lg:gap-2 ${
                    !hasMedia || isViewMode
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-80'
                      : 'bg-white border-gray-300 text-gray-800 cursor-pointer hover:border-blue-500'
                  }`}
                >
                  <CalendarIcon />
                  <span>{hasMedia || isViewMode ? formData.date : '--'}</span>
                </div>
                
                {isDateDropdownOpen && hasMedia && !isViewMode && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80"
                  >
                    {/* Month and Year Selector */}
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 relative">
                        <button
                          type="button"
                          onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-left flex items-center justify-between"
                        >
                          <span>{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showMonthDropdown && (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setSelectedMonth(i)
                                  setShowMonthDropdown(false)
                                }}
                                className={`w-full px-3 py-2 text-sm text-left hover:bg-blue-50 transition-smooth ${
                                  selectedMonth === i ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowYearDropdown(!showYearDropdown)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white flex items-center gap-2"
                        >
                          <span>{selectedYear}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showYearDropdown && (
                          <div className="absolute z-50 mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                              <button
                                key={y}
                                type="button"
                                onClick={() => {
                                  setSelectedYear(y)
                                  setShowYearDropdown(false)
                                }}
                                className={`w-full px-4 py-2 text-sm text-left hover:bg-blue-50 transition-smooth ${
                                  selectedYear === y ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'
                                }`}
                              >
                                {y}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Day Names */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-gray-600 py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const { day } = getDateParts()
                        const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
                        const firstDay = new Date(selectedYear, selectedMonth, 1).getDay()
                        
                        return (
                          <>
                            {Array.from({ length: firstDay }).map((_, i) => (
                              <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const dayNum = i + 1
                              const isSelected = dayNum === day && selectedMonth === getDateParts().month && selectedYear === getDateParts().year
                              const isToday = dayNum === new Date().getDate() && selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear()
                              
                              return (
                                <motion.button
                                  key={dayNum}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  type="button"
                                  onClick={() => {
                                    const newDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                                    setFormData((prev) => ({
                                      ...prev,
                                      date: newDate,
                                    }))
                                    setShowMonthDropdown(false)
                                    setShowYearDropdown(false)
                                  }}
                                  className={`py-2 text-sm rounded-lg transition-all ${
                                    isSelected
                                      ? 'bg-blue-600 text-white font-bold shadow-md'
                                      : isToday
                                      ? 'bg-blue-100 text-blue-700 font-semibold'
                                      : 'hover:bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {dayNum}
                                </motion.button>
                              )
                            })}
                          </>
                        )
                      })()}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const todayDate = getCurrentDate()
                          setFormData((prev) => ({
                            ...prev,
                            date: todayDate,
                          }))
                          const today = new Date()
                          setSelectedYear(today.getFullYear())
                          setSelectedMonth(today.getMonth())
                        }}
                        className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-semibold transition-smooth"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDateChange(formData.date)
                          setShowMonthDropdown(false)
                          setShowYearDropdown(false)
                        }}
                        className="flex-1 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold transition-smooth"
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Time Field */}
            <div className="mb-3">
              <label className="block text-[11px] lg:text-xs min-[1100px]:text-sm font-semibold text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={timeDropdownRef}>
                <div
                  onClick={() => hasMedia && !isViewMode && setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                  className={`w-full px-2 py-1 lg:px-3 lg:py-1.5 min-[1100px]:px-4 min-[1100px]:py-2 text-xs lg:text-sm min-[1100px]:text-base rounded-lg border transition-smooth flex items-center gap-1 lg:gap-2 ${
                    !hasMedia || isViewMode
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-80'
                      : 'bg-white border-gray-300 text-gray-800 cursor-pointer hover:border-blue-500'
                  }`}
                >
                  <ClockIcon />
                  <span>{hasMedia || isViewMode ? formatTime(formData.time) : '--'}</span>
                </div>
                
                {isTimeDropdownOpen && hasMedia && !isViewMode && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute z-50 mt-2 rounded-lg shadow-xl p-4 w-72"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-primary)'
                    }}
                  >
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {String(selectedHours).padStart(2, '0')}:{String(selectedMinutes).padStart(2, '0')} {selectedPeriod}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {/* Hours */}
                      <div className="flex-1">
                        <div className="text-xs font-semibold mb-2 text-center" style={{ color: 'var(--text-secondary)' }}>Hours</div>
                        <div className="h-48 overflow-y-auto overflow-x-hidden rounded-lg" style={{ border: '1px solid var(--border-primary)' }}>
                          {Array.from({ length: 12 }).map((_, i) => {
                            const hour = i === 0 ? 12 : i
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setSelectedHours(hour)}
                                className="w-full py-2 text-sm transition-all"
                                style={{
                                  background: selectedHours === hour ? 'var(--accent-blue)' : 'transparent',
                                  color: selectedHours === hour ? 'white' : 'var(--text-primary)',
                                  fontWeight: selectedHours === hour ? 'bold' : 'normal'
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedHours !== hour) e.currentTarget.style.background = 'var(--bg-hover)'
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedHours !== hour) e.currentTarget.style.background = 'transparent'
                                }}
                              >
                                {String(hour).padStart(2, '0')}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Minutes */}
                      <div className="flex-1">
                        <div className="text-xs font-semibold mb-2 text-center" style={{ color: 'var(--text-secondary)' }}>Minutes</div>
                        <div className="h-48 overflow-y-auto overflow-x-hidden rounded-lg" style={{ border: '1px solid var(--border-primary)' }}>
                          {Array.from({ length: 60 }).map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSelectedMinutes(i)}
                              className="w-full py-2 text-sm transition-all"
                              style={{
                                background: selectedMinutes === i ? 'var(--accent-blue)' : 'transparent',
                                color: selectedMinutes === i ? 'white' : 'var(--text-primary)',
                                fontWeight: selectedMinutes === i ? 'bold' : 'normal'
                              }}
                              onMouseEnter={(e) => {
                                if (selectedMinutes !== i) e.currentTarget.style.background = 'var(--bg-hover)'
                              }}
                              onMouseLeave={(e) => {
                                if (selectedMinutes !== i) e.currentTarget.style.background = 'transparent'
                              }}
                            >
                              {String(i).padStart(2, '0')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* AM/PM */}
                      <div className="flex flex-col gap-2">
                        <div className="text-xs font-semibold mb-2 text-center" style={{ color: 'var(--text-secondary)' }}>Period</div>
                        <button
                          type="button"
                          onClick={() => setSelectedPeriod('AM')}
                          className="px-3 py-2 text-sm font-semibold rounded-lg transition-all"
                          style={{
                            background: selectedPeriod === 'AM' ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                            color: selectedPeriod === 'AM' ? 'white' : 'var(--text-primary)',
                            border: '1px solid var(--border-primary)'
                          }}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPeriod('PM')}
                          className="px-3 py-2 text-sm font-semibold rounded-lg transition-all"
                          style={{
                            background: selectedPeriod === 'PM' ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                            color: selectedPeriod === 'PM' ? 'white' : 'var(--text-primary)',
                            border: '1px solid var(--border-primary)'
                          }}
                        >
                          PM
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 flex gap-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date()
                          const newHours = now.getHours()
                          const newMinutes = now.getMinutes()
                          setSelectedHours(newHours % 12 || 12)
                          setSelectedMinutes(newMinutes)
                          setSelectedPeriod(newHours >= 12 ? 'PM' : 'AM')
                          const time24 = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
                          handleTimeChange(time24)
                        }}
                        className="flex-1 py-2 text-sm font-semibold rounded-lg transition-smooth"
                        style={{
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-secondary)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      >
                        Now
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          let hours24 = selectedHours
                          if (selectedPeriod === 'PM' && selectedHours !== 12) {
                            hours24 = selectedHours + 12
                          } else if (selectedPeriod === 'AM' && selectedHours === 12) {
                            hours24 = 0
                          }
                          const newTime = `${String(hours24).padStart(2, '0')}:${String(selectedMinutes).padStart(2, '0')}`
                          handleTimeChange(newTime)
                        }}
                        className="flex-1 py-2 text-sm text-white font-semibold rounded-lg transition-smooth"
                        style={{ background: 'var(--accent-blue)' }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            </div>

          {/* Thumbnails Section */}
          <div className="flex-1 overflow-y-auto flex flex-col min-h-0 mt-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
            <div className="flex items-center justify-between my-2 shrink-0 pr-1">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                Photos and Videos ({mediaFiles.length})
              </h3>
              {!isViewMode && (
                <button
                  type="button"
                  onClick={() => setIsAddMode(true)}
                  className="px-2 py-1 flex items-center gap-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-smooth text-[10px] lg:text-xs font-semibold border border-gray-200 dark:border-gray-700"
                  title="Add Media"
                >
                  <MdAdd size={14} />
                  Add Media
                </button>
              )}
            </div>
            
            {hasMedia ? (
              <div className="flex-1 overflow-y-auto p-1">
                <div className="grid grid-cols-3 gap-2">
                  {mediaFiles.map((media, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`relative aspect-square rounded-lg p-1 cursor-pointer transition-all ${selectedIndex === index && !isAddMode ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}
                    style={{ border: '1px solid var(--border-primary)' }}
                    onClick={() => {
                      setSelectedIndex(index)
                      setIsAddMode(false)
                    }}
                  >
                    <div className="w-full h-full rounded-md overflow-hidden relative">
                      {media.type === 'image' ? (
                        <img
                          src={media.preview}
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-cover opacity-90 hover:opacity-100"
                        />
                      ) : (
                        <div className="w-full h-full relative flex items-center justify-center bg-gray-800">
                          <video
                            src={media.preview}
                            className="w-full h-full object-cover opacity-90"
                            onLoadedMetadata={(e) => {
                              const d = e.currentTarget.duration;
                              if (d && !isNaN(d) && d !== Infinity) {
                                const mins = Math.floor(d / 60);
                                const secs = Math.floor(d % 60);
                                setVideoDurations(prev => ({
                                  ...prev,
                                  [media.preview]: `${mins}:${secs.toString().padStart(2, '0')}`
                                }));
                              }
                            }}
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-md">
                              <MdPlayArrow size={20} className="text-gray-800 dark:text-white" />
                            </div>
                          </div>
                          
                          {/* Duration badge */}
                          {videoDurations[media.preview] && (
                            <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[8px] font-bold bg-black/70 text-white z-10">
                              {videoDurations[media.preview]}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Type badge */}
                    <div className="absolute top-1 left-1 px-1 py-0.5 rounded text-[8px] font-bold uppercase z-10"
                      style={{
                        background: media.type === 'video' ? 'rgba(220, 38, 38, 0.85)' : 'rgba(37, 99, 235, 0.85)',
                        color: 'white'
                      }}
                    >
                      {media.type === 'video' ? 'VID' : 'IMG'}
                    </div>

                    {/* Delete button (Hide in View Mode) */}
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(index)
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md bg-red-600 text-white hover:scale-110 transition-smooth z-10"
                        title="Delete"
                      >
                        <MdDelete size={12} />
                      </button>
                    )}
                  </motion.div>
                  ))}
                  
                  {/* Add more card */}
                  {!isViewMode && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-smooth border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 ${isAddMode ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
                      onClick={() => setIsAddMode(true)}
                    >
                      <MdAdd size={24} className="text-gray-500 dark:text-white" />
                      <span className="text-[10px] mt-1 font-medium text-gray-500 dark:text-white">Add Media</span>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col text-center opacity-50 p-4">
                <ImageIcon />
                <p className="text-xs mt-2">No media added yet.</p>
                <p className="text-[10px]">{!isViewMode ? 'Click the big camera icon to start.' : ''}</p>
              </div>
            )}
          </div>

          {/* Action Buttons at bottom */}
          <div className="shrink-0 flex gap-1 lg:gap-2 min-[1100px]:gap-3 mt-2 pt-3 border-t border-gray-200">
            {isViewMode ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-200 hover:bg-gray-300 transition-smooth rounded-lg py-2.5 lg:py-3 px-3 text-xs lg:text-sm min-[1100px]:text-base font-semibold flex items-center justify-center gap-1 min-[1100px]:gap-2 text-gray-800"
              >
                <MdCancel />
                Cancel
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={hasMedia ? { scale: 1.02 } : {}}
                  whileTap={hasMedia ? { scale: 0.98 } : {}}
                  type="button"
                  onClick={handleCancel}
                  disabled={!hasMedia || loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth rounded-lg py-2.5 lg:py-3 px-3 text-xs lg:text-sm min-[1100px]:text-base font-semibold flex items-center justify-center gap-1 min-[1100px]:gap-2"
                >
                  <MdCancel />
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={!isFormDisabled ? { scale: 1.02 } : {}}
                  whileTap={!isFormDisabled ? { scale: 0.98 } : {}}
                  type="submit"
                  disabled={loading || isFormDisabled}
                  className={`flex-1 py-2.5 lg:py-3 px-3 text-white text-xs lg:text-sm min-[1100px]:text-base font-semibold rounded-lg flex items-center justify-center gap-1 min-[1100px]:gap-2 transition-smooth ${
                    isFormDisabled
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  <MdSave />
                  {loading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
                </motion.button>
              </>
            )}
          </div>
          </form>

        </div>
      </div>

      {/* Delete Media Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onConfirm={() => handleDeleteMedia(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        recordName={deleteTarget !== null ? `${mediaFiles[deleteTarget]?.type === 'video' ? 'Video' : 'Photo'} ${deleteTarget + 1}` : ''}
      />

      {/* Full Media Preview Modal */}
      <AnimatePresence>
        {previewMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setPreviewMedia(null)}
          >
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-6 right-6 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-3 transition-smooth shadow-lg z-10"
              onClick={() => setPreviewMedia(null)}
            >
              <MdClose size={24} />
            </motion.button>
            {previewMedia.type === 'image' ? (
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={previewMedia.url}
                alt="Full preview"
                className="w-[98vw] h-[98vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <motion.video
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={previewMedia.url}
                className="w-[98vw] h-[98vh] object-contain"
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ImageCapture
