import { ALL_DISTRIBUTION_PLATFORM_COUNT } from '@/constants/distributionPlatforms'

/**
 * 产品品牌与定位（用户可见文案集中处）
 *
 * 品牌层级：
 * - 主品牌 AI分发大师 —— 让 AI 参与你的内容分发，一键将观点、文章、电子书、项目同步至全部平台。
 * - 子模块 Syncblog —— 承载「多平台发布与同步」的能力模块名（含 Syncblog 发布插件）。
 *   仅在插件 / 分发实现层出现，对外主品牌一律用 AI分发大师。
 */
export const APP_NAME = `AI分发大师`

/** 主品牌中文定位（用于较长文案与 SEO） */
export const APP_NAME_CN = `AI 内容分发大师`

/** 分发子模块名（多平台同步能力 + 发布插件） */
export const SYNC_MODULE_NAME = `Syncblog`

/** 当前阶段能力重点 */
export const APP_FOCUS = `让 AI 参与内容分发，一键将观点、文章、电子书、项目同步至 ${ALL_DISTRIBUTION_PLATFORM_COUNT} 平台`

/** 对外主 slogan */
export const APP_SLOGAN = `观点、文章、电子书、项目，一键同步至 ${ALL_DISTRIBUTION_PLATFORM_COUNT} 平台`

/** 顶栏右上角一行品牌文案（含产品名与定位） */
export const APP_HEADER_BRAND_LINE
  = `AI分发大师 · 一键同步至 ${ALL_DISTRIBUTION_PLATFORM_COUNT} 平台`

/** 首屏 / 关于里补充说明 */
export const APP_TAGLINE = `AI分发大师是面向博主与创作团队的 AI 内容分发工具：支持观点、文章、电子书、项目四类内容，从百字短观点到 Markdown 长文，都可改写成适合微博、沸点、微信公众号、知乎、掘金、CSDN 等平台的版本；多平台发布与同步由 Syncblog 模块承担。`

/** 目标流程：从采编到运营的全链路 */
export const APP_WORKFLOW_VISION
  = `从观点提炼、素材爬取、筛选、传输、整理、同步、分发，到社群分发、内容校验，以及评论、浏览、点赞、账号活跃等运营动作，形成可编排的自动化工作流。`

/** 当前版本范围说明 */
export const APP_CURRENT_SCOPE
  = `当前版本以短观点改写、内容整理、Markdown 编辑与渲染、多图床与向公众号等渠道同步为主，为后续全链路能力打基础。工具永久免费；充值仅为大模型 API 算力的成本价中转。`

export const documentTitle = `${APP_NAME} · ${APP_SLOGAN}`

// 启动 splash 由 apps/web/index.html 直接渲染(纯 HTML/CSS,无需等 Vue),
// 不再走 Vue 组件,因此 APP_SPLASH_* 常量已删除。如需改 splash 文案直接编辑
// index.html。

/** 可选：配置后顶部「选择素材」将新开此外链，覆盖默认的 GNews 资讯面板（Vite：`VITE_DATA_NAV_URL`） */
export function getDataAcquisitionNavUrl(): string {
  const raw = import.meta.env.VITE_DATA_NAV_URL as string | undefined
  return typeof raw === `string` && /^https?:\/\//i.test(raw.trim()) ? raw.trim() : ``
}

/**
 * SyncBlog 发布插件下载地址。
 * 集中常量，避免「下载发布插件」按钮、对话框文案各自硬编码。
 * 部署方可用 `VITE_SYNCBLOG_PLUGIN_RELEASE_URL` 指向镜像 / 私有发行。
 *
 * 默认从站点根路径 `/syncblog-plugin.zip` 下载（zip 由 `pnpm package:syncblog-plugin` 构建，
 * 产物在 apps/web/public/ 及 apps/web/dist/，随站点一起部署）。
 */
export function getSyncblogPluginReleaseUrl(): string {
  const raw = import.meta.env.VITE_SYNCBLOG_PLUGIN_RELEASE_URL as string | undefined
  if (typeof raw === `string` && /^https?:\/\//i.test(raw.trim()))
    return raw.trim()
  return `/syncblog-plugin.zip`
}
