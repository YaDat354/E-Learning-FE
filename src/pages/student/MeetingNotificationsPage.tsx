import { useEffect, useState } from 'react'
import type { User } from '../../domain/index.ts'
import { fetchMeetingNotifications, acknowledgeMeetingNotification, type MeetingNotification } from '../../services/meetingService.ts'

type Props = {
  user: User
  onBackToDashboard: () => void
}

function MeetingNotificationsPage({ user, onBackToDashboard }: Props) {
  const [notifications, setNotifications] = useState<MeetingNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadNotifications = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await fetchMeetingNotifications(user.id ?? '')
        if (mounted) {
          setNotifications(data)
        }
      } catch (err) {
        console.error('Failed to load meeting notifications', err)
        if (mounted) {
          setError('Không thể tải thông báo cuộc họp. Vui lòng thử lại.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadNotifications()

    return () => {
      mounted = false
    }
  }, [user.id])

  const handleAcknowledge = async (notificationId: string) => {
    try {
      await acknowledgeMeetingNotification(notificationId)
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, status: 'pending' } : notif,
        ),
      )
    } catch (err) {
      console.error('Failed to acknowledge notification', err)
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

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('vi-VN')
    } catch {
      return dateStr
    }
  }

  return (
    <section className="student-page">
      <div className="student-shell">
        <header className="student-header">
          <div>
            <h1 className="student-title">Thông báo cuộc họp</h1>
            <p className="student-subtitle">
              {notifications.length} thông báo · Khóa học của bạn
            </p>
          </div>
          <div className="student-toolbar">
            <button className="student-btn ghost" onClick={onBackToDashboard}>
              Về Dashboard
            </button>
          </div>
        </header>

        <section className="student-panel">
          {error && (
            <div style={{ padding: '12px', marginBottom: 12, color: '#dc2626', backgroundColor: '#fee2e2', borderRadius: 4 }}>
              {error}
            </div>
          )}

          {isLoading && <p className="student-empty">Đang tải thông báo...</p>}
          {!isLoading && notifications.length === 0 && (
            <p className="student-empty">Chưa có thông báo cuộc họp nào.</p>
          )}

          {!isLoading && notifications.length > 0 && (
            <div style={{ display: 'grid', gap: 12 }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
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
                        {notification.title}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        {notification.courseName} · {notification.teacherName}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {getStatusBadge(notification.status)}
                      <button
                        className="student-action-btn"
                        onClick={() =>
                          setExpandedId(expandedId === notification.id ? null : notification.id)
                        }
                        type="button"
                      >
                        {expandedId === notification.id ? 'Đóng' : 'Xem'}
                      </button>
                    </div>
                  </div>

                  {expandedId === notification.id && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: '1px solid #e5e7eb',
                      }}
                    >
                      <p style={{ fontSize: '0.875rem', margin: '0 0 8px 0' }}>
                        <strong>Mô tả:</strong> {notification.description}
                      </p>
                      <p style={{ fontSize: '0.875rem', margin: '0 0 8px 0' }}>
                        <strong>Thời gian:</strong> {formatDateTime(notification.scheduledAt)}
                      </p>
                      {notification.meetingUrl && (
                        <p style={{ fontSize: '0.875rem', margin: '0 0 12px 0' }}>
                          <strong>Link cuộc họp:</strong>{' '}
                          <a
                            href={notification.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#3b82f6', textDecoration: 'none' }}
                          >
                            Tham gia cuộc họp
                          </a>
                        </p>
                      )}
                      {notification.status === 'pending' && (
                        <button
                          className="student-btn"
                          onClick={() => handleAcknowledge(notification.id)}
                          type="button"
                          style={{ marginTop: 8 }}
                        >
                          Đánh dấu đã xem
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default MeetingNotificationsPage
