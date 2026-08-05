import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

const authApiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token from localStorage on every request
authApiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('ethio-auth')
    if (raw) {
      const { state } = JSON.parse(raw) as { state: { accessToken: string | null } }
      if (state.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`
      }
    }
  }
  return config
})

// On 401: attempt token refresh once, then redirect to login
authApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const raw = localStorage.getItem('ethio-auth')
        if (!raw) throw new Error('no token')
        const { state } = JSON.parse(raw) as { state: { refreshToken: string | null } }
        if (!state.refreshToken) throw new Error('no refresh token')

        const { data } = await axios.post<{ access: string }>(`${BASE_URL}/auth/refresh/`, {
          refresh: state.refreshToken,
        })

        // Write the new access token back into the persisted store
        const stored = JSON.parse(localStorage.getItem('ethio-auth') ?? '{}') as {
          state: { accessToken: string }
        }
        stored.state.accessToken = data.access
        localStorage.setItem('ethio-auth', JSON.stringify(stored))

        original.headers.Authorization = `Bearer ${data.access}`
        return authApiClient(original)
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ethio-auth')
          window.location.href = '/auth/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default authApiClient
