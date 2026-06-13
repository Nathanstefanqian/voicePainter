<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick, computed } from 'vue'
import { useDrawStore } from '@/stores/drawStore'
import { deleteImage } from '@/api/draw'
import { useToast } from '@/composables/useToast'
import ConfirmModal from '@/components/ConfirmModal.vue'

const drawStore = useDrawStore()
const { showToast } = useToast()

const emit = defineEmits(['request-start-recording'])

const idleCanvasRef = ref<HTMLCanvasElement | null>(null)
let idleAnimFrame: number | null = null
let mouseX = -1000
let mouseY = -1000

const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

// Colorful palette for idle particles
const PALETTE = [
  '#8b5cf6', '#6366f1', '#a855f7', '#ec4899',
  '#f43f5e', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#a78bfa',
]

interface IdleParticle {
  x: number; y: number
  vx: number; vy: number
  size: number; color: string
  alpha: number; life: number
  maxLife: number
  attracted: boolean
}

const idleParticles: IdleParticle[] = []

function initIdleParticles(w: number, h: number) {
  idleParticles.length = 0
  for (let i = 0; i < 60; i++) {
    idleParticles.push(spawnIdleParticle(Math.random() * w, Math.random() * h, w, h))
  }
}

function spawnIdleParticle(x: number, y: number, _w: number, _h: number): IdleParticle {
  const angle = Math.random() * Math.PI * 2
  const speed = 0.3 + Math.random() * 0.8
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 1.5 + Math.random() * 3,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    alpha: 0.3 + Math.random() * 0.7,
    life: 0,
    maxLife: 120 + Math.random() * 180,
    attracted: false,
  }
}

function drawIdle() {
  const canvas = idleCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  const mx = mouseX
  const my = mouseY

  for (let i = idleParticles.length - 1; i >= 0; i--) {
    const p = idleParticles[i]
    p.life++

    // Attraction toward mouse when close
    const dx = mx - p.x
    const dy = my - p.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const ATTRACT_DIST = 160
    if (dist < ATTRACT_DIST && dist > 0) {
      const force = (ATTRACT_DIST - dist) / ATTRACT_DIST
      p.vx += (dx / dist) * force * 0.3
      p.vy += (dy / dist) * force * 0.3
      p.attracted = true
    } else {
      p.attracted = false
    }

    // Gentle velocity damping
    p.vx *= 0.96
    p.vy *= 0.96

    // Keep moving
    const baseAngle = Math.random() * 0.15 - 0.075
    p.vx += baseAngle
    p.vy += Math.sin(p.life * 0.02) * 0.01

    p.x += p.vx
    p.y += p.vy

    // Fade in/out by life
    const fadeIn = Math.min(p.life / 40, 1)
    const fadeOut = Math.max(0, 1 - (p.life - p.maxLife * 0.6) / (p.maxLife * 0.4))
    const opacity = fadeIn * fadeOut * p.alpha

    // Draw glow halo
    ctx.shadowBlur = p.attracted ? 18 : 10
    ctx.shadowColor = p.color

    ctx.globalAlpha = opacity
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()

    // Extra bright core
    ctx.globalAlpha = opacity * 0.6
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2)
    ctx.fill()

    // Respawn when too old or out of bounds
    if (p.life > p.maxLife || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
      idleParticles.splice(i, 1)
      idleParticles.push(spawnIdleParticle(Math.random() * w, Math.random() * h, w, h))
    }
  }

  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
  idleAnimFrame = requestAnimationFrame(drawIdle)
}

function onMouseMove(e: MouseEvent) {
  const canvas = idleCanvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  mouseX = (e.clientX - rect.left) * dpr
  mouseY = (e.clientY - rect.top) * dpr
}

function onMouseLeave() {
  mouseX = -1000
  mouseY = -1000
}

function startIdleParticles() {
  const canvas = idleCanvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  initIdleParticles(canvas.width, canvas.height)
  drawIdle()
}

const currentImageRecord = computed(() =>
  drawStore.imageHistory.find(img => img.imageUrl === drawStore.currentImage)
)

const loadingCanvasRef = ref<HTMLCanvasElement | null>(null)
const loadingProgress = ref(0)
let loadingAnimFrame: number | null = null
let progressInterval: number | null = null

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  maxLife: number
}

const particles: Particle[] = []

function initParticles(w: number, h: number) {
  particles.length = 0
  for (let i = 0; i < 150; i++) {
    createParticle(w, h, true)
  }
}

function createParticle(w: number, h: number, isInitial = false) {
  const angle = Math.random() * Math.PI * 2
  const speed = 0.2 + Math.random() * 1.2
  const maxLife = 100 + Math.random() * 100
  particles.push({
    x: isInitial ? Math.random() * w : w / 2,
    y: isInitial ? Math.random() * h : h / 2,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 0.5 + Math.random() * 2.5,
    color: Math.random() > 0.5 ? '#8b5cf6' : '#6366f1',
    life: isInitial ? Math.random() * maxLife : maxLife,
    maxLife
  })
}

function drawLoading() {
  const canvas = loadingCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height

  ctx.clearRect(0, 0, w, h)
  
  // Create a subtle glow in center
  const glow = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 100)
  glow.addColorStop(0, 'rgba(139, 92, 246, 0.1)')
  glow.addColorStop(1, 'rgba(139, 92, 246, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.life--

    if (p.life <= 0) {
      particles.splice(i, 1)
      createParticle(w, h)
      continue
    }

    const opacity = p.life / p.maxLife
    ctx.shadowBlur = 15
    ctx.shadowColor = p.color
    
    // Draw particle
    ctx.fillStyle = p.color
    ctx.globalAlpha = opacity
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0

  loadingAnimFrame = requestAnimationFrame(drawLoading)
}

function startProgress() {
  loadingProgress.value = 0
  if (progressInterval) clearInterval(progressInterval)
  
  progressInterval = window.setInterval(() => {
    if (loadingProgress.value < 99) {
      // Starts fast, then slows down
      const increment = loadingProgress.value < 60 
        ? Math.random() * 5 + 2 
        : loadingProgress.value < 90
          ? Math.random() * 1.5 + 0.5
          : Math.random() * 0.3 + 0.1
      
      loadingProgress.value = Math.min(99, loadingProgress.value + increment)
    }
  }, 200)
}

watch(() => drawStore.status, async (status) => {
  if (status === 'generating' || status === 'thinking') {
    startProgress()
    await nextTick()
    const canvas = loadingCanvasRef.value
    if (canvas) {
      // Set canvas internal resolution to match display size for crisp rendering
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      initParticles(canvas.width, canvas.height)
      drawLoading()
    }
  } else {
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
    if (loadingAnimFrame) {
      cancelAnimationFrame(loadingAnimFrame)
      loadingAnimFrame = null
    }
  }
})

// Idle particles: show when no image and not generating
watch(
  [() => drawStore.currentImage, () => drawStore.status],
  async ([img, status]) => {
    // 只有在生成中（generating）才停止粒子，录音和思考时保持背景粒子运行
    const shouldShow = !img && status !== 'generating'
    if (shouldShow) {
      await nextTick()
      startIdleParticles()
    } else {
      if (idleAnimFrame) {
        cancelAnimationFrame(idleAnimFrame)
        idleAnimFrame = null
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (loadingAnimFrame) cancelAnimationFrame(loadingAnimFrame)
  if (progressInterval) clearInterval(progressInterval)
  if (idleAnimFrame) cancelAnimationFrame(idleAnimFrame)
})

function saveImage() {
  if (!drawStore.currentImage) return
  const link = document.createElement('a')
  link.href = drawStore.currentImage
  link.download = `voicepaint-${Date.now()}.jpg`
  link.click()
}

async function handleDelete() {
  if (!drawStore.currentImage) return
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  const record = currentImageRecord.value
  if (!record) return
  
  isDeleting.value = true
  try {
    await deleteImage(record.imageId)
    drawStore.setCurrentImage(null)
    drawStore.removeFromHistory(record.imageId)
    showToast('图片已删除', 'success')
  } catch (err: any) {
    showToast(err.response?.data?.message || '删除失败', 'error')
  } finally {
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col">

    <!-- Header -->
    <div class="flex items-center justify-between mb-3 lg:mb-4 px-1 gap-2">
      <div class="flex items-center gap-1.5 lg:gap-2 flex-shrink-0">
        <div class="w-1 h-3.5 lg:w-1 lg:h-4 rounded-full bg-gradient-to-b from-[var(--vp-primary)] to-[var(--vp-primary-soft)]"></div>
        <h3 class="text-xs lg:text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-baseline gap-1">
          Canvas
          <span v-if="drawStore.currentImage" class="text-[9px] lg:text-xs font-mono opacity-50">{{ drawStore.imageHistory.length }}</span>
        </h3>
      </div>
      
      <div class="flex items-center gap-1 lg:gap-2 min-w-0">
        <!-- Back to canvas button -->
        <button
          v-if="drawStore.currentImage && drawStore.status !== 'generating'"
          @click="drawStore.setCurrentImage(null)"
          class="flex items-center gap-1 px-2 py-1.5 lg:px-3 lg:py-2 rounded-xl text-[10px] lg:text-xs font-bold transition-all duration-300 border-none outline-none bg-[var(--vp-primary-glow)] text-[var(--vp-primary)] hover:bg-[var(--vp-primary)] hover:text-white active:scale-90 flex-shrink-0"
        >
          <div class="i-carbon-paint-brush icon text-xs lg:text-sm"></div>
          <span class="whitespace-nowrap">返回</span>
        </button>

        <button
          v-if="drawStore.currentImage"
          @click="handleDelete"
          class="flex items-center gap-1 px-2 py-1.5 lg:px-3 lg:py-2 rounded-xl text-[10px] lg:text-xs font-bold transition-all duration-300 border-none outline-none bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white active:scale-90 flex-shrink-0"
        >
          <div class="i-carbon-trash-can icon text-xs lg:text-sm"></div>
          <span class="whitespace-nowrap">删除</span>
        </button>
        <button
          v-if="drawStore.currentImage"
          @click="saveImage"
          class="flex items-center gap-1 px-2 py-1.5 lg:px-4 lg:py-2 rounded-xl text-[10px] lg:text-xs font-bold transition-all duration-300 border-none outline-none flex-shrink-0"
          :class="[
            'bg-gray-100/50 dark:bg-zinc-800/50 backdrop-blur-xl shadow-sm',
            'text-gray-500 dark:text-zinc-400',
            'hover:bg-white dark:hover:bg-zinc-800 hover:text-violet-600 dark:hover:text-violet-400',
            'active:scale-90'
          ]"
        >
          <div class="i-carbon-download icon text-xs lg:text-sm"></div>
          <span class="whitespace-nowrap">保存</span>
        </button>
      </div>
    </div>

    <!-- Canvas area -->
    <div
      class="flex-1 relative rounded-3xl overflow-hidden transition-all duration-700 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-none min-h-0 group/canvas"
      :class="[
        drawStore.currentImage
          ? 'bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl'
          : 'bg-white/20 dark:bg-zinc-900/20 backdrop-blur-2xl ring-1 ring-white/30 dark:ring-white/5 cursor-pointer'
      ]"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
      @click="(!drawStore.currentImage || drawStore.status === 'recording') && drawStore.status !== 'generating' && emit('request-start-recording')"
    >
      <img
        v-if="drawStore.currentImage"
        :src="drawStore.currentImage"
        alt="Generated image"
        class="absolute inset-0 w-full h-full object-contain p-2 lg:p-3 transition-all duration-500"
        :class="[
          (
            drawStore.status === 'generating' || 
            (!drawStore.fullVoiceMode && (drawStore.status === 'recording' || drawStore.status === 'thinking' || drawStore.status === 'recognizing'))
          ) 
            ? 'opacity-40 blur-md scale-95' 
            : 'opacity-100 blur-0 scale-100'
        ]"
      />

      <!-- Recording Overlay -->
      <Transition name="fade">
        <div 
          v-if="drawStore.status === 'recording' && !(drawStore.fullVoiceMode && drawStore.currentImage)" 
          class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/10 dark:bg-white/5 backdrop-blur-sm pointer-events-none"
        >
          <div class="relative w-48 h-48 flex items-center justify-center">
            <!-- Dynamic ripple waves -->
            <div class="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping-slow"></div>
            <div class="absolute inset-8 rounded-full border-2 border-violet-500/30 animate-ping-slow" style="animation-delay: 0.5s"></div>
            <div class="absolute inset-16 rounded-full border-2 border-violet-500/40 animate-ping-slow" style="animation-delay: 1s"></div>
            
            <!-- Central recording orb -->
            <div class="relative w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl shadow-violet-500/50 flex items-center justify-center">
              <div class="i-carbon-microphone text-3xl text-white animate-pulse"></div>
            </div>
          </div>
          
          <div class="mt-8 flex flex-col items-center gap-2">
            <span class="text-xl font-black text-violet-500 uppercase tracking-[0.3em] animate-pulse">正在聆听</span>
            <div class="flex gap-1.5">
              <div v-for="i in 5" :key="i" 
                class="w-1 bg-violet-500/60 rounded-full animate-voice-bar"
                :style="{ 
                  height: `${12 + Math.random() * 24}px`,
                  animationDelay: `${i * 0.1}s`
                }"
              ></div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Idle particle canvas -->
      <canvas
        ref="idleCanvasRef"
        class="absolute inset-0 w-full h-full pointer-events-none"
        :class="{ 'opacity-0': !!drawStore.currentImage || drawStore.status === 'generating' }"
        style="transition: opacity 0.5s;"
      ></canvas>

      <!-- Thinking/Recognizing Overlay -->
      <Transition name="fade">
        <div 
          v-if="(drawStore.status === 'thinking' || drawStore.status === 'recognizing') && !(drawStore.fullVoiceMode && drawStore.currentImage)" 
          class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/10 dark:bg-white/5 backdrop-blur-md pointer-events-none"
        >
          <div class="relative w-32 h-32 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-spin-slow"></div>
            <div class="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
              <div class="i-carbon-ai-status-complete text-3xl text-violet-500 animate-pulse"></div>
            </div>
          </div>
          <div class="mt-4 flex flex-col items-center gap-1">
            <span class="text-xs font-black text-violet-500 uppercase tracking-[0.3em]">正在分析意图</span>
            <span class="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">DeepSeek-V3 思考中...</span>
          </div>
        </div>
      </Transition>

      <!-- Particle Loading Overlay -->
      <Transition name="fade">
        <div v-if="drawStore.status === 'generating'" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-[2px]">
          <canvas ref="loadingCanvasRef" class="w-full h-full object-cover"></canvas>
          <div class="absolute flex flex-col items-center gap-3 pointer-events-none">
            <div class="relative flex flex-col items-center">
              <div class="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full scale-150"></div>

              <!-- Numeric Progress -->
              <div class="relative mb-1 lg:mb-2 flex items-baseline">
                <span class="text-4xl lg:text-5xl font-black text-[var(--vp-primary)] font-mono tracking-tighter">
                  {{ Math.floor(loadingProgress) }}
                </span>
                <span class="text-lg lg:text-xl font-black text-[var(--vp-primary)] opacity-60 ml-1">%</span>
              </div>

              <p class="relative text-sm lg:text-lg font-black text-[var(--vp-primary)] animate-pulse tracking-[0.2em] lg:tracking-[0.3em] uppercase">AI 正在绘制</p>
            </div>
            <p class="text-[8px] lg:text-[10px] font-black text-gray-400 dark:text-zinc-500 opacity-60 tracking-wider lg:tracking-widest text-center px-4">火山引擎 SEEDREAM 正在构建画面...</p>
          </div>
        </div>
      </Transition>

      <!-- Empty state -->
      <div
        v-if="!drawStore.currentImage && (drawStore.status === 'idle' || drawStore.status === 'error')"
        class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 select-none transition-all duration-500 group-hover/canvas:scale-110"
      >
        <!-- Animated gradient orb -->
        <div class="relative w-28 h-28 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400/30 to-indigo-400/20 blur-2xl animate-pulse"></div>
          <div class="absolute inset-3 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/10 blur-xl animate-pulse" style="animation-delay: 0.5s"></div>
          <div class="relative w-16 h-16 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl shadow-xl shadow-violet-500/10 ring-1 ring-white/50 dark:ring-zinc-700/50 flex items-center justify-center group-hover/canvas:bg-violet-500 group-hover/canvas:shadow-violet-500/30 transition-all duration-500">
            <div class="i-carbon-paint-brush icon text-3xl text-violet-400 dark:text-violet-500 group-hover/canvas:text-white transition-colors duration-500"></div>
          </div>
        </div>

        <div class="text-center space-y-1">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">VoicePaint</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 group-hover/canvas:text-violet-500 group-hover/canvas:opacity-100 transition-all">点击或按住麦克风开始创作</p>
        </div>
      </div>
    </div>

    <!-- Prompt hint -->
    <Transition name="slide-up">
      <div v-if="drawStore.lastMessage" class="mt-3 px-4 py-2.5 rounded-xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/5">
        <p class="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
          <span class="text-violet-500 dark:text-violet-400 font-medium">✨</span> {{ drawStore.lastMessage }}
        </p>
      </div>
    </Transition>

    <!-- Modals -->
    <ConfirmModal
      :show="showDeleteConfirm"
      title="确认删除"
      message="确定要删除当前图片吗？此操作不可撤销。"
      confirm-text="删除"
      confirm-type="danger"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@keyframes ping-slow {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}
.animate-ping-slow {
  animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes voice-bar {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.5); }
}
.animate-voice-bar {
  animation: voice-bar 0.6s ease-in-out infinite;
  transform-origin: bottom;
}
</style>
