import api from '../lib/api.ts'
import type { User } from '../types/domain.ts'

export async function getMe() {
  const { data } = await api.get<User>('/users/me')
  return data
}

export async function getAdminStudents() {
  const { data } = await api.get<User[]>('/users/students')
  return data
}
