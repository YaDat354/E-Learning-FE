import api from '../lib/api.ts'

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  const token = data?.accessToken ?? data?.token ?? data?.access_token

  if (token) {
    localStorage.setItem('accessToken', token)
  }

  return data
}

export function logout() {
  localStorage.removeItem('accessToken')
}
