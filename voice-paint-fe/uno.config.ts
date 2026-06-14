import { defineConfig } from 'unocss'
import presetUno from '@unocss/preset-uno'
import presetAttributify from '@unocss/preset-attributify'
import presetIcons from '@unocss/preset-icons'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  safelist: [
    'i-carbon-paint-brush',
    'i-carbon-email',
    'i-carbon-password',
    'i-carbon-view',
    'i-carbon-view-off',
    'i-carbon-checkmark-filled',
    'i-carbon-close-filled',
    'i-carbon-warning-filled',
    'i-carbon-information-filled',
    'i-carbon-close',
    'i-svg-spinners-90-ring-with-ball',
    'i-carbon-send-filled',
    'i-carbon-image',
    'i-carbon-trash-can',
    'i-carbon-copy',
    'i-carbon-renew',
    'i-carbon-microphone',
    'i-carbon-microphone-filled',
    'i-carbon-settings',
    'i-carbon-user-avatar',
    'i-carbon-logout',
    'i-carbon-moon',
    'i-carbon-sun',
  ],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer select-none',
    'btn-primary': 'btn bg-primary text-white shadow-lg shadow-violet-500/25 hover:opacity-90 hover:shadow-xl hover:shadow-violet-500/30 disabled:opacity-50',
    'btn-ghost': 'btn bg-transparent dark:bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400',
    'input-base': 'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all',
    'card': 'bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6',
    'scrollbar-thin': '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb:hover]:bg-zinc-600',
    'icon': 'inline-block leading-none align-middle flex-shrink-0',
  },
  theme: {
    colors: {
      primary: '#8b5cf6',
    },
  },
})
