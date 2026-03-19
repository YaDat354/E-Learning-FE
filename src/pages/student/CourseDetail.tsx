import CourseDetailPage from '../CourseDetailPage.tsx'
import type { User } from '../../data/mockData.ts'
import './CourseDetail.css'

type StudentCourseDetailProps = {
	courseId: string
	onGoAuth: () => void
	onBack: () => void
	onGoToLesson: (courseId: string, lessonId: string) => void
	user?: User
}

function CourseDetail({ courseId, onGoAuth, onBack, onGoToLesson, user }: StudentCourseDetailProps) {
	const studentUser: User = user ?? {
		name: 'Học viên',
		email: 'student@example.com',
		role: 'student',
	}

	return (
		<CourseDetailPage
			courseId={courseId}
			user={studentUser}
			onGoAuth={onGoAuth}
			onBack={onBack}
			onGoToLesson={onGoToLesson}
		/>
	)
}

export default CourseDetail