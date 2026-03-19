import { useState } from 'react'
import type { Comment, User, UserRole } from '../../data/mockData.ts'

type DiscussionPanelProps = {
  user: User | null
  commentsSeed: Comment[]
  onGoAuth: () => void
  userRole: UserRole | null
}

function DiscussionPanel({ user, commentsSeed, onGoAuth, userRole }: DiscussionPanelProps) {
  const [comments, setComments] = useState<Comment[]>(commentsSeed)
  const [newText, setNewText] = useState('')
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  const handlePost = () => {
    if (!newText.trim() || !user) return

    const newComment: Comment = {
      id: `new-${Date.now()}`,
      author: user.name,
      initials: user.name.slice(0, 2).toUpperCase(),
      avatarColor: '#1066d6',
      text: newText.trim(),
      time: 'Vừa xong',
      likes: 0,
      replies: [],
    }

    setComments((prev) => [newComment, ...prev])
    setNewText('')
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
                disabled={!newText.trim()}
                onClick={handlePost}
                type="button"
              >
                {postLabel}
              </button>
            </div>
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
                  <button className="btn-reply" type="button">
                    Trả lời
                  </button>
                </div>

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
