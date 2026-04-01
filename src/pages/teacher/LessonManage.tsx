import { useMemo, useState } from 'react'
import { COURSES } from '../../data/mockData.ts'
import type { Lesson } from '../../data/mockData.ts'
import './LessonManage.css'

type Props = {
	onBackToDashboard: () => void
}

function LessonManage({ onBackToDashboard }: Props) {
	const [selectedCourseId, setSelectedCourseId] = useState(COURSES[0].id)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editTitle, setEditTitle] = useState('')
	const [editDuration, setEditDuration] = useState('')
	const [editIsFree, setEditIsFree] = useState(false)
	const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
	const [lessonUpdates, setLessonUpdates] = useState<Record<string, Partial<Lesson>>>({})

	const course = useMemo(
		() => COURSES.find((c) => c.id === selectedCourseId) ?? COURSES[0],
		[selectedCourseId],
	)

	const lessonList = useMemo(
		() =>
			course.lessons
				.filter((lesson) => !deletedIds.has(lesson.id))
				.map((lesson) => ({
					...lesson,
					...lessonUpdates[lesson.id],
				})),
		[course, deletedIds, lessonUpdates],
	)

	const startEdit = (lesson: Lesson) => {
		setEditingId(lesson.id)
		setEditTitle(lesson.title)
		setEditDuration(lesson.duration)
		setEditIsFree(lesson.isFree)
	}

	const saveEdit = () => {
		if (editingId) {
			setLessonUpdates((prev) => ({
				...prev,
				[editingId]: {
					title: editTitle,
					duration: editDuration,
					isFree: editIsFree,
				},
			}))
		}
		setEditingId(null)
	}

	const deleteLesson = (id: string) => {
		setDeletedIds((prev) => {
			const next = new Set(prev)
			next.add(id)
			return next
		})
		if (editingId === id) setEditingId(null)
	}

	return (
		<section className="teacher-page">
			<div className="teacher-shell">
				<header className="teacher-header">
					<div>
						<h1 className="teacher-title">Quản lý bài học</h1>
						<p className="teacher-subtitle">
							{lessonList.length} bài học · {course.title}
						</p>
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
					>
						{COURSES.map((c) => (
							<option key={c.id} value={c.id}>
								{c.title}
							</option>
						))}
					</select>
				</div>

				<section className="teacher-panel">
					<div className="teacher-panel-head">
						<h3>Danh sách bài học</h3>
						<span className="teacher-list-meta">
							{lessonList.filter((l) => l.isFree).length} miễn phí /{' '}
							{lessonList.filter((l) => !l.isFree).length} trả phí
						</span>
					</div>
					{lessonList.length === 0 && (
						<p className="teacher-empty">Không còn bài học nào.</p>
					)}
					<div className="teacher-list">
						{lessonList.map((lesson, index) =>
							editingId === lesson.id ? (
								<div
									className="teacher-list-item teacher-list-item-edit"
									key={lesson.id}
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
										<button className="teacher-btn" onClick={saveEdit}>
											Lưu
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
								<div className="teacher-list-item" key={lesson.id}>
									<div>
										<div className="teacher-list-title">
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
											className="teacher-action-btn"
											onClick={() => startEdit(lesson)}
										>
											Sửa
										</button>
										<button
											className="teacher-action-btn teacher-action-btn-danger"
											onClick={() => deleteLesson(lesson.id)}
										>
											Xóa
										</button>
									</div>
								</div>
							),
						)}
					</div>
				</section>
			</div>
		</section>
	)
}

export default LessonManage
