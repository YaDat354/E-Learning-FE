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

	const completionRate = 68

	const stats = [
		{ label: 'Khóa học đang học', value: 3, note: '+1 so với tháng trước' },
		{ label: 'Bài đã hoàn thành', value: 12, note: 'Đạt 60% mục tiêu tháng' },
		{ label: 'Chuỗi học liên tiếp', value: '7 ngày', note: 'Cố gắng lên 10 ngày' },
	]

	const goals = [
		{ text: 'Hoàn thành 2 bài học mới trong khóa giao tiếp', done: true },
		{ text: 'Làm lại quiz TOEIC Part 5 để đạt trên 80%', done: false },
		{ text: 'Nộp 1 bài viết tiếng Anh cho giảng viên phản hồi', done: false },
	]

	const highlights = ['Top 20% học viên chăm chỉ', '5 quiz đạt trên 85%', '2 tuần liên tiếp đúng kế hoạch']

	return (
		<section className="student-page profile-page">
			<div className="student-shell">
				<header className="student-header">
					<div>
						<h1 className="student-title">Hồ sơ học viên</h1>
						<p className="student-subtitle">Theo dõi thông tin, mục tiêu và tiến độ học tiếng Anh</p>
					</div>
					<div className="student-toolbar">
						<button className="student-btn ghost" onClick={onBackToDashboard}>Về Dashboard</button>
						<button className="student-btn danger" onClick={onLogout}>Đăng xuất</button>
					</div>
				</header>

				<section className="student-profile-grid">
					<article className="student-profile-hero">
						<div className="student-profile-avatar">{initials}</div>
						<div className="student-profile-hero-content">
							<h2>Xin chào, {user.name}</h2>
							<p>{user.email}</p>
							<div className="student-profile-role-row">
								<span className="student-badge">{ROLE_LABELS[user.role]}</span>
								<span className="student-badge profile-active">Đang hoạt động</span>
								<span className="student-badge profile-verified">Đã xác minh</span>
							</div>
						</div>
						<div className="student-profile-hero-side">
							<span className="student-profile-progress-label">Tiến độ tổng thể</span>
							<strong>{completionRate}%</strong>
							<div className="student-progress">
								<div className="student-progress-fill" style={{ width: `${completionRate}%` }} />
							</div>
						</div>
					</article>

					<article className="student-panel">
						<h3>Tổng quan học tập</h3>
						<div className="student-profile-stats">
							{stats.map((item) => (
								<div className="student-profile-stat" key={item.label}>
									<span>{item.label}</span>
									<strong>{item.value}</strong>
									<small>{item.note}</small>
								</div>
							))}
						</div>
					</article>

					<article className="student-panel">
						<h3>Mục tiêu tuần này</h3>
						<ul className="student-profile-goals">
							{goals.map((goal) => (
								<li key={goal.text} className={goal.done ? 'done' : ''}>{goal.text}</li>
							))}
						</ul>
					</article>

					<article className="student-panel">
						<h3>Mốc nổi bật</h3>
						<div className="student-profile-highlights">
							{highlights.map((item) => (
								<div key={item} className="student-highlight-chip">{item}</div>
							))}
						</div>
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