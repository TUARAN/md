export type XiaohongshuThemeId
  = | `aiProductivity`
    | `techExplainer`
    | `toolWorkflow`
    | `creatorGrowth`
    | `careerInsight`

export interface XiaohongshuTheme {
  id: XiaohongshuThemeId
  title: string
  tagline: string
  audience: string
  visualStyle: string
  captionAngle: string
  hookPatterns: string[]
  modules: string[]
  hashtagSeeds: string[]
}

export interface XiaohongshuCampaignInput {
  topic: string
  audience: string
  angle: string
  takeaway: string
  theme: XiaohongshuTheme
}

export const XIAOHONGSHU_THEMES: XiaohongshuTheme[] = [
  {
    id: `aiProductivity`,
    title: `AI 效率工具`,
    tagline: `把工具价值讲成可立即复用的工作流`,
    audience: `内容创作者、独立开发者、运营同学`,
    visualStyle: `干净的桌面工作流截图感，主体是人正在使用 AI 工具完成任务，画面留出 20% 中文标题空间，真实产品感，避免夸张科幻元素`,
    captionAngle: `先给痛点，再给 3 步解决路径，最后落到可执行清单`,
    hookPatterns: [`我最近把这个流程固定下来了`, `别再只收藏 AI 工具清单了`, `这个方法让我少做了很多重复活`],
    modules: [`痛点场景`, `工具组合`, `操作步骤`, `避坑提醒`, `复盘指标`],
    hashtagSeeds: [`AI工具`, `效率提升`, `工作流`, `内容创作`, `运营工具`],
  },
  {
    id: `techExplainer`,
    title: `技术科普`,
    tagline: `把复杂技术翻译成小红书能看懂的图文笔记`,
    audience: `技术新人、产品经理、AI 爱好者`,
    visualStyle: `高质感信息图封面，中心有清晰技术概念符号，配合 3 个视觉分层模块，柔和浅色背景，中文标题区域清晰`,
    captionAngle: `从一个常见误解切入，用类比解释底层逻辑，再补充适用边界`,
    hookPatterns: [`很多人把它理解反了`, `这件事其实可以用一个生活例子讲清楚`, `看懂这个概念，后面很多技术新闻就顺了`],
    modules: [`常见误区`, `一句话解释`, `类比拆解`, `应用场景`, `边界与风险`],
    hashtagSeeds: [`技术科普`, `AI科普`, `大模型`, `程序员`, `科技趋势`],
  },
  {
    id: `toolWorkflow`,
    title: `工具流教程`,
    tagline: `输出收藏价值高的步骤卡片与场景案例`,
    audience: `需要落地方法的职场人、创作者、开发者`,
    visualStyle: `步骤卡片式封面，4:5 竖图，包含 1 个主标题和 4 个简洁步骤块，真实 UI 元素质感，留白充分`,
    captionAngle: `明确适用场景，按步骤讲清楚输入、动作、产出和检查点`,
    hookPatterns: [`照着这个流程做一次就懂了`, `这不是工具推荐，是一套流程`, `我把步骤拆到可以直接照抄`],
    modules: [`适用对象`, `准备材料`, `操作流程`, `结果检查`, `进阶玩法`],
    hashtagSeeds: [`教程`, `工具流`, `效率方法`, `职场技能`, `实用干货`],
  },
  {
    id: `creatorGrowth`,
    title: `创作者增长`,
    tagline: `用运营视角拆解选题、封面、互动和复盘`,
    audience: `小红书博主、知识型创作者、个人 IP 运营者`,
    visualStyle: `运营看板风格封面，包含选题、封面、互动、复盘四个模块，色彩克制专业，4:5 竖版，小红书内容运营感`,
    captionAngle: `把增长拆成可复盘的动作，不承诺爆款，强调长期高质量产出`,
    hookPatterns: [`别只盯着单篇爆不爆`, `小红书真正要优化的是这 4 个动作`, `我更建议把账号当成一个内容系统`],
    modules: [`定位`, `选题`, `封面`, `互动`, `复盘`],
    hashtagSeeds: [`小红书运营`, `个人IP`, `内容运营`, `博主成长`, `账号复盘`],
  },
  {
    id: `careerInsight`,
    title: `职业洞察`,
    tagline: `把行业观察转成有判断、有共鸣的笔记`,
    audience: `互联网从业者、技术人、转型期职场人`,
    visualStyle: `都市职场 + 科技感插画，人物在笔记本前思考职业路径，画面真实克制，适合知识类小红书封面`,
    captionAngle: `先描述普遍焦虑，再给判断框架，最后给行动建议`,
    hookPatterns: [`最近很多人都在问同一个问题`, `这个变化比想象中来得更快`, `与其焦虑，不如先看清这条线`],
    modules: [`现象`, `原因`, `趋势`, `个人策略`, `行动建议`],
    hashtagSeeds: [`职业成长`, `互联网职场`, `AI时代`, `职场思考`, `个人成长`],
  },
]

export const XIAOHONGSHU_QUALITY_RULES = [
  `封面只表达一个核心信息，标题不超过 16 个中文字符`,
  `配文首屏必须有具体场景或反常识判断，不写空泛口号`,
  `每篇至少包含一个可执行动作、一个避坑点、一个复盘指标`,
  `标签控制在 5-8 个，优先使用主题词 + 人群词 + 场景词`,
  `不承诺必爆，不制造焦虑，用长期高质量运营口吻表达`,
]

export function getXiaohongshuTheme(id: XiaohongshuThemeId) {
  return XIAOHONGSHU_THEMES.find(theme => theme.id === id) ?? XIAOHONGSHU_THEMES[0]
}

export function buildXiaohongshuImagePrompt(input: XiaohongshuCampaignInput) {
  const title = input.topic.trim() || `AI 内容工作流`
  const takeaway = input.takeaway.trim() || input.theme.tagline
  return [
    `为小红书知识类笔记生成一张高质量封面图，竖版 4:5。`,
    `主题：${title}`,
    `目标读者：${input.audience.trim() || input.theme.audience}`,
    `核心信息：${takeaway}`,
    `视觉方向：${input.theme.visualStyle}`,
    `画面要求：主体清晰、信息层级明确、适合手机端浏览；预留顶部或中部标题区域；可包含少量中文短标题，但不要出现乱码、品牌商标或真实平台 Logo。`,
    `质感：真实、干净、专业、可发布，不要低质拼贴，不要过度赛博朋克，不要杂乱小字。`,
  ].join(`\n`)
}

export function buildXiaohongshuCaptionPrompt(input: XiaohongshuCampaignInput) {
  const topic = input.topic.trim() || `AI 内容工作流`
  const audience = input.audience.trim() || input.theme.audience
  const angle = input.angle.trim() || input.theme.captionAngle
  const takeaway = input.takeaway.trim() || input.theme.tagline

  return [
    `你是一个偏长期主义的小红书知识类账号运营。请为一篇小红书图文笔记生成可直接发布的中文配文。`,
    ``,
    `主题：${topic}`,
    `专题模块：${input.theme.title}`,
    `目标读者：${audience}`,
    `切入角度：${angle}`,
    `核心收获：${takeaway}`,
    ``,
    `输出要求：`,
    `1. 给出 3 个标题备选，每个不超过 20 个中文字符。`,
    `2. 正文结构为：开头钩子、正文 4-6 段、行动清单、评论区互动问题。`,
    `3. 使用自然口吻，像真实创作者复盘，不要营销腔。`,
    `4. 保持专业可信，不编造数据、案例、背书。`,
    `5. 末尾给出 6-8 个小红书标签。`,
    `6. 只输出成稿，不解释过程。`,
    ``,
    `可参考模块：${input.theme.modules.join(` / `)}`,
    `可参考钩子：${input.theme.hookPatterns.join(`；`)}`,
    `标签种子：${input.theme.hashtagSeeds.join(`，`)}`,
  ].join(`\n`)
}
