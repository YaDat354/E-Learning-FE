import { Fragment, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { COURSES, deleteLesson, updateLesson } from '../../domain/index.ts'
import type { Lesson, User } from '../../domain/index.ts'
import { fetchCourseDetail } from '../../services/courseService.ts'
import VideoPlayer from '../../components/course/VideoPlayer.tsx'
import QuizPanel from '../../components/course/QuizPanel.tsx'
import { getTeacherCourses } from '../../utils/teacher.ts'
import './LessonManage.css'

type Props = {
	user: User
	teacherCourseIds: string[]
	onBackToDashboard: () => void
	onOpenLessonDiscussion: (courseId: string, lessonId: string) => void
}

function LessonManage({ user, teacherCourseIds, onBackToDashboard, onOpenLessonDiscussion }: Props) {
	const teacherCourses = getTeacherCourses(COURSES, user, teacherCourseIds)
	const [selectedCourseId, setSelectedCourseId] = useState(teacherCourses[0]?.id ?? '')
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editTitle, setEditTitle] = useState('')
	const [editDuration, setEditDuration] = useState('')
	const [editIsFree, setEditIsFree] = useState(false)
	const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [isHydratingLessons, setIsHydratingLessons] = useState(false)
	const [error, setError] = useState('')
	const [refreshKey, setRefreshKey] = useState(0)

	const course = useMemo(
		() => teacherCourses.find((c) => c.id === selectedCourseId) ?? teacherCourses[0] ?? null,
		[selectedCourseId, teacherCourses, refreshKey],
	)

	useEffect(() => {
		if (teacherCourses.length === 0) {
			if (selectedCourseId !== '') {
				setSelectedCourseId('')
			}
			return
		}

		if (!teacherCourses.some((item) => item.id === selectedCourseId)) {
			setSelectedCourseId(teacherCourses[0].id)
		}
	}, [selectedCourseId, teacherCourses])

	useEffect(() => {
		if (!selectedCourseId) {
			return
		}

		const current = COURSES.find((entry) => entry.id === selectedCourseId)
		if (current && current.lessons.length > 0) {
			return
		}

		let mounted = true

		const hydrateLessons = async () => {
			setIsHydratingLessons(true)
			setError('')

			try {
				const detail = await fetchCourseDetail(selectedCourseId)

				if (!mounted) {
					return
				}

				const index = COURSES.findIndex((entry) => entry.id === selectedCourseId)
				if (index >= 0) {
					COURSES[index] = {
						...COURSES[index],
						...detail,
						lessons: detail.lessons,
					}
				} else {
					COURSES.unshift(detail)
				}

				setRefreshKey((prev) => prev + 1)
			} catch (hydrateError) {
				console.error('hydrate lesson list failed', hydrateError)
				if (mounted) {
					setError('Không thể tải danh sách bài học từ backend.')
				}
			} finally {
				if (mounted) {
					setIsHydratingLessons(false)
				}
			}
		}

		void hydrateLessons()

		return () => {
			mounted = false
		}
	}, [selectedCourseId])

	const lessonList = useMemo(
		() => course?.lessons ?? [],
		[course],
	)

	const startEdit = (lesson: Lesson) => {
		setEditingId(lesson.id)
		setEditTitle(lesson.title)
		setEditDuration(lesson.duration)
		setEditIsFree(lesson.isFree)
	}

	const saveEdit = async () => {
		if (!editingId) {
			return
		}

		const currentLesson = lessonList.find((lesson) => lesson.id === editingId)

		setIsSaving(true)
		setError('')
		try {
			await updateLesson(editingId, {
				title: editTitle,
				duration: editDuration,
				isFree: editIsFree,
				description: currentLesson?.description ?? '',
			})
			setEditingId(null)
			setRefreshKey((prev) => prev + 1)
		} catch (saveError) {
			console.error('update lesson failed', saveError)
			if (axios.isAxiosError(saveError)) {
				const status = saveError.response?.status
				const payload = saveError.response?.data as { message?: string; error?: string } | undefined
				const detail = payload?.message || payload?.error || saveError.message

				if (status === 403) {
					setError(`Bạn không có quyền cập nhật bài học này (${status}). ${detail}`)
				} else if (status === 400 || status === 422) {
					setError(`Dữ liệu cập nhật chưa hợp lệ (${status}). ${detail}`)
				} else {
					setError(`Không thể cập nhật bài học (${status ?? 'network'}). ${detail}`)
				}
			} else {
				setError('Không thể cập nhật bài học. Vui lòng thử lại.')
			}
		} finally {
			setIsSaving(false)
		}
	}

	const handleDeleteLesson = async (id: string) => {
		setIsSaving(true)
		setError('')
		try {
			await deleteLesson(id)
			if (editingId === id) setEditingId(null)
			if (expandedLessonId === id) setExpandedLessonId(null)
			setRefreshKey((prev) => prev + 1)
		} catch (deleteError) {
			console.error('delete lesson failed', deleteError)
			setError('Không thể xóa bài học. Vui lòng thử lại.')
		} finally {
			setIsSaving(false)
		}
	}

	const toggleLessonPreview = (id: string) => {
		setExpandedLessonId((prev) => (prev === id ? null : id))
	}

	return (
		<section className="teacher-page">
			<div className="teacher-shell">
				<header className="teacher-header">
					<div>
						<h1 className="teacher-title">Quản lý bài học</h1>
						<p className="teacher-subtitle">{lessonList.length} bài học · {course?.title ?? 'Chưa có khóa học'}</p>
					</div>
					<div className="teacher-toolbar">
						<button className="teacher-btn ghost" onClick={onBackToDashboard}>
							Về Dashboard
						</button>
					</div>
				</header>

				<div className="teacher-toolbar">
					<select
						className="teacher-select"
						value={selectedCourseId}
						onChange={(e) => setSelectedCourseId(e.target.value)}
						disabled={teacherCourses.length === 0}
					>
						{teacherCourses.map((c) => (
							<option key={c.id} value={c.id}>
								{c.title}
							</option>
						))}
					</select>
				</div>

				<section className="teacher-panel">
					{error && <div className="teacher-list-meta" style={{ marginBottom: 12, color: '#dc2626' }}>{error}</div>}
					{isHydratingLessons && <div className="teacher-list-meta" style={{ marginBottom: 12 }}>Đang tải bài học từ backend...</div>}
					<div className="teacher-panel-head">
						<h3>Danh sách bài học</h3>
						<span className="teacher-list-meta">
							{lessonList.filter((l) => l.isFree).length} miễn phí /{' '}
							{lessonList.filter((l) => !l.isFree).length} trả phí
						</span>
					</div>
					{lessonList.length === 0 && (
						<p className="teacher-empty">Không có bài học nào cho giảng viên hiện tại.</p>
					)}
					<div className="teacher-list">
						{lessonList.map((lesson, index) => (
							<Fragment key={lesson.id}>
								{editingId === lesson.id ? (
								<div
									className="teacher-list-item teacher-list-item-edit"
								>
									<div className="teacher-form-grid" style={{ width: '100%' }}>
										<div>
											<label className="teacher-form-label">Tên bài học</label>
											<input
												className="teacher-input teacher-input-full"
												value={editTitle}
												onChange={(e) => setEditTitle(e.target.value)}
											/>
										</div>
										<div>
											<label className="teacher-form-label">Thời lượng</label>
											<input
												className="teacher-input teacher-input-full"
												value={editDuration}
												onChange={(e) => setEditDuration(e.target.value)}
											/>
										</div>
										<div className="teacher-checkbox-row">
											<input
												type="checkbox"
												id={`free-${lesson.id}`}
												checked={editIsFree}
												onChange={(e) => setEditIsFree(e.target.checked)}
											/>
											<label htmlFor={`free-${lesson.id}`}>Miễn phí</label>
										</div>
									</div>
									<div className="teacher-actions">
										<button className="teacher-btn" onClick={() => void saveEdit()} disabled={isSaving}>
											{isSaving ? 'Đang lưu...' : 'Lưu'}
										</button>
										<button
											className="teacher-btn ghost"
											onClick={() => setEditingId(null)}
										>
											Hủy
										</button>
									</div>
								</div>
								) : (
								<div className="teacher-list-item">
									<div>
										<div
											className="teacher-list-title"
											style={{ cursor: 'pointer' }}
											onClick={() => toggleLessonPreview(lesson.id)}
										>
											<span className="teacher-lesson-num">{index + 1}.</span>{' '}
											{lesson.title}
										</div>
										<div className="teacher-list-meta">
											{lesson.duration} ·{' '}
											{lesson.resources.length > 0
												? `${lesson.resources.length} tài nguyên`
												: 'Không có tài nguyên'}{' '}
											· {lesson.quiz ? 'Có quiz' : 'Không có quiz'}
										</div>
									</div>
									<div className="teacher-actions">
										<span
											className={`teacher-badge ${
												lesson.isFree ? 'teacher-badge-free' : 'teacher-badge-paid'
											}`}
										>
											{lesson.isFree ? 'Miễn phí' : 'Trả phí'}
										</span>
										<button
											className={`teacher-action-btn ${expandedLessonId === lesson.id ? 'teacher-action-btn-active' : ''}`}
											onClick={() => toggleLessonPreview(lesson.id)}
										>
											{expandedLessonId === lesson.id ? 'Ẩn bài học' : 'Hiển thị bài học'}
										</button>
										<button
											className="teacher-action-btn"
											onClick={() => onOpenLessonDiscussion(course.id, lesson.id)}
										>
											Thảo luận
										</button>
										<button
											className="teacher-action-btn"
											onClick={() => startEdit(lesson)}
										>
											Sửa
										</button>
										<button
											className="teacher-action-btn teacher-action-btn-danger"
											onClick={() => void handleDeleteLesson(lesson.id)}
											disabled={isSaving}
										>
											Xóa
										</button>
									</div>
								</div>
								)}

								{editingId !== lesson.id && expandedLessonId === lesson.id && (
									<div className="teacher-expand-panel" style={{ borderRadius: 12 }}>
										<div className="teacher-list-meta" style={{ marginBottom: 12 }}>
											{lesson.description}
										</div>
										<VideoPlayer
											title={lesson.title}
											duration={lesson.duration}
											videoId={lesson.videoId}
											script={lesson.videoScript}
											keyPhrases={lesson.keyPhrases}
										/>
										<div style={{ marginTop: 14 }}>
											{lesson.quiz ? (
<QuizPanel
                        quiz={lesson.quiz}
                        courseId={course.id}
                        courseTitle={course.title}
                        lessonId={lesson.id}
                        lessonTitle={lesson.title}
                        userRole={user.role}
                      />
											) : (
												<p className="teacher-empty" style={{ padding: '8px 0 0', textAlign: 'left' }}>
													Bài học này chưa có quiz.
												</p>
											)}
										</div>
									</div>
								)}
							</Fragment>
						))}
					</div>
				</section>
			</div>
		</section>
	)
}

export default LessonManage
