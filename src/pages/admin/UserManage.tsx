import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Edit2, Trash2 } from 'lucide-react'
import { COURSES, ROLE_LABELS, fetchCourses } from '../../domain/index.ts'
import type { User } from '../../domain/index.ts'
import { createAdminUser, deleteAdminUser, getAdminUsers, updateAdminUser } from '../../services/userService.ts'
import './UserManage.css'

type Props = {
	onBackToDashboard: () => void
}

function UserManage({ onBackToDashboard }: Props) {
	const [query, setQuery] = useState('')
	const [users, setUsers] = useState<User[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState('')
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [role, setRole] = useState<User['role']>('student')
	const [editingUserId, setEditingUserId] = useState<string | null>(null)

	const isEditing = Boolean(editingUserId)
	const totalStudents = useMemo(() => COURSES.reduce((sum, c) => sum + c.studentCount, 0), [])

	useEffect(() => {
		let mounted = true

		const loadData = async () => {
			setIsLoading(true)
			setError('')

			try {
				const [courses, apiUsers] = await Promise.all([
					fetchCourses(),
					getAdminUsers(),
				])

				if (!mounted) {
					return
				}

				setUsers(apiUsers)
				if (courses.length >= 0) {
					// Trigger render for teacher course counters that rely on COURSES.
					setUsers((prev) => [...prev])
				}
			} catch (loadError) {
				console.error('load admin users failed', loadError)
				if (mounted) {
					setError('Không thể tải danh sách người dùng từ backend.')
				}
			} finally {
				if (mounted) {
					setIsLoading(false)
				}
			}
		}

		void loadData()

		return () => {
			mounted = false
		}
	}, [])

	const resetForm = () => {
		setName('')
		setEmail('')
		setRole('student')
		setEditingUserId(null)
	}

	const isEmailUsed = (value: string, exceptEmail?: string | null) =>
		users.some((user) => user.email.toLowerCase() === value.toLowerCase() && user.email !== exceptEmail)

	const handleCreate = async () => {
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

		setIsSaving(true)
		setError('')
		try {
			const created = await createAdminUser({
				name: normalizedName,
				email: normalizedEmail,
				role,
			})
			setUsers((prev) => [created, ...prev])
			resetForm()
		} catch (createError) {
			if (axios.isAxiosError(createError)) {
				setError(createError.response?.data?.message ?? 'Không thể tạo người dùng.')
			} else {
				setError('Không thể tạo người dùng.')
			}
		} finally {
			setIsSaving(false)
		}
	}

	const startEdit = (user: User) => {
		if (!user.id) {
			alert('Không tìm thấy userId để sửa người dùng này')
			return
		}

		setEditingUserId(user.id)
		setName(user.name)
		setEmail(user.email)
		setRole(user.role)
	}

	const handleSaveEdit = async () => {
		if (!editingUserId) {
			return
		}

		const normalizedName = name.trim()
		const normalizedEmail = email.trim().toLowerCase()

		if (!normalizedName || !normalizedEmail) {
			alert('Vui lòng nhập họ tên và email')
			return
		}

		if (isEmailUsed(normalizedEmail, users.find((user) => user.id === editingUserId)?.email ?? null)) {
			alert('Email đã tồn tại')
			return
		}

		setIsSaving(true)
		setError('')
		try {
			const updated = await updateAdminUser(editingUserId, {
				name: normalizedName,
				email: normalizedEmail,
				role,
			})

			setUsers((prev) =>
				prev.map((user) =>
					user.id === editingUserId
						? updated
						: user,
				),
			)
			resetForm()
		} catch (updateError) {
			if (axios.isAxiosError(updateError)) {
				setError(updateError.response?.data?.message ?? 'Không thể cập nhật người dùng.')
			} else {
				setError('Không thể cập nhật người dùng.')
			}
		} finally {
			setIsSaving(false)
		}
	}

	const handleDelete = async (user: User) => {
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

		setIsSaving(true)
		setError('')
		try {
			if (!user.id) {
				throw new Error('userId is required')
			}

			await deleteAdminUser(user.id)
			setUsers((prev) => prev.filter((item) => item.id !== user.id))
			if (editingUserId === user.id) {
				resetForm()
			}
		} catch (deleteError) {
			if (axios.isAxiosError(deleteError)) {
				setError(deleteError.response?.data?.message ?? 'Không thể xóa người dùng.')
			} else {
				setError('Không thể xóa người dùng.')
			}
		} finally {
			setIsSaving(false)
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
			const byEmail = (course.instructorEmail ?? '').trim().toLowerCase()
			if (byEmail) {
				counts.set(byEmail, (counts.get(byEmail) ?? 0) + 1)
				continue
			}

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

				{isLoading && (
					<section className="admin-panel">
						<p style={{ margin: 0, color: '#64748b' }}>Đang tải dữ liệu người dùng từ backend...</p>
					</section>
				)}
				{error && (
					<section className="admin-panel">
						<p style={{ margin: 0, color: '#dc2626' }}>{error}</p>
					</section>
				)}

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
						<button className="admin-btn" onClick={isEditing ? () => void handleSaveEdit() : () => void handleCreate()} disabled={isSaving || isLoading}>
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
									<tr key={user.id ?? user.email}>
										<td>
											<span className="admin-list-title">{user.name}</span>
										</td>
										<td className="admin-list-meta">{user.email}</td>
										<td>
											<span className={roleClass(user.role)}>{ROLE_LABELS[user.role]}</span>
										</td>
										<td>
											<div className="admin-actions">
												<button className="admin-action-btn" onClick={() => startEdit(user)} title="Sửa">
													<Edit2 size={18} />
												</button>
												<button className="admin-action-btn" onClick={() => void handleDelete(user)} title="Xóa" disabled={isSaving || isLoading}>
													<Trash2 size={18} />
												</button>
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
									<tr key={user.id ?? user.email}>
										<td>
											<span className="admin-list-title">{user.name}</span>
										</td>
										<td className="admin-list-meta">{user.email}</td>
										<td>{teacherCourseMap.get(user.email.toLowerCase()) ?? teacherCourseMap.get(user.name) ?? 0}</td>
										<td>
											<div className="admin-actions">
												<button className="admin-action-btn" onClick={() => startEdit(user)} title="Sửa">
													<Edit2 size={18} />
												</button>
												<button className="admin-action-btn" onClick={() => void handleDelete(user)} title="Xóa" disabled={isSaving || isLoading}>
													<Trash2 size={18} />
												</button>
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
									<tr key={user.id ?? user.email}>
										<td>
											<span className="admin-list-title">{user.name}</span>
										</td>
										<td className="admin-list-meta">{user.email}</td>
										<td>
											<span className={roleClass(user.role)}>{ROLE_LABELS[user.role]}</span>
										</td>
										<td>
											<div className="admin-actions">
											<button className="admin-action-btn" onClick={() => startEdit(user)} title="Sửa">
												<Edit2 size={18} />
											</button>
											<button className="admin-action-btn" onClick={() => void handleDelete(user)} title="Xóa" disabled={isSaving || isLoading}>
												<Trash2 size={18} />
											</button>
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