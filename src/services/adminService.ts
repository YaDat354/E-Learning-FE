import api from '../lib/api.ts'

type AdminDashboardSummary = {
  totalCourses: number
  totalLessons: number
  totalStudents: number
  totalStudentUsers: number
  coursesByLevel: Array<{ label: string; value: number }>
  topCoursesByStudents: Array<{ id: string; title: string; students: number }>
  usersByRole: Array<{ label: string; value: number }>
  revenueByCategory: Array<{ label: string; value: number }>
  highScoreRateByCourse: Array<{ label: string; value: number }>
  revenueByMonth: Array<{ label: string; value: number }>
  completionRateByCourse: Array<{ label: string; value: number }>
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
      const students = toNumber(item.students ?? item.totalStudents ?? item.total_students ?? item.studentCount ?? item.student_count)
      return id ? { id, title, students } : null
    })
    .filter((entry): entry is { id: string; title: string; students: number } => Boolean(entry))
}

function normalizeLabelValueRows(
  payload: unknown,
  keys: { rows: string[]; label: string[]; value: string[] }
): Array<{ label: string; value: number }> {
  const data = asRecord(payload)

  let rows: unknown[] = []
  for (const rowKey of keys.rows) {
    const candidate = data[rowKey]
    if (Array.isArray(candidate)) {
      rows = candidate
      break
    }
  }

  return rows
    .map((row) => {
      const item = asRecord(row)

      let label = ''
      for (const labelKey of keys.label) {
        const value = item[labelKey]
        if (typeof value === 'string' && value.trim().length > 0) {
          label = value.trim()
          break
        }
      }

      let value = 0
      for (const valueKey of keys.value) {
        if (item[valueKey] !== undefined) {
          value = toNumber(item[valueKey])
          break
        }
      }

      return label ? { label, value } : null
    })
    .filter((entry): entry is { label: string; value: number } => Boolean(entry))
}

function normalizeUsersByRole(payload: unknown): Array<{ label: string; value: number }> {
  const data = asRecord(payload)
  const usersByRole = asRecord(data.usersByRole ?? data.users_by_role)
  const chartData = asRecord(data.chartData ?? data.chart_data)
  const chartUsers = asRecord(chartData.usersByRole ?? chartData.users_by_role)
  const labels = Array.isArray(chartUsers.labels) ? chartUsers.labels : []
  const series = Array.isArray(chartUsers.series) ? chartUsers.series : []

  if (labels.length > 0 && series.length === labels.length) {
    return labels
      .map((label, index) => {
        const key = typeof label === 'string' ? label : ''
        if (!key) {
          return null
        }

        return { label: key, value: toNumber(series[index]) }
      })
      .filter((entry): entry is { label: string; value: number } => Boolean(entry))
  }

  const mapped = [
    { label: 'Admin', value: toNumber(usersByRole.admin) },
    { label: 'Giảng viên', value: toNumber(usersByRole.teacher) },
    { label: 'Học viên', value: toNumber(usersByRole.student) },
  ]

  return mapped.filter((entry) => entry.value > 0)
}

function normalizeRevenueByCategory(payload: unknown): Array<{ label: string; value: number }> {
  return normalizeLabelValueRows(payload, {
    rows: ['revenueByCategory', 'revenue_by_category', 'categoryRevenue', 'category_revenue'],
    label: ['label', 'category', 'name', 'title'],
    value: ['value', 'revenue', 'amount', 'total'],
  })
}

function normalizeHighScoreRateByCourse(payload: unknown): Array<{ label: string; value: number }> {
  return normalizeLabelValueRows(payload, {
    rows: ['highScoreRateByCourse', 'high_score_rate_by_course', 'topScoreRateByCourse', 'top_score_rate_by_course'],
    label: ['label', 'title', 'courseTitle', 'course_title', 'name'],
    value: ['value', 'rate', 'highScoreRate', 'high_score_rate', 'percentage'],
  })
}

function normalizeRevenueByMonth(payload: unknown): Array<{ label: string; value: number }> {
  return normalizeLabelValueRows(payload, {
    rows: ['revenueByMonth', 'revenue_by_month', 'monthlyRevenue', 'monthly_revenue'],
    label: ['label', 'month', 'name', 'title'],
    value: ['value', 'revenue', 'amount', 'total'],
  })
}

function normalizeAdminDashboardSummary(payload: unknown): AdminDashboardSummary {
  const data = asRecord(extractObjectPayload<unknown>(payload))
  const usersByRole = normalizeUsersByRole(data)
  const studentFromRole = usersByRole.find((row) => row.label.toLowerCase() === 'học viên' || row.label.toLowerCase() === 'student')

  return {
    totalCourses: toNumber(data.totalCourses ?? data.total_courses),
    totalLessons: toNumber(data.totalLessons ?? data.total_lessons),
    totalStudents: toNumber(data.totalStudents ?? data.total_students),
    totalStudentUsers: toNumber(
      data.totalStudentUsers
      ?? data.total_student_users
      ?? studentFromRole?.value
      ?? data.totalUsers
      ?? data.total_users
    ),
    coursesByLevel: normalizeCoursesByLevel(data),
    topCoursesByStudents: normalizeTopCourses(data),
    usersByRole,
    revenueByCategory: normalizeRevenueByCategory(data),
    highScoreRateByCourse: normalizeHighScoreRateByCourse(data),
    revenueByMonth: normalizeRevenueByMonth(data),
    completionRateByCourse: normalizeLabelValueRows(data, {
      rows: ['completionRateByCourse', 'completion_rate_by_course'],
      label: ['label', 'title', 'courseTitle', 'course_title', 'name'],
      value: ['value', 'rate', 'completionRate', 'completion_rate', 'percentage'],
    }),
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
        || normalized.usersByRole.length > 0
        || normalized.revenueByCategory.length > 0
        || normalized.highScoreRateByCourse.length > 0
        || normalized.revenueByMonth.length > 0
        || normalized.completionRateByCourse.length > 0
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
