import { PLATFORM_DEFAULT_PROFILE_STATS, PLATFORM_DEFAULT_PROFILE_URLS } from '@/utils/socialAccounts'

export const TUARAN_CREATOR_ID = `tuaran`

export const TUARAN_OFFER = {
  id: TUARAN_CREATOR_ID,
  displayName: `安东尼`,
  pageTitle: `安东尼 · 创作名片`,
  headline: `安东尼`,
  subheadline: `个人 IP 的内容与引流服务说明`,
  tagline: `技术向内容创作 · 多平台分发 · 品牌推文与引流合作`,
  homepage: `https://tuaran.me`,
  contactHint: `合作咨询请通过 tuaran.me 或微信联系（备注：品牌合作）`,

  reachSummary: {
    followers: `约 3.1 万`,
    reads: `约 504 万`,
    platformCount: 14,
    syncCapability: `30+`,
  },

  services: [
    {
      id: `lite`,
      name: `Lite · 同步分发`,
      summary: `你方成稿，我负责排版优化与多平台草稿/发布协助。`,
      deliverables: [`Markdown 排版与主题统一`, `多平台草稿写入（COSE）`, `发布前检查清单`],
      timeline: `约 3–5 个工作日`,
      fit: `已有稿件，只需渠道触达`,
    },
    {
      id: `standard`,
      name: `Standard · 推文包`,
      summary: `从选题到长文，再到各平台标题/摘要改写与分发。`,
      deliverables: [`选题与大纲确认`, `1 篇核心长文`, `3–5 条平台向改写`, `约定平台分发与排期建议`],
      timeline: `约 1–2 周`,
      fit: `新品发布、技术解读、观点稿`,
    },
    {
      id: `growth`,
      name: `Growth · 引流专项`,
      summary: `在推文包基础上，对齐落地页与转化假设，输出节奏与复盘。`,
      deliverables: [`Standard 全部交付物`, `落地页/活动文案协作`, `发布节奏表`, `周期结束数据小结（人工汇总）`],
      timeline: `约 2–4 周`,
      fit: `需要曝光同时关注线索与转化`,
    },
  ],

  funnel: {
    exposureBasis: [
      { label: `粉丝群体`, value: `约 3.1 万`, note: `多平台粉丝快照合计（约）` },
      { label: `分发平台`, value: `14 个`, note: `可协助同步的发声渠道数` },
      { label: `单篇基础曝光`, value: `约 3–15 万`, note: `示意：粉丝触达 + 各渠道自然基数，非历史阅读加总` },
    ],
    ctrRange: `0.05% – 0.3%`,
    leadRateRange: `1% – 5%`,
    closeRateRange: `10% – 30%`,
    disclaimer: `以上为示意模型：曝光基数由粉丝池、分发渠道与单篇基础曝光构成，不等于各平台历史阅读加总；转化依赖你方落地页、产品与追踪配置。`,
  },

  modes: [
    { name: `项目制`, desc: `按篇或按项目报价，范围与交付清单书面确认。` },
    { name: `月度合作`, desc: `固定篇数 + 分发节奏，适合持续发声的技术品牌。` },
    { name: `效果分成（可选）`, desc: `低预付 + 线索/分成，需约定追踪方式与结算规则。` },
  ],

  workflow: [`需求 brief 与受众确认`, `大纲 / 样章确认`, `成稿与排版`, `多平台同步与发布协助`, `数据回收与复盘`],

  brandFit: {
    good: [
      `开发者工具、AI 应用、开源与云产品`,
      `技术大会、白皮书解读、最佳实践`,
      `需要「可信技术表达」的 ToB 品牌`,
      `长文 SEO + 技术社区转载`,
    ],
    caution: [
      `强监管行业需额外合规审稿`,
      `纯 C 端娱乐向、与受众错位的品类`,
      `要求承诺指定阅读量/排名`,
    ],
    bad: [
      `诱导点击、无落地页的纯刷量需求`,
      `与个人 IP 调性严重冲突的争议营销`,
    ],
  },

  dataFootnote: `页面中的「约 3.1 万粉丝 / 约 504 万阅读」来自各平台个人账号快照加总（含 7 个平台「粉丝 100、阅读 2 万」预估占位）；转化漏斗中的曝光示意不等于该阅读合计。`,

  platformMatrix: Object.entries(PLATFORM_DEFAULT_PROFILE_URLS).map(([type, url]) => {
    const stats = PLATFORM_DEFAULT_PROFILE_STATS[type]
    return {
      type,
      url,
      followers: stats?.followers ?? `—`,
      reads: stats?.reads ?? `—`,
    }
  }),
} as const
