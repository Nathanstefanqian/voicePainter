<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDrawStore } from '@/stores/drawStore'

const drawStore = useDrawStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animFrame: number | null = null
const WAVE_BARS = 40

const emit = defineEmits(['start', 'stop'])

// --- Interaction Logic ---
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

function handleButtonDown(_e: Event) {
  if (drawStore.status === 'recognizing' || drawStore.status === 'thinking' || drawStore.status === 'looking' || drawStore.status === 'generating') return
  
  // On mobile, start recording on touch/down
  if (isMobile.value) {
    emit('start')
  }
}

function handleButtonUp(_e: Event) {
  // On mobile, stop recording on release
  if (isMobile.value) {
    emit('stop')
  }
}

function handleButtonClick() {
  if (drawStore.status === 'recognizing' || drawStore.status === 'thinking' || drawStore.status === 'looking' || drawStore.status === 'generating') return

  // On desktop, toggle recording on click
  if (!isMobile.value) {
    if (drawStore.status === 'recording') {
      emit('stop')
    } else {
      emit('start')
    }
  }
}

const formattedDuration = computed(() => {
  const s = Math.floor((drawStore.duration || 0) / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
})

const progress = computed(() =>
  Math.min(((drawStore.duration || 0) / 30000) * 100, 100)
)

watch(() => drawStore.status, (status) => {
  if (status === 'recording' && canvasRef.value) {
    drawWaveform()
  } else if (animFrame) {
    cancelAnimationFrame(animFrame)
    animFrame = null
    const canvas = canvasRef.value
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }
}, { immediate: true })

function drawWaveform() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const audioData = drawStore.audioData || []
  const W = canvas.width
  const H = canvas.height
  const gap = 2
  const bars = Math.min(audioData.length, WAVE_BARS)
  const barW = (W - gap * (bars - 1)) / bars

  ctx.clearRect(0, 0, W, H)

  for (let i = 0; i < bars; i++) {
    const level = audioData[i] || 0
    // Combine real data with a bit of noise/base height for better look
    const barH = Math.max(2, level * H * 0.8 + Math.random() * 2)
    const x = i * (barW + gap)
    const y = (H - barH) / 2

    const grad = ctx.createLinearGradient(x, y, x, y + barH)
    grad.addColorStop(0, 'rgba(139, 92, 246, 1)')
    grad.addColorStop(1, 'rgba(99, 102, 241, 0.8)')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(x, y, barW, barH, barW / 2)
    ctx.fill()
  }

  animFrame = requestAnimationFrame(drawWaveform)
}
</script>

<template>
  <div class="flex flex-col items-center">
    <!-- The big record button -->
    <div class="relative py-4">
      <!-- Outer pulse rings -->
      <div
        v-if="drawStore.status === 'recording'"
        class="absolute inset-0 rounded-full animate-ping opacity-20"
        style="width: 120px; height: 120px; margin: -12px; background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);"
      ></div>
      <div
        v-if="drawStore.status === 'recording'"
        class="absolute inset-0 rounded-full animate-ping opacity-10"
        style="width: 140px; height: 140px; margin: -22px; animation-delay: 0.4s; background: radial-gradient(circle, #6366f1 0%, transparent 70%);"
      ></div>

      <!-- Glass button -->
      <button
          class="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center transition-all duration-500 group disabled:opacity-40 disabled:cursor-not-allowed border-none outline-none"
          :class="drawStore.status === 'recording'
            ? 'bg-violet-500 shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)] scale-95'
            : 'bg-white/90 dark:bg-zinc-800/90 backdrop-blur-2xl shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] dark:shadow-none hover:shadow-[0_15px_40px_-10px_rgba(139,92,246,0.15)] hover:scale-105 active:scale-95'"
          :disabled="drawStore.status === 'recognizing' || drawStore.status === 'thinking' || drawStore.status === 'looking' || drawStore.status === 'generating'"
          @mousedown="!isMobile && handleButtonDown($event)"
        @mouseup="!isMobile && handleButtonUp($event)"
        @mouseleave="!isMobile && handleButtonUp($event)"
        @touchstart.prevent="isMobile && handleButtonDown($event)"
        @touchend.prevent="isMobile && handleButtonUp($event)"
        @click="handleButtonClick"
      >
        <div>
          <div
            :class="[drawStore.status === 'recording' ? 'i-carbon-stop-filled' : 'i-carbon-microphone-filled', 'icon', 'text-3xl lg:text-4xl', drawStore.status === 'recording' ? 'text-white' : 'text-gray-600 dark:text-gray-300 group-hover:text-violet-500', 'transition-all']"
          ></div>
        </div>

        <!-- Shine effect on idle -->
        <div
          v-if="drawStore.status !== 'recording'"
          class="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        ></div>
      </button>
    </div>

    <!-- Status indicators area (Fixed height to prevent layout shift) -->
    <div class="relative w-full h-[120px] flex flex-col items-center justify-start pt-2 gap-2 overflow-hidden">
      <Transition name="status" mode="out-in">
        <!-- Idle State Hint -->
        <div 
          v-if="drawStore.status === 'idle' && !drawStore.isProcessing" 
          key="idle"
          class="flex flex-col items-center justify-center gap-2 opacity-40 py-4"
        >
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
            <span class="text-[10px] font-black text-gray-500 uppercase tracking-[0.15em]">准备就绪</span>
          </div>
          <p class="text-[10px] font-bold text-gray-400">{{ isMobile ? '长按麦克风开始创作' : '点击麦克风开始创作' }}</p>
        </div>

        <!-- Recording State (Waveform + HUD) -->
        <div v-else-if="drawStore.status === 'recording'" key="recording" class="flex flex-col items-center gap-3 w-full">
          <!-- Recording HUD -->
          <div class="flex flex-col items-center gap-3 w-full px-4">
            <!-- Top: Status & Time (Centered) -->
            <div class="flex flex-col items-center">
              <div class="flex items-center gap-1.5 mb-1">
                <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                <span class="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-[0.2em]">正在倾听</span>
              </div>
              <span class="text-2xl font-mono font-black text-gray-800 dark:text-gray-100 tabular-nums">{{ formattedDuration }}</span>
            </div>

            <!-- Bottom: Real-time Waveform (Centered) -->
            <div class="flex items-end justify-center gap-[3px] h-10 w-full">
              <div
                v-for="(val, i) in drawStore.audioData.slice(0, 24)"
                :key="i"
                class="w-1.5 rounded-full transition-all duration-150"
                :style="{ 
                  height: `${Math.max(4, val * 36)}px`,
                  backgroundColor: (i / 24) * 100 <= progress ? 'var(--vp-primary)' : 'rgba(156, 163, 175, 0.2)'
                }"
              ></div>
            </div>

            <!-- Status text/hint -->
            <p 
              v-if="drawStore.duration > 1500"
              class="text-[10px] font-bold text-gray-400 dark:text-zinc-500 animate-in fade-in slide-in-from-bottom-1 tracking-wide"
            >
              {{ drawStore.fullVoiceMode ? '停止说话或松开以完成' : '再次点击或松开以结束' }}
            </p>
          </div>
        </div>

        <!-- Processing hints -->
        <div v-else-if="drawStore.status === 'recognizing'" key="recognizing" class="flex flex-col items-center py-6">
          <p class="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
            <span class="i-carbon-circle-dash animate-spin text-lg"></span>
            正在识别语音
          </p>
        </div>

        <div v-else-if="drawStore.status === 'thinking'" key="thinking" class="flex flex-col items-center gap-3 py-4">
          <div class="i-svg-spinners-blocks-shuffle-3 icon text-2xl text-violet-500"></div>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI 正在思考...</p>
        </div>

        <div v-else-if="drawStore.status === 'looking'" key="looking" class="flex flex-col items-center gap-3 py-4">
          <div class="i-carbon-view-filled icon text-2xl text-violet-500 animate-pulse"></div>
          <p class="text-[10px] font-black text-violet-500 uppercase tracking-widest animate-pulse">正在看图中...</p>
        </div>

        <div v-else-if="drawStore.status === 'generating'" key="generating" class="flex flex-col items-center gap-3 py-4">
          <div class="i-svg-spinners-90-ring-with-ball icon text-2xl text-violet-500"></div>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">正在绘图中...</p>
        </div>

        <div v-else-if="drawStore.status === 'done'" key="done" class="flex flex-col items-center gap-3 py-4">
          <div class="i-carbon-checkmark-filled icon text-2xl text-green-500"></div>
          <p class="text-[10px] font-black text-green-500 uppercase tracking-widest">处理完成</p>
        </div>

        <div v-else-if="drawStore.status === 'error'" key="error" class="flex flex-col items-center py-6">
          <p 
            class="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
            :class="drawStore.errorMsg === '您没有说话' ? 'text-amber-500' : 'text-red-500'"
          >
            <span :class="drawStore.errorMsg === '您没有说话' ? 'i-carbon-warning-filled' : 'i-carbon-error-filled'" class="text-lg"></span>
            {{ drawStore.errorMsg || '出错了，请重试' }}
          </p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.status-enter-active,
.status-leave-active {
  transition: all 0.3s ease-in-out;
}

.status-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.status-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
