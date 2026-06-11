import { useEffect, useMemo, useState } from 'react'
import { COURSES } from '../../domain/index.ts'
import type { User } from '../../domain/index.ts'
import { getTeacherCourses } from '../../utils/teacher.ts'
import { fetchTeachingAssignmentsOverview, fetchAssignmentSubmissions, gradeAssignmentSubmission, type TeachingAssignmentOverviewItem, type AssignmentSubmission } from '../../services/teacherService.ts'
import './AssignmentManage.css'

type Props = {
	user: User
	teacherCourseIds: string[]
	onBackToDashboard: () => void
}

function AssignmentManage({ user, teacherCourseIds, onBackToDashboard }: Props) {
	const teacherCourses = getTeacherCourses(COURSES, user, teacherCourseIds)
	const [overviewAssignments, setOverviewAssignments] = useState<TeachingAssignmentOverviewItem[]>([])
	const [isLoadingOverview, setIsLoadingOverview] = useState(true)
	const [overviewError, setOverviewError] = useState('')

	// Detail view states
	const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
	const [selectedAssignmentTitle, setSelectedAssignmentTitle] = useState<string>('')
	const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
	const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)
	const [submissionsError, setSubmissionsError] = useState('')

	// Grading states
	const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null)
	const [gradingScore, setGradingScore] = useState<number | ''>('')
	const [gradingFeedback, setGradingFeedback] = useState<string>('')
	const [isGrading, setIsGrading] = useState(false)

	useEffect(() => {
		let mounted = true

		const loadOverview = async () => {
			setIsLoadingOverview(true)
			setOverviewError('')

			try {
				const rows = await fetchTeachingAssignmentsOverview()
				if (mounted) {
					setOverviewAssignments(rows)
				}
			} catch (error) {
				console.error('load teaching assignment overview failed', error)
				if (mounted) {
					setOverviewAssignments([])
					setOverviewError('Không tải được tổng quan bài tập từ backend. Đang hiển thị dữ liệu ước tính.')
				}
			} finally {
				if (mounted) {
					setIsLoadingOverview(false)
				}
			}
		}

		void loadOverview()

		return () => {
			mounted = false
		}
	}, [teacherCourseIds.join('|'), user.email])

	// Load submissions when assignment is selected
	useEffect(() => {
		if (!selectedAssignmentId) {
			setSubmissions([])
			return
		}

		let mounted = true

		const loadSubmissions = async () => {
			setIsLoadingSubmissions(true)
			setSubmissionsError('')

			try {
				const rows = await fetchAssignmentSubmissions(selectedAssignmentId)
				if (mounted) {
					setSubmissions(rows)
				}
			} catch (error) {
				console.error('load assignment submissions failed', error)
				if (mounted) {
					setSubmissions([])
					setSubmissionsError('Không tải được danh sách bài nộp. Vui lòng thử lại.')
				}
			} finally {
				if (mounted) {
					setIsLoadingSubmissions(false)
				}
			}
		}

		void loadSubmissions()

		return () => {
			mounted = false
		}
	}, [selectedAssignmentId])

	const handleSelectAssignment = (assignmentId: string, assignmentTitle: string) => {
		setSelectedAssignmentId(assignmentId)
		setSelectedAssignmentTitle(assignmentTitle)
		setGradingSubmissionId(null)
		setGradingScore('')
		setGradingFeedback('')
	}

	const handleCloseDetail = () => {
		setSelectedAssignmentId(null)
		setSubmissions([])
		setGradingSubmissionId(null)
		setGradingScore('')
		setGradingFeedback('')
	}

	const handleSelectSubmission = (submissionId: string, currentScore?: number, currentFeedback?: string) => {
		setGradingSubmissionId(submissionId)
		setGradingScore(currentScore ?? '')
		setGradingFeedback(currentFeedback ?? '')
	}

	const handleSubmitGrade = async () => {
		if (!selectedAssignmentId || !gradingSubmissionId || isGrading) return

		setIsGrading(true)

		try {
			await gradeAssignmentSubmission(selectedAssignmentId, gradingSubmissionId, {
				score: typeof gradingScore === 'number' ? gradingScore : undefined,
				feedback: gradingFeedback || undefined,
			})

			// Update submissions list
			setSubmissions((prev) =>
				prev.map((sub) =>
					sub.submissionId === gradingSubmissionId
						? {
								...sub,
								score: typeof gradingScore === 'number' ? gradingScore : sub.score,
								feedback: gradingFeedback || sub.feedback,
						  }
						: sub
				)
			)

			setGradingSubmissionId(null)
			setGradingScore('')
			setGradingFeedback('')
		} catch (error) {
			console.error('grade submission failed', error)
			alert('Lỗi khi chấm bài. Vui lòng thử lại.')
		} finally {
			setIsGrading(false)
		}
	}

	const assignments = useMemo(() => overviewAssignments.map((item) => {
		const matchedCourse = teacherCourses.find((course) => course.id === item.courseId)

		return {
			id: item.assignmentId,
			title: item.assignmentTitle,
			courseTitle: item.courseTitle,
			categoryColor: matchedCourse?.categoryColor ?? '#0d9488',
			category: matchedCourse?.category ?? 'Khóa học',
			dueDate: item.dueDate ? new Date(item.dueDate).toLocaleDateString('vi-VN') : 'Chưa có hạn nộp',
			submitted: item.submittedCount,
			total: Math.max(item.totalStudents, 1),
			gradedCount: item.gradedCount,
		}
	}), [overviewAssignments, teacherCourses])

	const gradedCount = useMemo(
		() => assignments.reduce((sum, item) => sum + Math.min(item.gradedCount, item.submitted), 0),
		[assignments],
	)

	return (
		<section className="teacher-page">
			<div className="teacher-shell">
				<header className="teacher-header">
					<div>
						<h1 className="teacher-title">Quản lý Bài tập</h1>
						<p className="teacher-subtitle">
							{assignments.length} bài tập · {gradedCount} lượt chấm
						</p>
					</div>
					<div className="teacher-toolbar">
						<button className="teacher-btn ghost" onClick={onBackToDashboard}>
							Về Dashboard
						</button>
					</div>
				</header>

				<section className="teacher-panel">
					{isLoadingOverview && <div className="teacher-list-meta" style={{ marginBottom: 10 }}>Đang tải tổng quan bài tập từ backend...</div>}
					{overviewError && <div className="teacher-list-meta" style={{ marginBottom: 10, color: '#dc2626' }}>{overviewError}</div>}
					{!isLoadingOverview && !overviewError && overviewAssignments.length > 0 && (
						<div className="teacher-list-meta" style={{ marginBottom: 10 }}>
							Dữ liệu đang lấy trực tiếp từ API tổng quan bài tập của backend.
						</div>
					)}
					<table className="teacher-table">
						<thead>
							<tr>
								<th>Bài tập</th>
								<th>Danh mục</th>
								<th>Hạn nộp</th>
								<th>Đã nộp</th>
								<th>Tỉ lệ</th>
								<th>Trạng thái</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{!isLoadingOverview && assignments.length === 0 && (
								<tr>
									<td colSpan={7} className="teacher-list-meta">Chưa có dữ liệu bài tập từ backend cho giảng viên hiện tại.</td>
								</tr>
							)}
							{assignments.map((a) => {
								const ratio = Math.round((a.submitted / Math.max(a.total, 1)) * 100)
								return (
									<tr
										key={a.id}
										onClick={() => handleSelectAssignment(a.id, a.title)}
										style={{ cursor: 'pointer' }}
									>
										<td>
											<span className="teacher-list-title">{a.title}</span>
											<div className="teacher-list-meta">{a.courseTitle}</div>
										</td>
										<td>
											<span
												className="teacher-badge"
												style={{ background: a.categoryColor }}
											>
												{a.category}
											</span>
										</td>
										<td>{a.dueDate}</td>
										<td>
											{a.submitted.toLocaleString()} /{' '}
											{a.total.toLocaleString()}
										</td>
										<td>
											<span
												className={`teacher-level-badge ${
													ratio >= 50
														? 'teacher-level-basic'
														: 'teacher-level-mid'
												}`}
											>
												{ratio}%
											</span>
										</td>
										<td>
											{a.gradedCount >= a.submitted ? (
												<span className="teacher-badge teacher-badge-free">
													Đã chấm
												</span>
											) : (
												<span className="teacher-badge teacher-badge-paid">
													Chưa chấm
												</span>
											)}
										</td>
										<td>
											<button
												className="teacher-btn ghost"
												onClick={(e) => {
													e.stopPropagation()
													handleSelectAssignment(a.id, a.title)
												}}
											>
												Xem bài
											</button>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>

					{selectedAssignmentId && (
						<div style={{
							marginTop: 24,
							padding: 16,
							border: '1px solid #e5e7eb',
							borderRadius: 8,
							backgroundColor: '#f9fafb',
						}}>
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: 16,
							}}>
								<h3 style={{ margin: 0 }}>Chi tiết bài nộp: {selectedAssignmentTitle}</h3>
								<button className="teacher-btn ghost" onClick={handleCloseDetail}>
									Đóng
								</button>
							</div>

							{isLoadingSubmissions && (
								<div className="teacher-list-meta">Đang tải danh sách bài nộp...</div>
							)}

							{submissionsError && (
								<div style={{ color: '#dc2626', marginBottom: 10 }}>{submissionsError}</div>
							)}

							{!isLoadingSubmissions && submissions.length === 0 && (
								<div className="teacher-list-meta">Chưa có bài nộp.</div>
							)}

							{submissions.length > 0 && (
								<div>
									{submissions.map((sub) => (
										<div
											key={sub.submissionId}
											style={{
												padding: 12,
												marginBottom: 12,
												border: '1px solid #d1d5db',
												borderRadius: 6,
												backgroundColor: '#fff',
											}}
										>
											<div style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'start',
												marginBottom: 8,
											}}>
												<div>
													<div style={{ fontWeight: 600 }}>{sub.studentName}</div>
													<div style={{ fontSize: 12, color: '#6b7280' }}>
														Nộp: {new Date(sub.submittedAt).toLocaleString('vi-VN')}
													</div>
												</div>
												<div style={{ fontSize: 12, color: '#6b7280' }}>
													Điểm: {sub.score !== null ? sub.score : 'Chưa chấm'}
												</div>
											</div>

											<div style={{
												padding: 8,
												marginBottom: 8,
												backgroundColor: '#f3f4f6',
												borderRadius: 4,
												fontSize: 14,
												lineHeight: 1.5,
											}}>
												{sub.content}
											</div>

											{sub.feedback && (
												<div style={{
													padding: 8,
													marginBottom: 8,
													backgroundColor: '#fef3c7',
													borderRadius: 4,
													fontSize: 12,
													lineHeight: 1.5,
												}}>
													<strong>Nhận xét:</strong> {sub.feedback}
												</div>
											)}

											{gradingSubmissionId === sub.submissionId ? (
												<div style={{ padding: 8, backgroundColor: '#dbeafe', borderRadius: 4 }}>
													<div style={{ marginBottom: 8 }}>
														<label style={{ display: 'block', marginBottom: 4 }}>
															Điểm:
														</label>
														<input
															type="number"
															min="0"
															max="100"
															value={gradingScore}
															onChange={(e) => setGradingScore(e.target.value ? Number(e.target.value) : '')}
															disabled={isGrading}
															style={{
																width: '100%',
																padding: 8,
																border: '1px solid #93c5fd',
																borderRadius: 4,
																boxSizing: 'border-box',
															}}
														/>
													</div>
													<div style={{ marginBottom: 8 }}>
														<label style={{ display: 'block', marginBottom: 4 }}>
															Nhận xét:
														</label>
														<textarea
															value={gradingFeedback}
															onChange={(e) => setGradingFeedback(e.target.value)}
															disabled={isGrading}
															style={{
																width: '100%',
																minHeight: 60,
																padding: 8,
																border: '1px solid #93c5fd',
																borderRadius: 4,
																boxSizing: 'border-box',
																fontFamily: 'inherit',
															}}
														/>
													</div>
													<div style={{ display: 'flex', gap: 8 }}>
														<button
															className="teacher-btn"
															onClick={handleSubmitGrade}
															disabled={isGrading}
														>
															{isGrading ? 'Đang lưu...' : 'Lưu chấm'}
														</button>
														<button
															className="teacher-btn ghost"
															onClick={() => {
																setGradingSubmissionId(null)
																setGradingScore('')
																setGradingFeedback('')
															}}
															disabled={isGrading}
														>
															Hủy
														</button>
													</div>
												</div>
											) : (
												<button
													className="teacher-btn ghost"
													onClick={() => handleSelectSubmission(sub.submissionId, sub.score ?? undefined, sub.feedback)}
													disabled={isGrading}
												>
													Chấm bài
												</button>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</section>
			</div>
		</section>
	)
}

export default AssignmentManage
