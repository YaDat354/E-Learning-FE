import { ROLE_LABELS } from '../../data/mockData.ts'
import type { User } from '../../data/mockData.ts'
import './Profile.css'

type ProfileProps = {
	user: User
	onLogout: () => void
	onBackToDashboard: () => void
}

function Profile({ user, onLogout, onBackToDashboard }: ProfileProps) {
	const initials = user.name
		.split(' ')
		.map((item) => item[0])
		.join('')
		.slice(0, 2)
		.toUpperCase()

	return (
		<section className="student-page">
			<div className="student-shell">
				<header className="student-header">
					<div>
						<h1 className="student-title">Hồ sơ học viên</h1>
						<p className="student-subtitle">Theo dõi thông tin, mục tiêu và tiến độ học tiếng Anh</p>
					</div>
					<div className="student-toolbar">
						<button className="student-btn ghost" onClick={onBackToDashboard}>Về Dashboard</button>
						<button className="student-btn ghost" onClick={onLogout}>Đăng xuất</button>
					</div>
				</header>

				<section className="student-profile-grid">
					<article className="student-profile-hero">
						<div className="student-profile-avatar">{initials}</div>
						<div>
							<h2>{user.name}</h2>
							<p>{user.email}</p>
							<div className="student-profile-role-row">
								<span className="student-badge">{ROLE_LABELS[user.role]}</span>
								<span className="student-badge profile-active">Đang hoạt động</span>
							</div>
						</div>
					</article>

					<article className="student-panel">
						<h3>Tiến độ học tập</h3>
						<div className="student-profile-stats">
							<div className="student-profile-stat">
								<span>Khóa học đang học</span>
								<strong>3</strong>
							</div>
							<div className="student-profile-stat">
								<span>Bài đã hoàn thành</span>
								<strong>12</strong>
							</div>
							<div className="student-profile-stat">
								<span>Chuỗi học liên tiếp</span>
								<strong>7 ngày</strong>
							</div>
						</div>
					</article>

					<article className="student-panel">
						<h3>Mục tiêu tuần này</h3>
						<ul className="student-profile-goals">
							<li>Hoàn thành 2 bài học mới trong khóa giao tiếp</li>
							<li>Làm lại quiz TOEIC Part 5 để đạt trên 80%</li>
							<li>Nộp 1 bài viết tiếng Anh cho giảng viên phản hồi</li>
						</ul>
					</article>

					<article className="student-panel">
						<h3>Thông tin tài khoản</h3>
						<div className="student-list">
							<div className="student-list-item">
								<div>
									<div className="student-list-title">Họ tên</div>
									<div className="student-list-meta">{user.name}</div>
								</div>
							</div>
							<div className="student-list-item">
								<div>
									<div className="student-list-title">Email</div>
									<div className="student-list-meta">{user.email}</div>
								</div>
							</div>
							<div className="student-list-item">
								<div>
									<div className="student-list-title">Vai trò</div>
									<div className="student-list-meta">{ROLE_LABELS[user.role]}</div>
								</div>
							</div>
						</div>
					</article>
				</section>
			</div>
		</section>
	)
}

export default Profile