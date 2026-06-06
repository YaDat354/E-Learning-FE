import api from '../lib/api.ts'
import type { Comment } from '../types/domain.ts'

export type DiscussionNotificationItem = {
  courseId: string
  lessonId: string
  unreadCount: number
  latestCommentAt?: string
}

export type DiscussionNotificationsPayload = {
  totalUnread: number
  items: DiscussionNotificationItem[]
}

const DISCUSSION_NOTIFICATION_ENDPOINTS = [
  '/me/discussion-notifications',
  '/discussion-notifications/me',
  '/notifications/discussion/me',
]

const MARK_READ_ENDPOINT_BY_LESSON = (lessonId: string) => [
  `/lessons/${encodeURIComponent(lessonId)}/comments/mark-read`,
  `/lessons/${encodeURIComponent(lessonId)}/discussion/mark-read`,
  `/discussion-notifications/lessons/${encodeURIComponent(lessonId)}/mark-read`,
]

const CREATE_COMMENT_ENDPOINT_BY_LESSON = (lessonId: string) => [
  `/lessons/${encodeURIComponent(lessonId)}/comments`,
  `/lessons/${encodeURIComponent(lessonId)}/discussion/comments`,
  `/discussion/lessons/${encodeURIComponent(lessonId)}/comments`,
]

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>
  }

  return {}
}

function pickString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return 0
}

function roleToDisplayName(roleRaw: string): string {
  const role = roleRaw.trim().toLowerCase()
  if (role === 'teacher' || role === 'instructor' || role === 'lecturer' || role === 'giang_vien' || role === 'giangvien') {
    return 'Giảng viên'
  }

  if (role === 'student' || role === 'hoc_vien' || role === 'hocvien') {
    return 'Học viên'
  }

  if (role === 'admin' || role === 'quan_tri' || role === 'quantri') {
    return 'Quản trị viên'
  }

  return ''
}

function extractCommentsPayload(raw: unknown): Comment[] {
  if (Array.isArray(raw)) {
    return normalizeComments(raw)
  }

  const root = toRecord(raw)
  const candidates = [
    root.comments,
    root.items,
    root.data,
    toRecord(root.data).comments,
    toRecord(root.data).items,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return normalizeComments(candidate)
    }
  }

  return []
}

function safeInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return 'U'
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase() || 'U'
}

function normalizeCommentNode(input: unknown, index: number): Comment {
  const node = toRecord(input)
  const userNode = toRecord(node.user ?? node.authorUser ?? node.author_user ?? node.createdBy ?? node.created_by)

  const idValue = node.id ?? node.commentId ?? node.comment_id ?? `comment-${Date.now()}-${index}`
  const id = typeof idValue === 'string' ? idValue : String(idValue)

  const authorRole =
    pickString(node, ['authorRole', 'author_role', 'role'])
    || pickString(userNode, ['role', 'userRole', 'user_role'])

  const authorFromNode = pickString(node, ['author', 'authorName', 'author_name', 'userName', 'user_name'])
  const authorFromUserNode = pickString(userNode, ['name', 'fullName', 'full_name', 'displayName', 'display_name', 'username', 'userName', 'user_name'])
  const roleDisplayName = authorRole ? roleToDisplayName(authorRole) : ''

  const author = authorFromNode || authorFromUserNode || roleDisplayName || 'Người dùng'
  const initials = pickString(node, ['initials']) || safeInitials(author)
  const avatarColor = pickString(node, ['avatarColor', 'avatar_color']) || '#1066d6'
  const text = pickString(node, ['text', 'content', 'message', 'body'])
  const time = pickString(node, ['time', 'createdAt', 'created_at', 'updatedAt', 'updated_at']) || 'Vừa xong'
  const likes = Math.max(0, pickNumber(node, ['likes', 'likeCount', 'like_count']))

  const rawReplies = node.replies
  const replies = Array.isArray(rawReplies)
    ? rawReplies.map((reply, replyIndex) => normalizeCommentNode(reply, replyIndex))
    : []

  return {
    id,
    author,
    initials,
    avatarColor,
    text,
    time,
    likes,
    replies,
  }
}

function normalizeComments(items: unknown[]): Comment[] {
  return items.map((item, index) => normalizeCommentNode(item, index))
}

function extractDiscussionNotificationsPayload(raw: unknown): DiscussionNotificationsPayload {
  const root = toRecord(raw)
  const data = toRecord(root.data)

  const rawItems =
    (Array.isArray(root.items) ? root.items : null)
    ?? (Array.isArray(root.notifications) ? root.notifications : null)
    ?? (Array.isArray(data.items) ? data.items : null)
    ?? (Array.isArray(data.notifications) ? data.notifications : null)
    ?? []

  const items = rawItems.map((item) => {
    const node = toRecord(item)
    return {
      courseId: pickString(node, ['courseId', 'course_id']),
      lessonId: pickString(node, ['lessonId', 'lesson_id']),
      unreadCount: Math.max(0, pickNumber(node, ['unreadCount', 'unread_count', 'count'])),
      latestCommentAt: pickString(node, ['latestCommentAt', 'latest_comment_at', 'updatedAt', 'updated_at']) || undefined,
    }
  })

  const totalFromPayload = pickNumber(root, ['totalUnread', 'total_unread', 'unreadCount', 'unread_count'])
    || pickNumber(data, ['totalUnread', 'total_unread', 'unreadCount', 'unread_count'])

  const totalUnread = Math.max(0, totalFromPayload || items.reduce((sum, item) => sum + item.unreadCount, 0))

  return {
    totalUnread,
    items,
  }
}

export async function getLessonCommentsApi(lessonId: string) {
  const { data } = await api.get<unknown>(`/lessons/${encodeURIComponent(lessonId)}/comments`)
  return extractCommentsPayload(data)
}

export async function getDiscussionNotificationsApi(): Promise<DiscussionNotificationsPayload | null> {
  for (const endpoint of DISCUSSION_NOTIFICATION_ENDPOINTS) {
    try {
      const { data } = await api.get<unknown>(endpoint)
      return extractDiscussionNotificationsPayload(data)
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404 || status === 405) {
        continue
      }

      throw error
    }
  }

  return null
}

export async function markLessonDiscussionReadApi(
  lessonId: string,
  payload: { lastSeenCommentId?: string; lastSeenAt?: string } = {},
): Promise<void> {
  const body = {
    ...(payload.lastSeenCommentId ? { lastSeenCommentId: payload.lastSeenCommentId, last_seen_comment_id: payload.lastSeenCommentId } : {}),
    ...(payload.lastSeenAt ? { lastSeenAt: payload.lastSeenAt, last_seen_at: payload.lastSeenAt } : {}),
  }

  for (const endpoint of MARK_READ_ENDPOINT_BY_LESSON(lessonId)) {
    try {
      await api.post(endpoint, body)
      return
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404 || status === 405) {
        continue
      }

      throw error
    }
  }
}

export async function createLessonCommentApi(
  lessonId: string,
  payload: { text: string; authorName?: string; parentCommentId?: string },
): Promise<Comment | null> {
  const content = payload.text.trim()
  if (!content) {
    throw new Error('empty comment')
  }

  const body = {
    text: content,
    content,
    message: content,
    ...(payload.authorName ? { authorName: payload.authorName, author_name: payload.authorName } : {}),
    ...(payload.parentCommentId
      ? {
          parentCommentId: payload.parentCommentId,
          parent_comment_id: payload.parentCommentId,
          replyToCommentId: payload.parentCommentId,
          reply_to_comment_id: payload.parentCommentId,
        }
      : {}),
  }

  for (const endpoint of CREATE_COMMENT_ENDPOINT_BY_LESSON(lessonId)) {
    try {
      const { data } = await api.post<unknown>(endpoint, body)

      if (!data) {
        return null
      }

      const comments = extractCommentsPayload(data)
      if (comments.length > 0) {
        return comments[0]
      }

      return normalizeCommentNode(data, 0)
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404 || status === 405) {
        continue
      }

      throw error
    }
  }

  throw new Error(`comment create route not found for ${lessonId}`)
}
