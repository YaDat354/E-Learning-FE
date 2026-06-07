import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import type { User } from '../../domain/index.ts'
import { sendChatMessage, type ChatMessage } from '../../services/chatbotService.ts'
import './ChatbotWidget.css'

type ChatbotWidgetProps = {
  user: User
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

function getInitialAssistantMessage(role: User['role']): ChatMessage {
  if (role === 'teacher') {
    return {
      role: 'assistant',
      content: 'Chào thầy/cô. Mình có thể hỗ trợ lên đề cương khóa học, mục tiêu đầu ra, lesson plan và bộ quiz mẫu.',
    }
  }

  return {
    role: 'assistant',
    content: 'Chào bạn, mình là trợ lý học tiếng Anh. Bạn muốn luyện gì hôm nay?',
  }
}

function getQuickPrompt(role: User['role']): string {
  if (role === 'teacher') {
    return 'Hãy giúp tôi tạo đề cương khóa học Tiếng Anh giao tiếp 8 tuần cho người đi làm, gồm mục tiêu, lesson plan theo tuần, quiz và bài tập thực hành.'
  }

  return 'Giúp mình luyện 5 câu giao tiếp tự tin trong buổi phỏng vấn tiếng Anh.'
}

function ChatbotWidget({ user, isOpen, onOpen, onClose }: ChatbotWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([getInitialAssistantMessage(user.role)])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedInput = input.trim()

    if (!trimmedInput || isSending) {
      return
    }

    const nextUserMessage: ChatMessage = {
      role: 'user',
      content: trimmedInput,
    }

    const historyForRequest = [...messages, nextUserMessage].slice(-12)

    setInput('')
    setError('')
    setMessages((prev) => [...prev, nextUserMessage])
    setIsSending(true)

    try {
      const response = await sendChatMessage({
        message: trimmedInput,
        history: historyForRequest,
        conversationId,
        context: {
          role: user.role,
          feature: user.role === 'teacher' ? 'course-creation-assistant' : 'student-learning-assistant',
        },
      })

      if (response.conversationId) {
        setConversationId(response.conversationId)
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.reply,
        },
      ])
    } catch (submitError) {
      console.error('chatbot request failed', submitError)
      setError('Chưa kết nối được BE chatbot. Vui lòng thử lại sau.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <button className="chatbot-fab" onClick={isOpen ? onClose : onOpen} aria-label="Mở trợ lý AI" title="Trợ lý AI">
        {isOpen ? <X size={22} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <section className="chatbot-widget-panel" aria-label="Trợ lý AI">
          <header className="chatbot-widget-header">
            <div>
              <strong>Trợ lý AI</strong>
              <p>{user.name}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Đóng trợ lý AI">
              <X size={16} />
            </button>
          </header>

          <div className="chatbot-widget-messages" role="log" aria-live="polite">
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} className={`chatbot-widget-bubble ${message.role}`}>
                <p>{message.content}</p>
              </article>
            ))}
            {isSending && (
              <article className="chatbot-widget-bubble assistant">
                <p>Đang soạn phản hồi...</p>
              </article>
            )}
          </div>

          <form className="chatbot-widget-form" onSubmit={(event) => void handleSubmit(event)}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={user.role === 'teacher' ? 'Ví dụ: tạo outline khóa học TOEIC 10 buổi...' : 'Nhập câu hỏi tiếng Anh của bạn...'}
              rows={2}
              disabled={isSending}
            />
            <button
              type="button"
              className="chatbot-widget-quick"
              onClick={() => setInput(getQuickPrompt(user.role))}
              disabled={isSending}
            >
              {user.role === 'teacher' ? 'Gợi ý tạo khóa học' : 'Gợi ý prompt học tập'}
            </button>
            <div className="chatbot-widget-actions">
              {error && <span>{error}</span>}
              <button type="submit" disabled={isSending || input.trim().length === 0}>Gửi</button>
            </div>
          </form>
        </section>
      )}
    </>
  )
}

export default ChatbotWidget
