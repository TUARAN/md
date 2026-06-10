/**
 * 公开发布前的产品路线图（roadmap）
 *
 * 这个文件描述的是"下一步要做什么"，与 ChangelogPage 顶部已发布的 timeline
 * 互补。每一项是一个可独立交付的工作包（feature / 合规项 / 工程债），
 * 按里程碑（alpha → beta → ga → post-ga）和优先级（P0~P2）组织。
 *
 * 设计原则：
 * - P0 = 上线前必须闭环的合规/安全/可用性阻断项；不做完产品无法对外开放
 * - P1 = beta 阶段应当完成、否则会显著降低留存/口碑
 * - P2 = GA 之后或长期投入的增长/协作/差异化能力
 *
 * 这里的内容不是承诺，而是"已经被识别为重要、需要排进 backlog"的工作。
 */

export type RoadmapStatus
  = | 'planning' // 仅设计阶段，未动工
    | 'in-progress' // 已经在做
    | 'preview' // 已上线但仅 staff/灰度可见
    | 'blocked' // 等外部依赖（平台政策、第三方接入、备案审批）

export type RoadmapPriority = 'P0' | 'P1' | 'P2'

/**
 * 里程碑（不与版本号绑定，按对外开放范围划分）：
 *  - alpha   = 邀请制内测（当前阶段）
 *  - beta    = 注册即用，但显式标注 Beta
 *  - ga      = 正式 GA，可对外宣传"已发布"
 *  - post-ga = GA 之后的长期演进
 */
export type RoadmapMilestone = 'alpha' | 'beta' | 'ga' | 'post-ga'

/** 面向哪类用户。一个 item 可同时影响多类。 */
export type RoadmapAudience = 'creator' | 'brand' | 'platform-owner'

export type RoadmapCategory
  = | 'compliance' // 合规 / 法务 / 备案
    | 'account-security' // 账号 / 凭据 / 数据安全
    | 'billing' // 付费 / 计费 / 订阅
    | 'observability' // 监控 / SRE / 备份
    | 'content-safety' // 内容审核 / 二创 / 广告披露
    | 'platform-compliance' // 多平台 ToS / 接口边界
    | 'performance' // 性能 / 移动端 / i18n / a11y
    | 'collaboration' // 协作 / 版本 / 权限
    | 'growth' // 运营 / 模板市场 / 文档 / 工单
    | 'b2b' // 品牌方 / B 端面板
    | 'engineering' // 工程化 / 测试 / 重构

export interface RoadmapItem {
  id: string
  category: RoadmapCategory
  title: string
  /** 一句话目标：完成后用户/系统会变成什么样 */
  goal: string
  milestone: RoadmapMilestone
  priority: RoadmapPriority
  status: RoadmapStatus
  audience: RoadmapAudience[]
  /** 关键交付物（页面、接口、文档、流程） */
  deliverables: string[]
  /** 主要风险或外部依赖（备案、第三方审批、平台政策） */
  risk?: string
  /** 依赖的其他 roadmap item id（用于排序提示） */
  dependencies?: string[]
}

export const ROADMAP_CATEGORY_META: Record<RoadmapCategory, { label: string, hint: string }> = {
  'compliance': { label: `合规 / 法务`, hint: `面向公众发布的法律阻断项` },
  'account-security': { label: `账号 / 安全`, hint: `凭据、会话、数据导出` },
  'billing': { label: `付费 / 计费`, hint: `支付通道、发票、订阅` },
  'observability': { label: `可观测性 / SRE`, hint: `监控、状态页、备份` },
  'content-safety': { label: `内容安全`, hint: `AI 审核、敏感词、广告披露` },
  'platform-compliance': { label: `多平台合规`, hint: `每个目标平台的 ToS 边界` },
  'performance': { label: `性能 / 可用性`, hint: `移动端、离线、i18n、a11y` },
  'collaboration': { label: `协作`, hint: `多人编辑、权限、版本` },
  'growth': { label: `运营 / 增长`, hint: `邀请、模板、文档、工单` },
  'b2b': { label: `品牌方 B 端`, hint: `B 端独立入口与结算` },
  'engineering': { label: `工程化`, hint: `测试、重构、自动化` },
}

export const ROADMAP_MILESTONE_META: Record<RoadmapMilestone, {
  label: string
  shortLabel: string
  summary: string
  classes: string
}> = {
  'alpha': {
    label: `Public Alpha · 邀请制内测`,
    shortLabel: `Alpha`,
    summary: `当前阶段。仅向被邀请的种子用户开放，重点验证多平台同步、AI 二创、创作者名片三个核心闭环。`,
    classes: `border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200`,
  },
  'beta': {
    label: `Public Beta · 注册即用`,
    shortLabel: `Beta`,
    summary: `开放注册，但显式标注 Beta。要求所有 P0 合规、安全、计费阻断项必须闭环。`,
    classes: `border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200`,
  },
  'ga': {
    label: `GA · 正式发布`,
    shortLabel: `GA`,
    summary: `可对外宣传"已发布"。要求可观测性、SLA、内容审核、B 端通路达到生产标准。`,
    classes: `border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200`,
  },
  'post-ga': {
    label: `Post-GA · 长期演进`,
    shortLabel: `Post-GA`,
    summary: `GA 之后的差异化能力：协作、模板市场、品牌方深度结算。`,
    classes: `border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200`,
  },
}

export const ROADMAP_STATUS_META: Record<RoadmapStatus, { label: string, classes: string }> = {
  'planning': {
    label: `规划中`,
    classes: `bg-muted text-muted-foreground`,
  },
  'in-progress': {
    label: `进行中`,
    classes: `bg-primary/15 text-primary`,
  },
  'preview': {
    label: `灰度预览`,
    classes: `bg-sky-500/15 text-sky-700 dark:text-sky-300`,
  },
  'blocked': {
    label: `等外部依赖`,
    classes: `bg-red-500/15 text-red-700 dark:text-red-300`,
  },
}

export const ROADMAP_PRIORITY_META: Record<RoadmapPriority, { label: string, classes: string }> = {
  P0: {
    label: `P0 · 阻断`,
    classes: `bg-red-500/15 text-red-700 dark:text-red-300`,
  },
  P1: {
    label: `P1 · 重要`,
    classes: `bg-amber-500/15 text-amber-700 dark:text-amber-300`,
  },
  P2: {
    label: `P2 · 长期`,
    classes: `bg-muted text-muted-foreground`,
  },
}

export const ROADMAP_AUDIENCE_META: Record<RoadmapAudience, string> = {
  'creator': `创作者`,
  'brand': `品牌方`,
  'platform-owner': `站长`,
}

/* ------------------------------------------------------------------ */
/* roadmap items                                                       */
/* ------------------------------------------------------------------ */

export const ROADMAP_ITEMS: RoadmapItem[] = [
  // ----- 合规 / 法务（GA 前 P0 阻断） ------------------------------
  {
    id: `compliance-privacy-policy`,
    category: `compliance`,
    title: `用户协议 / 隐私政策 / Cookie 政策`,
    goal: `所有对外开放的页面拥有可访问的法律文档，覆盖账号数据、AI 调用、平台凭据存储、第三方分享场景。`,
    milestone: `beta`,
    priority: `P0`,
    status: `planning`,
    audience: [`creator`, `brand`],
    deliverables: [
      `/legal/privacy、/legal/terms、/legal/cookies 三个独立页面`,
      `注册、登录、首次启用 AI、首次保存平台凭据时强制弹窗确认`,
      `数据处理清单（个人信息字段、用途、存储位置、第三方共享）`,
    ],
    risk: `中文站需符合《个人信息保护法》《生成式 AI 服务管理暂行办法》，建议法律 review`,
  },
  {
    id: `compliance-icp`,
    category: `compliance`,
    title: `ICP 备案 / 公安联网备案`,
    goal: `面向中国大陆用户开放前完成 ICP 备案、增值电信业务许可证（视具体业务形态）。`,
    milestone: `beta`,
    priority: `P0`,
    status: `blocked`,
    audience: [`platform-owner`],
    deliverables: [
      `主域名 ICP 备案`,
      `备案号在 footer 显示`,
      `如涉及 UGC / 评论 / 群组，需 ICP 增值业务许可`,
    ],
    risk: `备案周期通常 20 个工作日，依赖主体资质`,
  },
  {
    id: `compliance-ad-disclosure`,
    category: `compliance`,
    title: `商业合作广告标识`,
    goal: `所有品牌合作内容、创作者名片中的有偿推广信息必须显式标注"广告"，符合《互联网广告管理办法》。`,
    milestone: `beta`,
    priority: `P0`,
    status: `planning`,
    audience: [`creator`, `brand`],
    deliverables: [
      `创作者名片 / 品牌合作面板增加"广告标识"开关，默认开启`,
      `导出物料（图文、二维码、复制文本）自动附广告字样`,
      `品牌方分享链接显示"由 XX 品牌赞助"`,
    ],
  },
  {
    id: `compliance-minor-protection`,
    category: `compliance`,
    title: `未成年人保护与年龄网关`,
    goal: `注册流程加入年龄声明，未成年账号禁用 AI 生成、品牌合作、付费等敏感能力。`,
    milestone: `ga`,
    priority: `P1`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `注册时年龄声明 + 监护人提示`,
      `未成年账号能力降级矩阵`,
      `家长申诉入口`,
    ],
  },

  // ----- 账号 / 安全 ----------------------------------------------
  {
    id: `security-mfa`,
    category: `account-security`,
    title: `2FA / 多因素认证`,
    goal: `账号支持 TOTP 或邮箱二次验证，绑定平台凭据等敏感操作必须二次确认。`,
    milestone: `beta`,
    priority: `P0`,
    status: `planning`,
    audience: [`creator`, `brand`],
    deliverables: [
      `Settings → 安全：开启 TOTP / 邮箱验证码`,
      `恢复码下载`,
      `敏感操作（删除账号、重置 share token、导出凭据）走二次验证`,
    ],
  },
  {
    id: `security-session-management`,
    category: `account-security`,
    title: `会话管理与异常登录通知`,
    goal: `用户可以看到所有活跃会话、远程登出、收到异地登录邮件提醒。`,
    milestone: `beta`,
    priority: `P1`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `Settings → 会话列表（设备、IP 大区、最后活跃时间）`,
      `「登出所有其他设备」按钮`,
      `异地 / 异常设备登录触发邮件`,
    ],
  },
  {
    id: `security-credential-kms`,
    category: `account-security`,
    title: `平台凭据 KMS 加密升级`,
    goal: `小红书、抖音、B 站等平台 cookie / API key 由对称密钥升级为 KMS-managed，支持密钥轮换。`,
    milestone: `beta`,
    priority: `P0`,
    status: `planning`,
    audience: [`creator`, `platform-owner`],
    deliverables: [
      `Worker 加解密改走 Cloudflare KMS / 自托管 KMS`,
      `密钥版本化，老数据延迟轮换`,
      `密钥外泄应急 SOP（一键失效 + 通知用户）`,
    ],
    risk: `Cloudflare 当前 KMS 能力有限，可能需要自托管或迁移到 R2 + envelope encryption`,
  },
  {
    id: `security-account-deletion-export`,
    category: `account-security`,
    title: `账号删除与数据导出`,
    goal: `用户可以一键导出全部个人数据，并申请彻底删除账号；满足 GDPR / 《个保法》。`,
    milestone: `beta`,
    priority: `P0`,
    status: `planning`,
    audience: [`creator`, `brand`],
    deliverables: [
      `/settings/data 一键导出 JSON 包（草稿、配置、凭据元数据、AI 历史）`,
      `账号删除：7 天冷静期 + 邮件二次确认 + 异步真删`,
      `保留法定时效内的最小审计字段`,
    ],
  },

  // ----- 付费 / 计费 ----------------------------------------------
  {
    id: `billing-real-payment`,
    category: `billing`,
    title: `真实支付通道接入`,
    goal: `从"手动 Pro 授权"升级为微信 / 支付宝 / Stripe 三通道，自动开通、自动续费。`,
    milestone: `beta`,
    priority: `P0`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `Stripe Checkout（海外）+ 微信扫码 + 支付宝当面付`,
      `Webhook 对账与失败重试`,
      `订阅状态机：trial / active / past_due / canceled / refunded`,
    ],
    risk: `国内支付通道需要营业执照、对私不可用，依赖主体资质`,
  },
  {
    id: `billing-invoice-refund`,
    category: `billing`,
    title: `发票与退款流程`,
    goal: `Pro 用户可以申请发票（增值税普票/专票），并在合规窗口内申请退款。`,
    milestone: `beta`,
    priority: `P1`,
    status: `planning`,
    audience: [`creator`, `brand`],
    deliverables: [
      `/settings/billing → 申请发票（电子发票邮件投递）`,
      `7 天无理由退款政策 + 自动退款 SOP`,
      `财务对账后台`,
    ],
  },
  {
    id: `billing-quota-dashboard`,
    category: `billing`,
    title: `配额与成本透明化`,
    goal: `用户可以实时看到当月 AI tokens、图片生成次数、发布次数等用量；接近上限时主动提示。`,
    milestone: `beta`,
    priority: `P1`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `Settings → 用量看板（按日 / 按功能）`,
      `80% / 100% 阈值邮件 + 站内通知`,
      `升级/购买额度包入口`,
    ],
  },

  // ----- 可观测性 / SRE -------------------------------------------
  {
    id: `obs-error-tracking`,
    category: `observability`,
    title: `错误监控与告警`,
    goal: `前后端接入 Sentry（或同类），关键路径报错可在 5 分钟内通知到值班人。`,
    milestone: `beta`,
    priority: `P0`,
    status: `planning`,
    audience: [`platform-owner`],
    deliverables: [
      `Vue 全局错误捕获 + Worker 异常上报`,
      `按 release / route / userId 维度分组`,
      `P0 告警走 Webhook 推送`,
    ],
  },
  {
    id: `obs-status-page`,
    category: `observability`,
    title: `公开状态页与 SLA`,
    goal: `status.md.example.com 显示各能力（编辑器 / 同步 / AI / 平台分发）实时状态与历史故障。`,
    milestone: `ga`,
    priority: `P1`,
    status: `planning`,
    audience: [`creator`, `brand`],
    deliverables: [
      `5 个核心组件健康检查`,
      `事故 RCA 模板与公开归档`,
      `订阅故障邮件 / RSS`,
    ],
  },
  {
    id: `obs-backup-drill`,
    category: `observability`,
    title: `D1 备份与恢复演练`,
    goal: `D1 数据库每日备份到 R2，季度演练一次完整恢复，验证 RPO ≤ 24h、RTO ≤ 4h。`,
    milestone: `beta`,
    priority: `P0`,
    status: `planning`,
    audience: [`platform-owner`],
    deliverables: [
      `定时备份脚本 + R2 长期归档`,
      `跨账号副本（防 Cloudflare 账号锁定）`,
      `季度恢复演练 runbook`,
    ],
  },

  // ----- 内容安全 -------------------------------------------------
  {
    id: `safety-ai-output-review`,
    category: `content-safety`,
    title: `AI 生成内容审核`,
    goal: `所有 AI 生成的文本 / 图片在写入草稿前过敏感词与机审接口；违规结果直接拒绝并向用户提示。`,
    milestone: `beta`,
    priority: `P0`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `文本：接入数美 / 网易易盾 / 腾讯天御任一`,
      `图片：图床上传与 AI 出图必经审核`,
      `违规计数与封禁策略`,
    ],
    risk: `《生成式 AI 服务管理暂行办法》要求"提供者负有内容审核责任"`,
  },
  {
    id: `safety-sensitive-words`,
    category: `content-safety`,
    title: `敏感词与平台禁词词典`,
    goal: `维护一份分级敏感词表，区分"绝对禁止"与"平台不友好（小红书/抖音）"，编辑器实时提示。`,
    milestone: `beta`,
    priority: `P1`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `编辑器侧栏「合规预检」面板`,
      `按目标平台高亮平台禁词`,
      `词典在线热更新`,
    ],
  },
  {
    id: `safety-source-attribution`,
    category: `content-safety`,
    title: `二创内容溯源`,
    goal: `通过 GNews / HackerNews 等聚合源生成的二创草稿，强制保留原文链接与署名字段。`,
    milestone: `beta`,
    priority: `P1`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `二创模板的元数据强制写入 sourceUrl / sourceAuthor`,
      `导出 / 发布时占位符校验`,
      `「未署名"将拦截发布按钮`,
    ],
  },

  // ----- 多平台合规 -----------------------------------------------
  {
    id: `platform-tos-review`,
    category: `platform-compliance`,
    title: `每平台 ToS 评审与边界文档`,
    goal: `为小红书、抖音、B 站、知乎、公众号、SegmentFault、百家号 等平台输出 ToS 边界文档，明确"允许 / 灰色 / 禁止"。`,
    milestone: `beta`,
    priority: `P0`,
    status: `planning`,
    audience: [`platform-owner`, `creator`],
    deliverables: [
      `每平台一份 markdown：账号自动化边界、配额、风控信号`,
      `违规风险分级`,
      `平台政策更新订阅机制`,
    ],
    risk: `部分平台对自动化发布存在灰色地带，需要明确"用户主动操作 vs 服务端调用"边界`,
  },
  {
    id: `platform-auth-disclosure`,
    category: `platform-compliance`,
    title: `平台授权链路明示`,
    goal: `用户启用某平台同步前，在弹窗中明示"将读取 / 写入哪些数据、存储多久、谁能看到"。`,
    milestone: `beta`,
    priority: `P0`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `每平台一份"权限清单"卡片`,
      `首次启用强制阅读 + checkbox 确认`,
      `审计日志：用户何时启用 / 关闭 / 删除凭据`,
    ],
  },

  // ----- 性能 / 可用性 --------------------------------------------
  {
    id: `perf-mobile-deep`,
    category: `performance`,
    title: `移动端深度优化`,
    goal: `工作流核心页（创作、同步、名片）在 iOS Safari / Android Chrome 上的可用性达到 PC 90%。`,
    milestone: `beta`,
    priority: `P1`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `编辑器移动端布局（虚拟键盘适配、工具条折叠）`,
      `多平台同步的扩展提示在移动端走"在 PC 端继续"分流`,
      `Lighthouse 移动端分数 ≥ 80`,
    ],
  },
  {
    id: `perf-i18n`,
    category: `performance`,
    title: `i18n 多语言`,
    goal: `提取所有硬编码中文，支持中文 / 英文切换；为出海做准备。`,
    milestone: `ga`,
    priority: `P2`,
    status: `planning`,
    audience: [`creator`, `brand`],
    deliverables: [
      `vue-i18n 接入`,
      `中文为 source，英文先机翻 + 人工校对核心路径`,
      `日期 / 数字 / 货币本地化`,
    ],
  },
  {
    id: `perf-a11y`,
    category: `performance`,
    title: `无障碍 a11y 基线`,
    goal: `所有交互元素满足键盘可达、屏幕阅读器可读、对比度达 WCAG AA。`,
    milestone: `ga`,
    priority: `P2`,
    status: `planning`,
    audience: [`creator`, `brand`],
    deliverables: [
      `axe-core CI 检查`,
      `Focus ring 与跳转链接`,
      `aria-label 覆盖核心组件`,
    ],
  },
  {
    id: `perf-offline-editor`,
    category: `performance`,
    title: `离线编辑器`,
    goal: `编辑器在断网状态下可写作、可保存到本地，恢复网络后自动同步。`,
    milestone: `post-ga`,
    priority: `P2`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `Service Worker + IndexedDB 草稿队列`,
      `冲突解决 UI`,
      `「离线模式」状态提示`,
    ],
  },

  // ----- 协作 -----------------------------------------------------
  {
    id: `collab-version-history`,
    category: `collaboration`,
    title: `版本历史与对比`,
    goal: `每篇草稿保留 N 个历史快照，可对比、可回滚。`,
    milestone: `ga`,
    priority: `P1`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `D1 持久化版本快照`,
      `diff viewer（已存在）接入草稿历史`,
      `自动快照 + 命名快照`,
    ],
  },
  {
    id: `collab-team-workspace`,
    category: `collaboration`,
    title: `团队工作区与权限`,
    goal: `支持多人共享一个内容工作区，按角色（创作者 / 主编 / 品牌 / 只读）分权。`,
    milestone: `post-ga`,
    priority: `P2`,
    status: `planning`,
    audience: [`creator`, `brand`],
    deliverables: [
      `团队实体与邀请链接`,
      `RBAC 权限矩阵`,
      `按团队计费`,
    ],
  },
  {
    id: `collab-realtime`,
    category: `collaboration`,
    title: `多人实时协作`,
    goal: `多人同时编辑同一篇草稿，光标可见、冲突自动合并。`,
    milestone: `post-ga`,
    priority: `P2`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `CRDT（Yjs）接入 CodeMirror 6`,
      `WebSocket / WebRTC 通道`,
      `Presence 指示`,
    ],
  },

  // ----- 运营 / 增长 ----------------------------------------------
  {
    id: `growth-onboarding`,
    category: `growth`,
    title: `首次使用引导`,
    goal: `新用户在 3 分钟内完成"写一篇 → 同步到任意一个平台 → 看到创作名片"的完整闭环。`,
    milestone: `beta`,
    priority: `P1`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `Tour 组件 + checklist`,
      `Demo 文章预填`,
      `「跳过」与"以后再看"路径`,
    ],
  },
  {
    id: `growth-template-market`,
    category: `growth`,
    title: `主题与模板市场`,
    goal: `创作者可以发布自己的主题 / 二创模板供他人使用；上架走人工 + 机审。`,
    milestone: `post-ga`,
    priority: `P2`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `/marketplace 主题与模板列表`,
      `上架审核流程`,
      `分成或积分体系（可选）`,
    ],
  },
  {
    id: `growth-docs-help`,
    category: `growth`,
    title: `文档中心与工单`,
    goal: `所有功能配套用户文档，并提供工单 / 客服入口（不止 GitHub issue）。`,
    milestone: `beta`,
    priority: `P1`,
    status: `planning`,
    audience: [`creator`, `brand`],
    deliverables: [
      `/docs 用户手册（按角色分章）`,
      `站内工单：附带最近一次错误日志`,
      `FAQ + 智能搜索`,
    ],
  },
  {
    id: `growth-referral`,
    category: `growth`,
    title: `邀请与引荐机制`,
    goal: `创作者邀请新用户注册并完成首篇发布，双方获得奖励（AI 额度 / 试用天数）。`,
    milestone: `ga`,
    priority: `P2`,
    status: `planning`,
    audience: [`creator`],
    deliverables: [
      `邀请码 + 落地页`,
      `反作弊：同 IP / 同设备识别`,
      `奖励结算后台`,
    ],
  },

  // ----- 品牌方 B 端 ----------------------------------------------
  {
    id: `b2b-brand-portal`,
    category: `b2b`,
    title: `品牌方独立登录与面板`,
    goal: `品牌方走独立入口登录，看到所有可合作创作者、报价、历史投放，与创作者侧权限隔离。`,
    milestone: `ga`,
    priority: `P1`,
    status: `planning`,
    audience: [`brand`],
    deliverables: [
      `/brand/login + 独立角色`,
      `创作者搜索 + 收藏`,
      `合作意向单 -> 合同`,
    ],
  },
  {
    id: `b2b-campaign-roi`,
    category: `b2b`,
    title: `投放 ROI 看板`,
    goal: `品牌方可以看到合作内容上线后的曝光、互动、转化数据（基于平台公开数据 + 手动上报）。`,
    milestone: `post-ga`,
    priority: `P2`,
    status: `planning`,
    audience: [`brand`],
    deliverables: [
      `每个 campaign 的多平台数据聚合`,
      `导出 PDF / Excel 报告`,
      `周期性自动抓取`,
    ],
  },
  {
    id: `b2b-contract-invoice`,
    category: `b2b`,
    title: `合同流转与发票合规`,
    goal: `合作意向 → 电子合同 → 对公付款 → 发票，全流程线上闭环。`,
    milestone: `post-ga`,
    priority: `P2`,
    status: `planning`,
    audience: [`brand`, `creator`],
    deliverables: [
      `第三方电子签接入（e 签宝 / DocuSign）`,
      `对公账号验证`,
      `专票申请与开具`,
    ],
  },

  // ----- 工程化 / 测试 --------------------------------------------
  {
    id: `eng-test-coverage`,
    category: `engineering`,
    title: `单元测试与 E2E 测试基线`,
    goal: `核心模块（渲染、同步、计费）单测覆盖 ≥ 60%，主链路 E2E 测试每日运行。`,
    milestone: `beta`,
    priority: `P1`,
    status: `planning`,
    audience: [`platform-owner`],
    deliverables: [
      `Vitest 单元测试`,
      `Playwright E2E：注册 / 编辑 / 同步 / 计费`,
      `CI 红线门禁`,
    ],
  },
  {
    id: `eng-worker-modularization`,
    category: `engineering`,
    title: `Worker 模块化`,
    goal: `apps/web/worker 单文件拆为按领域（auth / creator / distribution / billing）的多 service。`,
    milestone: `beta`,
    priority: `P1`,
    status: `planning`,
    audience: [`platform-owner`],
    deliverables: [
      `按 domain 拆分 routes`,
      `共享中间件（auth / rate-limit / audit）`,
      `单文件 ≤ 400 行`,
    ],
  },
  {
    id: `eng-security-scan`,
    category: `engineering`,
    title: `安全扫描自动化`,
    goal: `每次 PR 自动跑依赖漏洞、SAST、Secret 扫描；高危阻断合并。`,
    milestone: `beta`,
    priority: `P0`,
    status: `planning`,
    audience: [`platform-owner`],
    deliverables: [
      `pnpm audit + Snyk / Socket`,
      `gitleaks 在 pre-push 与 CI`,
      `CodeQL / Semgrep`,
    ],
  },
]

/**
 * 给前端用的派生统计：每个里程碑的总数 / 各优先级数量 / 各状态数量。
 */
export function buildRoadmapStats(items: RoadmapItem[] = ROADMAP_ITEMS) {
  const milestoneCount: Record<RoadmapMilestone, number> = {
    'alpha': 0,
    'beta': 0,
    'ga': 0,
    'post-ga': 0,
  }
  const priorityCount: Record<RoadmapPriority, number> = { P0: 0, P1: 0, P2: 0 }
  const statusCount: Record<RoadmapStatus, number> = {
    'planning': 0,
    'in-progress': 0,
    'preview': 0,
    'blocked': 0,
  }

  for (const item of items) {
    milestoneCount[item.milestone] += 1
    priorityCount[item.priority] += 1
    statusCount[item.status] += 1
  }

  return {
    total: items.length,
    milestoneCount,
    priorityCount,
    statusCount,
  }
}

export const ROADMAP_MILESTONE_ORDER: RoadmapMilestone[] = [
  `alpha`,
  `beta`,
  `ga`,
  `post-ga`,
]

export const ROADMAP_PRIORITY_ORDER: RoadmapPriority[] = [`P0`, `P1`, `P2`]
