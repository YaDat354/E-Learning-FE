import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { ROLE_LABELS } from '../../domain/index.ts'
import type { User } from '../../domain/index.ts'
import { getMe, updateMe } from '../../services/userService.ts'
import './Profile.css'

type ProfileProps = {
	user: User
	onUserUpdated?: (user: User) => void
	onLogout: () => void
	onBackToDashboard: () => void
	onOpenResults: () => void
}

function Profile({ user, onUserUpdated, onLogout, onBackToDashboard, onOpenResults }: ProfileProps) {
	const [fullName, setFullName] = useState(user.name)
	const [avatar, setAvatar] = useState('')
	const [email, setEmail] = useState(user.email)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')

	useEffect(() => {
		let mounted = true

		const loadProfile = async () => {
			setIsLoading(true)
			setError('')
			try {
				const profile = await getMe()
				if (mounted) {
					setFullName(profile.name)
					setEmail(profile.email)
					setAvatar(profile.avatar ?? '')
					onUserUpdated?.({
						id: profile.id,
						name: profile.name,
						email: profile.email,
						role: profile.role,
					})
				}
			} catch (loadError) {
				if (mounted) {
					if (axios.isAxiosError(loadError) && loadError.response?.status === 401) {
						setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
					} else {
						setError('Không thể tải hồ sơ từ backend.')
					}
				}
			} finally {
				if (mounted) {
					setIsLoading(false)
				}
			}
		}

		void loadProfile()

		return () => {
			mounted = false
		}
	}, [onUserUpdated])

	const initials = fullName
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
	const avatarPreview = useMemo(() => {
		if (avatar.trim().length === 0) {
			return ''
		}

		return avatar.trim()
	}, [avatar])

	const handleSaveProfile = async () => {
		const trimmedName = fullName.trim()
		const trimmedAvatar = avatar.trim()

		if (!trimmedName) {
			setError('Họ tên không được để trống.')
			setSuccess('')
			return
		}

		setIsSaving(true)
		setError('')
		setSuccess('')

		try {
			const updated = await updateMe({
				fullName: trimmedName,
				avatar: trimmedAvatar || undefined,
			})

			setFullName(updated.name)
			setEmail(updated.email)
			setAvatar(updated.avatar ?? '')
			onUserUpdated?.({
				id: updated.id,
				name: updated.name,
				email: updated.email,
				role: updated.role,
			})
			setSuccess('Cập nhật hồ sơ thành công.')
		} catch (saveError) {
			if (axios.isAxiosError(saveError) && saveError.response?.status === 400) {
				setError('Dữ liệu hồ sơ chưa hợp lệ. Vui lòng kiểm tra lại.')
			} else {
				setError('Không thể cập nhật hồ sơ. Vui lòng thử lại.')
			}
		} finally {
			setIsSaving(false)
		}
	}

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
						<button className="student-btn ghost" onClick={onOpenResults}>Kết quả học tập</button>
						<button className="student-btn danger" onClick={onLogout}>Đăng xuất</button>
					</div>
				</header>

				<section className="student-profile-grid">
					<article className="student-profile-hero">
						{avatarPreview ? (
							<img src={avatarPreview} alt={fullName} className="student-profile-avatar-image" />
						) : (
							<div className="student-profile-avatar">{initials}</div>
						)}
						<div className="student-profile-hero-content">
							<h2>Xin chào, {fullName}</h2>
							<p>{email}</p>
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
						<h3>Cập nhật hồ sơ</h3>
						{isLoading && <div className="profile-message">Đang tải hồ sơ...</div>}
						{error && <div className="profile-message error">{error}</div>}
						{success && <div className="profile-message success">{success}</div>}
						<div className="profile-form">
							<label className="profile-label" htmlFor="student-full-name">Họ tên</label>
							<input
								id="student-full-name"
								className="profile-input"
								value={fullName}
								onChange={(event) => setFullName(event.target.value)}
								placeholder="Nhập họ và tên"
								disabled={isLoading || isSaving}
							/>

							<label className="profile-label" htmlFor="student-avatar">Avatar URL</label>
							<input
								id="student-avatar"
								className="profile-input"
								value={avatar}
								onChange={(event) => setAvatar(event.target.value)}
								placeholder="https://..."
								disabled={isLoading || isSaving}
							/>

							<label className="profile-label" htmlFor="student-email">Email</label>
							<input
								id="student-email"
								className="profile-input"
								value={email}
								readOnly
								disabled
							/>

							<button
								className="student-btn"
								type="button"
								onClick={() => void handleSaveProfile()}
								disabled={isLoading || isSaving}
							>
								{isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
							</button>
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
									<div className="student-list-meta">{fullName}</div>
								</div>
							</div>
							<div className="student-list-item">
								<div>
									<div className="student-list-title">Email</div>
									<div className="student-list-meta">{email}</div>
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