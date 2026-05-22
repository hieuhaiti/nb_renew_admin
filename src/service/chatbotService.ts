import apiClient from './common/apiClient'
import type {
  ApiResponse,
  ChatbotSession,
  ChatbotSessionDetail,
  ChatbotSessionListData,
  ChatbotCreateSessionBody,
  ChatbotSendMessageBody,
  ChatbotSendMessageResponse,
} from '@/types/api'
import { serviceChatbotPath } from '@/constant/serviceConstant'

// TODO: Admin UI for chatbot sessions not yet implemented — service available per Postman

export default {
  /** POST /chatbot/sessions */
  createSession: (data?: ChatbotCreateSessionBody) =>
    apiClient.post<ApiResponse<ChatbotSession>>(`${serviceChatbotPath}/sessions`, data ?? {}),

  /** GET /chatbot/sessions */
  getSessions: () =>
    apiClient.get<ApiResponse<ChatbotSessionListData>>(`${serviceChatbotPath}/sessions`),

  /** GET /chatbot/sessions/:sessionId */
  getSession: (sessionId: string) =>
    apiClient.get<ApiResponse<ChatbotSessionDetail>>(`${serviceChatbotPath}/sessions/${sessionId}`),

  /** POST /chatbot/sessions/:sessionId/messages */
  sendMessage: (sessionId: string, data: ChatbotSendMessageBody) =>
    apiClient.post<ApiResponse<ChatbotSendMessageResponse>>(
      `${serviceChatbotPath}/sessions/${sessionId}/messages`, data
    ),

  /** DELETE /chatbot/sessions/:sessionId */
  deleteSession: (sessionId: string) =>
    apiClient.del<ApiResponse<{}>>(`${serviceChatbotPath}/sessions/${sessionId}`),
}
