import { useState } from 'react'
import type { UserRole } from '../../domain/index.ts'
import { submitAssignment } from '../../services/enrollmentService.ts'

type AssignmentPanelProps = {
  lessonTitle: string
  lessonId: string
  courseId?: string
  assignmentId?: string
  userRole: UserRole | null
}

function AssignmentPanel({ lessonTitle, lessonId, courseId, assignmentId, userRole }: AssignmentPanelProps) {
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [savedMode, setSavedMode] = useState<'server' | 'local'>('server')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (userRole === 'teacher' || userRole === 'admin') {
    return (
      <div className="assignment-review-box">
        <h3>{userRole === 'teacher' ? 'Bài tập chờ phản hồi' : 'Tình trạng bài nộp'}</h3>
        <div className="assignment-review-item">
          <strong>Nguyễn An</strong>
          <span>Đã nộp đoạn hội thoại cho bài {lessonTitle}</span>
        </div>
        <div className="assignment-review-item">
          <strong>Trần Vy</strong>
          <span>Cần góp ý về cách dùng câu hỏi mở rộng trong phần trả lời</span>
        </div>
        <div className="assignment-review-note">
          {userRole === 'teacher'
            ? 'Chế độ giảng viên ưu tiên hiển thị bài nộp để bạn phản hồi nhanh ngay trong buổi demo.'
            : 'Chế độ quản trị viên hiển thị trạng thái bài nộp để bạn kiểm tra luồng học tập và trải nghiệm đánh giá.'}
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (text.trim().length < 10 || isLoading) return

    setIsLoading(true)
    setError('')
    setSavedMode('server')

    try {
      const result = await submitAssignment(lessonId, { content: text, assignmentId, courseId })
      setSavedMode(result.saved)
      setSubmitted(true)
      setText('')
    } catch (err) {
      console.error('Assignment submission failed:', err)
      const anyErr = err as any
      const statusCode = anyErr?.response?.status
      const serverMessage = anyErr?.response?.data?.message || anyErr?.response?.data || anyErr?.response?.statusText
      setError(
        statusCode === 401
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi nộp bài.'
          : statusCode === 403
          ? 'Bạn chưa có quyền nộp bài ở bài học này. Vui lòng kiểm tra quyền ghi danh khóa học.'
          : typeof serverMessage === 'string' && serverMessage.length > 0
          ? `Lỗi server: ${serverMessage}`
          : anyErr instanceof Error
          ? anyErr.message
          : 'Gửi bài tập thất bại. Vui lòng thử lại.'
      )
      setSubmitted(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="assignment-submitted">
        <div style={{ fontSize: 40, marginBottom: 10 }}>{savedMode === 'server' ? 'Đã nộp' : 'Tạm lưu'}</div>
        <h4>{savedMode === 'server' ? 'Bài tập đã được gửi' : 'Bài nộp chưa gửi lên server'}</h4>
        {savedMode === 'server' ? (
          <p style={{ fontSize: 14, marginTop: 6 }}>
            Giảng viên sẽ xem bài và phản hồi trong vòng 24 đến 48 giờ.
          </p>
        ) : (
          <p style={{ fontSize: 14, marginTop: 6, color: '#b45309' }}>
            Bài nộp mới được lưu tạm trên thiết bị. Giảng viên chưa thể nhìn thấy hoặc chấm điểm cho đến khi gửi thành công lên server.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="assignment-section">
      <h3>Bài nộp</h3>
      <p>
        Viết một đoạn hội thoại ngắn hoặc đoạn trả lời áp dụng kiến thức trong bài <strong>{lessonTitle}</strong>.
        Bạn có thể giải thích cách dùng từ vựng, cấu trúc câu hoặc tình huống bạn sẽ sử dụng nội dung này.
      </p>
      <textarea
        className="assignment-textarea"
        placeholder="Nhập bài làm, đoạn hội thoại hoặc ghi chú luyện tập của bạn tại đây..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
      />
      {error && (
        <div style={{ color: '#dc2626', fontSize: 14, marginTop: 8, marginBottom: 8 }}>
          {error}
        </div>
      )}
      <button
        className="btn-submit-assignment"
        disabled={text.trim().length < 10 || isLoading}
        onClick={handleSubmit}
        type="button"
      >
        {isLoading ? 'Đang gửi...' : 'Nộp bài tập'}
      </button>
    </div>
  )
}

export default AssignmentPanel