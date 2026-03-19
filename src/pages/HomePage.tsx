import { COURSES, ROLE_LABELS } from '../data/mockData.ts'
import type { User } from '../data/mockData.ts'
import CourseCard from '../components/ui/CourseCard.tsx'
import SectionHeader from '../components/ui/SectionHeader.tsx'
import '../styles/home.css'

type HomePageProps = {
  user: User | null
  onGoAuth: () => void
  onGoCourse: (courseId: string) => void
  onLogout: () => void
}

const STATS = [
  { value: '10,000+', label: 'Học viên đang học' },
  { value: '12+', label: 'Lộ trình tiếng Anh' },
  { value: '200+', label: 'Bài học video' },
  { value: '4.8★', label: 'Đánh giá trung bình' },
]

const STEPS = [
  {
    icon: '01',
    title: 'Chọn lộ trình phù hợp',
    desc: 'Bắt đầu với giao tiếp, phát âm, TOEIC hoặc tiếng Anh công sở tùy theo mục tiêu của bạn.',
  },
  {
    icon: '02',
    title: 'Xem bài giảng và luyện nói',
    desc: 'Học qua video, mẫu câu và tình huống sát với giao tiếp thực tế hằng ngày.',
  },
  {
    icon: '03',
    title: 'Làm quiz và nộp bài',
    desc: 'Kiểm tra từ vựng, ngữ pháp, phản xạ hội thoại ngay sau mỗi bài học.',
  },
  {
    icon: '04',
    title: 'Nhận góp ý từ giảng viên',
    desc: 'Đặt câu hỏi, tham gia thảo luận và được hướng dẫn để sửa lỗi nhanh hơn.',
  },
]

const COURSE_ICONS: Record<string, string> = {
  'Giao tiếp': '🗣️',
  'Luyện thi': '🎯',
  'Công việc': '💼',
  'Phát âm': '🎙️',
}

const ROLE_EXPERIENCE = {
  guest: {
    badge: 'Nền tảng học tiếng Anh tương tác',
    title: 'Học tiếng Anh bài bản',
    accent: 'với video, quiz và thảo luận thực chiến',
    subtitle:
      'Từ giao tiếp cơ bản đến TOEIC và tiếng Anh công việc, bạn có thể học thử, xem video, làm quiz, nộp bài và trao đổi với giảng viên ngay trên một màn hình.',
    action: 'Vào bài học mẫu',
  },
  student: {
    badge: 'Chế độ học viên',
    title: 'Tiếp tục lộ trình học của bạn',
    accent: 'và luyện đủ 4 bước: xem, làm, nộp, hỏi',
    subtitle:
      'Bạn sẽ thấy bài học, quiz, bài tập thực hành và khu vực thảo luận để luyện tiếng Anh theo từng tình huống cụ thể.',
    action: 'Vào học ngay',
  },
  teacher: {
    badge: 'Chế độ giảng viên',
    title: 'Theo dõi tiến độ lớp học',
    accent: 'và phản hồi học viên ngay trong bài giảng',
    subtitle:
      'Giảng viên sẽ nhìn thấy bài học dưới góc nhìn hướng dẫn, có thể kiểm tra bài nộp mẫu và tham gia phản hồi trong phần thảo luận.',
    action: 'Xem lớp học',
  },
  admin: {
    badge: 'Chế độ quản trị viên',
    title: 'Kiểm tra chất lượng khóa học',
    accent: 'với điều hướng rõ ràng và nội dung đúng chủ đề',
    subtitle:
      'Quản trị viên có thể rà soát nội dung bài học, trải nghiệm luồng người dùng và kiểm tra nhanh các khóa học tiếng Anh trong hệ thống.',
    action: 'Kiểm tra khóa học',
  },
} as const

const ROLE_HIGHLIGHTS = {
  student: ['Mở bài học tiếp theo', 'Làm quiz cuối bài', 'Nộp bài nói hoặc viết'],
  teacher: ['Xem danh sách bài học như lớp học thật', 'Gửi phản hồi trong thảo luận', 'Theo dõi bài tập học viên'],
  admin: ['Rà soát nội dung và điều hướng', 'Kiểm tra role hiển thị', 'Đánh giá chất lượng demo'],
} as const

function HomePage({ user, onGoAuth, onGoCourse, onLogout }: HomePageProps) {
  const roleView = user ? ROLE_EXPERIENCE[user.role] : ROLE_EXPERIENCE.guest

  return (
    <div>
      {/* ── Navbar ── */}
      <nav className="home-nav">
        <div className="home-nav-brand">
          <div className="home-nav-logo">EL</div>
          <span className="home-nav-name">Trung tâm học tiếng Anh trực tuyến</span>
        </div>

        <div className="home-nav-links">
          <a href="#courses">Khóa học</a>
          <a href="#how">Cách học</a>
          <a href="#courses">Giảng viên</a>
        </div>

        <div className="home-nav-actions">
          {user ? (
            <>
              <div className="nav-user-badge">
                <div className="nav-user-avatar">{user.name.slice(0, 2).toUpperCase()}</div>
                <span className="nav-user-name">{user.name} · {ROLE_LABELS[user.role]}</span>
              </div>
              <button className="btn-logout" onClick={onLogout}>Đăng xuất</button>
            </>
          ) : (
            <>
              <button className="btn-nav-login" onClick={onGoAuth}>Đăng nhập</button>
              <button className="btn-nav-cta" onClick={onGoCourse.bind(null, 'giao-tiep')}>Học thử miễn phí</button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-badge">{roleView.badge}</div>
          <h1 className="hero-title">
            {roleView.title}<br />
            <span className="hero-title-accent">{roleView.accent}</span>
          </h1>
          <p className="hero-subtitle">{roleView.subtitle}</p>
          <div className="hero-actions">
            <button
              className="btn-hero-primary"
              onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Xem khóa học
            </button>
            <button
              className="btn-hero-ghost"
              onClick={() => onGoCourse('giao-tiep')}
            >
              {roleView.action}
            </button>
          </div>
          {user && (
            <div className="role-panel">
              <div className="role-panel-title">Bạn đang đăng nhập với vai trò {ROLE_LABELS[user.role]}</div>
              <div className="role-panel-list">
                {ROLE_HIGHLIGHTS[user.role].map((item) => (
                  <span key={item} className="role-panel-chip">{item}</span>
                ))}
              </div>
            </div>
          )}
          <div className="hero-social-proof">
            <div className="hero-avatars">
              {['HN', 'TB', 'DK', 'LB'].map((init, i) => (
                <span key={i} className="hero-avatar-dot">{init}</span>
              ))}
            </div>
            <span>Hơn 10,000 học viên đã đăng ký học</span>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-bar">
        {STATS.map(s => (
          <div key={s.label} className="stat-item">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Featured Courses ── */}
      <section id="courses" className="courses-section">
        <SectionHeader
          title="Khóa học nổi bật"
          subtitle="Lộ trình học tiếng Anh được thiết kế rõ ràng theo mục tiêu và trình độ"
        />

        <div className="courses-grid">
          {COURSES.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              icon={COURSE_ICONS[course.category] ?? 'Book'}
              onOpen={onGoCourse}
            />
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="how-section">
        <SectionHeader
          title="Cách trải nghiệm demo"
          subtitle="Dùng luồng học tương tác để demo ngay cả khi chưa đăng nhập"
        />
        <div className="steps-grid">
          {STEPS.map((step, i) => (
            <div key={i} className="step-card">
              <span className="step-number">{i + 1}</span>
              <div className="step-icon">{step.icon}</div>
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="cta-banner">
        <h2>Bắt đầu học tiếng Anh ngay hôm nay</h2>
        <p>Chọn lộ trình phù hợp, học thử bài miễn phí và tương tác với giảng viên ngay trong buổi demo</p>
        <button className="btn-hero-primary" onClick={onGoAuth}>
          Tạo tài khoản miễn phí
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <span>© 2026 Nền tảng học tiếng Anh trực tuyến</span>
        <span>Demo học tập tương tác cho khóa học tiếng Anh</span>
      </footer>
    </div>
  )
}

export default HomePage
