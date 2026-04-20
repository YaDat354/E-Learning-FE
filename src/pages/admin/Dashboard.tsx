import { useMemo } from 'react'
import { COURSES } from '../../data/mockData.ts'
import './Dashboard.css'

type Props = {
	onGoCourses: () => void
	onGoUsers: () => void
	onLogout: () => void
}

function Dashboard({ onGoCourses, onGoUsers, onLogout }: Props) {
	const totalCourses = COURSES.length
	const totalLessons = useMemo(
		() => COURSES.reduce((sum, c) => sum + c.lessons.length, 0),
		[]
	)
	const totalStudents = useMemo(
		() => COURSES.reduce((sum, c) => sum + c.studentCount, 0),
		[]
	)

	return (
		<section className="admin-page">
			<div className="admin-shell">
				<header className="admin-header">
					<div>
						<h1 className="admin-title">Bảng điều khiển Admin</h1>
						<p className="admin-subtitle">
							Quản lý toàn bộ hệ thống học trực tuyến
						</p>
					</div>
					<div className="admin-toolbar">
						<button className="admin-btn ghost" onClick={onLogout}>
							Đăng xuất
						</button>
					</div>
				</header>

				<div className="admin-grid">
					<div className="admin-card">
						<h3>Khóa học</h3>
						<div className="admin-stat">{totalCourses}</div>
						<p>Tổng số khóa học trong hệ thống</p>
					</div>
					<div className="admin-card">
						<h3>Bài học</h3>
						<div className="admin-stat">{totalLessons}</div>
						<p>Tổng số bài học đang có</p>
					</div>
					<div className="admin-card">
						<h3>Học viên</h3>
						<div className="admin-stat">{totalStudents.toLocaleString()}</div>
						<p>Lượt đăng ký tích lũy</p>
					</div>
				</div>

				<div className="admin-nav-grid">
					<button className="admin-nav-box" onClick={onGoCourses}>
						<h4>Quản lý khóa học</h4>
						<p>Xem, theo dõi và kiểm duyệt danh sách khóa học</p>
					</button>
					<button className="admin-nav-box" onClick={onGoUsers}>
						<h4>Quản lý người dùng</h4>
						<p>Xem danh sách học viên và giảng viên</p>
					</button>
				</div>

				<section className="admin-panel">
					<h3>Danh sách khóa học</h3>
					<table className="admin-table">
						<thead>
							<tr>
								<th>Khóa học</th>
								<th>Danh mục</th>
								<th>Giảng viên</th>
								<th>Bài học</th>
								<th>Học viên</th>
								<th>Giá (₫)</th>
							</tr>
						</thead>
						<tbody>
							{COURSES.map((course) => (
								<tr key={course.id}>
									<td>
										<span className="admin-list-title">{course.title}</span>
									</td>
									<td>
										<span
											className="admin-badge"
											style={{ background: course.categoryColor }}
										>
											{course.category}
										</span>
									</td>
									<td className="admin-list-meta">{course.instructor}</td>
									<td>{course.lessons.length}</td>
									<td>{course.studentCount.toLocaleString()}</td>
									<td>{course.price.toLocaleString()}</td>
								</tr>
							))}
						</tbody>
					</table>
				</section>
			</div>
		</section>
	)
}

export default Dashboard