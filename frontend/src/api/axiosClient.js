import axios from 'axios'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const baseURL = configuredBaseUrl || 'http://localhost:8080/api'

export default axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})
