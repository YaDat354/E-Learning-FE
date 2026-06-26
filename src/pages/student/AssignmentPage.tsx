import { useState, type ChangeEvent } from 'react'
import { submitAssignment } from '../../services/enrollmentService.ts'
import './AssignmentPage.css'

type AssignmentPageProps = {
	lessonTitle: string
	lessonId: string
	onBack: () => void
}

function AssignmentPage({ lessonTitle, lessonId, onBack }: AssignmentPageProps) {
	const [text, setText] = useState('')
	const [files, setFiles] = useState<File[]>([])
	const [submitted, setSubmitted] = useState(false)
	const [savedMode, setSavedMode] = useState<'server' | 'local'>('server')
	const [submittedFileCount, setSubmittedFileCount] = useState(0)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')

	const canSubmit = (text.trim().length > 0 || files.length > 0) && !isLoading

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(event.target.files ?? [])
		setFiles(selectedFiles)
		setSubmitted(false)
		setSubmittedFileCount(0)
		setError('')
	}

	const handleSubmit = async () => {
		if (!canSubmit) return
		
		setIsLoading(true)
		setError('')
		setSavedMode('server')
		
		try {
			const uploadedFiles = [...files]
			const result = await submitAssignment(lessonId, { content: text, files: uploadedFiles })
			setSavedMode(result.saved)
			setSubmitted(true)
			setSubmittedFileCount(uploadedFiles.length)
			setText('')
			setFiles([])
		} catch (err) {
			console.error('Assignment submission failed:', err)
			const anyErr = err as any
			const statusCode = anyErr?.response?.status
			const serverMessage = anyErr?.response?.data?.message || anyErr?.response?.data || anyErr?.response?.statusText
			setError(
				statusCode === 401
					? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi nộp bài.'
					: statusCode === 403
					? 'Bạn chưa có quyền nộp bài ở bài học này. Vui lòng kiểm tra quyền ghi danh khóa học.'
					: typeof serverMessage === 'string' && serverMessage.length > 0
					? `Lỗi server: ${serverMessage}`
					: err instanceof Error
					? err.message
					: 'Gửi bài tập thất bại. Vui lòng thử lại.'
			)
			setSubmitted(false)
			setSubmittedFileCount(0)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<section className="student-page">
			<div className="student-shell">
				<header className="student-header">
					<div>
						<h1 className="student-title">Nộp bài thực hành</h1>
						<p className="student-subtitle">Bài: {lessonTitle}</p>
					</div>
					<button className="student-btn ghost" onClick={onBack} disabled={isLoading}>Quay lại</button>
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
							setSubmittedFileCount(0)
							setError('')
						}}
						disabled={isLoading}
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
							disabled={isLoading}
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
							{isLoading ? 'Đang gửi...' : 'Gửi bài cho giảng viên'}
						</button>
					</div>
					{error && (
						<p className="student-note" style={{ marginTop: 10, color: '#dc2626' }}>
							{error}
						</p>
					)}
					{submitted && (
						<p className="student-note" style={{ marginTop: 10 }}>
							{savedMode === 'server'
								? `Đã gửi bài thành công${submittedFileCount > 0 ? ` với ${submittedFileCount} file đính kèm` : ''}. Giảng viên sẽ phản hồi trong phần thảo luận.`
								: `Bài nộp mới lưu tạm trên thiết bị${submittedFileCount > 0 ? ` với ${submittedFileCount} file đính kèm` : ''}. Chưa gửi lên server nên giảng viên chưa thể nhìn thấy hoặc chấm điểm.`}
						</p>
					)}
				</article>
			</div>
		</section>
	)
}

export default AssignmentPage