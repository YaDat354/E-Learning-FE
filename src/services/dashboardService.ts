import api from '../lib/api.ts'

export type DashboardHighlight = {
  label: string
  value: number | string
}

export type DashboardMedia = {
  heroTitle: string
  heroSubtitle: string
  heroImageUrl: string
  highlights: DashboardHighlight[]
  updatedAt?: string
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
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

function normalizeHighlights(input: unknown): DashboardHighlight[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((item) => {
      const node = toRecord(item)
      const label = pickString(node, ['label', 'name', 'title'])
      const valueRaw = node.value ?? node.count ?? node.total
      const value =
        typeof valueRaw === 'string' || typeof valueRaw === 'number'
          ? valueRaw
          : pickNumber(node, ['value', 'count', 'total'])

      if (!label) {
        return null
      }

      return { label, value }
    })
    .filter((entry): entry is DashboardHighlight => Boolean(entry))
}

function normalizeDashboardMedia(payload: unknown): DashboardMedia {
  const root = toRecord(payload)
  const data = toRecord(root.data)

  const heroTitle =
    pickString(root, ['heroTitle', 'hero_title', 'title'])
    || pickString(data, ['heroTitle', 'hero_title', 'title'])

  const heroSubtitle =
    pickString(root, ['heroSubtitle', 'hero_subtitle', 'subtitle', 'description'])
    || pickString(data, ['heroSubtitle', 'hero_subtitle', 'subtitle', 'description'])

  const heroImageUrl =
    pickString(root, ['heroImageUrl', 'hero_image_url', 'heroImage', 'hero_image', 'imageUrl', 'image_url'])
    || pickString(data, ['heroImageUrl', 'hero_image_url', 'heroImage', 'hero_image', 'imageUrl', 'image_url'])

  const rootHighlights = normalizeHighlights(root.highlights)
  const dataHighlights = normalizeHighlights(data.highlights)
  const highlights = rootHighlights.length > 0 ? rootHighlights : dataHighlights

  const updatedAt =
    pickString(root, ['updatedAt', 'updated_at'])
    || pickString(data, ['updatedAt', 'updated_at'])
    || undefined

  return {
    heroTitle,
    heroSubtitle,
    heroImageUrl,
    highlights,
    updatedAt,
  }
}

async function fetchDashboardMediaByEndpoints(endpoints: string[]): Promise<DashboardMedia | null> {
  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get<unknown>(endpoint)
      return normalizeDashboardMedia(data)
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

export async function fetchStudentDashboardMedia(): Promise<DashboardMedia | null> {
  return fetchDashboardMediaByEndpoints([
    '/me/dashboard/student',
    '/dashboard/student',
    '/student/dashboard/media',
  ])
}

export async function fetchTeacherDashboardMedia(): Promise<DashboardMedia | null> {
  return fetchDashboardMediaByEndpoints([
    '/me/dashboard/teacher',
    '/dashboard/teacher',
    '/teacher/dashboard/media',
  ])
}
