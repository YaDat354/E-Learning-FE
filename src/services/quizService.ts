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

export async function fetchCourseQuizzes(courseId: string): Promise<QuizSummary[]> {
  const { data } = await api.get(`/courses/${encodeURIComponent(courseId)}/quizzes`)
  const rows = extractArrayPayload<unknown>(data)
  return rows.map((row) => toQuizSummary(row)).filter((item) => item.id.length > 0)
}

export async function fetchQuizDetail(courseId: string, quizId: string): Promise<QuizDetail> {
  const { data } = await api.get(`/courses/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(quizId)}`)
  return toQuizDetail(data)
}

export async function createCourseQuiz(courseId: string, payload: { title: string; description?: string; timeLimit?: number }): Promise<QuizSummary> {
  const { data } = await api.post(`/courses/${encodeURIComponent(courseId)}/quizzes`, payload)
  return toQuizSummary(extractObjectPayload(data))
}

export async function updateCourseQuiz(courseId: string, quizId: string, payload: { title?: string; description?: string; timeLimit?: number }): Promise<QuizSummary> {
  const { data } = await api.patch(`/courses/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(quizId)}`, payload)
  return toQuizSummary(extractObjectPayload(data))
}

export type { QuizSummary, QuizDetail }
