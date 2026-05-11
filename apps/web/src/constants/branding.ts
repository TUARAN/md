/**
 * 产品品牌与定位（用户可见文案集中处）
 */
export const APP_NAME = `博主联盟同步工具`

/** 当前阶段能力重点 */
export const APP_FOCUS = `内容分发与同步`

/** 首屏 / 元信息用短句 */
export const APP_TAGLINE = `全链路内容运营工作流，当前阶段聚焦多平台内容的分发与同步。`

/** 目标流程：从采编到运营的全链路 */
export const APP_WORKFLOW_VISION
  = `从内容爬取、筛选、传输、整理、同步、分发，到社群分发、内容校验，以及评论、浏览、点赞、账号活跃等运营动作，形成可编排的自动化工作流。`

/** 当前版本范围说明 */
export const APP_CURRENT_SCOPE
  = `当前版本以内容整理、Markdown 编辑与渲染、多图床与向公众号等渠道同步为主，为后续全链路能力打基础。`

export const documentTitle = `${APP_NAME} · ${APP_FOCUS}`

/** 启动遮罩主标题 */
export const APP_SPLASH_HEADLINE = `${APP_NAME} · ${APP_FOCUS}`

/** 可选：配置后顶部「数据获取」将新开此地址，而非说明弹窗（Vite：`VITE_DATA_NAV_URL`） */
export function getDataAcquisitionNavUrl(): string {
  const raw = import.meta.env.VITE_DATA_NAV_URL as string | undefined
  return typeof raw === `string` && /^https?:\/\//i.test(raw.trim()) ? raw.trim() : ``
}
