import axios from 'axios'

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
    `/api/v1/meetings/notifications`,
    `/api/meetings/notifications`,
    `/api/students/${userId}/meetings`,
    `/meetings/notifications/${userId}`,
  ]

  let lastError: unknown

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get<MeetingNotification[]>(endpoint)
      return response.data ?? []
    } catch (error) {
      lastError = error
      console.debug(`Endpoint ${endpoint} failed, trying next...`)
    }
  }

  console.error('All meeting notification endpoints failed', lastError)
  return []
}

export async function fetchMeetingNotification(notificationId: string): Promise<MeetingNotification | null> {
  const endpoints = [
    `/api/v1/meetings/notifications/${notificationId}`,
    `/api/meetings/notifications/${notificationId}`,
    `/meetings/${notificationId}`,
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get<MeetingNotification>(endpoint)
      return response.data ?? null
    } catch (error) {
      console.debug(`Endpoint ${endpoint} failed, trying next...`)
    }
  }

  return null
}

export async function acknowledgeMeetingNotification(notificationId: string): Promise<void> {
  const endpoints = [
    `/api/v1/meetings/notifications/${notificationId}/acknowledge`,
    `/api/meetings/notifications/${notificationId}/acknowledge`,
    `/meetings/${notificationId}/read`,
  ]

  let lastError: unknown

  for (const endpoint of endpoints) {
    try {
      await axios.post(endpoint)
      return
    } catch (error) {
      lastError = error
      console.debug(`Endpoint ${endpoint} failed, trying next...`)
    }
  }

  console.error('All acknowledge endpoints failed', lastError)
}

export async function createMeetingNotification(payload: {
  courseId: string
  title: string
  description?: string
  scheduledAt: string
  meetingUrl?: string
}): Promise<MeetingNotification> {
  const endpoints = [
    `/api/v1/courses/${payload.courseId}/meeting-notifications`,
    `/api/courses/${payload.courseId}/meeting-notifications`,
    `/courses/${payload.courseId}/meetings`,
    `/api/v1/meetings`,
    `/api/meetings`,
  ]

  let lastError: unknown

  for (const endpoint of endpoints) {
    try {
      const response = await axios.post<MeetingNotification>(endpoint, {
        title: payload.title,
        description: payload.description,
        scheduledAt: payload.scheduledAt,
        meetingUrl: payload.meetingUrl,
        courseId: payload.courseId,
      })
      return response.data
    } catch (error) {
      lastError = error
      console.debug(`Endpoint ${endpoint} failed, trying next...`)
    }
  }

  console.error('All create meeting endpoints failed', lastError)
  throw lastError
}
