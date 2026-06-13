import api from './client'

export interface VoiceRecognizeResponse {
  text: string
  confidence: number
  language?: string
}

export interface VoiceRecognizeParams {
  audio: Blob | File
  asrProvider?: 'volc' | 'tencent'
}

export async function recognizeVoice(params: VoiceRecognizeParams): Promise<VoiceRecognizeResponse> {
  const formData = new FormData()
  const extension = params.audio.type.includes('mp4') ? 'm4a' : params.audio.type.includes('mpeg') ? 'mp3' : 'webm'
  formData.append('audio', params.audio, `recording.${extension}`)
  if (params.asrProvider) {
    formData.append('provider', params.asrProvider)
  }

  const response = await api.post<VoiceRecognizeResponse>('/voice/recognize', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
