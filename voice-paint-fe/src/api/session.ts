import api from './client'

export interface DrawingSession {
  sessionId: string
  userId: string
  status: string
  turnCount: number
  currentImageId?: string
  imageHistory: string[]
  chatHistory: Array<{
    _id?: string
    role: 'user' | 'assistant'
    content: string
    type: 'text' | 'image'
    imageUrl?: string
    createdAt: string
    isArchived?: boolean
    archiveGroup?: string
  }>
}

export async function getCurrentSession(): Promise<DrawingSession> {
  const response = await api.get<DrawingSession>('/session/current')
  return response.data
}

export async function clearChat(): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>('/session/chat')
  return response.data
}

export async function compressChat(): Promise<{ message: string; summary: string }> {
  const response = await api.post<{ message: string; summary: string }>('/session/chat/compress')
  return response.data
}

export async function startNewSession(): Promise<DrawingSession> {
  const response = await api.post<DrawingSession>('/session/new')
  return response.data
}

export async function getSessionHistory(): Promise<DrawingSession[]> {
  const response = await api.get<DrawingSession[]>('/session/history')
  return response.data
}
