import CourseDetailPage from '../CourseDetailPage.tsx'
import type { User } from '../../domain/index.ts'
import './CourseDetail.css'

type StudentCourseDetailProps = {
	courseId: string
	isEnrolled: boolean
	onEnrollCourse: (courseId: string) => Promise<boolean>
	onGoAuth: () => void
	onBack: () => void
	onGoToLesson: (courseId: string, lessonId: string) => void
	user?: User
}

function CourseDetail({ courseId, isEnrolled, onEnrollCourse, onGoAuth, onBack, onGoToLesson, user }: StudentCourseDetailProps) {
	const studentUser: User = user ?? {
		name: 'Học viên',
		email: 'student@example.com',
		role: 'student',
	}

	return (
		<CourseDetailPage
			courseId={courseId}
			user={studentUser}
			isEnrolled={isEnrolled}
			onEnrollCourse={onEnrollCourse}
			onGoAuth={onGoAuth}
			onBack={onBack}
			onGoToLesson={onGoToLesson}
		/>
	)
}

export default CourseDetail