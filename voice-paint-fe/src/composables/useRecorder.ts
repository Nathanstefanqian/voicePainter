import { ref, onUnmounted } from 'vue'
import { useDrawStore } from '@/stores/drawStore'

export function useRecorder() {
  const isRecording = ref(false)
  const isSpeaking = ref(false)
  const audioLevel = ref(0)
  const duration = ref(0)
  const drawStore = useDrawStore()

  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []
  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let animationFrame: number | null = null

  // VAD settings
  let silenceStart: number | null = null
  const SILENCE_THRESHOLD = 0.05 // Adjust based on environment
  const SILENCE_DURATION = 1200 // 1.2s of silence to trigger stop

  const MAX_DURATION = 30_000

  async function startRecording(options?: { onSilence?: () => void }) {
    if (isRecording.value) return // Prevent multiple starts

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
    } catch (err) {
      const msg = (err as Error).name === 'NotAllowedError'
        ? '麦克风权限被拒绝，请在浏览器设置中允许使用麦克风'
        : (err as Error).name === 'NotFoundError'
        ? '未检测到麦克风设备，请连接后重试'
        : (err as Error).name === 'NotReadableError'
        ? '麦克风被其他应用占用，请关闭后重试'
        : '无法访问麦克风，请检查浏览器权限设置'
      throw new Error(msg)
    }

    audioContext = new AudioContext()
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    silenceStart = null
    isSpeaking.value = false

    function updateLevel() {
      if (!analyser) return
      analyser.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      const level = avg / 255
      audioLevel.value = level
      drawStore.setAudioLevel(level)

      // VAD Logic
      if (drawStore.fullVoiceMode) {
        if (level > SILENCE_THRESHOLD) {
          isSpeaking.value = true
          silenceStart = null
        } else if (isSpeaking.value) {
          if (silenceStart === null) {
            silenceStart = Date.now()
          } else if (Date.now() - silenceStart > SILENCE_DURATION) {
            // Silence detected for long enough
            if (options?.onSilence) {
              options.onSilence()
            }
          }
        }
      }

      animationFrame = requestAnimationFrame(updateLevel)
    }
    updateLevel()

    const mimeType = MediaRecorder.isTypeSupported('audio/mp4') 
      ? 'audio/mp4' 
      : MediaRecorder.isTypeSupported('audio/mpeg')
        ? 'audio/mpeg'
        : 'audio/webm'
    
    mediaRecorder = new MediaRecorder(stream, { mimeType })
    audioChunks = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data)
    }

    mediaRecorder.start(100)
    isRecording.value = true
    duration.value = 0
    drawStore.setDuration(0)

    if (timer) clearInterval(timer)
    const startTime = Date.now()
    timer = setInterval(() => {
      duration.value = Date.now() - startTime
      drawStore.setDuration(duration.value)
      if (duration.value >= MAX_DURATION) {
        stopRecording()
      }
    }, 100)
  }

  function stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!mediaRecorder) { resolve(null); return; }

      const mimeType = mediaRecorder.mimeType
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: mimeType })
        cleanup()
        resolve(blob)
      }

      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(t => t.stop())
      isRecording.value = false

      if (timer) clearInterval(timer)
      if (animationFrame) cancelAnimationFrame(animationFrame)
    })
  }

  function cleanup() {
    if (audioContext) { audioContext.close(); audioContext = null }
    analyser = null
    audioLevel.value = 0
    drawStore.setAudioLevel(0)
    drawStore.setDuration(0)
  }

  onUnmounted(cleanup)

  return { isRecording, audioLevel, duration, startRecording, stopRecording }
}
