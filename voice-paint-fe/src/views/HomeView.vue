<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDrawStore } from '@/stores/drawStore'
import { useRecorder } from '@/composables/useRecorder'
import { recognizeVoice } from '@/api/voice'
import { generateImage, getHistory, recognizeIntent } from '@/api/draw'
import { getCurrentSession, clearChat as apiClearChat, compressChat as apiCompressChat } from '@/api/session'
import { useToast } from '@/composables/useToast'
import VoiceRecorder from '@/components/VoiceRecorder.vue'
import AsrSwitch from '@/components/AsrSwitch.vue'
// import StatusIndicator from '@/components/StatusIndicator.vue'
import ImageCanvas from '@/components/ImageCanvas.vue'
import ImageGallery from '@/components/ImageGallery.vue'
import ChatHistory from '@/components/ChatHistory.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

const drawStore = useDrawStore()
const { asrProvider, fullVoiceMode } = storeToRefs(drawStore)
const { startRecording, stopRecording } = useRecorder()
const { showToast } = useToast()

const showClearConfirm = ref(false)
const showCompressConfirm = ref(false)
const isProcessingChat = ref(false)
const activeTab = ref<'gallery' | 'chat'>('gallery')
const windowWidth = ref(window.innerWidth)
const isLeftPanelExpanded = ref(true)

function toggleFullVoiceMode() {
  const newMode = !fullVoiceMode.value
  drawStore.setFullVoiceMode(newMode)
  showToast(newMode ? '全语音模式已开启' : '全语音模式已关闭', 'info')
  
  if (newMode && drawStore.status === 'idle') {
    handleStartRecording()
  }
}

async function handleClearChat() {
  isProcessingChat.value = true
  try {
    await apiClearChat()
    drawStore.clearChat()
    showToast('对话记录已清空', 'success')
  } catch (err: any) {
    showToast('清空失败', 'error')
  } finally {
    isProcessingChat.value = false
    showClearConfirm.value = false
  }
}

async function handleCompressChat() {
  isProcessingChat.value = true
  try {
    const res = await apiCompressChat()
    // 更新本地 store 中的聊天记录
    drawStore.setChatMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: `📦 对话摘要：${res.summary}`,
      type: 'text',
      createdAt: new Date().toISOString()
    }])
    showToast('对话已压缩', 'success')
  } catch (err: any) {
    showToast('压缩失败', 'error')
  } finally {
    isProcessingChat.value = false
    showCompressConfirm.value = false
  }
}

const isRecording = ref(false)

// --- Initialization: Restore history and chat ---
onMounted(async () => {
  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth
  })

  try {
    // 1. Fetch current session (includes chat history)
    const session = await getCurrentSession()
    if (session.chatHistory) {
      drawStore.setChatMessages(session.chatHistory.map(msg => ({
        ...msg,
        id: `msg-${new Date(msg.createdAt).getTime()}-${Math.random()}`
      })))
    }

    // 2. Fetch image history
    const history = await getHistory()
    if (history && history.length > 0) {
      drawStore.setHistory(history)
      // 刷新后默认展示最新的一张图片，确保语音删除等指令能立即生效
      drawStore.setCurrentImage(history[0].imageUrl)
    }
  } catch (error) {
    console.error('Failed to restore session:', error)
  }
})

async function handleStartRecording() {
  if (isRecording.value) return
  try {
    await startRecording({
      onSilence: () => {
        if (fullVoiceMode.value) {
          handleStopRecording()
        }
      }
    })
    isRecording.value = true
    drawStore.setStatus('recording')
  } catch (e: any) {
    const msg = e.message || '无法访问麦克风，请检查权限设置'
    showToast(msg, 'error')
    drawStore.setErrorMsg(msg)
    drawStore.setStatus('error')
  }
}

async function handleToggleRecording() {
  if (isRecording.value) {
    await handleStopRecording()
  } else {
    await handleStartRecording()
  }
}

async function handleSelectOption(option: string) {
  if (drawStore.status !== 'idle') return
  
  drawStore.addChatMessage({
    id: `user-${Date.now()}`,
    role: 'user',
    content: option,
    type: 'text',
    createdAt: new Date().toISOString(),
  })

  await processUserIntent(option)
}

// 提取通用的意图处理逻辑
async function processUserIntent(text: string) {
  const startTime = Date.now()
  drawStore.setStatus('thinking')
  
  try {
    // 第一阶段：意图识别
    const intentResult = await recognizeIntent({
      prompt: text,
      currentImageUrl: drawStore.currentImage || undefined,
    })

    // 如果是绘图动作，立即切换到 generating 状态
    const isDrawingAction = ['new', 'iterate', 'adjust'].includes(intentResult.action)
    if (isDrawingAction) {
      drawStore.setStatus('generating')
    }

    // 第二阶段：执行动作
    const result = await generateImage({
      prompt: text,
      currentImageUrl: drawStore.currentImage || undefined,
      intent: intentResult,
    })

    const responseTime = Date.now() - startTime

    // 统一同步最新的会话记录
    const session = await getCurrentSession()
    if (session.chatHistory) {
      drawStore.setChatMessages(session.chatHistory.map(msg => ({
        id: msg._id || `msg-${Date.now()}-${Math.random()}`,
        role: msg.role,
        content: msg.content,
        type: msg.type,
        imageUrl: msg.imageUrl,
        createdAt: msg.createdAt,
        isArchived: msg.isArchived,
        archiveGroup: msg.archiveGroup,
        ...(msg.role === 'assistant' && msg.content === result.message ? {
          options: result.options,
          completeness: result.completeness,
          responseTime
        } : {})
      })))
    }

    if (result.action === 'chat' || result.action === 'unknown') {
      drawStore.setStatus('idle')
      if (fullVoiceMode.value) handleStartRecording()
      return
    }

    if (result.action === 'confirm') {
      drawStore.setStatus('done')
      setTimeout(() => {
        if (drawStore.status === 'done') {
          drawStore.setStatus('idle')
          if (fullVoiceMode.value) handleStartRecording()
        }
      }, 3000)
      return
    }

    if (result.action === 'undo') {
      if (result.imageUrl) {
        drawStore.setCurrentImage(result.imageUrl)
      }
      drawStore.setLastMessage(result.message)
      showToast(result.message, 'success')
      drawStore.setStatus('idle')
      if (fullVoiceMode.value) handleStartRecording()
      return
    }

    if (result.action === 'select') {
      if (result.imageUrl) {
        drawStore.setCurrentImage(result.imageUrl)
      }
      drawStore.setLastMessage(result.message)
      showToast(result.message, 'success')
      drawStore.setStatus('idle')
      if (fullVoiceMode.value) handleStartRecording()
      return
    }

    if (result.action === 'exit_voice_mode') {
      drawStore.setFullVoiceMode(false)
      drawStore.setLastMessage(result.message)
      showToast(result.message, 'info')
      drawStore.setStatus('idle')
      return
    }

    if (result.action === 'delete') {
      const deletedUrl = drawStore.currentImage
      drawStore.setCurrentImage(null)
      // 如果后端返回了具体的 imageId 或 imageUrl，使用它们来清理
      if (result.imageId) {
        drawStore.removeFromHistory(result.imageId)
      } else if (result.imageUrl) {
        drawStore.removeFromHistory(result.imageUrl)
      } else {
        // 兜底：如果后端没返回，从当前状态尝试获取
        if (deletedUrl) drawStore.removeFromHistory(deletedUrl)
      }
      drawStore.setLastMessage(result.message)
      showToast(result.message, 'success')
      drawStore.setStatus('idle')
      if (fullVoiceMode.value) handleStartRecording()
      return
    }

    if (result.action === 'clarify') {
      drawStore.setStatus('idle')
      if (fullVoiceMode.value) handleStartRecording()
      return
    }

    // 真正的绘图动作
    await new Promise(resolve => setTimeout(resolve, 500))
    
    drawStore.setCurrentImage(result.imageUrl)
    drawStore.addToHistory({
      imageId: result.imageId || `img-${Date.now()}`,
      imageUrl: result.imageUrl,
      promptCn: text,
      promptEn: result.prompt,
      createdAt: new Date().toISOString(),
      parentImageId: result.parentImageId,
    })
    drawStore.setLastMessage(result.message)
    showToast(result.message || '图片已生成', 'success')

    drawStore.setStatus('done')
    setTimeout(() => {
      if (drawStore.status === 'done') {
        drawStore.setStatus('idle')
        if (fullVoiceMode.value) handleStartRecording()
      }
    }, 3000)

  } catch (e: any) {
    const msg = e.response?.data?.message || '处理失败，请重试'
    drawStore.setErrorMsg(msg)
    drawStore.setStatus('error')
    showToast(msg, 'error')
    if (fullVoiceMode.value) {
      setTimeout(() => {
        drawStore.setStatus('idle')
        handleStartRecording()
      }, 2000)
    }
  }
}

async function handleStopRecording() {
  if (!isRecording.value) return
  isRecording.value = false

  const finalDuration = drawStore.duration
  const blob = await stopRecording()

  if (finalDuration < 1500) {
    drawStore.setStatus('idle')
    showToast('录音时间太短了', 'warning')
    if (fullVoiceMode.value) handleStartRecording()
    return
  }

  if (!blob || blob.size === 0) {
    drawStore.setStatus('idle')
    showToast('未检测到录音', 'warning')
    if (fullVoiceMode.value) handleStartRecording()
    return
  }

  drawStore.setStatus('recognizing')
  try {
    const asrResult = await recognizeVoice({
      audio: blob,
      asrProvider: asrProvider.value,
    })

    if (!asrResult.text || asrResult.confidence < 0.3) {
      drawStore.setErrorMsg('您没有说话')
      drawStore.setStatus('error')
      showToast('您没有说话', 'warning')
      setTimeout(() => {
        if (drawStore.status === 'error') {
          drawStore.setStatus('idle')
          if (fullVoiceMode.value) handleStartRecording()
        }
      }, 2000)
      return
    }

    showToast(`识别: ${asrResult.text}`, 'info')
    drawStore.addChatMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: asrResult.text,
      type: 'text',
      createdAt: new Date().toISOString(),
    })

    await processUserIntent(asrResult.text)

  } catch (e: any) {
    const msg = e.message || '语音处理失败'
    drawStore.setErrorMsg(msg)
    drawStore.setStatus('error')
    showToast(msg, 'error')
    if (fullVoiceMode.value) {
      setTimeout(() => {
        drawStore.setStatus('idle')
        handleStartRecording()
      }, 2000)
    }
  }
}
</script>

<template>
  <div class="h-auto lg:h-full flex flex-col lg:flex-row lg:overflow-hidden no-scrollbar bg-gray-50/50 dark:bg-zinc-950/50">

    <!-- Left panel -->
    <div 
      class="w-full lg:w-96 h-auto lg:h-full flex-shrink-0 flex flex-col items-center p-4 lg:p-6 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl border-b lg:border-b-0 lg:border-r border-white/20 dark:border-white/5 transition-all duration-500"
    >
      <!-- Collapsible Top Area -->
      <div 
        class="w-full flex flex-col items-center transition-all duration-500 ease-in-out"
        :class="[isLeftPanelExpanded ? 'lg:h-0 lg:opacity-0 lg:pointer-events-none lg:mb-0' : 'lg:mb-6']"
      >
        <div class="w-full flex flex-col gap-3 mb-4">
          <AsrSwitch class="w-full" />
          
          <!-- Full Voice Mode Toggle -->
          <button 
            @click="toggleFullVoiceMode"
            class="group w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-300 border"
            :class="[
              fullVoiceMode 
                ? 'bg-violet-500/10 border-violet-500/20 shadow-lg shadow-violet-500/5' 
                : 'bg-white/40 dark:bg-zinc-900/40 border-gray-100 dark:border-zinc-800'
            ]"
          >
            <div class="flex items-center gap-3">
              <div 
                class="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500"
                :class="fullVoiceMode ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/40' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'"
              >
                <div class="i-carbon-voice-activate text-lg"></div>
              </div>
              <div class="flex flex-col items-start">
                <span 
                  class="text-[11px] font-black uppercase tracking-wider transition-colors duration-300"
                  :class="fullVoiceMode ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500'"
                >全语音模式</span>
                <span class="text-[9px] text-gray-400 dark:text-zinc-500 font-medium">无需动手，全程对话创作</span>
              </div>
            </div>
            
            <!-- Modern Switch UI -->
            <div 
              class="w-10 h-5 rounded-full relative transition-all duration-500 p-1"
              :class="fullVoiceMode ? 'bg-violet-500' : 'bg-gray-200 dark:bg-zinc-800'"
            >
              <div 
                class="absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-500 ease-spring"
                :style="{ transform: fullVoiceMode ? 'translateX(20px)' : 'translateX(0)' }"
              ></div>
            </div>
          </button>
        </div>

        <!-- Recorder Area (Centered) -->
        <div class="w-full flex flex-col items-center justify-center py-2 relative">
          <!-- Full Voice Active Indicator -->
          <div 
            v-if="fullVoiceMode"
            class="absolute -top-1 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2"
          >
            <div class="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></div>
            <span class="text-[9px] font-black text-violet-500 uppercase tracking-widest">全语音模式活跃中</span>
          </div>

          <VoiceRecorder
            @start="handleStartRecording"
            @stop="handleStopRecording"
          />
        </div>
      </div>

      <!-- Mini Recorder for Expanded State -->
      <div 
        class="hidden lg:flex w-full items-center justify-between mb-4 p-3 rounded-2xl transition-all duration-500 border"
        :class="[
          drawStore.status === 'recording' ? 'bg-red-500/10 border-red-500/20' : 
          drawStore.status !== 'idle' ? 'bg-violet-500/10 border-violet-500/20' : 
          'bg-violet-500/5 border-violet-500/10'
        ]"
        v-if="isLeftPanelExpanded"
      >
        <div class="flex items-center gap-3">
          <div 
            class="w-2.5 h-2.5 rounded-full transition-all duration-300"
            :class="[
              drawStore.status === 'recording' ? 'bg-red-500 animate-pulse' : 
              drawStore.status !== 'idle' ? 'bg-amber-500 animate-spin-slow' : 
              'bg-violet-500 opacity-40'
            ]"
          ></div>
          <div class="flex flex-col">
            <span 
              class="text-[10px] font-black uppercase tracking-widest transition-colors duration-300"
              :class="drawStore.status === 'recording' ? 'text-red-500' : 'text-violet-500'"
            >
              {{ 
                drawStore.status === 'recording' ? '正在倾听' : 
                drawStore.status === 'recognizing' ? '正在识别' :
                drawStore.status === 'thinking' ? '正在思考' :
                drawStore.status === 'generating' ? '正在绘图' :
                drawStore.status === 'done' ? '处理完成' :
                '录音就绪' 
              }}
            </span>
            <span v-if="drawStore.status === 'recording'" class="text-[9px] font-mono font-bold text-red-400 mt-0.5">{{ Math.floor(drawStore.duration / 1000) }}s</span>
          </div>
        </div>
        <button 
          @mousedown="handleStartRecording"
          @mouseup="handleStopRecording"
          @mouseleave="handleStopRecording"
          :disabled="drawStore.status !== 'idle' && drawStore.status !== 'recording'"
          class="w-10 h-10 rounded-xl flex items-center justify-center transition-all border-none outline-none shadow-lg disabled:opacity-30"
          :class="[
            drawStore.status === 'recording' 
              ? 'bg-red-500 text-white shadow-red-500/40 scale-110' 
              : drawStore.status === 'done'
                ? 'bg-green-500 text-white shadow-green-500/20'
                : 'bg-violet-500 text-white shadow-violet-500/20 hover:scale-105 active:scale-95'
          ]"
        >
          <div :class="[
            drawStore.status === 'recording' ? 'i-carbon-stop-filled' : 
            drawStore.status === 'done' ? 'i-carbon-checkmark' :
            'i-carbon-microphone', 
            'icon text-xl'
          ]"></div>
        </button>
      </div>

      <div class="w-full flex flex-col items-center">
        <!-- <StatusIndicator class="w-full" /> -->
      </div>
      
      <!-- Chat History Area -->
      <div class="flex-1 hidden lg:flex flex-col min-h-0 w-full transition-all duration-500">
        <ChatHistory 
          :is-expanded="isLeftPanelExpanded"
          @compress="showCompressConfirm = true"
          @clear="showClearConfirm = true"
          @view-image="activeTab = 'gallery'"
          @toggle-expand="isLeftPanelExpanded = !isLeftPanelExpanded"
          @select-option="handleSelectOption"
        />
      </div>
    </div>

    <!-- Center: Image display -->
    <div class="h-[40vh] lg:h-auto lg:flex-1 p-3 lg:p-8 overflow-hidden bg-gray-50/50 dark:bg-zinc-950/50 flex flex-col min-w-0">
      <ImageCanvas @request-start-recording="handleToggleRecording" />
    </div>

    <!-- Right panel: History -->
    <div 
      class="w-full lg:w-80 h-[calc(100vh-64px)] lg:h-full flex-shrink-0 p-4 lg:p-8 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/20 dark:border-white/5 flex flex-col gap-4 min-h-0"
    >
      <!-- Tabs for mobile (Modern Glass Design) -->
      <div class="flex lg:hidden items-center p-1 bg-violet-500/5 dark:bg-violet-500/10 backdrop-blur-md rounded-2xl relative border border-violet-500/10">
        <!-- Active indicator background (Sliding effect) -->
        <div 
          class="absolute inset-y-1 transition-all duration-300 ease-out bg-violet-500/10 dark:bg-violet-500/20 rounded-xl pointer-events-none border border-violet-500/20"
          :style="{ 
            left: activeTab === 'gallery' ? '4px' : '50%', 
            width: 'calc(50% - 4px)' 
          }"
        ></div>

        <button 
          @click="activeTab = 'gallery'"
          class="flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all border-none outline-none"
          :class="activeTab === 'gallery' ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
        >
          <div class="i-carbon-image icon text-sm"></div>
          画廊历史
        </button>
        <button 
          @click="activeTab = 'chat'"
          class="flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all border-none outline-none"
          :class="activeTab === 'chat' ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
        >
          <div class="i-carbon-chat icon text-sm"></div>
          对话记录
        </button>
      </div>

      <div class="flex-1 min-h-0">
        <ImageGallery v-show="activeTab === 'gallery' || windowWidth >= 1024" />
        <ChatHistory 
          v-show="activeTab === 'chat' && windowWidth < 1024" 
          @compress="showCompressConfirm = true"
          @clear="showClearConfirm = true"
          @view-image="activeTab = 'gallery'"
        />
      </div>
    </div>

    <!-- Modals -->
    <ConfirmModal
      :show="showClearConfirm"
      title="清空对话"
      message="确定要清空所有对话记录吗？此操作不可撤销。"
      confirm-text="清空"
      :loading="isProcessingChat"
      @confirm="handleClearChat"
      @cancel="showClearConfirm = false"
    />

    <ConfirmModal
      :show="showCompressConfirm"
      title="压缩对话"
      message="确定要压缩之前的对话吗？系统将利用 AI 总结核心意图并替换现有记录，使界面更清爽。"
      confirm-text="压缩"
      :loading="isProcessingChat"
      @confirm="handleCompressChat"
      @cancel="showCompressConfirm = false"
    />
  </div>
</template>
