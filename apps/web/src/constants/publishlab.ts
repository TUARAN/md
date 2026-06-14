import { edgeAgentDevCourse } from './publishlabEdgeAgentDevCourse'

export { PUBLISH_LAB_RESEARCH_MARKDOWN } from './publishlabResearch'

export interface PublishLabProductTier {
  id: string
  name: string
  price: string
  cycle: string
  format: string
  aiRole: string
  imageRole: string
  goal: string
}

export interface PublishLabPipelineStep {
  id: string
  title: string
  action: string
  output: string
}

export interface PublishLabChannel {
  id: string
  title: string
  platforms: string[]
  strategy: string
}

export interface PublishLabMechanism {
  type: string
  source: string
  platforms: string
  threshold: string
  ceiling: string
}

export interface PublishLabPlatform {
  name: string
  threshold: string
  revenue: string
  case: string
  note: string
}

export interface PublishLabBookletSection {
  slug: string
  title: string
  summary: string
  minutes: number
  markdown: string
}

export interface PublishLabBooklet {
  slug: string
  title: string
  subtitle: string
  badge: string
  suggestedPrice: string
  audience: string[]
  outcomes: string[]
  sections: PublishLabBookletSection[]
}

export const PUBLISH_LAB_BRAND = {
  name: `PublishLab`,
  domain: `publishlab.cc`,
  positioning: `写作变现与内容产品化实验室`,
  summary: `PublishLab 负责从选题、写作、小册生产到商业化路径设计；Syncblog 继续负责多平台分发、同步和复盘。`,
  promise: `把写作从一篇文章推进为可售卖、可复用、可分发的内容产品。`,
}

export const PUBLISH_LAB_PRODUCT_TIERS: PublishLabProductTier[] = [
  {
    id: `lead-magnet`,
    name: `引流款`,
    price: `¥0`,
    cycle: `1 天`,
    format: `免费小册 / PDF`,
    aiRole: `Claude 生成大纲与正文`,
    imageRole: `封面 + 章节插图`,
    goal: `用低门槛内容换关注、私域入口和第一批种子读者。`,
  },
  {
    id: `starter`,
    name: `入门款`,
    price: `¥9.9-29`,
    cycle: `2-3 天`,
    format: `付费小册`,
    aiRole: `结构化教程 + 案例拆解`,
    imageRole: `信息图 / 流程图`,
    goal: `验证读者是否愿意为主题付费，拿到第一笔收入。`,
  },
  {
    id: `core`,
    name: `主力款`,
    price: `¥99-299`,
    cycle: `1-2 周`,
    format: `系列课程`,
    aiRole: `课程脚本 + 讲义`,
    imageRole: `课件配图 + 缩略图`,
    goal: `把一个强需求主题拆成连续交付，提升客单和完课率。`,
  },
  {
    id: `premium`,
    name: `高客单`,
    price: `¥999+`,
    cycle: `持续交付`,
    format: `训练营 / 陪跑`,
    aiRole: `案例库 + 答疑素材`,
    imageRole: `海报 / 复盘长图`,
    goal: `用小册和课程筛选高意向用户，再承接咨询、陪跑和企业服务。`,
  },
]

export const PUBLISH_LAB_PIPELINE: PublishLabPipelineStep[] = [
  {
    id: `topic`,
    title: `选题`,
    action: `先看平台、搜索、竞品和读者问题，不直接开始写。`,
    output: `关键词池、读者画像、可成交标题、痛点假设。`,
  },
  {
    id: `outline`,
    title: `大纲`,
    action: `让 AI 输出三级目录、读者路径、转化钩子和购买理由。`,
    output: `小册目录、章节目标、每节行动结果。`,
  },
  {
    id: `writing`,
    title: `写作`,
    action: `每章固定为场景、原理、步骤、案例、作业，降低读者中途流失。`,
    output: `可发布 Markdown 正文和章节摘要。`,
  },
  {
    id: `visual`,
    title: `配图`,
    action: `为封面、流程、对比和清单生成可传播的视觉资产。`,
    output: `封面、信息图、章节头图、社媒配图。`,
  },
  {
    id: `layout`,
    title: `排版`,
    action: `把 Markdown 转成公众号、掘金、小册、PDF 或知识库格式。`,
    output: `可复制、可导出、可同步的发布稿。`,
  },
  {
    id: `distribution`,
    title: `分发`,
    action: `用 Syncblog 接管多平台发布、账号矩阵、素材复用和数据复盘。`,
    output: `公众号、掘金、知乎、小红书、头条、社群分发任务。`,
  },
]

export const PUBLISH_LAB_CHANNELS: PublishLabChannel[] = [
  {
    id: `direct-sale`,
    title: `直接售卖`,
    platforms: [`小报童`, `知识星球`, `Gumroad`, `掘金小册`],
    strategy: `适合已有信任或垂直专业内容，优先测试 ¥9.9-99 的低门槛产品。`,
  },
  {
    id: `traffic`,
    title: `公域导流`,
    platforms: [`公众号`, `知乎`, `小红书`, `今日头条`, `视频号`],
    strategy: `用免费文章承接搜索和推荐流量，把读者导向小册、社群或私域。`,
  },
  {
    id: `reuse`,
    title: `二次复用`,
    platforms: [`公众号合集`, `短视频切片`, `长图`, `直播提纲`],
    strategy: `一次写作拆成多种内容形态，降低每个平台的边际生产成本。`,
  },
  {
    id: `b2b`,
    title: `B 端授权`,
    platforms: [`企业内训`, `团队知识库`, `课程授权`, `顾问服务`],
    strategy: `把公开内容变成可信样品，再售卖更高客单的交付和授权。`,
  },
]

export const PUBLISH_LAB_FOUR_WEEK_PLAN = [
  { week: `W1`, target: `选一个能卖的主题`, actions: [`整理 20 个读者问题`, `拆 5 个竞品目录`, `写出 10 个成交标题`] },
  { week: `W2`, target: `做出最小付费小册`, actions: [`完成 6-8 节目录`, `写 2 节免费样章`, `生成封面和详情页`] },
  { week: `W3`, target: `启动首轮分发`, actions: [`公众号首发`, `掘金 / 知乎同步`, `小红书拆 3 条图文`, `私域收集反馈`] },
  { week: `W4`, target: `复盘并升级产品`, actions: [`统计阅读到购买转化`, `补齐高频问题`, `决定是否升级课程或训练营`] },
]

export const PUBLISH_LAB_MECHANISMS: PublishLabMechanism[] = [
  { type: `流量分成`, source: `广告主 -> 平台 -> 作者`, platforms: `公众号流量主 / 头条 / 视频号 / 百家号`, threshold: `低`, ceiling: `中` },
  { type: `付费订阅 / 社群`, source: `读者 -> 作者`, platforms: `小报童 / 知识星球`, threshold: `中`, ceiling: `高` },
  { type: `付费课程 / 专栏`, source: `读者 -> 平台分账`, platforms: `得到 / 极客时间 / 知乎盐选 / 掘金小册`, threshold: `高`, ceiling: `高` },
  { type: `软广 / 品牌合作`, source: `品牌方 -> 作者`, platforms: `公众号软文 / 小红书蒲公英`, threshold: `中`, ceiling: `中高` },
  { type: `私域转化`, source: `读者 -> 作者`, platforms: `个人号 / 企微 + 文章导流`, threshold: `高`, ceiling: `极高` },
]

export const PUBLISH_LAB_PLATFORMS: PublishLabPlatform[] = [
  { name: `小报童`, threshold: `无门槛`, revenue: `约 84% 到手`, case: `私域文姐年入 7 位数`, note: `微信生态内，抽成低，适合小册和订阅。` },
  { name: `知识星球`, threshold: `需自带信任`, revenue: `约 95% 到手`, case: `财经 / 投资头部案例千万级`, note: `适合高信任社群和长期服务。` },
  { name: `公众号流量主`, threshold: `100 粉丝起`, revenue: `eCPM 约 0.5-2 元/千`, case: `金融类点击单价更高`, note: `纯流量较难，更适合作为信任入口。` },
  { name: `今日头条`, threshold: `新人易过审`, revenue: `粉丝互动系数高`, case: `1 万粉阅读可到百元级`, note: `适合科普、热点和大众知识内容。` },
  { name: `知乎盐选`, threshold: `投稿审核`, revenue: `实际到手约 45%`, case: `头部故事单篇过万`, note: `适合故事、虚构和强情绪叙事。` },
  { name: `得到 / 极客时间`, threshold: `领域信誉高`, revenue: `作者约 40%-50%`, case: `头部课程数百万`, note: `更适合作为背书，不一定是首选收入来源。` },
  { name: `小红书蒲公英`, threshold: `1000 粉丝起`, revenue: `单条 200-2000+`, case: `品牌种草内容`, note: `图文视觉要求高，纯文字写手需要改造表达。` },
  { name: `视频号`, threshold: `认证即可`, revenue: `视频激励系数更高`, case: `2025-2026 仍有窗口`, note: `适合把长文拆成口播和直播提纲。` },
]

export const PUBLISH_LAB_JUEJIN_BOOKLETS = [
  { title: `Redis 深度历险：核心原理与应用实践`, sales: `19,351`, price: `¥19.9`, revenue: `¥385,085` },
  { title: `前端面试之道`, sales: `7,479`, price: `¥49.9`, revenue: `¥373,202` },
  { title: `MySQL 是怎样运行的：从根儿上理解 MySQL`, sales: `7,396`, price: `¥29.9`, revenue: `¥221,140` },
  { title: `剖析 Vue.js 内部运行机制`, sales: `7,033`, price: `¥19.9`, revenue: `¥139,957` },
  { title: `Netty 入门与实战：仿写微信 IM`, sales: `5,999`, price: `¥29.9`, revenue: `¥179,370` },
]

export const PUBLISH_LAB_CORE_RULES = [
  `单价 x 信任 = 收入。流量主和高客单咨询的差距，本质是信任密度差距。`,
  `头部效应极端化。平台会放大少数头部，普通创作者要靠垂直和复用提高胜率。`,
  `单平台是风险。最稳路径是公域引流、订阅复利、高客单承接、私域沉淀。`,
  `AI 是杠杆不是答案。AI 负责规模和初稿，人工负责判断、案例和差异化。`,
]

export const PUBLISH_LAB_PATHS = [
  {
    title: `零基础`,
    subtitle: `0 粉 0 信誉`,
    target: `6 个月月入 ¥3000-5000`,
    steps: [`头条 / 公众号写垂直科普`, `沉淀 1000 粉`, `开 ¥9.9 体验专栏`],
  },
  {
    title: `已有 1000+ 粉丝`,
    subtitle: `有基础信任`,
    target: `1 年月入 ¥1-3 万`,
    steps: [`开小报童 ¥29-99 入门款`, `公众号软广和蒲公英同步`, `6 个月内升级知识星球`],
  },
  {
    title: `领域 KOL`,
    subtitle: `已有专业背书`,
    target: `年入 ¥100 万+`,
    steps: [`直接做 ¥488-1499 社群`, `课程平台做背书`, `训练营 / 企业内训承接高客单`],
  },
  {
    title: `小说作者`,
    subtitle: `长篇内容生产者`,
    target: `稿费到版权变现`,
    steps: [`番茄 / 七猫验证选题`, `稳定后转起点或晋江`, `完本后谋有声、影视和出版`],
  },
]

export const PUBLISH_LAB_BOOKLETS: PublishLabBooklet[] = [edgeAgentDevCourse]

export function buildPublishLabTierMarkdown(tier: PublishLabProductTier): string {
  return [
    `# ${tier.name}：${tier.format}`,
    ``,
    `价格：${tier.price}`,
    `生产周期：${tier.cycle}`,
    `目标：${tier.goal}`,
    ``,
    `## AI 分工`,
    ``,
    `- 写作：${tier.aiRole}`,
    `- 视觉：${tier.imageRole}`,
    ``,
    `## 推荐生产流程`,
    ``,
    ...PUBLISH_LAB_PIPELINE.map((step, index) => `${index + 1}. **${step.title}**：${step.action}\n   - 输出：${step.output}`),
    ``,
    `## 分发与成交`,
    ``,
    ...PUBLISH_LAB_CHANNELS.map(channel => `- **${channel.title}**（${channel.platforms.join(` / `)}）：${channel.strategy}`),
  ].join(`\n`)
}
