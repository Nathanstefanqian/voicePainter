<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useDrawStore, type ChatMessage } from '@/stores/drawStore'
import { marked } from 'marked'

const drawStore = useDrawStore()
const scrollContainer = ref<HTMLElement | null>(null)
const expandedGroups = ref<Set<string>>(new Set())
const showStatusDelay = ref(false)
let statusTimeout: number | null = null

const props = defineProps<{
  isExpanded?: boolean
}>()

const emit = defineEmits(['compress', 'clear', 'view-image', 'toggle-expand', 'select-option'])

// 分组后的消息
const groupedMessages = computed(() => {
  const groups: { type: 'archived' | 'active', name?: string, messages: ChatMessage[] }[] = []
  let currentGroup: { type: 'archived' | 'active', name?: string, messages: ChatMessage[] } | null = null

  drawStore.chatMessages.forEach(msg => {
    if ((msg as any).isArchived) {
      const groupName = (msg as any).archiveGroup || '历史对话'
      if (!currentGroup || currentGroup.name !== groupName) {
        currentGroup = { type: 'archived', name: groupName, messages: [] }
        groups.push(currentGroup)
      }
      currentGroup.messages.push(msg)
    } else {
      if (!currentGroup || currentGroup.type !== 'active') {
        currentGroup = { type: 'active', messages: [] }
        groups.push(currentGroup)
      }
      currentGroup.messages.push(msg)
    }
  })

  return groups
})

const lastMessageRef = ref<HTMLElement | null>(null)

function setLastMessageRef(el: any) {
  if (el) lastMessageRef.value = el
}

function toggleGroup(groupName: string) {
  if (expandedGroups.value.has(groupName)) {
    expandedGroups.value.delete(groupName)
  } else {
    expandedGroups.value.add(groupName)
  }
}

function handleSelectOption(option: string) {
  emit('select-option', option)
}

function handleViewImage(url: string) {
  drawStore.setCurrentImage(url)
  emit('view-image', url)
}

function renderMarkdown(content: string) {
  const cleanContent = content.replace(/^对话摘要[:：]\s*/, '')
  return marked.parse(cleanContent)
}

const activeGroupRef = ref<HTMLElement | null>(null)

// 滚动到活跃对话顶部
function scrollToActiveTop(behavior: ScrollBehavior = 'smooth') {
  nextTick(() => {
    if (scrollContainer.value && activeGroupRef.value) {
      const top = activeGroupRef.value.offsetTop - 20 // 留一点边距
      scrollContainer.value.scrollTo({
        top,
        behavior
      })
    } else {
      scrollToBottom(behavior)
    }
  })
}

// 自动滚动到最新消息并使其居中
function scrollToLastMessageCentered(behavior: ScrollBehavior = 'smooth') {
  nextTick(() => {
    if (scrollContainer.value && lastMessageRef.value) {
      const container = scrollContainer.value
      const el = lastMessageRef.value
      
      // 计算目标滚动位置，使消息位于容器中央
      const elTop = el.offsetTop
      const elHeight = el.offsetHeight
      const containerHeight = container.offsetHeight
      
      const targetScrollTop = elTop - (containerHeight / 2) + (elHeight / 2)
      
      // 只有当消息靠近底部时才执行居中滚动
      const threshold = container.scrollHeight - containerHeight - 150
      if (container.scrollTop > threshold || container.scrollTop + containerHeight < elTop) {
        container.scrollTo({
          top: targetScrollTop,
          behavior
        })
      } else {
        // 否则只是常规滚动到底部
        scrollToBottom(behavior)
      }
    } else {
      scrollToBottom(behavior)
    }
  })
}

function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTo({
        top: scrollContainer.value.scrollHeight,
        behavior
      })
    }
  })
}

watch(() => drawStore.status, (newStatus) => {
  if (newStatus !== 'idle' && newStatus !== 'error' && newStatus !== 'recording' && newStatus !== 'done') {
    // 如果已经在计时，先清除
    if (statusTimeout) clearTimeout(statusTimeout)
    
    // 设置 800ms 延迟显示，等待语音识别消息先上屏
    statusTimeout = window.setTimeout(() => {
      showStatusDelay.value = true
      scrollToBottom('smooth')
    }, 800)
  } else {
    if (statusTimeout) clearTimeout(statusTimeout)
    showStatusDelay.value = false
  }
})

// 首次加载和消息变化时滚动
onMounted(() => {
  scrollToActiveTop('instant' as ScrollBehavior)
})

watch(() => drawStore.chatMessages.length, (newLen, oldLen) => {
  // 如果是新增消息，判断是否是新任务开始
  if (newLen > oldLen) {
    const isFirstActive = drawStore.chatMessages.filter(m => !(m as any).isArchived).length === 1
    
    if (isFirstActive) {
      scrollToActiveTop('smooth')
    } else {
      scrollToLastMessageCentered('smooth')
    }
  }
})
</script>

<template>
  <div class="flex flex-col gap-3 h-full min-h-0">
    <div class="flex items-center justify-between px-1.5">
      <span class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] opacity-80">对话过程</span>
      <div class="flex items-center gap-2">
        <button 
          @click="$emit('toggle-expand')"
          class="hidden lg:flex w-7 h-7 rounded-xl bg-gray-200/40 dark:bg-zinc-800/40 hover:bg-violet-500/10 dark:hover:bg-violet-500/20 items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-violet-500 dark:hover:text-violet-400 transition-all active:scale-90 border-none"
          :title="isExpanded ? '缩小列表' : '展开列表'"
        >
          <div :class="[isExpanded ? 'i-carbon-chevron-down' : 'i-carbon-chevron-up', 'icon text-sm']"></div>
        </button>
        <button 
          @click="$emit('compress')"
          class="w-7 h-7 rounded-xl bg-gray-200/40 dark:bg-zinc-800/40 hover:bg-violet-500/10 dark:hover:bg-violet-500/20 flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-violet-500 dark:hover:text-violet-400 transition-all active:scale-90 border-none"
          title="压缩对话"
        >
          <div class="i-carbon-shrink-screen icon text-xs"></div>
        </button>
        <button 
          @click="$emit('clear')"
          class="w-7 h-7 rounded-xl bg-gray-200/40 dark:bg-zinc-800/40 hover:bg-red-500/10 dark:hover:bg-red-500/20 flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-all active:scale-90 border-none"
          title="清空对话"
        >
          <div class="i-carbon-trash-can icon text-xs"></div>
        </button>
      </div>
    </div>
    <div 
      ref="scrollContainer"
      class="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 scrollbar-hide relative"
    >
      <!-- Empty State -->
      <div 
        v-if="groupedMessages.length === 0" 
        class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-700"
      >
        <div class="w-16 h-16 mb-6 rounded-3xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center border border-violet-500/10">
          <div class="i-carbon-chat-bot text-3xl text-violet-500/40"></div>
        </div>
        <h3 class="text-sm font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2">暂无对话</h3>
        <p class="text-[11px] text-gray-400/60 dark:text-zinc-500/60 leading-relaxed max-w-[160px]">
          点击或按住麦克风<br/>开启您的艺术创作之旅
        </p>
      </div>

      <template v-for="(group, gIdx) in groupedMessages" :key="gIdx">
        <!-- Archived Group (Divider style) -->
        <div v-if="group.type === 'archived' && group.name" class="space-y-4">
          <div class="flex items-center gap-4 py-2">
            <div class="flex-1 h-[1px] bg-gray-100/50 dark:bg-zinc-800/50"></div>
            <button 
              @click="toggleGroup(group.name)"
              class="flex items-center gap-2 px-1 py-1 hover:opacity-80 transition-all group"
            >
              <div class="i-carbon-archive text-[10px] text-gray-300 dark:text-zinc-600 group-hover:text-violet-500 transition-colors"></div>
              <span class="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{{ group.name }}</span>
              <div 
                class="i-carbon-chevron-down text-[10px] text-gray-300 dark:text-zinc-600 transition-transform duration-300"
                :class="{ 'rotate-180': expandedGroups.has(group.name) }"
              ></div>
            </button>
            <div class="flex-1 h-[1px] bg-gray-100/50 dark:bg-zinc-800/50"></div>
          </div>
          
          <div 
            v-if="expandedGroups.has(group.name)"
            class="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div 
              v-for="msg in group.messages" 
              :key="msg.id"
              class="flex flex-col gap-2"
              :class="msg.role === 'user' ? 'items-end' : 'items-start'"
            >
              <!-- User/AI Badge -->
              <div class="flex items-center gap-2 mb-1 px-1 opacity-40">
                <span 
                  class="text-[9px] font-black uppercase tracking-tighter"
                  :class="msg.role === 'user' ? 'text-violet-500' : 'text-gray-400'"
                >
                  {{ msg.role === 'user' ? 'You' : 'VoicePaint' }}
                </span>
              </div>
              <!-- Standard Message Bubble (No opacity desaturation) -->
              <div 
                class="markdown-content max-w-[90%] px-3.5 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed break-words text-left"
                :class="msg.role === 'user' 
                  ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-tr-sm' 
                  : 'bg-gray-50/30 dark:bg-zinc-900/30 text-gray-500 dark:text-zinc-400 rounded-tl-sm border border-gray-100/50 dark:border-zinc-800/50'"
                v-html="renderMarkdown(msg.content)"
              >
              </div>
            </div>
          </div>
        </div>

        <!-- Active Chat Content -->
        <div v-else ref="activeGroupRef" class="space-y-6 pt-2">
          <div 
            v-for="(msg, mIdx) in group.messages" 
            :key="msg.id"
            :ref="mIdx === group.messages.length - 1 ? setLastMessageRef : undefined"
            class="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
            :class="msg.role === 'user' ? 'items-end' : 'items-start'"
          >
            <!-- User/AI Badge -->
            <div class="flex items-center gap-2 mb-1 px-1">
              <span 
                class="text-[9px] font-black uppercase tracking-tighter"
                :class="msg.role === 'user' ? 'text-violet-500' : 'text-gray-400'"
              >
                {{ msg.role === 'user' ? 'You' : 'VoicePaint' }}
              </span>
              <span v-if="msg.responseTime" class="text-[9px] text-gray-300 font-mono">
                {{ (msg.responseTime / 1000).toFixed(2) }}s
              </span>
            </div>

            <!-- Message Bubble -->
            <div 
              class="markdown-content max-w-[90%] px-3.5 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed break-words text-left transition-all"
              :class="msg.role === 'user' 
                ? 'bg-[var(--vp-primary)] text-white rounded-tr-sm shadow-md shadow-violet-500/10' 
                : 'bg-gray-50/30 dark:bg-zinc-800/30 text-gray-700 dark:text-zinc-200 rounded-tl-sm shadow-sm border border-gray-100/50 dark:border-zinc-700/50'"
            >
              <div v-html="renderMarkdown(msg.content)"></div>
              
              <!-- Completeness Progress Bar -->
              <div v-if="msg.completeness !== undefined && msg.completeness > 0" class="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[9px] font-black uppercase tracking-widest opacity-50">创意收集度</span>
                  <span class="text-[9px] font-mono font-bold text-violet-500">{{ Math.round(msg.completeness * 100) }}%</span>
                </div>
                <div class="w-full h-1 bg-gray-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000 ease-out"
                    :style="{ width: `${msg.completeness * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Guided Options -->
            <div 
              v-if="msg.options && msg.options.length > 0" 
              class="flex flex-wrap gap-2 mt-3 w-full"
              :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <button 
                v-for="opt in msg.options" 
                :key="opt"
                @click="handleSelectOption(opt)"
                class="px-3 py-1.5 rounded-xl bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[11px] font-black hover:bg-violet-500 hover:text-white transition-all active:scale-90"
              >
                {{ opt }}
              </button>
              <button 
                @click="handleSelectOption('直接出图')"
                class="px-3 py-1.5 rounded-xl bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-[11px] font-black hover:bg-green-500 hover:text-white transition-all active:scale-90 flex items-center gap-1"
              >
                <div class="i-carbon-flash icon text-[10px]"></div>
                直接出图
              </button>
            </div>

            <!-- View Image Action -->
            <button 
              v-if="msg.type === 'image' && msg.imageUrl"
              @click="handleViewImage(msg.imageUrl)"
              class="mt-2 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/10 dark:border-violet-500/20 text-[11px] font-black text-violet-600 dark:text-violet-400 hover:bg-violet-500 hover:text-white dark:hover:bg-violet-500 transition-all duration-300 group shadow-sm hover:shadow-violet-500/20"
            >
              <div class="i-carbon-image text-sm group-hover:scale-110 transition-transform"></div>
              <span>查看生成的图片</span>
              <div class="i-carbon-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></div>
            </button>
          </div>
        </div>
      </template>

      <!-- AI Status Indicator -->
      <Transition name="fade-status">
        <div 
          v-if="showStatusDelay && drawStore.status !== 'idle' && drawStore.status !== 'error' && drawStore.status !== 'recording' && drawStore.status !== 'done'"
          class="flex flex-col gap-2 items-start"
        >
        <div class="flex items-center gap-2 mb-1 px-1">
          <span class="text-[9px] font-black uppercase tracking-tighter text-gray-400">
            VoicePaint
          </span>
          <div class="flex gap-0.5">
            <div class="w-1 h-1 rounded-full bg-violet-500 animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-1 h-1 rounded-full bg-violet-500 animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-1 h-1 rounded-full bg-violet-500 animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>

        <div class="bg-gray-50/50 dark:bg-zinc-800/30 px-3.5 py-2.5 rounded-2xl rounded-tl-sm border border-dashed border-violet-500/30 flex items-center gap-3">
          <div class="relative flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border border-violet-500/20 animate-ping"></div>
            <div class="relative w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center">
              <div v-if="drawStore.status === 'recognizing'" class="i-carbon-voice-activate text-xs text-violet-500 animate-pulse"></div>
              <div v-else-if="drawStore.status === 'thinking'" class="i-carbon-ai-status-complete text-xs text-violet-500 animate-spin-slow"></div>
              <div v-else-if="drawStore.status === 'generating'" class="i-carbon-paint-brush text-xs text-violet-500 animate-pulse"></div>
            </div>
          </div>
          
          <div class="flex flex-col">
            <span class="text-[11px] font-black text-violet-500 uppercase tracking-widest">
              {{ 
                drawStore.status === 'recognizing' ? '正在识别语音' : 
                drawStore.status === 'thinking' ? '正在分析意图' : 
                drawStore.status === 'generating' ? '正在绘制图像' : '正在响应'
              }}
            </span>
            <span class="text-[9px] text-gray-400 dark:text-zinc-500 font-medium">
              {{ 
                drawStore.status === 'recognizing' ? 'ASR 语音转文字...' : 
                drawStore.status === 'thinking' ? 'DeepSeek-V3 思考中...' : 
                drawStore.status === 'generating' ? 'Seedream 构建画面...' : '请稍候...'
              }}
            </span></div>
           </div>
         </div>
       </Transition>
     </div>
   </div>
 </template><style scoped>
.markdown-content :deep(p) {
  margin: 0;
}
.markdown-content :deep(p:not(:last-child)) {
  margin-bottom: 0.5em;
}
.markdown-content :deep(strong) {
  font-weight: 800;
}
.markdown-content :deep(ul), .markdown-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.25em;
}
.markdown-content :deep(li) {
  margin-bottom: 0.25em;
}

/* AI Status Fade Transition */
.fade-status-enter-active,
.fade-status-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-status-enter-from,
.fade-status-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
