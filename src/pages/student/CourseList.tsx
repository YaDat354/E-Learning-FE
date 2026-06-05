import { useMemo, useState } from 'react'
import { COURSES } from '../../domain/index.ts'
import './CourseList.css'

type CourseListProps = {
	myCourseIds: string[]
	onOpenCourse: (courseId: string) => void
	onBackToDashboard: () => void
	onLogout: () => void
}

function CourseList({ myCourseIds, onOpenCourse, onBackToDashboard, onLogout }: CourseListProps) {
	const [query, setQuery] = useState('')
	const [viewMode, setViewMode] = useState<'all' | 'my'>('my')
	const [level, setLevel] = useState<'all' | 'Cơ bản' | 'Trung cấp' | 'Nâng cao'>('all')

	const courses = useMemo(() => {
		const sourceCourses = viewMode === 'my'
			? COURSES.filter((course) => myCourseIds.includes(course.id))
			: COURSES

		return sourceCourses.filter((course) => {
			const title = typeof course.title === 'string' ? course.title : ''
			const matchesQuery = title.toLowerCase().includes(query.toLowerCase())
			const matchesLevel = level === 'all' ? true : course.level === level
			return matchesQuery && matchesLevel
		})
	}, [query, level, myCourseIds, viewMode])

	return (
		<section className="student-page">
			<div className="student-shell">
				<header className="student-header">
					<div>
						<h1 className="student-title">Khóa học dành cho học viên</h1>
						<p className="student-subtitle">
							{viewMode === 'my'
								? `Bạn đang có ${myCourseIds.length} khóa học đã đăng ký`
								: 'Lọc nhanh để chọn lộ trình phù hợp'}
						</p>
					</div>
					<div className="student-toolbar">
						<button className="student-btn ghost" onClick={onBackToDashboard}>Về Dashboard</button>
						<button className="student-btn danger" onClick={onLogout}>Đăng xuất</button>
					</div>
				</header>

				<div className="student-segment">
					<button
						className={`student-btn ghost ${viewMode === 'my' ? 'active' : ''}`}
						onClick={() => setViewMode('my')}
					>
						Khóa học của tôi
					</button>
					<button
						className={`student-btn ghost ${viewMode === 'all' ? 'active' : ''}`}
						onClick={() => setViewMode('all')}
					>
						Tất cả khóa học
					</button>
				</div>

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
					{courses.length === 0 && (
						<div className="student-list-item">
							<div className="student-list-meta">
								{viewMode === 'my'
									? 'Bạn chưa có khóa học nào trong danh sách của tôi.'
									: 'Chưa có khóa học phù hợp hoặc dữ liệu khóa học chưa sẵn sàng.'}
							</div>
						</div>
					)}
					{courses.map((course) => (
						<div className="student-list-item" key={course.id}>
							<div>
								<div className="student-list-title">{course.title || 'Khóa học chưa có tiêu đề'}</div>
								<div className="student-list-meta">
									{course.level || 'Chưa phân cấp'} · {course.duration || 'Đang cập nhật'} · {(course.studentCount ?? 0).toLocaleString()} học viên
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