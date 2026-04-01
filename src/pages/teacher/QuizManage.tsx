import { useState } from 'react'
import { COURSES } from '../../data/mockData.ts'
import type { Quiz } from '../../data/mockData.ts'
import './QuizManage.css'

type Props = {
	onBackToDashboard: () => void
}

type QuizItem = {
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
			courseTitle: course.title,
			courseCategory: course.category,
			categoryColor: course.categoryColor,
			lessonTitle: lesson.title,
			quiz: lesson.quiz!,
		})),
)

function QuizManage({ onBackToDashboard }: Props) {
	const [quizItems, setQuizItems] = useState<QuizItem[]>(initialItems)
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
	const [editingIndex, setEditingIndex] = useState<number | null>(null)
	const [editTitle, setEditTitle] = useState('')

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
