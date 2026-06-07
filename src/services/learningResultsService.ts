import api from '../lib/api.ts'
import { COURSES } from './courseService.ts'

type RawRecord = Record<string, unknown>

export type LearningQuizResult = {
	id: string
	quizId: string
	quizTitle: string
	score: number
	submittedAt: string
	courseId?: string
	courseTitle?: string
	lessonId?: string
	lessonTitle?: string
}

export type LearningAssignmentSubmission = {
	id: string
	assignmentId: string
	assignmentTitle: string
	score: number | null
	feedback: string
	submittedAt: string
	gradedAt?: string
	courseTitle?: string
}

export type LearningSummary = {
	quizCount: number
	quizAverageScore: number
	assignmentCount: number
	gradedAssignmentCount: number
	highestQuizScore: number
	latestSubmittedAt?: string
}

export type LearningResultsPayload = {
	quizResults: LearningQuizResult[]
	assignmentSubmissions: LearningAssignmentSubmission[]
	summary: LearningSummary
}

function asRecord(value: unknown): RawRecord {
	return value && typeof value === 'object' ? (value as RawRecord) : {}
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

	const nested = asRecord(data)
	const nestedItems = nested.items ?? nested.results ?? nested.rows
	if (Array.isArray(nestedItems)) {
		return nestedItems as T[]
	}

	const rootItems = root.items ?? root.results ?? root.rows
	if (Array.isArray(rootItems)) {
		return rootItems as T[]
	}

	return []
}

function extractString(value: unknown): string {
	return typeof value === 'string' ? value.trim() : ''
}

function extractNumber(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value
	}

	if (typeof value === 'string' && value.trim().length > 0) {
		const parsed = Number(value)
		return Number.isFinite(parsed) ? parsed : 0
	}

	return 0
}

function findCourseMetaByQuizTitle(quizTitle: string) {
	const normalized = quizTitle.trim().toLowerCase()
	if (!normalized) {
		return null
	}

	for (const course of COURSES) {
		for (const lesson of course.lessons) {
			const lessonQuizTitle = lesson.quiz?.title?.trim().toLowerCase() ?? ''
			if (lessonQuizTitle && lessonQuizTitle === normalized) {
				return {
					courseId: course.id,
					courseTitle: course.title,
					lessonId: lesson.id,
					lessonTitle: lesson.title,
				}
			}
		}
	}

	return null
}

function normalizeQuizResult(row: unknown): LearningQuizResult | null {
	const item = asRecord(row)
	const quizId = extractString(item.quizId) || extractString(item.quiz_id)
	const quizTitle = extractString(item.quizTitle) || extractString(item.quiz_title)

	if (!quizId) {
		return null
	}

	const meta = quizTitle ? findCourseMetaByQuizTitle(quizTitle) : null
	return {
		id: extractString(item.id) || quizId,
		quizId,
		quizTitle: quizTitle || 'Quiz',
		score: extractNumber(item.score),
		submittedAt: extractString(item.submittedAt) || extractString(item.submitted_at) || new Date().toISOString(),
		courseId: meta?.courseId,
		courseTitle: meta?.courseTitle,
		lessonId: meta?.lessonId,
		lessonTitle: meta?.lessonTitle,
	}
}

function normalizeAssignmentSubmission(row: unknown): LearningAssignmentSubmission | null {
	const item = asRecord(row)
	const assignmentId = extractString(item.assignmentId) || extractString(item.assignment_id)
	if (!assignmentId) {
		return null
	}

	return {
		id: extractString(item.id) || assignmentId,
		assignmentId,
		assignmentTitle: extractString(item.assignmentTitle) || extractString(item.assignment_title) || 'Bài tập',
		score: item.score === null || item.score === undefined ? null : extractNumber(item.score),
		feedback: extractString(item.feedback),
		submittedAt: extractString(item.submittedAt) || extractString(item.submitted_at) || new Date().toISOString(),
		gradedAt: extractString(item.gradedAt) || extractString(item.graded_at) || undefined,
		courseTitle: extractString(item.courseTitle) || extractString(item.course_title) || undefined,
	}
}

function summarizeLearning(quizResults: LearningQuizResult[], assignmentSubmissions: LearningAssignmentSubmission[]): LearningSummary {
	const quizCount = quizResults.length
	const quizAverageScore = quizCount > 0
		? Math.round((quizResults.reduce((sum, item) => sum + item.score, 0) / quizCount) * 10) / 10
		: 0
	const assignmentCount = assignmentSubmissions.length
	const gradedAssignmentCount = assignmentSubmissions.filter((item) => item.score !== null).length
	const highestQuizScore = quizCount > 0 ? Math.max(...quizResults.map((item) => item.score)) : 0
	const latestSubmittedAt = [...quizResults.map((item) => item.submittedAt), ...assignmentSubmissions.map((item) => item.submittedAt)]
		.filter(Boolean)
		.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]

	return {
		quizCount,
		quizAverageScore,
		assignmentCount,
		gradedAssignmentCount,
		highestQuizScore,
		latestSubmittedAt,
	}
}

export async function fetchMyLearningResults(): Promise<LearningResultsPayload> {
	const [quizResponse, assignmentResponse] = await Promise.allSettled([
		api.get('/quiz-results/me'),
		api.get('/submissions/me'),
	])

	const quizResults = quizResponse.status === 'fulfilled'
		? extractArrayPayload<unknown>(quizResponse.value.data).map((row) => normalizeQuizResult(row)).filter((item): item is LearningQuizResult => Boolean(item))
		: []

	const assignmentSubmissions = assignmentResponse.status === 'fulfilled'
		? extractArrayPayload<unknown>(assignmentResponse.value.data).map((row) => normalizeAssignmentSubmission(row)).filter((item): item is LearningAssignmentSubmission => Boolean(item))
		: []

	return {
		quizResults,
		assignmentSubmissions,
		summary: summarizeLearning(quizResults, assignmentSubmissions),
	}
}