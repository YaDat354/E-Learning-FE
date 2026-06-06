import { useEffect, useState } from 'react'
import type { Comment, User, UserRole } from '../../domain/index.ts'
import { createLessonCommentApi, getLessonCommentsApi } from '../../services/discussionService.ts'

type DiscussionPanelProps = {
  lessonId: string
  user: User | null
  commentsSeed: Comment[]
  onGoAuth: () => void
  userRole: UserRole | null
  onCommentsChange?: (comments: Comment[]) => void
}

function DiscussionPanel({ lessonId, user, commentsSeed, onGoAuth, userRole, onCommentsChange }: DiscussionPanelProps) {
  const [comments, setComments] = useState<Comment[]>(commentsSeed)
  const [newText, setNewText] = useState('')
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [isPosting, setIsPosting] = useState(false)
  const [postError, setPostError] = useState('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isReplyPosting, setIsReplyPosting] = useState(false)
  const [replyError, setReplyError] = useState('')

  useEffect(() => {
    setComments(commentsSeed)
  }, [commentsSeed])

  useEffect(() => {
    onCommentsChange?.(comments)
  }, [comments, onCommentsChange])

  const handlePost = async () => {
    const content = newText.trim()
    if (!content || !user || isPosting) {
      return
    }

    setIsPosting(true)
    setPostError('')

    try {
      await createLessonCommentApi(lessonId, {
        text: content,
        authorName: user.name,
      })

      const nextComments = await getLessonCommentsApi(lessonId)
      setComments(nextComments)
      setNewText('')
    } catch (error) {
      console.error('create lesson comment failed', error)
      setPostError('Không thể lưu bình luận. Vui lòng thử lại.')
    } finally {
      setIsPosting(false)
    }
  }

  const handleReply = async (commentId: string) => {
    const content = replyText.trim()
    if (!content || !user || isReplyPosting) {
      return
    }

    setIsReplyPosting(true)
    setReplyError('')

    try {
      await createLessonCommentApi(lessonId, {
        text: content,
        authorName: user.name,
        parentCommentId: commentId,
      })

      const nextComments = await getLessonCommentsApi(lessonId)
      setComments(nextComments)
      setReplyText('')
      setReplyingToId(null)
    } catch (error) {
      console.error('create lesson reply failed', error)
      setReplyError('Không thể gửi trả lời. Vui lòng thử lại.')
    } finally {
      setIsReplyPosting(false)
    }
  }

  const toggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const placeholder = userRole === 'teacher'
    ? 'Gửi phản hồi, gợi ý sửa lỗi hoặc nhắc học viên luyện thêm...'
    : userRole === 'admin'
      ? 'Ghi chú kiểm tra trải nghiệm hoặc nhận xét về nội dung demo...'
      : 'Đặt câu hỏi hoặc chia sẻ cách bạn đang luyện bài học này...'

  const postLabel = userRole === 'teacher'
    ? 'Gửi phản hồi'
    : userRole === 'admin'
      ? 'Ghi chú kiểm tra'
      : 'Đăng bình luận'

  return (
    <div>
      <div className="discussion-header">
        <h3>Thảo luận</h3>
        <span className="comment-count">{comments.length} bình luận</span>
      </div>

      {user ? (
        <div className="new-comment-box">
          <div className="new-comment-av" style={{ background: '#1066d6' }}>
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="new-comment-area">
            <textarea
              className="new-comment-input"
              placeholder={placeholder}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <div className="new-comment-actions">
              <button
                className="btn-post-comment"
                disabled={!newText.trim() || isPosting}
                onClick={() => void handlePost()}
                type="button"
              >
                {isPosting ? 'Đang gửi...' : postLabel}
              </button>
            </div>
            {postError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{postError}</div>}
          </div>
        </div>
      ) : (
        <div className="login-prompt-banner">
          <span>Đăng nhập để tham gia thảo luận cùng giảng viên và học viên khác.</span>
          <button className="btn-login-inline" onClick={onGoAuth} type="button">
            Đăng nhập
          </button>
        </div>
      )}

      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <div className="comment-top">
              <div className="comment-av" style={{ background: comment.avatarColor }}>
                {comment.initials}
              </div>
              <div className="comment-body">
                <div className="comment-author">
                  {comment.author}
                  <span className="comment-time">{comment.time}</span>
                </div>
                <div className="comment-text">{comment.text}</div>
                <div className="comment-actions">
                  <button
                    className={`btn-like ${likedIds.has(comment.id) ? 'liked' : ''}`}
                    onClick={() => toggleLike(comment.id)}
                    type="button"
                  >
                    Thích {comment.likes + (likedIds.has(comment.id) ? 1 : 0)}
                  </button>
                  <button
                    className="btn-reply"
                    type="button"
                    onClick={() => {
                      if (!user) {
                        onGoAuth()
                        return
                      }

                      setReplyError('')
                      if (replyingToId === comment.id) {
                        setReplyingToId(null)
                        setReplyText('')
                        return
                      }

                      setReplyingToId(comment.id)
                      setReplyText('')
                    }}
                  >
                    Trả lời
                  </button>
                </div>

                {replyingToId === comment.id && (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      className="new-comment-input"
                      placeholder={`Trả lời ${comment.author}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                    />
                    <div className="new-comment-actions" style={{ marginTop: 8 }}>
                      <button
                        className="btn-post-comment"
                        disabled={!replyText.trim() || isReplyPosting}
                        onClick={() => void handleReply(comment.id)}
                        type="button"
                      >
                        {isReplyPosting ? 'Đang gửi...' : 'Gửi trả lời'}
                      </button>
                      <button
                        className="btn-reply"
                        type="button"
                        onClick={() => {
                          setReplyingToId(null)
                          setReplyText('')
                          setReplyError('')
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                    {replyError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{replyError}</div>}
                  </div>
                )}

                {comment.replies.length > 0 && (
                  <div className="comment-replies">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="reply-item">
                        <div className="reply-av" style={{ background: reply.avatarColor }}>
                          {reply.initials}
                        </div>
                        <div className="reply-body">
                          <div className="reply-author">
                            {reply.author}
                            <span className="reply-time">{reply.time}</span>
                          </div>
                          <div className="reply-text">{reply.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DiscussionPanel
