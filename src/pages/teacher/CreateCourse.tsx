import { useState } from 'react'
import type { Course } from '../../data/mockData.ts'
import '../admin/Dashboard.css'

type Props = {
	onBackToDashboard: () => void
	onCreated?: (course: Course) => void
}

function CreateCourse({ onBackToDashboard, onCreated }: Props) {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [category, setCategory] = useState('Giao tiếp')
	const [level, setLevel] = useState<Course['level']>('Cơ bản')
	const [price, setPrice] = useState(0)
	const [originalPrice, setOriginalPrice] = useState(0)
	const [duration, setDuration] = useState('')
	const [instructor, setInstructor] = useState('')

	const categories = [
		{ name: 'Giao tiếp', color: '#1066d6' },
		{ name: 'Luyện thi', color: '#16a34a' },
		{ name: 'Công việc', color: '#d97706' },
		{ name: 'Phát âm', color: '#9333ea' },
	]

	const handleCreate = () => {
		if (!title || !description || !instructor) {
			alert('Vui lòng điền tất cả thông tin bắt buộc')
			return
		}

		if (onCreated) {
			const categoryObj = categories.find((c) => c.name === category)
			const newCourse: Course = {
				id: `course-${Date.now()}`,
				title,
				description,
				instructor,
				instructorAvatar: instructor
					.split(' ')
					.map((w) => w[0])
					.join('')
					.slice(0, 2),
				category,
				categoryColor: categoryObj?.color || '#1066d6',
				level,
				rating: 0,
				reviewCount: 0,
				studentCount: 0,
				duration,
				price,
				originalPrice,
				tags: [],
				lessons: [],
			}
			onCreated(newCourse)
		}

		onBackToDashboard()
	}

	return (
		<section className="admin-page">
			<div className="admin-shell">
				<header className="admin-header">
					<div>
						<h1 className="admin-title">Tạo khóa học mới</h1>
						<p className="admin-subtitle">
							Điền thông tin chi tiết để tạo một khóa học mới
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
								Tên khóa học <span style={{ color: '#ef4444' }}>*</span>
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
								Giảng viên <span style={{ color: '#ef4444' }}>*</span>
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
							Mô tả chi tiết <span style={{ color: '#ef4444' }}>*</span>
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

					<div className="admin-actions" style={{ marginTop: 20 }}>
						<button className="admin-btn" onClick={handleCreate}>
							Tạo khóa học
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

export default CreateCourse
