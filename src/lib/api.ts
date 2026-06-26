import axios from 'axios'

let baseURL = import.meta.env.VITE_API_URL ?? ''

// Normalize configured URL: remove trailing slash only
if (typeof baseURL === 'string' && baseURL.length > 0) {
  baseURL = baseURL.replace(/\/+$/, '')
}

if (!baseURL) {
  // eslint-disable-next-line no-console
  console.warn('VITE_API_URL is not set. API requests will be sent as relative URLs.')
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
