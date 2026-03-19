import { useMemo, useState } from 'react'
import { COURSES } from '../../data/mockData.ts'
import './CourseList.css'

type CourseListProps = {
	onOpenCourse: (courseId: string) => void
}

function CourseList({ onOpenCourse }: CourseListProps) {
	const [query, setQuery] = useState('')
	const [level, setLevel] = useState<'all' | 'Cơ bản' | 'Trung cấp' | 'Nâng cao'>('all')

	const courses = useMemo(() => {
		return COURSES.filter((course) => {
			const matchesQuery = course.title.toLowerCase().includes(query.toLowerCase())
			const matchesLevel = level === 'all' ? true : course.level === level
			return matchesQuery && matchesLevel
		})
	}, [query, level])

	return (
		<section className="student-page">
			<div className="student-shell">
				<header className="student-header">
					<div>
						<h1 className="student-title">Khóa học dành cho học viên</h1>
						<p className="student-subtitle">Lọc nhanh để chọn lộ trình phù hợp</p>
					</div>
				</header>

				<div className="student-toolbar">
					<input
						className="student-input"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Tìm khóa học..."
					/>
					<select
						className="student-select"
						value={level}
						onChange={(event) => setLevel(event.target.value as 'all' | 'Cơ bản' | 'Trung cấp' | 'Nâng cao')}
					>
						<option value="all">Tất cả trình độ</option>
						<option value="Cơ bản">Cơ bản</option>
						<option value="Trung cấp">Trung cấp</option>
						<option value="Nâng cao">Nâng cao</option>
					</select>
				</div>

				<div className="student-list">
					{courses.map((course) => (
						<div className="student-list-item" key={course.id}>
							<div>
								<div className="student-list-title">{course.title}</div>
								<div className="student-list-meta">
									{course.level} · {course.duration} · {course.studentCount.toLocaleString()} học viên
								</div>
							</div>
							<button className="student-btn" onClick={() => onOpenCourse(course.id)}>Xem chi tiết</button>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

export default CourseList