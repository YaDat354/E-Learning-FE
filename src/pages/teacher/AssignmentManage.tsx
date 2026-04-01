import { useState } from 'react'
import { COURSES } from '../../data/mockData.ts'
import './AssignmentManage.css'

type Props = {
	onBackToDashboard: () => void
}

const ASSIGNMENTS = COURSES.flatMap((course, courseIndex) =>
	course.lessons.map((lesson, lessonIndex) => ({
		id: `${course.id}-${lesson.id}`,
		title: `Bài tập ${lessonIndex + 1}: ${lesson.title}`,
		courseTitle: course.title,
		categoryColor: course.categoryColor,
		category: course.category,
		dueDate: lessonIndex % 2 === 0 ? '10/04/2026' : '17/04/2026',
		submitted: Math.floor(
			course.studentCount * (0.4 + ((courseIndex + lessonIndex) % 3) * 0.1),
		),
		total: course.studentCount,
	})),
)

function AssignmentManage({ onBackToDashboard }: Props) {
	const [gradedIds, setGradedIds] = useState<Set<string>>(new Set())

	const toggleGraded = (id: string) => {
		setGradedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	const gradedCount = gradedIds.size

	return (
		<section className="teacher-page">
			<div className="teacher-shell">
				<header className="teacher-header">
					<div>
						<h1 className="teacher-title">Quản lý Bài tập</h1>
						<p className="teacher-subtitle">
							{ASSIGNMENTS.length} bài tập · {gradedCount} đã chấm ·{' '}
							{ASSIGNMENTS.length - gradedCount} chưa chấm
						</p>
					</div>
					<div className="teacher-toolbar">
						<button className="teacher-btn ghost" onClick={onBackToDashboard}>
							Về Dashboard
						</button>
					</div>
				</header>

				<section className="teacher-panel">
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
							{ASSIGNMENTS.map((a) => {
								const isGraded = gradedIds.has(a.id)
								const ratio = Math.round((a.submitted / a.total) * 100)
								return (
									<tr
										key={a.id}
										style={isGraded ? { opacity: 0.6 } : undefined}
									>
										<td>
											<span className="teacher-list-title">{a.title}</span>
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
											{isGraded ? (
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
											<div className="teacher-actions">
												<button
													className={`teacher-action-btn ${isGraded ? 'teacher-action-btn-active' : ''}`}
													onClick={() => toggleGraded(a.id)}
												>
													{isGraded ? 'Bỏ chấm' : 'Chấm điểm'}
												</button>
											</div>
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
