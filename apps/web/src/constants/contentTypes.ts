/**
 * 内容类型注册表 —— 分发优先 IA 的唯一主导航。
 *
 * 「AI分发大师」把产品反转成一个统一分发台：顶栏只切换**内容类型**
 * （观点 / 文章 / 小册 / 项目），每种类型的主视角就是它的「分发台」。
 * 过去的选题 / 创作 / 复盘等步骤降级为「助手」入口（见 `assistSteps`），
 * 不再占据顶栏。
 *
 * - `routeName`：该类型分发台的落地路由名（点内容类型 tab 跳这里）。
 * - `assistSteps`：该类型的上游辅助步骤，仍复用现有 `Workflow*Page`，
 *   只是从顶栏平级步骤降级为按需打开的助手项。
 */
import type { Component } from 'vue'
import { BookOpen, Database, FileText, GitBranch, Github, Lightbulb, MessageCircle, Repeat2, Send, Sparkles, Target, TrendingUp } from 'lucide-vue-next'

export type ContentTypeId = `opinion` | `article` | `booklet` | `project`

export interface AssistStep {
  /** 路由名，与 router/index.ts 中既有的 workflow 步骤一一对应 */
  routeName: string
  label: string
  icon: Component
  /** 一句话说明这个助手能帮你做什么（在助手面板里展示） */
  hint: string
}

export interface ContentTypeDef {
  id: ContentTypeId
  /** 顶栏 tab 文案 */
  label: string
  icon: Component
  /** 分发台落地路由名 */
  routeName: string
  /** 分发台一句话定位（用于空态 / 提示） */
  tagline: string
  /** 上游辅助步骤（降级为助手项） */
  assistSteps: AssistStep[]
}

export const CONTENT_TYPES: ContentTypeDef[] = [
  {
    id: `opinion`,
    label: `观点`,
    icon: MessageCircle,
    routeName: `distribute-compose`,
    tagline: `百字短观点，一键发到微博、沸点、X、即刻、知乎想法等短内容渠道`,
    assistSteps: [
      { routeName: `opinion-idea`, label: `观点提炼`, icon: Lightbulb, hint: `没思路？从热点 / 素材里提炼可发的观点` },
      { routeName: `opinion-rewrite`, label: `短内容改写`, icon: Sparkles, hint: `把长内容改写成适配各短内容平台的版本` },
      { routeName: `opinion-distribution`, label: `平台版本`, icon: Send, hint: `按平台生成微博 / 沸点 / X 等差异化版本` },
      { routeName: `opinion-loop`, label: `互动复盘`, icon: Repeat2, hint: `复盘互动数据，沉淀下一轮选题` },
    ],
  },
  {
    id: `article`,
    label: `文章`,
    icon: FileText,
    routeName: `sync`,
    tagline: `Markdown 长文，一键排版并发布到公众号、知乎、掘金、CSDN 等平台`,
    assistSteps: [
      { routeName: `data`, label: `素材采集`, icon: Database, hint: `采集资讯 / 素材作为创作输入` },
      { routeName: `creation`, label: `用模版创作`, icon: Sparkles, hint: `用 AI 模版起草文章 / 小红书风格稿` },
      { routeName: `distribution`, label: `矩阵运营`, icon: Target, hint: `平台节奏、账号动作与宣发策略` },
      { routeName: `stats`, label: `数据闭环`, icon: TrendingUp, hint: `回收阅读 / 互动，指导下一篇` },
    ],
  },
  {
    id: `booklet`,
    label: `小册`,
    icon: BookOpen,
    routeName: `distribute-booklet`,
    tagline: `成体系的小册，整册发布到长文平台或导出为独立小册站点`,
    assistSteps: [
      { routeName: `booklet-research`, label: `调研选题`, icon: Target, hint: `验证小册选题与目标读者` },
      { routeName: `booklet-plan`, label: `内容策划`, icon: BookOpen, hint: `规划章节大纲与定价` },
      { routeName: `booklet-writing`, label: `章节生产`, icon: Sparkles, hint: `逐章产出与打磨内容` },
      { routeName: `booklet-loop`, label: `数据闭环`, icon: TrendingUp, hint: `复盘销售与读者反馈` },
    ],
  },
  {
    id: `project`,
    label: `项目`,
    icon: Github,
    routeName: `distribute-project`,
    tagline: `GitHub 项目，一键生成各平台推广贴并分发到掘金、微博、即刻、Show HN 等`,
    assistSteps: [
      { routeName: `repo-idea`, label: `项目选题`, icon: GitBranch, hint: `判断项目卖点与目标人群` },
      { routeName: `repo-plan`, label: `规格策划`, icon: Target, hint: `梳理 README / 文档与发布规格` },
      { routeName: `repo-build`, label: `工程搭建`, icon: Send, hint: `搭建工程与发布前检查` },
      { routeName: `repo-loop`, label: `数据闭环`, icon: TrendingUp, hint: `复盘 Star / 流量来源` },
    ],
  },
]

/** 所有分发台落地路由名（内容类型 tab 的目标） */
export const CONTENT_TYPE_ROUTE_NAMES = CONTENT_TYPES.map(t => t.routeName)

/** 路由名 → 所属内容类型（落地路由 + 助手步骤都算进对应类型） */
const ROUTE_TO_CONTENT_TYPE: Record<string, ContentTypeId> = (() => {
  const map: Record<string, ContentTypeId> = {}
  for (const t of CONTENT_TYPES) {
    map[t.routeName] = t.id
    for (const step of t.assistSteps)
      map[step.routeName] = t.id
  }
  // 导入是跨类型的通用入口，归到文章
  map.import = `article`
  // 旧观点分发页（WorkflowOpinionPage 的分发阶段）仍归到观点类型
  map[`opinion-distribution`] = `opinion`
  return map
})()

/** 由当前路由名推导内容类型，找不到回退 `article`（编辑器即文章分发台） */
export function contentTypeOfRoute(routeName: string): ContentTypeId {
  return ROUTE_TO_CONTENT_TYPE[routeName] ?? `article`
}

export function getContentType(id: ContentTypeId): ContentTypeDef {
  return CONTENT_TYPES.find(t => t.id === id) ?? CONTENT_TYPES[1]
}
