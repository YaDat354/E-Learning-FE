import { useMemo, useState } from 'react'
import { COURSES, ROLE_LABELS } from '../../data/mockData.ts'
import type { User } from '../../data/mockData.ts'
import './UserManage.css'

type Props = {
	onBackToDashboard: () => void
}

const INITIAL_USERS: User[] = [
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
	const [users, setUsers] = useState<User[]>(INITIAL_USERS)
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [role, setRole] = useState<User['role']>('student')
	const [editingEmail, setEditingEmail] = useState<string | null>(null)

	const isEditing = Boolean(editingEmail)

	const resetForm = () => {
		setName('')
		setEmail('')
		setRole('student')
		setEditingEmail(null)
	}

	const isEmailUsed = (value: string, exceptEmail?: string | null) =>
		users.some((user) => user.email.toLowerCase() === value.toLowerCase() && user.email !== exceptEmail)

	const handleCreate = () => {
		const normalizedName = name.trim()
		const normalizedEmail = email.trim().toLowerCase()

		if (!normalizedName || !normalizedEmail) {
			alert('Vui lòng nhập họ tên và email')
			return
		}

		if (isEmailUsed(normalizedEmail)) {
			alert('Email đã tồn tại')
			return
		}

		const newUser: User = {
			name: normalizedName,
			email: normalizedEmail,
			role,
		}

		setUsers((prev) => [newUser, ...prev])
		resetForm()
	}

	const startEdit = (user: User) => {
		setEditingEmail(user.email)
		setName(user.name)
		setEmail(user.email)
		setRole(user.role)
	}

	const handleSaveEdit = () => {
		if (!editingEmail) {
			return
		}

		const normalizedName = name.trim()
		const normalizedEmail = email.trim().toLowerCase()

		if (!normalizedName || !normalizedEmail) {
			alert('Vui lòng nhập họ tên và email')
			return
		}

		if (isEmailUsed(normalizedEmail, editingEmail)) {
			alert('Email đã tồn tại')
			return
		}

		setUsers((prev) =>
			prev.map((user) =>
				user.email === editingEmail
					? { name: normalizedName, email: normalizedEmail, role }
					: user,
			),
		)
		resetForm()
	}

	const handleDelete = (user: User) => {
		if (user.role === 'admin') {
			const adminCount = users.filter((item) => item.role === 'admin').length
			if (adminCount <= 1) {
				alert('Phải còn ít nhất 1 tài khoản admin')
				return
			}
		}

		const isConfirmed = window.confirm(`Xóa người dùng "${user.name}"?`)
		if (!isConfirmed) {
			return
		}

		setUsers((prev) => prev.filter((item) => item.email !== user.email))
		if (editingEmail === user.email) {
			resetForm()
		}
	}

	const filtered = useMemo(() => {
		return users.filter((u) => {
			const matchQuery =
				!query.trim() ||
				u.name.toLowerCase().includes(query.toLowerCase()) ||
				u.email.toLowerCase().includes(query.toLowerCase())
			return matchQuery
		})
	}, [query, users])

	const adminUsers = useMemo(
		() => filtered.filter((user) => user.role === 'admin'),
		[filtered]
	)

	const teacherUsers = useMemo(
		() => filtered.filter((user) => user.role === 'teacher'),
		[filtered]
	)

	const studentUsers = useMemo(
		() => filtered.filter((user) => user.role === 'student'),
		[filtered]
	)

	const teacherCourseMap = useMemo(() => {
		const counts = new Map<string, number>()
		for (const course of COURSES) {
			counts.set(course.instructor, (counts.get(course.instructor) ?? 0) + 1)
		}
		return counts
	}, [])

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
							{teacherUsers.length} giảng viên · {studentUsers.length} học viên · {totalStudents.toLocaleString()} lượt đăng ký
						</p>
					</div>
					<div className="admin-toolbar">
						<button className="admin-btn ghost" onClick={onBackToDashboard}>
							Về Dashboard
						</button>
					</div>
				</header>

				<section className="admin-edit-panel">
					<h4>{isEditing ? 'Sửa người dùng' : 'Thêm người dùng mới'}</h4>
					<div className="admin-form-grid" style={{ marginBottom: 12 }}>
						<div>
							<label className="admin-form-label">Họ tên</label>
							<input
								className="admin-input admin-input-full"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="VD: Nguyễn Văn A"
							/>
						</div>
						<div>
							<label className="admin-form-label">Email</label>
							<input
								className="admin-input admin-input-full"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="example@domain.com"
							/>
						</div>
						<div>
							<label className="admin-form-label">Vai trò</label>
							<select
								className="admin-select admin-input-full"
								value={role}
								onChange={(e) => setRole(e.target.value as User['role'])}
							>
								<option value="student">Học viên</option>
								<option value="teacher">Giảng viên</option>
								<option value="admin">Quản trị viên</option>
							</select>
						</div>
					</div>
					<div className="admin-actions">
						<button className="admin-btn" onClick={isEditing ? handleSaveEdit : handleCreate}>
							{isEditing ? 'Lưu thay đổi' : 'Thêm người dùng'}
						</button>
						<button className="admin-btn ghost" onClick={resetForm}>
							Làm mới form
						</button>
					</div>
				</section>

				<div className="admin-toolbar">
					<input
						className="admin-input"
						style={{ minWidth: 320 }}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Tìm tên hoặc email..."
					/>
				</div>

				{adminUsers.length > 0 && (
					<section className="admin-panel">
						<h3>Tài khoản quản trị</h3>
						<table className="admin-table">
							<thead>
								<tr>
									<th>Họ tên</th>
									<th>Email</th>
									<th>Vai trò</th>
									<th>Hành động</th>
								</tr>
							</thead>
							<tbody>
								{adminUsers.map((user) => (
									<tr key={user.email}>
										<td>
											<span className="admin-list-title">{user.name}</span>
										</td>
										<td className="admin-list-meta">{user.email}</td>
										<td>
											<span className={roleClass(user.role)}>{ROLE_LABELS[user.role]}</span>
										</td>
										<td>
											<div className="admin-actions">
												<button className="admin-action-btn" onClick={() => startEdit(user)}>Sửa</button>
												<button className="admin-action-btn" onClick={() => handleDelete(user)}>Xóa</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</section>
				)}

				<div className="admin-user-grid">
					<section className="admin-panel">
						<h3>Giảng viên ({teacherUsers.length})</h3>
						<table className="admin-table">
							<thead>
								<tr>
									<th>Họ tên</th>
									<th>Email</th>
									<th>Khóa học phụ trách</th>
									<th>Hành động</th>
								</tr>
							</thead>
							<tbody>
								{teacherUsers.map((user) => (
									<tr key={user.email}>
										<td>
											<span className="admin-list-title">{user.name}</span>
										</td>
										<td className="admin-list-meta">{user.email}</td>
										<td>{teacherCourseMap.get(user.name) ?? 0}</td>
										<td>
											<div className="admin-actions">
												<button className="admin-action-btn" onClick={() => startEdit(user)}>Sửa</button>
												<button className="admin-action-btn" onClick={() => handleDelete(user)}>Xóa</button>
											</div>
										</td>
									</tr>
								))}
								{teacherUsers.length === 0 && (
									<tr>
										<td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>
											Không có giảng viên phù hợp bộ lọc
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</section>

					<section className="admin-panel">
						<h3>Học viên ({studentUsers.length})</h3>
						<table className="admin-table">
							<thead>
								<tr>
									<th>Họ tên</th>
									<th>Email</th>
									<th>Vai trò</th>
									<th>Hành động</th>
								</tr>
							</thead>
							<tbody>
								{studentUsers.map((user) => (
									<tr key={user.email}>
										<td>
											<span className="admin-list-title">{user.name}</span>
										</td>
										<td className="admin-list-meta">{user.email}</td>
										<td>
											<span className={roleClass(user.role)}>{ROLE_LABELS[user.role]}</span>
										</td>
										<td>
											<div className="admin-actions">
												<button className="admin-action-btn" onClick={() => startEdit(user)}>Sửa</button>
												<button className="admin-action-btn" onClick={() => handleDelete(user)}>Xóa</button>
											</div>
										</td>
									</tr>
								))}
								{studentUsers.length === 0 && (
									<tr>
										<td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>
											Không có học viên phù hợp bộ lọc
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</section>
				</div>

				{filtered.length === 0 && (
					<section className="admin-panel">
						<p style={{ textAlign: 'center', color: '#94a3b8', margin: 0 }}>Không tìm thấy người dùng nào</p>
					</section>
				)}
			</div>
		</section>
	)
}

export default UserManage