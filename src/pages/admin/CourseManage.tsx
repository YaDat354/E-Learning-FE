import { useEffect, useMemo, useState } from 'react'
import { COURSES, fetchCourses } from '../../domain/index.ts'
import './CourseManage.css'

type Props = {
	onBackToDashboard: () => void
}

function CourseManage({ onBackToDashboard }: Props) {
	const [query, setQuery] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		let mounted = true

		const loadCourses = async () => {
			setIsLoading(true)
			setError('')

			try {
				await fetchCourses()
			} catch (loadError) {
				console.error('load admin courses failed', loadError)
				if (mounted) {
					setError('Không thể tải danh sách khóa học từ backend.')
				}
			} finally {
				if (mounted) {
					setIsLoading(false)
				}
			}
		}

		void loadCourses()

		return () => {
			mounted = false
		}
	}, [])

	const filtered = useMemo(() => {
		if (!query.trim()) return COURSES
		return COURSES.filter((c) =>
			c.title.toLowerCase().includes(query.toLowerCase()) ||
			c.instructor.toLowerCase().includes(query.toLowerCase())
		)
	}, [query])

	return (
		<section className="admin-page">
			<div className="admin-shell">
				<header className="admin-header">
					<div>
						<h1 className="admin-title">Quản lý khóa học</h1>
						<p className="admin-subtitle">
							{COURSES.length} khóa học · Admin theo dõi và kiểm duyệt
						</p>
					</div>
					<div className="admin-toolbar">
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
					{isLoading && <div className="admin-list-meta" style={{ marginBottom: 10 }}>Đang tải khóa học từ backend...</div>}
					{error && <div className="admin-list-meta" style={{ marginBottom: 10, color: '#dc2626' }}>{error}</div>}
					<table className="admin-table">
						<thead>
							<tr>
								<th>Khóa học</th>
								<th>Danh mục</th>
								<th>Trình độ</th>
								<th>Bài học</th>
								<th>Học viên</th>
								<th>Giá (₫)</th>
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
									<td>{course.lessonCount ?? course.lessons.length}</td>
									<td>{course.studentCount.toLocaleString()}</td>
									<td>{course.price.toLocaleString()}</td>
								</tr>
							))}
							{filtered.length === 0 && (
								<tr>
									<td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
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