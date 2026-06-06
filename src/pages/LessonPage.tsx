import { useEffect, useState } from 'react'
import axios from 'axios'
import { Bell } from 'lucide-react'
import { ROLE_LABELS } from '../domain/index.ts'
import type { Comment, Course, TranscriptLine, User } from '../domain/index.ts'
import { fetchCourseDetail, fetchLessonDetail } from '../services/courseService.ts'
import { getLessonCommentsApi, markLessonDiscussionReadApi } from '../services/discussionService.ts'
import { updateLessonProgress } from '../services/enrollmentService.ts'
import VideoPlayer from '../components/course/VideoPlayer.tsx'
import QuizPanel from '../components/course/QuizPanel.tsx'
import AssignmentPanel from '../components/course/AssignmentPanel.tsx'
import DiscussionPanel from '../components/course/DiscussionPanel.tsx'
import '../styles/course.css'

type Tab = 'overview' | 'transcript' | 'quiz' | 'submission' | 'discussion'
const DISCUSSION_SEEN_COUNT_KEY = 'discussionSeenCount'

function buildDiscussionSeenKey(user: User | null, lessonId: string): string {
  if (!lessonId) {
    return ''
  }

  const userToken = user?.id || user?.email || 'guest'
  return `${DISCUSSION_SEEN_COUNT_KEY}:${userToken}:${lessonId}`
}

function readSeenCommentCount(user: User | null, lessonId: string): number {
  const key = buildDiscussionSeenKey(user, lessonId)
  if (!key) {
    return 0
  }

  const raw = localStorage.getItem(key)
  if (!raw) {
    return 0
  }

  const parsed = Number(raw)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

function persistSeenCommentCount(user: User | null, lessonId: string, count: number) {
  const key = buildDiscussionSeenKey(user, lessonId)
  if (!key) {
    return
  }

  localStorage.setItem(key, String(Math.max(0, count)))
}

type LessonPageProps = {
  courseId: string
  lessonId: string
  user: User | null
  onBack: () => void
  onGoToLesson: (courseId: string, lessonId: string) => void
  onGoAuth: () => void
}

function LessonPage({ courseId, lessonId, user, onBack, onGoToLesson, onGoAuth }: LessonPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [course, setCourse] = useState<Course | null>(null)
  const [isCourseLoading, setIsCourseLoading] = useState(true)
  const [error, setError] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [unreadDiscussionCount, setUnreadDiscussionCount] = useState(0)

  const lesson = course?.lessons.find((l) => l.id === lessonId)

  useEffect(() => {
    let mounted = true

    const loadCourse = async () => {
      setIsCourseLoading(true)
      setError('')
      try {
        const nextCourse = await fetchCourseDetail(courseId)
        let nextLesson = null

        try {
          nextLesson = await fetchLessonDetail(courseId, lessonId)
        } catch (lessonError) {
          if (axios.isAxiosError(lessonError) && lessonError.response?.status === 403) {
            throw lessonError
          }

          console.warn('load lesson detail failed', lessonError)
        }

        const mergedCourse = nextLesson
          ? {
              ...nextCourse,
              lessons: nextCourse.lessons.map((item) => (String(item.id) === String(lessonId) || String(item.id) === String(nextLesson.id) ? nextLesson : item)),
            }
          : nextCourse

        if (mounted) {
          setCourse(mergedCourse)
        }
      } catch (error) {
        console.error('load lesson course detail failed', error)
        if (mounted) {
          if (axios.isAxiosError(error) && error.response?.status === 403) {
            setError('Bạn chưa đăng ký khóa học này')
          } else {
            setError('Không thể tải bài học từ backend.')
          }
          setCourse(null)
        }
      } finally {
        if (mounted) {
          setIsCourseLoading(false)
        }
      }
    }

    void loadCourse()

    return () => {
      mounted = false
    }
  }, [courseId, lessonId])

  useEffect(() => {
    let mounted = true
    let timerId: number | null = null

    const loadComments = async () => {
      try {
        const next = await getLessonCommentsApi(lessonId)
        if (!mounted) {
          return
        }

        setComments(next)

        if (activeTab === 'discussion') {
          persistSeenCommentCount(user, lessonId, next.length)
          setUnreadDiscussionCount(0)
        } else {
          const seenCount = readSeenCommentCount(user, lessonId)
          setUnreadDiscussionCount(Math.max(0, next.length - seenCount))
        }
      } catch (error) {
        console.error('load lesson comments failed', error)
        if (mounted && comments.length === 0) {
          setComments([])
        }
      }
    }

    void loadComments()
    timerId = window.setInterval(() => {
      void loadComments()
    }, 15000)

    return () => {
      mounted = false
      if (timerId !== null) {
        window.clearInterval(timerId)
      }
    }
  }, [lessonId, activeTab, user?.id, user?.email])

  useEffect(() => {
    if (activeTab !== 'discussion') {
      return
    }

    persistSeenCommentCount(user, lessonId, comments.length)
    setUnreadDiscussionCount(0)

    if (user) {
      void markLessonDiscussionReadApi(lessonId, {
        lastSeenCommentId: comments[0]?.id,
        lastSeenAt: new Date().toISOString(),
      }).catch((error) => {
        console.warn('mark lesson discussion read failed', error)
      })
    }
  }, [activeTab, comments.length, lessonId, user?.id, user?.email])

  const renderSpeakerLine = (line: string, key: string) => {
    const trimmed = line.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim()
    const colonIndex = trimmed.indexOf(':')

    if (colonIndex > 0 && colonIndex < 24) {
      const speaker = trimmed.slice(0, colonIndex).trim()
      const message = trimmed.slice(colonIndex + 1).trim()

      return (
        <p key={key} style={{ margin: '0 0 16px', fontSize: 18, lineHeight: 1.55 }}>
          <strong>{speaker}:</strong> <span>{message}</span>
        </p>
      )
    }

    return (
      <p key={key} style={{ margin: '0 0 16px', fontSize: 18, lineHeight: 1.55 }}>
        {trimmed}
      </p>
    )
  }

  useEffect(() => {
    if (!isCourseLoading && lesson && !lesson.isFree && !user) {
      onGoAuth()
    }
  }, [isCourseLoading, lesson, onGoAuth, user])

  useEffect(() => {
    if (!lesson || user?.role !== 'student') {
      return
    }

    let elapsedSeconds = 0
    let sending = false

    const timer = window.setInterval(() => {
      if (sending) {
        return
      }

      sending = true
      elapsedSeconds += 5

      void updateLessonProgress(lesson.id, {
        currentSecond: elapsedSeconds,
        isCompleted: false,
      }).catch((progressError) => {
        console.warn('update lesson progress failed', progressError)
      }).finally(() => {
        sending = false
      })
    }, 5000)

    return () => {
      window.clearInterval(timer)
    }
  }, [lesson, user?.role])

  if (isCourseLoading) {
    return <div style={{ padding: 24 }}>Đang tải bài học...</div>
  }

  if (!course || !lesson) {
    return <div style={{ padding: 24 }}>{error || 'Không tìm thấy bài học.'}</div>
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'submission', label: 'Bài nộp' },
    { id: 'discussion', label: 'Thảo luận' },
  ]

  return (
    <div className="lesson-page">
      <nav className="lesson-page-nav">
        <div className="lesson-nav-left">
          <button className="btn-back-lesson" onClick={onBack} type="button">
            Quay lại
          </button>
          <div>
            <div className="lesson-nav-title">{lesson.title}</div>
            <div className="lesson-nav-course">{course.title}</div>
          </div>
        </div>
        {user && (
          <div className="lesson-nav-actions">
            <button
              className={`lesson-bell-btn ${activeTab === 'discussion' ? 'active' : ''}`}
              onClick={() => setActiveTab('discussion')}
              type="button"
              aria-label="Mở thảo luận"
              title="Mở thảo luận"
            >
              <Bell size={16} />
              {unreadDiscussionCount > 0 && <span className="lesson-bell-badge">{unreadDiscussionCount > 99 ? '99+' : unreadDiscussionCount}</span>}
            </button>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
              Xin chào, <span style={{ color: '#fff', fontWeight: 600 }}>{user.name}</span> · {ROLE_LABELS[user.role]}
            </div>
          </div>
        )}
      </nav>

      <div className="lesson-page-layout">
        <main className="lesson-main">
          <VideoPlayer
            title={lesson.title}
            duration={lesson.duration}
            videoId={lesson.videoId}
            script={lesson.videoScript}
            keyPhrases={lesson.keyPhrases}
          />

          {user && (
            <div className="lesson-role-banner">
              {user.role === 'teacher'
                ? 'Chế độ giảng viên: bạn có thể dùng bài học này để xem thảo luận, kiểm tra bài tập và quan sát luồng tương tác của học viên.'
                : user.role === 'admin'
                  ? 'Chế độ quản trị viên: bạn đang xem luồng bài học để kiểm tra nội dung, điều hướng và trải nghiệm vai trò.'
                  : 'Chế độ học viên: hãy xem video bài giảng, làm quiz, nộp bài và đặt câu hỏi ở phần thảo luận.'}
            </div>
          )}

          <div className="lesson-content-tabs">
            <div className="tab-bar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="tab-panel">
              {activeTab === 'overview' && (
                <div>
                  <p className="lesson-description">{lesson.description}</p>

                  {lesson.resources.length > 0 && (
                    <>
                      <h4 style={{ marginBottom: 10, fontSize: 15, fontWeight: 700 }}>
                        Tài liệu bài học
                      </h4>
                      <div className="resources-list">
                        {lesson.resources.map((resource, i) => (
                          <div key={i} className="resource-item">
                            <span className="resource-icon">
                              {resource.type === 'docs'
                                ? 'Tài liệu'
                                : resource.type === 'github'
                                  ? 'Kho file'
                                  : 'PDF'}
                            </span>
                            {resource.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'transcript' && (
                <div className="assignment-section">
                  <h3>Transcript</h3>
                  <div style={{ padding: '22px 18px 10px', background: '#eef1f4', borderRadius: 14 }}>
                    {((lesson.transcript.length > 0 ? lesson.transcript : lesson.translations.map((item) => ({
                      original: item.original,
                      translated: item.translated,
                      note: item.note,
                    }))) as TranscriptLine[]).map((item, index) =>
                      renderSpeakerLine(item.original || item.translated || item.note || `Line ${index + 1}`, `${lesson.id}-transcript-${index}`)
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'quiz' && (
                <div className="assignment-section">
                  <h3>Quiz</h3>
                  {lesson.quiz ? (
                    <div style={{ border: '1px solid #e5eaf1', borderRadius: 16, padding: 16, background: '#fafcff' }}>
                      <QuizPanel quiz={lesson.quiz} />
                    </div>
                  ) : (
                    <div style={{ padding: '14px 16px', border: '1px dashed #d6deea', borderRadius: 14, color: 'var(--muted)' }}>
                      Lesson detail hiện chưa trả quiz hoặc quiz_id cho bài này, nên FE chưa thể gọi quiz detail tương ứng.
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'submission' && <AssignmentPanel lessonTitle={lesson.title} userRole={user?.role ?? null} />}
              {activeTab === 'discussion' && (
                <DiscussionPanel
                  lessonId={lessonId}
                  user={user}
                  commentsSeed={comments}
                  onGoAuth={onGoAuth}
                  userRole={user?.role ?? null}
                  onCommentsChange={setComments}
                />
              )}
            </div>
          </div>
        </main>

        <aside className="lesson-sidebar">
          <div className="lesson-sidebar-title">Danh sách bài học</div>
          {course.lessons.map((entry, i) => (
            <div
              key={entry.id}
              className={`sidebar-lesson-item ${entry.id === lessonId ? 'active' : ''}`}
              onClick={() => {
                if (entry.isFree || user) {
                  onGoToLesson(courseId, entry.id)
                } else {
                  onGoAuth()
                }
              }}
            >
              <div className="sidebar-lesson-num">{i + 1}</div>
              <div className="sidebar-lesson-text">
                <div className="sidebar-lesson-title">{entry.title}</div>
                <div className="sidebar-lesson-duration">{entry.duration}</div>
              </div>
              {!entry.isFree && !user && <span className="sidebar-lock">Khóa</span>}
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}

export default LessonPage
