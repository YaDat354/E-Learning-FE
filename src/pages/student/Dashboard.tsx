import { useEffect, useMemo, useState } from 'react'
import { COURSES, ROLE_LABELS } from '../../domain/index.ts'
import type { User } from '../../domain/index.ts'
import { fetchStudentDashboardMedia } from '../../services/dashboardService.ts'
import { fetchContinueLearning, type ContinueLearningItem } from '../../services/enrollmentService.ts'
import './Dashboard.css'

type DashboardProps = {
	user: User
	myCourseIds: string[]
	onOpenCourse: (courseId: string) => void
	onOpenLesson: (courseId: string, lessonId: string) => void
	onOpenCourseList: () => void
	onOpenProfile: () => void
	onLogout: () => void
}

function Dashboard({ user, myCourseIds, onOpenCourse, onOpenLesson, onOpenCourseList, onOpenProfile, onLogout }: DashboardProps) {
	const [nextLessons, setNextLessons] = useState<ContinueLearningItem[]>([])
	const [isContinueLoading, setIsContinueLoading] = useState(true)
	const [heroTitle, setHeroTitle] = useState('Chinh phuc bai hoc moi moi ngay')
	const [heroSubtitle, setHeroSubtitle] = useState('Theo doi tien do, mo bai hoc tiep theo va giu nhiet hoc tap voi bang dieu khien moi.')
	const [heroImageUrl, setHeroImageUrl] = useState('/student-hero.svg')
	const [heroHighlights, setHeroHighlights] = useState<string[]>([])

	const myCourses = COURSES.filter((course) => myCourseIds.includes(course.id))
	const totalLessons = myCourses.reduce((sum, course) => sum + course.lessons.length, 0)
	const freeLessons = myCourses.reduce((sum, course) => sum + course.lessons.filter((lesson) => lesson.isFree).length, 0)
	const fallbackNextLessons = useMemo(() => {
		return myCourses.map((course) => ({
			courseId: course.id,
			courseTitle: course.title,
			lessonId: (course.lessons.find((lesson) => !lesson.isFree) ?? course.lessons[0])?.id ?? '',
			lessonTitle: (course.lessons.find((lesson) => !lesson.isFree) ?? course.lessons[0])?.title ?? 'Bài học',
			lessonDuration: (course.lessons.find((lesson) => !lesson.isFree) ?? course.lessons[0])?.duration ?? 'Đang cập nhật',
		})).filter((item) => item.lessonId.length > 0).slice(0, 3)
	}, [myCourses])

	const firstCourseId = myCourses[0]?.id ?? null

	useEffect(() => {
		let mounted = true

		const loadContinueLearning = async () => {
			setIsContinueLoading(true)
			try {
				const rows = await fetchContinueLearning(3)
				if (mounted) {
					setNextLessons(rows)
				}
			} catch (error) {
				console.error('load continue learning failed', error)
				if (mounted) {
					setNextLessons([])
				}
			} finally {
				if (mounted) {
					setIsContinueLoading(false)
				}
			}
		}

		void loadContinueLearning()

		return () => {
			mounted = false
		}
	}, [myCourseIds.join('|')])

	const displayNextLessons = nextLessons.length > 0 ? nextLessons : fallbackNextLessons
	const displayHeroHighlights = heroHighlights.length > 0
		? heroHighlights
		: [`${myCourses.length} khoa hoc dang theo hoc`, `${displayNextLessons.length} goi y hoc tiep`, `${freeLessons} bai hoc mien phi`]

	useEffect(() => {
		let mounted = true

		const loadDashboardMedia = async () => {
			try {
				const media = await fetchStudentDashboardMedia()
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
				console.error('load student dashboard media failed', error)
			}
		}

		void loadDashboardMedia()

		return () => {
			mounted = false
		}
	}, [])

	return (
		<section className="student-page">
			<div className="student-shell">
				<section className="student-hero">
					<div className="student-hero-content">
						<p className="student-hero-eyebrow">Learning Hub</p>
						<h2>{heroTitle}</h2>
						<p>{heroSubtitle}</p>
						<div className="student-hero-chips">
							{displayHeroHighlights.map((item) => (
								<span key={item}>{item}</span>
							))}
						</div>
					</div>
					<div className="student-hero-art" aria-hidden="true">
						<img src={heroImageUrl || '/student-hero.svg'} alt="" onError={(e) => {
							e.currentTarget.src = '/student-hero.svg'
						}} />
					</div>
				</section>

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
						<h3>Khóa học của tôi</h3>
						<p className="student-metric">{myCourses.length}</p>
					</article>
					<article className="student-card">
						<h3>Bài học trong khóa của tôi</h3>
						<p className="student-metric">{totalLessons}</p>
					</article>
					<article className="student-card">
						<h3>Bài học học thử</h3>
						<p className="student-metric">{freeLessons}</p>
					</article>
				</div>

				<section className="student-panel">
					<h3>Gợi ý học tiếp</h3>
					<div className="student-list">
						{isContinueLoading && (
							<div className="student-list-item">
								<div className="student-list-meta">Đang tải gợi ý học tiếp...</div>
							</div>
						)}
						{!isContinueLoading && displayNextLessons.length === 0 && (
							<div className="student-list-item">
								<div className="student-list-meta">Chưa có dữ liệu học tiếp trong khóa học của bạn.</div>
							</div>
						)}
						{displayNextLessons.map((item) => (
							<div className="student-list-item" key={`${item.courseId}-${item.lessonId}`}>
								<div>
									<div className="student-list-title">{item.lessonTitle}</div>
									<div className="student-list-meta">{item.courseTitle} · {item.lessonDuration}</div>
								</div>
								<button className="student-btn" onClick={() => onOpenLesson(item.courseId, item.lessonId)}>Mở bài</button>
							</div>
						))}
					</div>
				</section>
			</div>
		</section>
	)
}

export default Dashboard