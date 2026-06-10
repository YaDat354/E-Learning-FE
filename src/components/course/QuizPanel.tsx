import { useState } from 'react'
import type { Lesson } from '../../domain/index.ts'
import { submitQuizResult } from '../../services/learningResultsService.ts'

type QuizPanelProps = {
  quiz: NonNullable<Lesson['quiz']>
  courseId?: string
  courseTitle?: string
  lessonId?: string
  lessonTitle?: string
  userRole?: string | null
}

function QuizPanel({ quiz, courseId, courseTitle, lessonId, lessonTitle, userRole }: QuizPanelProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(quiz.questions.length).fill(null)
  )
  const [submitted, setSubmitted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const score = submitted
    ? answers.filter((answer, i) => answer === quiz.questions[i].correctIndex).length
    : 0

  const handleRetry = () => {
    setAnswers(Array(quiz.questions.length).fill(null))
    setSubmitted(false)
    setSubmitError('')
  }

  const handleSubmit = async () => {
    const nextScore = answers.filter((answer, i) => answer === quiz.questions[i].correctIndex).length
    setIsSaving(true)
    setSubmitError('')

    try {
      if (userRole === 'student' && courseId && lessonId) {
        await submitQuizResult({
          quizId: lessonId,
          quizTitle: quiz.title,
          score: nextScore,
          submittedAt: new Date().toISOString(),
          courseId,
          courseTitle,
          lessonId,
          lessonTitle,
        })
      }
    } catch (error) {
      console.warn('submit quiz result failed', error)
      setSubmitError('Không thể lưu kết quả quiz lên server. Kết quả vẫn được hiển thị tạm thời.')
    } finally {
      setSubmitted(true)
      setIsSaving(false)
    }
  }

  if (submitted) {
    const percentage = Math.round((score / quiz.questions.length) * 100)
    return (
      <div>
        <div className="quiz-score-card">
          <div className="quiz-score-emoji">{percentage === 100 ? '🏆' : percentage >= 60 ? '✅' : '📘'}</div>
          <div className="quiz-score-title">
            {score}/{quiz.questions.length} câu đúng - {percentage}%
          </div>
          <div className="quiz-score-sub">
            {percentage === 100
              ? 'Rất tốt. Bạn đã nắm khá chắc nội dung bài học này.'
              : percentage >= 60
                ? 'Tiến bộ tốt. Xem lại các câu sai ở bên dưới.'
                : 'Hãy luyện thêm. Đọc giải thích và thử làm lại.'}
          </div>
          <button className="btn-quiz-retry" onClick={handleRetry} type="button">
            Làm lại
          </button>
        </div>

        {quiz.questions.map((question, i) => {
          const isCorrect = answers[i] === question.correctIndex
          return (
            <div key={question.id} className="quiz-question-card">
              <div className="quiz-q-num">Câu hỏi {i + 1}</div>
              <div className="quiz-q-text">{question.text}</div>
              <div className="quiz-options">
                {question.options.map((option, j) => (
                  <button
                    key={j}
                    className={`quiz-option ${
                      j === question.correctIndex
                        ? 'correct'
                        : j === answers[i] && !isCorrect
                          ? 'wrong'
                          : ''
                    }`}
                    disabled
                    type="button"
                  >
                    {j === question.correctIndex ? '✓ ' : j === answers[i] ? '✗ ' : ''}
                    {option}
                  </button>
                ))}
              </div>
              <div className="quiz-explanation">
                <span>Giải thích:</span>
                <span>{question.explanation}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="quiz-header">
        <h3>{quiz.title}</h3>
        <p>{quiz.questions.length} câu hỏi. Chọn đáp án phù hợp nhất.</p>
      </div>

      {quiz.questions.map((question, i) => (
        <div key={question.id} className="quiz-question-card">
          <div className="quiz-q-num">Câu hỏi {i + 1}</div>
          <div className="quiz-q-text">{question.text}</div>
          <div className="quiz-options">
            {question.options.map((option, j) => (
              <button
                key={j}
                className={`quiz-option ${answers[i] === j ? 'selected' : ''}`}
                onClick={() => {
                  const next = [...answers]
                  next[i] = j
                  setAnswers(next)
                }}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="quiz-actions">
        <button
          className="btn-quiz-submit"
          disabled={answers.some((answer) => answer === null) || isSaving}
          onClick={() => void handleSubmit()}
          type="button"
        >
          {isSaving ? 'Đang gửi...' : 'Nộp quiz'}
        </button>
      </div>
      {submitError && <div className="quiz-error">{submitError}</div>}
    </div>
  )
}

export default QuizPanel
