import { useEffect, useState } from 'react'
import { fetchCourses } from '../../domain/index.ts'
import './Dashboard.css'

type Props = {
	onGoStats: () => void
	onGoCourses: () => void
	onGoUsers: () => void
	onLogout: () => void
}

function Dashboard({ onGoStats, onGoCourses, onGoUsers, onLogout }: Props) {
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		let mounted = true

		const loadAdminData = async () => {
			setIsLoading(true)
			setError('')

			try {
				await fetchCourses()

				if (!mounted) {
					return
				}
			} catch (loadError) {
				console.error('load admin dashboard data failed', loadError)
				if (mounted) {
					setError('Không thể đồng bộ dữ liệu dashboard từ backend.')
				}
			} finally {
				if (mounted) {
					setIsLoading(false)
				}
			}
		}

		void loadAdminData()

		return () => {
			mounted = false
		}
	}, [])

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
						<h3>Điều hướng</h3>
						<div className="admin-stat">01</div>
						<p>Vào tab riêng để xem thống kê chi tiết</p>
					</div>
					<div className="admin-card">
						<h3>Khóa học</h3>
						<div className="admin-stat">02</div>
						<p>Quản lý và kiểm duyệt nội dung khóa học</p>
					</div>
					<div className="admin-card">
						<h3>Người dùng</h3>
						<div className="admin-stat">03</div>
						<p>Theo dõi tài khoản giảng viên và học viên</p>
					</div>
				</div>

				{isLoading && (
					<div className="admin-panel">
						<div className="admin-list-meta">Đang tải dữ liệu dashboard từ backend...</div>
					</div>
				)}
				{error && (
					<div className="admin-panel">
						<div className="admin-list-meta" style={{ color: '#dc2626' }}>{error}</div>
					</div>
				)}

				<div className="admin-nav-grid">
					<button className="admin-nav-box" onClick={onGoStats}>
						<h4>Thống kê hệ thống</h4>
						<p>Xem biểu đồ cột và các chỉ số tổng hợp</p>
					</button>
					<button className="admin-nav-box" onClick={onGoCourses}>
						<h4>Quản lý khóa học</h4>
						<p>Xem, theo dõi và kiểm duyệt danh sách khóa học</p>
					</button>
					<button className="admin-nav-box" onClick={onGoUsers}>
						<h4>Quản lý người dùng</h4>
						<p>Xem danh sách học viên và giảng viên</p>
					</button>
				</div>
			</div>
		</section>
	)
}

export default Dashboard