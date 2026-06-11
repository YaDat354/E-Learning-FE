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

export async function submitAssignment(lessonId: string, content: string, fileUrl?: string): Promise<void> {
  const payload: Record<string, unknown> = {
    content,
  }
  
  if (fileUrl) {
    payload.fileUrl = fileUrl
  }

  await api.post(`/me/lessons/${encodeURIComponent(lessonId)}/assignments/submit`, payload)
}

export type { ContinueLearningItem, LessonProgressPayload }
