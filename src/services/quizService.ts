import axios from 'axios'
import api from '../lib/api.ts'

type QuizSummary = {
  id: string
  title: string
  description?: string
  timeLimit?: number
}

type QuizDetail = QuizSummary & {
  questions: Array<{
    id: string
    content: string
    orderIndex?: number
    answers?: Array<{
      id: string
      content: string
      isCorrect?: boolean
    }>
  }>
}

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

function toQuizSummary(value: unknown): QuizSummary {
  const raw = asRecord(value)
  return {
    id: typeof raw.id === 'string' ? raw.id : '',
    title: typeof raw.title === 'string' ? raw.title : 'Quiz',
    description: typeof raw.description === 'string' ? raw.description : undefined,
    timeLimit: typeof raw.timeLimit === 'number' ? raw.timeLimit : typeof raw.time_limit === 'number' ? raw.time_limit : undefined,
  }
}

function toQuizDetail(value: unknown): QuizDetail {
  const raw = asRecord(extractObjectPayload<unknown>(value))
  const summary = toQuizSummary(raw)
  const questionsRaw = Array.isArray(raw.questions) ? raw.questions : []

  return {
    ...summary,
    questions: questionsRaw.map((item) => {
      const q = asRecord(item)
      const answers = Array.isArray(q.answers)
        ? q.answers.map((answer) => {
          const a = asRecord(answer)
          return {
            id: typeof a.id === 'string' ? a.id : '',
            content: typeof a.content === 'string' ? a.content : '',
            isCorrect: a.isCorrect === true || a.is_correct === true,
          }
        })
        : []

      return {
        id: typeof q.id === 'string' ? q.id : '',
        content: typeof q.content === 'string' ? q.content : '',
        orderIndex: typeof q.orderIndex === 'number' ? q.orderIndex : typeof q.order_index === 'number' ? q.order_index : undefined,
        answers,
      }
    }),
  }
}

async function requestWithFallback<T>(method: 'get' | 'post' | 'patch' | 'put', endpoints: string[], payload?: unknown) {
  let lastError: unknown = null

  for (const endpoint of endpoints) {
    try {
      const response = method === 'get'
        ? await api.get(endpoint)
        : method === 'post'
          ? await api.post(endpoint, payload)
          : method === 'patch'
            ? await api.patch(endpoint, payload)
            : await api.put(endpoint, payload)

      return response.data as T
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 405)) {
        lastError = error
        continue
      }
      throw error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('quiz endpoint not found')
}

export async function fetchCourseQuizzes(courseId: string): Promise<QuizSummary[]> {
  const endpoints = [
    `/courses/${encodeURIComponent(courseId)}/quizzes`,
    `/courses/${encodeURIComponent(courseId)}/quiz`,
    `/course/${encodeURIComponent(courseId)}/quizzes`,
    `/course/${encodeURIComponent(courseId)}/quiz`,
  ]
  const data = await requestWithFallback<unknown>('get', endpoints)
  const rows = extractArrayPayload<unknown>(data)
  return rows.map((row) => toQuizSummary(row)).filter((item) => item.id.length > 0)
}

export async function fetchQuizDetail(courseId: string, quizId: string): Promise<QuizDetail> {
  const endpoints = [
    `/courses/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(quizId)}`,
    `/courses/${encodeURIComponent(courseId)}/quiz/${encodeURIComponent(quizId)}`,
    `/course/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(quizId)}`,
    `/course/${encodeURIComponent(courseId)}/quiz/${encodeURIComponent(quizId)}`,
  ]
  const data = await requestWithFallback<unknown>('get', endpoints)
  return toQuizDetail(data)
}

export async function createCourseQuiz(courseId: string, payload: { title: string; description?: string; timeLimit?: number }): Promise<QuizSummary> {
  const endpoints = [
    `/courses/${encodeURIComponent(courseId)}/quizzes`,
    `/courses/${encodeURIComponent(courseId)}/quiz`,
    `/course/${encodeURIComponent(courseId)}/quizzes`,
    `/course/${encodeURIComponent(courseId)}/quiz`,
  ]
  const data = await requestWithFallback<unknown>('post', endpoints, payload)
  return toQuizSummary(extractObjectPayload(data))
}

export async function updateCourseQuiz(courseId: string, quizId: string, payload: { title?: string; description?: string; timeLimit?: number }): Promise<QuizSummary> {
  const endpoints = [
    `/courses/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(quizId)}`,
    `/courses/${encodeURIComponent(courseId)}/quiz/${encodeURIComponent(quizId)}`,
    `/course/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(quizId)}`,
    `/course/${encodeURIComponent(courseId)}/quiz/${encodeURIComponent(quizId)}`,
  ]
  const data = await requestWithFallback<unknown>('patch', endpoints, payload)
  return toQuizSummary(extractObjectPayload(data))
}

export type { QuizSummary, QuizDetail }
