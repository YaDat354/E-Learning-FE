import { useState, type ChangeEvent } from 'react'
import './AssignmentPage.css'

type AssignmentPageProps = {
	lessonTitle: string
	onBack: () => void
}

function AssignmentPage({ lessonTitle, onBack }: AssignmentPageProps) {
	const [text, setText] = useState('')
	const [files, setFiles] = useState<File[]>([])
	const [submitted, setSubmitted] = useState(false)

	const canSubmit = text.trim().length > 0 || files.length > 0

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(event.target.files ?? [])
		setFiles(selectedFiles)
		setSubmitted(false)
	}

	const handleSubmit = () => {
		if (!canSubmit) return
		setSubmitted(true)
	}

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
						onChange={(event) => {
							setText(event.target.value)
							setSubmitted(false)
						}}
					/>

					<div className="student-file-upload">
						<label className="student-file-label" htmlFor="assignment-files">
							Đính kèm file (pdf, docx, zip, mp3, mp4...)
						</label>
						<input
							id="assignment-files"
							type="file"
							className="student-file-input"
							multiple
							onChange={handleFileChange}
						/>
						{files.length > 0 && (
							<ul className="student-file-list">
								{files.map((file) => (
									<li key={`${file.name}-${file.size}`}> 
										<span>{file.name}</span>
										<span>{(file.size / 1024).toFixed(1)} KB</span>
									</li>
								))}
							</ul>
						)}
					</div>

					<div style={{ marginTop: 12 }}>
						<button
							className="student-btn"
							onClick={handleSubmit}
							disabled={!canSubmit}
						>
							Gửi bài cho giảng viên
						</button>
					</div>
					{submitted && (
						<p className="student-note" style={{ marginTop: 10 }}>
							Đã gửi bài thành công
							{files.length > 0 ? ` với ${files.length} file đính kèm` : ''}. Giảng viên sẽ phản hồi trong phần thảo luận.
						</p>
					)}
				</article>
			</div>
		</section>
	)
}

export default AssignmentPage