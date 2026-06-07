import api from '../lib/api.ts'

function extractToken(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const source = payload as Record<string, unknown>
  const data = source.data && typeof source.data === 'object' ? source.data as Record<string, unknown> : {}
  const user = source.user && typeof source.user === 'object' ? source.user as Record<string, unknown> : {}

  const candidates = [
    source.accessToken,
    source.token,
    source.access_token,
    data.accessToken,
    data.token,
    data.access_token,
    user.accessToken,
    user.token,
    user.access_token,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate
    }
  }

  return ''
}

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  const token = extractToken(data)

  if (token) {
    localStorage.setItem('accessToken', token)
  }

  return data
}

export async function register(fullName: string, email: string, password: string, role: 'student' | 'teacher' | 'admin' = 'student') {
  const { data } = await api.post('/auth/register', { fullName, email, password, role })
  const token = extractToken(data)

  if (token) {
    localStorage.setItem('accessToken', token)
  }

  return data
}

export function logout() {
  localStorage.removeItem('accessToken')
}
