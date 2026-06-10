import { useState } from 'react'
import type { Course, Lesson } from '../../domain/index.ts'
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
	const [lessons, setLessons] = useState<Lesson[]>([])
	const [newLessonTitle, setNewLessonTitle] = useState('')
	const [newLessonDuration, setNewLessonDuration] = useState('')
	const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('')
	const [newLessonDescription, setNewLessonDescription] = useState('')
	const [newLessonTranscript, setNewLessonTranscript] = useState('')
	const [newQuizTitle, setNewQuizTitle] = useState('')
	const [newQuizQuestion, setNewQuizQuestion] = useState('')
	const [newQuizOption0, setNewQuizOption0] = useState('')
	const [newQuizOption1, setNewQuizOption1] = useState('')
	const [newQuizOption2, setNewQuizOption2] = useState('')
	const [newQuizOption3, setNewQuizOption3] = useState('')
	const [newQuizCorrectIndex, setNewQuizCorrectIndex] = useState(0)

	const categories = [
		{ name: 'Giao tiếp', color: '#1066d6' },
		{ name: 'Luyện thi', color: '#16a34a' },
		{ name: 'Công việc', color: '#d97706' },
		{ name: 'Phát âm', color: '#9333ea' },
	]

	const clearLessonDraft = () => {
		setNewLessonTitle('')
		setNewLessonDuration('')
		setNewLessonVideoUrl('')
		setNewLessonDescription('')
		setNewLessonTranscript('')
		setNewQuizTitle('')
		setNewQuizQuestion('')
		setNewQuizOption0('')
		setNewQuizOption1('')
		setNewQuizOption2('')
		setNewQuizOption3('')
		setNewQuizCorrectIndex(0)
	}

	const handleAddLesson = () => {
		if (!newLessonTitle.trim() || !newLessonDuration.trim()) {
			alert('Vui lòng điền tiêu đề và thời lượng bài học trước khi thêm.')
			return
		}

		const transcriptLines = newLessonTranscript
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean)
			.map((text) => ({ original: text }))

		const quizOptions = [newQuizOption0, newQuizOption1, newQuizOption2, newQuizOption3]
			.map((option) => option.trim())
			.filter(Boolean)

		const quiz = newQuizTitle.trim() && newQuizQuestion.trim() && quizOptions.length >= 2
			? {
				title: newQuizTitle.trim(),
				questions: [
					{
						id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
						text: newQuizQuestion.trim(),
						options: quizOptions,
						correctIndex: Math.min(newQuizCorrectIndex, quizOptions.length - 1),
						explanation: '',
					},
				],
			}
			: null

		const lesson: Lesson = {
			id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			title: newLessonTitle.trim(),
			duration: newLessonDuration.trim(),
			videoId: newLessonVideoUrl.trim(),
			description: newLessonDescription.trim(),
			videoScript: [],
			keyPhrases: [],
			transcript: transcriptLines,
			task: [],
			translations: [],
			exercises: [],
			isFree: false,
			quiz,
			resources: [],
		}

		setLessons((prev) => [...prev, lesson])
		clearLessonDraft()
	}

	const handleCreate = () => {
		if (!title.trim() || !description.trim() || !instructor.trim()) {
			alert('Vui lòng điền tất cả thông tin bắt buộc')
			return
		}

		if (onCreated) {
			const categoryObj = categories.find((c) => c.name === category)
			const newCourse: Course = {
				id: `course-${Date.now()}`,
				title: title.trim(),
				description: description.trim(),
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
				duration: duration.trim(),
				price,
				originalPrice,
				tags: [],
				lessons,
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

					<div className="teacher-toolbar" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
							<label className="teacher-list-meta">Giảng viên</label>
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

					<div className="teacher-toolbar" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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

					<section className="teacher-panel" style={{ marginTop: 24 }}>
						<h3>Bài học / Quiz</h3>
						<div className="teacher-toolbar" style={{ gridTemplateColumns: '1fr 1fr' }}>
							<div>
								<label className="teacher-list-meta">Tiêu đề bài học</label>
								<input
									className="teacher-input"
									value={newLessonTitle}
									onChange={(e) => setNewLessonTitle(e.target.value)}
									placeholder="VD: Bài 1: Giới thiệu"
									style={{ width: '100%' }}
								/>
							</div>
							<div>
								<label className="teacher-list-meta">Thời lượng</label>
								<input
									className="teacher-input"
									value={newLessonDuration}
									onChange={(e) => setNewLessonDuration(e.target.value)}
									placeholder="VD: 15 phút"
									style={{ width: '100%' }}
								/>
							</div>
						</div>

						<div>
							<label className="teacher-list-meta">Link video / audio URL</label>
							<input
								className="teacher-input"
								value={newLessonVideoUrl}
								onChange={(e) => setNewLessonVideoUrl(e.target.value)}
								placeholder="VD: https://..."
								style={{ width: '100%' }}
							/>
						</div>

						<div>
							<label className="teacher-list-meta">Mô tả bài học</label>
							<textarea
								className="teacher-input"
								value={newLessonDescription}
								onChange={(e) => setNewLessonDescription(e.target.value)}
								placeholder="Tóm tắt nội dung chính của bài học"
								rows={3}
								style={{ minHeight: 80, width: '100%', fontFamily: 'inherit' }}
							></textarea>
						</div>

						<div>
							<label className="teacher-list-meta">Transcript / Script</label>
							<textarea
								className="teacher-input"
								value={newLessonTranscript}
								onChange={(e) => setNewLessonTranscript(e.target.value)}
								placeholder="Nhập từng dòng transcript, mỗi dòng một dòng mới"
								rows={4}
								style={{ minHeight: 100, width: '100%', fontFamily: 'inherit' }}
							></textarea>
						</div>

						<div className="teacher-toolbar" style={{ gridTemplateColumns: '1fr 1fr' }}>
							<div>
								<label className="teacher-list-meta">Tiêu đề quiz</label>
								<input
									className="teacher-input"
									value={newQuizTitle}
									onChange={(e) => setNewQuizTitle(e.target.value)}
									placeholder="VD: Quiz kiểm tra bài 1"
									style={{ width: '100%' }}
								/>
							</div>
							<div>
								<label className="teacher-list-meta">Câu hỏi quiz</label>
								<input
									className="teacher-input"
									value={newQuizQuestion}
									onChange={(e) => setNewQuizQuestion(e.target.value)}
									placeholder="Câu hỏi mẫu"
									style={{ width: '100%' }}
								/>
							</div>
						</div>

						<div className="teacher-toolbar" style={{ gridTemplateColumns: '1fr 1fr' }}>
							<div>
								<label className="teacher-list-meta">Đáp án 1</label>
								<input
									className="teacher-input"
									value={newQuizOption0}
									onChange={(e) => setNewQuizOption0(e.target.value)}
									style={{ width: '100%' }}
								/>
							</div>
							<div>
								<label className="teacher-list-meta">Đáp án 2</label>
								<input
									className="teacher-input"
									value={newQuizOption1}
									onChange={(e) => setNewQuizOption1(e.target.value)}
									style={{ width: '100%' }}
								/>
							</div>
						</div>

						<div className="teacher-toolbar" style={{ gridTemplateColumns: '1fr 1fr' }}>
							<div>
								<label className="teacher-list-meta">Đáp án 3</label>
								<input
									className="teacher-input"
									value={newQuizOption2}
									onChange={(e) => setNewQuizOption2(e.target.value)}
									style={{ width: '100%' }}
								/>
							</div>
							<div>
								<label className="teacher-list-meta">Đáp án 4</label>
								<input
									className="teacher-input"
									value={newQuizOption3}
									onChange={(e) => setNewQuizOption3(e.target.value)}
									style={{ width: '100%' }}
								/>
							</div>
						</div>

						<div>
							<label className="teacher-list-meta">Chỉ số đáp án đúng</label>
							<select
								className="teacher-select"
								value={newQuizCorrectIndex}
								onChange={(e) => setNewQuizCorrectIndex(Number(e.target.value))}
								style={{ width: '100%' }}
							>
								{[0, 1, 2, 3].map((index) => (
									<option key={index} value={index}>
										{`Đáp án ${index + 1}`}
									</option>
								))}
							</select>
						</div>

						<div className="teacher-toolbar" style={{ marginTop: 16 }}>
							<button className="teacher-btn" onClick={handleAddLesson} type="button">
								Thêm bài học
							</button>
						</div>

						{lessons.length > 0 && (
							<div style={{ marginTop: 20 }}>
								<h4>Bài học đã thêm</h4>
								<div className="teacher-list">
									{lessons.map((lesson) => (
										<div key={lesson.id} className="teacher-list-item teacher-list-item-readonly">
											<div>
												<div className="teacher-list-title">{lesson.title}</div>
												<div className="teacher-list-meta">{lesson.duration} · {lesson.quiz ? 'Có quiz' : 'Không quiz'}</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</section>

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
