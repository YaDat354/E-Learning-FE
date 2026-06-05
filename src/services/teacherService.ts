import api from '../lib/api.ts'
import type { Course } from '../types/domain.ts'

type TeachingAssignmentOverviewItem = {
  assignmentId: string
  assignmentTitle: string
  dueDate: string | null
  maxScore: number | null
  courseId: string
  courseTitle: string
  totalStudents: number
  submittedCount: number
  gradedCount: number
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
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

  const rootCandidates = [root.items, root.results, root.rows, root.courses, root.teachingCourses, root.courseIds]
  for (const candidate of rootCandidates) {
    if (Array.isArray(candidate)) {
      return candidate as T[]
    }
  }

  const nested = asRecord(data)
  const nestedCandidates = [nested.items, nested.results, nested.rows, nested.courses, nested.teachingCourses, nested.courseIds]
  for (const candidate of nestedCandidates) {
    if (Array.isArray(candidate)) {
      return candidate as T[]
    }
  }

  return []
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

function readCourseId(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return ''
}

function normalizeCourseLevel(value: unknown): Course['level'] {
  if (typeof value !== 'string') {
    return 'Cơ bản'
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'trung_cap' || normalized === 'trungcap' || normalized === 'intermediate' || normalized === 'trung cấp') {
    return 'Trung cấp'
  }

  if (normalized === 'cao_cap' || normalized === 'caocap' || normalized === 'advanced' || normalized === 'nâng cao') {
    return 'Nâng cao'
  }

  return 'Cơ bản'
}

function normalizeCategoryColor(level: Course['level']): string {
  if (level === 'Trung cấp') {
    return '#16a34a'
  }

  if (level === 'Nâng cao') {
    return '#7c3aed'
  }

  return '#1066d6'
}

function buildInitialsFromName(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return initials || 'NA'
}

function toTeachingCourse(row: unknown): Course | null {
  if (typeof row === 'string' || typeof row === 'number') {
    const id = readCourseId(row)
    if (!id) {
      return null
    }

    return {
      id,
      lessonCount: 0,
      title: `Khóa học ${id}`,
      description: '',
      instructor: 'Đang cập nhật',
      instructorAvatar: 'NA',
      category: 'Khóa học',
      categoryColor: '#1066d6',
      level: 'Cơ bản',
      rating: 0,
      reviewCount: 0,
      studentCount: 0,
      duration: 'Đang cập nhật',
      price: 0,
      originalPrice: 0,
      tags: ['Cơ bản'],
      lessons: [],
    }
  }

  const item = asRecord(row)
  const nestedCourse = asRecord(item.course)
  const teacher = asRecord(item.teacher)
  const instructorObject = asRecord(item.instructor)

  const id =
    readCourseId(item.id)
    || readCourseId(item.courseId)
    || readCourseId(item._id)
    || readCourseId(nestedCourse.id)
    || readCourseId(nestedCourse.courseId)
    || readCourseId(nestedCourse._id)

  if (!id) {
    return null
  }

  const title =
    (typeof item.title === 'string' && item.title.trim().length > 0 ? item.title : '')
    || (typeof nestedCourse.title === 'string' && nestedCourse.title.trim().length > 0 ? nestedCourse.title : '')
    || `Khóa học ${id}`
  const description =
    (typeof item.description === 'string' ? item.description : '')
    || (typeof nestedCourse.description === 'string' ? nestedCourse.description : '')
    || ''
  const instructor =
    (typeof item.teacherName === 'string' && item.teacherName.trim().length > 0 ? item.teacherName : '')
    || (typeof item.instructor === 'string' && item.instructor.trim().length > 0 ? item.instructor : '')
    || (typeof teacher.fullName === 'string' && teacher.fullName.trim().length > 0 ? teacher.fullName : '')
    || (typeof instructorObject.fullName === 'string' && instructorObject.fullName.trim().length > 0 ? instructorObject.fullName : '')
    || (typeof nestedCourse.instructor === 'string' && nestedCourse.instructor.trim().length > 0 ? nestedCourse.instructor : '')
    || 'Đang cập nhật'
  const level = normalizeCourseLevel(item.level ?? nestedCourse.level)
  const category =
    (typeof item.category === 'string' && item.category.trim().length > 0 ? item.category : '')
    || (typeof nestedCourse.category === 'string' && nestedCourse.category.trim().length > 0 ? nestedCourse.category : '')
    || 'Khóa học'
  const categoryColor =
    (typeof item.categoryColor === 'string' && item.categoryColor.trim().length > 0 ? item.categoryColor : '')
    || (typeof nestedCourse.categoryColor === 'string' && nestedCourse.categoryColor.trim().length > 0 ? nestedCourse.categoryColor : '')
    || normalizeCategoryColor(level)
  const studentCount = toNumber(item.studentCount ?? nestedCourse.studentCount ?? item.student_count ?? nestedCourse.student_count)
  const lessonCount = toNumber(item.lessonCount ?? nestedCourse.lessonCount ?? item.lesson_count ?? nestedCourse.lesson_count)
  const duration =
    (typeof item.duration === 'string' && item.duration.trim().length > 0 ? item.duration : '')
    || (typeof nestedCourse.duration === 'string' && nestedCourse.duration.trim().length > 0 ? nestedCourse.duration : '')
    || 'Đang cập nhật'
  const price = toNumber(item.price ?? nestedCourse.price)
  const originalPrice = toNumber(item.originalPrice ?? nestedCourse.originalPrice ?? item.original_price ?? nestedCourse.original_price)

  return {
    id,
    lessonCount,
    title,
    description,
    instructor,
    instructorEmail:
      (typeof item.teacherEmail === 'string' && item.teacherEmail.trim().length > 0 ? item.teacherEmail : '')
      || (typeof item.instructorEmail === 'string' && item.instructorEmail.trim().length > 0 ? item.instructorEmail : '')
      || (typeof teacher.email === 'string' && teacher.email.trim().length > 0 ? teacher.email : '')
      || (typeof instructorObject.email === 'string' && instructorObject.email.trim().length > 0 ? instructorObject.email : '')
      || (typeof nestedCourse.instructorEmail === 'string' && nestedCourse.instructorEmail.trim().length > 0 ? nestedCourse.instructorEmail : '')
      || undefined,
    teacherId:
      readCourseId(item.teacherId)
      || readCourseId(item.teacher_id)
      || readCourseId(item.ownerId)
      || readCourseId(item.owner_id)
      || readCourseId(teacher.id)
      || readCourseId(teacher._id)
      || readCourseId(instructorObject.id)
      || readCourseId(instructorObject._id)
      || readCourseId(nestedCourse.teacherId)
      || readCourseId(nestedCourse.teacher_id)
      || undefined,
    instructorAvatar: buildInitialsFromName(instructor),
    category,
    categoryColor,
    level,
    rating: toNumber(item.rating ?? nestedCourse.rating),
    reviewCount: toNumber(item.reviewCount ?? nestedCourse.reviewCount ?? item.review_count ?? nestedCourse.review_count),
    studentCount,
    duration,
    price,
    originalPrice,
    tags: [level],
    lessons: [],
  }
}

export async function fetchMyTeachingCourses(): Promise<Course[]> {
  let rows: unknown[] = []

  try {
    const { data } = await api.get('/courses', { params: { mine: 'true' } })
    rows = extractArrayPayload<unknown>(data)
  } catch {
    const { data } = await api.get('/me/teaching-courses')
    rows = extractArrayPayload<unknown>(data)
  }

  const parsed = rows
    .map((row) => toTeachingCourse(row))
    .filter((course): course is Course => Boolean(course && course.id))

  const seen = new Set<string>()
  return parsed.filter((course) => {
    if (seen.has(course.id)) {
      return false
    }

    seen.add(course.id)
    return true
  })
}

export async function fetchMyTeachingCourseIds(): Promise<string[]> {
  const courses = await fetchMyTeachingCourses()
  return courses.map((course) => course.id)
}

export async function fetchTeachingAssignmentsOverview(): Promise<TeachingAssignmentOverviewItem[]> {
  const { data } = await api.get('/me/teaching-assignments/overview')
  const rows = extractArrayPayload<unknown>(data)

  return rows.map((row) => {
    const item = asRecord(row)

    return {
      assignmentId: typeof item.assignmentId === 'string' ? item.assignmentId : '',
      assignmentTitle: typeof item.assignmentTitle === 'string' ? item.assignmentTitle : 'Bài tập',
      dueDate: typeof item.dueDate === 'string' ? item.dueDate : null,
      maxScore: item.maxScore === null || item.maxScore === undefined ? null : toNumber(item.maxScore),
      courseId: typeof item.courseId === 'string' ? item.courseId : '',
      courseTitle: typeof item.courseTitle === 'string' ? item.courseTitle : 'Khóa học',
      totalStudents: toNumber(item.totalStudents),
      submittedCount: toNumber(item.submittedCount),
      gradedCount: toNumber(item.gradedCount),
    }
  })
}

export type { TeachingAssignmentOverviewItem }
