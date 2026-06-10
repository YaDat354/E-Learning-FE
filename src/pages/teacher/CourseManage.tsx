import { useMemo, useState } from 'react'
import axios from 'axios'
import { COURSES, deleteCourse, updateCourse } from '../../domain/index.ts'
import type { Course, User } from '../../domain/index.ts'
import { getTeacherCourses } from '../../utils/teacher.ts'
import { fetchCourseStudents } from '../../services/courseService.ts'
import './CourseManage.css'

type Props = {
	user: User
	teacherCourseIds: string[]
	onBackToDashboard: () => void
	onGoCreateCourse: () => void
	onGoLessons: () => void
}

function levelClass(level: string) {
	if (level === 'Cơ bản') return 'teacher-level-badge teacher-level-basic'
	if (level === 'Trung cấp') return 'teacher-level-badge teacher-level-mid'
	return 'teacher-level-badge teacher-level-advanced'
}

function CourseManage({ user, teacherCourseIds, onBackToDashboard, onGoCreateCourse, onGoLessons }: Props) {
	const [query, setQuery] = useState('')
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editTitle, setEditTitle] = useState('')
	const [editLevel, setEditLevel] = useState<Course['level']>('Cơ bản')
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState('')
	const [isDeleting, setIsDeleting] = useState(false)
	const [studentListCourseId, setStudentListCourseId] = useState<string | null>(null)
	const [studentListCourseTitle, setStudentListCourseTitle] = useState('')
	const [studentList, setStudentList] = useState<User[]>([])
	const [isLoadingStudents, setIsLoadingStudents] = useState(false)

	const courses = getTeacherCourses(COURSES, user, teacherCourseIds)

	const filtered = useMemo(() => {
		if (!query.trim()) return courses
		return courses.filter((c) =>
			c.title.toLowerCase().includes(query.toLowerCase()),
		)
	}, [courses, query])

	const startEdit = (course: Course) => {
		setEditingId(course.id)
		setEditTitle(course.title)
		setEditLevel(course.level)
	}

	const saveEdit = async () => {
		if (!editingId) {
			return
		}

		const editingCourse = courses.find((course) => course.id === editingId)

		setIsSaving(true)
		setError('')

		try {
			await updateCourse(editingId, {
				title: editTitle,
				level: editLevel,
				description: editingCourse?.description ?? '',
			})
			setEditingId(null)
		} catch (saveError) {
			console.error('update course failed', saveError)
			if (axios.isAxiosError(saveError)) {
				const status = saveError.response?.status
				const payload = saveError.response?.data as { message?: string; error?: string } | undefined
				const detail = payload?.message || payload?.error || saveError.message

				if (status === 403) {
					setError(`Bạn không có quyền cập nhật khóa học này (${status}). ${detail}`)
				} else if (status === 400 || status === 422) {
					setError(`Dữ liệu cập nhật chưa hợp lệ (${status}). ${detail}`)
				} else {
					setError(`Không thể cập nhật khóa học (${status ?? 'network'}). ${detail}`)
				}
			} else {
				setError('Không thể cập nhật khóa học. Vui lòng thử lại.')
			}
		} finally {
			setIsSaving(false)
		}
	}

	const handleViewStudents = async (course: Course) => {
		setStudentListCourseId(course.id)
		setStudentListCourseTitle(course.title)
		setStudentList([])
		setIsLoadingStudents(true)
		setError('')

		try {
			const students = await fetchCourseStudents(course.id)
			setStudentList(students)
		} catch (viewError) {
			console.error('load course students failed', viewError)
			if (axios.isAxiosError(viewError)) {
				const status = viewError.response?.status
				const payload = viewError.response?.data as { message?: string; error?: string } | undefined
				const detail = payload?.message || payload?.error || viewError.message
				setError(`Không thể tải học viên đăng ký (${status ?? 'network'}). ${detail}`)
			} else {
				setError('Không thể tải học viên đăng ký. Vui lòng thử lại.')
			}
		} finally {
			setIsLoadingStudents(false)
		}
	}

	const handleDeleteCourse = async (courseId: string) => {
		if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này? Hành động không thể hoàn tác.')) {
			return
		}

		setIsDeleting(true)
		setError('')

		try {
			await deleteCourse(courseId)
		} catch (deleteError) {
			console.error('delete course failed', deleteError)
			if (axios.isAxiosError(deleteError)) {
				const status = deleteError.response?.status
				const payload = deleteError.response?.data as { message?: string; error?: string } | undefined
				const detail = payload?.message || payload?.error || deleteError.message

				if (status === 403) {
					setError(`Bạn không có quyền xóa khóa học này (${status}). ${detail}`)
				} else {
					setError(`Không thể xóa khóa học (${status ?? 'network'}). ${detail}`)
				}
			} else {
				setError('Không thể xóa khóa học. Vui lòng thử lại.')
			}
		} finally {
			setIsDeleting(false)
		}
	}

	const editingCourse = courses.find((c) => c.id === editingId)

	return (
		<section className="teacher-page">
			<div className="teacher-shell">
				<header className="teacher-header">
					<div>
						<h1 className="teacher-title">Quản lý khóa học</h1>
						<p className="teacher-subtitle">
							{courses.length} khóa học · Dữ liệu theo giảng viên
						</p>
					</div>
					<div className="teacher-toolbar">
						<button className="teacher-btn" onClick={onGoCreateCourse}>
							+ Tạo khóa học
						</button>
						<button className="teacher-btn ghost" onClick={onGoLessons}>
							Bài học
						</button>
						<button className="teacher-btn ghost" onClick={onBackToDashboard}>
							Về Dashboard
						</button>
					</div>
				</header>

				<div className="teacher-toolbar">
					<input
						className="teacher-input"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Tìm khóa học..."
					/>
				</div>

				{editingCourse && (
					<section className="teacher-edit-panel">
						<h4>Chỉnh sửa: {editingCourse.title}</h4>
						<div className="teacher-form-grid">
							<div>
								<label className="teacher-form-label">Tên khóa học</label>
								<input
									className="teacher-input teacher-input-full"
									value={editTitle}
									onChange={(e) => setEditTitle(e.target.value)}
								/>
							</div>
							<div>
								<label className="teacher-form-label">Trình độ</label>
								<select
									className="teacher-select teacher-input-full"
									value={editLevel}
									onChange={(e) =>
										setEditLevel(e.target.value as Course['level'])
									}
								>
									<option value="Cơ bản">Cơ bản</option>
									<option value="Trung cấp">Trung cấp</option>
									<option value="Nâng cao">Nâng cao</option>
								</select>
							</div>
						</div>
						<div className="teacher-actions">
							<button className="teacher-btn" onClick={() => void saveEdit()} disabled={isSaving}>
								{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
							</button>
							<button
								className="teacher-btn ghost"
								onClick={() => setEditingId(null)}
							>
								Hủy
							</button>
						</div>
					</section>
				)}

				<section className="teacher-panel">
					{error && <div className="teacher-list-meta" style={{ marginBottom: 12, color: '#dc2626' }}>{error}</div>}
					<table className="teacher-table">
						<thead>
							<tr>
								<th>Khóa học</th>
								<th>Danh mục</th>
								<th>Trình độ</th>
								<th>Bài học</th>
								<th>Học viên</th>
								<th>Giá (₫)</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{filtered.length === 0 && (
								<tr>
									<td colSpan={7} className="teacher-list-meta">Không có khóa học phù hợp với giảng viên hiện tại.</td>
								</tr>
							)}
							{filtered.map((course) => (
								<tr key={course.id}>
									<td>
										<span className="teacher-list-title">{course.title}</span>
										<div className="teacher-list-meta">{course.instructor}</div>
									</td>
									<td>
										<span
											className="teacher-badge"
											style={{ background: course.categoryColor }}
										>
											{course.category}
										</span>
									</td>
									<td>
										<span className={levelClass(course.level)}>
											{course.level}
										</span>
									</td>
									<td>{course.lessonCount ?? course.lessons.length}</td>
									<td>{course.studentCount.toLocaleString()}</td>
									<td>{course.price.toLocaleString()}</td>
									<td>
										<div className="teacher-actions">
											<button
												className="teacher-action-btn"
												onClick={() => void handleViewStudents(course)}
											>
												Học viên
											</button>
											<button
												className="teacher-action-btn"
												onClick={onGoLessons}
											>
												Bài học
											</button>
											<button
												className="teacher-action-btn"
												onClick={() => startEdit(course)}
											>
												Sửa nhanh
											</button>
											<button
												className="teacher-action-btn teacher-action-btn-danger"
												onClick={() => void handleDeleteCourse(course.id)}
												disabled={isDeleting}
											>
												Xóa
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</section>
				{studentListCourseId && (
					<section className="teacher-panel" style={{ marginTop: 20 }}>
						<div className="teacher-panel-head">
							<h3>Học viên đã đăng ký: {studentListCourseTitle}</h3>
							<button className="teacher-btn ghost" onClick={() => setStudentListCourseId(null)}>
								Đóng
							</button>
						</div>
						{isLoadingStudents ? (
							<p className="teacher-empty">Đang tải học viên đăng ký...</p>
						) : studentList.length > 0 ? (
							<div className="teacher-list">
								{studentList.map((student) => (
									<div key={student.id || student.email} className="teacher-list-item teacher-list-item-readonly">
										<div>
											<div className="teacher-list-title">{student.name}</div>
											<div className="teacher-list-meta">{student.email}</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="teacher-empty">Chưa có học viên đăng ký cho khóa học này.</p>
						)}
					</section>
				)}
			</div>
		</section>
	)
}

export default CourseManage
