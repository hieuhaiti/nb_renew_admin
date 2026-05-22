import type { Pagination } from './index'

export interface ChatbotSession {
  id: string
  user_id: string | null
  language: string
  created_at: string
  updated_at: string
}

export interface ChatbotMessage {
  id: number
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatbotSessionDetail {
  session: ChatbotSession
  messages: ChatbotMessage[]
}

export interface ChatbotSessionListData {
  sessions: ChatbotSession[]
  pagination: Pagination
}

export interface ChatbotSendMessageBody {
  message: string
  language?: string
}

export interface ChatbotSendMessageResponse {
  reply: string
  message: ChatbotMessage
}

export interface ChatbotCreateSessionBody {
  language?: string
}
