import { useEffect, useMemo, useState } from 'react'
import { COURSES } from '../../domain/index.ts'
import type { User } from '../../domain/index.ts'
import { getTeacherCourses } from '../../utils/teacher.ts'
import { createMeetingNotification, fetchMeetingsForCourses, type MeetingNotification } from '../../services/meetingService.ts'
import './MeetingManage.css'

function ensureAbsoluteUrl(url?: string) {
  if (!url) return ''
  const trimmed = url.trim()
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `${window.location.protocol}${trimmed}`
  return `https://${trimmed}`
}

type Props = {
  user: User
  teacherCourseIds: string[]
  onBackToDashboard: () => void
}

function MeetingManage({ user, teacherCourseIds, onBackToDashboard }: Props) {
  const teacherCourses = useMemo(
    () => getTeacherCourses(COURSES, user, teacherCourseIds),
    [teacherCourseIds, user],
  )
  const [selectedCourseId, setSelectedCourseId] = useState(teacherCourses[0]?.id ?? '')
  const [meetings, setMeetings] = useState<MeetingNotification[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const teacherCourseIdsForHistory = useMemo(
    () => teacherCourses.map((course) => course.id),
    [teacherCourses],
  )

  useEffect(() => {
    let mounted = true

    const loadHistory = async () => {
      try {
        const courseIds = teacherCourseIdsForHistory
        if (courseIds.length === 0) {
          if (mounted) {
            setMeetings([])
          }
          return
        }

        const rows = await fetchMeetingsForCourses(courseIds)
        if (mounted) {
          setMeetings(rows)
        }
      } catch (loadError) {
        console.error('Failed to load teacher meeting history', loadError)
      }
    }

    void loadHistory()

    return () => {
      mounted = false
    }
  }, [teacherCourseIdsForHistory])

  const selectedCourseStudentCount = useMemo(() => {
    return teacherCourses.find((course) => course.id === selectedCourseId)?.studentCount ?? 0
  }, [selectedCourseId, teacherCourses])

  const handleCreateMeeting = async () => {
    if (!selectedCourseId) {
      setError('Vui lòng chọn khóa học')
      return
    }

    if (selectedCourseStudentCount === 0) {
      setError('Khóa học này hiện chưa có học viên đăng ký, không thể gửi thông báo cuộc họp.')
      return
    }

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề cuộc họp')
      return
    }

    if (!scheduledAt) {
      setError('Vui lòng chọn thời gian cuộc họp')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const normalizedMeetingUrl = meetingUrl.trim() ? ensureAbsoluteUrl(meetingUrl.trim()) : undefined

      console.log('Creating meeting with:', {
        courseId: selectedCourseId,
        title: title.trim(),
        description: description.trim(),
        scheduledAt,
        meetingUrl: normalizedMeetingUrl,
      })

      const created = await createMeetingNotification({
        courseId: selectedCourseId,
        title: title.trim(),
        description: description.trim(),
        scheduledAt,
        meetingUrl: normalizedMeetingUrl,
      })

      setSuccess(`Đã gửi thông báo cuộc họp cho ${selectedCourseStudentCount} học viên trong khóa học`)
      setTitle('')
      setDescription('')
      setScheduledAt('')
      setMeetingUrl('')

      // Keep a local optimistic row and preserve history from backend.
      setMeetings((prev) => [
        created,
        ...prev.filter((item) => item.id !== created.id),
      ])

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      console.error('Failed to create meeting notification', err)
      let errorMessage = 'Không thể gửi thông báo. Vui lòng thử lại.'
      if (err instanceof Error) {
        errorMessage = `${errorMessage} (${err.message})`
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('vi-VN')
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Sắp tới', color: '#3b82f6' },
      ongoing: { label: 'Đang diễn ra', color: '#ef4444' },
      completed: { label: 'Đã kết thúc', color: '#6b7280' },
      cancelled: { label: 'Đã hủy', color: '#f97316' },
    }
    const info = statusMap[status] || statusMap.pending
    return (
      <span style={{ color: info.color, fontSize: '0.875rem', fontWeight: 600 }}>
        {info.label}
      </span>
    )
  }

  return (
    <section className="teacher-page">
      <div className="teacher-shell">
        <header className="teacher-header">
          <div>
            <h1 className="teacher-title">Quản lý Lịch họp</h1>
            <p className="teacher-subtitle">Tạo và gửi lịch cuộc họp cho học viên</p>
          </div>
          <div className="teacher-toolbar">
            <button className="teacher-btn ghost" onClick={onBackToDashboard}>
              Về Dashboard
            </button>
          </div>
        </header>

        <section className="teacher-panel">
          {error && (
            <div style={{ padding: '12px', marginBottom: 12, color: '#dc2626', backgroundColor: '#fee2e2', borderRadius: 4 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '12px', marginBottom: 12, color: '#059669', backgroundColor: '#d1fae5', borderRadius: 4 }}>
              {success}
            </div>
          )}

          <div className="teacher-panel" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 16 }}>Tạo cuộc họp mới</h2>

            <div style={{ marginBottom: 12 }}>
              <label className="teacher-list-meta">Chọn khóa học</label>
              <select
                className="teacher-select"
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                disabled={teacherCourses.length === 0}
                style={{ width: '100%' }}
              >
                {teacherCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} ({course.studentCount} học viên)
                  </option>
                ))}
              </select>
              {selectedCourseId && (
                <p className="teacher-list-meta" style={{ marginTop: 4 }}>
                  Thông báo sẽ được gửi cho {selectedCourseStudentCount} học viên đã đăng ký
                </p>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="teacher-list-meta">Tiêu đề cuộc họp *</label>
              <input
                className="teacher-input"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="ví dụ: Q&A trực tuyến tuần 1"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="teacher-list-meta">Mô tả</label>
              <textarea
                className="teacher-input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Thêm chi tiết về nội dung cuộc họp..."
                rows={3}
                style={{ width: '100%', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="teacher-list-meta">Thời gian cuộc họp *</label>
              <input
                className="teacher-input"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="teacher-list-meta">Link cuộc họp</label>
              <input
                className="teacher-input"
                type="url"
                value={meetingUrl}
                onChange={(event) => setMeetingUrl(event.target.value)}
                placeholder="https://meet.google.com/... hoặc https://zoom.us/..."
                style={{ width: '100%' }}
              />
            </div>

            <button
              className="teacher-btn"
              onClick={handleCreateMeeting}
              disabled={!selectedCourseId || isLoading || selectedCourseStudentCount === 0}
              style={{ width: '100%' }}
            >
              {isLoading ? 'Đang gửi...' : 'Gửi thông báo cuộc họp'}
            </button>
            {selectedCourseStudentCount === 0 && (
              <p className="teacher-list-meta" style={{ marginTop: 8, color: '#b91c1c' }}>
                Khóa học này chưa có học viên đăng ký. Vui lòng thêm học viên trước khi tạo cuộc họp.
              </p>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 16 }}>Lịch sử cuộc họp</h2>
            {meetings.length === 0 && (
              <p className="teacher-empty">Chưa có cuộc họp nào được tạo.</p>
            )}
            {meetings.length > 0 && (
              <div style={{ display: 'grid', gap: 12 }}>
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      padding: 16,
                      backgroundColor: '#f9fafb',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 4px 0' }}>
                          {meeting.title}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 8px 0' }}>
                          {meeting.courseName}
                        </p>
                      </div>
                      {getStatusBadge(meeting.status)}
                    </div>
                    {meeting.description && (
                      <p style={{ fontSize: '0.875rem', margin: '0 0 8px 0' }}>
                        {meeting.description}
                      </p>
                    )}
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 8px 0' }}>
                      <strong>Thời gian:</strong> {formatDateTime(meeting.scheduledAt)}
                    </p>
                    {meeting.meetingUrl && (
                      <p style={{ fontSize: '0.875rem', margin: 0 }}>
                        <strong>Link:</strong>{' '}
                        <a
                          href={ensureAbsoluteUrl(meeting.meetingUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#3b82f6', textDecoration: 'none' }}
                        >
                          {meeting.meetingUrl}
                        </a>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

export default MeetingManage
