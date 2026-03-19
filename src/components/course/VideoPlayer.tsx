import { useEffect, useMemo, useState } from 'react'

type VideoPlayerProps = {
  title: string
  duration: string
  script: string[]
  keyPhrases: string[]
}

function VideoPlayer({ title, duration, script, keyPhrases }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [currentLine, setCurrentLine] = useState(0)
  const normalizedTitle = title.toUpperCase()
  const isToeic = normalizedTitle.includes('TOEIC')
  const isListening = normalizedTitle.includes('LISTENING')

  const lessonModeLabel = isToeic
    ? (isListening ? 'TOEIC Listening' : 'TOEIC Reading')
    : 'Bài giảng tiếng Anh'

  const posterBadge = isToeic
    ? `Mô phỏng video ${lessonModeLabel}`
    : 'Bài giảng tiếng Anh tương tác'

  const posterDesc = isToeic
    ? 'Nhấn phát để luyện theo đúng dạng bài TOEIC với nội dung mẫu, từ khóa và hướng dẫn làm nhanh.'
    : 'Nhấn phát để xem nội dung mẫu, câu thoại và cụm từ trọng tâm của bài học này.'

  useEffect(() => {
    if (!playing || script.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setCurrentLine((prev) => (prev + 1) % script.length)
    }, 2800)

    return () => {
      window.clearInterval(timer)
    }
  }, [playing, script.length])

  const progress = useMemo(() => {
    if (script.length <= 1) {
      return 100
    }

    return ((currentLine + 1) / script.length) * 100
  }, [currentLine, script.length])

  if (playing) {
    return (
      <div className="video-wrapper">
        <div className="lesson-video-stage">
          <div className="lesson-video-topbar">
            <span className="lesson-video-live">Đang phát {lessonModeLabel}</span>
            <span className="lesson-video-duration">{duration}</span>
          </div>

          <div className="lesson-video-screen">
            <div className="lesson-video-topic">{title}</div>
            <div className="lesson-video-step">Mẫu câu {currentLine + 1}/{Math.max(script.length, 1)}</div>
            <div className="lesson-video-subtitle">{script[currentLine] ?? script[0]}</div>
            <div className="lesson-video-phrase-list">
              {keyPhrases.map((phrase) => (
                <span key={phrase} className="lesson-video-phrase">{phrase}</span>
              ))}
            </div>
          </div>

          <div className="lesson-video-controls">
            <button
              className="lesson-video-control"
              onClick={() => setPlaying(false)}
              type="button"
            >
              Dừng
            </button>
            <button
              className="lesson-video-control"
              onClick={() => setCurrentLine((prev) => (prev + 1) % script.length)}
              type="button"
            >
              Câu tiếp theo
            </button>
          </div>

          <div className="lesson-video-progress">
            <div className="lesson-video-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="video-wrapper">
      <div className="video-poster" onClick={() => setPlaying(true)}>
        <div className="video-poster-content">
          <span className="video-poster-badge">{posterBadge}</span>
          <h3>{title}</h3>
          <p>{posterDesc}</p>
        </div>
        <button className="play-btn" aria-label="Play lesson video" type="button">
          ▶
        </button>
      </div>
    </div>
  )
}

export default VideoPlayer
