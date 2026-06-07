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

  if (role === 'admin' || role === 'quan_tri' || role === 'quantri' || role === 'role_admin') {
    return 'admin'
  }

  if (
    role === 'teacher'
    || role === 'instructor'
    || role === 'lecturer'
    || role === 'giang_vien'
    || role === 'giangvien'
    || role === 'role_teacher'
    || role === 'role_instructor'
  ) {
    return 'teacher'
  }

  if (
    role === 'student'
    || role === 'learner'
    || role === 'hoc_vien'
    || role === 'hocvien'
    || role === 'role_student'
    || role === 'role_learner'
  ) {
    return 'student'
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
  const role = normalizeRole(
    data.role
      ?? data.userRole
      ?? data.roleName
      ?? data.user_type
      ?? data.userType
      ?? data.type
  )

  return {
    id,
    name: fullName,
    email,
    role,
    avatar: typeof data.avatar === 'string' && data.avatar.trim().length > 0 ? data.avatar.trim() : undefined,
  }
}

function mergeUniqueUsers(chunks: UserProfile[][]) {
  const seen = new Set<string>()
  const merged: UserProfile[] = []

  for (const chunk of chunks) {
    for (const user of chunk) {
      const key = (user.id ?? user.email).trim().toLowerCase()

      if (!key || seen.has(key)) {
        continue
      }

      seen.add(key)
      merged.push(user)
    }
  }

  return merged
}

function extractPaginatedUsers(payload: unknown): { items: UserProfile[]; totalPages: number } {
  const root = asRecord(extractObjectPayload<unknown>(payload))
  const items = Array.isArray(root.items) ? root.items : []
  const pagination = asRecord(root.pagination)
  const totalPagesRaw = pagination.totalPages
  const totalPages = typeof totalPagesRaw === 'number' && Number.isFinite(totalPagesRaw)
    ? Math.max(1, Math.floor(totalPagesRaw))
    : 1

  return {
    items: items.map((row) => normalizeUserProfile(row)),
    totalPages,
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
  const limit = 100
  const chunks: UserProfile[][] = []

  try {
    let page = 1
    let totalPages = 1

    while (page <= totalPages) {
      const { data } = await api.get('/admin/users', {
        params: {
          page,
          limit,
        },
      })

      const paginated = extractPaginatedUsers(data)
      chunks.push(paginated.items)
      totalPages = paginated.totalPages

      if (paginated.items.length < limit) {
        break
      }

      page += 1
    }
  } catch {
    // Fallback below.
  }

  const merged = mergeUniqueUsers(chunks)

  if (merged.length > 0) {
    return merged
  }

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

function resolveUserId(userId: string | undefined | null) {
  const normalizedUserId = typeof userId === 'string' ? userId.trim() : ''

  if (!normalizedUserId) {
    throw new Error('userId is required')
  }

  return encodeURIComponent(normalizedUserId)
}

export async function updateAdminUser(userId: string, payload: { name: string; email: string; role: User['role'] }) {
  const body = {
    name: payload.name,
    fullName: payload.name,
    email: payload.email,
    role: payload.role,
  }

  const encodedUserId = resolveUserId(userId)
  const endpoints = [`/users/${encodedUserId}`, `/admin/users/${encodedUserId}`]
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

export async function deleteAdminUser(userId: string) {
  const encodedUserId = resolveUserId(userId)
  const endpoints = [`/users/${encodedUserId}`, `/admin/users/${encodedUserId}`]
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
