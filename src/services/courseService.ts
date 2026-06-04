import api from '../lib/api.ts'
import type { Comment, Course, Lesson, Quiz, User } from '../types/domain.ts'

export const COURSES: Course[] = []
export const USERS: User[] = []

const commentsByLesson: Record<string, Comment[]> = {}

let initialized = false

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function extractArrayPayload<T>(payload: unknown): T[] {
	if (Array.isArray(payload)) {
		return payload as T[]
	}

	const root = asRecord(payload)
	const data = root.data

	if (Array.isArray(data)) {
		return data as T[]
	}

	const nestedData = asRecord(data)
	const nestedItems = nestedData.items ?? nestedData.results ?? nestedData.rows

	if (Array.isArray(nestedItems)) {
		return nestedItems as T[]
	}

	const rootItems = root.items ?? root.results ?? root.rows
	if (Array.isArray(rootItems)) {
		return rootItems as T[]
	}

	return []
}

function extractObjectPayload<T>(payload: unknown): T {
	const root = asRecord(payload)
	const data = root.data

	if (data && typeof data === 'object' && !Array.isArray(data)) {
		const nested = asRecord(data)
		const maybeUser = nested.user
		if (maybeUser && typeof maybeUser === 'object' && !Array.isArray(maybeUser)) {
			return maybeUser as T
		}

		return data as T
	}

	return payload as T
}

function normalizeCourseLevel(value: unknown): Course['level'] {
	if (typeof value !== 'string') {
		return 'Cơ bản'
	}

	const normalized = value.trim().toLowerCase()

	if (normalized === 'co_ban' || normalized === 'coban' || normalized === 'beginner') {
		return 'Cơ bản'
	}

	if (normalized === 'trung_cap' || normalized === 'trungcap' || normalized === 'intermediate') {
		return 'Trung cấp'
	}

	if (normalized === 'cao_cap' || normalized === 'caocap' || normalized === 'advanced') {
		return 'Nâng cao'
	}

	if (normalized === 'cơ bản' || normalized === 'trung cấp' || normalized === 'nâng cao') {
		return value as Course['level']
	}

	return 'Cơ bản'
}

function normalizeCourseCategory(value: unknown, title: string): string {
	if (typeof value === 'string' && value.trim().length > 0) {
		return value.trim()
	}

	const baseTitle = title.split(' - ')[0]?.trim() || title.trim()
	if (!baseTitle) {
		return 'Khác'
	}

	return baseTitle
}

function normalizeCategoryColor(level: Course['level']): string {
	if (level === 'Trung cấp') {
		return '#16a34a'
	}

	if (level === 'Nâng cao') {
		return '#7c3aed'
	}

	return '#1066d6'
}

function buildInitialsFromName(name: string): string {
	const initials = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('')

	return initials || 'NA'
}

function normalizeLesson(lesson: Partial<Lesson>): Lesson {
	return {
		id: lesson.id || `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		title: lesson.title || 'Bài học chưa có tiêu đề',
		duration: lesson.duration || '00:00',
		videoId: lesson.videoId || '',
		description: lesson.description || '',
		videoScript: lesson.videoScript ?? [],
		keyPhrases: lesson.keyPhrases ?? [],
		isFree: Boolean(lesson.isFree),
		quiz: lesson.quiz ?? null,
		resources: lesson.resources ?? [],
	}
}

function replaceArray<T>(target: T[], next: T[]) {
	target.splice(0, target.length, ...next)
}

function normalizeCourse(course: Course): Course {
	const raw = asRecord(course)
	const title = typeof raw.title === 'string' && raw.title.trim().length > 0 ? raw.title : course.title
	const level = normalizeCourseLevel(raw.level ?? course.level)
	const teacherName = typeof raw.teacher_name === 'string' && raw.teacher_name.trim().length > 0
		? raw.teacher_name
		: typeof raw.teacherName === 'string' && raw.teacherName.trim().length > 0
			? raw.teacherName
			: course.instructor
	const teacherEmail = typeof raw.teacher_email === 'string' && raw.teacher_email.trim().length > 0
		? raw.teacher_email
		: typeof raw.teacherEmail === 'string' && raw.teacherEmail.trim().length > 0
			? raw.teacherEmail
			: ''
	const category = normalizeCourseCategory(raw.category, title)
	const categoryColor = typeof raw.categoryColor === 'string' && raw.categoryColor.trim().length > 0
		? raw.categoryColor
		: normalizeCategoryColor(level)
	const studentCount = typeof raw.studentCount === 'number'
		? raw.studentCount
		: typeof raw.student_count === 'number'
			? raw.student_count
			: 0
	const duration = typeof raw.duration === 'string' && raw.duration.trim().length > 0
		? raw.duration
		: 'Đang cập nhật'
	const price = typeof raw.price === 'number' ? raw.price : 0
	const originalPrice = typeof raw.originalPrice === 'number' ? raw.originalPrice : 0
	const rating = typeof raw.rating === 'number' ? raw.rating : 0
	const reviewCount = typeof raw.reviewCount === 'number' ? raw.reviewCount : 0
	const instructorAvatar = typeof raw.instructorAvatar === 'string' && raw.instructorAvatar.trim().length > 0
		? raw.instructorAvatar
		: buildInitialsFromName(teacherName || teacherEmail || title)
	const description = typeof raw.description === 'string' && raw.description.trim().length > 0
		? raw.description
		: `${category} - ${title}`
	const tags = Array.isArray(raw.tags)
		? raw.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
		: [level]
	const lessonRows = Array.isArray(raw.lessons) ? raw.lessons as Array<Partial<Lesson>> : course.lessons ?? []

	return {
		id: typeof raw.id === 'string' && raw.id.trim().length > 0
			? raw.id
			: course.id || `course-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		title,
		description,
		instructor: teacherName || 'Đang cập nhật',
		instructorAvatar,
		category,
		categoryColor,
		level,
		rating,
		reviewCount,
		studentCount,
		duration,
		price,
		originalPrice,
		tags,
		lessons: lessonRows.map(normalizeLesson),
	}
}

function normalizeCourseDetail(payload: unknown): Course {
	const raw = asRecord(extractObjectPayload(payload))
	const teacher = asRecord(raw.teacher)
	const stats = asRecord(raw.stats)
	const level = normalizeCourseLevel(raw.level)
	const title = typeof raw.title === 'string' && raw.title.trim().length > 0 ? raw.title : 'Khóa học chưa có tiêu đề'
	const courseCategory = normalizeCourseCategory(raw.category, title)
	const teacherName = typeof teacher.fullName === 'string' && teacher.fullName.trim().length > 0
		? teacher.fullName
		: typeof raw.teacher_name === 'string' && raw.teacher_name.trim().length > 0
			? raw.teacher_name
			: 'Đang cập nhật'
	const teacherEmail = typeof teacher.email === 'string' && teacher.email.trim().length > 0
		? teacher.email
		: typeof raw.teacher_email === 'string' && raw.teacher_email.trim().length > 0
			? raw.teacher_email
			: ''
	const lessons = Array.isArray(raw.lessons) ? raw.lessons.map((lesson) => normalizeLesson(lesson as Partial<Lesson>)) : []
	const totalStudents = typeof stats.totalStudents === 'number' ? stats.totalStudents : 0
	const durationLabel = typeof stats.totalDurationLabel === 'string' && stats.totalDurationLabel.trim().length > 0
		? stats.totalDurationLabel
		: 'Đang cập nhật'

	return normalizeCourse({
		id: typeof raw.id === 'string' ? raw.id : '',
		title,
		description: typeof raw.description === 'string' ? raw.description : '',
		instructor: teacherName,
		instructorAvatar: buildInitialsFromName(teacherName || teacherEmail || title),
		category: courseCategory,
		categoryColor: normalizeCategoryColor(level),
		level,
		rating: 0,
		reviewCount: 0,
		studentCount: totalStudents,
		duration: durationLabel,
		price: 0,
		originalPrice: 0,
		tags: [level],
		lessons,
	})
}

export async function fetchCourses() {
	const { data } = await api.get('/courses')
	const rows = extractArrayPayload<Course>(data)
	replaceArray(COURSES, rows.map(normalizeCourse))
	return COURSES
}

export async function fetchCourseDetail(courseId: string) {
	const { data } = await api.get(`/courses/${encodeURIComponent(courseId)}`)
	return normalizeCourseDetail(data)
}

export async function fetchUsers() {
	const { data } = await api.get('/users/students')
	const rows = extractArrayPayload<User>(data)
	replaceArray(USERS, rows)
	return USERS
}

export async function fetchMe() {
	const { data } = await api.get('/users/me')
	return extractObjectPayload<User>(data)
}

export async function initializeDomainData() {
	if (initialized) {
		return
	}

	await Promise.allSettled([fetchCourses(), fetchUsers()])
	initialized = true
}

export async function createCourse(payload: Omit<Course, 'id'> & { id?: string }) {
	const { data } = await api.post<Course>('/courses', payload)
	COURSES.unshift(normalizeCourse(data))
	return data
}

export async function updateCourse(courseId: string, payload: Partial<Course>) {
	const { data } = await api.put<Course>(`/courses/${encodeURIComponent(courseId)}`, payload)
	const index = COURSES.findIndex((course) => course.id === courseId)

	if (index >= 0) {
		COURSES[index] = normalizeCourse(data)
	}

	return data
}

export async function updateLesson(lessonId: string, payload: Partial<Lesson>) {
	const { data } = await api.put<Lesson>(`/lessons/${encodeURIComponent(lessonId)}`, payload)

	for (const course of COURSES) {
		const index = course.lessons.findIndex((lesson) => lesson.id === lessonId)
		if (index >= 0) {
			course.lessons[index] = {
				...data,
				resources: data.resources ?? [],
				keyPhrases: data.keyPhrases ?? [],
				videoScript: data.videoScript ?? [],
			}
			break
		}
	}

	return data
}

export async function deleteLesson(lessonId: string) {
	await api.delete(`/lessons/${encodeURIComponent(lessonId)}`)

	for (const course of COURSES) {
		const next = course.lessons.filter((lesson) => lesson.id !== lessonId)
		if (next.length !== course.lessons.length) {
			course.lessons = next
			break
		}
	}
}

export async function upsertLessonQuiz(lessonId: string, payload: Quiz) {
	const { data } = await api.put<Quiz>(`/lessons/${encodeURIComponent(lessonId)}/quiz`, payload)

	for (const course of COURSES) {
		const lesson = course.lessons.find((item) => item.id === lessonId)
		if (lesson) {
			lesson.quiz = data
			break
		}
	}

	return data
}

export async function fetchLessonComments(lessonId: string) {
	const { data } = await api.get<Comment[]>(`/lessons/${encodeURIComponent(lessonId)}/comments`)
	commentsByLesson[lessonId] = data
	return data
}

export function getLessonComments(lessonId: string): Comment[] {
	return commentsByLesson[lessonId] ?? []
}

export async function createUser(payload: User) {
	const { data } = await api.post<User>('/users', payload)
	USERS.unshift(data)
	return data
}

export async function updateUser(email: string, payload: User) {
	const { data } = await api.put<User>(`/users/${encodeURIComponent(email)}`, payload)
	const index = USERS.findIndex((user) => user.email === email)
	if (index >= 0) {
		USERS[index] = data
	}
	return data
}

export async function deleteUser(email: string) {
	await api.delete(`/users/${encodeURIComponent(email)}`)
	const index = USERS.findIndex((user) => user.email === email)
	if (index >= 0) {
		USERS.splice(index, 1)
	}
}
