import { getCreatorPlatformMatrix } from '@/constants/creators'
import { listDistributionPlatformTypes } from '@/constants/distributionStrategies'
import { normalizePlatformType } from '@/constants/platforms'
import { addPrefix } from '@/utils'
import { store } from '@/utils/storage'

/**
 * 顶栏工作流对应的整页视图（非弹窗）。
 *
 * 2026-05 路由重构后,workflow 步骤由 vue-router 管理,这里保留类型供消费方
 * 描述「目标步骤」。新代码应使用 `router.push({ name })` 进行导航,不再依赖
 * 任何 ui store 内部的 workflowAppPage 状态(已移除)。
 */
export type WorkflowAppPage = `data` | `booklet-research` | `booklet-plan` | `booklet-writing` | `creation` | `import` | `sync` | `distribution` | `stats`

/**
 * UI 状态 Store
 * 负责管理全局 UI 状态，包括深色模式、侧边栏、对话框等
 */
export const useUIStore = defineStore(`ui`, () => {
  // ==================== 全局 UI 状态 ====================
  // 是否开启深色模式
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  // 是否在左侧编辑
  const isEditOnLeft = store.reactive(`isEditOnLeft`, true)
  const toggleEditOnLeft = useToggle(isEditOnLeft)

  // 是否开启 AI 工具箱
  const showAIToolbox = store.reactive(`showAIToolbox`, true)
  const toggleAIToolbox = useToggle(showAIToolbox)

  // 是否已经显示过 AI 工具箱选中文本提示
  const hasShownAIToolboxHint = store.reactive(`hasShownAIToolboxHint`, false)

  // 是否打开右侧滑块
  const isOpenRightSlider = store.reactive(addPrefix(`is_open_right_slider`), false)

  // 是否打开文章列表滑块
  const isOpenPostSlider = store.reactive(addPrefix(`is_open_post_slider`), false)

  // 是否打开本地文件夹面板
  const isOpenFolderPanel = store.reactive(addPrefix(`is_open_folder_panel`), false)

  /**
   * 编辑器专注模式 —— 一键回到「左 markdown / 右预览」的最简状态。
   * 隐藏 PostSlider、FolderSourcePanel、CssEditor、RightSlider 与 SidebarAIToolbar。
   * 不改变它们各自的 open 状态,退出专注后恢复原样。
   * 仅在 `/edit` 路由生效;workflow 页面不受影响。
   */
  const isFocusMode = store.reactive(addPrefix(`is_focus_mode`), false)
  const toggleFocusMode = useToggle(isFocusMode)

  // 是否为移动端
  const isMobile = store.reactive(`isMobile`, false)

  // 视图模式：edit（纯编辑）| split（双屏）| preview（纯预览）
  const viewMode = store.reactive<'edit' | 'split' | 'preview'>(`viewMode`, `split`)

  function setViewMode(mode: 'edit' | 'split' | 'preview') {
    viewMode.value = mode
  }

  // 预览设备：desktop（电脑端、更宽）| mobile（移动端模拟 375px）
  const previewDevice = store.reactive<'desktop' | 'mobile'>(`previewDevice`, `desktop`)

  function setPreviewDevice(device: 'desktop' | 'mobile') {
    previewDevice.value = device
  }

  function togglePreviewDevice() {
    previewDevice.value = previewDevice.value === `desktop` ? `mobile` : `desktop`
  }

  // 是否启用图片转存（默认关闭）
  const enableImageReupload = store.reactive(addPrefix(`enableImageReupload`), false)
  const toggleImageReupload = useToggle(enableImageReupload)

  // 是否开启同步滚动（编辑器与预览区联动）
  const enableScrollSync = store.reactive(addPrefix(`enableScrollSync`), false)
  const toggleScrollSync = useToggle(enableScrollSync)

  // ==================== 对话框状态 ====================
  // 是否展示 CSS 编辑器
  const isShowCssEditor = store.reactive(`isShowCssEditor`, false)
  const toggleShowCssEditor = useToggle(isShowCssEditor)

  /**
   * 右侧栏互斥(Phase 3.4):RightSlider(样式面板)与 CssEditor 都竞争同一块
   * 右侧空间。同时显示两个会把编辑区挤窄到难以阅读,所以打开任一个时自动关
   * 闭另一个,行为像 tab 切换。
   *
   * 用 watch 实现而不是封装一层 `activeRightPanel` setter,可以让所有现存
   * 31 处对 `isOpenRightSlider` / `isShowCssEditor` 的直接读写自动获得互
   * 斥行为,无需在每个调用点改代码。
   */
  watch(isOpenRightSlider, (open) => {
    if (open && isShowCssEditor.value)
      isShowCssEditor.value = false
  })
  watch(isShowCssEditor, (open) => {
    if (open && isOpenRightSlider.value)
      isOpenRightSlider.value = false
  })

  // 是否展示插入表格对话框
  const isShowInsertFormDialog = ref(false)
  const toggleShowInsertFormDialog = useToggle(isShowInsertFormDialog)

  // 是否展示插入公众号名片对话框
  const isShowInsertMpCardDialog = ref(false)
  const toggleShowInsertMpCardDialog = useToggle(isShowInsertMpCardDialog)

  // 是否展示上传图片对话框
  const isShowUploadImgDialog = ref(false)
  const toggleShowUploadImgDialog = useToggle(isShowUploadImgDialog)

  // 是否展示导入 Markdown 对话框
  const isShowImportMdDialog = ref(false)
  const toggleShowImportMdDialog = useToggle(isShowImportMdDialog)
  /** 通过 URL 参数 open 打开时传入的待导入链接，对话框打开后会据此自动执行导入 */
  const importMdOpenUrl = ref<string | null>(null)

  // 是否展示模板管理对话框
  const isShowTemplateDialog = ref(false)
  const toggleShowTemplateDialog = useToggle(isShowTemplateDialog)

  // AI 对话框
  const aiDialogVisible = ref(false)
  const aiImageDialogVisible = ref(false)

  function toggleAIDialog(value?: boolean) {
    aiDialogVisible.value = value ?? !aiDialogVisible.value
  }

  function toggleAIImageDialog(value?: boolean) {
    aiImageDialogVisible.value = value ?? !aiImageDialogVisible.value
  }

  /**
   * 工作流当前创作者（平台矩阵、数据策略共用）。
   * 默认空串：未登录或 creatorProfile 尚未加载时不渲染任何具体创作者的数据，
   * 避免短暂泄漏站长（tuaran）的快照给其他用户。登录后由 creatorProfile.applyProfile 主动写入。
   */
  const workflowCreatorId = store.reactive(`workflow_creator_id`, ``)

  /** 数据策略当前选中的平台 type（canonical key，详见 constants/platforms.ts） */
  const workflowDistributionPlatform = store.reactive(`workflow_distribution_platform`, `csdn`)
  // 收敛历史持久化值（如旧的 `twitter` → `x`）
  workflowDistributionPlatform.value = normalizePlatformType(workflowDistributionPlatform.value)

  /** 平台矩阵「数据从哪来？」：首次默认展开，折叠后写入 localStorage 保持收起 */
  const workflowMatrixDataSourceExpanded = store.reactive(`workflow_matrix_data_source_expanded`, true)

  function defaultDistributionPlatformForCreator(creatorId: string) {
    if (!creatorId)
      return `csdn`
    const matrix = getCreatorPlatformMatrix(creatorId).map(r => r.type)
    const ordered = listDistributionPlatformTypes(creatorId, matrix)
    return ordered[0] ?? `csdn`
  }

  function setWorkflowCreatorId(creatorId: string) {
    const id = creatorId.trim().toLowerCase()
    workflowCreatorId.value = id
    workflowDistributionPlatform.value = defaultDistributionPlatformForCreator(id)
  }

  // ⚠️ 不在此处订阅 creatorProfile：旧实现造成 ui ↔ creatorProfile 的双向耦合，
  // 任何一边的 immediate watch 都会在另一边 setup 尚未返回时触发。
  // creatorProfile.applyProfile 现已直接调用 setWorkflowCreatorId 主动驱动 UI。

  function setWorkflowDistributionPlatform(platformType: string) {
    workflowDistributionPlatform.value = normalizePlatformType(platformType) || `csdn`
  }

  /** 打开 AI 助手时注入到输入框的 Markdown（由 GNews 等入口写入，打开后消费清空） */
  const aiAssistantDraftMarkdown = ref<string | null>(null)

  function queueAiAssistantDraftMarkdown(md: string) {
    const t = md.trim()
    aiAssistantDraftMarkdown.value = t || null
  }

  function consumeAiAssistantDraftMarkdown(): string | null {
    const v = aiAssistantDraftMarkdown.value
    aiAssistantDraftMarkdown.value = null
    return v
  }

  /** AI 创作工作台的输入材料（可由选择素材页写入） */
  const creationDraftMarkdown = ref(``)

  function setCreationDraftMarkdown(md: string) {
    creationDraftMarkdown.value = md.trim()
  }

  // 搜索面板状态
  const searchTabRequest = ref<{ word: string, showReplace: boolean } | null>(null)

  function openSearchTab(searchWord: string = '', showReplace: boolean = false) {
    searchTabRequest.value = { word: searchWord, showReplace }
  }

  function clearSearchTabRequest() {
    searchTabRequest.value = null
  }

  // ==================== 工具函数 ====================
  // 处理窗口大小变化
  let splitCollapsedByResize = false

  function handleResize() {
    const wasMobile = isMobile.value
    isMobile.value = window.innerWidth <= 768

    if (!wasMobile && isMobile.value && viewMode.value === `split`) {
      // 从桌面端变为移动端且当前是双屏：切换为编辑模式并记录
      viewMode.value = `edit`
      splitCollapsedByResize = true
    }
    else if (wasMobile && !isMobile.value && splitCollapsedByResize) {
      // 从移动端变回桌面端且是由 resize 触发的折叠：还原为双屏
      viewMode.value = `split`
      splitCollapsedByResize = false
    }
  }

  onMounted(() => {
    handleResize()
    window.addEventListener(`resize`, handleResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener(`resize`, handleResize)
  })

  return {
    // ==================== 全局 UI 状态 ====================
    isDark,
    isEditOnLeft,
    showAIToolbox,
    hasShownAIToolboxHint,
    isOpenRightSlider,
    isOpenPostSlider,
    isMobile,
    viewMode,
    previewDevice,
    isOpenFolderPanel,
    isFocusMode,
    toggleFocusMode,
    enableImageReupload,
    enableScrollSync,

    // ==================== 对话框状态 ====================
    isShowCssEditor,
    toggleShowCssEditor,
    isShowInsertFormDialog,
    toggleShowInsertFormDialog,
    isShowInsertMpCardDialog,
    toggleShowInsertMpCardDialog,
    isShowUploadImgDialog,
    toggleShowUploadImgDialog,
    isShowImportMdDialog,
    toggleShowImportMdDialog,
    importMdOpenUrl,
    isShowTemplateDialog,
    toggleShowTemplateDialog,
    aiDialogVisible,
    toggleAIDialog,
    aiImageDialogVisible,
    toggleAIImageDialog,
    workflowCreatorId,
    workflowDistributionPlatform,
    workflowMatrixDataSourceExpanded,
    setWorkflowCreatorId,
    setWorkflowDistributionPlatform,
    creationDraftMarkdown,
    setCreationDraftMarkdown,
    queueAiAssistantDraftMarkdown,
    consumeAiAssistantDraftMarkdown,

    // ==================== 搜索面板 ====================
    searchTabRequest,
    openSearchTab,
    clearSearchTabRequest,

    // ==================== Actions ====================
    toggleDark,
    toggleEditOnLeft,
    toggleAIToolbox,
    toggleImageReupload,
    toggleScrollSync,
    setViewMode,
    setPreviewDevice,
    togglePreviewDevice,
  }
})
