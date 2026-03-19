import { useMemo, useState } from 'react'
import { COURSES } from '../../data/mockData.ts'
import './QuizPage.css'

type QuizPageProps = {
	courseId: string
	lessonId: string
	onBack: () => void
}

function QuizPage({ courseId, lessonId, onBack }: QuizPageProps) {
	const quiz = useMemo(() => {
		const course = COURSES.find((item) => item.id === courseId)
		const lesson = course?.lessons.find((item) => item.id === lessonId)
		return lesson?.quiz ?? null
	}, [courseId, lessonId])

	const [selected, setSelected] = useState<Record<string, number>>({})
	const [submitted, setSubmitted] = useState(false)

	if (!quiz) {
		return (
			<section className="student-page">
				<div className="student-shell">
					<button className="student-btn ghost" onClick={onBack}>Quay lại bài học</button>
					<div className="student-panel">
						<h3>Quiz chưa sẵn sàng</h3>
						<p className="student-note">Bài học này chưa có quiz. Hãy chọn một bài có quiz để luyện tập.</p>
					</div>
				</div>
			</section>
		)
	}

	const score = submitted
		? quiz.questions.reduce((sum, question) => sum + (selected[question.id] === question.correctIndex ? 1 : 0), 0)
		: 0

	return (
		<section className="student-page">
			<div className="student-shell">
				<header className="student-header">
					<div>
						<h1 className="student-title">{quiz.title}</h1>
						<p className="student-subtitle">Hoàn thành quiz để kiểm tra mức độ hiểu bài</p>
					</div>
					<button className="student-btn ghost" onClick={onBack}>Quay lại</button>
				</header>

				{quiz.questions.map((question) => (
					<article className="student-panel" key={question.id}>
						<h3>{question.text}</h3>
						<div className="student-list">
							{question.options.map((option, index) => (
								<label key={option} className="student-list-item">
									<span>{option}</span>
									<input
										type="radio"
										name={question.id}
										checked={selected[question.id] === index}
										onChange={() => setSelected((prev) => ({ ...prev, [question.id]: index }))}
									/>
								</label>
							))}
						</div>
						{submitted && (
							<p className="student-note">{question.explanation}</p>
						)}
					</article>
				))}

				{!submitted ? (
					<button className="student-btn" onClick={() => setSubmitted(true)}>Nộp quiz</button>
				) : (
					<div className="student-panel">
						<h3>Kết quả</h3>
						<p className="student-note">Bạn đúng {score}/{quiz.questions.length} câu.</p>
					</div>
				)}
			</div>
		</section>
	)
}

export default QuizPage