import { useMemo, useState } from 'react'
import { COURSES } from '../../data/mockData.ts'
import type { Course } from '../../data/mockData.ts'
import './CourseManage.css'

type Props = {
	onBackToDashboard: () => void
	onCreateCourse: () => void
	onEditCourse: (courseId: string) => void
}

function CourseManage({ onBackToDashboard, onCreateCourse, onEditCourse }: Props) {
	const [query, setQuery] = useState('')
	const [courses, setCourses] = useState<Course[]>(COURSES)
	const [deletingId, setDeletingId] = useState<string | null>(null)

	const filtered = useMemo(() => {
		if (!query.trim()) return courses
		return courses.filter((c) =>
			c.title.toLowerCase().includes(query.toLowerCase()) ||
			c.instructor.toLowerCase().includes(query.toLowerCase())
		)
	}, [courses, query])

	const handleDelete = (courseId: string) => {
		if (deletingId === courseId) {
			setCourses((prev) => prev.filter((c) => c.id !== courseId))
			setDeletingId(null)
		} else {
			setDeletingId(courseId)
		}
	}

	return (
		<section className="admin-page">
			<div className="admin-shell">
				<header className="admin-header">
					<div>
						<h1 className="admin-title">Quản lý khóa học</h1>
						<p className="admin-subtitle">
							{courses.length} khóa học · Toàn bộ hệ thống
						</p>
					</div>
					<div className="admin-toolbar">
						<button className="admin-btn" onClick={onCreateCourse}>
							+ Tạo khóa học
						</button>
						<button className="admin-btn ghost" onClick={onBackToDashboard}>
							Về Dashboard
						</button>
					</div>
				</header>

				<div className="admin-toolbar">
					<input
						className="admin-input"
						style={{ minWidth: 260 }}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Tìm khóa học hoặc giảng viên..."
					/>
				</div>

				<section className="admin-panel">
					<table className="admin-table">
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
										<span className="admin-list-title">{course.title}</span>
										<div className="admin-list-meta">{course.instructor}</div>
									</td>
									<td>
										<span
											className="admin-badge"
											style={{ background: course.categoryColor }}
										>
											{course.category}
										</span>
									</td>
									<td style={{ fontSize: 13, color: '#475569' }}>
										{course.level}
									</td>
									<td>{course.lessons.length}</td>
									<td>{course.studentCount.toLocaleString()}</td>
									<td>{course.price.toLocaleString()}</td>
									<td>
										<div className="admin-actions">
											<button
												className="admin-action-btn"
												onClick={() => onEditCourse(course.id)}
											>
												Chỉnh sửa
											</button>
											<button
												className="admin-action-btn"
												style={
													deletingId === course.id
														? { background: '#fef2f2', borderColor: '#ef4444', color: '#ef4444' }
														: {}
												}
												onClick={() => handleDelete(course.id)}
											>
												{deletingId === course.id ? 'Xác nhận xóa' : 'Xóa'}
											</button>
											{deletingId === course.id && (
												<button
													className="admin-action-btn"
													onClick={() => setDeletingId(null)}
												>
													Hủy
												</button>
											)}
										</div>
									</td>
								</tr>
							))}
							{filtered.length === 0 && (
								<tr>
									<td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
										Không tìm thấy khóa học nào
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</section>
			</div>
		</section>
	)
}

export default CourseManage