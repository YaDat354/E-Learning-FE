import type { ReactNode } from 'react'
import type { Course } from '../../domain/index.ts'
import StarRating from './StarRating.tsx'

type CourseCardProps = {
  course: Course
  icon: ReactNode
  onOpen: (courseId: string) => void
}

function CourseCard({ course, icon, onOpen }: CourseCardProps) {
  const hasPricing = course.price > 0 && course.originalPrice > 0

  return (
    <div className="course-card" onClick={() => onOpen(course.id)}>
      <div
        className="course-card-thumb"
        style={{
          background: `linear-gradient(135deg, ${course.categoryColor}1a, ${course.categoryColor}33)`,
        }}
      >
        {icon}
      </div>

      <div className="course-card-body">
        <span
          className="course-card-category"
          style={{ color: course.categoryColor, background: `${course.categoryColor}18` }}
        >
          {course.category}
        </span>
        <div className="course-card-title">{course.title}</div>
        <div className="course-card-instructor">
          <div className="instructor-avatar-sm" style={{ background: course.categoryColor }}>
            {course.instructorAvatar}
          </div>
          {course.instructor}
        </div>
        <div className="course-card-rating">
          <StarRating rating={course.rating} className="stars" />
          <span className="rating-score">{course.rating}</span>
          <span className="rating-count">({course.reviewCount.toLocaleString()})</span>
        </div>
        <div className="course-card-meta">
          <span>Thời lượng: {course.duration}</span>
          <span>Số bài học: {course.lessons.length}</span>
          <span className="level-badge">{course.level}</span>
        </div>
      </div>

      <div className="course-card-footer">
        <div className="course-price">
          <span className="price-current">
            {hasPricing ? `${course.price.toLocaleString('vi-VN')}đ` : 'Đang cập nhật'}
          </span>
          <span className="price-original">
            {hasPricing ? `${course.originalPrice.toLocaleString('vi-VN')}đ` : ''}
          </span>
        </div>
        <button className="btn-card-view" type="button">Xem khóa học</button>
      </div>
    </div>
  )
}

export default CourseCard
