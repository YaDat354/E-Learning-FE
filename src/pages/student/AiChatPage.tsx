import { useState } from 'react'
import type { User } from '../../domain/index.ts'
import { sendChatMessage, type ChatMessage } from '../../services/chatbotService.ts'
import './AiChatPage.css'

type AiChatPageProps = {
  user: User | null
  onBack: () => void
}

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Chào bạn, mình là trợ lý học tiếng Anh. Bạn muốn luyện hội thoại, từ vựng hay ngữ pháp?',
}

function AiChatPage({ user, onBack }: AiChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedInput = input.trim()
    if (!trimmedInput) {
      return
    }

    const nextUserMessage: ChatMessage = {
      role: 'user',
      content: trimmedInput,
    }

    const historyForRequest = [...messages, nextUserMessage].slice(-12)

    setError('')
    setInput('')
    setMessages((prev) => [...prev, nextUserMessage])
    setIsSending(true)

    try {
      const response = await sendChatMessage({
        message: trimmedInput,
        history: historyForRequest,
        conversationId,
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
      setError('Chưa kết nối được BE chatbot. Bạn hãy kiểm tra endpoint BE theo tài liệu mình đã thêm trong docs.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="ai-chat-page">
      <div className="ai-chat-shell">
        <header className="ai-chat-header">
          <button className="ai-chat-back" onClick={onBack}>Quay lại</button>
          <div>
            <h1>Trợ lý AI</h1>
            <p>
              {user
                ? `Đang đăng nhập: ${user.name}`
                : 'Bạn có thể dùng thử chatbot, token sẽ được gửi nếu đã đăng nhập.'}
            </p>
          </div>
        </header>

        <div className="ai-chat-messages" role="log" aria-live="polite">
          {messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={`ai-chat-bubble ${message.role === 'user' ? 'user' : 'assistant'}`}
            >
              <span className="ai-chat-bubble-role">{message.role === 'user' ? 'Bạn' : 'AI'}</span>
              <p>{message.content}</p>
            </article>
          ))}
          {isSending && (
            <article className="ai-chat-bubble assistant">
              <span className="ai-chat-bubble-role">AI</span>
              <p>Đang soạn phản hồi...</p>
            </article>
          )}
        </div>

        <form className="ai-chat-composer" onSubmit={(event) => void handleSubmit(event)}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ví dụ: Giúp mình luyện 5 câu giao tiếp khi đi phỏng vấn"
            rows={3}
            disabled={isSending}
          />
          <div className="ai-chat-composer-actions">
            {error && <p>{error}</p>}
            <button type="submit" disabled={isSending || input.trim().length === 0}>
              {isSending ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default AiChatPage
