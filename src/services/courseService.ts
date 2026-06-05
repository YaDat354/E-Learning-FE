import axios from 'axios'
import api from '../lib/api.ts'
import type { Comment, Course, Lesson, LessonExercise, Quiz, TranscriptLine, TranslationLine, User } from '../types/domain.ts'

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

function serializeCourseLevel(level: Course['level'] | string | undefined): string | undefined {
	if (!level) {
		return undefined
	}

	const normalized = level.trim().toLowerCase()

	if (normalized === 'cơ bản' || normalized === 'co_ban' || normalized === 'coban' || normalized === 'beginner') {
		return 'co_ban'
	}

	if (normalized === 'trung cấp' || normalized === 'trung_cap' || normalized === 'trungcap' || normalized === 'intermediate') {
		return 'trung_cap'
	}

	if (normalized === 'nâng cao' || normalized === 'cao_cap' || normalized === 'caocap' || normalized === 'advanced') {
		return 'cao_cap'
	}

	return undefined
}

function normalizeCourseCategory(value: unknown, title: unknown): string {
	if (typeof value === 'string' && value.trim().length > 0) {
		return value.trim()
	}

	const safeTitle = typeof title === 'string' ? title : ''
	if (!safeTitle) {
		return 'Khác'
	}

	const baseTitle = safeTitle.split(' - ')[0]?.trim() || safeTitle.trim()
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

function stripHtmlText(value: string): string {
	const withoutTags = value.replace(/<[^>]*>/g, ' ')
	const withoutEntities = withoutTags
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")

	return withoutEntities.replace(/\s+/g, ' ').trim()
}

function htmlToLines(value: string): string[] {
	const withBreaks = value
		.replace(/<\s*br\s*\/?\s*>/gi, '\n')
		.replace(/<\/(p|div|li|h\d|tr)>/gi, '\n')
		.replace(/<(li|tr|td|th)\b[^>]*>/gi, '')

	return withBreaks
		.split(/\n+/)
		.map((line) => stripHtmlText(line))
		.filter((line) => line.length > 0)
}

function readStringFromSources(sources: Array<Record<string, unknown>>, keys: string[]): string {
	for (const source of sources) {
		for (const key of keys) {
			const value = source[key]
			if (typeof value === 'string' && value.trim().length > 0) {
				return value
			}
		}
	}

	return ''
}

function readIdentifierFromSources(sources: Array<Record<string, unknown>>, keys: string[]): string {
	for (const source of sources) {
		for (const key of keys) {
			const value = source[key]
			if (typeof value === 'string' && value.trim().length > 0) {
				return value
			}

			if (typeof value === 'number' && Number.isFinite(value)) {
				return String(value)
			}
		}
	}

	return ''
}

function normalizeTranslationLine(value: Partial<TranslationLine> | string): TranslationLine {
	if (typeof value === 'string') {
		const cleaned = stripHtmlText(value)
		return { original: cleaned, translated: cleaned }
	}

	const raw = asRecord(value)
	return {
		original: typeof raw.original === 'string' && raw.original.trim().length > 0 ? stripHtmlText(raw.original) : '',
		translated: typeof raw.translated === 'string' && raw.translated.trim().length > 0 ? stripHtmlText(raw.translated) : typeof raw.vi === 'string' && raw.vi.trim().length > 0 ? stripHtmlText(raw.vi) : '',
		note: typeof raw.note === 'string' && raw.note.trim().length > 0 ? stripHtmlText(raw.note) : undefined,
	}
}

function normalizeLessonExercise(value: Partial<LessonExercise> | string): LessonExercise {
	if (typeof value === 'string') {
		return { prompt: stripHtmlText(value) }
	}

	const raw = asRecord(value)
	return {
		prompt: typeof raw.prompt === 'string' && raw.prompt.trim().length > 0 ? stripHtmlText(raw.prompt) : typeof raw.question === 'string' && raw.question.trim().length > 0 ? stripHtmlText(raw.question) : '',
		hint: typeof raw.hint === 'string' && raw.hint.trim().length > 0 ? stripHtmlText(raw.hint) : undefined,
		answer: typeof raw.answer === 'string' && raw.answer.trim().length > 0 ? stripHtmlText(raw.answer) : undefined,
	}
}

function normalizeTranscriptLine(value: Partial<TranscriptLine> | string): TranscriptLine {
	if (typeof value === 'string') {
		return { original: stripHtmlText(value) }
	}

	const raw = asRecord(value)
	return {
		original: typeof raw.original === 'string' && raw.original.trim().length > 0 ? stripHtmlText(raw.original) : typeof raw.text === 'string' && raw.text.trim().length > 0 ? stripHtmlText(raw.text) : '',
		translated: typeof raw.translated === 'string' && raw.translated.trim().length > 0 ? stripHtmlText(raw.translated) : typeof raw.vi === 'string' && raw.vi.trim().length > 0 ? stripHtmlText(raw.vi) : undefined,
		note: typeof raw.note === 'string' && raw.note.trim().length > 0 ? stripHtmlText(raw.note) : undefined,
	}
}

function readNumberFromSources(sources: Array<Record<string, unknown>>, keys: string[]): number | null {
	for (const source of sources) {
		for (const key of keys) {
			const value = source[key]
			if (typeof value === 'number' && Number.isFinite(value)) {
				return value
			}

			if (typeof value === 'string' && value.trim().length > 0) {
				const parsed = Number(value)
				if (Number.isFinite(parsed)) {
					return parsed
				}
			}
		}
	}

	return null
}

function normalizeQuizOption(value: unknown): string {
	if (typeof value === 'string') {
		return stripHtmlText(value)
	}

	const raw = asRecord(value)
	return stripHtmlText(
		readStringFromSources([raw], ['text', 'label', 'content', 'value', 'option', 'answer'])
	)
}

function normalizeQuizQuestion(value: unknown, index: number): Quiz['questions'][number] | null {
	const raw = asRecord(value)
	const text = readStringFromSources([raw], ['text', 'question', 'prompt', 'content', 'title', 'name'])
	const optionSource = readArrayFromSources([raw], ['options', 'choices', 'answers', 'items'])
	const orderedOptionSource = optionSource.slice().sort((left, right) => {
		const leftOrder = readNumberFromSources([asRecord(left)], ['orderIndex', 'order_index']) ?? 0
		const rightOrder = readNumberFromSources([asRecord(right)], ['orderIndex', 'order_index']) ?? 0
		return leftOrder - rightOrder
	})
	const options = orderedOptionSource
		.map((item) => normalizeQuizOption(item))
		.filter((item) => item.length > 0)

	if (!text || options.length === 0) {
		return null
	}

	const correctAnswerText = readStringFromSources([raw], ['correctAnswer', 'answer', 'correctOption', 'correct'])
	const numericCorrectIndex = readNumberFromSources([raw], ['correctIndex', 'correctOptionIndex', 'answerIndex', 'correct_answer_index'])
	const answerFlagIndex = orderedOptionSource.findIndex((item) => {
		const answer = asRecord(item)
		return answer.is_correct === true || answer.isCorrect === true
	})
	const matchedAnswerIndex = correctAnswerText
		? options.findIndex((option) => option === stripHtmlText(correctAnswerText))
		: -1
	const correctIndex = numericCorrectIndex !== null
		? numericCorrectIndex
		: answerFlagIndex >= 0
			? answerFlagIndex
		: matchedAnswerIndex >= 0
			? matchedAnswerIndex
			: 0

	return {
		id: readStringFromSources([raw], ['id', '_id', 'questionId', 'question_id']) || `question-${index + 1}`,
		text: stripHtmlText(text),
		options,
		correctIndex: correctIndex >= 0 && correctIndex < options.length ? correctIndex : 0,
		explanation: stripHtmlText(readStringFromSources([raw], ['explanation', 'explain', 'solution', 'note', 'description', 'content'])),
	}
}

function normalizeQuiz(value: unknown, fallbackTitle: string): Quiz | null {
	if (!value) {
		return null
	}

	if (Array.isArray(value)) {
		const looksLikeQuestionList = value.some((item) => {
			const raw = asRecord(item)
			return Boolean(readStringFromSources([raw], ['text', 'question', 'prompt', 'content']))
				&& Array.isArray(raw.answers ?? raw.options ?? raw.choices)
		})

		if (looksLikeQuestionList) {
			const questions = value
				.map((item, index) => normalizeQuizQuestion(item, index))
				.filter((item): item is Quiz['questions'][number] => Boolean(item))

			return questions.length > 0
				? {
					title: `Quiz: ${fallbackTitle}`,
					questions,
				}
				: null
		}

		for (const item of value) {
			const normalized = normalizeQuiz(item, fallbackTitle)
			if (normalized) {
				return normalized
			}
		}

		return null
	}

	const raw = asRecord(value)
	const data = asRecord(raw.data)
	const meta = asRecord(raw.meta)
	const sources = [raw, data, meta]
	const questionSource = readArrayFromSources(sources, ['questions', 'questionList', 'quizQuestions', 'items'])
	const questions = questionSource
		.map((item, index) => normalizeQuizQuestion(item, index))
		.filter((item): item is Quiz['questions'][number] => Boolean(item))

	if (questions.length === 0) {
		return null
	}

	return {
		title: readStringFromSources(sources, ['title', 'name', 'quizTitle', 'quiz_title']) || `Quiz: ${fallbackTitle}`,
		questions,
	}
}

function readLessonQuizId(value: unknown): string {
	const raw = asRecord(value)
	return readStringFromSources([raw], ['quizId', 'quiz_id'])
}

async function fetchQuizDetailById(courseId: string, quizId: string, fallbackTitle: string): Promise<Quiz | null> {
	const endpoints = [
		`/courses/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(quizId)}`,
		`/quizzes/${encodeURIComponent(quizId)}`,
		`/quiz/${encodeURIComponent(quizId)}`,
	]

	for (const endpoint of endpoints) {
		try {
			const { data } = await api.get(endpoint)
			const normalized = normalizeQuiz(data, fallbackTitle)
			if (normalized) {
				return normalized
			}
		} catch (error) {
			console.warn('quiz detail request failed', endpoint, error)
		}
	}

	return null
}





function readArrayFromSources(sources: Array<Record<string, unknown>>, keys: string[]): unknown[] {
	for (const source of sources) {
		for (const key of keys) {
			const value = source[key]
			if (Array.isArray(value)) {
				return value
			}
		}
	}

	return []
}

function readValueFromSources(sources: Array<Record<string, unknown>>, keys: string[]): unknown {
	for (const source of sources) {
		for (const key of keys) {
			const value = source[key]
			if (value !== undefined && value !== null) {
				return value
			}
		}
	}

	return null
}

function collectQuizCandidatesDeep(value: unknown, depth = 0, visited = new WeakSet<object>()): unknown[] {
	if (!value || depth > 6) {
		return []
	}

	if (Array.isArray(value)) {
		const looksLikeQuestionList = value.some((item) => {
			const raw = asRecord(item)
			return Boolean(readStringFromSources([raw], ['text', 'question', 'prompt']))
		})

		if (looksLikeQuestionList) {
			return [value]
		}

		return value.flatMap((item) => collectQuizCandidatesDeep(item, depth + 1, visited))
	}

	if (typeof value !== 'object') {
		return []
	}

	if (visited.has(value as object)) {
		return []
	}
	visited.add(value as object)

	const raw = value as Record<string, unknown>
	const candidates: unknown[] = []
	const quizKeys = new Set(['quiz', 'quizs', 'quizzes', 'quizData', 'quizContent', 'exerciseQuiz', 'quizQuestions', 'questions'])

	for (const [key, child] of Object.entries(raw)) {
		if (quizKeys.has(key)) {
			candidates.push(child)
		}
	}

	for (const child of Object.values(raw)) {
		candidates.push(...collectQuizCandidatesDeep(child, depth + 1, visited))
	}

	return candidates
}



function normalizeLesson(lesson: Partial<Lesson>): Lesson {
	const rawLesson = asRecord(lesson)
	const nestedContent = asRecord(rawLesson.content)
	const lessonContent = asRecord(rawLesson.lessonContent)
	const detailContent = asRecord(rawLesson.detail)
	const practiceContent = asRecord(rawLesson.practiceBlock)
	const stringSources = [nestedContent, lessonContent, detailContent, practiceContent, rawLesson]
	const resolvedVideoId =
		typeof lesson.videoId === 'string' && lesson.videoId.trim().length > 0
			? lesson.videoId
			: typeof rawLesson.videoUrl === 'string' && rawLesson.videoUrl.trim().length > 0
				? rawLesson.videoUrl
				: typeof rawLesson.video_url === 'string' && rawLesson.video_url.trim().length > 0
					? rawLesson.video_url
					: typeof rawLesson.youtubeUrl === 'string' && rawLesson.youtubeUrl.trim().length > 0
						? rawLesson.youtubeUrl
						: typeof rawLesson.youtube_url === 'string' && rawLesson.youtube_url.trim().length > 0
							? rawLesson.youtube_url
							: typeof rawLesson.embedUrl === 'string' && rawLesson.embedUrl.trim().length > 0
								? rawLesson.embedUrl
								: typeof rawLesson.embed_url === 'string' && rawLesson.embed_url.trim().length > 0
									? rawLesson.embed_url
									: typeof rawLesson.audioUrl === 'string' && rawLesson.audioUrl.trim().length > 0
										? rawLesson.audioUrl
										: typeof rawLesson.audio_url === 'string' && rawLesson.audio_url.trim().length > 0
											? rawLesson.audio_url
											: ''
		const transcriptSource = readArrayFromSources([nestedContent, lessonContent, detailContent, practiceContent, rawLesson], [
			'transcript',
			'transcripts',
			'transcriptLines',
			'videoTranscript',
			'transcriptTranslations',
			'translations',
			'translationLines',
			'translation',
		])
		const translationSource = readArrayFromSources([nestedContent, lessonContent, detailContent, practiceContent, rawLesson], [
			'translations',
			'translationLines',
			'translation',
			'transcriptTranslations',
			'transcript',
			'transcripts',
			'transcriptLines',
			'videoTranscript',
		])
		const exerciseSource = readArrayFromSources([nestedContent, lessonContent, detailContent, practiceContent, rawLesson], [
			'exercises',
			'practice',
			'practiceItems',
			'assignments',
			'task',
			'tasks',
			'taskItems',
		])
		const quizSource = readValueFromSources([nestedContent, lessonContent, detailContent, practiceContent, rawLesson], ['quiz', 'quizData', 'quizContent', 'exerciseQuiz', 'quizzes', 'quizs', 'quizQuestions', 'questions'])
		const transcriptText = readStringFromSources(stringSources, ['transcript', 'transcripts', 'transcriptHtml', 'transcript_html', 'contentTranscript', 'dialogue', 'dialogueHtml'])
		const transcriptFallback = transcriptSource.length === 0 && transcriptText
			? htmlToLines(transcriptText)
			: []
		const deepQuizCandidates = collectQuizCandidatesDeep(rawLesson)
		const resolvedQuiz = normalizeQuiz(quizSource, lesson.title || 'Bài học')
			?? deepQuizCandidates
				.map((candidate) => normalizeQuiz(candidate, lesson.title || 'Bài học'))
				.find((candidate): candidate is Quiz => Boolean(candidate))
			?? normalizeQuiz(lesson.quiz, lesson.title || 'Bài học')

	const finalLesson = {
		id:
			typeof lesson.id === 'string' && lesson.id.trim().length > 0
				? lesson.id
				: typeof lesson.id === 'number'
					? String(lesson.id)
					: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		title: lesson.title || 'Bài học chưa có tiêu đề',
		duration: lesson.duration || '00:00',
		videoId: resolvedVideoId,
		description: lesson.description || '',
		videoScript: lesson.videoScript ?? [],
		keyPhrases: lesson.keyPhrases ?? [],
		transcript: (transcriptSource.length > 0 ? transcriptSource : transcriptFallback).map((item) => normalizeTranscriptLine(item as Partial<TranscriptLine> | string)).filter((item) => item.original),
		task: [],
		translations: translationSource.map((item) => normalizeTranslationLine(item as Partial<TranslationLine> | string)).filter((item) => item.original || item.translated),
		exercises: exerciseSource.map((item) => normalizeLessonExercise(item as Partial<LessonExercise> | string)).filter((item) => item.prompt),
		isFree: Boolean(lesson.isFree),
		quiz: resolvedQuiz,
		resources: lesson.resources ?? [],
	}

	return finalLesson
}

function replaceArray<T>(target: T[], next: T[]) {
	target.splice(0, target.length, ...next)
}

function normalizeCourse(course: Course): Course {
	const raw = asRecord(course)
	const teacher = asRecord(raw.teacher)
	const instructor = asRecord(raw.instructor)
	const fallbackTitle = typeof course?.title === 'string' ? course.title : ''
	const title = typeof raw.title === 'string' && raw.title.trim().length > 0
		? raw.title.trim()
		: fallbackTitle || 'Khóa học chưa có tiêu đề'
	const level = normalizeCourseLevel(raw.level ?? course.level)
	const instructorNameRaw = typeof raw.instructor === 'string' ? raw.instructor : ''
	const teacherName = typeof raw.teacher_name === 'string' && raw.teacher_name.trim().length > 0
		? raw.teacher_name
		: typeof raw.teacherName === 'string' && raw.teacherName.trim().length > 0
			? raw.teacherName
			: typeof teacher.fullName === 'string' && teacher.fullName.trim().length > 0
				? teacher.fullName
				: typeof instructor.fullName === 'string' && instructor.fullName.trim().length > 0
					? instructor.fullName
					: typeof instructor.name === 'string' && instructor.name.trim().length > 0
						? instructor.name
						: instructorNameRaw.trim().length > 0
							? instructorNameRaw
			: course.instructor
	const teacherEmail = typeof raw.teacher_email === 'string' && raw.teacher_email.trim().length > 0
		? raw.teacher_email
		: typeof raw.teacherEmail === 'string' && raw.teacherEmail.trim().length > 0
			? raw.teacherEmail
			: typeof teacher.email === 'string' && teacher.email.trim().length > 0
				? teacher.email
				: typeof raw.instructorEmail === 'string' && raw.instructorEmail.trim().length > 0
					? raw.instructorEmail
					: typeof raw.instructor_email === 'string' && raw.instructor_email.trim().length > 0
						? raw.instructor_email
						: typeof instructor.email === 'string' && instructor.email.trim().length > 0
							? instructor.email
			: ''
	const teacherId = readIdentifierFromSources([raw, teacher, instructor], ['teacherId', 'teacher_id', 'ownerId', 'owner_id', 'id', '_id'])
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
	const lessonCount = readNumberFromSources([raw], ['lessonCount', 'lesson_count'])
		?? (Array.isArray(raw.lessons) ? raw.lessons.length : course.lessons?.length ?? 0)

	return {
		id: readIdentifierFromSources([raw], ['id', '_id', 'courseId', 'course_id'])
			|| course.id
			|| `course-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		teacherId: teacherId || undefined,
		lessonCount,
		title,
		description,
		instructor: teacherName || 'Đang cập nhật',
		instructorEmail: teacherEmail || undefined,
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
	const lessonCount = readNumberFromSources([raw, stats], ['lessonCount', 'lesson_count', 'totalLessons', 'total_lessons'])
		?? lessons.length
	const durationLabel = typeof stats.totalDurationLabel === 'string' && stats.totalDurationLabel.trim().length > 0
		? stats.totalDurationLabel
		: 'Đang cập nhật'

	return normalizeCourse({
		id: typeof raw.id === 'string' ? raw.id : '',
		teacherId: readIdentifierFromSources([raw, teacher], ['teacherId', 'teacher_id', 'ownerId', 'owner_id', 'id', '_id']) || undefined,
		lessonCount,
		title,
		description: typeof raw.description === 'string' ? raw.description : '',
		instructor: teacherName,
		instructorEmail: teacherEmail || undefined,
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

export async function fetchLessonDetail(courseId: string, lessonId: string) {
	const endpoints = [
		`/lessons/${encodeURIComponent(lessonId)}`,
		`/lesson/${encodeURIComponent(lessonId)}`,
		`/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
		`/courses/${encodeURIComponent(courseId)}/lesson/${encodeURIComponent(lessonId)}`,
		`/courses/${encodeURIComponent(courseId)}/lessons/detail/${encodeURIComponent(lessonId)}`,
	]

	for (const endpoint of endpoints) {
		try {
			const { data } = await api.get(endpoint)
			const extracted = extractObjectPayload<Partial<Lesson>>(data)
			const normalizedLesson = normalizeLesson(extracted)
			if (normalizedLesson.quiz) {
				return normalizedLesson
			}

			const quizId = readLessonQuizId(extracted)
			if (!quizId) {
				return normalizedLesson
			}

			const fetchedQuiz = await fetchQuizDetailById(courseId, quizId, normalizedLesson.title)
			return fetchedQuiz
				? {
					...normalizedLesson,
					quiz: fetchedQuiz,
				}
				: normalizedLesson
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 403) {
				throw error
			}

			console.warn('lesson detail request failed', endpoint, error)
		}
	}

	throw new Error(`lesson detail not found for ${lessonId}`)
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

export async function initializeDomainData(): Promise<boolean> {
	if (initialized) {
		return true
	}

	const results = await Promise.allSettled([fetchCourses()])
	initialized = true

	return results.some((result) => result.status === 'fulfilled')
}

export async function createCourse(payload: Omit<Course, 'id'> & { id?: string }) {
	const requestPayload = {
		title: payload.title,
		level: serializeCourseLevel(payload.level),
		description: payload.description,
	}
	const { data } = await api.post('/courses', requestPayload)
	const normalized = normalizeCourse(extractObjectPayload<Course>(data))
	COURSES.unshift(normalized)
	return normalized
}

export async function updateCourse(courseId: string, payload: Partial<Course>) {
	const requestPayload = {
		title: payload.title,
		level: serializeCourseLevel(payload.level),
		description: payload.description,
	}

	let normalized: Course

	try {
		const response = await api.patch(`/courses/${encodeURIComponent(courseId)}`, requestPayload)
		normalized = normalizeCourse(extractObjectPayload<Course>(response.data))
	} catch {
		const fallbackResponse = await api.put(`/courses/${encodeURIComponent(courseId)}`, requestPayload)
		normalized = normalizeCourse(extractObjectPayload<Course>(fallbackResponse.data))
	}

	const index = COURSES.findIndex((course) => course.id === courseId)

	if (index >= 0) {
		COURSES[index] = normalized
	}

	return normalized
}

export async function updateLesson(lessonId: string, payload: Partial<Lesson>) {
	const course = COURSES.find((item) => item.lessons.some((lesson) => lesson.id === lessonId))
	if (!course) {
		throw new Error(`course not found for lesson ${lessonId}`)
	}

	const encodedCourseId = encodeURIComponent(course.id)
	const encodedLessonId = encodeURIComponent(lessonId)
	const updateTargets: Array<{ method: 'patch' | 'put'; endpoint: string }> = [
		{ method: 'patch', endpoint: `/lessons/${encodedLessonId}` },
		{ method: 'patch', endpoint: `/courses/${encodedCourseId}/lessons/${encodedLessonId}` },
		{ method: 'patch', endpoint: `/courses/${encodedCourseId}/lesson/${encodedLessonId}` },
		{ method: 'put', endpoint: `/lessons/${encodedLessonId}` },
		{ method: 'put', endpoint: `/courses/${encodedCourseId}/lessons/${encodedLessonId}` },
	]

	const requestPayload = {
		title: payload.title,
		description: payload.description,
		duration: payload.duration,
		isFree: payload.isFree,
		// Compatibility aliases for BE schemas using snake_case.
		is_free: payload.isFree,
	}

	let data: Lesson | null = null

	for (const target of updateTargets) {
		try {
			const response = target.method === 'patch'
				? await api.patch(target.endpoint, requestPayload)
				: await api.put(target.endpoint, requestPayload)

			const extracted = extractObjectPayload<Partial<Lesson>>(response.data)
			data = normalizeLesson(extracted)
			break
		} catch (error) {
			if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 405)) {
				continue
			}

			throw error
		}
	}

	if (!data) {
		throw new Error(`lesson update route not found for ${lessonId}`)
	}

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
	const course = COURSES.find((item) => item.lessons.some((lesson) => lesson.id === lessonId))
	if (!course) {
		throw new Error(`course not found for lesson ${lessonId}`)
	}

	const encodedCourseId = encodeURIComponent(course.id)
	const encodedLessonId = encodeURIComponent(lessonId)
	const deleteTargets = [
		`/lessons/${encodedLessonId}`,
		`/courses/${encodedCourseId}/lessons/${encodedLessonId}`,
		`/courses/${encodedCourseId}/lesson/${encodedLessonId}`,
	]

	let deleted = false

	for (const endpoint of deleteTargets) {
		try {
			await api.delete(endpoint)
			deleted = true
			break
		} catch (error) {
			if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 405)) {
				continue
			}

			throw error
		}
	}

	if (!deleted) {
		throw new Error(`lesson delete route not found for ${lessonId}`)
	}

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
	const normalizedQuiz = normalizeQuiz(data, payload.title) ?? payload

	for (const course of COURSES) {
		const lesson = course.lessons.find((item) => item.id === lessonId)
		if (lesson) {
			lesson.quiz = normalizedQuiz
			break
		}
	}

	return normalizedQuiz
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
