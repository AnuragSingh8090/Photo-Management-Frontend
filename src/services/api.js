import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Global interceptor for security token issues
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Broadcast an event so the app can log the user out
      window.dispatchEvent(new Event('auth_error'))
    }
    return Promise.reject(error)
  }
)

// --- Auth Endpoints ---

export const loginUser = async (key) => {
  const response = await apiClient.post('/auth/login', { key })
  return response.data
}

export const verifyAuth = async () => {
  const response = await apiClient.get('/auth/verify')
  return response.data
}

export const logoutUser = async () => {
  const response = await apiClient.post('/auth/logout')
  return response.data
}

// --- Data Endpoints ---

/**
 * Transform backend record to frontend format
 */
const transformRecord = (backendRecord) => {
  // Remove the 'Z' to treat as local time, not UTC
  const dateTimeStr = backendRecord.dateTime.replace('Z', '')
  const date = dateTimeStr.split('T')[0] // YYYY-MM-DD
  const time = dateTimeStr.split('T')[1].substring(0, 5) // HH:MM
  
  // Build media array from mediaUrls
  const media = (backendRecord.mediaUrls || []).map(m => ({
    url: `http://localhost:5000${m.url}`,
    type: m.type,
    fileName: m.fileName,
    originalName: m.originalName
  }))

  // Backward compat: if no mediaUrls but has imageUrl
  if (media.length === 0 && backendRecord.imageUrl) {
    media.push({
      url: `http://localhost:5000${backendRecord.imageUrl}`,
      type: 'image',
      fileName: '',
      originalName: ''
    })
  }
  
  return {
    id: backendRecord.id,
    name: backendRecord.title,
    date: date,
    time: time,
    media: media,
    description: backendRecord.description || ''
  }
}

/**
 * Fetch all records from the backend
 */
export const fetchRecords = async () => {
  try {
    const response = await apiClient.get('/records')
    const records = response.data.data || []
    return records.map(transformRecord)
  } catch (error) {
    console.error('Error fetching records:', error)
    throw error
  }
}

/**
 * Save a new record with multiple media files
 * @param {Object} record - { name, date, time, description, files: File[] }
 */
export const saveRecord = async (record) => {
  try {
    const formData = new FormData()
    formData.append('title', record.name)
    const dateTime = `${record.date}T${record.time}:00.000`
    formData.append('dateTime', dateTime)
    formData.append('description', record.description || '')
    
    // Append multiple files
    if (record.files && record.files.length > 0) {
      record.files.forEach(file => {
        formData.append('media', file)
      })
    }

    const response = await apiClient.post(`/records`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data || response.data
  } catch (error) {
    console.error('Error saving record:', error)
    throw error
  }
}

/**
 * Update an existing record (text fields only)
 * @param {string} id - Record ID
 * @param {Object} record - { name, date, time, description }
 */
export const updateRecord = async (id, record) => {
  try {
    const updateData = {
      title: record.name,
      dateTime: `${record.date}T${record.time}:00.000`,
      description: record.description || ''
    }
    
    const response = await apiClient.put(`/records/${id}`, updateData)
    return response.data.data || response.data
  } catch (error) {
    console.error('Error updating record:', error)
    throw error
  }
}

/**
 * Add a single media file to an existing record
 * @param {string} recordId - Record ID
 * @param {File} file - The file to add
 */
export const addMediaToRecord = async (recordId, file) => {
  try {
    const formData = new FormData()
    formData.append('media', file)

    const response = await apiClient.post(`/records/${recordId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data || response.data
  } catch (error) {
    console.error('Error adding media to record:', error)
    throw error
  }
}

/**
 * Delete a single media file from a record
 * @param {string} recordId - Record ID
 * @param {string} fileName - The file name to delete
 */
export const deleteMediaFromRecord = async (recordId, fileName) => {
  try {
    const response = await apiClient.delete(`/records/${recordId}/media/${encodeURIComponent(fileName)}`)
    return response.data.data || response.data
  } catch (error) {
    console.error('Error deleting media from record:', error)
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
