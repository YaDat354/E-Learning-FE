import api from '../lib/api.ts'
import type { User } from '../types/domain.ts'

export type UserProfile = User & {
  avatar?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function extractObjectPayload<T>(payload: unknown): T {
  const root = asRecord(payload)
  const data = root.data

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as T
  }

  return payload as T
}

function extractArrayPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  const root = asRecord(payload)
  const data = root.data

  if (Array.isArray(data)) {
    return data as T[]
  }

  return []
}

function normalizeUserProfile(payload: unknown): UserProfile {
  const data = asRecord(extractObjectPayload<UserProfile>(payload))
  const id = typeof data.id === 'string' && data.id.trim().length > 0
    ? data.id.trim()
    : typeof data._id === 'string' && data._id.trim().length > 0
      ? data._id.trim()
      : undefined
  const fullName = typeof data.fullName === 'string' && data.fullName.trim().length > 0
    ? data.fullName.trim()
    : typeof data.name === 'string' && data.name.trim().length > 0
      ? data.name.trim()
      : 'Học viên'

  const email = typeof data.email === 'string' ? data.email.trim() : 'user@example.com'
  const roleSource = typeof data.role === 'string' ? data.role.trim().toLowerCase() : 'student'
  const role = roleSource === 'admin' || roleSource === 'teacher' || roleSource === 'student' ? roleSource : 'student'

  return {
    id,
    name: fullName,
    email,
    role,
    avatar: typeof data.avatar === 'string' && data.avatar.trim().length > 0 ? data.avatar.trim() : undefined,
  }
}

export async function getMe() {
  const { data } = await api.get('/users/me')
  return normalizeUserProfile(data)
}

export async function updateMe(payload: { fullName?: string; avatar?: string }) {
  const { data } = await api.patch('/users/me', payload)
  return normalizeUserProfile(data)
}

export async function getAdminStudents() {
  const { data } = await api.get('/users/students')
  const rows = extractArrayPayload<unknown>(data)
  return rows.map((row) => normalizeUserProfile(row))
}
