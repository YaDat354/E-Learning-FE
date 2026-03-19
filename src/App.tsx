import { useEffect, useMemo, useState } from 'react'
import type { User } from './data/mockData.ts'
import { COURSES } from './data/mockData.ts'
import { buildPath, parsePath, type Route } from './routes/appRoutes.ts'
import { inferRoleFromEmail } from './utils/auth.ts'
import HomePage from './pages/HomePage.tsx'
import AuthPage from './pages/AuthPage.tsx'
import CourseDetailPage from './pages/CourseDetailPage.tsx'
import LessonPage from './pages/LessonPage.tsx'
import StudentDashboard from './pages/student/Dashboard.tsx'
import StudentCourseList from './pages/student/CourseList.tsx'
import StudentCourseDetail from './pages/student/CourseDetail.tsx'
import StudentLearnPage from './pages/student/LearnPage.tsx'
import StudentProfile from './pages/student/Profile.tsx'
import TeacherDashboard from './pages/teacher/Dashboard.tsx'
import TeacherCourseManage from './pages/teacher/CourseManage.tsx'
import TeacherLessonManage from './pages/teacher/LessonManage.tsx'
import TeacherQuizManage from './pages/teacher/QuizManage.tsx'
import TeacherAssignmentManage from './pages/teacher/AssignmentManage.tsx'
import AdminDashboard from './pages/admin/Dashboard.tsx'
import AdminUserManage from './pages/admin/UserManage.tsx'
import AdminCourseManage from './pages/admin/CourseManage.tsx'

function isLessonAccessible(courseId: string, lessonId: string, user: User | null) {
  const course = COURSES.find((item) => item.id === courseId)
  const lesson = course?.lessons.find((item) => item.id === lessonId)

  if (!lesson) {
    return false
  }

  return lesson.isFree || Boolean(user)
}

function defaultRouteByRole(role: User['role']): Route {
  if (role === 'student') {
    return { view: 'student-dashboard' }
  }

  if (role === 'teacher') {
    return { view: 'teacher-dashboard' }
  }

  return { view: 'admin-dashboard' }
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
    const role = inferRoleFromEmail(email)
    setUser({ name, email, role })
    const defaultRoute = defaultRouteByRole(role)
    const nextRoute = redirectAfterAuth ?? (route.view === 'lesson' ? route : defaultRoute)
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
  const goToHome = () => {
    if (user) {
      navigate(defaultRouteByRole(user.role))
      return
    }

    navigate({ view: 'home' })
  }

  if (effectiveRoute.view === 'auth') {
    return <AuthPage onLogin={handleLogin} onBack={goToHome} />
  }

  if (effectiveRoute.view === 'home') {
    if (user?.role === 'student') {
      return (
        <StudentDashboard
          user={user}
          onOpenCourse={(courseId) => navigate({ view: 'course', courseId })}
          onOpenLesson={goToLesson}
          onOpenCourseList={() => navigate({ view: 'student-courses' })}
          onOpenProfile={() => navigate({ view: 'student-profile' })}
        />
      )
    }

    if (user?.role === 'teacher') {
      return <TeacherDashboard />
    }

    if (user?.role === 'admin') {
      return <AdminDashboard />
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

  if (effectiveRoute.view === 'student-dashboard') {
    if (!user || user.role !== 'student') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return (
      <StudentDashboard
        user={user}
        onOpenCourse={(courseId) => navigate({ view: 'course', courseId })}
        onOpenLesson={goToLesson}
        onOpenCourseList={() => navigate({ view: 'student-courses' })}
        onOpenProfile={() => navigate({ view: 'student-profile' })}
      />
    )
  }

  if (effectiveRoute.view === 'student-courses') {
    if (!user || user.role !== 'student') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return (
      <StudentCourseList
        onOpenCourse={(courseId) => navigate({ view: 'course', courseId })}
        onBackToDashboard={() => navigate({ view: 'student-dashboard' })}
      />
    )
  }

  if (effectiveRoute.view === 'student-profile') {
    if (!user || user.role !== 'student') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return (
      <StudentProfile
        user={user}
        onLogout={handleLogout}
        onBackToDashboard={() => navigate({ view: 'student-dashboard' })}
      />
    )
  }

  if (effectiveRoute.view === 'teacher-dashboard') {
    if (!user || user.role !== 'teacher') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return <TeacherDashboard />
  }

  if (effectiveRoute.view === 'teacher-courses') {
    if (!user || user.role !== 'teacher') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return <TeacherCourseManage />
  }

  if (effectiveRoute.view === 'teacher-lessons') {
    if (!user || user.role !== 'teacher') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return <TeacherLessonManage />
  }

  if (effectiveRoute.view === 'teacher-quizzes') {
    if (!user || user.role !== 'teacher') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return <TeacherQuizManage />
  }

  if (effectiveRoute.view === 'teacher-assignments') {
    if (!user || user.role !== 'teacher') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return <TeacherAssignmentManage />
  }

  if (effectiveRoute.view === 'admin-dashboard') {
    if (!user || user.role !== 'admin') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return <AdminDashboard />
  }

  if (effectiveRoute.view === 'admin-users') {
    if (!user || user.role !== 'admin') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return <AdminUserManage />
  }

  if (effectiveRoute.view === 'admin-courses') {
    if (!user || user.role !== 'admin') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return <AdminCourseManage />
  }

  if (effectiveRoute.view === 'course') {
    if (user?.role === 'student') {
      return (
        <StudentCourseDetail
          courseId={effectiveRoute.courseId}
          user={user}
          onGoAuth={goToAuth}
          onBack={() => navigate({ view: 'student-courses' })}
          onGoToLesson={goToLesson}
        />
      )
    }

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

    if (user?.role === 'student') {
      return (
        <StudentLearnPage
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
