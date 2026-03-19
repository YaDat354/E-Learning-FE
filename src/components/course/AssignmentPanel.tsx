import { useState } from 'react'
import type { UserRole } from '../../data/mockData.ts'

type AssignmentPanelProps = {
  lessonTitle: string
  userRole: UserRole | null
}

function AssignmentPanel({ lessonTitle, userRole }: AssignmentPanelProps) {
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

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

  if (submitted) {
    return (
      <div className="assignment-submitted">
        <div style={{ fontSize: 40, marginBottom: 10 }}>Đã nộp</div>
        <h4>Bài tập đã được gửi</h4>
        <p style={{ fontSize: 14, marginTop: 6 }}>
          Giảng viên sẽ xem bài và phản hồi trong vòng 24 đến 48 giờ.
        </p>
      </div>
    )
  }

  return (
    <div className="assignment-section">
      <h3>Bài tập thực hành</h3>
      <p>
        Viết một đoạn hội thoại ngắn hoặc đoạn trả lời áp dụng kiến thức trong bài <strong>{lessonTitle}</strong>.
        Bạn có thể giải thích cách dùng từ vựng, cấu trúc câu hoặc tình huống bạn sẽ sử dụng nội dung này.
      </p>
      <textarea
        className="assignment-textarea"
        placeholder="Nhập bài làm, đoạn hội thoại hoặc ghi chú luyện tập của bạn tại đây..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="btn-submit-assignment"
        disabled={text.trim().length < 10}
        onClick={() => setSubmitted(true)}
        type="button"
      >
        Nộp bài tập
      </button>
    </div>
  )
}

export default AssignmentPanel
