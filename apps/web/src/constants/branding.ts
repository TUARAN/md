/**
 * 产品品牌与定位（用户可见文案集中处）
 */
export const APP_NAME = `博主联盟同步工具`

/** 当前阶段能力重点 */
export const APP_FOCUS = `内容分发与同步`

/** 对外主 slogan（一文多发、多平台同步） */
export const APP_SLOGAN = `一文多发，半小时完成30+平台同步`

/** 首屏 / 关于里补充说明 */
export const APP_TAGLINE = `全链路内容运营工作流，当前阶段聚焦多平台内容的分发与同步。`

/** 目标流程：从采编到运营的全链路 */
export const APP_WORKFLOW_VISION
  = `从内容爬取、筛选、传输、整理、同步、分发，到社群分发、内容校验，以及评论、浏览、点赞、账号活跃等运营动作，形成可编排的自动化工作流。`

/** 当前版本范围说明 */
export const APP_CURRENT_SCOPE
  = `当前版本以内容整理、Markdown 编辑与渲染、多图床与向公众号等渠道同步为主，为后续全链路能力打基础。`

export const documentTitle = `${APP_NAME} — ${APP_SLOGAN}`

/** 启动遮罩：产品名 */
export const APP_SPLASH_TITLE = APP_NAME

/** 启动遮罩：slogan */
export const APP_SPLASH_SLOGAN = APP_SLOGAN

/** 可选：配置后顶部「数据获取」将新开此地址，而非说明弹窗（Vite：`VITE_DATA_NAV_URL`） */
export function getDataAcquisitionNavUrl(): string {
  const raw = import.meta.env.VITE_DATA_NAV_URL as string | undefined
  return typeof raw === `string` && /^https?:\/\//i.test(raw.trim()) ? raw.trim() : ``
}
