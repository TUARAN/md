/**
 * 产品品牌与定位（用户可见文案集中处）
 */
export const APP_NAME = `Syncblog`

/** 中文副品牌（保留历史延续，用于较长文案与 SEO） */
export const APP_NAME_CN = `博主联盟同步工具`

/** 当前阶段能力重点 */
export const APP_FOCUS = `内容分发与同步`

/** 对外主 slogan（一文多发、多平台同步） */
export const APP_SLOGAN = `一文多发，30分钟完成30+平台同步`

/** 顶栏右上角一行品牌文案（含产品名与定位） */
export const APP_HEADER_BRAND_LINE
  = `Syncblog · 30分钟内，一文分发至30+社媒平台`

/** 首屏 / 关于里补充说明 */
export const APP_TAGLINE = `Syncblog 是面向博主与创作团队的全链路内容运营工作流，当前阶段聚焦多平台内容的分发与同步。`

/** 目标流程：从采编到运营的全链路 */
export const APP_WORKFLOW_VISION
  = `从内容爬取、筛选、传输、整理、同步、分发，到社群分发、内容校验，以及评论、浏览、点赞、账号活跃等运营动作，形成可编排的自动化工作流。`

/** 当前版本范围说明 */
export const APP_CURRENT_SCOPE
  = `当前版本以内容整理、Markdown 编辑与渲染、多图床与向公众号等渠道同步为主，为后续全链路能力打基础。`

export const documentTitle = `${APP_NAME} · ${APP_SLOGAN}`

// 启动 splash 由 apps/web/index.html 直接渲染(纯 HTML/CSS,无需等 Vue),
// 不再走 Vue 组件,因此 APP_SPLASH_* 常量已删除。如需改 splash 文案直接编辑
// index.html。

/** 可选：配置后顶部「选择素材」将新开此外链，覆盖默认的 GNews 资讯面板（Vite：`VITE_DATA_NAV_URL`） */
export function getDataAcquisitionNavUrl(): string {
  const raw = import.meta.env.VITE_DATA_NAV_URL as string | undefined
  return typeof raw === `string` && /^https?:\/\//i.test(raw.trim()) ? raw.trim() : ``
}
