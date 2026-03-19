import { useState } from 'react'
import { COURSES, MOCK_COMMENTS, ROLE_LABELS } from '../data/mockData.ts'
import type { User } from '../data/mockData.ts'
import VideoPlayer from '../components/course/VideoPlayer.tsx'
import QuizPanel from '../components/course/QuizPanel.tsx'
import AssignmentPanel from '../components/course/AssignmentPanel.tsx'
import DiscussionPanel from '../components/course/DiscussionPanel.tsx'
import '../styles/course.css'

type Tab = 'overview' | 'quiz' | 'assignment' | 'discussion'

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

  const course = COURSES.find((c) => c.id === courseId)
  const lesson = course?.lessons.find((l) => l.id === lessonId)

  if (!course || !lesson) return null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Tổng quan' },
    ...(lesson.quiz ? [{ id: 'quiz' as Tab, label: 'Quiz' }] : []),
    { id: 'assignment', label: 'Bài tập' },
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
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Xin chào, <span style={{ color: '#fff', fontWeight: 600 }}>{user.name}</span> · {ROLE_LABELS[user.role]}
          </div>
        )}
      </nav>

      <div className="lesson-page-layout">
        <main className="lesson-main">
          <VideoPlayer
            title={lesson.title}
            duration={lesson.duration}
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

              {activeTab === 'quiz' && lesson.quiz && <QuizPanel quiz={lesson.quiz} />}
              {activeTab === 'assignment' && <AssignmentPanel lessonTitle={lesson.title} userRole={user?.role ?? null} />}
              {activeTab === 'discussion' && (
                <DiscussionPanel
                  user={user}
                  commentsSeed={MOCK_COMMENTS}
                  onGoAuth={onGoAuth}
                  userRole={user?.role ?? null}
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
