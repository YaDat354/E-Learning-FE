import { useEffect, useMemo, useState } from 'react'
import { COURSES } from '../../data/mockData.ts'
import type { Quiz } from '../../data/mockData.ts'
import './QuizManage.css'

type Props = {
	onBackToDashboard: () => void
}

type QuizItem = {
	courseId: string
	lessonId: string
	courseTitle: string
	courseCategory: string
	categoryColor: string
	lessonTitle: string
	quiz: Quiz
}

const initialItems: QuizItem[] = COURSES.flatMap((course) =>
	course.lessons
		.filter((lesson) => lesson.quiz !== null)
		.map((lesson) => ({
			courseId: course.id,
			lessonId: lesson.id,
			courseTitle: course.title,
			courseCategory: course.category,
			categoryColor: course.categoryColor,
			lessonTitle: lesson.title,
			quiz: lesson.quiz!,
		})),
)

function buildDefaultQuestions(lessonTitle: string) {
	return [
		{
			id: `q-${Date.now()}-1`,
			text: `Nội dung chính của bài "${lessonTitle}" là gì?`,
			options: ['Ngữ pháp nền tảng', 'Từ vựng và hội thoại', 'Kỹ năng viết học thuật', 'Luyện phát âm nâng cao'],
			correctIndex: 1,
			explanation: 'Bài học tập trung vào từ vựng và tình huống hội thoại ứng dụng.',
		},
		{
			id: `q-${Date.now()}-2`,
			text: 'Bạn nên làm gì sau khi xem xong bài học?',
			options: ['Bỏ qua phần luyện tập', 'Làm quiz để củng cố kiến thức', 'Chỉ ghi chép lý thuyết', 'Học bài mới ngay'],
			correctIndex: 1,
			explanation: 'Làm quiz ngay giúp củng cố kiến thức vừa học và đo mức độ hiểu bài.',
		},
		{
			id: `q-${Date.now()}-3`,
			text: 'Mục tiêu của quiz sau bài học là gì?',
			options: ['Đánh giá ghi nhớ và hiểu bài', 'Kiểm tra tốc độ gõ máy', 'Thay thế hoàn toàn bài giảng', 'Chỉ để giải trí'],
			correctIndex: 0,
			explanation: 'Quiz dùng để kiểm tra mức độ ghi nhớ và khả năng vận dụng nội dung bài học.',
		},
	]
}

function QuizManage({ onBackToDashboard }: Props) {
	const [quizItems, setQuizItems] = useState<QuizItem[]>(initialItems)
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
	const [editingIndex, setEditingIndex] = useState<number | null>(null)
	const [editTitle, setEditTitle] = useState('')
	const [selectedCourseId, setSelectedCourseId] = useState(COURSES[0]?.id ?? '')
	const [selectedLessonId, setSelectedLessonId] = useState(COURSES[0]?.lessons[0]?.id ?? '')
	const [newQuizTitle, setNewQuizTitle] = useState('')

	const selectedCourse = useMemo(
		() => COURSES.find((course) => course.id === selectedCourseId) ?? COURSES[0],
		[selectedCourseId],
	)

	const selectableLessons = useMemo(() => selectedCourse?.lessons ?? [], [selectedCourse])

	useEffect(() => {
		if (!selectableLessons.some((lesson) => lesson.id === selectedLessonId)) {
			setSelectedLessonId(selectableLessons[0]?.id ?? '')
		}
	}, [selectableLessons, selectedLessonId])

	const toggleExpand = (index: number) => {
		setExpandedIndex(expandedIndex === index ? null : index)
	}

	const startEditTitle = (index: number) => {
		setEditingIndex(index)
		setEditTitle(quizItems[index].quiz.title)
	}

	const saveTitle = (index: number) => {
		setQuizItems((prev) =>
			prev.map((item, i) =>
				i === index
					? { ...item, quiz: { ...item.quiz, title: editTitle } }
					: item,
			),
		)
		setEditingIndex(null)
	}

	const createQuizForLesson = () => {
		const course = COURSES.find((item) => item.id === selectedCourseId)
		if (!course) return

		const lesson = course.lessons.find((item) => item.id === selectedLessonId)
		if (!lesson) return

		const finalTitle = newQuizTitle.trim() || `Quiz: ${lesson.title}`
		const newQuiz: Quiz = {
			title: finalTitle,
			questions: buildDefaultQuestions(lesson.title),
		}

		lesson.quiz = newQuiz

		const nextItem: QuizItem = {
			courseId: course.id,
			lessonId: lesson.id,
			courseTitle: course.title,
			courseCategory: course.category,
			categoryColor: course.categoryColor,
			lessonTitle: lesson.title,
			quiz: newQuiz,
		}

		setQuizItems((prev) => {
			const index = prev.findIndex(
				(item) => item.courseId === nextItem.courseId && item.lessonId === nextItem.lessonId,
			)

			if (index === -1) {
				return [nextItem, ...prev]
			}

			const next = [...prev]
			next[index] = nextItem
			return next
		})

		setExpandedIndex(null)
		setEditingIndex(null)
		setNewQuizTitle('')
	}

	return (
		<section className="teacher-page">
			<div className="teacher-shell">
				<header className="teacher-header">
					<div>
						<h1 className="teacher-title">Quản lý Quiz</h1>
						<p className="teacher-subtitle">
							{quizItems.length} quiz đang hoạt động
						</p>
					</div>
					<div className="teacher-toolbar">
						<button className="teacher-btn ghost" onClick={onBackToDashboard}>
							Về Dashboard
						</button>
					</div>
				</header>

				<section className="teacher-panel">
					<div className="teacher-panel-head">
						<h3>Danh sách Quiz</h3>
					</div>
					<div className="teacher-toolbar" style={{ marginBottom: 12 }}>
						<select
							className="teacher-select"
							value={selectedCourseId}
							onChange={(e) => setSelectedCourseId(e.target.value)}
						>
							{COURSES.map((course) => (
								<option key={course.id} value={course.id}>
									{course.title}
								</option>
							))}
						</select>

						<select
							className="teacher-select"
							value={selectedLessonId}
							onChange={(e) => setSelectedLessonId(e.target.value)}
							disabled={selectableLessons.length === 0}
						>
							{selectableLessons.map((lesson) => (
								<option key={lesson.id} value={lesson.id}>
									{lesson.title}
								</option>
							))}
						</select>

						<input
							className="teacher-input"
							value={newQuizTitle}
							onChange={(e) => setNewQuizTitle(e.target.value)}
							placeholder="Tiêu đề quiz mới"
						/>

						<button
							className="teacher-btn"
							onClick={createQuizForLesson}
							disabled={!selectedCourseId || !selectedLessonId}
						>
							Tạo quiz
						</button>
					</div>
					<div className="teacher-list">
						{quizItems.length === 0 && (
							<p className="teacher-empty">Chưa có quiz nào.</p>
						)}
						{quizItems.map((item, index) => (
							<div className="teacher-quiz-card" key={index}>
								<div
									className="teacher-list-item"
									style={{ border: 'none', borderRadius: 0 }}
								>
									<div style={{ flex: 1, minWidth: 0 }}>
										{editingIndex === index ? (
											<div
												style={{
													display: 'flex',
													gap: 8,
													alignItems: 'center',
													flexWrap: 'wrap',
												}}
											>
												<input
													className="teacher-input"
													value={editTitle}
													onChange={(e) => setEditTitle(e.target.value)}
													style={{ flex: 1, minWidth: 180 }}
												/>
												<button
													className="teacher-btn"
													onClick={() => saveTitle(index)}
												>
													Lưu
												</button>
												<button
													className="teacher-btn ghost"
													onClick={() => setEditingIndex(null)}
												>
													Hủy
												</button>
											</div>
										) : (
											<>
												<div className="teacher-list-title">{item.quiz.title}</div>
												<div className="teacher-list-meta">
													{item.courseTitle} · Bài: {item.lessonTitle} ·{' '}
													{item.quiz.questions.length} câu hỏi
												</div>
											</>
										)}
									</div>
									{editingIndex !== index && (
										<div className="teacher-actions">
											<span
												className="teacher-badge"
												style={{ background: item.categoryColor }}
											>
												{item.courseCategory}
											</span>
											<button
												className={`teacher-action-btn ${expandedIndex === index ? 'teacher-action-btn-active' : ''}`}
												onClick={() => toggleExpand(index)}
											>
												{expandedIndex === index ? 'Đóng' : 'Xem'}
											</button>
											<button
												className="teacher-action-btn"
												onClick={() => startEditTitle(index)}
											>
												Sửa
											</button>
										</div>
									)}
								</div>

								{expandedIndex === index && (
									<div className="teacher-expand-panel">
										<div className="teacher-question-list">
											{item.quiz.questions.map((q, qi) => (
												<div className="teacher-question-item" key={q.id}>
													<div className="teacher-question-text">
														<strong>{qi + 1}.</strong> {q.text}
													</div>
													<div className="teacher-options-grid">
														{q.options.map((opt, oi) => (
															<div
																key={oi}
																className={`teacher-option ${oi === q.correctIndex ? 'teacher-option-correct' : ''}`}
															>
																{String.fromCharCode(65 + oi)}. {opt}
															</div>
														))}
													</div>
													<div className="teacher-explanation">
														💡 {q.explanation}
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</section>
			</div>
		</section>
	)
}

export default QuizManage
