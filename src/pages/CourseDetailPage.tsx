import { COURSES, ROLE_LABELS } from '../data/mockData.ts'
import type { User } from '../data/mockData.ts'
import StarRating from '../components/ui/StarRating.tsx'
import '../styles/course.css'

type Props = {
  courseId: string
  user: User | null
  onGoAuth: () => void
  onBack: () => void
  onGoToLesson: (courseId: string, lessonId: string) => void
}

const WHAT_YOU_LEARN: Record<string, string[]> = {
  'giao-tiep': [
    'Sử dụng mẫu câu chào hỏi và giới thiệu bản thân tự nhiên',
    'Hỏi và trả lời thông tin cá nhân trong hội thoại ngắn',
    'Cải thiện phát âm và ngữ điệu khi giao tiếp cơ bản',
    'Tăng phản xạ nghe nói qua tình huống thực tế hằng ngày',
    'Tự tin mở đầu và duy trì một cuộc trò chuyện đơn giản',
    'Ghi nhớ từ vựng thông dụng theo chủ đề đời sống',
  ],
  'toeic': [
    'Nắm chiến thuật làm TOEIC Listening theo từng Part phổ biến',
    'Luyện phản xạ nghe ý chính và nhận diện bẫy từ gần âm',
    'Củng cố ngữ pháp và từ loại cho TOEIC Reading Part 5',
    'Tăng tốc độ đọc hiểu với kỹ thuật quét thông tin quan trọng',
    'Quản lý thời gian làm bài để đạt mục tiêu 650+',
    'Tự kiểm tra lỗi sai thường gặp và tối ưu điểm số TOEIC',
  ],
  'thuong-mai': [
    'Viết email công việc rõ ràng, lịch sự và đúng mục đích',
    'Giao tiếp tự tin trong họp trực tuyến và với khách hàng',
    'Sử dụng cụm từ chuyên nghiệp trong môi trường công sở',
    'Trình bày ý kiến và phản hồi một cách khôn khéo',
    'Xử lý tình huống công việc bằng tiếng Anh thực tế hơn',
    'Tăng độ tự tin khi thuyết trình và báo cáo ngắn',
  ],
  'phat-am': [
    'Phân biệt các cặp âm dễ nhầm lẫn trong tiếng Anh',
    'Luyện trọng âm từ và ngữ điệu câu rõ ràng hơn',
    'Sửa lỗi phát âm phổ biến của người Việt',
    'Nối âm, nuốt âm và liên âm tự nhiên hơn khi nói',
    'Nghe và nhại âm theo câu mẫu ngắn',
    'Tăng độ dễ nghe hiểu khi giao tiếp trực tiếp',
  ],
}

function CourseDetailPage({ courseId, user, onGoAuth, onBack, onGoToLesson }: Props) {
  const course = COURSES.find(c => c.id === courseId)
  if (!course) return null

  const discount = Math.round((1 - course.price / course.originalPrice) * 100)
  const learningItems = WHAT_YOU_LEARN[course.id] ?? WHAT_YOU_LEARN['giao-tiep']
  const actionText = user?.role === 'teacher'
    ? 'Xem dưới góc nhìn giảng viên'
    : user?.role === 'admin'
      ? 'Kiểm tra nội dung khóa học'
      : user
        ? 'Bắt đầu học'
        : 'Học thử bài miễn phí'

  const handleEnroll = () => {
    const previewLesson = course.lessons.find((lesson) => lesson.isFree) ?? course.lessons[0]
    if (!previewLesson) return

    if (!user && !previewLesson.isFree) {
      onGoAuth()
      return
    }

    onGoToLesson(course.id, previewLesson.id)
  }

  return (
    <div className="course-detail-page">
      {/* ── Nav ── */}
      <nav className="page-nav">
        <div className="page-nav-left">
          <button className="btn-back" onClick={onBack}>Về trang chủ</button>
          <div className="page-nav-breadcrumb">
            Khóa học / <span>{course.title}</span>
          </div>
        </div>
        {user ? (
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>
            Xin chào, <strong style={{ color: 'var(--text)' }}>{user.name}</strong> · {ROLE_LABELS[user.role]}
          </div>
        ) : (
          <button
            onClick={onGoAuth}
            style={{
              background: 'var(--brand)', color: '#fff', border: 'none',
              borderRadius: 10, padding: '8px 18px', fontWeight: 600,
              cursor: 'pointer', fontSize: 14,
            }}
          >
            Đăng nhập
          </button>
        )}
      </nav>

      {/* ── Course hero ── */}
      <div className="course-hero">
        <div className="course-hero-inner">
          <div>
            <div className="course-hero-badges">
              <span
                className="hero-badge-pill"
                style={{ background: `${course.categoryColor}28`, color: course.categoryColor }}
              >
                {course.category}
              </span>
              <span className="hero-badge-pill">{course.level}</span>
            </div>

            <h1>{course.title}</h1>
            <p className="course-hero-desc">{course.description}</p>

            <div className="course-hero-meta">
              <div className="hero-rating">
                <strong style={{ color: '#fbbf24' }}>{course.rating}</strong>
                <StarRating rating={course.rating} className="hero-stars" />
                <span>({course.reviewCount.toLocaleString()} đánh giá)</span>
              </div>
              <span>Học viên: {course.studentCount.toLocaleString()}</span>
              <span>Thời lượng: {course.duration}</span>
              <div className="course-hero-instructor">
                <div className="instructor-av" style={{ background: course.categoryColor }}>
                  {course.instructorAvatar}
                </div>
                <span>{course.instructor}</span>
              </div>
            </div>
          </div>

          {/* Enroll card */}
          <div className="enroll-card">
            <div className="enroll-price-row">
              <span className="enroll-price">{course.price.toLocaleString('vi-VN')}đ</span>
              <span className="enroll-price-orig">{course.originalPrice.toLocaleString('vi-VN')}đ</span>
              <span className="enroll-discount">-{discount}%</span>
            </div>
            <button className="btn-enroll" onClick={handleEnroll}>
              {actionText}
            </button>
            <ul className="enroll-includes">
              <li>{course.duration} video bai giang</li>
              <li>{course.lessons.length} bài học theo lộ trình</li>
              <li>Quiz và bài tập thực hành sau bài học</li>
              <li>Chứng nhận hoàn thành khóa học</li>
              <li>Học lại không giới hạn</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="course-content-wrap">
        <div className="course-content-main">
          {/* What you'll learn */}
          <div className="content-section">
            <h3>Bạn sẽ học được gì</h3>
            <div className="learning-grid">
              {learningItems.map((item, i) => (
                <div key={i} className="learning-item">{item}</div>
              ))}
            </div>
          </div>

          {/* Lessons list */}
          <div className="content-section">
            <h3>Nội dung khóa học</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
              {course.lessons.length} bài học · {course.duration} tổng thời lượng
            </p>
            <ul className="lessons-list">
              {course.lessons.map((lesson, i) => (
                <li
                  key={lesson.id}
                  className="lesson-item"
                  onClick={() => {
                    if (lesson.isFree || user) {
                      onGoToLesson(course.id, lesson.id)
                    } else {
                      onGoAuth()
                    }
                  }}
                >
                  <div className="lesson-item-icon">
                    {lesson.isFree ? 'Play' : 'Video'}
                  </div>
                  <div className="lesson-item-info">
                    <div className="lesson-item-title">{i + 1}. {lesson.title}</div>
                    <div className="lesson-item-meta">
                      Thời gian: {lesson.duration}
                      {lesson.quiz ? ' · Có quiz' : ''}
                    </div>
                  </div>
                  <div className="lesson-item-right">
                    {lesson.isFree && <span className="free-badge">Học thử</span>}
                    {!lesson.isFree && !user && <span className="lock-icon">Khóa</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'grid', gap: 16, alignSelf: 'start' }}>
          <div className="content-section">
            <h3>Giảng viên</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: course.categoryColor, color: '#fff',
                  fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center',
                }}
              >
                {course.instructorAvatar}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{course.instructor}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Giảng viên chuyên môn {course.category.toLowerCase()}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
              Nhiều năm giảng dạy và đồng hành cùng hàng nghìn học viên trong lộ trình học tiếng Anh có mục tiêu rõ ràng.
            </p>
          </div>

          {user && (
            <div className="content-section">
              <h3>Chế độ hiện tại</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                {user.role === 'teacher'
                  ? 'Bạn đang xem khóa học với vai trò giảng viên. Hãy mở bài học để kiểm tra phần bài tập và phản hồi trong thảo luận.'
                  : user.role === 'admin'
                    ? 'Bạn đang xem khóa học với vai trò quản trị viên. Có thể dùng trang này để rà soát nội dung, điều hướng và trải nghiệm role.'
                    : 'Bạn đang xem khóa học với vai trò học viên. Có thể mở từng bài học, làm quiz và nộp bài thực hành.'}
              </p>
            </div>
          )}

          <div className="content-section">
            <h3>Chủ đề</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {course.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: 12, fontWeight: 600, padding: '4px 10px',
                    background: '#f0f6ff', border: '1px solid #b3d0ff',
                    borderRadius: 8, color: 'var(--brand)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetailPage
