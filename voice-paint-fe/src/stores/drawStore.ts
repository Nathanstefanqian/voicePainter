import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type DrawStatus = 'idle' | 'recording' | 'recognizing' | 'thinking' | 'generating' | 'done' | 'error'
export type AsrProvider = 'volc' | 'tencent'

export interface ImageRecord {
  imageId: string
  imageUrl: string
  promptCn: string
  promptEn: string
  createdAt: string
  parentImageId?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  type: 'text' | 'image'
  imageUrl?: string
  createdAt: string
  responseTime?: number // 响应时间（毫秒）
  options?: string[]
  completeness?: number
  isArchived?: boolean
  archiveGroup?: string
}

export const useDrawStore = defineStore('draw', () => {
  const currentImage = ref<string | null>(null)
  const imageHistory = ref<ImageRecord[]>([])
  const chatMessages = ref<ChatMessage[]>([])
  const isGenerating = ref(false)
  const status = ref<DrawStatus>('idle')
  const isRetry = ref(false)
  const asrProvider = ref<AsrProvider>('tencent')
  const lastMessage = ref<string>('')
  const errorMsg = ref<string>('')
  const duration = ref(0)
  const audioLevel = ref(0)
  const fullVoiceMode = ref(false)

  const isProcessing = computed(() =>
    status.value === 'recording' || 
    status.value === 'recognizing' || 
    status.value === 'thinking' || 
    status.value === 'generating',
  )

  function setFullVoiceMode(mode: boolean) {
    fullVoiceMode.value = mode
  }

  function setStatus(s: DrawStatus) {
    status.value = s
    if (s !== 'recording') {
      isRetry.value = false
    }
  }

  function setIsRetry(retry: boolean) {
    isRetry.value = retry
  }

  function setCurrentImage(url: string | null) {
    currentImage.value = url
  }

  function setHistory(history: ImageRecord[]) {
    imageHistory.value = history
  }

  function removeFromHistory(idOrUrl: string) {
    const index = imageHistory.value.findIndex(img => img.imageId === idOrUrl || img.imageUrl === idOrUrl)
    if (index !== -1) {
      const removedImg = imageHistory.value[index]
      imageHistory.value.splice(index, 1)
      
      // If deleted image was the current image, show the next available or null
      if (currentImage.value === removedImg.imageUrl) {
        currentImage.value = imageHistory.value[0]?.imageUrl || null
      }
    }
  }

  function setChatMessages(messages: ChatMessage[]) {
    chatMessages.value = messages
  }

  function addToHistory(record: ImageRecord) {
    imageHistory.value.unshift(record)
    if (!currentImage.value) {
      currentImage.value = record.imageUrl
    }
  }

  function setImageHistory(records: ImageRecord[]) {
    imageHistory.value = records
    if (records.length > 0 && !currentImage.value) {
      currentImage.value = records[0].imageUrl
    }
  }

  function clearHistory() {
    imageHistory.value = []
    currentImage.value = null
    status.value = 'idle'
  }

  function setAsrProvider(provider: 'volc' | 'tencent') {
    asrProvider.value = provider
  }

  function setGenerating(generating: boolean) {
    isGenerating.value = generating
  }

  function setLastMessage(msg: string) {
    lastMessage.value = msg
  }

  function setErrorMsg(msg: string) {
    errorMsg.value = msg
  }

  function addChatMessage(msg: ChatMessage) {
    chatMessages.value.push(msg)
  }

  function clearChat() {
    chatMessages.value = []
  }

  function setDuration(d: number) { duration.value = d }
  function setAudioLevel(l: number) { audioLevel.value = l }

  return {
    currentImage,
    imageHistory,
    isGenerating,
    status,
    asrProvider,
    lastMessage,
    errorMsg,
    duration,
    audioLevel,
    fullVoiceMode,
    isProcessing,
    setStatus,
    setFullVoiceMode,
    setCurrentImage,
    addToHistory,
    setImageHistory,
    clearHistory,
    setAsrProvider,
    setGenerating,
    setLastMessage,
    setErrorMsg,
    setHistory,
    setChatMessages,
    addChatMessage,
    clearChat,
    setDuration,
    setAudioLevel,
    setIsRetry,
    removeFromHistory,
    chatMessages,
    isRetry,
  }
})
