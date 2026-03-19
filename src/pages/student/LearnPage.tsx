import LessonPage from '../LessonPage.tsx'
import type { User } from '../../data/mockData.ts'
import './LearnPage.css'

type StudentLearnPageProps = {
	courseId: string
	lessonId: string
	onBack: () => void
	onGoToLesson: (courseId: string, lessonId: string) => void
	onGoAuth: () => void
	user?: User
}

function LearnPage({ courseId, lessonId, onBack, onGoToLesson, onGoAuth, user }: StudentLearnPageProps) {
	const studentUser: User = user ?? {
		name: 'Học viên',
		email: 'student@example.com',
		role: 'student',
	}

	return (
		<LessonPage
			courseId={courseId}
			lessonId={lessonId}
			user={studentUser}
			onBack={onBack}
			onGoToLesson={onGoToLesson}
			onGoAuth={onGoAuth}
		/>
	)
}

export default LearnPage