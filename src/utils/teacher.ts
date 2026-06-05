import type { Course, User } from '../types/domain.ts'

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function extractEmailLocalPart(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) {
    return normalize(email)
  }

  return normalize(email.slice(0, at))
}

export function isTeacherCourseOwner(course: Course, user: User): boolean {
  if (user.role !== 'teacher') {
    return false
  }

  if (hasExplicitTeacherOwnership(course, user)) {
    return true
  }

  const teacherName = normalize(course.instructor)
  const userName = normalize(user.name)
  const emailLocalPart = extractEmailLocalPart(user.email)

  return (
    teacherName === userName
    || teacherName.includes(emailLocalPart)
    || userName.includes(teacherName)
  )
}

export function hasExplicitTeacherOwnership(course: Course, user: User): boolean {
  if (user.role !== 'teacher') {
    return false
  }

  if (typeof course.teacherId === 'string' && course.teacherId.trim().length > 0 && typeof user.id === 'string' && user.id.trim().length > 0) {
    return normalize(course.teacherId) === normalize(user.id)
  }

  if (typeof course.instructorEmail === 'string' && course.instructorEmail.trim().length > 0) {
    return normalize(course.instructorEmail) === normalize(user.email)
  }

  return false
}

export function getTeacherCourses(courses: Course[], user: User, teacherCourseIds: string[] = []): Course[] {
  if (user.role !== 'teacher') {
    return []
  }

  if (teacherCourseIds.length > 0) {
    return courses.filter((course) => teacherCourseIds.includes(course.id))
  }

  // Defensive fallback: never grant broad access when server-owned ids are missing.
  return courses.filter((course) => isTeacherCourseOwner(course, user))
}
