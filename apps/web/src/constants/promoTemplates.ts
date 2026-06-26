/**
 * 项目分发 —— 各平台推广贴模版与 prompt 构造。
 *
 * 「项目」内容类型的分发台把一个 GitHub 仓库的卖点，按各平台调性生成
 * 推广贴，再交给分发矩阵 / SyncBlog 插件发布。各平台的字数、调性、结构
 * 差异集中在这里，prompt 由 `buildProjectPromoPrompt` 统一构造。
 */

export interface RepoIntake {
  /** 项目名 */
  name: string
  /** 仓库地址 */
  url: string
  /** 一句话简介 */
  tagline: string
  /** 主要语言 / 技术栈 */
  stack: string
  /** 卖点 / 亮点（一行一个） */
  highlights: string
  /** README 摘要（可选，粘贴关键段落） */
  readme: string
}

export interface PromoPlatformDef {
  id: string
  title: string
  /** 平台调性与结构指引（喂给模型） */
  guide: string
  /** 字数 / 形态提示（展示给用户 + 进 prompt） */
  shape: string
}

export const PROMO_PLATFORMS: PromoPlatformDef[] = [
  {
    id: `juejin`,
    title: `掘金`,
    guide: `面向开发者社区，技术向但要有钩子。开头点明解决的痛点，中间列亮点 / 技术选型，结尾引导 Star 与试用。可用小标题与代码意象。`,
    shape: `300-600 字，带 3-5 个要点`,
  },
  {
    id: `weibo`,
    title: `微博`,
    guide: `碎片化、口语化、有情绪钩子。一句话讲清楚是什么 + 为谁解决什么，配 2-4 个话题标签，结尾给仓库链接。`,
    shape: `100-140 字 + 话题标签`,
  },
  {
    id: `jike`,
    title: `即刻`,
    guide: `真诚、个人视角，像在分享自己刚做完 / 刚发现的好东西。讲做它的动机和一个最打动人的点，避免硬广。`,
    shape: `80-160 字`,
  },
  {
    id: `x`,
    title: `X`,
    guide: `英文优先，简洁有力的 launch 口吻。Hook 第一行抓住注意力，列 2-3 个 bullet，结尾 CTA + 链接。可写成 thread 首条。`,
    shape: `≤280 字符，英文`,
  },
  {
    id: `hackernews`,
    title: `Show HN`,
    guide: `Hacker News「Show HN」风格，英文，克制不夸张。标题用「Show HN: <name> – <what it does>」，正文讲为什么做、技术取舍、与现有方案的区别，邀请反馈。`,
    shape: `标题 + 1-2 段英文`,
  },
  {
    id: `reddit`,
    title: `Reddit`,
    guide: `英文，社区友好、不像广告。讲清楚背景与动机，诚实说明现状与限制，明确征求反馈，结尾给仓库链接。`,
    shape: `标题 + 正文，英文`,
  },
  {
    id: `producthunt`,
    title: `Product Hunt`,
    guide: `英文 launch 文案：一句 tagline + 一段 description。强调对用户的价值与差异化，语气积极、面向非技术受众也能懂。`,
    shape: `Tagline + 描述，英文`,
  },
]

export function getPromoPlatform(id: string): PromoPlatformDef | undefined {
  return PROMO_PLATFORMS.find(p => p.id === id)
}

/** 把仓库信息拼成一段供模型参考的「项目档案」 */
function buildRepoBrief(repo: RepoIntake): string {
  const lines = [
    `项目名：${repo.name || `（未填写）`}`,
    repo.url ? `仓库地址：${repo.url}` : ``,
    repo.tagline ? `一句话简介：${repo.tagline}` : ``,
    repo.stack ? `技术栈：${repo.stack}` : ``,
    repo.highlights.trim() ? `卖点 / 亮点：\n${repo.highlights.trim()}` : ``,
    repo.readme.trim() ? `README 摘要：\n${repo.readme.trim()}` : ``,
  ]
  return lines.filter(Boolean).join(`\n`)
}

/** 构造某平台推广贴的生成 prompt */
export function buildProjectPromoPrompt(repo: RepoIntake, platform: PromoPlatformDef): string {
  return [
    `你是资深开源项目推广文案。请基于下面的项目档案，为「${platform.title}」平台写一条推广贴。`,
    ``,
    `平台调性要求：${platform.guide}`,
    `篇幅 / 形态：${platform.shape}`,
    ``,
    `项目档案：`,
    buildRepoBrief(repo),
    ``,
    `要求：`,
    `- 只输出可直接发布的正文，不要解释、不要前后缀说明。`,
    `- 如该平台要求英文，则用英文；否则用中文。`,
    `- 不要编造项目档案里没有的功能或数据。`,
    `- 结尾自然带上仓库链接（若已提供）。`,
  ].join(`\n`)
}
