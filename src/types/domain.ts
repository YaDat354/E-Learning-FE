export type UserRole = 'student' | 'teacher' | 'admin'

export type User = { id?: string; name: string; email: string; role: UserRole }

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Học viên',
  teacher: 'Giảng viên',
  admin: 'Quản trị viên',
}

export type Course = {
  id: string
  teacherId?: string
  lessonCount?: number
  title: string
  description: string
  instructor: string
  instructorEmail?: string
  instructorAvatar: string
  category: string
  categoryColor: string
  level: 'Cơ bản' | 'Trung cấp' | 'Nâng cao'
  rating: number
  reviewCount: number
  studentCount: number
  duration: string
  price: number
  originalPrice: number
  tags: string[]
  lessons: Lesson[]
}

export type Lesson = {
  id: string
  title: string
  assignmentId?: string
  assignmentTitle?: string
  duration: string
  videoId: string
  description: string
  videoScript: string[]
  keyPhrases: string[]
  transcript: TranscriptLine[]
  task: LessonTask[]
  translations: TranslationLine[]
  exercises: LessonExercise[]
  isFree: boolean
  quiz: Quiz | null
  resources: Resource[]
}

export type TranscriptLine = {
  original: string
  translated?: string
  note?: string
}

export type LessonTask = {
  prompt: string
  hint?: string
  answer?: string
}

export type TranslationLine = {
  original: string
  translated: string
  note?: string
}

export type LessonExercise = {
  prompt: string
  hint?: string
  answer?: string
}

export type Quiz = {
  title: string
  questions: Question[]
}

export type Question = {
  id: string
  text: string
  options: string[]
  correctIndex: number
  explanation: string
}

export type Resource = {
  title: string
  type: 'docs' | 'github' | 'pdf'
}

export type Comment = {
  id: string
  author: string
  initials: string
  avatarColor: string
  text: string
  time: string
  likes: number
  replies: Comment[]
}
