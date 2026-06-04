import { COURSES, ROLE_LABELS } from '../../domain/index.ts'
import type { User } from '../../domain/index.ts'
import './Dashboard.css'

type DashboardProps = {
	user: User
	onOpenCourse: (courseId: string) => void
	onOpenLesson: (courseId: string, lessonId: string) => void
	onOpenCourseList: () => void
	onOpenProfile: () => void
	onLogout: () => void
}

function Dashboard({ user, onOpenCourse, onOpenLesson, onOpenCourseList, onOpenProfile, onLogout }: DashboardProps) {
	const totalLessons = COURSES.reduce((sum, course) => sum + course.lessons.length, 0)
	const freeLessons = COURSES.reduce((sum, course) => sum + course.lessons.filter((lesson) => lesson.isFree).length, 0)

	const nextLessons = COURSES.slice(0, 3).map((course) => ({
		courseId: course.id,
		courseTitle: course.title,
		lesson: course.lessons[0],
	})).filter((item) => Boolean(item.lesson))
	const firstCourseId = COURSES[0]?.id ?? null

	return (
		<section className="student-page">
			<div className="student-shell">
				<header className="student-header">
					<div>
						<h1 className="student-title">Dashboard học viên</h1>
						<p className="student-subtitle">{user.name} · {ROLE_LABELS[user.role]}</p>
					</div>
					<div className="student-toolbar">
						<button className="student-btn ghost" onClick={onOpenCourseList}>Danh sách khóa học</button>
						<button className="student-btn ghost" onClick={onOpenProfile}>Hồ sơ</button>
						<button
							className="student-btn"
							onClick={() => firstCourseId && onOpenCourse(firstCourseId)}
							disabled={!firstCourseId}
						>
							Tiếp tục học
						</button>
						<button className="student-btn danger" onClick={onLogout}>Đăng xuất</button>
					</div>
				</header>

				<div className="student-grid">
					<article className="student-card">
						<h3>Tổng số khóa học</h3>
						<p className="student-metric">{COURSES.length}</p>
					</article>
					<article className="student-card">
						<h3>Tổng số bài học</h3>
						<p className="student-metric">{totalLessons}</p>
					</article>
					<article className="student-card">
						<h3>Bài học miễn phí</h3>
						<p className="student-metric">{freeLessons}</p>
					</article>
				</div>

				<section className="student-panel">
					<h3>Gợi ý học tiếp</h3>
					<div className="student-list">
						{nextLessons.length === 0 && (
							<div className="student-list-item">
								<div className="student-list-meta">Chưa có dữ liệu khóa học từ backend.</div>
							</div>
						)}
						{nextLessons.map((item) => (
							<div className="student-list-item" key={`${item.courseId}-${item.lesson.id}`}>
								<div>
									<div className="student-list-title">{item.lesson.title}</div>
									<div className="student-list-meta">{item.courseTitle} · {item.lesson.duration}</div>
								</div>
								<button className="student-btn" onClick={() => onOpenLesson(item.courseId, item.lesson.id)}>Mở bài</button>
							</div>
						))}
					</div>
				</section>
			</div>
		</section>
	)
}

export default Dashboard