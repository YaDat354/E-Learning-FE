import { useEffect, useMemo, useState } from 'react'
import { COURSES } from '../../domain/index.ts'
import type { User } from '../../domain/index.ts'
import { getTeacherCourses } from '../../utils/teacher.ts'
import { fetchTeachingAssignmentsOverview, type TeachingAssignmentOverviewItem } from '../../services/teacherService.ts'
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
											<span className="teacher-list-meta">Theo dữ liệu backend</span>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</section>
			</div>
		</section>
	)
}

export default AssignmentManage
