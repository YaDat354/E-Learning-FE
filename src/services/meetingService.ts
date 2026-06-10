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

export async function fetchMeetingNotifications(userId: string): Promise<MeetingNotification[]> {
  const endpoints = [
    `/students/${userId}/meeting-notifications`,
    `/meetings/notifications`,
  ]

  let lastError: unknown

  for (const endpoint of endpoints) {
    try {
      const response = await api.get<MeetingNotification[]>(endpoint)
      return response.data ?? []
    } catch (error) {
      lastError = error
      console.debug(`Endpoint ${endpoint} failed, trying next...`)
    }
  }

  console.error('All meeting notification endpoints failed', lastError)
  throw lastError ?? new Error('meeting notifications route not found')
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
  try {
    const response = await api.post<MeetingNotification>(
      `/courses/${payload.courseId}/meeting-notifications`,
      {
        title: payload.title,
        description: payload.description,
        scheduledAt: payload.scheduledAt,
        meetingUrl: payload.meetingUrl,
        courseId: payload.courseId,
      }
    )
    return response.data
  } catch (error) {
    console.error('Failed to create meeting notification', error)
    throw error
  }
}
