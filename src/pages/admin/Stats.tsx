import { useEffect, useMemo, useState } from 'react'
import { COURSES, fetchCourses } from '../../domain/index.ts'
import { getAdminStudents } from '../../services/userService.ts'
import { getAdminDashboardSummary } from '../../services/adminService.ts'
import './Dashboard.css'

type Props = {
  onBackToDashboard: () => void
}

function Stats({ onBackToDashboard }: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [studentUsersCount, setStudentUsersCount] = useState(0)
  const [apiSummary, setApiSummary] = useState<{
    totalCourses: number
    totalLessons: number
    totalStudents: number
    totalStudentUsers: number
    coursesByLevel: Array<{ label: string; value: number }>
    topCoursesByStudents: Array<{ id: string; title: string; students: number }>
  } | null>(null)

  useEffect(() => {
    let mounted = true

    const loadStatsData = async () => {
      setIsLoading(true)
      setError('')

      try {
        const [_, students, summary] = await Promise.all([
          fetchCourses(),
          getAdminStudents(),
          getAdminDashboardSummary(),
        ])

        if (!mounted) {
          return
        }

        setStudentUsersCount(students.length)
        setApiSummary(summary)
      } catch (loadError) {
        console.error('load admin stats failed', loadError)
        if (mounted) {
          setError('Không thể tải dữ liệu thống kê từ backend. Đang hiển thị dữ liệu hiện có.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadStatsData()

    return () => {
      mounted = false
    }
  }, [])

  const totalCourses = COURSES.length
  const totalLessons = useMemo(
    () => COURSES.reduce((sum, c) => sum + (c.lessonCount ?? c.lessons.length), 0),
    [totalCourses]
  )
  const totalStudents = useMemo(
    () => COURSES.reduce((sum, c) => sum + c.studentCount, 0),
    [totalCourses]
  )

  const coursesByLevel = useMemo(() => {
    if (apiSummary?.coursesByLevel && apiSummary.coursesByLevel.length > 0) {
      const maxFromApi = Math.max(1, ...apiSummary.coursesByLevel.map((entry) => entry.value))
      return apiSummary.coursesByLevel.map((entry) => ({
        ...entry,
        width: `${Math.round((entry.value / maxFromApi) * 100)}%`,
      }))
    }

    const base = { 'Cơ bản': 0, 'Trung cấp': 0, 'Nâng cao': 0 }
    for (const course of COURSES) {
      base[course.level] += 1
    }

    const max = Math.max(1, ...Object.values(base))
    return Object.entries(base).map(([label, value]) => ({
      label,
      value,
      width: `${Math.round((value / max) * 100)}%`,
    }))
  }, [totalCourses, apiSummary])

  const topCoursesByStudents = useMemo(() => {
    if (apiSummary?.topCoursesByStudents && apiSummary.topCoursesByStudents.length > 0) {
      const maxFromApi = Math.max(1, ...apiSummary.topCoursesByStudents.map((entry) => entry.students))
      return apiSummary.topCoursesByStudents.map((entry) => ({
        ...entry,
        width: `${Math.round((entry.students / maxFromApi) * 100)}%`,
      }))
    }

    const rows = [...COURSES]
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 8)

    const max = Math.max(1, ...rows.map((row) => row.studentCount))
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      students: row.studentCount,
      width: `${Math.round((row.studentCount / max) * 100)}%`,
    }))
  }, [totalCourses, apiSummary])

  const displayedTotalCourses = apiSummary?.totalCourses && apiSummary.totalCourses > 0 ? apiSummary.totalCourses : totalCourses
  const displayedTotalLessons = apiSummary?.totalLessons && apiSummary.totalLessons > 0 ? apiSummary.totalLessons : totalLessons
  const displayedTotalStudents = apiSummary?.totalStudents && apiSummary.totalStudents > 0 ? apiSummary.totalStudents : totalStudents
  const displayedStudentUsersCount = apiSummary?.totalStudentUsers && apiSummary.totalStudentUsers > 0 ? apiSummary.totalStudentUsers : studentUsersCount

  return (
    <section className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Thống kê hệ thống</h1>
            <p className="admin-subtitle">Phân tích dữ liệu khóa học và học viên</p>
          </div>
          <div className="admin-toolbar">
            <button className="admin-btn ghost" onClick={onBackToDashboard}>Về Dashboard</button>
          </div>
        </header>

        <div className="admin-grid">
          <article className="admin-card">
            <h3>Khóa học</h3>
            <div className="admin-stat">{displayedTotalCourses}</div>
            <p>Tổng số khóa học</p>
          </article>
          <article className="admin-card">
            <h3>Bài học</h3>
            <div className="admin-stat">{displayedTotalLessons}</div>
            <p>Tổng số bài học</p>
          </article>
          <article className="admin-card">
            <h3>Học viên</h3>
            <div className="admin-stat">{displayedStudentUsersCount.toLocaleString()}</div>
            <p>{displayedTotalStudents.toLocaleString()} lượt đăng ký tích lũy</p>
          </article>
        </div>

        {isLoading && (
          <section className="admin-panel">
            <div className="admin-list-meta">Đang tải dữ liệu thống kê từ backend...</div>
          </section>
        )}

        {error && (
          <section className="admin-panel">
            <div className="admin-list-meta" style={{ color: '#dc2626' }}>{error}</div>
          </section>
        )}

        <div className="admin-grid admin-chart-grid">
          <section className="admin-panel">
            <h3>Cột phân bố khóa học theo trình độ</h3>
            <div className="admin-chart-list">
              {coursesByLevel.map((entry) => (
                <div className="admin-chart-row" key={entry.label}>
                  <span className="admin-chart-label">{entry.label}</span>
                  <div className="admin-chart-track">
                    <div className="admin-chart-bar" style={{ width: entry.width }} />
                  </div>
                  <strong className="admin-chart-value">{entry.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <h3>Cột top khóa học theo học viên</h3>
            <div className="admin-chart-list">
              {topCoursesByStudents.map((entry) => (
                <div className="admin-chart-row" key={entry.id}>
                  <span className="admin-chart-label" title={entry.title}>{entry.title}</span>
                  <div className="admin-chart-track">
                    <div className="admin-chart-bar admin-chart-bar-alt" style={{ width: entry.width }} />
                  </div>
                  <strong className="admin-chart-value">{entry.students}</strong>
                </div>
              ))}
              {topCoursesByStudents.length === 0 && (
                <div className="admin-list-meta">Chưa có dữ liệu khóa học.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

export default Stats
