import { COURSES, ROLE_LABELS } from '../../data/mockData.ts'
import type { User } from '../../data/mockData.ts'
import './Dashboard.css'

type Props = {
	user: User
	onGoCourses: () => void
	onGoCreateCourse: () => void
	onGoLessons: () => void
	onGoQuizzes: () => void
	onGoAssignments: () => void
	onLogout: () => void
}

function Dashboard({ user, onGoCourses, onGoCreateCourse, onGoLessons, onGoQuizzes, onGoAssignments, onLogout }: Props) {
	const totalStudents = COURSES.reduce((sum, c) => sum + c.studentCount, 0)
	const totalLessons = COURSES.reduce((sum, c) => sum + c.lessons.length, 0)
	const totalQuizzes = COURSES.reduce(
		(sum, c) => sum + c.lessons.filter((l) => l.quiz !== null).length,
		0,
	)

	return (
		<section className="teacher-page">
			<div className="teacher-shell">
				<header className="teacher-header">
					<div>
						<h1 className="teacher-title">Dashboard giảng viên</h1>
						<p className="teacher-subtitle">
							{user.name} · {ROLE_LABELS[user.role]}
						</p>
					</div>
					<div className="teacher-toolbar">
						<button className="teacher-btn ghost" onClick={onGoCourses}>
							Khóa học
						</button>
						<button className="teacher-btn" onClick={onGoCreateCourse}>
							+ Tạo khóa học
						</button>
						<button className="teacher-btn ghost" onClick={onGoLessons}>
							Bài học
						</button>
						<button className="teacher-btn ghost" onClick={onGoQuizzes}>
							Quiz
						</button>
						<button className="teacher-btn ghost" onClick={onGoAssignments}>
							Bài tập
						</button>
						<button className="teacher-btn danger" onClick={onLogout}>
							Đăng xuất
						</button>
					</div>
				</header>

				<div className="teacher-grid">
					<article className="teacher-card">
						<h3>Tổng khóa học</h3>
						<p className="teacher-metric">{COURSES.length}</p>
					</article>
					<article className="teacher-card">
						<h3>Tổng bài học</h3>
						<p className="teacher-metric">{totalLessons}</p>
					</article>
					<article className="teacher-card">
						<h3>Tổng học viên</h3>
						<p className="teacher-metric">{totalStudents.toLocaleString()}</p>
					</article>
				</div>

				<div className="teacher-quick-nav">
					<button className="teacher-quick-btn" onClick={onGoCourses}>
						<span className="teacher-quick-icon">📚</span>
						<span>Quản lý khóa học</span>
					</button>
					<button className="teacher-quick-btn" onClick={onGoCreateCourse}>
						<span className="teacher-quick-icon">➕</span>
						<span>Tạo khóa học mới</span>
					</button>
					<button className="teacher-quick-btn" onClick={onGoLessons}>
						<span className="teacher-quick-icon">🎬</span>
						<span>Quản lý bài học</span>
					</button>
					<button className="teacher-quick-btn" onClick={onGoQuizzes}>
						<span className="teacher-quick-icon">📝</span>
						<span>{totalQuizzes} Quiz đang hoạt động</span>
					</button>
					<button className="teacher-quick-btn" onClick={onGoAssignments}>
						<span className="teacher-quick-icon">✅</span>
						<span>Quản lý bài tập</span>
					</button>
				</div>

				<section className="teacher-panel">
					<div className="teacher-panel-head">
						<h3>Danh sách khóa học</h3>
						<button className="teacher-btn" onClick={onGoCourses}>
							Xem tất cả
						</button>
					</div>
					<div className="teacher-list">
						{COURSES.map((course) => (
							<div className="teacher-list-item" key={course.id}>
								<div>
									<div className="teacher-list-title">{course.title}</div>
									<div className="teacher-list-meta">
										{course.level} · {course.lessons.length} bài học ·{' '}
										{course.studentCount.toLocaleString()} học viên · {course.rating}⭐
									</div>
								</div>
								<div className="teacher-actions">
									<span
										className="teacher-badge"
										style={{ background: course.categoryColor }}
									>
										{course.category}
									</span>
									<button className="teacher-action-btn" onClick={onGoLessons}>
										Bài học
									</button>
								</div>
							</div>
						))}
					</div>
				</section>
			</div>
		</section>
	)
}

export default Dashboard