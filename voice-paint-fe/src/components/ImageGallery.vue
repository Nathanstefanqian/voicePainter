<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useDrawStore, type ImageRecord } from '@/stores/drawStore'
import { useToast } from '@/composables/useToast'
import { deleteImage, batchDeleteImages } from '@/api/draw'

const drawStore = useDrawStore()
const { showToast } = useToast()

interface ImageGroup {
  root: ImageRecord
  children: ImageRecord[]
}

const selectedGroup = ref<ImageGroup | null>(null)
const showGroupModal = ref(false)

const showDeleteConfirm = ref(false)
const imageToDelete = ref<string | null>(null)
const selectedImagesForBatch = ref<Set<string>>(new Set())
const isBatchMode = ref(false)

function toggleBatchMode() {
  isBatchMode.value = !isBatchMode.value
  selectedImagesForBatch.value.clear()
}

function toggleImageSelection(group: ImageGroup) {
  const allIds = [group.root.imageId, ...group.children.map(c => c.imageId)]
  const isGroupSelected = allIds.every(id => selectedImagesForBatch.value.has(id))
  
  if (isGroupSelected) {
    allIds.forEach(id => selectedImagesForBatch.value.delete(id))
  } else {
    allIds.forEach(id => selectedImagesForBatch.value.add(id))
  }
}

function confirmDelete(imageId: string) {
  imageToDelete.value = imageId
  showDeleteConfirm.value = true
}

function confirmBatchDelete() {
  if (selectedImagesForBatch.value.size === 0) return
  showDeleteConfirm.value = true
}

async function handleConfirmedDelete() {
  try {
    if (isBatchMode.value && selectedImagesForBatch.value.size > 0) {
      // 批量删除
      const idsToDelete = Array.from(selectedImagesForBatch.value)
      await batchDeleteImages(idsToDelete)
      
      for (const id of idsToDelete) {
        drawStore.removeFromHistory(id)
      }
      showToast(`已删除 ${idsToDelete.length} 张图片`, 'success')
      isBatchMode.value = false
      selectedImagesForBatch.value.clear()
    } else if (imageToDelete.value) {
      // 单个删除
      await deleteImage(imageToDelete.value)
      drawStore.removeFromHistory(imageToDelete.value)
      showToast('图片已删除', 'success')
      if (selectedGroup.value && showGroupModal.value) {
        selectedGroup.value.children = selectedGroup.value.children.filter(
          (child) => child.imageId !== imageToDelete.value
        )
        if (selectedGroup.value.children.length === 0) {
          showGroupModal.value = false
        }
      }
    }
  } catch (error: any) {
    console.error('Delete error:', error)
    showToast('删除失败', 'error')
  } finally {
    showDeleteConfirm.value = false
    imageToDelete.value = null
  }
}

function openGroup(group: ImageGroup) {
  if (group.children.length > 0) {
    selectedGroup.value = group
    showGroupModal.value = true
  } else {
    selectImage(group.root.imageUrl)
  }
}

const groupedHistory = computed(() => {
  const groups: ImageGroup[] = []
  // 从旧到新处理，确保 parentId 引用已经存在的组
  const history = [...drawStore.imageHistory].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const imageToGroupMap = new Map<string, ImageGroup>()

  history.forEach(img => {
    // 只有当存在 parentImageId 且该 parent 确实属于某个已存在的组时，才认为是子图
    const parentGroup = img.parentImageId ? imageToGroupMap.get(img.parentImageId) : null

    if (parentGroup) {
      // 这是一个子节点，加入到父节点所属的组中
      parentGroup.children.push(img)
      // 建立当前图到组的映射，支持多级修改关联到同一个组
      imageToGroupMap.set(img.imageId, parentGroup)
    } else {
      // 这是一个新的根节点
      const group = { root: img, children: [] }
      groups.push(group)
      imageToGroupMap.set(img.imageId, group)
    }
  })

  // 返回时逆序，让最新的组排在最前面
  return groups.reverse().map(group => ({
    ...group,
    // 子图也逆序，让组内最新的修改紧跟在主图后面（如果需要）
    children: [...group.children].reverse()
  }))
})

function selectImage(url: string) {
  drawStore.setCurrentImage(url)
}



function handleImageError(e: Event, img: ImageRecord) {
  const target = e.target as HTMLImageElement
  if (target) {
    target.src = 'https://via.placeholder.com/512x512.png?text=Image+Load+Failed'
    target.classList.add('grayscale', 'opacity-50')
  }
}

function handleImageLoad(e: Event) {
  const target = e.target as HTMLImageElement
  if (target) {
    target.classList.remove('opacity-0')
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-6">
    <div class="flex items-center justify-between px-1">
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] opacity-80">画廊历史</span>
        <span class="text-[10px] font-bold text-violet-500/60 bg-violet-500/5 px-2 py-0.5 rounded-full">{{ drawStore.imageHistory.length }}</span>
      </div>
      
      <div class="flex items-center gap-1.5">
        <!-- Batch Delete Actions -->
        <template v-if="isBatchMode">
          <button 
            @click="confirmBatchDelete"
            :disabled="selectedImagesForBatch.size === 0"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100 shadow-lg shadow-red-500/20 border-none"
          >
            <div class="i-carbon-trash-can icon text-xs"></div>
            <span>删除 ({{ selectedImagesForBatch.size }})</span>
          </button>
          <button 
            @click="toggleBatchMode"
            class="px-2.5 py-1.5 rounded-xl bg-gray-200/50 dark:bg-zinc-800/50 text-gray-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border-none"
          >
            取消
          </button>
        </template>
        
        <!-- Enter Batch Mode -->
        <button 
          v-else
          @click="toggleBatchMode"
          class="w-7 h-7 rounded-xl bg-gray-200/40 dark:bg-zinc-800/40 hover:bg-violet-500/10 dark:hover:bg-violet-500/20 flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-violet-500 dark:hover:text-violet-400 transition-all active:scale-90 border-none"
          title="批量管理"
        >
          <div class="i-carbon-checkbox-checked icon text-xs"></div>
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="drawStore.imageHistory.length === 0" class="flex-1 flex flex-col items-center justify-center gap-3 select-none">
      <div class="w-12 h-12 rounded-xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:ring-white/5 flex items-center justify-center">
        <div class="i-carbon-image icon text-xl text-gray-300 dark:text-zinc-600"></div>
      </div>
      <p class="text-[10px] font-bold text-gray-400 dark:text-gray-600">暂无记录</p>
    </div>

    <!-- Grouped Gallery List -->
    <div v-else class="flex-1 overflow-y-auto lg:overflow-y-auto no-scrollbar lg:pr-1">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-6 lg:gap-10 pb-4">
        <div v-for="group in groupedHistory" :key="group.root.imageId" class="flex flex-col gap-3 w-full flex-shrink-0 relative">
          
          <!-- Fan Stack Container -->
          <div 
            @click="isBatchMode ? toggleImageSelection(group) : openGroup(group)"
            class="relative w-full h-0 pb-[100%] cursor-pointer group/stack"
          >
            <!-- Batch Mode Selection Overlay -->
            <div 
              v-if="isBatchMode" 
              class="absolute inset-0 z-30 rounded-2xl border-2 transition-all bg-black/5 dark:bg-white/5"
              :class="[
                [group.root.imageId, ...group.children.map(c => c.imageId)].every(id => selectedImagesForBatch.has(id))
                  ? 'border-violet-500 bg-violet-500/10' 
                  : 'border-transparent'
              ]"
            >
              <div 
                class="absolute bottom-2 right-2 w-7 h-7 rounded-xl flex items-center justify-center transition-all shadow-lg backdrop-blur-md"
                :class="[
                  [group.root.imageId, ...group.children.map(c => c.imageId)].every(id => selectedImagesForBatch.has(id))
                    ? 'bg-violet-500 text-white scale-110' 
                    : 'bg-black/40 text-white/60 hover:bg-black/60'
                ]"
              >
                <div :class="[[group.root.imageId, ...group.children.map(c => c.imageId)].every(id => selectedImagesForBatch.has(id)) ? 'i-carbon-checkbox-checked-filled' : 'i-carbon-checkbox', 'icon text-base']"></div>
              </div>
            </div>

            <!-- Background cards (The "Fan" effect) -->
            <template v-if="group.children.length > 0">
              <!-- Second card (slightly rotated) -->
              <div 
                class="absolute inset-0 rounded-2xl bg-gray-200 dark:bg-zinc-800 shadow-md transition-all duration-500 origin-bottom-right rotate-3 group-hover/stack:rotate-6 translate-x-1 translate-y-1"
              >
                <img :src="group.children[0].imageUrl" class="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-40 blur-[1px]" />
              </div>
              <!-- Third card (if exists, slightly more rotated) -->
              <div 
                v-if="group.children.length > 1"
                class="absolute inset-0 rounded-2xl bg-gray-300 dark:bg-zinc-700 shadow-sm transition-all duration-500 origin-bottom-right rotate-6 group-hover/stack:rotate-12 translate-x-2 translate-y-2"
              >
                <img :src="group.children[1].imageUrl" class="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-20 blur-[2px]" />
              </div>
            </template>

            <!-- Main (Root) Card -->
            <div 
              class="absolute inset-0 rounded-2xl overflow-hidden transition-all duration-500 ring-1 ring-black/5 dark:ring-white/5 bg-gray-100 dark:bg-zinc-800 z-10"
              :class="[
                drawStore.currentImage === group.root.imageUrl 
                  ? 'shadow-[0_15px_40px_-10px_rgba(139,92,246,0.4)] dark:shadow-[0_15px_40px_-10px_rgba(139,92,246,0.2)] scale-[1.02]' 
                  : 'shadow-xl group-hover/stack:shadow-violet-500/20'
              ]"
            >
              <img 
                :src="group.root.imageUrl" 
                loading="lazy"
                decoding="async"
                class="absolute inset-0 w-full h-full object-cover group-hover/stack:scale-110 transition-transform duration-700 opacity-0"
                @load="handleImageLoad"
                @error="(e) => handleImageError(e, group.root)"
              />
              
              <!-- Badge for multiple versions -->
              <div v-if="group.children.length > 0" class="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-violet-500 text-[8px] font-black text-white shadow-lg z-20 flex items-center gap-1">
                <div class="i-carbon-layers icon text-[10px]"></div>
                {{ group.children.length + 1 }}
              </div>

              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 lg:group-hover/stack:opacity-100 transition-opacity flex flex-col justify-end p-2 lg:p-3">
                <p class="text-[8px] lg:text-[10px] text-white font-bold leading-tight line-clamp-2">{{ group.root.promptCn }}</p>
                <span class="text-[7px] text-violet-300 font-black uppercase tracking-tighter mt-1">
                  {{ group.children.length > 0 ? '点击查看全部版本' : '原始图片' }}
                </span>
              </div>
              
              <!-- Selection Indicator -->
              <div v-if="drawStore.currentImage === group.root.imageUrl" class="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)] z-20"></div>
              
              <!-- Delete button (Only for single images or main group delete) -->
              <button 
                @click.stop="confirmDelete(group.root.imageId)"
                class="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/40 hover:bg-red-500 text-white flex items-center justify-center opacity-0 lg:group-hover/stack:opacity-100 transition-all backdrop-blur-md border-none z-20"
              >
                <div class="i-carbon-trash-can icon text-sm"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Group Detail Modal -->
    <Teleport to="body">
      <div v-if="showGroupModal && selectedGroup" class="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 overflow-hidden">
        <!-- Backdrop -->
        <Transition name="fade-backdrop" appear>
          <div 
            class="absolute inset-0 bg-black/60 backdrop-blur-md" 
            @click="showGroupModal = false"
          ></div>
        </Transition>
        
        <!-- Modal Content -->
        <Transition name="modal-pop" appear>
          <div class="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 lg:p-8 border-b border-gray-100 dark:border-zinc-800">
              <div class="flex flex-col">
                <h3 class="text-xl lg:text-2xl font-black text-gray-900 dark:text-white tracking-tight">图片版本详情</h3>
                <p class="text-xs lg:text-sm text-gray-400 dark:text-zinc-500 font-bold mt-1">共 {{ selectedGroup.children.length + 1 }} 个不同版本</p>
              </div>
              <button 
                @click="showGroupModal = false"
                class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center text-gray-500 dark:text-zinc-400 transition-all active:scale-90 border-none"
              >
                <div class="i-carbon-close icon text-2xl"></div>
              </button>
            </div>

            <!-- Content (Scrollable) -->
            <div class="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Main Image in Modal -->
                <div class="flex flex-col gap-4">
                  <div 
                    @click="selectImage(selectedGroup.root.imageUrl); showGroupModal = false"
                    class="group relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer ring-4 transition-all duration-500"
                    :class="drawStore.currentImage === selectedGroup.root.imageUrl ? 'ring-violet-500 shadow-2xl' : 'ring-transparent hover:ring-violet-500/30'"
                  >
                    <img 
                      :src="selectedGroup.root.imageUrl" 
                      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      @error="(e) => handleImageError(e, selectedGroup!.root)"
                    />
                    <div class="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg">初始版本</div>
                  </div>
                  <div class="px-2">
                    <p class="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{{ selectedGroup.root.promptCn }}</p>
                    <p class="text-[10px] text-gray-400 dark:text-zinc-500 font-medium mt-1 uppercase tracking-wider">{{ new Date(selectedGroup.root.createdAt).toLocaleString() }}</p>
                  </div>
                </div>

                <!-- Children Images in Modal -->
                <div v-for="(child, idx) in selectedGroup.children" :key="child.imageId" class="flex flex-col gap-4">
                  <div 
                    @click="selectImage(child.imageUrl); showGroupModal = false"
                    class="group relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer ring-4 transition-all duration-500"
                    :class="drawStore.currentImage === child.imageUrl ? 'ring-violet-500 shadow-2xl' : 'ring-transparent hover:ring-violet-500/30'"
                  >
                    <img 
                      :src="child.imageUrl" 
                      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      @error="(e) => handleImageError(e, child)"
                    />
                    <div class="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-violet-600/80 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg">修改版本 {{ selectedGroup.children.length - idx }}</div>
                    
                    <button 
                      @click.stop="confirmDelete(child.imageId)"
                      class="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border-none shadow-xl"
                    >
                      <div class="i-carbon-trash-can icon text-lg"></div>
                    </button>
                  </div>
                  <div class="px-2">
                    <p class="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{{ child.promptCn || selectedGroup.root.promptCn }}</p>
                    <p class="text-[10px] text-gray-400 dark:text-zinc-500 font-medium mt-1 uppercase tracking-wider">{{ new Date(child.createdAt).toLocaleString() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="fade-backdrop">
        <div v-if="showDeleteConfirm" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/60 backdrop-blur-md" @click="showDeleteConfirm = false"></div>
          
          <!-- Modal Content -->
          <Transition name="modal-pop" appear>
            <div class="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl p-8 flex flex-col items-center text-center border border-white/10">
              <div class="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                <div class="i-carbon-warning icon text-3xl"></div>
              </div>
              
              <h3 class="text-xl font-black text-gray-900 dark:text-white mb-2">
                {{ isBatchMode ? '确认批量删除？' : '确认删除？' }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-zinc-400 mb-8 leading-relaxed">
                {{ isBatchMode ? `您已选中 ${selectedImagesForBatch.size} 张图片。` : '' }}
                删除后将无法找回，<br/>您确定要继续吗？
              </p>
              
              <div class="flex w-full gap-3">
                <button 
                  @click="showDeleteConfirm = false"
                  class="flex-1 px-6 py-3.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 font-bold text-sm hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all active:scale-95 border-none"
                >
                  取消
                </button>
                <button 
                  @click="handleConfirmedDelete"
                  class="flex-1 px-6 py-3.5 rounded-xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95 border-none"
                >
                  确定删除
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Backdrop transition */
.fade-backdrop-enter-active,
.fade-backdrop-leave-active {
  transition: opacity 0.4s ease-out, backdrop-filter 0.4s ease-out;
}

.fade-backdrop-enter-from,
.fade-backdrop-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

/* Modal pop transition */
.modal-pop-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-pop-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-pop-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.modal-pop-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
