import { useEffect, useMemo, useState } from 'react'
import type { User } from './data/mockData.ts'
import { COURSES } from './data/mockData.ts'
import HomePage from './pages/HomePage.tsx'
import AuthPage from './pages/AuthPage.tsx'
import CourseDetailPage from './pages/CourseDetailPage.tsx'
import LessonPage from './pages/LessonPage.tsx'

type Route =
  | { view: 'home' }
  | { view: 'auth' }
  | { view: 'course'; courseId: string }
  | { view: 'lesson'; courseId: string; lessonId: string }

function parsePath(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean)

  if (parts.length === 0) {
    return { view: 'home' }
  }

  if (parts.length === 1 && parts[0] === 'dang-nhap') {
    return { view: 'auth' }
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

function buildPath(route: Route): string {
  if (route.view === 'home') {
    return '/'
  }

  if (route.view === 'auth') {
    return '/dang-nhap'
  }

  if (route.view === 'course') {
    return `/khoa-hoc/${encodeURIComponent(route.courseId)}`
  }

  return `/khoa-hoc/${encodeURIComponent(route.courseId)}/bai-hoc/${encodeURIComponent(route.lessonId)}`
}

function isLessonAccessible(courseId: string, lessonId: string, user: User | null) {
  const course = COURSES.find((item) => item.id === courseId)
  const lesson = course?.lessons.find((item) => item.id === lessonId)

  if (!lesson) {
    return false
  }

  return lesson.isFree || Boolean(user)
}

function inferRoleFromEmail(email: string): User['role'] {
  const normalizedEmail = email.toLowerCase()

  if (normalizedEmail.startsWith('admin@') || normalizedEmail.includes('.admin@')) {
    return 'admin'
  }

  if (normalizedEmail.startsWith('gv@') || normalizedEmail.startsWith('teacher@') || normalizedEmail.includes('.teacher@')) {
    return 'teacher'
  }

  return 'student'
}

function App() {
  const [route, setRoute] = useState<Route>(() => parsePath(window.location.pathname))
  const [user, setUser] = useState<User | null>(null)
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<Route | null>(null)

  const navigate = (nextRoute: Route, replace = false) => {
    const nextPath = buildPath(nextRoute)

    if (window.location.pathname !== nextPath) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', nextPath)
    }

    setRoute(nextRoute)
  }

  useEffect(() => {
    const normalizedRoute = parsePath(window.location.pathname)
    const normalizedPath = buildPath(normalizedRoute)

    if (normalizedPath !== window.location.pathname) {
      window.history.replaceState({}, '', normalizedPath)
    }

    const handlePopState = () => {
      setRoute(parsePath(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const effectiveRoute = useMemo<Route>(() => {
    if (route.view === 'lesson' && !isLessonAccessible(route.courseId, route.lessonId, user)) {
      return { view: 'auth' }
    }

    return route
  }, [route, user])

  const handleLogin = (name: string, email: string) => {
    setUser({ name, email, role: inferRoleFromEmail(email) })
    const nextRoute = redirectAfterAuth ?? (route.view === 'lesson' ? route : { view: 'home' })
    setRedirectAfterAuth(null)
    navigate(nextRoute, true)
  }

  const handleLogout = () => {
    setUser(null)
    setRedirectAfterAuth(null)
    navigate({ view: 'home' })
  }

  const goToLesson = (courseId: string, lessonId: string) => {
    const course = COURSES.find(c => c.id === courseId)
    const lesson = course?.lessons.find(l => l.id === lessonId)
    if (!lesson?.isFree && !user) {
      setRedirectAfterAuth({ view: 'lesson', courseId, lessonId })
      navigate({ view: 'auth' })
      return
    }
    navigate({ view: 'lesson', courseId, lessonId })
  }

  const goToAuth = () => navigate({ view: 'auth' })
  const goToHome = () => navigate({ view: 'home' })

  if (effectiveRoute.view === 'auth') {
    return <AuthPage onLogin={handleLogin} onBack={goToHome} />
  }

  if (effectiveRoute.view === 'home') {
    return (
      <HomePage
        user={user}
        onGoAuth={goToAuth}
        onGoCourse={(courseId) => navigate({ view: 'course', courseId })}
        onLogout={handleLogout}
      />
    )
  }

  if (effectiveRoute.view === 'course') {
    return (
      <CourseDetailPage
        courseId={effectiveRoute.courseId}
        user={user}
        onGoAuth={goToAuth}
        onBack={goToHome}
        onGoToLesson={goToLesson}
      />
    )
  }

  if (effectiveRoute.view === 'lesson') {
    const { courseId, lessonId } = effectiveRoute
    return (
      <LessonPage
        courseId={courseId}
        lessonId={lessonId}
        user={user}
        onBack={() => navigate({ view: 'course', courseId })}
        onGoToLesson={goToLesson}
        onGoAuth={goToAuth}
      />
    )
  }

  return (
    <HomePage
      user={user}
      onGoAuth={goToAuth}
      onGoCourse={(courseId) => navigate({ view: 'course', courseId })}
      onLogout={handleLogout}
    />
  )
}

export default App
