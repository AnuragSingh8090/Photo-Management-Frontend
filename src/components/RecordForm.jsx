import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MdSave, MdCancel, MdEdit } from 'react-icons/md'
import { toast } from 'react-toastify'
import { saveRecord, updateRecord } from '../services/api'
import { getCurrentDate, getCurrentTime } from '../utils/dateTime'

/**
 * RecordForm Component
 * Form to capture record details (name, date, time)
 */
function RecordForm({ image, editingRecord, isEditing, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Initialize form with current date/time or editing record data
  useEffect(() => {
    if (isEditing && editingRecord) {
      setFormData({
        name: editingRecord.name,
        date: editingRecord.date,
        time: editingRecord.time,
      })
    } else {
      setFormData({
        name: '',
        date: getCurrentDate(),
        time: getCurrentTime(),
      })
    }
    setErrors({})
  }, [image, editingRecord, isEditing])

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    if (!formData.time) {
      newErrors.time = 'Time is required'
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
   * Handle form submission (save or update)
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      if (isEditing) {
        // Update existing record
        await updateRecord(editingRecord.id, {
          name: formData.name,
          date: formData.date,
          time: formData.time,
        })
        toast.success('Record updated', { autoClose: 2000 })
      } else {
        // Save new record
        if (!image) {
          return
        }

        await saveRecord({
          name: formData.name,
          date: formData.date,
          time: formData.time,
          image: image,
        })
        toast.success('Record saved', { autoClose: 2000 })
      }

      onSuccess()
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Operation failed', { autoClose: 2000 })
    } finally {
      setLoading(false)
    }
  }

  const isFormDisabled = !image && !isEditing

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="h-full flex flex-col p-6 rounded-lg bg-white border border-gray-200 shadow-sm gap-4"
    >
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        {isEditing ? <MdEdit /> : <MdSave />}
        {isEditing ? 'Edit Record' : 'Record Details'}
      </h2>

      {/* Name Field */}
      <motion.div whileHover={{ scale: 1.01 }}>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={isFormDisabled}
          placeholder="Enter record name"
          className={`w-full px-4 py-2 rounded-lg border transition-smooth focus:outline-none focus:ring-2 ${
            isFormDisabled
              ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-white border-gray-300 text-gray-800 focus:ring-blue-500 focus:border-transparent'
          } ${
            errors.name
              ? 'border-red-500 focus:ring-red-500'
              : ''
          }`}
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
      </motion.div>

      {/* Date Field */}
      <motion.div whileHover={{ scale: 1.01 }}>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          disabled={isFormDisabled}
          className={`w-full px-4 py-2 rounded-lg border transition-smooth focus:outline-none focus:ring-2 ${
            isFormDisabled
              ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-white border-gray-300 text-gray-800 focus:ring-blue-500 focus:border-transparent'
          } ${
            errors.date
              ? 'border-red-500 focus:ring-red-500'
              : ''
          }`}
        />
        {errors.date && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-xs mt-1"
          >
            {errors.date}
          </motion.p>
        )}
      </motion.div>

      {/* Time Field */}
      <motion.div whileHover={{ scale: 1.01 }}>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Time <span className="text-red-500">*</span>
        </label>
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          disabled={isFormDisabled}
          className={`w-full px-4 py-2 rounded-lg border transition-smooth focus:outline-none focus:ring-2 ${
            isFormDisabled
              ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-white border-gray-300 text-gray-800 focus:ring-blue-500 focus:border-transparent'
          } ${
            errors.time
              ? 'border-red-500 focus:ring-red-500'
              : ''
          }`}
        />
        {errors.time && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-xs mt-1"
          >
            {errors.time}
          </motion.p>
        )}
      </motion.div>

      {/* Status Message */}
      {isFormDisabled && !isEditing && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-600 text-center p-3 bg-blue-50 rounded-lg border border-blue-200"
        >
          📷 Upload or capture an image to fill this form
        </motion.p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-auto">
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
          {loading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-smooth rounded-lg py-2 px-4 text-gray-700 font-semibold flex items-center justify-center gap-2"
        >
          <MdCancel />
          Cancel
        </motion.button>
      </div>
    </motion.form>
  )
}

export default RecordForm
