import { useDrawStore } from '@/stores/drawStore'

export function useAudio() {
  const drawStore = useDrawStore()

  // 检查是否开启了音效
  const isEnabled = () => {
    return drawStore.enableSound
  }

  const createCtx = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    return new AudioContextClass()
  }

  /**
   * 播放简单的正弦波音效
   */
  const playTone = (freq: number, type: OscillatorType, duration: number, volume: number) => {
    if (!isEnabled()) return

    const ctx = createCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)

    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  /**
   * 识别成功：清脆的叮当声
   */
  const playSuccess = () => {
    playTone(880, 'sine', 0.2, 0.1)
    setTimeout(() => playTone(1109, 'sine', 0.3, 0.08), 50)
  }

  /**
   * 状态切换/开始处理：柔和的上升音
   */
  const playTransition = () => {
    playTone(440, 'sine', 0.4, 0.05)
    setTimeout(() => playTone(554, 'sine', 0.4, 0.04), 100)
  }

  /**
   * 录音停止：短促的结束音
   */
  const playStop = () => {
    playTone(330, 'sine', 0.1, 0.05)
  }

  /**
   * 绘图完成：华丽的完成音
   */
  const playComplete = () => {
    playTone(523, 'sine', 0.5, 0.1)
    setTimeout(() => playTone(659, 'sine', 0.5, 0.08), 100)
    setTimeout(() => playTone(783, 'sine', 0.6, 0.06), 200)
    setTimeout(() => playTone(1046, 'sine', 0.8, 0.04), 300)
  }

  /**
   * 按钮点击：极短的敲击声
   */
  const playClick = () => {
    playTone(600, 'sine', 0.05, 0.05)
  }

  return {
    playSuccess,
    playTransition,
    playStop,
    playComplete,
    playClick
  }
}
