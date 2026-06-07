import axios from 'axios'
import { useEffect, useState } from 'react'
import { ROLE_LABELS } from '../domain/index.ts'
import type { Course, User } from '../domain/index.ts'
import {
  createCourseReview,
  fetchCourseDetail,
  fetchCourseReviews,
  fetchCourseReviewSummary,
  type CourseReviewItem,
  type CourseReviewSummary,
} from '../services/courseService.ts'
import StarRating from '../components/ui/StarRating.tsx'
import '../styles/course.css'

type Props = {
  courseId: string
  user: User | null
  isEnrolled?: boolean
  onEnrollCourse?: (courseId: string) => Promise<boolean>
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

function CourseDetailPage({ courseId, user, isEnrolled = false, onEnrollCourse, onGoAuth, onBack, onGoToLesson }: Props) {
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReviewLoading, setIsReviewLoading] = useState(true)
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false)
  const [reviews, setReviews] = useState<CourseReviewItem[]>([])
  const [reviewSummary, setReviewSummary] = useState<CourseReviewSummary | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')

  useEffect(() => {
    let mounted = true

    const loadCourse = async () => {
      setIsLoading(true)
      setError('')

      try {
        const next = await fetchCourseDetail(courseId)
        if (mounted) {
          setCourse(next)
        }
      } catch (loadError) {
        console.error('load course detail failed', loadError)
        if (mounted) {
          setError('Không thể tải chi tiết khóa học từ backend.')
          setCourse(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadCourse()

    return () => {
      mounted = false
    }
  }, [courseId])

  useEffect(() => {
    let mounted = true

    const loadCourseReviewsData = async () => {
      setIsReviewLoading(true)
      setReviewMessage('')

      const [listResult, summaryResult] = await Promise.allSettled([
        fetchCourseReviews(courseId, { page: 1, limit: 12 }),
        fetchCourseReviewSummary(courseId),
      ])

      if (!mounted) {
        return
      }

      if (listResult.status === 'fulfilled') {
        setReviews(listResult.value.items)
        setReviewSummary(listResult.value.summary)
      } else {
        console.error('load course reviews failed', listResult.reason)
        setReviews([])
        setReviewSummary(null)
      }

      if (summaryResult.status === 'fulfilled') {
        setReviewSummary(summaryResult.value)
      } else {
        console.error('load course review summary failed', summaryResult.reason)
      }

      setIsReviewLoading(false)
    }

    void loadCourseReviewsData()

    setReviewRating(5)
    setReviewComment('')
    setReviewMessage('')

    return () => {
      mounted = false
    }
  }, [courseId])

  if (isLoading) {
    return <div style={{ padding: 24 }}>Đang tải chi tiết khóa học...</div>
  }

  if (!course) {
    return <div style={{ padding: 24 }}>{error || 'Không tìm thấy khóa học.'}</div>
  }

  const hasPricing = course.price > 0 && course.originalPrice > 0
  const discount = hasPricing ? Math.round((1 - course.price / course.originalPrice) * 100) : 0
  const learningItems = WHAT_YOU_LEARN[course.id] ?? WHAT_YOU_LEARN['giao-tiep']
  const reviewCount = reviewSummary?.totalReviews ?? (reviews.length > 0 ? reviews.length : course.reviewCount)
  const reviewAverage = reviewSummary
    ? reviewSummary.averageRating
    : reviews.length === 0
      ? course.rating
      : Math.round((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length) * 10) / 10
  const actionText = user?.role === 'teacher'
    ? 'Xem dưới góc nhìn giảng viên'
    : user?.role === 'admin'
      ? 'Kiểm tra nội dung khóa học'
      : user?.role === 'student'
        ? isEnrolled
          ? 'Bắt đầu học'
          : hasPricing
            ? 'Mua khóa học'
            : 'Đăng ký học ngay'
        : user
          ? 'Bắt đầu học'
        : 'Học thử bài miễn phí'

  const handleEnroll = async () => {
    const previewLesson = course.lessons.find((lesson) => lesson.isFree) ?? course.lessons[0]
    if (!previewLesson) return

    if (!user && !previewLesson.isFree) {
      onGoAuth()
      return
    }

    if (user?.role === 'student' && !isEnrolled) {
      if (!onEnrollCourse) {
        return
      }

      try {
        setIsSubmitting(true)
        const enrolled = await onEnrollCourse(course.id)
        if (!enrolled) {
          return
        }
      } finally {
        setIsSubmitting(false)
      }
    }

    onGoToLesson(course.id, previewLesson.id)
  }

  const handleReviewSubmit = async () => {
    if (!user) {
      setReviewMessage('Vui lòng đăng nhập để gửi đánh giá khóa học.')
      return
    }

    if (user.role !== 'student') {
      setReviewMessage('Chỉ học viên mới có thể gửi đánh giá cho khóa học.')
      return
    }

    if (!isEnrolled) {
      setReviewMessage('Bạn cần đăng ký khóa học trước khi gửi đánh giá.')
      return
    }

    if (reviewComment.trim().length === 0) {
      setReviewMessage('Hãy viết một vài nhận xét ngắn trước khi gửi đánh giá.')
      return
    }

    if (reviewComment.trim().length > 1000) {
      setReviewMessage('Nhận xét tối đa 1000 ký tự.')
      return
    }

    try {
      setIsReviewSubmitting(true)
      setReviewMessage('')

      await createCourseReview(course.id, {
        rating: reviewRating,
        comment: reviewComment,
      })

      const [list, summary] = await Promise.all([
        fetchCourseReviews(course.id, { page: 1, limit: 12 }),
        fetchCourseReviewSummary(course.id),
      ])

      setReviews(list.items)
      setReviewSummary(summary)
      setReviewRating(5)
      setReviewComment('')
      setReviewMessage('Đánh giá đã được gửi thành công.')
    } catch (submitError) {
      console.error('submit course review failed', submitError)

      if (axios.isAxiosError(submitError)) {
        const status = submitError.response?.status
        if (status === 401) {
          setReviewMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
          return
        }

        if (status === 403) {
          setReviewMessage('Bạn cần đăng ký khóa học trước khi gửi đánh giá.')
          return
        }

        if (status === 400) {
          setReviewMessage('Dữ liệu đánh giá chưa hợp lệ. Vui lòng kiểm tra lại nội dung.')
          return
        }
      }

      setReviewMessage('Không thể gửi đánh giá lúc này. Vui lòng thử lại sau.')
    } finally {
      setIsReviewSubmitting(false)
    }
  }

  return (
    <div className="course-detail-page">
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
                <strong style={{ color: '#fbbf24' }}>{reviewAverage.toFixed(1)}</strong>
                <StarRating rating={reviewAverage} className="hero-stars" />
                <span>({reviewCount.toLocaleString()} đánh giá)</span>
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

          <div className="enroll-card">
            <div className="enroll-price-row">
              <span className="enroll-price">
                {hasPricing ? `${course.price.toLocaleString('vi-VN')}đ` : 'Đang cập nhật'}
              </span>
              <span className="enroll-price-orig">
                {hasPricing ? `${course.originalPrice.toLocaleString('vi-VN')}đ` : ''}
              </span>
              {hasPricing && <span className="enroll-discount">-{discount}%</span>}
            </div>
            {isEnrolled && (
              <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                Trạng thái: Đã mua
              </div>
            )}
            {!isEnrolled && hasPricing && (
              <div style={{ marginBottom: 10, fontSize: 13, color: 'var(--muted)' }}>
                Trạng thái: Chưa mua, sẽ chuyển sang VNPAY khi bấm đăng ký.
              </div>
            )}
            <button className="btn-enroll" onClick={() => void handleEnroll()} disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : actionText}
            </button>
            {hasPricing && <p style={{ fontSize: 12, color: 'var(--muted)', margin: '10px 0 0' }}>Thanh toán qua VNPAY sau khi bấm đăng ký.</p>}
            <ul className="enroll-includes">
              <li>{course.duration} video bài giảng</li>
              <li>{course.lessons.length} bài học theo lộ trình</li>
              <li>Quiz và bài tập thực hành sau bài học</li>
              <li>Chứng nhận hoàn thành khóa học</li>
              <li>Học lại không giới hạn</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="course-content-wrap">
        <div className="course-content-main">
          <div className="content-section">
            <h3>Bạn sẽ học được gì</h3>
            <div className="learning-grid">
              {learningItems.map((item, i) => (
                <div key={i} className="learning-item">{item}</div>
              ))}
            </div>
          </div>

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

          <div className="content-section course-review-panel">
            <div className="course-review-header">
              <div>
                <h3>Đánh giá khóa học</h3>
                <p className="course-review-subtitle">Đánh giá được đồng bộ trực tiếp với hệ thống.</p>
              </div>
              <div className="course-review-summary">
                <strong>{reviewAverage.toFixed(1)}</strong>
                <StarRating rating={reviewAverage} className="hero-stars course-review-stars" />
                <span>{reviewCount} đánh giá</span>
              </div>
            </div>

            <div className="course-review-form">
              <div className="course-review-field">
                <label>Chấm điểm nhanh</label>
                <div className="course-review-rating-picker" role="radiogroup" aria-label="Chọn số sao đánh giá">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`course-review-star ${reviewRating >= star ? 'active' : ''}`}
                      onClick={() => setReviewRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="course-review-field">
                <label htmlFor={`course-review-${course.id}`}>Nhận xét</label>
                <textarea
                  id={`course-review-${course.id}`}
                  className="course-review-textarea"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Ví dụ: Nội dung rõ ràng, bài học dễ theo dõi, quiz giúp nhớ lâu hơn..."
                  rows={4}
                />
              </div>

              <div className="course-review-actions">
                <button className="btn-enroll" type="button" onClick={() => void handleReviewSubmit()} disabled={isReviewSubmitting}>
                  {isReviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
                {reviewMessage && <p className="course-review-note">{reviewMessage}</p>}
              </div>
            </div>

            <div className="course-review-list">
              {isReviewLoading ? (
                <div className="course-review-empty">Đang tải đánh giá...</div>
              ) : reviews.length === 0 ? (
                <div className="course-review-empty">Chưa có đánh giá nào cho khóa học này.</div>
              ) : (
                reviews.map((item) => (
                  <article className="course-review-item" key={item.id}>
                    <div className="course-review-item-head">
                      <strong>{item.studentName || 'Học viên'}</strong>
                      <span>{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(item.createdAt))}</span>
                    </div>
                    <StarRating rating={item.rating} className="course-review-stars" />
                    <p>{item.comment}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetailPage
