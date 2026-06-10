import { useEffect, useMemo, useState } from 'react'
import { COURSES } from '../../domain/index.ts'
import type { User } from '../../domain/index.ts'
import { getTeacherCourses } from '../../utils/teacher.ts'
import {
  createCourseQuiz,
  fetchCourseQuizzes,
  fetchQuizDetail,
  updateCourseQuiz,
  type QuizDetail,
  type QuizSummary,
} from '../../services/quizService.ts'
import './QuizManage.css'

type Props = {
  user: User
  teacherCourseIds: string[]
  onBackToDashboard: () => void
}

type BackendQuestion = {
  id: string
  content: string
  orderIndex?: number
  answers?: Array<{
    id: string
    content: string
    isCorrect?: boolean
  }>
}

type EditingQuestion = {
  quizId: string
  question: BackendQuestion
  isNew: boolean
}

function QuizManage({ user, teacherCourseIds, onBackToDashboard }: Props) {
  const teacherCourses = getTeacherCourses(COURSES, user, teacherCourseIds)
  const [selectedCourseId, setSelectedCourseId] = useState(teacherCourses[0]?.id ?? '')
  const [quizItems, setQuizItems] = useState<QuizSummary[]>([])
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null)
  const [quizDetails, setQuizDetails] = useState<Record<string, QuizDetail>>({})
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editingQuestion, setEditingQuestion] = useState<EditingQuestion | null>(null)
  const [newQuizTitle, setNewQuizTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (teacherCourses.length === 0) {
      if (selectedCourseId !== '') {
        setSelectedCourseId('')
      }
      return
    }

    if (!teacherCourses.some((course) => course.id === selectedCourseId)) {
      setSelectedCourseId(teacherCourses[0].id)
    }
  }, [selectedCourseId, teacherCourses])

  useEffect(() => {
    if (!selectedCourseId) {
      setQuizItems([])
      return
    }

    let mounted = true

    const loadQuizzes = async () => {
      setIsLoading(true)
      setError('')

      try {
        const rows = await fetchCourseQuizzes(selectedCourseId)
        if (mounted) {
          setQuizItems(rows)
        }
      } catch (loadError) {
        console.error('load quizzes failed', loadError)
        if (mounted) {
          setQuizItems([])
          setError('Không thể tải danh sách quiz từ backend.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadQuizzes()

    return () => {
      mounted = false
    }
  }, [selectedCourseId])

  const selectedCourseTitle = useMemo(() => {
    return teacherCourses.find((course) => course.id === selectedCourseId)?.title ?? 'Khóa học'
  }, [selectedCourseId, teacherCourses])

  const toggleExpand = async (quizId: string) => {
    if (expandedQuizId === quizId) {
      setExpandedQuizId(null)
      return
    }

    setExpandedQuizId(quizId)

    if (quizDetails[quizId] || !selectedCourseId) {
      return
    }

    try {
      const detail = await fetchQuizDetail(selectedCourseId, quizId)
      setQuizDetails((prev) => ({
        ...prev,
        [quizId]: detail,
      }))
    } catch (detailError) {
      console.error('load quiz detail failed', detailError)
      setError('Không thể tải chi tiết quiz.')
    }
  }

  const startEditTitle = (quiz: QuizSummary) => {
    setEditingQuizId(quiz.id)
    setEditTitle(quiz.title)
  }

  const saveTitle = async (quizId: string) => {
    if (!selectedCourseId || !editTitle.trim()) {
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const updated = await updateCourseQuiz(selectedCourseId, quizId, { title: editTitle.trim() })
      setQuizItems((prev) => prev.map((item) => (item.id === quizId ? { ...item, title: updated.title } : item)))
      setQuizDetails((prev) => ({
        ...prev,
        [quizId]: prev[quizId] ? { ...prev[quizId], title: updated.title } : prev[quizId],
      }))
      setEditingQuizId(null)
    } catch (saveError) {
      console.error('update quiz failed', saveError)
      setError('Không thể cập nhật quiz. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  const createQuiz = async () => {
    if (!selectedCourseId) {
      return
    }

    const title = newQuizTitle.trim()
    if (!title) {
      setError('Vui lòng nhập tiêu đề quiz.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const created = await createCourseQuiz(selectedCourseId, { title })
      setQuizItems((prev) => [created, ...prev])
      setNewQuizTitle('')
    } catch (createError) {
      console.error('create quiz failed', createError)
      setError('Không thể tạo quiz. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddQuestion = (quizId: string) => {
    const newQuestion: BackendQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      content: '',
      answers: [
        { id: `a-${Date.now()}-0`, content: '', isCorrect: true },
        { id: `a-${Date.now()}-1`, content: '', isCorrect: false },
        { id: `a-${Date.now()}-2`, content: '', isCorrect: false },
        { id: `a-${Date.now()}-3`, content: '', isCorrect: false },
      ],
    }
    setEditingQuestion({ quizId, question: newQuestion, isNew: true })
  }

  const handleSaveQuestion = () => {
    if (!editingQuestion) return
    if (!editingQuestion.question.content.trim()) {
      setError('Vui lòng nhập nội dung câu hỏi')
      return
    }
    const answers = editingQuestion.question.answers ?? []
    if (answers.filter((a) => a.content.trim()).length < 2) {
      setError('Cần ít nhất 2 đáp án')
      return
    }
    if (!answers.some((a) => a.isCorrect)) {
      setError('Cần chọn một đáp án đúng')
      return
    }

    // Update quizDetails with new/updated question
    const quizId = editingQuestion.quizId
    const updatedDetail = quizDetails[quizId]
      ? {
          ...quizDetails[quizId],
          questions: editingQuestion.isNew
            ? [...quizDetails[quizId].questions, editingQuestion.question]
            : quizDetails[quizId].questions.map((q) =>
                q.id === editingQuestion.question.id ? editingQuestion.question : q,
              ),
        }
      : null

    if (updatedDetail) {
      setQuizDetails((prev) => ({
        ...prev,
        [quizId]: updatedDetail,
      }))
    }

    setEditingQuestion(null)
    setError('')
  }

  const handleDeleteQuestion = (quizId: string, questionId: string) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa câu hỏi này?')) return

    setQuizDetails((prev) => ({
      ...prev,
      [quizId]: prev[quizId]
        ? {
            ...prev[quizId],
            questions: prev[quizId].questions.filter((q) => q.id !== questionId),
          }
        : prev[quizId],
    }))
  }

  return (
    <section className="teacher-page">
      <div className="teacher-shell">
        <header className="teacher-header">
          <div>
            <h1 className="teacher-title">Quản lý Quiz</h1>
            <p className="teacher-subtitle">{quizItems.length} quiz · {selectedCourseTitle}</p>
          </div>
          <div className="teacher-toolbar">
            <button className="teacher-btn ghost" onClick={onBackToDashboard}>Về Dashboard</button>
          </div>
        </header>

        <section className="teacher-panel">
          {error && <div className="teacher-list-meta" style={{ marginBottom: 12, color: '#dc2626' }}>{error}</div>}
          <div className="teacher-toolbar" style={{ marginBottom: 12 }}>
            <select
              className="teacher-select"
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              disabled={teacherCourses.length === 0}
            >
              {teacherCourses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>

            <input
              className="teacher-input"
              value={newQuizTitle}
              onChange={(event) => setNewQuizTitle(event.target.value)}
              placeholder="Tiêu đề quiz mới"
            />

            <button className="teacher-btn" onClick={() => void createQuiz()} disabled={!selectedCourseId || isSaving}>
              {isSaving ? 'Đang xử lý...' : 'Tạo quiz'}
            </button>
          </div>

          {isLoading && <p className="teacher-empty">Đang tải quiz...</p>}
          {!isLoading && quizItems.length === 0 && <p className="teacher-empty">Chưa có quiz nào cho khóa học này.</p>}

          <div className="teacher-list">
            {quizItems.map((quiz) => {
              const detail = quizDetails[quiz.id]

              return (
                <div className="teacher-quiz-card" key={quiz.id}>
                  <div className="teacher-list-item" style={{ border: 'none', borderRadius: 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingQuizId === quiz.id ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            className="teacher-input"
                            value={editTitle}
                            onChange={(event) => setEditTitle(event.target.value)}
                            style={{ flex: 1, minWidth: 180 }}
                          />
                          <button className="teacher-btn" onClick={() => void saveTitle(quiz.id)} disabled={isSaving}>
                            {isSaving ? 'Đang lưu...' : 'Lưu'}
                          </button>
                          <button className="teacher-btn ghost" onClick={() => setEditingQuizId(null)}>Hủy</button>
                        </div>
                      ) : (
                        <>
                          <div className="teacher-list-title">{quiz.title}</div>
                          <div className="teacher-list-meta">
                            {detail ? `${detail.questions.length} câu hỏi` : 'Nhấn xem để tải chi tiết câu hỏi'}
                          </div>
                        </>
                      )}
                    </div>

                    {editingQuizId !== quiz.id && (
                      <div className="teacher-actions">
                        <button
                          className={`teacher-action-btn ${expandedQuizId === quiz.id ? 'teacher-action-btn-active' : ''}`}
                          onClick={() => void toggleExpand(quiz.id)}
                        >
                          {expandedQuizId === quiz.id ? 'Đóng' : 'Xem'}
                        </button>
                        <button className="teacher-action-btn" onClick={() => startEditTitle(quiz)}>Sửa tiêu đề</button>
                      </div>
                    )}
                  </div>

                  {expandedQuizId === quiz.id && (
                    <div className="teacher-expand-panel">
                      {!detail && <p className="teacher-empty" style={{ textAlign: 'left' }}>Đang tải chi tiết quiz...</p>}
                      {detail && (
                        <>
                          <div className="teacher-question-list">
                            {detail.questions.map((question, index) => (
                              <div key={question.id || `${quiz.id}-${index}`} className="teacher-question-item">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                  <div className="teacher-question-text">
                                    <strong>{index + 1}.</strong> {question.content || 'Câu hỏi chưa có nội dung'}
                                  </div>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button
                                      className="teacher-action-btn"
                                      onClick={() => setEditingQuestion({ quizId: quiz.id, question, isNew: false })}
                                      type="button"
                                    >
                                      Sửa
                                    </button>
                                    <button
                                      className="teacher-action-btn teacher-action-btn-danger"
                                      onClick={() => handleDeleteQuestion(quiz.id, question.id)}
                                      type="button"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                </div>
                                <div className="teacher-options-grid">
                                  {(question.answers ?? []).map((answer, answerIndex) => (
                                    <div
                                      key={answer.id || answerIndex}
                                      className={`teacher-option ${answer.isCorrect ? 'teacher-option-correct' : ''}`}
                                    >
                                      {String.fromCharCode(65 + answerIndex)}. {answer.content}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            className="teacher-btn"
                            onClick={() => handleAddQuestion(quiz.id)}
                            style={{ marginTop: 12 }}
                            type="button"
                          >
                            + Thêm câu hỏi
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {editingQuestion && (
            <div className="teacher-panel" style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3>{editingQuestion.isNew ? 'Thêm câu hỏi mới' : 'Chỉnh sửa câu hỏi'}</h3>
                <button
                  className="teacher-btn ghost"
                  onClick={() => setEditingQuestion(null)}
                  type="button"
                >
                  Đóng
                </button>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="teacher-list-meta">Nội dung câu hỏi</label>
                <textarea
                  className="teacher-input"
                  value={editingQuestion.question.content}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, content: e.target.value },
                    })
                  }
                  placeholder="Nhập câu hỏi..."
                  rows={3}
                  style={{ width: '100%', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="teacher-list-meta">Các đáp án</label>
                {(editingQuestion.question.answers ?? []).map((answer, idx) => (
                  <div key={answer.id || idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input
                      className="teacher-input"
                      type="radio"
                      name="correct-answer"
                      checked={answer.isCorrect}
                      onChange={() => {
                        const newAnswers = (editingQuestion.question.answers ?? []).map((a) => ({
                          ...a,
                          isCorrect: a.id === answer.id,
                        }))
                        setEditingQuestion({
                          ...editingQuestion,
                          question: { ...editingQuestion.question, answers: newAnswers },
                        })
                      }}
                      style={{ width: 20, height: 20, flexShrink: 0 }}
                    />
                    <input
                      className="teacher-input"
                      value={answer.content}
                      onChange={(e) => {
                        const newAnswers = (editingQuestion.question.answers ?? []).map((a) =>
                          a.id === answer.id ? { ...a, content: e.target.value } : a,
                        )
                        setEditingQuestion({
                          ...editingQuestion,
                          question: { ...editingQuestion.question, answers: newAnswers },
                        })
                      }}
                      placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="teacher-btn" onClick={handleSaveQuestion} type="button">
                  Lưu câu hỏi
                </button>
                <button
                  className="teacher-btn ghost"
                  onClick={() => setEditingQuestion(null)}
                  type="button"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default QuizManage
