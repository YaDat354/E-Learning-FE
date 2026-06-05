import { useState } from 'react'
import type { Course } from '../../domain/index.ts'
import type { User } from '../../domain/index.ts'
import './Dashboard.css'

type Props = {
	user: User
	onBackToDashboard: () => void
	onCreated?: (course: Course) => void
}

function CreateCourse({ user, onBackToDashboard, onCreated }: Props) {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [category, setCategory] = useState('Giao tiếp')
	const [level, setLevel] = useState<Course['level']>('Cơ bản')
	const [price, setPrice] = useState(0)
	const [originalPrice, setOriginalPrice] = useState(0)
	const [duration, setDuration] = useState('')
	const [instructor] = useState(user.name)

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
		<section className="teacher-page">
			<div className="teacher-shell">
				<header className="teacher-header">
					<div>
						<h1 className="teacher-title">Tạo khóa học mới</h1>
						<p className="teacher-subtitle">
							Điền thông tin chi tiết để tạo một khóa học mới
						</p>
					</div>
					<div className="teacher-toolbar">
						<button className="teacher-btn ghost" onClick={onBackToDashboard}>
							Quay lại
						</button>
					</div>
				</header>

				<section className="teacher-panel">
					<h3>Thông tin khóa học</h3>

					<div
						className="teacher-toolbar"
						style={{ gridTemplateColumns: '1fr 1fr' }}
					>
						<div>
							<label className="teacher-list-meta">
								Tên khóa học <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								className="teacher-input"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="VD: Tiếng Anh giao tiếp..."
								style={{ width: '100%' }}
							/>
						</div>
						<div>
							<label className="teacher-list-meta">
								Giảng viên
							</label>
							<input
								className="teacher-input"
								value={instructor}
								readOnly
								style={{ width: '100%', opacity: 0.8 }}
							/>
						</div>
					</div>

					<div>
						<label className="teacher-list-meta">
							Mô tả chi tiết <span style={{ color: '#ef4444' }}>*</span>
						</label>
						<textarea
							className="teacher-input"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Mô tả về nội dung khóa học..."
							rows={4}
							style={{ minHeight: 100, fontFamily: 'inherit', width: '100%' }}
						></textarea>
					</div>

					<div
						className="teacher-toolbar"
						style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
					>
						<div>
							<label className="teacher-list-meta">Danh mục</label>
							<select
								className="teacher-select"
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								style={{ width: '100%' }}
							>
								{categories.map((c) => (
									<option key={c.name} value={c.name}>
										{c.name}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="teacher-list-meta">Trình độ</label>
							<select
								className="teacher-select"
								value={level}
								onChange={(e) =>
									setLevel(e.target.value as Course['level'])
								}
								style={{ width: '100%' }}
							>
								<option value="Cơ bản">Cơ bản</option>
								<option value="Trung cấp">Trung cấp</option>
								<option value="Nâng cao">Nâng cao</option>
							</select>
						</div>
						<div>
							<label className="teacher-list-meta">Thời lượng</label>
							<input
								className="teacher-input"
								value={duration}
								onChange={(e) => setDuration(e.target.value)}
								placeholder="VD: 24 giờ"
								style={{ width: '100%' }}
							/>
						</div>
					</div>

					<div className="teacher-toolbar">
						<div>
							<label className="teacher-list-meta">Giá hiện tại (₫)</label>
							<input
								className="teacher-input"
								type="number"
								value={price}
								onChange={(e) => setPrice(Number(e.target.value))}
								placeholder="0"
								style={{ width: '100%' }}
							/>
						</div>
						<div>
							<label className="teacher-list-meta">Giá gốc (₫)</label>
							<input
								className="teacher-input"
								type="number"
								value={originalPrice}
								onChange={(e) =>
									setOriginalPrice(Number(e.target.value))
								}
								placeholder="0"
								style={{ width: '100%' }}
							/>
						</div>
					</div>

					<div className="teacher-toolbar" style={{ marginTop: 20 }}>
						<button className="teacher-btn" onClick={handleCreate}>
							Tạo khóa học
						</button>
						<button className="teacher-btn ghost" onClick={onBackToDashboard}>
							Hủy
						</button>
					</div>
				</section>
			</div>
		</section>
	)
}

export default CreateCourse
