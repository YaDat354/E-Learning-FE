import { useState } from 'react'
import type { Lesson } from '../../data/mockData.ts'

type QuizPanelProps = {
  quiz: NonNullable<Lesson['quiz']>
}

function QuizPanel({ quiz }: QuizPanelProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(quiz.questions.length).fill(null)
  )
  const [submitted, setSubmitted] = useState(false)

  const score = submitted
    ? answers.filter((answer, i) => answer === quiz.questions[i].correctIndex).length
    : 0

  const handleRetry = () => {
    setAnswers(Array(quiz.questions.length).fill(null))
    setSubmitted(false)
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
          disabled={answers.some((answer) => answer === null)}
          onClick={() => setSubmitted(true)}
          type="button"
        >
          Nộp quiz
        </button>
      </div>
    </div>
  )
}

export default QuizPanel
