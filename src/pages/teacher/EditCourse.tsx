import { useState, useMemo } from 'react'
import { COURSES } from '../../data/mockData.ts'
import type { Course } from '../../data/mockData.ts'
import '../admin/Dashboard.css'

type Props = {
	courseId?: string
	onBackToDashboard: () => void
	onUpdated?: (course: Course) => void
}

function EditCourse({ courseId = '', onBackToDashboard, onUpdated }: Props) {
	const course = useMemo(
		() => COURSES.find((c) => c.id === courseId),
		[courseId]
	)

	const [title, setTitle] = useState(course?.title || '')
	const [description, setDescription] = useState(course?.description || '')
	const [category, setCategory] = useState(course?.category || 'Giao tiếp')
	const [level, setLevel] = useState<Course['level']>(
		(course?.level as Course['level']) || 'Cơ bản'
	)
	const [price, setPrice] = useState(course?.price || 0)
	const [originalPrice, setOriginalPrice] = useState(
		course?.originalPrice || 0
	)
	const [duration, setDuration] = useState(course?.duration || '')
	const [instructor, setInstructor] = useState(course?.instructor || '')

	const categories = [
		{ name: 'Giao tiếp', color: '#1066d6' },
		{ name: 'Luyện thi', color: '#16a34a' },
		{ name: 'Công việc', color: '#d97706' },
		{ name: 'Phát âm', color: '#9333ea' },
	]

	const handleUpdate = () => {
		if (!title || !description || !instructor) {
			alert('Vui lòng điền tất cả thông tin bắt buộc')
			return
		}

		if (onUpdated && course) {
			const categoryObj = categories.find((c) => c.name === category)
			const updatedCourse: Course = {
				...course,
				title,
				description,
				instructor,
				category,
				categoryColor: categoryObj?.color || '#1066d6',
				level,
				duration,
				price,
				originalPrice,
			}
			onUpdated(updatedCourse)
		}

		onBackToDashboard()
	}

	if (!course) {
		return (
			<section className="admin-page">
				<div className="admin-shell">
					<header className="admin-header">
						<h1 className="admin-title">Khóa học không tìm thấy</h1>
						<button
							className="admin-btn ghost"
							onClick={onBackToDashboard}
						>
							Quay lại
						</button>
					</header>
				</div>
			</section>
		)
	}

	return (
		<section className="admin-page">
			<div className="admin-shell">
				<header className="admin-header">
					<div>
						<h1 className="admin-title">Chỉnh sửa khóa học</h1>
						<p className="admin-subtitle">
							Cập nhật thông tin của khóa học "{title}"
						</p>
					</div>
					<div className="admin-toolbar">
						<button className="admin-btn ghost" onClick={onBackToDashboard}>
							Quay lại
						</button>
					</div>
				</header>

				<section className="admin-panel">
					<h3>Thông tin khóa học</h3>

					<div
						className="admin-form-grid"
						style={{ gridTemplateColumns: '1fr 1fr' }}
					>
						<div>
							<label className="admin-form-label">
								Tên khóa học{' '}
								<span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								className="admin-input admin-input-full"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="VD: Tiếng Anh giao tiếp..."
							/>
						</div>
						<div>
							<label className="admin-form-label">
								Giảng viên{' '}
								<span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								className="admin-input admin-input-full"
								value={instructor}
								onChange={(e) => setInstructor(e.target.value)}
								placeholder="VD: Cô Mai Anh"
							/>
						</div>
					</div>

					<div>
						<label className="admin-form-label">
							Mô tả chi tiết{' '}
							<span style={{ color: '#ef4444' }}>*</span>
						</label>
						<textarea
							className="admin-input admin-input-full"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Mô tả về nội dung khóa học..."
							rows={4}
							style={{ minHeight: 100, fontFamily: 'inherit' }}
						></textarea>
					</div>

					<div
						className="admin-form-grid"
						style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
					>
						<div>
							<label className="admin-form-label">Danh mục</label>
							<select
								className="admin-select admin-input-full"
								value={category}
								onChange={(e) => setCategory(e.target.value)}
							>
								{categories.map((c) => (
									<option key={c.name} value={c.name}>
										{c.name}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="admin-form-label">Trình độ</label>
							<select
								className="admin-select admin-input-full"
								value={level}
								onChange={(e) =>
									setLevel(e.target.value as Course['level'])
								}
							>
								<option value="Cơ bản">Cơ bản</option>
								<option value="Trung cấp">Trung cấp</option>
								<option value="Nâng cao">Nâng cao</option>
							</select>
						</div>
						<div>
							<label className="admin-form-label">Thời lượng</label>
							<input
								className="admin-input admin-input-full"
								value={duration}
								onChange={(e) => setDuration(e.target.value)}
								placeholder="VD: 24 giờ"
							/>
						</div>
					</div>

					<div className="admin-form-grid">
						<div>
							<label className="admin-form-label">Giá hiện tại (₫)</label>
							<input
								className="admin-input admin-input-full"
								type="number"
								value={price}
								onChange={(e) => setPrice(Number(e.target.value))}
								placeholder="0"
							/>
						</div>
						<div>
							<label className="admin-form-label">Giá gốc (₫)</label>
							<input
								className="admin-input admin-input-full"
								type="number"
								value={originalPrice}
								onChange={(e) =>
									setOriginalPrice(Number(e.target.value))
								}
								placeholder="0"
							/>
						</div>
					</div>

					<div
						className="admin-panel"
						style={{ marginTop: 20, backgroundColor: '#f8fafc' }}
					>
						<h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#6b7280' }}>
							Thông tin hệ thống
						</h4>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: 15,
							}}
						>
							<div>
								<p style={{ margin: '0 0 4px', fontSize: 12, color: '#94a3b8' }}>
									ID khóa học
								</p>
								<p style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, color: '#374151' }}>
									{course.id}
								</p>
							</div>
							<div>
								<p style={{ margin: '0 0 4px', fontSize: 12, color: '#94a3b8' }}>
									Học viên đăng ký
								</p>
								<p style={{ margin: 0, fontWeight: 500, color: '#374151' }}>
									{course.studentCount} người
								</p>
							</div>
							<div>
								<p style={{ margin: '0 0 4px', fontSize: 12, color: '#94a3b8' }}>
									Đánh giá
								</p>
								<p style={{ margin: 0, fontWeight: 500, color: '#374151' }}>
									⭐ {course.rating}/5 ({course.reviewCount} đánh giá)
								</p>
							</div>
							<div>
								<p style={{ margin: '0 0 4px', fontSize: 12, color: '#94a3b8' }}>
									Bài học
								</p>
								<p style={{ margin: 0, fontWeight: 500, color: '#374151' }}>
									{course.lessons.length} bài
								</p>
							</div>
						</div>
					</div>

					<div className="admin-actions" style={{ marginTop: 20 }}>
						<button className="admin-btn" onClick={handleUpdate}>
							Lưu thay đổi
						</button>
						<button className="admin-btn ghost" onClick={onBackToDashboard}>
							Hủy
						</button>
					</div>
				</section>
			</div>
		</section>
	)
}

export default EditCourse
