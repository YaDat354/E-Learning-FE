import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import type { Course, User } from './domain/index.ts'
import { COURSES, createCourse, fetchMe, initializeDomainData } from './domain/index.ts'
import { buildPath, parsePath, type Route } from './routes/appRoutes.ts'
import { inferRoleFromEmail } from './utils/auth.ts'
import { login as loginApi, logout as logoutApi } from './services/authService.ts'
import { enrollCourse as enrollCourseApi, fetchMyCourses } from './services/enrollmentService.ts'
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
import TeacherCreateCourse from './pages/teacher/CreateCourse.tsx'
import TeacherLessonManage from './pages/teacher/LessonManage.tsx'
import TeacherQuizManage from './pages/teacher/QuizManage.tsx'
import TeacherAssignmentManage from './pages/teacher/AssignmentManage.tsx'
import AdminDashboard from './pages/admin/Dashboard.tsx'
import AdminUserManage from './pages/admin/UserManage.tsx'
import AdminCourseManage from './pages/admin/CourseManage.tsx'
import AdminLayout from './pages/admin/AdminLayout.tsx'

const STUDENT_COURSE_IDS_KEY = 'studentCourseIds'

function defaultRouteByRole(role: User['role']): Route {
  if (role === 'student') {
    return { view: 'student-dashboard' }
  }

  if (role === 'teacher') {
    return { view: 'teacher-dashboard' }
  }

  return { view: 'admin-dashboard' }
}

function normalizeRole(value: unknown): User['role'] | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()

  if (!normalized) {
    return null
  }

  if (normalized === 'admin' || normalized === 'role_admin') {
    return 'admin'
  }

  if (normalized === 'teacher' || normalized === 'instructor' || normalized === 'role_teacher' || normalized === 'role_instructor') {
    return 'teacher'
  }

  if (normalized === 'student' || normalized === 'learner' || normalized === 'role_student' || normalized === 'role_learner') {
    return 'student'
  }

  return null
}

function resolveAuthUser(payload: unknown, fallbackEmail: string): User {
  const source = (payload && typeof payload === 'object') ? payload as Record<string, unknown> : {}
  const nestedData = (source.data && typeof source.data === 'object') ? source.data as Record<string, unknown> : {}
  const nestedUser = (source.user && typeof source.user === 'object')
    ? source.user as Record<string, unknown>
    : (nestedData.user && typeof nestedData.user === 'object')
      ? nestedData.user as Record<string, unknown>
      : {}

  const name = typeof nestedUser.name === 'string' && nestedUser.name.trim().length > 0
    ? nestedUser.name
    : typeof nestedUser.fullName === 'string' && nestedUser.fullName.trim().length > 0
      ? nestedUser.fullName
      : typeof source.name === 'string' && source.name.trim().length > 0
        ? source.name
        : typeof source.fullName === 'string' && source.fullName.trim().length > 0
          ? source.fullName
          : typeof nestedData.name === 'string' && nestedData.name.trim().length > 0
            ? nestedData.name
            : typeof nestedData.fullName === 'string' && nestedData.fullName.trim().length > 0
              ? nestedData.fullName
      : fallbackEmail.split('@')[0] || 'Học viên'

  const email = typeof nestedUser.email === 'string' && nestedUser.email.trim().length > 0
    ? nestedUser.email
    : typeof source.email === 'string' && source.email.trim().length > 0
      ? source.email
      : typeof nestedData.email === 'string' && nestedData.email.trim().length > 0
        ? nestedData.email
        : (fallbackEmail || 'user@example.com')

  const role =
    normalizeRole(nestedUser.role) ??
    normalizeRole(nestedUser.userRole) ??
    normalizeRole(nestedUser.roleName) ??
    normalizeRole(source.role) ??
    normalizeRole(source.userRole) ??
    normalizeRole(source.roleName) ??
    normalizeRole(nestedData.role) ??
    normalizeRole(nestedData.userRole) ??
    normalizeRole(nestedData.roleName) ??
    inferRoleFromEmail(email)

  return { name, email, role }
}

function readPersistedStudentCourseIds(): string[] {
  const raw = localStorage.getItem(STUDENT_COURSE_IDS_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter((item) => item.length > 0)
      : []
  } catch {
    return []
  }
}

function persistStudentCourseIds(courseIds: string[]) {
  localStorage.setItem(STUDENT_COURSE_IDS_KEY, JSON.stringify(Array.from(new Set(courseIds))))
}

function App() {
  const [route, setRoute] = useState<Route>(() => parsePath(window.location.pathname))
  const [user, setUser] = useState<User | null>(null)
  const [studentCourseIds, setStudentCourseIds] = useState<string[]>(() => readPersistedStudentCourseIds())
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<Route | null>(null)
  const [isBootstrapped, setIsBootstrapped] = useState(false)

  const syncStudentCourses = async (applyState = true) => {
    try {
      const ids = await fetchMyCourses()
      if (applyState) {
        setStudentCourseIds(ids)
      }
      persistStudentCourseIds(ids)
      return ids
    } catch {
      const fallbackIds = readPersistedStudentCourseIds()
      if (applyState) {
        setStudentCourseIds(fallbackIds)
      }
      return fallbackIds
    }
  }

  const navigate = (nextRoute: Route, replace = false) => {
    const nextPath = buildPath(nextRoute)

    if (window.location.pathname !== nextPath) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', nextPath)
    }

    setRoute(nextRoute)
  }

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      const backendAvailable = await initializeDomainData()

      if (!backendAvailable) {
        if (mounted) {
          setUser(null)
          setStudentCourseIds([])
          setRedirectAfterAuth(null)
          navigate({ view: 'home' }, true)
          setIsBootstrapped(true)
        }
        return
      }

      const persistedToken = localStorage.getItem('accessToken')
      if (persistedToken) {
        try {
          const apiUser = await fetchMe()
          const nextUser = resolveAuthUser(apiUser, 'user@example.com')

          if (mounted) {
            setUser(nextUser)
            if (nextUser.role === 'student') {
              await syncStudentCourses(mounted)
            } else {
              setStudentCourseIds([])
            }
          }
        } catch (error) {
          const status = axios.isAxiosError(error) ? error.response?.status : undefined

          if (status === 401 || status === 403) {
            // Token is invalid or expired.
            logoutApi()
            if (mounted) {
              setUser(null)
              setStudentCourseIds([])
            }
          } else if (mounted) {
            setUser(null)
            setStudentCourseIds([])
            setRedirectAfterAuth(null)
            navigate({ view: 'home' }, true)
          }
        }
      } else if (mounted) {
        setStudentCourseIds([])
      }

      if (mounted) {
        setIsBootstrapped(true)
      }
    }

    void bootstrap()

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
      mounted = false
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (!isBootstrapped || user?.role !== 'student') {
      return
    }

    void syncStudentCourses()
  }, [isBootstrapped, user?.role])

  const effectiveRoute = useMemo<Route>(() => {
    if (route.view === 'course' && !user) {
      return { view: 'auth' }
    }

    return route
  }, [route, user])

  const handleLogin = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password) {
      throw new Error('missing credentials')
    }

    const authData = await loginApi(normalizedEmail, password)

    let apiUser: unknown = null
    try {
      apiUser = await fetchMe()
    } catch {
      apiUser = null
    }

    const authUser = resolveAuthUser(apiUser ?? authData, normalizedEmail)

    setUser(authUser)
    if (authUser.role === 'student') {
      await syncStudentCourses()
    } else {
      setStudentCourseIds([])
    }
    const defaultRoute = defaultRouteByRole(authUser.role)
    const nextRoute = redirectAfterAuth ?? ((route.view === 'lesson' || route.view === 'course') ? route : defaultRoute)
    setRedirectAfterAuth(null)
    navigate(nextRoute, true)
  }

  const handleLogout = () => {
    logoutApi()
    setUser(null)
    setStudentCourseIds([])
    setRedirectAfterAuth(null)
    navigate({ view: 'home' })
  }

  const handleEnrollCourse = async (courseId: string) => {
    if (!user || user.role !== 'student') {
      return false
    }

    try {
      await enrollCourseApi(courseId)
      const nextIds = studentCourseIds.includes(courseId) ? studentCourseIds : [...studentCourseIds, courseId]
      setStudentCourseIds(nextIds)
      persistStudentCourseIds(nextIds)
      return true
    } catch (error) {
      console.error('enroll course failed', error)
      alert('Không thể đăng ký khóa học. Vui lòng thử lại.')
      return false
    }
  }

  const handleTeacherCourseCreated = async (course: Course) => {
    try {
      await createCourse(course)
    } catch (error) {
      console.error('create course failed', error)
      alert('Không thể tạo khóa học. Vui lòng kiểm tra backend.')
    }
  }

  const goToLesson = (courseId: string, lessonId: string) => {
    const course = COURSES.find(c => c.id === courseId)
    const lesson = course?.lessons.find(l => l.id === lessonId)

    if (user?.role === 'student' && !studentCourseIds.includes(courseId) && !lesson?.isFree) {
      alert('Bạn chưa đăng ký khóa học này. Vui lòng vào "Khóa học của tôi" để học tiếp.')
      navigate({ view: 'student-courses' })
      return
    }

    if (!user && lesson && !lesson.isFree) {
      setRedirectAfterAuth({ view: 'lesson', courseId, lessonId })
      navigate({ view: 'auth' })
      return
    }
    navigate({ view: 'lesson', courseId, lessonId })
  }

  const goToCourse = (courseId: string) => {
    if (!user) {
      setRedirectAfterAuth({ view: 'course', courseId })
      navigate({ view: 'auth' })
      return
    }

    navigate({ view: 'course', courseId })
  }

  const goToAuth = () => navigate({ view: 'auth' })
  const goToHome = () => {
    if (user) {
      navigate(defaultRouteByRole(user.role))
      return
    }

    navigate({ view: 'home' })
  }

  if (!isBootstrapped) {
    return <div style={{ padding: 24 }}>Đang kết nối backend...</div>
  }

  if (effectiveRoute.view === 'auth') {
    return <AuthPage onLogin={handleLogin} onBack={goToHome} />
  }

  if (effectiveRoute.view === 'home') {
    if (user?.role === 'student') {
      return (
        <StudentDashboard
          user={user}
          myCourseIds={studentCourseIds}
          onOpenCourse={goToCourse}
          onOpenLesson={goToLesson}
          onOpenCourseList={() => navigate({ view: 'student-courses' })}
          onOpenProfile={() => navigate({ view: 'student-profile' })}
          onLogout={handleLogout}
        />
      )
    }

    if (user?.role === 'teacher') {
      return (
        <TeacherDashboard
          user={user}
          onGoCourses={() => navigate({ view: 'teacher-courses' })}
          onGoCreateCourse={() => navigate({ view: 'teacher-create-course' })}
          onGoLessons={() => navigate({ view: 'teacher-lessons' })}
          onGoQuizzes={() => navigate({ view: 'teacher-quizzes' })}
          onGoAssignments={() => navigate({ view: 'teacher-assignments' })}
          onLogout={handleLogout}
        />
      )
    }

    if (user?.role === 'admin') {
      return (
        <AdminLayout
          user={user}
          activeView="dashboard"
          onGoDashboard={() => navigate({ view: 'admin-dashboard' })}
          onGoCourses={() => navigate({ view: 'admin-courses' })}
          onGoUsers={() => navigate({ view: 'admin-users' })}
          onLogout={handleLogout}
        >
          <AdminDashboard
            onGoCourses={() => navigate({ view: 'admin-courses' })}
            onGoUsers={() => navigate({ view: 'admin-users' })}
            onLogout={handleLogout}
          />
        </AdminLayout>
      )
    }

    return (
      <HomePage
        user={user}
        onGoAuth={goToAuth}
        onGoCourse={goToCourse}
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
        myCourseIds={studentCourseIds}
        onOpenCourse={goToCourse}
        onOpenLesson={goToLesson}
        onOpenCourseList={() => navigate({ view: 'student-courses' })}
        onOpenProfile={() => navigate({ view: 'student-profile' })}
        onLogout={handleLogout}
      />
    )
  }

  if (effectiveRoute.view === 'student-courses') {
    if (!user || user.role !== 'student') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return (
      <StudentCourseList
        myCourseIds={studentCourseIds}
        onOpenCourse={goToCourse}
        onBackToDashboard={() => navigate({ view: 'student-dashboard' })}
        onLogout={handleLogout}
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

    return (
      <TeacherDashboard
        user={user}
        onGoCourses={() => navigate({ view: 'teacher-courses' })}
        onGoCreateCourse={() => navigate({ view: 'teacher-create-course' })}
        onGoLessons={() => navigate({ view: 'teacher-lessons' })}
        onGoQuizzes={() => navigate({ view: 'teacher-quizzes' })}
        onGoAssignments={() => navigate({ view: 'teacher-assignments' })}
        onLogout={handleLogout}
      />
    )
  }

  if (effectiveRoute.view === 'teacher-courses') {
    if (!user || user.role !== 'teacher') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return (
      <TeacherCourseManage
        onBackToDashboard={() => navigate({ view: 'teacher-dashboard' })}
        onGoCreateCourse={() => navigate({ view: 'teacher-create-course' })}
        onGoLessons={() => navigate({ view: 'teacher-lessons' })}
      />
    )
  }

  if (effectiveRoute.view === 'teacher-create-course') {
    if (!user || user.role !== 'teacher') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return (
      <TeacherCreateCourse
        onCreated={handleTeacherCourseCreated}
        onBackToDashboard={() => navigate({ view: 'teacher-courses' })}
      />
    )
  }

  if (effectiveRoute.view === 'teacher-lessons') {
    if (!user || user.role !== 'teacher') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return (
      <TeacherLessonManage
        onBackToDashboard={() => navigate({ view: 'teacher-dashboard' })}
      />
    )
  }

  if (effectiveRoute.view === 'teacher-quizzes') {
    if (!user || user.role !== 'teacher') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return (
      <TeacherQuizManage
        onBackToDashboard={() => navigate({ view: 'teacher-dashboard' })}
      />
    )
  }

  if (effectiveRoute.view === 'teacher-assignments') {
    if (!user || user.role !== 'teacher') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return (
      <TeacherAssignmentManage
        onBackToDashboard={() => navigate({ view: 'teacher-dashboard' })}
      />
    )
  }

  if (effectiveRoute.view === 'admin-dashboard') {
    if (!user || user.role !== 'admin') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return (
      <AdminLayout
        user={user}
        activeView="dashboard"
        onGoDashboard={() => navigate({ view: 'admin-dashboard' })}
        onGoCourses={() => navigate({ view: 'admin-courses' })}
        onGoUsers={() => navigate({ view: 'admin-users' })}
        onLogout={handleLogout}
      >
        <AdminDashboard
          onGoCourses={() => navigate({ view: 'admin-courses' })}
          onGoUsers={() => navigate({ view: 'admin-users' })}
          onLogout={handleLogout}
        />
      </AdminLayout>
    )
  }

  if (effectiveRoute.view === 'admin-users') {
    if (!user || user.role !== 'admin') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return (
      <AdminLayout
        user={user}
        activeView="users"
        onGoDashboard={() => navigate({ view: 'admin-dashboard' })}
        onGoCourses={() => navigate({ view: 'admin-courses' })}
        onGoUsers={() => navigate({ view: 'admin-users' })}
        onLogout={handleLogout}
      >
        <AdminUserManage
          onBackToDashboard={() => navigate({ view: 'admin-dashboard' })}
        />
      </AdminLayout>
    )
  }

  if (effectiveRoute.view === 'admin-courses') {
    if (!user || user.role !== 'admin') {
      return <AuthPage onLogin={handleLogin} onBack={goToHome} />
    }

    return (
      <AdminLayout
        user={user}
        activeView="courses"
        onGoDashboard={() => navigate({ view: 'admin-dashboard' })}
        onGoCourses={() => navigate({ view: 'admin-courses' })}
        onGoUsers={() => navigate({ view: 'admin-users' })}
        onLogout={handleLogout}
      >
        <AdminCourseManage
          onBackToDashboard={() => navigate({ view: 'admin-dashboard' })}
        />
      </AdminLayout>
    )
  }

  if (effectiveRoute.view === 'course') {
    if (user?.role === 'student') {
      return (
        <StudentCourseDetail
          courseId={effectiveRoute.courseId}
          user={user}
          isEnrolled={studentCourseIds.includes(effectiveRoute.courseId)}
          onEnrollCourse={handleEnrollCourse}
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
        isEnrolled={true}
        onEnrollCourse={handleEnrollCourse}
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
