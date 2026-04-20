import { useMemo, useState } from 'react'
import { COURSES } from '../../data/mockData.ts'
import type { Course } from '../../data/mockData.ts'
import './CourseManage.css'

type Props = {
	onBackToDashboard: () => void
	onGoCreateCourse: () => void
	onGoLessons: () => void
}

function levelClass(level: string) {
	if (level === 'Cơ bản') return 'teacher-level-badge teacher-level-basic'
	if (level === 'Trung cấp') return 'teacher-level-badge teacher-level-mid'
	return 'teacher-level-badge teacher-level-advanced'
}

function CourseManage({ onBackToDashboard, onGoCreateCourse, onGoLessons }: Props) {
	const [query, setQuery] = useState('')
	const [courses, setCourses] = useState<Course[]>(COURSES)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editTitle, setEditTitle] = useState('')
	const [editPrice, setEditPrice] = useState(0)
	const [editLevel, setEditLevel] = useState<Course['level']>('Cơ bản')

	const filtered = useMemo(() => {
		if (!query.trim()) return courses
		return courses.filter((c) =>
			c.title.toLowerCase().includes(query.toLowerCase()),
		)
	}, [courses, query])

	const startEdit = (course: Course) => {
		setEditingId(course.id)
		setEditTitle(course.title)
		setEditPrice(course.price)
		setEditLevel(course.level)
	}

	const saveEdit = () => {
		setCourses((prev) =>
			prev.map((c) =>
				c.id === editingId
					? { ...c, title: editTitle, price: editPrice, level: editLevel }
					: c,
			),
		)
		setEditingId(null)
	}

	const editingCourse = courses.find((c) => c.id === editingId)

	return (
		<section className="teacher-page">
			<div className="teacher-shell">
				<header className="teacher-header">
					<div>
						<h1 className="teacher-title">Quản lý khóa học</h1>
						<p className="teacher-subtitle">
							{courses.length} khóa học · Toàn bộ danh sách
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
								<label className="teacher-form-label">Giá (₫)</label>
								<input
									className="teacher-input teacher-input-full"
									type="number"
									value={editPrice}
									onChange={(e) => setEditPrice(Number(e.target.value))}
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
							<button className="teacher-btn" onClick={saveEdit}>
								Lưu thay đổi
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
									<td>{course.lessons.length}</td>
									<td>{course.studentCount.toLocaleString()}</td>
									<td>{course.price.toLocaleString()}</td>
									<td>
										<div className="teacher-actions">
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
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</section>
			</div>
		</section>
	)
}

export default CourseManage
