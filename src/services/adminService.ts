import api from '../lib/api.ts'

type AdminDashboardSummary = {
  totalCourses: number
  totalLessons: number
  totalStudents: number
  totalStudentUsers: number
  coursesByLevel: Array<{ label: string; value: number }>
  topCoursesByStudents: Array<{ id: string; title: string; students: number }>
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

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function normalizeCoursesByLevel(payload: unknown): Array<{ label: string; value: number }> {
  const data = asRecord(payload)
  const rows = Array.isArray(data.coursesByLevel)
    ? data.coursesByLevel
    : Array.isArray(data.courses_by_level)
      ? data.courses_by_level
      : []

  return rows
    .map((row) => {
      const item = asRecord(row)
      const labelRaw = typeof item.label === 'string'
        ? item.label
        : typeof item.level === 'string'
          ? item.level
          : ''
      const label = labelRaw.trim()
      const value = toNumber(item.value ?? item.count ?? item.total)
      return label ? { label, value } : null
    })
    .filter((entry): entry is { label: string; value: number } => Boolean(entry))
}

function normalizeTopCourses(payload: unknown): Array<{ id: string; title: string; students: number }> {
  const data = asRecord(payload)
  const rows = Array.isArray(data.topCoursesByStudents)
    ? data.topCoursesByStudents
    : Array.isArray(data.top_courses_by_students)
      ? data.top_courses_by_students
      : []

  return rows
    .map((row) => {
      const item = asRecord(row)
      const idRaw = item.id ?? item.courseId ?? item.course_id ?? item._id
      const id = typeof idRaw === 'string' ? idRaw : typeof idRaw === 'number' ? String(idRaw) : ''
      const title = typeof item.title === 'string' ? item.title : typeof item.courseTitle === 'string' ? item.courseTitle : 'Khóa học'
      const students = toNumber(item.students ?? item.studentCount ?? item.student_count)
      return id ? { id, title, students } : null
    })
    .filter((entry): entry is { id: string; title: string; students: number } => Boolean(entry))
}

function normalizeAdminDashboardSummary(payload: unknown): AdminDashboardSummary {
  const data = asRecord(extractObjectPayload<unknown>(payload))

  return {
    totalCourses: toNumber(data.totalCourses ?? data.total_courses),
    totalLessons: toNumber(data.totalLessons ?? data.total_lessons),
    totalStudents: toNumber(data.totalStudents ?? data.total_students),
    totalStudentUsers: toNumber(data.totalStudentUsers ?? data.total_student_users ?? data.totalUsers ?? data.total_users),
    coursesByLevel: normalizeCoursesByLevel(data),
    topCoursesByStudents: normalizeTopCourses(data),
  }
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary | null> {
  const endpoints = ['/admin/dashboard', '/admin/overview', '/admin/stats', '/dashboard/admin']

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint)
      const normalized = normalizeAdminDashboardSummary(data)

      if (
        normalized.totalCourses > 0
        || normalized.totalLessons > 0
        || normalized.totalStudents > 0
        || normalized.totalStudentUsers > 0
        || normalized.coursesByLevel.length > 0
        || normalized.topCoursesByStudents.length > 0
      ) {
        return normalized
      }
    } catch {
      // Try next endpoint.
    }
  }

  return null
}

export type { AdminDashboardSummary }
