export type Route =
  | { view: 'home' }
  | { view: 'auth' }
  | { view: 'student-dashboard' }
  | { view: 'student-courses' }
  | { view: 'student-profile' }
  | { view: 'teacher-dashboard' }
  | { view: 'teacher-courses' }
  | { view: 'teacher-lessons' }
  | { view: 'teacher-quizzes' }
  | { view: 'teacher-assignments' }
  | { view: 'admin-dashboard' }
  | { view: 'admin-create-course' }
  | { view: 'admin-edit-course'; courseId: string }
  | { view: 'admin-users' }
  | { view: 'admin-courses' }
  | { view: 'course'; courseId: string }
  | { view: 'lesson'; courseId: string; lessonId: string }

export function parsePath(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean)

  if (parts.length === 0) {
    return { view: 'home' }
  }

  if (parts.length === 1 && parts[0] === 'dang-nhap') {
    return { view: 'auth' }
  }

  if (parts.length === 2 && parts[0] === 'hoc-vien' && parts[1] === 'dashboard') {
    return { view: 'student-dashboard' }
  }

  if (parts.length === 2 && parts[0] === 'hoc-vien' && parts[1] === 'khoa-hoc') {
    return { view: 'student-courses' }
  }

  if (parts.length === 2 && parts[0] === 'hoc-vien' && parts[1] === 'ho-so') {
    return { view: 'student-profile' }
  }

  if (parts.length === 2 && parts[0] === 'giang-vien' && parts[1] === 'dashboard') {
    return { view: 'teacher-dashboard' }
  }

  if (parts.length === 2 && parts[0] === 'giang-vien' && parts[1] === 'khoa-hoc') {
    return { view: 'teacher-courses' }
  }

  if (parts.length === 2 && parts[0] === 'giang-vien' && parts[1] === 'bai-hoc') {
    return { view: 'teacher-lessons' }
  }

  if (parts.length === 2 && parts[0] === 'giang-vien' && parts[1] === 'quiz') {
    return { view: 'teacher-quizzes' }
  }

  if (parts.length === 2 && parts[0] === 'giang-vien' && parts[1] === 'bai-tap') {
    return { view: 'teacher-assignments' }
  }

  if (parts.length === 2 && parts[0] === 'admin' && parts[1] === 'tao-khoa-hoc') {
    return { view: 'admin-create-course' }
  }

  if (parts.length === 3 && parts[0] === 'admin' && parts[1] === 'sua-khoa-hoc') {
    return { view: 'admin-edit-course', courseId: decodeURIComponent(parts[2]) }
  }

  if (parts.length === 2 && parts[0] === 'admin' && parts[1] === 'dashboard') {
    return { view: 'admin-dashboard' }
  }

  if (parts.length === 2 && parts[0] === 'admin' && parts[1] === 'nguoi-dung') {
    return { view: 'admin-users' }
  }

  if (parts.length === 2 && parts[0] === 'admin' && parts[1] === 'khoa-hoc') {
    return { view: 'admin-courses' }
  }

  if (parts.length === 2 && parts[0] === 'khoa-hoc') {
    return { view: 'course', courseId: decodeURIComponent(parts[1]) }
  }

  if (parts.length === 4 && parts[0] === 'khoa-hoc' && parts[2] === 'bai-hoc') {
    return {
      view: 'lesson',
      courseId: decodeURIComponent(parts[1]),
      lessonId: decodeURIComponent(parts[3]),
    }
  }

  return { view: 'home' }
}

export function buildPath(route: Route): string {
  if (route.view === 'home') {
    return '/'
  }

  if (route.view === 'auth') {
    return '/dang-nhap'
  }

  if (route.view === 'student-dashboard') {
    return '/hoc-vien/dashboard'
  }

  if (route.view === 'student-courses') {
    return '/hoc-vien/khoa-hoc'
  }

  if (route.view === 'student-profile') {
    return '/hoc-vien/ho-so'
  }

  if (route.view === 'teacher-dashboard') {
    return '/giang-vien/dashboard'
  }

  if (route.view === 'teacher-courses') {
    return '/giang-vien/khoa-hoc'
  }

  if (route.view === 'teacher-lessons') {
    return '/giang-vien/bai-hoc'
  }

  if (route.view === 'teacher-quizzes') {
    return '/giang-vien/quiz'
  }

  if (route.view === 'teacher-assignments') {
    return '/giang-vien/bai-tap'
  }

  if (route.view === 'admin-create-course') {
    return '/admin/tao-khoa-hoc'
  }

  if (route.view === 'admin-edit-course') {
    return `/admin/sua-khoa-hoc/${encodeURIComponent(route.courseId)}`
  }

  if (route.view === 'admin-dashboard') {
    return '/admin/dashboard'
  }

  if (route.view === 'admin-users') {
    return '/admin/nguoi-dung'
  }

  if (route.view === 'admin-courses') {
    return '/admin/khoa-hoc'
  }

  if (route.view === 'course') {
    return `/khoa-hoc/${encodeURIComponent(route.courseId)}`
  }

  return `/khoa-hoc/${encodeURIComponent(route.courseId)}/bai-hoc/${encodeURIComponent(route.lessonId)}`
}