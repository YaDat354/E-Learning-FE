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

   const rootItems = root.items ?? root.results ?? root.rows
   if (Array.isArray(rootItems)) {
    return rootItems as T[]
  }

  const nested = asRecord(data)
  const nestedItems = nested.items ?? nested.results ?? nested.rows
  if (Array.isArray(nestedItems)) {
    return nestedItems as T[]
  }

  const grouped = [root.admins, root.teachers, root.students, nested.admins, nested.teachers, nested.students]
  const flattened: unknown[] = []
  for (const group of grouped) {
    if (Array.isArray(group)) {
      flattened.push(...group)
    }
  }

  if (flattened.length > 0) {
    return flattened as T[]
  }

  return []
}

function normalizeRole(value: unknown): User['role'] {
  if (typeof value !== 'string') {
    return 'student'
  }

  const role = value.trim().toLowerCase()

  if (role === 'admin' || role === 'role_admin') {
    return 'admin'
  }

  if (role === 'teacher' || role === 'instructor' || role === 'role_teacher' || role === 'role_instructor') {
    return 'teacher'
  }

  return 'student'
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
  const role = normalizeRole(data.role ?? data.userRole ?? data.roleName)

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
  const endpoints = ['/admin/users/students', '/users/students']

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint)
      const rows = extractArrayPayload<unknown>(data)
      const students = rows.map((row) => normalizeUserProfile(row)).filter((user) => user.role === 'student')
      if (students.length > 0) {
        return students
      }
    } catch {
      // Try next endpoint.
    }
  }

  return []
}

export async function getAdminUsers() {
  const endpoints = ['/admin/users', '/users']

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint)
      const rows = extractArrayPayload<unknown>(data)
      const users = rows.map((row) => normalizeUserProfile(row))

      if (users.length > 0) {
        return users
      }
    } catch {
      // Try next endpoint.
    }
  }

  const students = await getAdminStudents()
  return students
}

export async function createAdminUser(payload: { name: string; email: string; role: User['role'] }) {
  const body = {
    name: payload.name,
    fullName: payload.name,
    email: payload.email,
    role: payload.role,
  }

  const endpoints = ['/users', '/admin/users']
  let lastError: unknown = null

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.post(endpoint, body)
      return normalizeUserProfile(data)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error('create admin user failed')
}

export async function updateAdminUser(email: string, payload: { name: string; email: string; role: User['role'] }) {
  const body = {
    name: payload.name,
    fullName: payload.name,
    email: payload.email,
    role: payload.role,
  }

  const encodedEmail = encodeURIComponent(email)
  const endpoints = [`/users/${encodedEmail}`, `/admin/users/${encodedEmail}`]
  let lastError: unknown = null

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.patch(endpoint, body)
      return normalizeUserProfile(data)
    } catch (patchError) {
      try {
        const { data } = await api.put(endpoint, body)
        return normalizeUserProfile(data)
      } catch (putError) {
        lastError = putError ?? patchError
      }
    }
  }

  throw lastError ?? new Error('update admin user failed')
}

export async function deleteAdminUser(email: string) {
  const encodedEmail = encodeURIComponent(email)
  const endpoints = [`/users/${encodedEmail}`, `/admin/users/${encodedEmail}`]
  let lastError: unknown = null

  for (const endpoint of endpoints) {
    try {
      await api.delete(endpoint)
      return
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error('delete admin user failed')
}
