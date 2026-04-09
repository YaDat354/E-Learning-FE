import type React from 'react'
import {
  Users, Map, Video, Star,
  MessageCircle, Target, Briefcase, Mic,
  ClipboardList, MessageSquare,
  CheckCircle2, Play, Lock,
  Trophy, Zap, BookOpen, BookMarked,
} from 'lucide-react'
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
  { value: '10,000+', label: 'Học viên đang học', icon: <Users size={26} /> },
  { value: '12+', label: 'Lộ trình tiếng Anh', icon: <Map size={26} /> },
  { value: '200+', label: 'Bài học video', icon: <Video size={26} /> },
  { value: '4.8★', label: 'Đánh giá trung bình', icon: <Star size={26} /> },
]

const STEPS = [
  {
    icon: <Map size={28} />,
    title: 'Chọn lộ trình phù hợp',
    desc: 'Bắt đầu với giao tiếp, phát âm, TOEIC hoặc tiếng Anh công sở tùy theo mục tiêu của bạn.',
  },
  {
    icon: <Video size={28} />,
    title: 'Xem bài giảng và luyện nói',
    desc: 'Học qua video, mẫu câu và tình huống sát với giao tiếp thực tế hằng ngày.',
  },
  {
    icon: <ClipboardList size={28} />,
    title: 'Làm quiz và nộp bài',
    desc: 'Kiểm tra từ vựng, ngữ pháp, phản xạ hội thoại ngay sau mỗi bài học.',
  },
  {
    icon: <MessageSquare size={28} />,
    title: 'Nhận góp ý từ giảng viên',
    desc: 'Đặt câu hỏi, tham gia thảo luận và được hướng dẫn để sửa lỗi nhanh hơn.',
  },
]

const COURSE_ICONS: Record<string, React.ReactNode> = {
  'Giao tiếp': <MessageCircle size={32} />,
  'Luyện thi': <Target size={32} />,
  'Công việc': <Briefcase size={32} />,
  'Phát âm': <Mic size={32} />,
}

const TESTIMONIALS = [
  {
    name: 'Nguyễn Minh Anh',
    role: 'Marketing Manager',
    avatar: 'MA',
    color: '#1066d6',
    text: 'Sau 3 tháng học, mình đã tự tin giao tiếp tiếng Anh trong các cuộc họp công việc. Nội dung thực tế và dễ áp dụng ngay!',
    rating: 5,
  },
  {
    name: 'Trần Bảo Khôi',
    role: 'Software Engineer',
    avatar: 'BK',
    color: '#7c3aed',
    text: 'Video bài giảng chất lượng cao, quiz sau mỗi bài giúp mình nhớ từ vựng hiệu quả hơn hẳn. Rất đáng đầu tư!',
    rating: 5,
  },
  {
    name: 'Lê Thu Phương',
    role: 'Sinh viên đại học',
    avatar: 'TP',
    color: '#059669',
    text: 'Giáo viên phản hồi nhanh, khu vực thảo luận sôi nổi. Mình cải thiện TOEIC từ 450 lên 700 chỉ trong 4 tháng.',
    rating: 5,
  },
]

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
          <span className="home-nav-name">EnglishLearn</span>
        </div>

        <div className="home-nav-links">
          <a href="#courses">Khóa học</a>
          <a href="#how">Cách học</a>
          <a href="#testimonials">Học viên</a>
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
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />

        <div className="hero-inner">
          {/* Left: text */}
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              {roleView.badge}
            </div>
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
                Xem khóa học →
              </button>
              <button className="btn-hero-ghost" onClick={() => onGoCourse('giao-tiep')}>
                <Play size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
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
                {['HN', 'TB', 'DK', 'LB'].map((init, index) => (
                  <span key={index} className="hero-avatar-dot">{init}</span>
                ))}
              </div>
              <span>Hơn 10,000 học viên đã đăng ký học</span>
            </div>
          </div>

          {/* Right: course UI mockup */}
          <div className="hero-visual">
            <div className="hero-mockup">
              <div className="mockup-header">
                <span className="mockup-title"><BookOpen size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Khóa học của tôi</span>
                <span className="mockup-status-dot" />
              </div>
              <div className="mockup-course">
                <div className="mockup-thumb"><MessageCircle size={22} /></div>
                <div className="mockup-info">
                  <div className="mockup-course-name">Tiếng Anh Giao Tiếp</div>
                  <div className="mockup-progress-bar">
                    <div className="mockup-progress-fill" style={{ width: '68%' }} />
                  </div>
                  <div className="mockup-meta">68% hoàn thành · Bài 14/20</div>
                </div>
              </div>
              <div className="mockup-divider" />
              <div className="mockup-lessons">
                {[
                  { icon: <CheckCircle2 size={15} />, label: 'Phát âm chuẩn', state: 'done' },
                  { icon: <Play size={15} />, label: 'Hội thoại hằng ngày', state: 'active' },
                  { icon: <Lock size={15} />, label: 'Thuyết trình chuyên nghiệp', state: 'locked' },
                ].map((lesson) => (
                  <div key={lesson.label} className={`mockup-lesson ${lesson.state}`}>
                    <span className="mockup-lesson-icon">{lesson.icon}</span>
                    <span>{lesson.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-float-badge hero-float-1">
              <Trophy size={20} />
              <div>
                <div className="float-title">Streak 7 ngày</div>
                <div className="float-sub">Duy trì học tốt!</div>
              </div>
            </div>
            <div className="hero-float-badge hero-float-2">
              <Zap size={20} />
              <div>
                <div className="float-title">Quiz 92/100</div>
                <div className="float-sub">Kết quả xuất sắc</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-bar">
        {STATS.map((stat) => (
          <div key={stat.label} className="stat-item">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Courses ── */}
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
              icon={COURSE_ICONS[course.category] ?? <BookMarked size={32} />}
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
        <div className="steps-wrapper">
          <div className="steps-track">
            {STEPS.map((_, index) => (
              <div key={index} className="steps-track-item">
                <div className="steps-track-dot">{index + 1}</div>
                {index < STEPS.length - 1 && <div className="steps-track-line" />}
              </div>
            ))}
          </div>
          <div className="steps-grid">
            {STEPS.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-icon">{step.icon}</div>
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="testimonials-section">
        <SectionHeader
          title="Học viên nói gì về chúng tôi"
          subtitle="Hơn 10,000 học viên đã cải thiện tiếng Anh với nền tảng của chúng tôi"
        />
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="testimonial-card">
              <div className="testimonial-stars">{'★'.repeat(t.rating)}</div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: t.color }}>{t.avatar}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-banner">
        <div className="cta-deco cta-deco-1" />
        <div className="cta-deco cta-deco-2" />
        <div className="cta-inner">
          <div className="cta-badge">Bắt đầu ngay hôm nay</div>
          <h2>Học tiếng Anh không còn nhàm chán</h2>
          <p>Chọn lộ trình phù hợp, học thử bài miễn phí và tương tác với giảng viên ngay trong buổi demo</p>
          <div className="cta-actions">
            <button className="btn-hero-primary" onClick={onGoAuth}>
              Tạo tài khoản miễn phí →
            </button>
            <button
              className="btn-hero-ghost"
              onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Xem khóa học
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="home-nav-logo">EL</div>
            <div className="footer-brand-text">
              <span className="footer-brand-name">EnglishLearn</span>
              <p className="footer-brand-desc">Nền tảng học tiếng Anh tương tác với video, quiz và thảo luận thực chiến.</p>
            </div>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <div className="footer-col-title">Khóa học</div>
              <a href="#courses">Giao tiếp cơ bản</a>
              <a href="#courses">Luyện thi TOEIC</a>
              <a href="#courses">Tiếng Anh công việc</a>
              <a href="#courses">Phát âm chuẩn</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Nền tảng</div>
              <a href="#how">Cách học</a>
              <a href="#testimonials">Đánh giá</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onGoAuth() }}>Đăng nhập</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onGoAuth() }}>Đăng ký</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 EnglishLearn — Nền tảng học tiếng Anh trực tuyến</span>
          <span>Demo học tập tương tác</span>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
