import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Fetch all records from the backend
 */
export const fetchRecords = async () => {
  try {
    const response = await apiClient.get('/records')
    // API returns { data: [...], message: "...", count: ... }
    return response.data.data || []
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
    formData.append('name', record.name)
    formData.append('date', record.date)
    formData.append('time', record.time)
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
 * @param {Object} record - { name, date, time }
 */
export const updateRecord = async (id, record) => {
  try {
    const response = await apiClient.put(`/records/${id}`, record)
    // API returns { data: {...}, message: "..." }
    return response.data.data || response.data
  } catch (error) {
    console.error('Error updating record:', error)
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
