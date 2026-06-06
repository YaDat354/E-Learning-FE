import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { COURSES, ROLE_LABELS, fetchLessonComments } from '../../domain/index.ts'
import type { User } from '../../domain/index.ts'
import { fetchTeacherDashboardMedia } from '../../services/dashboardService.ts'
import { getDiscussionNotificationsApi } from '../../services/discussionService.ts'
import { getTeacherCourses } from '../../utils/teacher.ts'
import './Dashboard.css'

type Props = {
	user: User
	teacherCourseIds: string[]
	onOpenProfile: () => void
	onGoCourses: () => void
	onGoCreateCourse: () => void
	onGoLessons: () => void
	onGoQuizzes: () => void
	onGoAssignments: () => void
	onLogout: () => void
}

function Dashboard({ user, teacherCourseIds, onOpenProfile, onGoCourses, onGoCreateCourse, onGoLessons, onGoQuizzes, onGoAssignments, onLogout }: Props) {
	const teacherCourses = getTeacherCourses(COURSES, user, teacherCourseIds)
	const totalStudents = teacherCourses.reduce((sum, c) => sum + c.studentCount, 0)
	const totalLessons = teacherCourses.reduce((sum, c) => sum + (c.lessonCount ?? c.lessons.length), 0)
	const totalQuizzes = teacherCourses.reduce(
		(sum, c) => sum + c.lessons.filter((l) => l.quiz !== null).length,
		0,
	)
	const [unreadDiscussionCount, setUnreadDiscussionCount] = useState(0)
	const [heroTitle, setHeroTitle] = useState('Dieu phoi lop hoc va theo doi tuong tac theo thoi gian thuc')
	const [heroSubtitle, setHeroSubtitle] = useState('Tong hop nhanh khoa hoc, luong thao luan va cac dau viec quan trong cho giang vien.')
	const [heroImageUrl, setHeroImageUrl] = useState('/teacher-hero.svg')
	const [heroHighlights, setHeroHighlights] = useState<string[]>([])

	const lessonIds = Array.from(new Set(teacherCourses.flatMap((course) => course.lessons.map((lesson) => lesson.id)).filter(Boolean)))

	useEffect(() => {
		let mounted = true
		let timerId: number | null = null

		const loadUnreadDiscussionCount = async () => {
			try {
				const notificationsPayload = await getDiscussionNotificationsApi()
				if (notificationsPayload) {
					if (mounted) {
						setUnreadDiscussionCount(notificationsPayload.totalUnread)
					}
					return
				}

				const userToken = user.id || user.email || 'guest'
				const unreadByLesson = await Promise.all(
					lessonIds.map(async (lessonId) => {
						const comments = await fetchLessonComments(lessonId)
						const seenRaw = localStorage.getItem(`discussionSeenCount:${userToken}:${lessonId}`)
						const seenCount = Number(seenRaw)
						const normalizedSeen = Number.isFinite(seenCount) ? Math.max(0, seenCount) : 0
						return Math.max(0, comments.length - normalizedSeen)
					}),
				)

				if (mounted) {
					setUnreadDiscussionCount(unreadByLesson.reduce((sum, count) => sum + count, 0))
				}
			} catch (error) {
				console.error('load teacher unread discussion count failed', error)
			}
		}

		if (lessonIds.length === 0) {
			return
		}

		void loadUnreadDiscussionCount()
		timerId = window.setInterval(() => {
			void loadUnreadDiscussionCount()
		}, 20000)

		return () => {
			mounted = false
			if (timerId !== null) {
				window.clearInterval(timerId)
			}
		}
	}, [lessonIds, user.email, user.id])

	useEffect(() => {
		let mounted = true

		const loadDashboardMedia = async () => {
			try {
				const media = await fetchTeacherDashboardMedia()
				if (!mounted || !media) {
					return
				}

				if (media.heroTitle) {
					setHeroTitle(media.heroTitle)
				}

				if (media.heroSubtitle) {
					setHeroSubtitle(media.heroSubtitle)
				}

				if (media.heroImageUrl) {
					setHeroImageUrl(media.heroImageUrl)
				}

				if (media.highlights.length > 0) {
					setHeroHighlights(media.highlights.map((item) => `${item.label}: ${item.value}`))
				}
			} catch (error) {
				console.error('load teacher dashboard media failed', error)
			}
		}

		void loadDashboardMedia()

		return () => {
			mounted = false
		}
	}, [])

	const displayUnreadDiscussionCount = lessonIds.length === 0 ? 0 : unreadDiscussionCount
	const displayHeroHighlights = heroHighlights.length > 0
		? heroHighlights
		: [`${teacherCourses.length} khoa hoc dang quan ly`, `${displayUnreadDiscussionCount} phan hoi chua doc`, `${totalQuizzes} quiz dang hoat dong`]

	return (
		<section className="teacher-page">
			<div className="teacher-shell">
				<section className="teacher-hero">
					<div className="teacher-hero-content">
						<p className="teacher-hero-eyebrow">Teaching Command Center</p>
						<h2>{heroTitle}</h2>
						<p>{heroSubtitle}</p>
						<div className="teacher-hero-tags">
							{displayHeroHighlights.map((item) => (
								<span key={item}>{item}</span>
							))}
						</div>
					</div>
					<div className="teacher-hero-art" aria-hidden="true">
						<img src={heroImageUrl || '/teacher-hero.svg'} alt="" onError={(e) => {
							e.currentTarget.src = '/teacher-hero.svg'
						}} />
					</div>
				</section>

				<header className="teacher-header">
					<div>
						<h1 className="teacher-title">Dashboard giảng viên</h1>
						<p className="teacher-subtitle">
							{user.name} · {ROLE_LABELS[user.role]}
						</p>
					</div>
					<div className="teacher-toolbar">
						<button className="teacher-btn ghost teacher-bell-btn" onClick={onGoLessons} aria-label="Mở thảo luận bài học" title="Mở thảo luận bài học">
							<Bell size={16} />
							<span>Thảo luận</span>
							{displayUnreadDiscussionCount > 0 && (
								<span className="teacher-bell-badge">{displayUnreadDiscussionCount > 99 ? '99+' : displayUnreadDiscussionCount}</span>
							)}
						</button>
						<button className="teacher-btn ghost" onClick={onOpenProfile}>
							Hồ sơ
						</button>
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
						<p className="teacher-metric">{teacherCourses.length}</p>
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
					<button className="teacher-quick-btn" onClick={onGoLessons}>
						<span className="teacher-quick-icon">🔔</span>
						<span>{displayUnreadDiscussionCount > 0 ? `Thảo luận mới (${displayUnreadDiscussionCount})` : 'Thảo luận bài học'}</span>
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
						{teacherCourses.length === 0 && (
							<div className="teacher-list-item">
								<div className="teacher-list-meta">Chưa có khóa học thuộc giảng viên này.</div>
							</div>
						)}
						{teacherCourses.map((course) => (
							<div className="teacher-list-item" key={course.id}>
								<div>
									<div className="teacher-list-title">{course.title}</div>
									<div className="teacher-list-meta">
										{course.level} · {(course.lessonCount ?? course.lessons.length)} bài học ·{' '}
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