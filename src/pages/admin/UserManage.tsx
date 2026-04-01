import { useMemo, useState } from 'react'
import { COURSES, ROLE_LABELS } from '../../data/mockData.ts'
import type { User } from '../../data/mockData.ts'
import './UserManage.css'

type Props = {
	onBackToDashboard: () => void
}

const MOCK_USERS: User[] = [
	{ name: 'Admin Hệ thống', email: 'admin@elearn.vn', role: 'admin' },
	{ name: 'Cô Mai Anh', email: 'maianh.teacher@elearn.vn', role: 'teacher' },
	{ name: 'Thầy Minh Đức', email: 'minhduc.teacher@elearn.vn', role: 'teacher' },
	{ name: 'Cô Lan Anh', email: 'lananh.teacher@elearn.vn', role: 'teacher' },
	{ name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', role: 'student' },
	{ name: 'Trần Thị B', email: 'tranthib@gmail.com', role: 'student' },
	{ name: 'Lê Minh C', email: 'leminc@gmail.com', role: 'student' },
	{ name: 'Phạm Thị D', email: 'phamthid@gmail.com', role: 'student' },
	{ name: 'Hoàng Văn E', email: 'hoangvane@gmail.com', role: 'student' },
]

const totalStudents = COURSES.reduce((sum, c) => sum + c.studentCount, 0)

function UserManage({ onBackToDashboard }: Props) {
	const [query, setQuery] = useState('')
	const [roleFilter, setRoleFilter] = useState<User['role'] | 'all'>('all')

	const filtered = useMemo(() => {
		return MOCK_USERS.filter((u) => {
			const matchQuery =
				!query.trim() ||
				u.name.toLowerCase().includes(query.toLowerCase()) ||
				u.email.toLowerCase().includes(query.toLowerCase())
			const matchRole = roleFilter === 'all' || u.role === roleFilter
			return matchQuery && matchRole
		})
	}, [query, roleFilter])

	const roleClass = (role: User['role']) => {
		if (role === 'admin') return 'admin-badge admin-role-admin'
		if (role === 'teacher') return 'admin-badge admin-role-teacher'
		return 'admin-badge admin-role-student'
	}

	return (
		<section className="admin-page">
			<div className="admin-shell">
				<header className="admin-header">
					<div>
						<h1 className="admin-title">Quản lý người dùng</h1>
						<p className="admin-subtitle">
							{MOCK_USERS.length} tài khoản · {totalStudents.toLocaleString()} học viên đăng ký
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
						style={{ minWidth: 240 }}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Tìm tên hoặc email..."
					/>
					<select
						className="admin-select"
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
					>
						<option value="all">Tất cả vai trò</option>
						<option value="admin">Quản trị viên</option>
						<option value="teacher">Giảng viên</option>
						<option value="student">Học viên</option>
					</select>
				</div>

				<section className="admin-panel">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Họ tên</th>
								<th>Email</th>
								<th>Vai trò</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((user) => (
								<tr key={user.email}>
									<td>
										<span className="admin-list-title">{user.name}</span>
									</td>
									<td className="admin-list-meta">{user.email}</td>
									<td>
										<span className={roleClass(user.role)}>
											{ROLE_LABELS[user.role]}
										</span>
									</td>
								</tr>
							))}
							{filtered.length === 0 && (
								<tr>
									<td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
										Không tìm thấy người dùng nào
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

export default UserManage