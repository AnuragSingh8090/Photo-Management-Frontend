import { useState, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { MdSave, MdCancel, MdClose } from 'react-icons/md'
import { saveRecord } from '../services/api'
import { getCurrentDate, getCurrentTime, formatTime } from '../utils/dateTime'

// SVG Icons
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)

const CameraLargeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
  </svg>
)

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

/**
 * ImageCapture Component
 * Combined camera/upload section with form fields
 */
function ImageCapture({ onImageSelect, onSuccess, editingRecord, onCancelEdit }) {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [preview, setPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showFullImage, setShowFullImage] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageSource, setImageSource] = useState(null) // 'upload' or 'camera'
  const [isEditMode, setIsEditMode] = useState(false)
  const webcamRef = useRef(null)
  const fileInputRef = useRef(null)
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

  // Sync date and time continuously
  useEffect(() => {
    if (!selectedFile) {
      setFormData(prev => ({
        ...prev,
        date: getCurrentDate(),
        time: getCurrentTime(),
      }))
    }
  }, [selectedFile])

  // Load editing record data
  useEffect(() => {
    if (editingRecord) {
      setIsEditMode(true)
      setPreview(editingRecord.image)
      setSelectedFile(true) // Set to true to enable form (we already have image URL)
      setImageSource('edit')
      setFormData({
        name: editingRecord.name,
        date: editingRecord.date,
        time: editingRecord.time,
      })
      setImageError(false)
    } else {
      setIsEditMode(false)
    }
  }, [editingRecord])

  // Update time every second when disabled
  useEffect(() => {
    if (!selectedFile) {
      const interval = setInterval(() => {
        setFormData(prev => ({
          ...prev,
          date: getCurrentDate(),
          time: getCurrentTime(),
        }))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [selectedFile])

  // Initialize date/time when file is selected
  useEffect(() => {
    if (selectedFile && (!formData.date || !formData.time)) {
      setFormData(prev => ({
        ...prev,
        date: getCurrentDate(),
        time: getCurrentTime(),
      }))
    }
  }, [selectedFile])

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

  /**
   * Capture image from webcam
   */
  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        const blob = dataURItoBlob(imageSrc)
        const file = new File([blob], 'webcam-photo.jpg', { type: 'image/jpeg' })
        setPreview(imageSrc)
        setSelectedFile(file)
        setImageSource('camera')
        setImageError(false)
        onImageSelect(file)
        setIsCameraActive(false)
        // Removed toast - only show on final save
      }
    }
  }

  /**
   * Handle file upload from device
   */
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image', { autoClose: 1500 })
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target.result)
        setSelectedFile(file)
        setImageSource('upload')
        setImageError(false)
        onImageSelect(file)
        // Removed toast - only show on final save
      }
      reader.readAsDataURL(file)
    }
    // Reset the input value so the same file can be selected again
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
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    // Only require image for new records, not for editing
    if (!selectedFile && !isEditMode) {
      toast.error('Please capture or upload an image', { autoClose: 1500 })
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
    // Clear error for this field
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
      setSelectedHours(hours)
      setSelectedMinutes(minutes)
    }
  }, [isTimeDropdownOpen])

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    console.log('=== SUBMIT DEBUG ===')
    console.log('isEditMode:', isEditMode)
    console.log('editingRecord:', editingRecord)
    console.log('selectedFile type:', typeof selectedFile, selectedFile)

    try {
      if (isEditMode && editingRecord) {
        console.log('>>> UPDATE MODE - Calling updateRecordWithImage')
        // Update existing record
        const { updateRecordWithImage } = await import('../services/api')
        
        // Check if a new image was uploaded (File object, not boolean)
        const hasNewImage = selectedFile && typeof selectedFile !== 'boolean'
        console.log('hasNewImage:', hasNewImage)
        
        await updateRecordWithImage(editingRecord.id, {
          name: formData.name,
          date: formData.date,
          time: formData.time,
          image: hasNewImage ? selectedFile : null,
        })
        toast.success('Record updated successfully', { autoClose: 2000 })
      } else {
        console.log('>>> CREATE MODE - Calling saveRecord')
        // Create new record
        await saveRecord({
          name: formData.name,
          date: formData.date,
          time: formData.time,
          image: selectedFile,
        })
        toast.success('Record saved successfully', { autoClose: 2000 })
      }
      
      // Clear form and image
      setPreview(null)
      setSelectedFile(null)
      setImageSource(null)
      setIsEditMode(false)
      onImageSelect(null)
      setFormData({
        name: '',
        date: getCurrentDate(),
        time: getCurrentTime(),
      })
      setErrors({})
      
      // Clear editing state in parent if in edit mode
      if (isEditMode && onCancelEdit) {
        onCancelEdit()
      }
      
      // Trigger refresh of records list
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Operation failed', { autoClose: 2000 })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setPreview(null)
    setSelectedFile(null)
    setImageSource(null)
    setIsEditMode(false)
    onImageSelect(null)
    setFormData({
      name: '',
      date: getCurrentDate(),
      time: getCurrentTime(),
    })
    setErrors({})
    setIsCameraActive(false)
    
    // Call parent cancel handler if in edit mode
    if (isEditMode && onCancelEdit) {
      onCancelEdit()
    }
  }

  const isFormDisabled = !selectedFile && !isEditMode

  return (
    <>
      <div className="h-full flex gap-4 p-4 rounded-lg shadow-sm overflow-hidden" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
        {/* LEFT: Camera Section */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {isEditMode ? 'Edit Record' : 'Upload Photo'}
            </h2>
            
            {/* Re-upload or Re-capture button - ONLY show when NOT in edit mode */}
            {preview && !isCameraActive && !isEditMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (imageSource === 'camera') {
                    // Re-capture: clear preview and activate camera
                    setPreview(null)
                    setSelectedFile(null)
                    setImageSource(null)
                    onImageSelect(null)
                    setIsCameraActive(true)
                  } else {
                    // Re-upload: open file picker
                    fileInputRef.current?.click()
                  }
                }}
                className="btn-hover text-white font-semibold rounded-lg py-2 px-4 transition-smooth flex items-center gap-2"
                style={{ background: 'var(--accent-blue)', boxShadow: 'var(--shadow-sm)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-blue-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-blue)'}
              >
                {imageSource === 'camera' ? (
                  <>
                    <CameraIcon />
                    Re-capture
                  </>
                ) : (
                  <>
                    <RefreshIcon />
                    Re-upload
                  </>
                )}
              </button>
            )}
          </div>

          {/* Preview or Camera */}
          <div className="flex-1 relative rounded-lg overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
            {/* Hidden file input - must be in DOM at all times */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <AnimatePresence mode="wait">
              {preview ? (
                imageError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex flex-col items-center justify-center"
                  >
                    <AlertIcon />
                    <p className="text-red-600 font-medium text-base mt-6">
                      Unable to display image
                    </p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                      The image may be corrupted or in an unsupported format
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex items-center justify-center cursor-pointer relative"
                    onClick={() => setShowFullImage(true)}
                  >
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                      onError={() => setImageError(true)}
                    />
                    
                    {/* Show Camera/Upload buttons in edit mode */}
                    {isEditMode && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsCameraActive(true)
                            setPreview(null)
                          }}
                          className="btn-hover text-white font-semibold rounded-lg py-2 px-5 flex items-center justify-center gap-2 transition-smooth whitespace-nowrap"
                          style={{ background: 'var(--accent-blue)', boxShadow: 'var(--shadow-lg)' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-blue-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-blue)'}
                        >
                          <CameraIcon />
                          <span>Re-capture</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            fileInputRef.current?.click()
                          }}
                          className="btn-hover text-white font-semibold rounded-lg py-2 px-5 flex items-center justify-center gap-2 transition-smooth whitespace-nowrap"
                          style={{ background: 'var(--accent-blue)', boxShadow: 'var(--shadow-lg)' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-blue-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-blue)'}
                        >
                          <UploadIcon />
                          <span>Re-upload</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              ) : isCameraActive ? (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
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
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col items-center justify-center"
                >
                  {/* Buttons in the middle */}
                  <div className="flex flex-col gap-3 items-center">
                    <CameraLargeIcon />
                    <p className="text-base mt-6 mb-6" style={{ color: 'var(--text-secondary)' }}>
                      No image selected
                    </p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsCameraActive(true)}
                        className="btn-hover text-white font-semibold rounded-lg py-2 px-4 flex items-center justify-center gap-2 transition-smooth"
                        style={{ background: 'var(--accent-blue)', boxShadow: 'var(--shadow-sm)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-blue-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-blue)'}
                      >
                        <CameraIcon />
                        <span>Camera</span>
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-hover text-white font-semibold rounded-lg py-2 px-4 flex items-center justify-center gap-2 transition-smooth"
                        style={{ background: 'var(--accent-blue)', boxShadow: 'var(--shadow-sm)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-blue-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-blue)'}
                      >
                        <UploadIcon />
                        <span>Upload</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camera Controls - Show when camera is active */}
            {isCameraActive && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                <button
                  onClick={() => {
                    setIsCameraActive(false)
                    // If in edit mode and we had a preview from editingRecord, restore it
                    if (isEditMode && editingRecord?.image) {
                      setPreview(editingRecord.image)
                      setSelectedFile(true)
                    }
                  }}
                  className="btn-hover text-white font-semibold rounded-lg py-2 px-4 transition-smooth flex items-center gap-2"
                  style={{ background: '#4b5563', boxShadow: 'var(--shadow-lg)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#4b5563'}
                >
                  <XIcon />
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="btn-hover text-white font-semibold rounded-lg py-2 px-4 transition-smooth flex items-center gap-2"
                  style={{ background: '#16a34a', boxShadow: 'var(--shadow-lg)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}
                >
                  <CameraIcon />
                  Capture
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Form Section */}
        <form onSubmit={handleSubmit} className="w-80 flex flex-col">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {isEditMode ? 'Update Details' : 'Record Details'}
          </h2>

          {/* Name Field */}
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter record name"
              className="w-full px-4 py-2 rounded-lg border transition-smooth focus:outline-none focus:ring-2"
              style={{ 
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)'
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-blue-light)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-primary)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            {errors.name && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-xs mt-1"
              >
                {errors.name}
              </motion.p>
            )}
          </div>

          {/* Date Field */}
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={dateDropdownRef}>
              <div
                onClick={() => selectedFile && setIsDateDropdownOpen(!isDateDropdownOpen)}
                className={`w-full px-4 py-2 rounded-lg border transition-smooth flex items-center gap-2 ${
                  !selectedFile
                    ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white border-gray-300 text-gray-800 cursor-pointer hover:border-blue-500'
                }`}
              >
                <CalendarIcon />
                <span>{selectedFile ? formData.date : '--'}</span>
              </div>
              
              {isDateDropdownOpen && selectedFile && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80"
                >
                  {/* Month and Year Selector */}
                  <div className="flex gap-2 mb-4">
                    {/* Custom Month Dropdown */}
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

                    {/* Custom Year Dropdown */}
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Time <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={timeDropdownRef}>
              <div
                onClick={() => selectedFile && setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                className={`w-full px-4 py-2 rounded-lg border transition-smooth flex items-center gap-2 ${
                  !selectedFile
                    ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white border-gray-300 text-gray-800 cursor-pointer hover:border-blue-500'
                }`}
              >
                <ClockIcon />
                <span>{selectedFile ? formatTime(formData.time) : '--'}</span>
              </div>
              
              {isTimeDropdownOpen && selectedFile && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-64"
                >
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-gray-800">
                      {String(selectedHours).padStart(2, '0')}:{String(selectedMinutes).padStart(2, '0')}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {/* Hours */}
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-600 mb-2 text-center">Hours</div>
                      <div className="h-48 overflow-y-auto overflow-x-hidden border border-gray-200 rounded-lg">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <motion.button
                            key={i}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedHours(i)}
                            className={`w-full py-2 text-sm transition-all ${
                              selectedHours === i
                                ? 'bg-blue-600 text-white font-bold'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {String(i).padStart(2, '0')}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Minutes */}
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-600 mb-2 text-center">Minutes</div>
                      <div className="h-48 overflow-y-auto overflow-x-hidden border border-gray-200 rounded-lg">
                        {Array.from({ length: 60 }).map((_, i) => (
                          <motion.button
                            key={i}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedMinutes(i)}
                            className={`w-full py-2 text-sm transition-all ${
                              selectedMinutes === i
                                ? 'bg-blue-600 text-white font-bold'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {String(i).padStart(2, '0')}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date()
                        const newHours = now.getHours()
                        const newMinutes = now.getMinutes()
                        setSelectedHours(newHours)
                        setSelectedMinutes(newMinutes)
                        const newTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
                        handleTimeChange(newTime)
                      }}
                      className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-semibold transition-smooth"
                    >
                      Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newTime = `${String(selectedHours).padStart(2, '0')}:${String(selectedMinutes).padStart(2, '0')}`
                        handleTimeChange(newTime)
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

          {/* Status Message */}
          {isFormDisabled && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-600 text-center p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3 flex items-center justify-center gap-2"
            >
              <ImageIcon />
              <span>Upload or capture an image to fill this form</span>
            </motion.p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-auto">
            <motion.button
              whileHover={selectedFile ? { scale: 1.02 } : {}}
              whileTap={selectedFile ? { scale: 0.98 } : {}}
              type="button"
              onClick={handleCancel}
              disabled={!selectedFile || loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth rounded-lg py-2 px-4 text-gray-700 font-semibold flex items-center justify-center gap-2"
            >
              <MdCancel />
              Cancel
            </motion.button>
            <motion.button
              whileHover={!isFormDisabled ? { scale: 1.02 } : {}}
              whileTap={!isFormDisabled ? { scale: 0.98 } : {}}
              type="submit"
              disabled={loading || isFormDisabled}
              className={`flex-1 py-2 px-4 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-smooth ${
                isFormDisabled
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md'
              }`}
            >
              <MdSave />
              {loading ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Full Image Modal */}
      <AnimatePresence>
        {showFullImage && preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setShowFullImage(false)}
          >
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-6 right-6 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-3 transition-smooth shadow-lg z-10"
              onClick={() => setShowFullImage(false)}
            >
              <MdClose size={24} />
            </motion.button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              src={preview}
              alt="Full preview"
              className="w-[98vw] h-[98vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ImageCapture
