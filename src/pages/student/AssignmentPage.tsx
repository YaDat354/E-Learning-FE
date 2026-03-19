import { useState } from 'react'
import './AssignmentPage.css'

type AssignmentPageProps = {
	lessonTitle: string
	onBack: () => void
}

function AssignmentPage({ lessonTitle, onBack }: AssignmentPageProps) {
	const [text, setText] = useState('')
	const [submitted, setSubmitted] = useState(false)

	return (
		<section className="student-page">
			<div className="student-shell">
				<header className="student-header">
					<div>
						<h1 className="student-title">Nộp bài thực hành</h1>
						<p className="student-subtitle">Bài: {lessonTitle}</p>
					</div>
					<button className="student-btn ghost" onClick={onBack}>Quay lại</button>
				</header>

				<article className="student-panel">
					<h3>Nội dung bài nộp</h3>
					<textarea
						className="student-textarea"
						placeholder="Viết câu trả lời hoặc transcript bài nói của bạn..."
						value={text}
						onChange={(event) => setText(event.target.value)}
					/>
					<div style={{ marginTop: 12 }}>
						<button
							className="student-btn"
							onClick={() => setSubmitted(true)}
							disabled={text.trim().length === 0}
						>
							Gửi bài cho giảng viên
						</button>
					</div>
					{submitted && <p className="student-note" style={{ marginTop: 10 }}>Đã gửi bài thành công. Giảng viên sẽ phản hồi trong phần thảo luận.</p>}
				</article>
			</div>
		</section>
	)
}

export default AssignmentPage