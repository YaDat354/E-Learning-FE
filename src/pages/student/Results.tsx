import { useEffect, useMemo, useState } from 'react'
import { Clock3, FileText, PlayCircle, Trophy } from 'lucide-react'
import type { User } from '../../domain/index.ts'
import { fetchMyLearningResults, type LearningQuizResult, type LearningResultsPayload } from '../../services/learningResultsService.ts'
import './Results.css'

type Props = {
	user: User
	onOpenCourse: (courseId: string) => void
	onOpenLesson: (courseId: string, lessonId: string) => void
	onBackToDashboard: () => void
}

function formatDate(value: string) {
	if (!value) {
		return 'Đang cập nhật'
	}

	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return value
	}

	return new Intl.DateTimeFormat('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date)
}

function ResultBadge({ score }: { score: number }) {
	const tone = score >= 85 ? 'gold' : score >= 70 ? 'green' : score >= 50 ? 'amber' : 'rose'
	return <span className={`learning-score-badge tone-${tone}`}>{score}%</span>
}

function Results({ user, onOpenCourse, onOpenLesson, onBackToDashboard }: Props) {
	const [data, setData] = useState<LearningResultsPayload | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		let mounted = true

		const load = async () => {
			setIsLoading(true)
			setError('')

			try {
				const next = await fetchMyLearningResults()
				if (mounted) {
					setData(next)
				}
			} catch (loadError) {
				console.error('load learning results failed', loadError)
				if (mounted) {
					setError('Không thể tải kết quả học tập từ backend.')
				}
			} finally {
				if (mounted) {
					setIsLoading(false)
				}
			}
		}

		void load()

		return () => {
			mounted = false
		}
	}, [])

	const quizzes = data?.quizResults ?? []
	const assignments = data?.assignmentSubmissions ?? []
	const summary = data?.summary ?? {
		quizCount: 0,
		quizAverageScore: 0,
		assignmentCount: 0,
		gradedAssignmentCount: 0,
		highestQuizScore: 0,
		latestSubmittedAt: undefined,
	}

	const completionText = useMemo(() => {
		if (summary.quizCount === 0 && summary.assignmentCount === 0) {
			return 'Chưa có dữ liệu đánh giá'
		}

		const parts = [
			`${summary.quizCount} quiz`,
			`${summary.assignmentCount} bài nộp`,
			`${summary.gradedAssignmentCount} bài đã chấm`,
		]
		return parts.join(' · ')
	}, [summary])

	return (
		<section className="student-page results-page">
			<div className="student-shell results-shell">
				<header className="student-header results-header">
					<div>
						<h1 className="student-title">Kết quả học tập</h1>
						<p className="student-subtitle">{user.name} · {completionText}</p>
					</div>
					<div className="student-toolbar">
						<button className="student-btn ghost" onClick={onBackToDashboard}>Về Dashboard</button>
					</div>
				</header>

				<div className="results-summary-grid">
					<article className="results-summary-card accent-blue">
						<PlayCircle size={22} />
						<div>
							<span>Quiz đã làm</span>
							<strong>{summary.quizCount}</strong>
						</div>
					</article>
					<article className="results-summary-card accent-gold">
						<Trophy size={22} />
						<div>
							<span>Điểm trung bình</span>
							<strong>{summary.quizAverageScore}%</strong>
						</div>
					</article>
					<article className="results-summary-card accent-green">
						<FileText size={22} />
						<div>
							<span>Bài nộp</span>
							<strong>{summary.assignmentCount}</strong>
						</div>
					</article>
					<article className="results-summary-card accent-amber">
						<Clock3 size={22} />
						<div>
							<span>Gần nhất</span>
							<strong>{formatDate(summary.latestSubmittedAt ?? '')}</strong>
						</div>
					</article>
				</div>

				{isLoading && <section className="student-panel"><div className="results-empty">Đang tải kết quả học tập...</div></section>}
				{error && <section className="student-panel"><div className="results-empty error">{error}</div></section>}

				<div className="results-grid">
					<section className="student-panel">
						<h3>Quiz gần đây</h3>
						{quizzes.length === 0 ? (
							<div className="results-empty">Chưa có bài quiz nào. Hãy học tiếp và làm quiz để thấy kết quả ở đây.</div>
						) : (
							<div className="results-list">
								{quizzes.map((item: LearningQuizResult) => (
									<article className="result-row" key={item.id}>
										<div>
											<div className="result-title">{item.quizTitle}</div>
											<div className="result-meta">
												{item.courseTitle ? `${item.courseTitle} · ` : ''}
												{item.lessonTitle ? `${item.lessonTitle} · ` : ''}
												{formatDate(item.submittedAt)}
											</div>
										</div>
										<div className="result-actions">
											<ResultBadge score={Math.round(item.score)} />
											{item.courseId && item.lessonId && (
												<button className="student-btn ghost" onClick={() => onOpenLesson(item.courseId!, item.lessonId!)}>
													Mở bài
												</button>
											)}
											{item.courseId && !item.lessonId && (
												<button className="student-btn ghost" onClick={() => onOpenCourse(item.courseId!)}>
													Mở khóa
												</button>
											)}
										</div>
									</article>
								))}
							</div>
						)}
					</section>

					<section className="student-panel">
						<h3>Bài tập đã nộp</h3>
						{assignments.length === 0 ? (
							<div className="results-empty">Chưa có bài tập nào được nộp.</div>
						) : (
							<div className="results-list">
								{assignments.map((item) => (
									<article className="result-row compact" key={item.id}>
										<div>
											<div className="result-title">{item.assignmentTitle}</div>
											<div className="result-meta">
												{item.courseTitle ? `${item.courseTitle}${item.lessonTitle ? ` · ${item.lessonTitle}` : ''} · ` : ''}
												{formatDate(item.submittedAt)}
											</div>
											{item.feedback && <p className="result-feedback">{item.feedback}</p>}
										</div>
										<div className="result-actions">
											<span className={`assignment-score ${item.score === null ? 'pending' : item.score >= 80 ? 'good' : item.score >= 60 ? 'warn' : 'bad'}`}>
												{item.score === null ? 'Chờ chấm' : `${Math.round(item.score)} điểm`}
											</span>
										</div>
									</article>
								))}
							</div>
						)}
					</section>
				</div>
			</div>
		</section>
	)
}

export default Results