import { useEffect, useMemo, useState } from 'react'

type VideoPlayerProps = {
  title: string
  duration: string
  videoId: string
  script: string[]
  keyPhrases: string[]
}

type ResolvedSource =
  | { type: 'youtube'; url: string }
  | { type: 'video'; url: string }
  | { type: 'audio'; url: string }
  | { type: 'none' }

function getUrlExtension(url: string): string {
  const clean = url.split('?')[0].split('#')[0]
  const idx = clean.lastIndexOf('.')
  if (idx < 0) {
    return ''
  }

  return clean.slice(idx + 1).toLowerCase()
}

function extractYoutubeId(input: string): string {
  const raw = input.trim()

  if (!raw) {
    return ''
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const url = new URL(raw)
      const host = url.hostname.toLowerCase()

      if (host.includes('youtu.be')) {
        const id = url.pathname.split('/').filter(Boolean)[0] ?? ''
        return id ? `https://www.youtube.com/embed/${id}?rel=0` : ''
      }

      if (host.includes('youtube.com')) {
        if (url.pathname.startsWith('/embed/')) {
          return url.pathname.split('/').filter(Boolean)[1] ?? ''
        }

        if (url.pathname.startsWith('/shorts/')) {
          return url.pathname.split('/').filter(Boolean)[1] ?? ''
        }

        if (url.pathname.startsWith('/live/')) {
          return url.pathname.split('/').filter(Boolean)[1] ?? ''
        }

        const id = url.searchParams.get('v') ?? ''
        return id
      }

      return ''
    } catch {
      return ''
    }
  }

  return raw
}

function isYoutubeIdValid(id: string): boolean {
  return /^[A-Za-z0-9_-]{10,15}$/.test(id)
}

function resolveSource(videoId: string): ResolvedSource {
  const raw = videoId.trim()
  if (!raw) {
    return { type: 'none' }
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    const extension = getUrlExtension(raw)
    if (extension === 'mp3' || extension === 'wav' || extension === 'ogg' || extension === 'm4a') {
      return { type: 'audio', url: raw }
    }

    if (extension === 'mp4' || extension === 'webm' || extension === 'mov') {
      return { type: 'video', url: raw }
    }
  }

  const youtubeId = extractYoutubeId(raw)
  if (isYoutubeIdValid(youtubeId)) {
    return {
      type: 'youtube',
      url: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`,
    }
  }

  return { type: 'none' }
}

function VideoPlayer({ title, duration, videoId, script, keyPhrases }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [currentLine, setCurrentLine] = useState(0)
  const normalizedTitle = title.toUpperCase()
  const source = resolveSource(videoId)
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

  if (source.type === 'youtube') {
    return (
      <div className="video-wrapper">
        <div className="lesson-video-stage">
          <div className="lesson-video-topbar">
            <span className="lesson-video-live">Bài giảng video</span>
            <span className="lesson-video-duration">{duration}</span>
          </div>

          <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 12, overflow: 'hidden' }}>
            <iframe
              title={title}
              src={source.url}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    )
  }

  if (source.type === 'video') {
    return (
      <div className="video-wrapper">
        <div className="lesson-video-stage">
          <div className="lesson-video-topbar">
            <span className="lesson-video-live">Bài giảng video</span>
            <span className="lesson-video-duration">{duration}</span>
          </div>
          <video controls style={{ width: '100%', borderRadius: 12, background: '#000' }} src={source.url} />
        </div>
      </div>
    )
  }

  if (source.type === 'audio') {
    return (
      <div className="video-wrapper">
        <div className="lesson-video-stage" style={{ gap: 14 }}>
          <div className="lesson-video-topbar">
            <span className="lesson-video-live">Bài nghe</span>
            <span className="lesson-video-duration">{duration}</span>
          </div>
          <div style={{ padding: '16px 14px', borderRadius: 12, background: '#f6f8fb' }}>
            <audio controls style={{ width: '100%' }} src={source.url} />
          </div>
        </div>
      </div>
    )
  }

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
          <p>{posterDesc} Chưa có nguồn media hợp lệ nên đang chạy chế độ mô phỏng.</p>
        </div>
        <button className="play-btn" aria-label="Play lesson video" type="button">
          ▶
        </button>
      </div>
    </div>
  )
}

export default VideoPlayer
