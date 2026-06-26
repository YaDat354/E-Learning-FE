import api from '../lib/api.ts'

export type MeetingNotification = {
  id: string
  courseId: string
  courseName: string
  title: string
  description: string
  scheduledAt: string
  meetingUrl?: string
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled'
  teacherName: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function extractString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
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
  const nestedItems = nested.items ?? nested.results ?? nested.rows ?? nested.notifications
  if (Array.isArray(nestedItems)) {
    return nestedItems as T[]
  }

  const rootItems = root.items ?? root.results ?? root.rows ?? root.notifications
  if (Array.isArray(rootItems)) {
    return rootItems as T[]
  }

  return []
}

function normalizeMeetingNotification(row: unknown): MeetingNotification | null {
  const item = asRecord(row)
  const course = asRecord(item.course)
  const teacher = asRecord(item.teacher)
  const meeting = asRecord(item.meeting)
  const data = asRecord(item.data)

  const id =
    extractString(item.id)
    || extractString(item._id)
    || extractString(item.notificationId)
    || extractString(item.notification_id)
    || extractString(item.meetingId)
    || extractString(item.meeting_id)
    || extractString(meeting.id)
    || extractString(meeting._id)
    || extractString(data.id)
    || extractString(data._id)

  const courseId =
    extractString(item.courseId)
    || extractString(item.course_id)
    || extractString(course.id)
    || extractString(course._id)
    || extractString(meeting.courseId)
    || extractString(meeting.course_id)
    || extractString(data.courseId)
    || extractString(data.course_id)

  const title = extractString(item.title) || 'Lịch họp mới'
  const scheduledAt =
    extractString(item.scheduledAt)
    || extractString(item.scheduled_at)
    || extractString(item.startTime)
    || extractString(item.start_time)
    || extractString(item.startAt)
    || extractString(item.start_at)
    || extractString(item.startsAt)
    || extractString(item.starts_at)
    || extractString(item.meetingTime)
    || extractString(item.meeting_time)
    || extractString(item.datetime)
    || extractString(meeting.scheduledAt)
    || extractString(meeting.scheduled_at)
    || extractString(meeting.startTime)
    || extractString(meeting.start_time)
    || extractString(data.scheduledAt)
    || extractString(data.scheduled_at)
    || extractString(data.startTime)
    || extractString(data.start_time)

  if (!id || !courseId || !scheduledAt) {
    return null
  }

  const statusRaw = extractString(item.status).toLowerCase()
  const status: MeetingNotification['status'] =
    statusRaw === 'ongoing' || statusRaw === 'completed' || statusRaw === 'cancelled'
      ? statusRaw
      : 'pending'

  return {
    id,
    courseId,
    courseName:
      extractString(item.courseName)
      || extractString(item.course_name)
      || extractString(course.title)
      || extractString(meeting.courseName)
      || extractString(meeting.course_name)
      || extractString(data.courseName)
      || extractString(data.course_name)
      || 'Khóa học',
    title,
    description:
      extractString(item.description)
      || extractString(meeting.description)
      || extractString(data.description)
      || 'Không có mô tả',
    scheduledAt,
    meetingUrl:
      extractString(item.meetingUrl)
      || extractString(item.meeting_url)
      || extractString(item.url)
      || extractString(meeting.meetingUrl)
      || extractString(meeting.meeting_url)
      || extractString(meeting.url)
      || extractString(data.meetingUrl)
      || extractString(data.meeting_url)
      || extractString(data.url)
      || undefined,
    status,
    teacherName:
      extractString(item.teacherName)
      || extractString(item.teacher_name)
      || extractString(teacher.name)
      || extractString(teacher.fullName)
      || extractString(item.createdByName)
      || extractString(item.created_by_name)
      || extractString(meeting.teacherName)
      || extractString(data.teacherName)
      || 'Giảng viên',
  }
}

function extractNotifications(payload: unknown): MeetingNotification[] {
  const rows = extractArrayPayload<unknown>(payload)
    .map((row) => normalizeMeetingNotification(row))
    .filter((item): item is MeetingNotification => Boolean(item))

  if (rows.length > 0) {
    return rows
  }

  // Some backends return a single object instead of an array.
  const root = asRecord(payload)
  const singleCandidates: unknown[] = [payload, root.data, root.notification, root.meeting]
  for (const candidate of singleCandidates) {
    const normalized = normalizeMeetingNotification(candidate)
    if (normalized) {
      return [normalized]
    }
  }

  return []
}

function dedupeMeetings(rows: MeetingNotification[]): MeetingNotification[] {
  const byId = new Map<string, MeetingNotification>()

  for (const row of rows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, row)
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aTime = new Date(a.scheduledAt).getTime()
    const bTime = new Date(b.scheduledAt).getTime()
    if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
      return 0
    }

    return bTime - aTime
  })
}

function shouldTryFallbackEndpoint(error: unknown): boolean {
  const status = asRecord(asRecord(error).response).status
  return status === 404 || status === 405 || status === 501
}

export async function fetchMeetingNotifications(userId?: string): Promise<MeetingNotification[]> {
  const normalizedUserId = extractString(userId)
  const endpoints = [
    '/me/meeting-notifications',
    '/me/meetings/notifications',
    '/me/meetings',
    '/me/notifications/meetings',
    ...(normalizedUserId ? [`/students/${encodeURIComponent(normalizedUserId)}/meeting-notifications`] : []),
    `/meetings/notifications`,
    '/meetings',
  ]

  let lastError: unknown
  let successfulEmptyResponse: MeetingNotification[] | null = null

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint)
      const rows = extractNotifications(response.data)
      if (rows.length > 0) {
        return rows
      }

      if (!successfulEmptyResponse) {
        successfulEmptyResponse = rows
      }
    } catch (error) {
      lastError = error
      if (!shouldTryFallbackEndpoint(error)) {
        throw error
      }
      console.debug(`Endpoint ${endpoint} failed, trying next...`)
    }
  }

  if (successfulEmptyResponse) {
    return successfulEmptyResponse
  }

  console.error('All meeting notification endpoints failed', lastError)
  if (lastError) {
    throw lastError
  }

  return []
}

export async function fetchCourseMeetingNotifications(courseId: string): Promise<MeetingNotification[]> {
  const normalizedCourseId = extractString(courseId)
  if (!normalizedCourseId) {
    return []
  }

  const encodedCourseId = encodeURIComponent(normalizedCourseId)
  const endpoints = [
    `/courses/${encodedCourseId}/meeting-notifications`,
    `/courses/${encodedCourseId}/meetings/notifications`,
    `/courses/${encodedCourseId}/meetings`,
  ]

  let lastError: unknown
  let successfulEmptyResponse: MeetingNotification[] | null = null

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint)
      const rows = extractNotifications(response.data)
      if (rows.length > 0) {
        return rows
      }

      if (!successfulEmptyResponse) {
        successfulEmptyResponse = rows
      }
    } catch (error) {
      lastError = error
      if (!shouldTryFallbackEndpoint(error)) {
        throw error
      }
      console.debug(`Endpoint ${endpoint} failed, trying next...`)
    }
  }

  if (successfulEmptyResponse) {
    return successfulEmptyResponse
  }

  if (lastError) {
    throw lastError
  }

  return []
}

export async function fetchMeetingsForCourses(courseIds: string[]): Promise<MeetingNotification[]> {
  const rows = await Promise.allSettled(courseIds.map((courseId) => fetchCourseMeetingNotifications(courseId)))

  const flattened = rows
    .filter((item): item is PromiseFulfilledResult<MeetingNotification[]> => item.status === 'fulfilled')
    .flatMap((item) => item.value)

  return dedupeMeetings(flattened)
}

export async function fetchMeetingNotification(notificationId: string): Promise<MeetingNotification | null> {
  const endpoints = [
    `/meetings/notifications/${notificationId}`,
  ]

  let lastError: unknown

  for (const endpoint of endpoints) {
    try {
      const response = await api.get<MeetingNotification>(endpoint)
      return response.data ?? null
    } catch (error) {
      lastError = error
      if (!shouldTryFallbackEndpoint(error)) {
        throw error
      }
      console.debug(`Endpoint ${endpoint} failed, trying next...`)
    }
  }

  console.error('All fetch meeting endpoints failed', lastError)
  throw lastError ?? new Error('meeting notification route not found')
}

export async function acknowledgeMeetingNotification(notificationId: string): Promise<void> {
  const endpoints = [
    `/meetings/notifications/${notificationId}/acknowledge`,
  ]

  let lastError: unknown

  for (const endpoint of endpoints) {
    try {
      await api.post(endpoint)
      return
    } catch (error) {
      lastError = error
      if (!shouldTryFallbackEndpoint(error)) {
        throw error
      }
      console.debug(`Endpoint ${endpoint} failed, trying next...`)
    }
  }

  console.error('All acknowledge endpoints failed', lastError)
  throw lastError ?? new Error('acknowledge meeting notification route not found')
}

export async function createMeetingNotification(payload: {
  courseId: string
  title: string
  description?: string
  scheduledAt: string
  meetingUrl?: string
}): Promise<MeetingNotification> {
  const body = {
    title: payload.title,
    description: payload.description,
    scheduledAt: payload.scheduledAt,
    scheduled_at: payload.scheduledAt,
    meetingUrl: payload.meetingUrl,
    meeting_url: payload.meetingUrl,
    courseId: payload.courseId,
    course_id: payload.courseId,
  }

  const endpoints = [
    `/courses/${encodeURIComponent(payload.courseId)}/meeting-notifications`,
    `/courses/${encodeURIComponent(payload.courseId)}/meetings/notifications`,
    `/courses/${encodeURIComponent(payload.courseId)}/meetings`,
    '/meeting-notifications',
    '/meetings/notifications',
  ]

  let lastError: unknown

  for (const endpoint of endpoints) {
    try {
      const response = await api.post(endpoint, body)
      const rows = extractNotifications(response.data)
      if (rows.length > 0) {
        return rows[0]
      }

      return {
        id: `meeting-${Date.now()}`,
        courseId: payload.courseId,
        courseName: 'Khóa học',
        title: payload.title,
        description: payload.description ?? '',
        scheduledAt: payload.scheduledAt,
        meetingUrl: payload.meetingUrl,
        status: 'pending',
        teacherName: 'Giảng viên',
      }
    } catch (error) {
      lastError = error
      if (!shouldTryFallbackEndpoint(error)) {
        throw error
      }
      console.debug(`Endpoint ${endpoint} failed, trying next...`)
    }
  }

  console.error('Failed to create meeting notification', lastError)
  throw lastError ?? new Error('meeting create route not found')
}
