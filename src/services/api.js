import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Transform backend record to frontend format
 */
const transformRecord = (backendRecord) => {
  // Backend: { id, title, description, dateTime, imageUrl, createdAt, updatedAt }
  // Frontend: { id, name, date, time, image, description }
  
  // Remove the 'Z' to treat as local time, not UTC
  const dateTimeStr = backendRecord.dateTime.replace('Z', '')
  const dateTime = new Date(dateTimeStr)
  const date = dateTimeStr.split('T')[0] // YYYY-MM-DD
  const time = dateTimeStr.split('T')[1].substring(0, 5) // HH:MM
  
  return {
    id: backendRecord.id,
    name: backendRecord.title,
    date: date,
    time: time,
    image: `http://localhost:5000${backendRecord.imageUrl}`,
    description: backendRecord.description || ''
  }
}

/**
 * Fetch all records from the backend
 */
export const fetchRecords = async () => {
  try {
    const response = await apiClient.get('/records')
    // API returns { data: [...], message: "...", count: ... }
    const records = response.data.data || []
    // Transform backend format to frontend format
    return records.map(transformRecord)
  } catch (error) {
    console.error('Error fetching records:', error)
    throw error
  }
}

/**
 * Save a new record with image
 * @param {Object} record - { name, date, time, image (File) }
 */
export const saveRecord = async (record) => {
  try {
    const formData = new FormData()
    // Backend expects 'title' not 'name'
    formData.append('title', record.name)
    // Backend expects 'dateTime' - send without Z to keep local time
    const dateTime = `${record.date}T${record.time}:00.000`
    formData.append('dateTime', dateTime)
    formData.append('description', record.description || '')
    formData.append('image', record.image)

    const response = await axios.post(`${API_BASE_URL}/records`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    // API returns { data: {...}, message: "..." }
    return response.data.data || response.data
  } catch (error) {
    console.error('Error saving record:', error)
    throw error
  }
}

/**
 * Update an existing record
 * @param {string} id - Record ID
 * @param {Object} record - { name, date, time, description }
 */
export const updateRecord = async (id, record) => {
  try {
    // Transform frontend fields to backend fields
    const updateData = {
      title: record.name,
      dateTime: `${record.date}T${record.time}:00.000`,
      description: record.description || ''
    }
    
    const response = await apiClient.put(`/records/${id}`, updateData)
    // API returns { data: {...}, message: "..." }
    return response.data.data || response.data
  } catch (error) {
    console.error('Error updating record:', error)
    throw error
  }
}

/**
 * Update an existing record with optional image
 * @param {string} id - Record ID
 * @param {Object} record - { name, date, time, image (File or null), description }
 */
export const updateRecordWithImage = async (id, record) => {
  try {
    const formData = new FormData()
    // Backend expects 'title' not 'name'
    formData.append('title', record.name)
    // Backend expects 'dateTime' - send without Z to keep local time
    const dateTime = `${record.date}T${record.time}:00.000`
    formData.append('dateTime', dateTime)
    formData.append('description', record.description || '')
    
    // Only append image if a new one was selected
    if (record.image) {
      formData.append('image', record.image)
    }

    const response = await axios.put(`${API_BASE_URL}/records/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    // API returns { data: {...}, message: "..." }
    return response.data.data || response.data
  } catch (error) {
    console.error('Error updating record with image:', error)
    throw error
  }
}

/**
 * Delete a record
 * @param {string} id - Record ID
 */
export const deleteRecord = async (id) => {
  try {
    const response = await apiClient.delete(`/records/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting record:', error)
    throw error
  }
}

/**
 * Delete multiple records
 * @param {Array<string>} ids - Array of record IDs
 */
export const deleteMultipleRecords = async (ids) => {
  try {
    const response = await apiClient.post('/records/delete-multiple', { ids })
    return response.data
  } catch (error) {
    console.error('Error deleting multiple records:', error)
    throw error
  }
}
