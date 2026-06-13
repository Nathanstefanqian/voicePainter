import api from './client'

export interface DrawGenerateParams {
  prompt: string
  referenceImageUrl?: string
  currentImageUrl?: string
  asrProvider?: 'volc' | 'tencent'
  sessionId?: string
  intent?: any
}

export interface DrawGenerateResponse {
  action: string
  imageId?: string
  imageUrl: string
  prompt: string
  message: string
  parentImageId?: string
  options?: string[]
  completeness?: number
}

export interface ImageRecord {
  imageId: string
  imageUrl: string
  promptCn: string
  promptEn: string
  createdAt: string
}

export interface DrawingIntent {
  action: 'new' | 'iterate' | 'adjust' | 'confirm' | 'undo' | 'chat' | 'clarify' | 'unknown'
  prompt: string
  size?: string
  aspect_ratio?: string
  reference_images?: string[]
  watermark?: boolean
  confidence: number
  completeness?: number
  clarify_question?: string
  clarify_options?: string[]
  user_feedback: string
}

export async function recognizeIntent(params: { prompt: string, currentImageUrl?: string }): Promise<DrawingIntent> {
  const response = await api.post<DrawingIntent>('/draw/intent', params)
  return response.data
}

export async function generateImage(params: DrawGenerateParams): Promise<DrawGenerateResponse> {
  const { asrProvider, sessionId, ...rest } = params
  const response = await api.post<DrawGenerateResponse>('/draw/generate', {
    ...rest,
    ...(asrProvider && { asrProvider }),
    ...(sessionId && { sessionId }),
  })
  return response.data
}

export async function getHistory(): Promise<ImageRecord[]> {
  const response = await api.get<ImageRecord[]>('/draw/history')
  return response.data
}

export async function getImage(imageId: string): Promise<ImageRecord> {
  const response = await api.get<ImageRecord>(`/draw/${imageId}`)
  return response.data
}

export async function deleteImage(imageId: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/draw/${imageId}`)
  return response.data
}
