import api from '../lib/api.ts'
import type { Comment } from '../types/domain.ts'

export async function getLessonCommentsApi(lessonId: string) {
  const { data } = await api.get<Comment[]>(`/lessons/${encodeURIComponent(lessonId)}/comments`)
  return data
}
