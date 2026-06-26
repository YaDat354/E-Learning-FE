import axios from 'axios'
import api from '../lib/api.ts'
import { COURSES } from './courseService.ts'

type ContinueLearningItem = {
  courseId: string
  courseTitle: string
  lessonId: string
  lessonTitle: string
  lessonDuration: string
}

type LessonProgressPayload = {
  currentSecond?: number
  isCompleted?: boolean
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

function dedupeIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter((id) => id.length > 0)))
}

function mapToCourseIds(payload: unknown): string[] {
  const rows = extractArrayPayload<unknown>(payload)

  const ids = rows
    .map((row) => {
      if (typeof row === 'string') {
        return row.trim()
      }

      const item = asRecord(row)
      const nestedCourse = asRecord(item.course)
      const nestedCourseData = asRecord(item.courseData)
      return extractString(item.courseId)
        || extractString(item.course_id)
        || extractString(item.id)
        || extractString(nestedCourse.id)
        || extractString(nestedCourseData.id)
    })

  return dedupeIds(ids)
}

function normalizeContinueItem(row: unknown): ContinueLearningItem | null {
  const item = asRecord(row)
  const course = asRecord(item.course)
  const lesson = asRecord(item.lesson)

  const courseId =
    extractString(item.courseId)
    || extractString(item.course_id)
    || extractString(course.id)

  const lessonId =
    extractString(item.lessonId)
    || extractString(item.lesson_id)
    || extractString(item.currentLessonId)
    || extractString(item.current_lesson_id)
    || extractString(lesson.id)

  if (!courseId || !lessonId) {
    return null
  }

  const fallbackCourse = COURSES.find((entry) => entry.id === courseId)
  const fallbackLesson = fallbackCourse?.lessons.find((entry) => entry.id === lessonId)

  const courseTitle =
    extractString(item.courseTitle)
    || extractString(item.course_title)
    || extractString(course.title)
    || fallbackCourse?.title
    || 'Khóa học'

  const lessonTitle =
    extractString(item.lessonTitle)
    || extractString(item.lesson_title)
    || extractString(item.title)
    || extractString(lesson.title)
    || fallbackLesson?.title
    || 'Bài học'

  const lessonDuration =
    extractString(item.lessonDuration)
    || extractString(item.lesson_duration)
    || extractString(item.duration)
    || extractString(lesson.duration)
    || fallbackLesson?.duration
    || 'Đang cập nhật'

  return {
    courseId,
    courseTitle,
    lessonId,
    lessonTitle,
    lessonDuration,
  }
}

export async function fetchMyCourses(): Promise<string[]> {
  const { data } = await api.get('/me/courses')
  return mapToCourseIds(data)
}

export async function fetchContinueLearning(limit = 3): Promise<ContinueLearningItem[]> {
  const { data } = await api.get('/me/continue-learning', {
    params: { limit },
  })

  const rows = extractArrayPayload<unknown>(data)
  return rows
    .map((row) => normalizeContinueItem(row))
    .filter((item): item is ContinueLearningItem => Boolean(item))
    .slice(0, limit)
}

export async function enrollCourse(courseId: string): Promise<void> {
  try {
    await api.post(`/courses/${encodeURIComponent(courseId)}/enroll`)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      return
    }

    throw error
  }
}

export async function updateLessonProgress(lessonId: string, payload: LessonProgressPayload): Promise<void> {
  await api.patch(`/me/lessons/${encodeURIComponent(lessonId)}/progress`, {
    lastPositionSec: payload.currentSecond ?? 0,
    currentSecond: payload.currentSecond ?? 0,
    isCompleted: payload.isCompleted ?? false,
  })
}

type AssignmentSubmissionInput = {
  content?: string
  files?: File[]
  fileUrl?: string
  assignmentId?: string
  courseId?: string
}

type AssignmentSubmissionResult = {
  saved: 'server' | 'local'
}

const LOCAL_ASSIGNMENT_SUBMISSIONS_KEY = 'learning-assignment-submissions-local'

function persistLocalAssignmentSubmission(payload: {
  lessonId: string
  courseId?: string
  assignmentId?: string
  content?: string
  fileUrl?: string
  files?: File[]
}) {
  if (typeof window === 'undefined') {
    return
  }

  const record = {
    id: `local-assignment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    assignmentId: payload.assignmentId || `lesson-${payload.lessonId}`,
    assignmentTitle: 'Bài tập',
    score: null,
    feedback: 'Đã lưu tạm trên thiết bị do backend chưa hỗ trợ endpoint nộp bài.',
    submittedAt: new Date().toISOString(),
    courseId: payload.courseId,
    lessonId: payload.lessonId,
    content: payload.content ?? '',
    fileUrl: payload.fileUrl ?? '',
    fileNames: Array.isArray(payload.files) ? payload.files.map((item) => item.name) : [],
    source: 'local-fallback',
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_ASSIGNMENT_SUBMISSIONS_KEY)
    const list = raw ? JSON.parse(raw) : []
    const next = Array.isArray(list) ? [record, ...list].slice(0, 50) : [record]
    window.localStorage.setItem(LOCAL_ASSIGNMENT_SUBMISSIONS_KEY, JSON.stringify(next))
  } catch {
    // no-op
  }
}

function extractApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Gửi bài tập thất bại. Vui lòng thử lại.'
  }

  const data = error.response?.data
  if (typeof data === 'string' && data.trim().length > 0) {
    return data
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const message = record.message

    if (Array.isArray(message)) {
      const joined = message.filter((item): item is string => typeof item === 'string').join('; ').trim()
      if (joined.length > 0) {
        return joined
      }
    }

    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }

    if (typeof record.error === 'string' && record.error.trim().length > 0) {
      return record.error
    }
  }

  return error.message || 'Gửi bài tập thất bại. Vui lòng thử lại.'
}

function pickAssignmentId(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return ''
}

function extractAssignmentIdFromUnknown(payload: unknown, lessonId?: string): string {
  const rows = extractArrayPayload<unknown>(payload)
  if (rows.length > 0) {
    // Prefer assignment linked to the lesson when possible.
    for (const row of rows) {
      const item = asRecord(row)
      const itemLessonId = pickAssignmentId(item.lessonId) || pickAssignmentId(item.lesson_id)
      if (lessonId && itemLessonId && itemLessonId !== lessonId) {
        continue
      }

      const nestedAssignment = asRecord(item.assignment)
      const candidate =
        pickAssignmentId(item.assignmentId)
        || pickAssignmentId(item.assignment_id)
        || pickAssignmentId(item.id)
        || pickAssignmentId(item._id)
        || pickAssignmentId(nestedAssignment.assignmentId)
        || pickAssignmentId(nestedAssignment.assignment_id)
        || pickAssignmentId(nestedAssignment.id)
        || pickAssignmentId(nestedAssignment._id)

      if (candidate) {
        return candidate
      }
    }
  }

  const root = asRecord(payload)
  const data = asRecord(root.data)
  const assignment = asRecord(root.assignment)
  const nestedAssignment = asRecord(data.assignment)

  return (
    pickAssignmentId(root.assignmentId)
    || pickAssignmentId(root.assignment_id)
    || pickAssignmentId(data.assignmentId)
    || pickAssignmentId(data.assignment_id)
    || pickAssignmentId(assignment.id)
    || pickAssignmentId(assignment.assignmentId)
    || pickAssignmentId(assignment.assignment_id)
    || pickAssignmentId(nestedAssignment.id)
    || pickAssignmentId(nestedAssignment.assignmentId)
    || pickAssignmentId(nestedAssignment.assignment_id)
  )
}

async function resolveAssignmentIdByLesson(lessonId: string, courseId?: string): Promise<string> {
  // Primary: fetch assignments by courseId.
  if (courseId && courseId.trim()) {
    try {
      const { data } = await api.get(`/courses/${encodeURIComponent(courseId.trim())}/assignments`)
      const byLessonId = extractAssignmentIdFromUnknown(data, lessonId)
      if (byLessonId) {
        return byLessonId
      }
    } catch {
      // Continue with other resolver strategies.
    }
  }

  // Fallback: lesson detail may carry assignment metadata.
  try {
    const { data } = await api.get(`/lessons/${encodeURIComponent(lessonId)}`)
    const fromLesson = extractAssignmentIdFromUnknown(data, lessonId)
    if (fromLesson) {
      return fromLesson
    }
  } catch {
    // no-op
  }

  if (courseId && courseId.trim()) {
    try {
      const { data } = await api.get(`/courses/${encodeURIComponent(courseId.trim())}/lessons/${encodeURIComponent(lessonId)}`)
      const fromCourseLesson = extractAssignmentIdFromUnknown(data, lessonId)
      if (fromCourseLesson) {
        return fromCourseLesson
      }
    } catch {
      // no-op
    }
  }

  return ''
}

export async function submitAssignment(lessonId: string, input: AssignmentSubmissionInput | string, fileUrl?: string): Promise<AssignmentSubmissionResult> {
  const normalizedInput: AssignmentSubmissionInput =
    typeof input === 'string'
      ? { content: input, fileUrl }
      : input

  const content = (normalizedInput.content ?? '').trim()
  const files = Array.isArray(normalizedInput.files) ? normalizedInput.files : []
  const normalizedFileUrl = (normalizedInput.fileUrl ?? '').trim()
  const courseId = (normalizedInput.courseId ?? '').trim()
  let normalizedAssignmentId = (normalizedInput.assignmentId ?? '').trim()

  if (!content && files.length === 0 && !normalizedFileUrl) {
    throw new Error('Vui lòng nhập nội dung hoặc đính kèm tệp trước khi gửi bài.')
  }

  if (!normalizedAssignmentId || normalizedAssignmentId === lessonId) {
    normalizedAssignmentId = await resolveAssignmentIdByLesson(lessonId, courseId)
  }

  const encodedLessonId = encodeURIComponent(lessonId)
  const encodedCourseId = courseId ? encodeURIComponent(courseId) : ''

  const assignmentScopedEndpoints = normalizedAssignmentId
    ? [
      `/me/assignments/${encodeURIComponent(normalizedAssignmentId)}/submit`,
      `/me/assignments/${encodeURIComponent(normalizedAssignmentId)}/submissions`,
      `/assignments/${encodeURIComponent(normalizedAssignmentId)}/submit`,
      `/assignments/${encodeURIComponent(normalizedAssignmentId)}/submissions`,
      `/lessons/${encodedLessonId}/assignments/${encodeURIComponent(normalizedAssignmentId)}/submit`,
      `/lessons/${encodedLessonId}/assignments/${encodeURIComponent(normalizedAssignmentId)}/submissions`,
    ]
    : []

  const lessonScopedEndpoints = [
    `/me/lessons/${encodedLessonId}/assignments/submit`,
    `/me/lessons/${encodedLessonId}/assignments/submissions`,
    `/lessons/${encodedLessonId}/assignments/submit`,
    `/lessons/${encodedLessonId}/assignments/submissions`,
    `/lessons/${encodedLessonId}/assignment/submit`,
    `/lessons/${encodedLessonId}/assignment/submissions`,
    ...(encodedCourseId
      ? [
        `/courses/${encodedCourseId}/lessons/${encodedLessonId}/assignments/submit`,
        `/courses/${encodedCourseId}/lessons/${encodedLessonId}/assignments/submissions`,
      ]
      : []),
  ]

  const genericSubmissionEndpoints = [
    '/submissions',
    '/me/submissions',
    '/assignment-submissions',
    '/me/assignment-submissions',
    '/assignments/submissions',
    '/me/assignments/submissions',
    ...(encodedCourseId ? [`/courses/${encodedCourseId}/submissions`] : []),
    `/lessons/${encodedLessonId}/submissions`,
  ]

  const endpoints = [...assignmentScopedEndpoints, ...lessonScopedEndpoints, ...genericSubmissionEndpoints]
  const preferredLessonEndpoints = [
    `/me/lessons/${encodedLessonId}/assignments/submit`,
    `/me/lessons/${encodedLessonId}/assignments/submissions`,
  ]

  if (files.length > 0) {
    const formData = new FormData()

    if (content) {
      formData.append('content', content)
      formData.append('text', content)
      formData.append('answer', content)
    }

    if (normalizedFileUrl) {
      formData.append('fileUrl', normalizedFileUrl)
    }

    formData.append('lessonId', lessonId)
    formData.append('lesson_id', lessonId)

    if (courseId) {
      formData.append('courseId', courseId)
      formData.append('course_id', courseId)
    }

    if (normalizedAssignmentId) {
      formData.append('assignmentId', normalizedAssignmentId)
      formData.append('assignment_id', normalizedAssignmentId)
    }

    files.forEach((file) => {
      formData.append('files', file)
      formData.append('file', file)
    })

    let lastError: unknown = null

    for (let index = 0; index < endpoints.length; index += 1) {
      const endpoint = endpoints[index]
      try {
        await api.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return { saved: 'server' }
      } catch (error) {
        lastError = error
        const statusCode = axios.isAxiosError(error) ? error.response?.status : null
        if (statusCode === 404 || statusCode === 422) {
          continue
        }

        throw error
      }
    }

    if (!normalizedAssignmentId && axios.isAxiosError(lastError) && lastError.response?.status === 404) {
      persistLocalAssignmentSubmission({
        lessonId,
        courseId: courseId || undefined,
        assignmentId: normalizedAssignmentId || undefined,
        content,
        fileUrl: normalizedFileUrl || undefined,
        files,
      })
      return { saved: 'local' }
    }

    if (lastError) {
      throw new Error(extractApiErrorMessage(lastError))
    }

    throw new Error('Gửi bài tập thất bại. Vui lòng thử lại.')
  }

  const payload: Record<string, unknown> = {
    lessonId,
    lesson_id: lessonId,
  }

  if (courseId) {
    payload.courseId = courseId
    payload.course_id = courseId
  }

  if (content) {
    payload.content = content
    payload.text = content
    payload.answer = content
  }

  if (normalizedFileUrl) {
    payload.fileUrl = normalizedFileUrl
  }

  if (normalizedAssignmentId) {
    payload.assignmentId = normalizedAssignmentId
    payload.assignment_id = normalizedAssignmentId
  }

  let lastError: unknown = null

  const compactPayloadCandidates: Record<string, unknown>[] = []
  if (content) {
    compactPayloadCandidates.push({ content })
    compactPayloadCandidates.push({ text: content })
    compactPayloadCandidates.push({ answer: content })
    compactPayloadCandidates.push({ submission: content })
    compactPayloadCandidates.push({ submissionText: content })
    compactPayloadCandidates.push({ body: content })
  }

  if (normalizedAssignmentId) {
    compactPayloadCandidates.push({ content, assignmentId: normalizedAssignmentId })
    compactPayloadCandidates.push({ text: content, assignmentId: normalizedAssignmentId })
  }

  for (let endpointIndex = 0; endpointIndex < preferredLessonEndpoints.length; endpointIndex += 1) {
    const endpoint = preferredLessonEndpoints[endpointIndex]

    for (let payloadIndex = 0; payloadIndex < compactPayloadCandidates.length; payloadIndex += 1) {
      const candidatePayload = compactPayloadCandidates[payloadIndex]
      try {
        await api.post(endpoint, candidatePayload)
        return { saved: 'server' }
      } catch (error) {
        lastError = error
        const statusCode = axios.isAxiosError(error) ? error.response?.status : null
        if (statusCode === 404 || statusCode === 422 || statusCode === 400) {
          continue
        }

        throw error
      }
    }
  }

  for (let index = 0; index < endpoints.length; index += 1) {
    const endpoint = endpoints[index]
    try {
      await api.post(endpoint, payload)
      return { saved: 'server' }
    } catch (error) {
      lastError = error
      const statusCode = axios.isAxiosError(error) ? error.response?.status : null
      if (statusCode === 404 || statusCode === 422 || statusCode === 400) {
        continue
      }

      throw error
    }
  }

  if (!normalizedAssignmentId && axios.isAxiosError(lastError) && lastError.response?.status === 404) {
    persistLocalAssignmentSubmission({
      lessonId,
      courseId: courseId || undefined,
      assignmentId: normalizedAssignmentId || undefined,
      content,
      fileUrl: normalizedFileUrl || undefined,
    })
    return { saved: 'local' }
  }

  if (lastError) {
    throw new Error(extractApiErrorMessage(lastError))
  }

  throw new Error('Gửi bài tập thất bại. Vui lòng thử lại.')
}

export type { ContinueLearningItem, LessonProgressPayload }
