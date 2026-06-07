import axios from 'axios'
import api from '../lib/api.ts'

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  role: ChatRole
  content: string
}

export type ChatCompletionResult = {
  reply: string
  conversationId?: string
}

const CHAT_ENDPOINTS = [
  '/chatbot/chat',
  '/ai/chat',
  '/assistant/chat',
]

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function readTextCandidate(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  return ''
}

function normalizeReply(payload: unknown): ChatCompletionResult {
  const root = asRecord(payload)
  const data = asRecord(root.data)

  const reply =
    readTextCandidate(data, ['reply', 'answer', 'message', 'output', 'text'])
    || readTextCandidate(root, ['reply', 'answer', 'message', 'output', 'text'])

  return {
    reply: reply || 'Mình chưa nhận được phản hồi từ máy chủ AI.',
    conversationId:
      readTextCandidate(data, ['conversationId', 'conversation_id'])
      || readTextCandidate(root, ['conversationId', 'conversation_id'])
      || undefined,
  }
}

export async function sendChatMessage(payload: {
  message: string
  history: ChatMessage[]
  conversationId?: string
  context?: {
    role?: 'student' | 'teacher' | 'admin'
    feature?: string
  }
}): Promise<ChatCompletionResult> {
  const requestBody = {
    message: payload.message,
    history: payload.history,
    conversationId: payload.conversationId,
    context: payload.context,
  }

  let lastError: unknown = null

  for (const endpoint of CHAT_ENDPOINTS) {
    try {
      const { data } = await api.post(endpoint, requestBody)
      return normalizeReply(data)
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 405)) {
        lastError = error
        continue
      }

      throw error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Chatbot endpoint not found')
}
