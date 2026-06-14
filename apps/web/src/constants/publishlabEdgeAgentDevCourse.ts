import type { PublishLabBooklet } from './publishlab'

/* ============================================================
 * 边缘智能体开发实战 — 从 0 到 1 把 AI Agent 跑在 Cloudflare Workers 上
 * 单源 Markdown:既驱动站内渲染,也作为「复制到掘金编辑器」的载荷。
 * ============================================================ */

const s_intro = `
## 作者介绍

你好,我是涂阿燃,也叫安东尼,独立开发者、技术内容创作者,矩联科技与开发者博主联盟发起人。

我长期关注前端工程化、AI Agent、大模型应用落地和开发者增长,个人站 2aran.com 持续记录技术研究、产品观察、AI 工程实践和独立开发过程。过去几年,我在掘金、小红书、知乎、CSDN、51CTO、头条、公众号等平台累计发布 500+ 篇内容,全网阅读量超过 400 万。

我曾出版和整理过《程序员成长手记》《AI Bots 通关指南》等内容,也在持续建设「前端周看」、AI 产品方与技术博主协作网络,以及面向本地私有业务的数字员工系统。

很多人已经能做出一个看起来不错的 Agent demo,但真正上线时会卡在状态、工具、记忆、流式响应、计费、限流、日志和成本控制这些工程问题上。这里要补的,正是从 demo 到产品之间那段工程距离。

## 小册介绍

《边缘智能体开发实战》面向已经会写 Web 应用、正在把大模型能力接进真实产品的开发者。

这里不讲模型训练,也不把重点放在 Prompt 技巧合集上。更关心的是另一个问题:

> 如何把一个 AI Agent 从 demo 写成可以部署、可以持续维护、成本还能算得过来的真实产品。

技术主线会围绕 Cloudflare Workers、Durable Objects、Workers AI、D1、KV、R2、Vectorize 展开。先写出一个最小可运行的 Agent,再一点点补上工具调用、会话状态、用户记忆、RAG、流式响应、鉴权、计费、限流、日志和监控。

选择边缘运行时不是为了追热点。Agent 产品天然会遇到低延迟、长连接、会话状态、按量计费和全球部署这些问题。Cloudflare 这套能力刚好把它们放进了同一个工程体系里,适合个人开发者和小团队先把产品跑起来,再慢慢补强。

:::figure caption="从一次模型调用到一个边缘 Agent 产品的演进路径" alt="模型调用、工具调用、会话状态、RAG、流式交互、监控计费逐层叠加"
:::

## 你会学到什么？

读的过程中,你会反复碰到几个关键判断。

第一个判断是 Agent 和 Workflow 的边界。并不是所有 AI 自动化都需要 Agent,很多需求用固定流程反而更稳定。真正需要 Agent 的地方,通常是目标清楚、路径不固定,中间还要根据工具返回结果继续调整。

第二个判断是运行时选择。Workers、Edge Functions、Durable Objects 解决的不只是"部署更近",它们把会话状态、长连接、全球调度和成本颗粒度放在了同一张工程图里。理解这一点,后面做架构取舍会轻很多。

然后会进入实现层:Agent 主循环怎么写,工具 schema 怎么设计,失败重试和超时怎么处理,什么时候要保存记忆,什么时候要走 RAG,流式响应怎么组织事件,上线前还要补哪些日志、限流、灰度和成本控制。

每一章都尽量落到可运行代码或可执行清单上。读完之后,你至少应该能自己搭出一个边缘 Agent 原型,知道它哪里脆弱、哪里贵、哪里需要监控,也知道下一步该怎么把它推向真实用户。

## 适宜人群

更适合已经有一点 Web 开发基础的人读。比如你会写 TypeScript / JavaScript,调过 OpenAI、Anthropic、通义千问这类模型 API,但还没有完整做过 Agent 产品；或者你已经在做 SaaS、工具站、内部系统,想把 AI 能力接进现有业务。

如果你负责 LLM 应用工程化,正在补状态、工具、计费、日志和可观测性,这里的内容也能直接对上日常工作。

不需要机器学习、模型训练或算法研究背景。只要熟悉 Web 开发、HTTP、异步编程和基础后端概念,就可以边读边做。

## 购买须知

1. 本小册为图文形式内容服务,共计 16 节；
2. 全部文章预计 2026 年 6 月 30 日更新完成；
3. 购买用户可享有小册永久的阅读权限；
4. 购买用户可进入小册微信群,与作者互动；
5. 掘金小册为虚拟内容服务,一经购买成功概不退款；
6. 掘金小册版权归北京北比信息技术有限公司所有,任何机构、媒体、网站或个人未经本网协议授权不得转载、链接、转贴或以其他方式复制发布/发表,违者将依法追究责任；
7. 在掘金小册阅读过程中,如有任何问题,请邮件联系 xiaoce@xitu.io
`

const s_open = `
# 1.1 为什么 2026 年 Agent 必须跑在边缘

到 2026 年 6 月,大模型这件事已经不再是"会不会发生"的问题。

过去十几年,互联网公开文本、代码、图片、音视频、业务知识和人类经验,被一轮又一轮地清洗、压缩、对齐,最后塞进了模型参数、向量索引和上下文窗口里。模型像一个巨大的知识压缩器,把原本散落在网页、文档、仓库和系统里的信息,变成可以被自然语言调用的能力。

所以 2026 年真正的问题已经不是"大模型有没有用",而是:

> 这些能力到底怎么落到每一个具体业务、每一个具体产品、每一个具体用户身上?

这就是 Agent 出场的原因。模型负责理解和生成,Agent 负责把理解和生成接到真实世界:查资料、调接口、读文件、写数据库、调用工具、记住用户偏好、持续完成一个目标。

但落地很快会撞上一堵墙:**模型能力越来越强,真实世界的资源却仍然有限**。

GPU 很贵,中心化服务器也不便宜；长连接吃资源,会话状态难维护；用户分布在全球,请求却经常绕到一个中心机房；一次 Agent 任务可能要多轮推理、多次工具调用、多次状态读写。单个 demo 可以跑,一旦变成产品,延迟、成本、并发、状态、部署、可观测性会同时压过来。

这时候就轮到"赛博菩萨" Cloudflare 登场了。

Cloudflare 原本是做 CDN、安全和全球网络的,但 Workers、Durable Objects、D1、KV、R2、Vectorize、Queues、AI Gateway、Workers AI 这套东西拼起来之后,它已经不只是"给网站加速"的公司,而是一个可以承载 Agent 产品的边缘应用平台。

它最关键的价值不是便宜,也不只是节点多,而是让个人开发者和小团队不用先买服务器、搭集群、配网关、搞跨区状态同步,就能把 Agent 的编排逻辑、会话状态、工具调用和流式响应放到离用户更近的地方。

**问题不再是模型够不够聪明,而是你能不能用有限资源,把模型能力稳定、低成本、低延迟地交付给用户。**

> 💡 **本节要点**
> - 2026 年的大模型竞争,正在从"模型能力"进入"应用落地"阶段
> - Agent 的难点不是会不会调用模型,而是状态、工具、延迟、成本和持续交付
> - Cloudflare 这类边缘平台把全球网络、状态对象、存储、队列和 AI 网关组合成了 Agent 的低门槛基础设施
> - 边缘 ≠ 简单 CDN,它是「带状态、有调度、能调外部 API」的可编程网络

## 从模型奇观到产品落地

如果把过去 4 年的大模型应用史浓缩,会看到清晰的三幕:

| 年份 | 关键词 | 典型形态 | 主要矛盾 |
| --- | --- | --- | --- |
| 2022-2023 | 模型震撼 | ChatGPT、Prompt demo、Notebook 原型 | 大家在确认"模型到底能干什么" |
| 2023-2024 | 应用试错 | RAG、聊天机器人、Copilot、工作流自动化 | 能跑,但稳定性和成本很差 |
| 2025-2026 | Agent 落地 | 工具调用、多轮任务、会话记忆、边缘部署 | 如何把 demo 变成可持续产品 |

2026 年的关键标志是:**Agent 开始有"会话身份"**。

过去的模型调用更像一次性问答:用户发一句,服务器调一次模型,拿到结果就结束。但 Agent 不一样。Agent 要记住你是谁、你刚才做了什么、你授权过哪些工具、任务执行到哪一步、失败后能不能恢复、下一轮要不要继续。

这意味着每一个用户的 Agent 不再适合被丢进一个无状态函数里跑完就散,而应该绑定到一个分布式的、就近运行的、可恢复的会话单元。Durable Objects 这类边缘状态原语,正好踩中了这个位置。

## 一张图看懂中心化 Agent 的瓶颈

\`\`\`text
              ┌────────────────────────────────────────────┐
  用户(上海) │                                            │
   ──HTTP──▶ │  ① TLS 握手 + 路由        ~80ms RTT          │
              │  ② 上游 API Gateway       ~20ms              │
              │  ③ Agent 主循环                              │
              │     ├─ LLM 推理(US-East) ~600ms 单跳        │
              │     ├─ Tool: 查数据库      ~40ms              │
              │     ├─ Tool: 调外部 API    ~150ms             │
              │  ④ 流式回写               每 token ~120ms RTT │
              └────────────────────────────────────────────┘
\`\`\`

中心化 Agent 跑一轮工具调用,**网络抖动占了 60% 以上**。更糟的是:每多一轮工具调用,误差就翻一倍。一段 6 步的 Agent 推理,中心化架构总延迟很容易冲到 8-12 秒,而用户感知"还能用"的上限通常是 4 秒。

## 一个真实的迁移故事

我去年帮一家做客服 SaaS 的朋友把 Agent 从 AWS us-east-1 迁到 Cloudflare Workers。迁移前后的对比(同样的 prompt、同样的模型、同样的 RAG 文档):

| 指标 | 迁移前(AWS) | 迁移后(CF) | 变化 |
| --- | --- | --- | --- |
| 首字延迟(中国用户) | 1.9s | 0.4s | -79% |
| P99 端到端 | 11.3s | 3.8s | -66% |
| 单次会话成本 | $0.012 | $0.004 | -67% |
| 月度运维工时 | ~20 h | ~3 h | -85% |

最大的惊喜不是延迟降了,**是月度运维工时降了 85%** — 因为不用再操心容器扩缩容、跨区故障转移、TLS 续期、负载均衡这些事。这些时间被还给了产品本身。

## 边缘运行时怎么破

边缘运行时(Cloudflare Workers / Durable Objects / Vercel Edge / Deno Deploy)给我们三件不可能在传统 server 上同时拿到的东西:

| 能力 | 传统中心化 Server | 边缘运行时 |
| --- | --- | --- |
| 冷启动 | 秒级(容器) | <5ms(V8 isolate) |
| 全球分布 | 自己选 region | 自动 300+ 节点 |
| 有状态对象 | Redis / DB | Durable Objects 原生 |
| 单连接成本 | 一个连接占一进程 | 每连接 ~16KB 内存 |
| 计费颗粒 | 按机器 / 月 | 按请求 / CPU ms |
| 部署门槛 | CI + 容器 + K8s | 一行 \`wrangler deploy\` |

> ✅ **TAKEAWAY** 边缘不是「跑得更近」,而是「把 Agent 的会话+记忆+工具调用整体下沉,做成一台离每个用户都最近的状态机」。

:::figure caption="中心化 Agent vs 边缘 Agent 数据流" alt="左侧用户与中心机房之间多个长虚线,右侧用户与最近边缘节点之间一个短实线"
:::

## 三个最常见的误解

新人初次接触边缘 Agent 时,经常会跌进下面三个坑:

**误解 1:边缘就是 CDN 加点逻辑**
错。CDN 是无状态缓存,边缘运行时是**带可编程函数 + 可持久状态 + 可调外部 API** 的完整运行环境。你能在 Worker 里跑数据库查询、向量检索、模型推理,这些都是 CDN 做不到的。

**误解 2:边缘上跑模型推理 = 在边缘 GPU 上跑**
也不对。Workers AI 的物理 GPU 集群分布在少数大区域,**边缘节点拿到请求后就近路由到最近 GPU**,你写的代码不需要关心 GPU 在哪。"边缘"指的是**编排逻辑 + 会话状态**在边缘,推理本身依然在 GPU 区。

**误解 3:边缘运行时跑不了"大"模型**
现在的 Workers AI 已经支持 70B 级别模型与多家第三方供应商兜底(通过 AI Gateway 路由到 OpenAI/Anthropic)。**你不会因为选边缘而被锁死在小模型上**。

## 适合的读者

- 已经写过 OpenAI/Anthropic API 调用,但没把它产品化的开发者
- 一直在 AWS Lambda / Vercel Functions 上做 SSR、想转 Agent 方向的全栈
- 在创业、想用最低运维成本上线一个能赚钱的 Agent 产品的独立开发者
- 团队内负责 LLM 应用工程化的技术 Lead

## 阅读路径

技术主线共 15 节,**线性读最稳**:第二章解决"为什么、用什么";第三章把 Hello Agent 写出来;第四章解决记忆/检索;第五章把它变成 SaaS;第六章看真实案例和下一步。

如果你只想抄一个能上线的脚手架,**直接跳到 Hello Agent → Durable Objects → 鉴权、计费、限流**;再回头补工具调用、RAG、流式和可观测性。

## 不覆盖的内容

读之前先校准期望,**这些内容不在范围内**:

- 模型训练、微调、对齐技术(那是 ML 工程师的领域,这里聚焦应用层)
- LangChain / LlamaIndex 的 API 教程(我们用最少抽象、直接写 Workers)
- Prompt 工程心得汇编(只覆盖与 Agent 工程紧密相关的部分)
- 通用 React/Next.js 前端工程(用任何前端都行,这里专注后端)

如果你想学这些,书末会给出对应推荐资源。

## 2026 年的两个关键转折

如果让我用两句话总结这一年的行业转折,我会说:

**第一**:**模型能力的边际增长收敛了,工程能力的边际增长开始爆发**。2023-2024 大家都在等"下一代模型救我",2025 起优秀产品都是靠工程拉开差距 — 一样的模型,有人答对率 60%,有人 90%,差的不是模型而是 prompt + RAG + eval + 工具设计。

**第二**:**边缘原生平台第一次把"个人开发者一个人做 SaaS"门槛压到周末时间**。过去做一个能收钱的 SaaS 至少要 2-3 人月,2026 年一个独立开发者周末就能跑通 MVP。这创造了一个 SaaS 长尾创业窗口期。

抓住任何一点都够你做出一个不错的产品。两点都抓住,可以做出小而美的生意。

## Agent 经济的三个阶段

最后给你一个更宏观的判断框架。Agent 在企业里的部署可以分三阶段,2026 年我们处于第一到第二的过渡:

| 阶段 | 关键词 | 例子 |
| --- | --- | --- |
| 自动化(2023-2025) | 替代重复劳动 | 自动写 SEO 文章、自动客服初筛 |
| 协作(2025-2027) | 与专业人员配合 | 律师助理、医生诊断辅助 |
| 替代(2027+) | 独立完成专业任务 | 自动做尽调、自动起草合同 |

每个阶段的产品形态、定价模式、合规要求都不同。**你今天做的产品要想清楚:卡在哪个阶段上?明年是不是会被下一阶段碾压?**

接下来,我们正式开始 — 先把"边缘"这个词的内涵搞清楚。
`

const s_landscape = `
# 1.2 边缘运行时全景:Workers / Edge Functions / Durable Objects

「边缘」这两个字现在被用得很滥。CDN 也叫边缘,Lambda@Edge 也叫边缘,但真正能跑 Agent 的边缘运行时只有少数几家,且能力分层差异巨大。这一节我们把市面上 8 家主流方案拉出来对比,看清"哪个真能跑 Agent、哪个只是营销词"。

## 三层能力金字塔

\`\`\`text
        ┌──────────────────────────┐
        │   ④ 有状态 + 长连接        │   Durable Objects / Partykit
        ├──────────────────────────┤
        │   ③ 无状态可编程函数       │   Workers / Edge Functions / Deno Deploy
        ├──────────────────────────┤
        │   ② 可编程 CDN(改头改路径)│   Cloudflare Rules / Akamai EdgeWorkers
        ├──────────────────────────┤
        │   ① 静态分发               │   传统 CDN
        └──────────────────────────┘
\`\`\`

Agent 至少要落在 ③,理想情况下要落在 ④。落在 ① ② 的"边缘"只能改改 header、做 A/B、加水印,**碰不了 Agent 这种带状态的活儿**。

## 主流平台对比

| 平台 | 运行时 | 冷启动 | 状态层 | WebSocket | AI 原生 | 免费额度 |
| --- | --- | --- | --- | --- | --- | --- |
| Cloudflare Workers | V8 isolate | <5ms | KV / DO / D1 / R2 / Vectorize | ✅ | Workers AI / AI Gateway | 10 万请求/天 |
| Vercel Edge Functions | V8 isolate | <50ms | 外接(Upstash / Neon) | 仅 SSE | 无,需外调 | 与 Hobby 套餐合并 |
| Deno Deploy | V8 isolate | <50ms | Deno KV | ✅ | 无 | 100 万请求/月 |
| Fastly Compute | WASM | <1ms | 外接 | 部分 | 无 | 试用为主 |
| AWS Lambda@Edge | Node | 200ms+ | 外接 | ❌ | 需 Bedrock | 按请求 |
| Akamai EdgeWorkers | JS 受限子集 | <10ms | 受限 KV | ❌ | 无 | 仅大客户 |
| Netlify Edge | Deno | ~50ms | 外接 | ❌ | 无 | 与套餐合并 |
| Supabase Edge | Deno | ~80ms | 内嵌 Postgres | 仅 Realtime | 无 | 与套餐合并 |

> ⚠️ **注意** Vercel Edge 的 V8 isolate 是从 Workers 同款 runtime 启发而来,但目前**没有原生持久状态**,这意味着你要做 RAG、记忆、计费,得自己外接 Upstash / Neon / 自托管 Redis,链路比纯 CF 栈多一跳。

## 真实槽点 — 用户视角

文档好看不代表跑得顺。下面是几个我们和别的团队踩过的实际坑:

| 平台 | 槽点 |
| --- | --- |
| Vercel Edge | 函数最长 25 秒,Agent 多轮工具调用容易超时;响应体上限较小 |
| Deno Deploy | 国内访问延迟波动大,Deno KV 强一致区域不在亚洲 |
| Fastly Compute | WASM 模型生态不成熟,RAG/向量没有原生方案 |
| Lambda@Edge | 冷启动 200ms+ 是常态;不能跨区域共享会话状态 |
| Cloudflare Workers | CPU 时间默认 50ms 上限(付费可放宽);D1 写入未做分区 |

每家都有槽点。**关键看这些槽点是否在你的关键路径上**。比如 Vercel 的 25 秒上限对 SSR 完全够,对 Agent 多轮就是硬约束。

## Workers AI 的内置模型清单

Cloudflare 在 Workers 内置了一组随时可调用的模型,免去自己接 OpenAI 的工程量。常用列表:

| 模型 | 用途 | 单价(per 1M tokens) |
| --- | --- | --- |
| @cf/meta/llama-3.1-8b-instruct | 轻量对话、分类 | ~$0.011 输入 |
| @cf/meta/llama-3.3-70b-instruct-fp8 | 主力 Agent 大脑 | ~$0.40 输入 |
| @cf/baai/bge-base-zh-v1.5 | 中文 embedding | ~$0.012 / 1M tok |
| @cf/openai/whisper | 语音转写 | ~$0.0005 / 秒 |
| @cf/black-forest-labs/flux-1-schnell | 出图 | ~$0.000053 / step |

外加 AI Gateway 可以把 OpenAI、Anthropic、Groq、Replicate 全部统一路由 — **你的代码里只调一个 endpoint,后端模型可热切换**。

## 为什么用 Cloudflare 作为主线

不是 PR,是工程选择。要做 Agent 产品,你至少需要七样东西:**模型推理、向量检索、对象存储、会话状态、消息队列、定时任务、鉴权**。Cloudflare 是目前唯一一家在边缘层把这七样**全部内置**的厂商。

| 你要的能力 | 对应产品 | 计费颗粒 |
| --- | --- | --- |
| 模型推理 | Workers AI / AI Gateway | 按 1k tokens / 张图 |
| 向量检索 | Vectorize | 按向量数 + 查询数 |
| 对象存储 | R2 | 按 GB,免出口流量 |
| 会话状态 | Durable Objects | 按对象时长 + 请求数 |
| 消息队列 | Queues | 按消息数 |
| 定时任务 | Cron Triggers | 与 Workers 合并 |
| 鉴权 | Workers + JWT/Stytch | 自实现 |

更现实的判断:**Cloudflare 是目前唯一一家"个人开发者一个人能跑完 SaaS 全栈"的边缘平台**。其他家要么缺存储、要么缺向量、要么缺鉴权原语,你不得不拼凑 3-5 家 SaaS,链路长、账单杂、调试难。

## 国内 / 出海部署的具体差异

如果你的用户既在国内又在海外,部署策略要分两套:

| 维度 | 国内用户 | 海外用户 |
| --- | --- | --- |
| 边缘运行时 | 阿里云 ESA / 腾讯 EdgeOne / 火山引擎 Edge | Cloudflare Workers |
| 模型供应 | 通义 / 文心 / 豆包(走 OpenAPI) | OpenAI / Anthropic / Workers AI |
| 备案合规 | ICP + 生成式 AI 服务备案 | 仅看本地法规 |
| 支付 | 微信 / 支付宝(需企业资质) | Stripe / Paddle |
| 域名 | 国内域名要备案,境外不用 | 自由 |

实战:**前端统一一套,后端走"分流网关"** — 根据用户 IP 或浏览器语言路由到对应栈。两套栈的 Agent 业务逻辑可以共享一份代码,只把模型/支付/存储 binding 切换。

## 多云策略:什么时候 CF + 别家并用

完全单押 Cloudflare 也不是最优解。以下场景值得跨云组合:

- **GPU 模型托管**:CF Workers AI 没有的模型(比如某些垂类微调模型),用 Replicate / Modal,经 AI Gateway 路由
- **关系数据库强写入**:D1 当前不适合高并发写,主库放 Neon / PlanetScale
- **国内独立部署**:CF 在国内体验不稳,某些客户的边缘节点要走腾讯 EdgeOne / 阿里云 ESA(它们也提供类似 Workers 的 JS 运行时)
- **企业级合规**:某些行业要求数据驻留特定区域,DO 不能直接满足

> ✅ **TAKEAWAY** 选平台不是选最强的运行时,而是选「能让你一个人完成 SaaS 全栈」的运行时。下面默认你已经注册了 Cloudflare 账号并装好了 \`wrangler\`。

## Workers AI 的当前局限

公正讲,Workers AI 不是万能的,2026 年它仍有几个明确短板:

- **模型数量少于 OpenAI/Anthropic**:某些前沿模型(Claude 4、o1 系列)需要走 AI Gateway 中转,不是原生 binding
- **单次推理 CPU 上限**:Workers 默认 50ms,Workers Paid 30 秒,**长 prompt + 大模型**有时会触底,需要拆步骤
- **冷热模型差异大**:常用 sku 几乎无冷启动,冷门 sku 偶发 1-2 秒等待
- **国内访问稳定性**:CF 在国内并未全官方解禁,某些用户会偶发慢或访问异常
- **流式 API 的 SSE 格式**:不完全标准,客户端要按 \`data: {response:"x"}\` 解析

知道这些短板后,设计时就能合理规避 — 比如对国内用户做"国内 CDN + 国外推理"的混合架构,而不是单押 CF 一家。

## 评估一个边缘平台的 7 项 checklist

如果有人推荐你"用 X 平台",照这个 checklist 评估,不要被 PR 稿牵走:

1. 冷启动延迟在你的访问模式下实测多少?
2. 有没有原生持久状态层?如果没有,外接哪家?
3. 支持 WebSocket 长连接吗?有 keep-alive 限制吗?
4. 模型推理是平台自带还是要外接?计费是否透明?
5. 向量检索原生还是要 Pinecone?计费 ceiling 多高?
6. 计费颗粒是按请求 / CPU ms / 内存还是按机器月?
7. 国内外网络可达性怎样?有镜像 / 加速节点吗?

每一项打分,加总后再决定。这个 checklist 能帮你避开"看着炫但跑不顺"的平台。

## 安装 wrangler(5 行命令搞定环境)

\`\`\`bash
# 全局安装
npm i -g wrangler

# 登录
wrangler login

# 初始化项目
npm create cloudflare@latest my-edge-agent -- --type=hello-world
cd my-edge-agent
npm run dev # 本地 :8787 已就绪
\`\`\`

> 💡 **提示** \`wrangler login\` 会拉起浏览器走 OAuth。在 SSH 服务器/CI 环境上跑不通,改用 \`CLOUDFLARE_API_TOKEN\` 环境变量(在 dashboard → My Profile → API Tokens 生成)。

下一节我们就来动手:从 0 写出第一个 Edge Agent。
`

const s_agent_vs_workflow = `
# 1.3 Agent vs Workflow:本质区别与选择

「我做的这个东西到底叫 Agent 还是 Workflow?」这是 80% 的开发者在写第一个项目时最先犯迷糊的地方。两个词在大厂博客里被混用得一塌糊涂,但工程上它们是**两套完全不同的架构**,选错就要付出 3-5 倍的成本和延迟。

## 一句话定义

- **Workflow** = 有限状态机,**人(开发者)预先决定**每一步去哪
- **Agent** = 决策循环,**模型在运行时决定**下一步去哪

更精确一点:Workflow 是把"流程图"翻译成代码的产物 — 流程图能画出来,Workflow 就跑得起来。Agent 是把"目标"交给模型,让模型自己拼出流程图;同样的输入,跑两次可能走两条路径。

## 决策权在谁手里(关键差异)

| 维度 | Workflow | Agent |
| --- | --- | --- |
| 控制流 | 代码硬编码 | LLM 推断 |
| 分支条件 | \`if / switch\` | 模型工具选择 |
| 失败处理 | 重试 / 死信队列 | 反思 / 自修复 |
| 可调试性 | 高(每步可视化) | 低(看 trace) |
| 可预测性 | 极高 | 中 |
| 单次调用模型数 | 0-2 次 | 3-30 次 |
| 单次成本 | <¥0.01 | ¥0.05-2 |
| 单次延迟 | 1-5 秒 | 5-30 秒 |
| 适合场景 | 流程清晰、合规重 | 输入开放、目标模糊 |
| 团队需要的工程能力 | 后端工程师即可 | 还要 prompt + eval |

## 一个具体例子:用户上传简历后做什么

**Workflow 版**:解析 PDF → 抽字段 → 调一次 LLM 生成简评 → 写库 → 推送邮件。链路固定,失败处重试,成本可算到分。

**Agent 版**:把简历丢给 Agent,系统提示「你是招聘顾问,请帮我评估这个候选人」,Agent 自己决定要不要查公司库、要不要搜 LinkedIn、要不要给候选人发反问邮件。链路涌现,成本爆炸,但能处理"奇形怪状"的输入。

\`\`\`text
[Workflow 视角]                       [Agent 视角]

parse ─▶ extract ─▶ summarize ─▶      ┌────────────┐
   │        │            │             │   LLM      │
   ▼        ▼            ▼             │  ┌──────┐  │
[db]    [validate]    [email]          │  │思考   │  │
                                       │  └──────┘  │
                                       │  ▲   │     │
                                       │  │   ▼     │
                                       │ [tool 1..n]│
                                       └────────────┘
\`\`\`

## 5 个判断练习

读到这里你应该有感觉了,做个练习:下面 5 个需求,Workflow 还是 Agent?

| # | 需求 | 答案 | 理由 |
| --- | --- | --- | --- |
| 1 | 每个新订单自动生成快递面单 + 发短信 | Workflow | 流程固定,合规要求高 |
| 2 | 用户问"我家空调坏了怎么办" | Agent | 输入开放,需要判断 |
| 3 | 财报数据每月 8 号自动出可视化报告 | Workflow | 数据/流程都固定 |
| 4 | 用一段话生成 PPT 大纲 | 边界 | 单步 Agent 即可,基本是 Workflow + 1 步 LLM |
| 5 | 给我做一份"出海日本的市场调研" | Agent | 需要 5-10 步搜索 + 综合 |

## 反向案例:用 Workflow 做应该用 Agent 的事

某客户最初用 Workflow 做"客户问题分类 + 自动回复":写了 12 个 if-else 分支,前 3 周准确率 70% 还行。第 4 周用户开始问"我账号被盗了能不能退款"这种**跨分支问题**,Workflow 一律错分,客服投诉飙升。后来改成 Agent + 3 个工具(查订单、查账户、查物流),准确率冲到 88%,代码反而少了一半。

教训:**当输入开始"越界",Workflow 就该让位给 Agent**。

## 混合架构:三种嵌套模式

实战中纯 Workflow 或纯 Agent 都罕见,**90% 的生产系统是嵌套结构**:

| 模式 | 结构 | 例子 |
| --- | --- | --- |
| 大 Workflow 包小 Agent | 流水线某一步交给 Agent 决策 | 文章生成流水线里"选标题" |
| 大 Agent 包小 Workflow | Agent 调用的工具内部是流水线 | "下单"工具里包含完整支付流程 |
| 并列 + 路由 | 入口判断,简单走 Workflow,复杂走 Agent | 客服系统 80% 简单问题 → 模板,20% → Agent |

> ✅ **决策法则**:**目标越明确,选 Workflow;输入越开放,选 Agent**。两者可以嵌套 — 顶层 Workflow,某一步是 Agent;或顶层 Agent,某个工具实现是 Workflow。

:::figure caption="Workflow 与 Agent 的嵌套关系" alt="嵌套图"
:::

## 团队视角:不同角色的偏好

- **后端工程师**通常天然偏好 Workflow — 因为它"像普通代码"
- **算法/ML 工程师**通常偏好 Agent — 因为它"更靠近模型能力"
- **产品经理**偏好 Workflow — 因为"流程可画、可改、可测"
- **创始人**偏好 Agent — 因为"看起来更智能,demo 更好讲故事"

如果这些角色在同一个团队,**起手用 Workflow 上线,留出"某一步可以替换为 Agent"的接口**。这样既能稳住交付,又给后续升级留口。

## 决策树:给你一个 30 秒判断法

第一次面对"该用哪个"的问题,跟着这个决策树走:

\`\`\`text
1. 输入是否结构化、固定?
   ├─ 是 → Workflow
   └─ 否 ↓
2. 任务步骤是否能事先列清?
   ├─ 是,且 ≤ 5 步 → Workflow
   └─ 否 ↓
3. 错了后果严重吗(钱/人/合规)?
   ├─ 是 → Workflow + 人工确认
   └─ 否 ↓
4. 需要长期记忆吗?
   ├─ 是 → Agent + DO
   └─ 否 → Agent + 单次循环
\`\`\`

这个决策树在 80% 的真实需求上能给出"正确够用"的方案。剩下 20% 的边界场景,就需要具体讨论了。

## 团队渐进迁移路径

如果你团队已经有一套老的 Workflow 系统,**不要全盘重写**。渐进迁移路径:

1. 找出当前 Workflow 里"最常因输入变化而调整代码"的步骤
2. 把这一步抽象成"工具",其余保持 Workflow 结构
3. 替换这一步为"调一次 LLM,让它选用哪个工具"
4. 跑两周对比,胜率 > 老版本 + 5%,扩大到下一步

这种"渐进 Agent 化"风险最小,迁移路径上始终有可回滚的版本。**全量重写 Agent 系统的项目,90% 在 3 个月后回到了 Workflow**。

## 一个"走错路又改回来"的真实故事

某客户最初做"AI 简历助手",用纯 Agent 设计:用户上传简历,Agent 自由调"分析""润色""排版""推荐岗位"四个工具。上线后用户反馈"每次结果都不一样,有时候不分析直接改写,有时候没改完就推荐岗位",**体验混乱**。

我们的改造:**Workflow 顶层(解析 → 分析 → 润色 → 推荐 → 报告),只在"润色"和"推荐"两步用 Agent 决策**。结果一致性显著提升,用户满意度从 3.2/5 上升到 4.6/5,而且工程上更易调试。

教训:**用户期望"产品"而不是"魔法"**。Agent 的灵活性是工程师的爽点,但用户要的是"我知道接下来会发生什么"的确定感。

## 边缘场景的特殊考虑

边缘运行时对两者都友好,但要注意:

- **Workflow** 适合用 Cloudflare Workflows(原生 durable execution,失败自动续跑)
- **Agent** 适合用 Workers + Durable Objects(一个 DO 实例 = 一个 Agent 会话)
- 不要在普通 stateless Worker 里跑 Agent,**多轮上下文会丢**
- Workers 单请求 CPU 上限默认 50ms,**Agent 主循环要拆步骤**,不要塞在一个 Worker 调用里跑完 6 轮

下一章我们正式动手 — 先 5 分钟跑通第一个 Edge Agent,然后逐步给它加状态、加工具、加流式。
`

const s_hello_agent = `
# 2.1 Hello, Edge Agent — Workers AI 起手式

理论铺垫到此为止。这一节我们用不到 50 行代码,在 Cloudflare Workers 上跑出第一个真正的 Edge Agent — 收到用户问题、过模型、流式返回答案。整个过程**不需要后端服务器,不需要 Docker,不需要 GPU**,在你的笔记本上、用 \`npm run dev\` 就能起来。

## 0 准备工作(已经做过可跳)

\`\`\`bash
npm create cloudflare@latest hello-edge-agent -- --type=hello-world --ts
cd hello-edge-agent
\`\`\`

这一行命令做了三件事:**生成一个最简 Worker 模板、装好 TypeScript、配好 wrangler 启动脚本**。生成器会问你"要不要部署"——选 No,我们先在本地跑通再部署。

修改 \`wrangler.toml\`,加入 AI binding:

\`\`\`toml
name = "hello-edge-agent"
main = "src/index.ts"
compatibility_date = "2026-01-15"

[ai]
binding = "AI"
\`\`\`

> 💡 **提示** \`compatibility_date\` 要写实际日期。早于 2024-09 的 date Workers AI 部分模型不可用。\`binding = "AI"\` 这一行声明了"在我的代码里能通过 \`env.AI\` 访问 Workers AI" — binding 是 Cloudflare 的"依赖注入"机制,你会在后面看到 \`KV\` \`D1\` \`R2\` 全用这个模式。

## 1 写一个会聊天的 Worker(40 行)

\`\`\`typescript
// src/index.ts
export interface Env {
  AI: Ai;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== "POST") {
      return new Response(HTML, { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    const { message } = await req.json<{ message: string }>();

    const stream = await env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        messages: [
          { role: "system", content: "你是一名边缘工程师助理,回答务必简洁。" },
          { role: "user", content: message },
        ],
        stream: true,
      }
    );

    return new Response(stream, {
      headers: { "content-type": "text/event-stream" },
    });
  },
};

const HTML = \`
<!doctype html>
<form onsubmit="event.preventDefault();ask(this.q.value)">
  <input name="q" placeholder="问点什么..."><button>问</button>
  <pre id="out"></pre>
</form>
<script>
async function ask(q){
  const r = await fetch('/', {method:'POST', body: JSON.stringify({message:q})});
  const reader = r.body.getReader(), dec = new TextDecoder();
  for(;;){const {value, done} = await reader.read(); if(done) break;
    out.textContent += dec.decode(value);
  }
}
</script>
\`;
\`\`\`

逐行拆解给你看:

- \`export default { async fetch ... }\` — Workers 的入口签名,**每个 HTTP 请求都进这里**
- \`req.method !== "POST"\` — GET 返回静态 HTML,POST 才走模型;这是一个"前端 + 后端"合体的最小完整应用
- \`env.AI.run(...)\` — Cloudflare 注入的 binding,直接调用 Workers AI 模型,**不需要 API Key**
- \`stream: true\` — 让 Workers AI 返回一个 \`ReadableStream\`,我们把它直接透传给浏览器
- \`text/event-stream\` — SSE 协议头,浏览器会持续读取,而不是等响应结束才显示

最妙的一点:**整个文件不需要任何 npm 包**。Workers 的 runtime 自带 \`fetch\` \`ReadableStream\` \`TextDecoder\`,binding 由 wrangler 在部署时注入。

## 2 本地跑

\`\`\`bash
npm run dev
\`\`\`

打开 http://localhost:8787,输入「介绍下 Durable Objects」,你会看到 token 一个个流式跳出来。**这是一个完整的、能流式返回的、跑在边缘 V8 isolate 里的 AI Agent**(目前是无记忆版本,下一节就加)。

第一次启动 wrangler 会问"用本地模型还是远程模型"。选 **remote**,这样会真实命中 Workers AI 的 GPU,体感和上线后一致。

## 3 部署到全球 300+ 节点

\`\`\`bash
wrangler deploy
\`\`\`

输出:

\`\`\`text
✓ Uploaded hello-edge-agent
✓ Deployed to:
  https://hello-edge-agent.<your-subdomain>.workers.dev
\`\`\`

> ✅ **TAKEAWAY** 你刚才做的事在 5 年前需要:1 台带 GPU 的服务器、1 套部署脚本、1 个反向代理、1 个 SSL 证书、1 个负载均衡。现在 \`wrangler deploy\` 一行命令搞定,且首字延迟 < 300ms。

## 4 第一次看到流式跳字的瞬间

如果你之前只用过 ChatGPT 网页版,看到自己写的代码也能"一个字一个字"地往外吐时,会有种"原来这玩意儿一点也不神秘"的感觉。这种感觉很重要 — 它是从"消费 AI"到"创造 AI 产品"的心智切换。

很多人卡在"我懂模型理论,但不会做产品"的阶段,**症结其实是没亲手让模型在自己的代码里跑起来过**。Hello Agent 解决的就是这件事。Workers AI 提供的 binding 把"调用模型"压缩成一行 \`env.AI.run\`,你不需要管 API Key、不需要管 rate limit headers、不需要管 SSE 编码 — 这就是边缘原生平台的杠杆。

## 5 常见错误与排查

新人跑这段代码,最常踩的几个坑:

| 报错 | 原因 | 解法 |
| --- | --- | --- |
| \`Property 'AI' does not exist on type 'Env'\` | 没生成 binding 类型 | 跑 \`wrangler types\` 重新生成 |
| \`AI binding not found\` | wrangler.toml 没加 \`[ai]\` 段 | 加上 \`binding = "AI"\` 重启 |
| 浏览器只显示"问"按钮不动 | 没看到响应 token | 打开 DevTools → Network → 看 EventStream 列 |
| 流式中断、显示 \`text/event-stream\` 头乱码 | 客户端用了错的 decode | 用 \`TextDecoder("utf-8", {stream:true})\` |
| 输出夹杂 \`data: {...}\` JSON | Workers AI 的 SSE 包装格式 | 客户端要拆 \`data:\` 前缀解析 JSON |

最后一条比较坑 — Workers AI 的 SSE 不是裸 token,而是 \`data: {"response":"你"}\\n\\n\` 这种格式。完整客户端解析见下:

\`\`\`typescript
const reader = r.body!.getReader();
const dec = new TextDecoder("utf-8", { stream: true });
let buf = "";
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buf += dec.decode(value);
  const lines = buf.split("\\n");
  buf = lines.pop()!;
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const json = line.slice(6);
    if (json === "[DONE]") return;
    out.textContent += JSON.parse(json).response ?? "";
  }
}
\`\`\`

## 6 换模型只改一行

想试更聪明的模型?把 \`@cf/meta/llama-3.1-8b-instruct\` 改成下面任一个,**其他代码不动**:

\`\`\`typescript
"@cf/meta/llama-3.3-70b-instruct-fp8"        // 大模型,质量好,贵 30 倍
"@cf/qwen/qwen2.5-coder-32b-instruct"        // 写代码用
"@cf/mistralai/mistral-small-3.1-24b-instruct" // 平衡
\`\`\`

> 💡 **提示** 上线前一定要在你的真实任务上跑对比 — **不要假定"更大 = 更好"**。某些任务 8B 模型加好 prompt 就能打过 70B,而成本差 30 倍。

## 7 调一调 system prompt 看效果

把 system content 从「你是一名边缘工程师助理,回答务必简洁」换成下面这段,再问"介绍下 Durable Objects":

\`\`\`text
你是一名严苛的边缘工程师助理。要求:
1. 回答 ≤ 80 字
2. 必须给一个 2 行代码示例
3. 不能用"建议""可以""推荐"这类弱词
\`\`\`

输出立刻变成「短句 + 代码片段」的工程文档风。**Prompt 的杠杆比模型大小更大** — 这是新人最容易忽视的事实。

## 8 把它接到自己的域名

\`workers.dev\` 子域适合测试,真正上线建议绑自己的域名。流程是:在 Cloudflare DNS 里加一条 CNAME 到你的 worker,再去 worker 的 settings 里添加 custom domain。**TLS 证书由 Cloudflare 自动签发并续期**,你不需要管 Let's Encrypt 那一套。

绑域名的另一个好处:跨域 (CORS) 自动消失。你的前端在 \`app.yourdomain.com\`,Agent 在 \`api.yourdomain.com\`,浏览器视为同源,fetch 直接走通,不需要写 OPTIONS preflight 处理。

## 9 给它加上"会话保护"

刚才的 Hello Agent 是开放的,任何人都能调,模型成本由你承担。上线前至少要加一层"会话令牌":前端首次访问拿 token,后续每次请求带它过来。最小实现:

\`\`\`typescript
// 颁发 token(GET /token)
const token = crypto.randomUUID();
await env.SESSIONS.put(\`tok:\${token}\`, "1", { expirationTtl: 3600 });
return Response.json({ token });

// 验证 token(POST /)
const t = req.headers.get("x-session");
const ok = t && (await env.SESSIONS.get(\`tok:\${t}\`));
if (!ok) return new Response("forbidden", { status: 403 });
\`\`\`

这只是入门版,第 4.3 节我们会做完整的 JWT + 计费方案。**但即使最简版本,也比裸 Agent 安全 10 倍**。

## 10 看一眼成本

| 调用 | 模型 | 单价 | 1000 次成本 |
| --- | --- | --- | --- |
| 你刚跑的 | Llama 3.1 8B | $0.011 / 100 万 tokens(input) | <$0.01 |
| 升级到 70B | Llama 3.3 70B | $0.40 / 100 万 tokens | $0.20 左右 |
| 用 GPT-4o 兜底 | 通过 AI Gateway 转发 | OpenAI 原价 | $5+ |

实际上,Hello Agent 这种简短交互(用户问、模型答),平均一次 200-500 token 输入 + 100-300 token 输出。**以 8B 模型计算,一次会话成本不到 1 分钱人民币**。一万次会话不到 100 元。这是边缘 + 小模型的经济性。

## 11 上线前的 production checklist

跑通 Hello 还不是 production,**上线前至少过这 8 项**:

1. **错误处理**:模型超时、binding 失败、JSON 解析失败要有兜底响应
2. **超时保护**:Worker 单次 CPU 上限要在 wrangler.toml 配清楚
3. **日志结构化**:用 \`console.log(JSON.stringify(...))\`,便于 Logpush 解析
4. **速率限制**:加 IP/用户两层限流,见 4.3 节
5. **CORS**:跨域请求显式 allowlist,不要无脑 \`*\`
6. **环境分离**:prod/staging 分两套 Workers + 分两套 binding
7. **健康检查**:暴露 \`/health\` 端点,返回模型可用性
8. **回滚预案**:\`wrangler rollback\` 命令记进 runbook

这八项是 SRE 视角的最小集合。Hello Agent 满足前 4 项即可上线 demo,8 项全过才能算 production-ready。

## 12 阶段性回顾

跑到这里你已经拥有:**一个能流式回答问题、部署在全球、可换模型、可自定义 prompt、有最小会话保护的 AI Agent**。代码 50 行不到,本地启动一行命令,部署一行命令,月成本不到一杯咖啡。

但它还有几个明显短板:不记得上一轮说过什么、不会调工具、不能查私有数据。**这正是后续 12 节要解决的事**。

**只有写代码的人最先获得这个时代的杠杆**。下一节我们给这个 Hello Agent 加上「记忆」与「主循环」,让它能记住多轮对话、调工具、做规划。
`

const s_main_loop = `
# 2.2 Agent 主循环:Perception → Plan → Action → Observe

Hello Agent 只能单轮回答,严格意义上它还不算 Agent — 它只是一个聊天端点。要让它成为真正的 Agent,得给它装上**主循环**:能感知环境、规划步骤、执行动作、观察反馈,直到任务完成或主动停止。这一节我们把这个循环写出来,并对比业界主流的三种实现范式。

## ReAct vs CoT vs ToT:为什么我们选 ReAct

社区里至少有三种主流的"模型推理范式",新人最容易混淆:

| 范式 | 全称 | 关键特征 | 我们用吗 |
| --- | --- | --- | --- |
| CoT | Chain of Thought | 一次推理写完整思考链 | 部分,但不够 |
| ToT | Tree of Thoughts | 同时展开多个推理树后剪枝 | 高级用,默认不用 |
| ReAct | Reason + Act | 思考 → 行动 → 观察的循环 | **主要实现方式** |

ReAct 的核心洞察:**让模型"想一步、做一步、看一步"**,比让它"一次想清楚所有"靠谱得多。原因是 LLM 没有真实世界的反馈,只能在每一步行动后用外部观察来"校准"自己的推理。

## ReAct 循环的经典图

\`\`\`text
            ┌──────────────────────────────────┐
            │                                    │
            ▼                                    │
    ┌─────────────┐    ┌─────────────┐         │
    │ Perception   │──▶ │   Plan       │         │
    │ (新输入)     │    │ (LLM 推理)   │         │
    └─────────────┘    └─────┬───────┘         │
                              │                  │
                              ▼                  │
                       ┌─────────────┐           │
                       │  Action      │           │
                       │ (调工具/答复)│           │
                       └─────┬───────┘           │
                              │                  │
                              ▼                  │
                       ┌─────────────┐           │
                       │  Observe     │───────────┘
                       │ (拿结果)     │
                       └─────────────┘
\`\`\`

每一轮的 Plan 不一定调工具,可能直接回答;每一轮的 Observe 不一定有外部输入,可能只是模型的中间反思。**循环退出条件**(stop condition)由你设定 — 通常是「Plan 输出 final 标签」或「达到 max_steps」。

## 一个真实 trace 长什么样

用户问:"帮我看看上海明天适不适合穿短袖出门"。Agent 跑出来的真实 trace:

\`\`\`text
[Step 1] Plan
  thought: "用户问明天上海的着装建议,我需要先查明天天气"
  tool_call: get_weather(city="上海", date="tomorrow")

[Step 2] Observe
  tool_result: {temp_high: 24, temp_low: 17, weather: "晴,微风"}

[Step 3] Plan
  thought: "24°C 高温适合短袖,但 17°C 早晚偏凉,需要建议加件外套"
  final: "明天上海 17-24°C,白天可以穿短袖,早晚最好带件薄外套"
\`\`\`

3 步完成。注意第 1 步模型自己判断"我需要查天气"——这是 Agent 与 Workflow 的本质差异,**没人告诉它要查天气**,它自己决定的。

## 在边缘上实现主循环

边缘的 stateless Worker 默认不能跨请求保留状态。要跑 Agent 主循环,有三种方式:

| 方案 | 状态层 | 适用场景 | 单次延迟上限 |
| --- | --- | --- | --- |
| 单请求循环 | 内存(本次请求) | 短任务、<30 秒 | Workers CPU 上限 |
| Durable Object | DO 内的 \`this.\` | 多轮对话、长会话 | 几乎无 |
| Workflows | Durable execution | 异步长任务,可重启 | 几乎无,失败可续 |

下面给单请求循环的最小实现 — 它已经能完成 80% 的边缘 Agent 需求。

\`\`\`typescript
type Msg = { role: "system" | "user" | "assistant" | "tool"; content: string; name?: string };

async function runAgent(env: Env, history: Msg[], maxSteps = 6): Promise<Msg[]> {
  for (let step = 0; step < maxSteps; step++) {
    const res = await env.AI.run("@cf/meta/llama-3.1-70b-instruct", {
      messages: history,
      tools: TOOLS,   // 下一节细讲
      stream: false,
    });

    const choice = (res as any).response;

    // 1) 模型决定直接回答 → 退出循环
    if (!choice.tool_calls?.length) {
      history.push({ role: "assistant", content: choice.content });
      return history;
    }

    // 2) 模型决定调工具 → 把 assistant 决策入栈
    history.push({ role: "assistant", content: JSON.stringify(choice) });

    // 3) 依次执行工具,把结果作为 observe 入栈
    for (const call of choice.tool_calls) {
      const out = await executeTool(env, call.name, call.arguments);
      history.push({ role: "tool", name: call.name, content: JSON.stringify(out) });
    }
  }
  // 走完仍未收敛 — 用最后一轮模型输出作答
  return history;
}
\`\`\`

> ⚠️ **注意** \`maxSteps\` 是**护栏不是配置**。生产环境一定要设,而且要在 LLM 调用前检查 \`history.length\` 是否过长(超过 32k context 会直接 fail)。

## max_steps 的经验值

不同任务类型的 max_steps 经验值,可以打印贴墙上:

| 任务类型 | max_steps | 平均实际步数 |
| --- | --- | --- |
| 单工具问答(查天气、查股价) | 3 | 1.2 |
| 多工具综合(查 + 算 + 写) | 6 | 3.5 |
| RAG 问答 + 工具 | 8 | 4.0 |
| 编程辅助、文档生成 | 12 | 6.5 |
| 深度规划、研究任务 | 20-30 | 10+ |

**实际步数 / max_steps < 50%** 才说明上限设得合理。如果常年贴近上限,要么是任务太难,要么是工具粒度不对(下一节会讲)。

## 退出条件设计的三种风格

| 风格 | 退出信号 | 适合 |
| --- | --- | --- |
| Max-step | 步数上限 | 探索型任务 |
| Goal-check | 每步用小模型判断"完成度" | 多目标 |
| Explicit-final | 让模型必须输出 \`<final>...</final>\` 标签 | 高确定性场景 |

Goal-check 的小技巧:用一个 **8B 的便宜模型**做"完成度判官",问它"任务完成了吗?Yes/No",成本极低且准确率不错。

## 加上反思(Reflection)的进阶版

ReAct 的进化版叫 **Reflexion**:让 Agent 在每一步后多走一步"自我评估"。最简单的实现就是在 prompt 里加一句:

> "在每次调用工具前,先用一句话评估上一步的结果是否满足目标。如果不满足,说出改正的策略。"

实测下来,反思能把多步任务的成功率从 ~60% 拉到 ~80%,代价是每步多 1 次模型调用。**生产环境只在 max_steps 的后半段触发反思**,平衡成本与质量。

## OpenAI Agents SDK vs 手写主循环

2025 年底 OpenAI 发布了 \`agents\` SDK,几行代码就能跑出"自动循环 + 工具调用"。它和我们手写的循环差在哪?

| 维度 | OpenAI Agents SDK | 手写主循环 |
| --- | --- | --- |
| 上手速度 | 5 分钟 | 30 分钟 |
| 跨模型 | 只支持 OpenAI 系 | 任意 |
| 自定义循环逻辑 | 有限 | 完全自由 |
| 边缘部署 | Workers 上不友好(Node-only) | 原生跑通 |
| 可调试性 | 中(黑盒) | 高(全自控) |

**我们手写**的好处:跨模型、可在边缘 V8 isolate 里跑、循环行为完全可控。SDK 适合做内部工具或原型,**正式产品建议手写,留可控性**。

## 状态机式 vs LLM 决策式

主循环还有一种"伪 Agent"变体 — 状态机式:你预先定义状态(\`分类问题 → 检索 → 综合\`),每个状态结束后用规则决定下一个,只在"综合"那一步用 LLM。

| 模式 | 优点 | 缺点 |
| --- | --- | --- |
| 状态机式 | 可预测、便宜、可调试 | 只能处理已知模式 |
| LLM 决策式 | 处理未知模式 | 贵、慢、有时绕圈 |

**新人的最优解**:**主循环写状态机式,把"未知输入"的分支留给 LLM 决策**。这样 80% 流量走便宜路径,20% 复杂问题才用大模型。

## max_steps 的产品意义

工程上 max_steps 是护栏,**产品上它是定价单位**。Free 用户 max_steps=3,Pro 用户 max_steps=6,Enterprise max_steps=12。这是一个简单又有效的产品分层方式:**复杂度直接映射到价格**,用户自己感知"我用得多 = 我需要升级"。

## 防卡死与防绕圈

Agent 主循环最常见的两个失败:

**卡死**(stuck):连续 N 步调同一个工具,参数几乎不变。检测方法:

\`\`\`typescript
function detectStuck(history: Msg[]): boolean {
  const recent = history.slice(-6).filter((m) => m.role === "assistant");
  const calls = recent.map((m) => m.content);
  return new Set(calls).size < calls.length / 2; // 重复率 > 50%
}
\`\`\`

**绕圈**(loop):A 工具结果触发 B 工具,B 结果又触发 A,反复横跳。检测方法:看历史调用序列里是否存在 ABAB 模式,出现两次就强制终止。

检测到这两种情况,**直接终止 + 用最后一轮拼出兜底回答**,不要让循环继续烧 token。

> ✅ **TAKEAWAY** 主循环不是写 while(true),而是「**在受控步数内,允许模型有限自主**」。Agent 的优雅 = 收敛性 + 可观测性 + 兜底机制。

下一节我们给 Agent 装上手脚 — **工具调用(Tool Use)**,这是上面这个循环里 \`TOOLS\` 和 \`executeTool\` 的完整展开。
`

const s_tool_use = `
# 2.3 在边缘上做 Tool Use(函数调用)

工具是 Agent 的"手",没有工具的 Agent 等于一个只会说话的鹦鹉。这一节我们在 Workers 上注册三个工具:**查天气、查数据库、发邮件**,并把它们暴露给模型;同时讲清工具设计、JSON Schema 踩坑、并发调用、失败重试这些"教程里很少讲、生产里天天遇"的细节。

## 工具的本质

一个工具 = **一段函数签名 + 一段实现**。模型看到签名,在合适的时候输出 \`tool_call\`,运行时执行实现,把结果返回给模型,模型继续推理。

\`\`\`typescript
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "查询某个城市当前天气",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "城市名,中文或拼音" },
        },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_user",
      description: "根据 user_id 查数据库取用户档案",
      parameters: {
        type: "object",
        properties: { user_id: { type: "string" } },
        required: ["user_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "向指定邮箱发送一封纯文本邮件",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
] as const;
\`\`\`

## 工具实现 — 边缘视角

边缘最大的优势:每个工具实现本身就是一段可在 V8 isolate 里直接跑的 fetch 调用,不用容器、不用 SDK 安装。

\`\`\`typescript
async function executeTool(
  env: Env,
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "get_weather": {
      const r = await fetch(\`https://wttr.in/\${args.city}?format=j1\`);
      return await r.json();
    }
    case "query_user": {
      const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
        .bind(args.user_id).first();
      return row ?? { error: "not_found" };
    }
    case "send_email": {
      // 例如对接 Resend
      return await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "authorization": \`Bearer \${env.RESEND_KEY}\`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: "agent@yourdomain.com",
          to: args.to, subject: args.subject, text: args.body,
        }),
      }).then((r) => r.json());
    }
    default:
      return { error: "unknown_tool", name };
  }
}
\`\`\`

## 工具设计的 5 条准则

> ✅ **设计准则**
> 1. **名字像 API,不像函数** — \`get_weather\` 比 \`weather()\` 好理解
> 2. **参数尽量字符串化** — 模型对 string/number 处理最稳
> 3. **必填项写进 required** — 缺一就让模型问用户
> 4. **错误要返回 JSON,不要 throw** — Agent 会自我修复
> 5. **同步返回,长任务异步化** — 别让单步阻塞超过 5 秒

## JSON Schema 的 4 个常见坑

新人在工具 schema 上踩的坑,90% 都是这 4 个:

| 坑 | 现象 | 修法 |
| --- | --- | --- |
| 用 \`enum\` 限制取值忘了写 description | 模型瞎填 enum 值 | enum + description 一起写,告诉它每个值的含义 |
| optional 参数没标 default | 模型把每个 optional 都填上,污染下游 | 在 description 里说"如未指定,留空即可" |
| array 参数没说明元素类型 | 模型给字符串/对象混合数组 | 显式写 \`items: {type:"string"}\` |
| 用了嵌套 object 但层级太深 | 模型乱套结构,工具收到 \`{a:{b:{c:null}}}\` | 嵌套不超过 2 层,深结构拆成多个扁平工具 |

经验法则:**JSON Schema 越扁平、字段越少、描述越具体,模型调对的概率越高**。复杂参数不如拆成 2-3 个简单工具。

## 工具粒度:粗 vs 细

工具该多大?这是设计 Agent 时的核心权衡:

| 粒度 | 例子 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 粗粒度 | \`process_order(order_id)\` 内部包含查/校验/扣款/发货 | 模型调用次数少,失败点集中 | 模型对内部步骤无控制 |
| 细粒度 | 分别提供 \`check_stock\` \`calc_price\` \`charge_card\` \`ship\` | 模型可灵活组合,可中断重试 | 调用链长,token 成本高 |

**通用原则**:**业务原子操作做细粒度,辅助/查询做粗粒度**。比如"扣款"这种关键步骤要单独出工具(便于审计),"查询订单状态"可以一个工具搞定。

## 让模型"少调工具"的 prompt 技巧

工具一多,模型就开始"过度热情" — 一个简单问题也要先调 3 个工具。降低无谓调用的 3 个 prompt 写法:

\`\`\`text
你是一个谨慎的助手。在调用任何工具前,先思考:
1. 这个问题能用我已有的常识直接回答吗?可以 → 直接答
2. 需要工具时,只调最必要的那一个,不要"为了完整性"多调
3. 工具结果已经足够回答时,立刻停下来作答,不要继续探索
\`\`\`

加上这段 system prompt 后,某客户的 Agent 平均工具调用从 4.2 次/会话降到 2.1 次,**token 成本砍半,延迟也快了一倍**。

## 并发执行多个工具

很多模型支持单次 plan 返回**多个工具调用**(\`tool_calls\` 是数组而非单值)。当工具之间无依赖,我们应该**并发执行**:

\`\`\`typescript
// 串行(慢):200ms × 3 = 600ms
for (const call of choice.tool_calls) {
  results.push(await executeTool(env, call.name, call.arguments));
}

// 并发(快):max(200ms, 250ms, 180ms) = 250ms
const results = await Promise.all(
  choice.tool_calls.map((c) => executeTool(env, c.name, c.arguments))
);
\`\`\`

> 💡 **提示** 但要小心 — **有副作用的工具(发邮件、扣款)不要并发**,只对幂等查询并发。

## 工具失败重试策略

工具不可能 100% 成功。设计重试时遵循:

| 错误类型 | 重试? | 怎么做 |
| --- | --- | --- |
| 网络抖动(timeout、5xx) | 是 | 指数退避,最多 3 次 |
| 参数错(4xx) | 否 | 直接返回错误给模型,让它修正参数 |
| 鉴权失败(401/403) | 否 | 直接 abort,让人工介入 |
| 资源不存在(404) | 否 | 返回 \`{error:"not_found"}\` 给模型 |
| 限流(429) | 是 | 退避 + 必要时降级到便宜模型 |

把这套策略包成 \`safeExecuteTool\`,替换 \`executeTool\`,你的 Agent 容错性立刻上一个台阶。

## 工具的版本管理

工具不是写完就不动的 — 业务调整、外部 API 升级、参数扩展,工具都会演化。版本管理三种风格:

| 风格 | 做法 | 适合 |
| --- | --- | --- |
| 加版本后缀 | \`get_weather_v2\` 与 v1 并存 | 不能立刻切量 |
| 参数兼容 | 新版本接受老参数,做转换 | 平滑升级 |
| 灰度切换 | 用 KV 配置项控制走 v1 还是 v2 | A/B 验证 |

**关键纪律**:工具改 schema 的同时,必须把 system prompt 里的"工具描述"也同步改。两者不一致是 Agent 行为退化的常见原因。

## 工具的离线测试与 mock

工具会调外部 API,**真实调用既慢又花钱**,本地开发要 mock:

\`\`\`typescript
const isDev = process.env.ENV === "dev";

async function getWeather(city: string) {
  if (isDev) return MOCK_WEATHER[city] ?? { temp: 20, weather: "晴" };
  return realFetch(\`https://wttr.in/\${city}?format=j1\`);
}
\`\`\`

更进阶:**录制 + 回放**。生产环境录制 100 次真实调用的请求/响应,落到 R2;本地开发回放这些。这种方式调试 Agent 行为时,**完全免费且可复现**。

## 工具描述的 prompt 工程

工具的 \`description\` 字段直接影响模型选不选它。三个写法准则:

- **写"我什么时候用"而不是"我是什么"**:\`"查询某城市当前天气,用户问到天气/出行建议时调用"\` 比 \`"天气查询接口"\` 准确率高 30%
- **给一个反例**:\`"不要用本工具查未来 7 天预报,只查当天/明天"\`
- **示例参数明确**:\`"city 必须是中文城市名,如'上海''北京',不要用拼音"\`

这些写法看起来啰嗦,但能让模型工具选择准确率从 70% 拉到 90%+。

## 安全护栏:不可信工具的两层防御

| 风险 | 防御 |
| --- | --- |
| 模型乱填参数(SQL 注入) | 用 \`prepare().bind()\`,永远不要拼字符串 |
| 工具被反复调用打爆下游 | Workers Rate Limiting + 单次 max_steps |
| 副作用工具被误调(发邮件、扣款) | 高风险工具加 \`requires_confirmation: true\`,前端二次确认 |
| 工具结果含 prompt injection | 工具输出统一加 \`<tool_output>\` 标签包裹 |

:::figure caption="工具调用全链路:模型 → 调度器 → 工具实现 → 观察回填" alt="序列图"
:::

> ⚠️ **注意** 写邮件、扣款、删数据库这种「不可回滚」的工具,**绝不要让 Agent 自动执行**。在 \`executeTool\` 前面加一道人工确认,通过前端 UI 让用户点"确认发送"。即使内测阶段也不要省略 — Agent 在测试时跑出 \`drop table users\` 的事故,行业里已经出现过几起。

下一章我们处理 Agent 最关键的部分:**记忆与状态**。
`

const s_durable_objects = `
# 3.1 Durable Objects:每个会话一个"小宇宙"

Durable Object(DO)是 Cloudflare 在 2020 年推出的「单实例、强一致、贴近用户」的有状态原语。对 Agent 开发来说,它几乎是为我们量身定做的 — **一个 DO 实例 = 一个 Agent 会话**。

熟悉 Erlang OTP 的同学可以把 DO 看作"分布式 actor":每个 DO 实例就是一个 actor,有自己的邮箱(请求队列)、自己的状态(内存 + 存储)、单线程处理消息。Akka、Orleans 也是同源思路 — 区别是 DO 把"全网唯一性"和"按需就近迁移"做到了运行时层面,你不用管路由,只管命名。

## DO 的三条核心承诺

1. **全球唯一性**:对同一个 ID,全网永远只有一个活跃实例
2. **强一致性**:实例内的内存 + 存储是事务级的
3. **就近迁移**:实例会自动迁移到调用方最近的数据中心

\`\`\`text
                用户 A(东京)
                    │
                    ▼
        ┌──────────────────────┐
        │  Worker(东京边缘)    │
        └──────────┬───────────┘
                    │ stub.fetch
                    ▼
        ┌──────────────────────┐
        │  DO 实例 "session-A1" │  ←  全网唯一,带状态
        │  - history[]          │
        │  - userProfile        │
        │  - persistent storage │
        └──────────────────────┘
\`\`\`

## 为什么 DO 比 Redis 适合 Agent

把"会话状态放 Redis"是过去 10 年的标准答案。换成 DO 之后,有 4 个肉眼可见的优势:

1. **就近迁移**:Redis 在 us-east,中国用户每次操作来回 300ms;DO 自动跑到东京/香港节点,延迟降到 30ms
2. **无连接池**:Redis 的连接数是稀缺资源,Workers 高并发下要排队;DO 是 fetch 调用,无连接池概念
3. **事务即代码**:DO 实例内单线程,你不需要加锁、不需要 MULTI/EXEC,普通的 \`this.foo = bar\` 就是事务
4. **持久免费**:Redis 默认易失,持久化要配 AOF/RDB 还要带带宽;DO 默认持久,持久层免费

唯一的缺点:**DO 内的代码不能跨实例共享内存**,如果你要做全局排行榜、跨用户分析,还是要外接 D1 或 Analytics Engine。

## 用 DO 给 Hello Agent 加记忆

\`\`\`typescript
export class AgentSession {
  state: DurableObjectState;
  env: Env;
  history: Msg[] = [];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      this.history = (await state.storage.get<Msg[]>("history")) ?? [];
    });
  }

  async fetch(req: Request): Promise<Response> {
    const { message } = await req.json<{ message: string }>();
    this.history.push({ role: "user", content: message });

    const final = await runAgent(this.env, this.history);
    this.history = final.slice(-30);   // 滑动窗口,只留最近 30 条

    await this.state.storage.put("history", this.history);
    return Response.json({ reply: final.at(-1) });
  }
}
\`\`\`

在 Worker 入口路由到 DO:

\`\`\`typescript
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const sessionId = new URL(req.url).searchParams.get("sid") ?? "anon";
    const stub = env.SESSIONS.get(env.SESSIONS.idFromName(sessionId));
    return stub.fetch(req);
  },
};
\`\`\`

\`wrangler.toml\`:

\`\`\`toml
[[durable_objects.bindings]]
name = "SESSIONS"
class_name = "AgentSession"

[[migrations]]
tag = "v1"
new_classes = ["AgentSession"]
\`\`\`

## DO 的三种存储模式对比

| 模式 | API | 容量 | 速度 | 持久 |
| --- | --- | --- | --- | --- |
| In-memory | \`this.foo = 1\` | 受 Worker 内存限制(128MB) | 即时 | 重启丢失 |
| KV-like 持久 | \`state.storage.get/put\` | 单值 128KB,总量无限 | <5ms | ✅ |
| SQLite | \`state.storage.sql\` | 单 DO 上限 1GB | <2ms | ✅(2025 公开) |

> ✅ **TAKEAWAY** 把短期上下文塞 in-memory,把长期记忆塞 KV-like,把结构化数据塞 SQLite。三档分明,不要混。

## Actor 模型的两个优势在 Agent 上特别明显

如果你用过 Akka / Orleans / Erlang,会立刻明白 DO 给 Agent 带来的两个红利:

**1. 单线程内的状态安全**:Agent 主循环涉及多次模型调用 + 工具调用 + 状态更新,在传统多线程 server 上要小心锁。DO 内单线程串行,**\`this.history.push(...)\` 就是事务**,所有 race condition 直接消失。

**2. "永远在线"的错觉**:逻辑上一个用户的 DO 永远在那,实际它在空闲时被休眠到磁盘,有请求就秒级唤醒。**你不需要写"断线重连"代码** — DO 是"一个永远存在的服务",这种抽象大幅简化 Agent 长会话的工程复杂度。

## DO 实例命名策略

DO 是按 ID 路由的,**ID 怎么取直接决定了你的产品形态**。常见模式:

| 命名策略 | 用法 | 适合 |
| --- | --- | --- |
| Per-user(\`user-\${uid}\`) | 一个用户一个 DO,所有会话共享 | 个人助理 |
| Per-session(\`sess-\${sid}\`) | 一次对话一个 DO,关闭即丢 | 客服一次性问答 |
| Per-document(\`doc-\${did}\`) | 文档协作,多人共改一个 DO | 协同 Agent、白板 |
| Per-room(\`room-\${rid}\`) | 多人共享一个 Agent,广播消息 | 群聊式 Agent |
| Per-tenant(\`org-\${oid}\`) | 一个企业客户共用一个 DO | B2B SaaS |

> 💡 **提示** 命名一旦上线,**改名 = 数据丢失**(新 ID 映射到全新实例)。设计阶段就要想好:这个 DO 的"生命单位"是用户、会话、文档还是企业?选错了后期迁移很痛苦。

## alarm:让 DO 自己"做家务"

DO 内置 \`storage.setAlarm(timestamp)\` API,**到点会自动唤醒并执行 \`alarm()\` 方法**。这是边缘上跑后台任务的最佳工具,常用场景:

\`\`\`typescript
async fetch(req: Request) {
  // 每次活动后,把下次"自杀"时间推到 30 天后
  await this.state.storage.setAlarm(Date.now() + 30 * 24 * 3600_000);
  // ... 正常处理
}

async alarm() {
  // 时间到了还没活动 → 摘要 + 归档
  const history = await this.state.storage.get<Msg[]>("history") ?? [];
  if (!history.length) return; // 已清理过
  const summary = await summarize(this.env, history);
  await this.env.ARCHIVE.put(\`session-summary-\${this.state.id}\`, summary);
  await this.state.storage.deleteAll(); // 释放计费
}
\`\`\`

这套模式同时解决了**自动清理**和**长期记忆压缩** — 一举两得。

## DO 之间通信

实战中经常需要 DO A 调 DO B(比如"用户" DO 通知"群聊" DO 有新消息)。两种方式:

\`\`\`typescript
// 方式 1:直接拿 stub.fetch 调
const groupStub = env.GROUPS.get(env.GROUPS.idFromName(groupId));
await groupStub.fetch("https://internal/notify", {
  method: "POST", body: JSON.stringify({ from: userId, text }),
});

// 方式 2:通过 Queues 异步派发(解耦,容错好)
await env.GROUP_QUEUE.send({ groupId, from: userId, text });
\`\`\`

通常 query 用方式 1,通知/事件用方式 2。

## SQLite-backed DO:2025 关键升级

2025 年中 Cloudflare 给 DO 加了**原生 SQLite 接口**,直接在 DO 内跑 SQL,这是 Agent 工程的重大利好。一个简单例子:在每个用户 DO 里存"个性化偏好":

\`\`\`typescript
async fetch(req: Request) {
  this.state.storage.sql.exec(\`
    CREATE TABLE IF NOT EXISTS prefs (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER
    )
  \`);
  const cursor = this.state.storage.sql.exec(
    "SELECT value FROM prefs WHERE key = ?", "theme"
  );
  const theme = cursor.one()?.value ?? "light";
  return Response.json({ theme });
}
\`\`\`

这意味着每个用户都有自己的"私人数据库",**强一致 + 就近 + 0 运维**。在 D1 之上多了一档非常实用的工具。

## Hibernate 模式:节省计费

DO 默认"接到请求才唤醒",但只要内存里有 listener(WebSocket、in-progress task),就会持续计费。**Hibernate 模式**让 DO 在 WebSocket 没消息时挂起,有消息再唤醒:

\`\`\`typescript
async fetch(req: Request) {
  if (req.headers.get("upgrade") === "websocket") {
    const pair = new WebSocketPair();
    this.state.acceptWebSocket(pair[1]); // 开启 hibernation
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
}

// 上面 acceptWebSocket 替代了 server.accept(),CF 会在空闲时
// 把整个 DO 挂起到磁盘,有事件再恢复
\`\`\`

**月度计费可降 80%+**。语音陪练、长会话场景必开 hibernation。

## DO 迁移与回滚

DO 的实例数据是持久的,**改 class_name 等于丢数据**。安全迁移步骤:

1. 新增 \`v2\` class,与 v1 并存
2. 写迁移逻辑:v1 实例在第一次 fetch 时把数据导出到 KV/D1
3. 路由层渐进切到 v2(新用户走 v2,老用户保留 v1 直至自然清理)
4. 老 class 一段时间无活动后 \`delete\`

回滚:Workers 的版本管理可一键切回,**但 DO 数据格式变化是单向的**,提前用 KV 做"原始数据快照",回滚时可重建。

## 警惕:DO 的常见坑

| 坑 | 现象 | 解法 |
| --- | --- | --- |
| 长期不释放的 history 数组 | 第 N 轮 prompt 超 32k 直接 fail | 滑动窗口 + 摘要重写 |
| 在 constructor 里写 \`await\` 但忘了 blockConcurrencyWhile | 偶发空 state | 必须用 \`state.blockConcurrencyWhile\` |
| DO 实例数膨胀(每用户一个) | 计费暴涨 | 用 alarm 在 30 天无活动后自删 |
| 跨 DO 事务幻想 | DO A 和 DO B 之间无原子 | 用补偿事务或最终一致 |
| 在 DO 里调外部 API 阻塞 | DO 单线程,排队请求堆积 | 用 \`ctx.waitUntil\` 或外排 Queues |

## 真实的 DO 计费换算

很多人怕 DO 贵,其实算清楚后非常便宜。Cloudflare 当前定价(2026 年初):

- \$0.20 / 100 万请求
- \$12.50 / GB 月持久存储
- \$15.00 / 100 万写入,\$0.20 / 100 万读取

举例:1 万个活跃用户,每用户每天 50 条消息,DO 30 天后自动清理:

| 项 | 用量 | 月费 |
| --- | --- | --- |
| 请求 | 10000 × 50 × 30 = 1500 万 | \$3 |
| 存储 | 平均每用户 50KB × 10000 = 500MB | \$6 |
| 写入 | 1500 万 | \$22.5 |
| **合计** | | **~\$32 / 月** |

1 万 MAU 的 SaaS,DO 月费 \$32 — 比一台 EC2 还便宜,且自动全球部署。

:::figure caption="DO 生命周期:激活 → 处理请求 → 闲置 → 休眠 → alarm" alt="状态图"
:::

下一节我们给 Agent 加上**外部记忆** — KV、D1、R2 各管一摊。
`

const s_storage_zoo = `
# 3.2 KV / D1 / R2 在 Agent 里的角色分工

Durable Objects 适合"每会话一份状态",但很多数据**跨会话共享**:用户档案、知识库、上传的 PDF、生成的图片、模型权重快照。这时候要把数据分流到合适的存储产品 — Cloudflare 给了我们三件套:KV(键值)、D1(关系)、R2(对象)。再加上向量库 Vectorize(下一节专门讲),正好覆盖了 Agent 全栈数据需求。

选错存储是 Agent 工程里最常见的隐藏坑 — 把热数据塞 D1、把对象塞 KV、把强一致需求放最终一致 KV 上,都会在中后期带来巨大返工。这一节我们把每个产品的"性能曲线 + 价格曲线 + 失败模式"摊开讲清。

## 一张图分清

| 产品 | 类型 | 典型用法 | 单 KV/object/行价 |
| --- | --- | --- | --- |
| **KV** | 全球最终一致键值 | 配置、热缓存、feature flag | $0.50 / 100 万读 |
| **D1** | 全球 SQLite | 用户表、订单、结构化业务 | 5GB 免费,$0.75/GB |
| **R2** | S3 兼容对象存储 | 上传文件、生成图、模型权重 | $0.015/GB,**0 出口流量费** |
| **Vectorize** | 向量库 | RAG、语义检索 | 详见 3.3 |

## Agent 视角下的分工

\`\`\`text
                       ┌──────────────┐
                       │   Worker     │
                       │ (Agent 主循环)│
                       └──┬──┬──┬──┬──┘
                          │  │  │  │
              ┌───────────┘  │  │  └────────────────┐
              │              │  │                    │
              ▼              ▼  ▼                    ▼
           ┌────┐         ┌────┐ ┌────┐           ┌──────────┐
           │ KV │ 热缓存   │ D1 │ │ DO │ 会话      │ R2       │
           │    │ 配置     │    │ │    │ 状态      │ 文件     │
           └────┘         └────┘ └────┘           └──────────┘
                              │
                              ▼
                          ┌────────────┐
                          │ Vectorize  │ RAG
                          └────────────┘
\`\`\`

## 每个产品的"性能曲线"

不只是看类型,要看延迟曲线和价格曲线在你的访问模式下落在哪段:

| 产品 | 读延迟 | 写延迟 | 一致性 | 单值上限 | 容量上限 |
| --- | --- | --- | --- | --- | --- |
| KV | <50ms 全球 | 60 秒全球同步 | 最终 | 25MB | 无 |
| D1 | <5ms 主区,30ms 副本 | 主区强一致 | 主区强,副本最终 | 单行无硬限 | 单库 10GB |
| R2 | <10ms 全球 | <50ms | 强一致 | 单对象 5TB | 无 |
| DO storage | <2ms 实例内 | 实例内事务 | 强一致 | 单值 128KB | 单 DO 10GB |
| Vectorize | <30ms | 异步索引 | 最终 | 维度 1536 | 数十亿向量 |

**读 KV 不是"瞬时"** — 边缘节点 cache miss 时回源延迟可能跳到 100ms+。生产时务必测真实地理位置的延迟,不要只看 dashboard 数字。

## 实战 1:把用户档案放 D1

\`\`\`typescript
// 工具实现:query_user
const user = await env.DB
  .prepare("SELECT id, name, plan, prefs FROM users WHERE id = ?")
  .bind(args.user_id)
  .first<{ id: string; name: string; plan: string; prefs: string }>();
\`\`\`

> 💡 **提示** D1 是全球分布的 SQLite,**写入主区域,异步复制到边缘只读副本**。Agent 读多写少非常合适,但要注意写延迟。

## 实战 2:把上传文件放 R2

\`\`\`typescript
async function uploadTool(env: Env, key: string, file: ArrayBuffer): Promise<string> {
  await env.UPLOADS.put(key, file, {
    httpMetadata: { contentType: "application/pdf" },
  });
  return \`https://files.yourdomain.com/\${key}\`;
}
\`\`\`

R2 关键优势:**0 出口流量费**。你的 Agent 生成一张图,用户下载 1 万次,流量费 = $0。

## 三种存储的失败模式

每种产品都有"看起来在工作但悄悄出问题"的模式,这是最难调试的:

| 产品 | 看起来正常但可能在出问题 | 解法 |
| --- | --- | --- |
| KV | 写了立即读 → 偶尔读到旧值 | 写后等 60 秒,或写完同时 put 到本地 cache |
| D1 | 副本和主区瞬时不一致 → 用户写完看不到自己的数据 | 写后强制 \`PRAGMA read_uncommitted=ON\` 或 retry from primary |
| R2 | 大对象上传中断,留下半截文件 | 用 multipart upload,失败可断点续传 |
| DO | 同一 ID 大量并发请求 → 实例排队 | 把热点 DO 拆成 sub-DO(按时间或哈希) |

最坑的是 KV — **它在文档里写"最终一致",但很多人潜意识当成"快一致"用**,上线后出现"用户改完密码,某个边缘节点还能用旧密码登录 30 秒"这类问题。设计时就要把"60 秒不一致"当作显式约束。

## 实战 3:用 KV 做"模型路由热配置"

\`\`\`typescript
// 启动时一次读取,后续按需刷新
const cfg = await env.CONFIG.get<{ default_model: string; allowlist: string[] }>(
  "agent-config",
  "json"
);
\`\`\`

> ⚠️ **注意** KV 是**最终一致**的,写入后全球同步通常 60 秒内,但偶发更慢。配置/热缓存可以,**别拿它存订单**。

## 取舍小抄

| 我要存的是... | 用什么 |
| --- | --- |
| 一次会话的 30 条对话 | DO 内存 + storage |
| 跨会话共享的用户档案 | D1 |
| 多语言、多版本的系统 prompt | KV |
| 用户上传的文档原文 | R2 |
| 文档的向量索引 | Vectorize |
| 一次性长任务的中间产物 | DO storage / R2 |
| 全局速率限制器 | Durable Object + alarm |

## 选型拐点:什么时候该升级存储

每个存储产品都有"够用的边界"。识别下面这些信号,说明该换了:

| 现状 | 拐点信号 | 升级到 |
| --- | --- | --- |
| KV 配置项 | 单值超过 25MB,或读延迟波动大 | D1 表 / R2 对象 |
| D1 单库 | 写入 QPS 上百持续,或库容量超 5GB | 分库 / 拆 R2 |
| R2 桶 | 单桶对象数过亿 | 分桶按月分片 |
| DO 实例 | 单 DO storage 接近 1GB | 拆成 R2 + 索引 |

不要"提前优化",但拐点出现时**别犹豫**,迁移成本随时间指数增长。

## 边缘上"没有"的存储

为了避免误期望,也要讲清边缘原生栈缺什么:

- **OLAP 数据仓库**:做大数据分析、跑复杂报表,要外接 BigQuery / ClickHouse Cloud
- **图数据库**:社交关系、知识图谱,要外接 Neo4j Aura / TigerGraph
- **时序数据库**:监控指标长期存储,要外接 InfluxDB / Timescale
- **传统强一致 OLTP**:超高并发的金融级写入,D1 不够,要外接 Neon / PlanetScale

Agent 场景下,前三种通常不强需求,**只有"复杂分析"这一类需要时,在 Worker 里调外部服务即可**。

## 跨平台数据同步

如果你跨云部署(部分流量走 CF,部分走腾讯 EdgeOne),数据同步是大坑。三种方案:

1. **单写多读**:某一家做"权威源",其他平台做只读副本,通过 webhook/CDC 推送
2. **事件总线**:用 Kafka / Cloudflare Queues 做异步广播,各平台订阅
3. **客户端直写**:让客户端 SDK 同时写两边,但要处理冲突

绝大多数场景**方案 1 最简单**,代价是副本平台数据可能滞后秒级。Agent 不是金融,这点延迟用户感知不到。

## 一个真实产品的存储设计案例

我们做过一个「公众号文章助手」,完整存储设计如下:

\`\`\`text
            ┌────────────────────────────────────────┐
            │   功能:用户上传文章 → Agent 改写     │
            └────────────────────────────────────────┘

  用户档案、订单 ───────────────▶  D1(users / orders 表)
  会话状态(改写多轮) ─────────▶  Durable Objects(per user)
  原文上传 ────────────────────▶  R2(对象 key=user/{uid}/{ts})
  系统 prompt 模板 ─────────────▶  KV(版本化,热更新)
  改写历史向量 ────────────────▶  Vectorize(语义检索旧改写)
  限流器 ──────────────────────▶  DO + alarm
\`\`\`

一个完整的产品,6 种数据形态,**全部边缘原生 + 自动多区域**。月费在 1000 MAU 规模约 \$50,完全跑得起。

## 数据迁移与备份

边缘数据库的备份是新手最容易忽视的事:

| 产品 | 备份策略 |
| --- | --- |
| KV | \`wrangler kv:bulk get\` 全量导出 → 落 R2 |
| D1 | \`wrangler d1 export\` 导 SQL 到 R2,定期 cron 触发 |
| R2 | 跨账号复制 / 配置 lifecycle policy |
| DO | 写一个"导出"endpoint,遍历 \`storage.list()\` |

**至少做到每天一次全量备份 + 7 天滚动保留**。生产事故最常发生在"以为有备份其实没"的地方。

## 跨产品事务怎么做

边缘存储几乎都是最终一致,**不支持跨产品事务**。一个典型场景:用户买课时要同时:1) 扣余额(D1),2) 创建访问权限(KV),3) 发邮件(API)。原子性怎么保?

两种工程模式:

**1. Saga 模式(补偿事务)**:每一步都有反向操作,失败时回滚已成功步骤。代码复杂但严谨。

**2. 状态机 + 重试**:把状态记到 D1(\`pending → charged → granted → notified\`),用 Workflows 推进,失败自动续跑。代码简单且可观测。

> 💡 **提示** Agent 场景下,**99% 用状态机 + 重试**就够了,Saga 留给金融级。Workflows 原生支持 checkpoint,这套模式实现起来非常顺。

> ✅ **TAKEAWAY** 边缘存储栈不是"哪个更好",而是"按访问模式选合适的"。把这张表打印出来贴墙上,你的 Agent 架构基本不会跑偏。

下一节我们做 RAG 实战 — 用 Vectorize 让 Agent 真正"读懂"私有知识。
`

const s_rag = `
# 3.3 Vectorize 实战:RAG on the Edge

RAG(Retrieval-Augmented Generation)是给 Agent 装"专业知识"的最低成本方案。这一节我们用 Cloudflare Vectorize 给 Agent 接入一个**自定义知识库** — 比如你的产品文档、客户对话记录、内部 wiki。除了"跑通流程",更重要的是讲清楚业界 95% 的 RAG 失败模式与对应的修复方法。

## RAG 数据流

\`\`\`text
[索引阶段]                       [查询阶段]

文档块  ──▶ embedding ──▶        用户问题 ──▶ embedding
                ▼                                ▼
            Vectorize  ◀─────────────────  相似度 topK
                                                 │
                                                 ▼
                                          上下文拼到 prompt
                                                 │
                                                 ▼
                                              LLM 推理
\`\`\`

## 1 建索引

\`\`\`bash
wrangler vectorize create knowledge-base \\
  --dimensions=768 \\
  --metric=cosine
\`\`\`

绑定到项目:

\`\`\`toml
[[vectorize]]
binding = "VEC"
index_name = "knowledge-base"
\`\`\`

## 2 把文档转向量并写入

\`\`\`typescript
async function ingest(env: Env, docs: { id: string; text: string; meta: object }[]) {
  // 1) 用 Workers AI 的 embedding 模型批量算向量
  const embeddings = await env.AI.run("@cf/baai/bge-base-zh-v1.5", {
    text: docs.map((d) => d.text),
  });

  // 2) 批量写入 Vectorize
  await env.VEC.upsert(
    embeddings.data.map((v: number[], i: number) => ({
      id: docs[i].id,
      values: v,
      metadata: { ...docs[i].meta, text: docs[i].text.slice(0, 500) },
    }))
  );
}
\`\`\`

> 💡 **提示** 文档切块(chunking)的颗粒影响检索质量。中文知识库经验值:**每块 300-600 字、重叠 80 字**。代码文档可以更大,FAQ 可以更小。

## 3 检索 + 拼 prompt

\`\`\`typescript
async function retrieveAndAsk(env: Env, question: string): Promise<string> {
  // 把问题嵌成向量
  const qVec = (await env.AI.run("@cf/baai/bge-base-zh-v1.5", {
    text: [question],
  })).data[0];

  // 取相关 top 5
  const hits = await env.VEC.query(qVec, { topK: 5, returnMetadata: true });

  // 拼上下文
  const context = hits.matches
    .map((h, i) => \`[文档\${i + 1}] \${h.metadata?.text}\`)
    .join("\\n\\n");

  // 让模型基于上下文回答
  const res = await env.AI.run("@cf/meta/llama-3.1-70b-instruct", {
    messages: [
      { role: "system", content: \`你是产品客服。只用以下文档回答:\\n\\n\${context}\` },
      { role: "user", content: question },
    ],
  });
  return (res as any).response;
}
\`\`\`

## 调参实战:三个让 RAG 真正可用的旋钮

| 旋钮 | 默认 | 调到什么 | 影响 |
| --- | --- | --- | --- |
| chunk_size | 1000 | **300-600 字** | 太大检索不准,太小语义碎 |
| topK | 3 | **5-8** | 给模型更多 evidence |
| score_threshold | 不设 | **0.7+** | 低于阈值不入 prompt,免幻觉 |
| 重排序(rerank) | 不开 | **2 阶段:粗排 + 精排** | 准确率显著提升,延迟+200ms |

## 一个真实案例的指标

我们给客户做的"产品手册问答 Agent":

| 指标 | 无 RAG | 简单 RAG | RAG + Rerank |
| --- | --- | --- | --- |
| 答对率 | 31% | 64% | **89%** |
| 平均延迟 | 1.4s | 1.8s | 2.1s |
| 单次成本 | ¥0.012 | ¥0.014 | ¥0.018 |

## 一个真实知识库的设计案例

帮某 SaaS 客户做"产品文档问答 Agent",知识库设计:

| 数据源 | 量级 | 处理 |
| --- | --- | --- |
| 产品文档(Markdown) | 1200 篇 | 按 H2 切块,父子文档结构 |
| 历史工单 | 5 万条 | "问题 → 答案" 配对入库 |
| 用户高频 FAQ | 800 条 | 单独 collection,优先检索 |
| 视频字幕 | 200 小时 | Whisper 转写后按时间戳切块 |
| 内部 wiki | 6 个空间 | 按权限分桶,鉴权后才检索 |

混合检索顺序:**FAQ → 工单 → 文档 → wiki → 视频**。前两类命中即可返回,后三类按权重融合。上线后**初次响应准确率 84%**,经过 3 周 bad case 迭代到 92%。

## 上传文档的预处理流程

知识库的质量从源头决定。一个完整的预处理流水线:

\`\`\`text
原文档 → ① 格式归一(PDF/Word/MD → 纯文本)
       → ② 清洗(去页眉页脚、目录、版权页)
       → ③ 结构化标注(标题/段落/列表/表格)
       → ④ chunking(按语义切块)
       → ⑤ 元数据注入(作者、日期、来源 URL)
       → ⑥ embedding
       → ⑦ 入库 + 索引
\`\`\`

新手最容易跳过 ② 和 ③ — 直接把 PDF 提取的乱七八糟文本入库,导致检索时混入页眉页脚等无意义内容。**至少做基础清洗**:去重复行、过滤少于 30 字的行、识别并保留代码块。

## 增量索引与定期刷新

知识库不是一次性的,常见三种更新场景:

| 场景 | 触发 | 策略 |
| --- | --- | --- |
| 新文档加入 | webhook / 后台上传 | 增量 embedding + upsert |
| 单文档修改 | 文档 ID 重复 upsert | 用 ID 覆盖,旧 chunks 自动失效 |
| 全量重建 | embedding 模型升级 | 双索引并行,验收后切换 |

**双索引切换**特别重要:升级 embedding 模型时,新旧两套向量不兼容(维度可能变、语义空间变),必须建新索引、跑 eval、对比胜率,再切流。直接覆盖会导致旧用户的检索行为突然变差。

## Embedding 模型怎么选

Vectorize 是存储,模型是质量瓶颈。常见选择对比:

| Embedding 模型 | 维度 | 中文质量 | 单价 | 备注 |
| --- | --- | --- | --- | --- |
| @cf/baai/bge-base-zh-v1.5 | 768 | 优 | ~免费 | Workers AI 原生,首选 |
| @cf/baai/bge-large-en-v1.5 | 1024 | 仅英文 | ~免费 | 英文文档用 |
| OpenAI text-embedding-3-small | 1536 | 中英都好 | $0.02/1M tok | 通用首选,贵但稳 |
| OpenAI text-embedding-3-large | 3072 | 最好 | $0.13/1M tok | 高精度场景 |
| 自托管 m3e-base | 768 | 中文极好 | 自费 GPU | 不推荐边缘 |

**首选 bge-base-zh + OpenAI 兜底**。Workers AI 跑 bge 几乎零成本,80% 的 case 已经够;对回答准确率敏感的客户,用 OpenAI 重做一次索引,对比 Recall@5。

## 高级 chunking:语义切块与父子文档

简单的"每 500 字切一刀"在长文档上效果差。两个进阶策略:

**语义切块**:用模型识别段落边界,在"主题切换处"切。可以让 8B 模型扫一遍,输出 \`<split/>\` 标签。准确率明显好于固定长度。

**父子文档**:把文档拆成"小块(用于检索)+ 大块(用于上下文)"。检索时命中小块,但拼到 prompt 里的是它所在的大块。这样兼顾**检索精度**和**上下文完整性**,是中长文档的最佳实践。

\`\`\`text
原文档(5000 字)
   ├── 父块 1(800 字,完整一节)
   │     ├── 子块 1.1(150 字)→ 入向量库
   │     ├── 子块 1.2(150 字)→ 入向量库
   ...
   ├── 父块 2(800 字)
   ...

查询时:命中"子块 1.2" → 用父块 1 全文作为 context
\`\`\`

## 多路召回:别只靠向量

业界这两年的共识是:**纯向量检索不够,要混合检索**。

| 路径 | 工具 | 强项 |
| --- | --- | --- |
| 向量相似度 | Vectorize | 语义相近 |
| 关键词 BM25 | 自建简易倒排 / Postgres | 精确术语匹配 |
| 元数据过滤 | Vectorize 的 \`filter\` | 时间、作者、标签 |

实战:**先用关键词 + 元数据缩小到 200 条,再用向量取 top-K**。这套混合检索对比纯向量,中文 Recall@5 平均能提升 10-15 个百分点。

## 评估 RAG 质量的 3 个指标

光看"用户满意度"不够,要量化:

- **Recall@K**:正确答案出现在 top-K 检索结果中的比例,K=5 是常用基线
- **MRR(Mean Reciprocal Rank)**:正确答案的平均排名倒数,反映"准不准"
- **Faithfulness(忠实度)**:答案是否完全基于检索内容,有没有幻觉

最容易做的 eval:整理 50 个真实用户问题 + 标准答案,跑 RAG 后人工/GPT-4o 打分,**任何 prompt 改动都跑一遍这 50 题对比**。这是把 RAG 从 60% 准确率做到 90% 的必经之路。

## RAG vs 微调 vs 长上下文:何时用哪个

业界三选一的老问题:

| 方案 | 适合 | 不适合 |
| --- | --- | --- |
| RAG | 知识频繁更新、规模大、需要引用 | 强风格控制 |
| 微调 | 强风格、领域术语固定、QPS 大 | 知识频繁变 |
| 长上下文 | 一次性分析单文档 < 200k tokens | 海量知识库 |

**绝大多数 SaaS 场景的正确答案是 RAG**。微调成本高、迭代慢;长上下文贵且每次都要重传。RAG 是基础设施,前两者是补充。

> ✅ **TAKEAWAY** RAG 的瓶颈 99% 不在向量库,而在 **chunking 策略 + 多路召回 + 重排 + prompt 模板 + eval**。先把这五件事做好,再考虑换更大模型。

:::figure caption="RAG 流程的失败模式与修复点" alt="带标注的流程图"
:::

下一节我们处理生产环境最难的两件事 — **流式响应**与**长连接**。
`

const s_streaming = `
# 4.1 流式响应:SSE 与 WebSocket 在 Workers

Agent 的体感速度 ≠ 推理速度。一段 800 字的回答,如果用户要等 8 秒才一次看到,你已经输了;如果他能在 300ms 后看到第一个字,后面慢慢吐,他会觉得"挺快"。**流式不是优化,是产品特性**。

这一节讲完三件事:SSE 的最小实现、把"工具调用进度"夹进 stream、流式响应的取消与错误恢复 — 把 Agent UI 做到 ChatGPT 同款体验所需要的全部要点。

## 三种流式方案对比

| 方案 | 协议 | 双向 | 浏览器原生 | 边缘代价 |
| --- | --- | --- | --- | --- |
| **SSE** | HTTP/1.1 长连接 | 服务端 → 客户端 | \`EventSource\` | 极低,Worker 直接 stream |
| **WebSocket** | 协议升级 | 双向 | \`WebSocket\` | 中,DO 才能持久 |
| **WebTransport** | HTTP/3 | 双向、可丢包 | 渐进支持 | 高 |

绝大多数 Agent 场景 **SSE 已经够用**:用户问一次、Agent 答一次。需要双向(语音、协同光标)才考虑 WS。

## SSE 在 Workers 里只要 10 行

\`\`\`typescript
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { message } = await req.json<{ message: string }>();

    // env.AI.run({ stream: true }) 直接返回一个 ReadableStream
    const llmStream = await env.AI.run("@cf/meta/llama-3.1-70b-instruct", {
      messages: [{ role: "user", content: message }],
      stream: true,
    });

    return new Response(llmStream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        "x-accel-buffering": "no",
      },
    });
  },
};
\`\`\`

前端消费:

\`\`\`typescript
const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message }) });
const reader = r.body!.getReader();
const dec = new TextDecoder();
let full = "";
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  full += dec.decode(value);
  ui.set(full); // 增量更新
}
\`\`\`

## 体感速度的两个关键数字

工业界对"流式响应"的体感研究给出了两个临界值:

| 数字 | 含义 | 意义 |
| --- | --- | --- |
| 100ms | 用户感知"瞬时" | 首字延迟低于这个值才有"对话感" |
| 1 秒 | 用户感知"在响应" | 超过此值若无 UI 反馈,用户开始重复点击 |

边缘 Agent 通常做不到 100ms 首字(模型本身 200ms+),但可以做到 500ms 内。**首字 < 500ms + token 流式吐出**,体验已经接近 ChatGPT。中心化方案的 1.5-2 秒首字会让用户感觉"卡"。

## 进阶:在流里夹"工具调用进度"

真实 Agent 不只是流式吐字 — 中间还会调工具、思考、检索。用户期望看到「正在查天气...」「检索到 3 篇文档...」这种过程态。

做法:**自己写一层 SSE event,把 LLM token 流和工具事件混在同一个 stream 里**。

\`\`\`typescript
function makeAgentStream(env: Env, history: Msg[]): ReadableStream {
  const enc = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(enc.encode(\`event: \${event}\\ndata: \${JSON.stringify(data)}\\n\\n\`));
      };

      for (let step = 0; step < 6; step++) {
        send("thinking", { step });
        const res = await env.AI.run("@cf/meta/llama-3.1-70b-instruct", {
          messages: history, tools: TOOLS, stream: false,
        });
        const choice = (res as any).response;

        if (choice.tool_calls?.length) {
          for (const c of choice.tool_calls) {
            send("tool_start", { name: c.name, arguments: c.arguments });
            const out = await executeTool(env, c.name, c.arguments);
            send("tool_end", { name: c.name, result: out });
            history.push({ role: "tool", name: c.name, content: JSON.stringify(out) });
          }
        } else {
          // 真正回答,流式吐
          const tokens = await env.AI.run("@cf/meta/llama-3.1-70b-instruct", {
            messages: history.concat({ role: "assistant", content: choice.content }),
            stream: true,
          });
          for await (const tok of tokens as any) send("token", tok);
          send("done", {});
          controller.close();
          return;
        }
      }
    },
  });
}
\`\`\`

前端把 \`thinking / tool_start / tool_end / token / done\` 各自路由到不同 UI 区块,你就有了 ChatGPT 风格的"过程透明 Agent"。

## WebSocket 适合的两个场景

| 场景 | 为什么 SSE 不够 |
| --- | --- |
| 语音 Agent(双向音频流) | 用户音频必须实时上行 |
| 协同 Agent(多用户共享会话) | 服务端要主动 broadcast |

WebSocket 必须配合 DO 才能保持单实例;Worker 自己不持有长连接。语法骨架:

\`\`\`typescript
export class VoiceRoom {
  async fetch(req: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws: WebSocket, data: ArrayBuffer | string) {
    // 处理用户帧、转发、广播
  }
}
\`\`\`

## SSE 与 Markdown 渲染的配合

Agent 经常输出含 Markdown 的回答(代码块、列表、表格)。流式渲染 Markdown 有 3 个坑:

**坑 1:代码块半截渲染**。token \`\`\`\`typescript\` 来了,渲染器以为代码块开始;后面的 \`function\` 用 syntax highlight 渲;但闭合 \`\`\`\`\` 还没来,显示就乱了。**修法**:渲染 partial Markdown 时,如果代码块未闭合,**自动补一个闭合**,后续 token 来再修正。

**坑 2:表格半截渲染**。表格需要表头 + 分隔行才能识别。流式期间渲染器看不到完整结构,表格区显示成混乱文本。**修法**:检测到 \`|\` 字符开头但不完整,先 placeholder 显示"正在生成表格...",等完整再渲。

**坑 3:链接半截**。\`[anchor\` 出现还没等到 \`](url)\`,渲染器把它当普通文本。这个一般不影响最终结果,可以忍。

业界做得好的方案(如 ChatGPT、Claude.ai)都自己写了"流式 Markdown 解析器",**不直接用 markdown-it 等通用库**。

## 流式渲染:前端工程要点

后端流式只是一半,前端正确渲染才完整。新手最常见的两个错误:

**错误 1:每个 token 来都触发完整 re-render**。React 用户调一次 \`setState\` 重渲整个对话气泡,长回答时帧率掉到 10fps,用户看到的是"卡顿的吐字"。修法:用 \`useDeferredValue\` 或把流式部分独立成子组件,只让它重渲。

**错误 2:Markdown 渲染等到全部收齐再渲**。回答 800 字时,用户等 5 秒看到的是空白 → 突然全文。修法:**边收边渲 Markdown**,使用支持 partial parsing 的库(如 \`marked\` 配合 silent 模式)。

## token vs sentence:粒度的取舍

不是所有场景都要 token 流式。对比:

| 粒度 | 体感 | 适合 |
| --- | --- | --- |
| token | 最"丝滑",有打字感 | 通用聊天 |
| word | 略卡但减少渲染压力 | 长回答 |
| sentence | 一句句出 | 朗读 / TTS 配合 |
| paragraph | 段落出 | 文档生成 |

**做语音 Agent 时必须 sentence 级流式**,否则 TTS 引擎吞 token 时会断句乱、语调怪。文本 Agent 默认 token 级即可。

## 移动端、弱网下的 SSE 行为

测试时一定要带这些场景过一遍:

| 场景 | 现象 | 处理 |
| --- | --- | --- |
| 4G 切 WiFi | 连接断,前面的 token 已显示 | 客户端记 \`last_received_id\`,断线重连续传 |
| 用户后台切回前台 | iOS Safari 暂停 fetch | 监听 \`visibilitychange\`,重新发请求 |
| 弱网每 5 秒丢一次 | EventSource 自动重连但会重复 token | 服务端给每个 chunk 加 \`id:\`,客户端去重 |
| 微信内置浏览器 | SSE 可能被缓冲 | 加 \`X-Accel-Buffering: no\` 头 |

最后一条特别坑 — 微信、企业微信、某些代理都会**默认缓冲 SSE 直到一定大小才放行**,体验上会变成"等 3 秒突然来一大段"。\`X-Accel-Buffering: no\` 是关键头,加上就好了。

## 流式输出的取消(用户中途打断)

用户在输出过程中点"停止",前端需要立即终止显示,服务端也要停掉模型推理(否则继续烧 token)。完整链路:

\`\`\`typescript
// 前端
const controller = new AbortController();
stopBtn.onclick = () => controller.abort();
fetch("/api/chat", { method: "POST", body, signal: controller.signal });

// 后端(Worker)
async fetch(req: Request, env: Env) {
  const aborted = req.signal;
  const stream = await env.AI.run(model, { messages, stream: true, signal: aborted });
  // Workers AI 接收 signal,会真停推理
  return new Response(stream, { headers: SSE_HEADERS });
}
\`\`\`

> ⚠️ **注意** 一定要把前端的 \`AbortController.signal\` **一路透传到 Workers AI 调用**,否则就算前端断开,后端依然会跑完整段推理,你白白付钱。

## 流式 + 工具调用的状态机

带工具的 Agent 流式,前端要维护一个简单状态机:

\`\`\`text
idle ──user_send──▶ thinking ──tool_start──▶ tool_running
                       │                          │
                       │ tool_end                 ▼
                       │◀────── tool_result ────┐
                       │                          │
                       ▼                          │
                  streaming ─────────────────────┘
                       │
                  done  │
                       ▼
                     idle
\`\`\`

每个状态对应不同 UI 反馈:thinking 显示"思考中..."、tool_running 显示工具名 + 进度条、streaming 是 token 流。一旦状态转换混乱,前端就显示乱七八糟,**用户的"信任感"会瞬间崩塌**。

## 流式中途出错怎么办

模型推理到一半挂了(超 context、上游 5xx、网络抖动),已经吐出去的 token 不可撤销。处理方式:

- 在 stream 里 emit 一个 \`error\` event,前端显示"…(已中断)"
- 已生成的部分**写库,但标记 \`partial: true\`**,下次用户重试时优先恢复
- 高价值会话(已扣费)自动免费重试 1 次

\`\`\`typescript
try {
  for await (const tok of stream) send("token", tok);
  send("done", {});
} catch (e) {
  send("error", { message: (e as Error).message, recoverable: true });
} finally {
  controller.close();
}
\`\`\`

> ✅ **TAKEAWAY** 默认 SSE,**只在双向必要时**升级到 WS。WS 的可观测性、调试、计费都比 SSE 难 3 倍。流式 = 体感速度 + 可中断 + 可恢复,缺一不可。

:::figure caption="SSE 多事件流的前端消费时序" alt="时序图"
:::
`

const s_multi_agent = `
# 4.2 多 Agent 协作:Workflows + 队列

单 Agent 能做的事有上限。当你需要「研究 + 写作 + 审校 + 发布」这种四步流水线,或「同时调度 10 个 Agent 各跑各的」时,就要用**协作模式**。Cloudflare Workflows 和 Queues 是边缘原生的两件事 — 一个负责顺序与断点续跑,一个负责并发与异步派发。这一节我们把"什么时候用谁、怎么不踩坑、成本怎么算"全讲透。

## 三种协作拓扑

| 拓扑 | 适合 | Cloudflare 原语 |
| --- | --- | --- |
| **流水线** Pipeline | 顺序明确、强一致 | Workflows |
| **分发-聚合** Map-Reduce | 同质并发任务 | Queues + Workflows |
| **总分总** Orchestrator-Worker | 复杂任务拆分 | DO orchestrator + Queues |

\`\`\`text
[流水线]                    [分发聚合]                 [总分总]

A ──▶ B ──▶ C ──▶ D        ┌── W1 ──┐                 Orchestrator
                            │        │                  │
                  入 ─▶ ──┼── W2 ──┼── ─▶ 聚合      ┌──┼──┐
                            │        │                W1 W2 W3
                            └── Wn ──┘                 └──┴──┘
                                                       │
                                                       ▼
                                                    final
\`\`\`

## Workflows:Durable Execution 的精髓

Cloudflare Workflows(2024 GA)给你一个「可重启的 async 函数」 — 任何一步崩了,从那一步**断点续跑**。这是写多 Agent 流水线的福音。

\`\`\`typescript
import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";

export class BlogPipeline extends WorkflowEntrypoint<Env, { topic: string }> {
  async run(event: { payload: { topic: string } }, step: WorkflowStep) {
    const research = await step.do("research", async () =>
      runAgent(this.env, [{ role: "user", content: \`调研 \${event.payload.topic}\` }])
    );

    const draft = await step.do("draft", async () =>
      runAgent(this.env, [{ role: "user", content: \`基于以下材料写一篇 1500 字博客\\n\${research}\` }])
    );

    const reviewed = await step.do("review", async () =>
      runAgent(this.env, [{ role: "user", content: \`审校以下文章\\n\${draft}\` }])
    );

    await step.do("publish", async () => env.PUBLISH.send({ markdown: reviewed }));
    return { ok: true };
  }
}
\`\`\`

> 💡 **每一个 \`step.do\` 都是 checkpoint**。如果 \`review\` 这一步因为模型超时挂了,workflow 引擎会自动从 review 重启,前面的 research / draft 已经持久化的结果照用,不浪费 token。

## Queues:把"分发-聚合"做对

需求:用户上传一篇长文,Agent 要为每段独立写 commentary,最后合并。

\`\`\`typescript
// 1) 入队
for (const para of paragraphs) {
  await env.AGENT_QUEUE.send({ doc_id, paragraph_idx: para.idx, text: para.text });
}

// 2) Worker 消费
export default {
  async queue(batch: MessageBatch<Msg>, env: Env) {
    for (const msg of batch.messages) {
      const out = await runAgent(env, [{ role: "user", content: \`点评:\${msg.body.text}\` }]);
      await env.RESULTS.put(\`\${msg.body.doc_id}:\${msg.body.paragraph_idx}\`, out);
      msg.ack();
    }
  },
};
\`\`\`

并发度由 \`max_batch_size\` 和 \`max_concurrency\` 控制,**100 段并发跑完一般在 10 秒内**。

## 多 Agent 的可观测性挑战

单 Agent 的 trace 还能看,**多 Agent 的 trace 会爆**。一次任务有 5 个 Agent 各跑 3-5 步,日志就是 15-25 条交错记录。三个工具:

1. **统一 trace_id**:所有 Agent 调用都带同一个 trace_id,后期能拼回完整链路
2. **结构化层级**:每条日志带 \`agent_name\` + \`step\` + \`parent_trace\`,可建调用树
3. **可视化界面**:用 LangSmith / Helicone / Sentry Performance 这类工具,把多 Agent 流程可视化成 timeline

不投入这些工具,多 Agent 系统会变成"黑盒",出 bug 找不到根因。**多 Agent 系统的可观测投入应该比单 Agent 高 3-5 倍**。

## Agent 间的"共同记忆"

多个 Agent 协作时经常需要共享数据(用户偏好、本次任务上下文、已查到的事实)。三种实现:

| 模式 | 工具 | 优缺点 |
| --- | --- | --- |
| 全部塞 prompt | 把共享 context 拼进每个 Agent 的 system | 简单,但 token 暴涨 |
| 共享 KV / DO | 一个 \`task-\${id}\` DO 存所有中间产物 | 推荐,中央化清晰 |
| 工具读写 | 给所有 Agent 提供 \`read_shared\` / \`write_shared\` 工具 | 模型自主决定何时共享 |

实战推荐**模式 2**,所有共享数据进同一个 DO,Agent 之间用引用而不是复制。

## 评估多 Agent 系统的难点

单 Agent 评估:输入 → 输出,对比标答打分。多 Agent 难在哪里?

- 输出可能"对的偏",中间过程错了但最终答案恰好对
- 中间产物不是给人看的,人工标注成本高
- 路径分支多,同样输入跑 10 次可能 10 个路径

实战做法:**评估"最终输出 + 中间关键节点"两层**。例如综述 Agent:既评最终综述质量,也评"中间抽出的 5 篇论文是否相关"。

## 三种角色拆分模式

多 Agent 不只是"多个 Agent",还要看它们怎么分工:

| 拆分模式 | 角色 | 例子 |
| --- | --- | --- |
| **角色专家** | 每个 Agent 是某领域专家 | 「编辑 Agent」+「事实核查 Agent」+「文风调整 Agent」 |
| **监督者** | 一个 Agent 管多个 Worker Agent | 「总编 Agent」分发任务给 N 个写手 |
| **辩论** | 多个 Agent 各持立场,辩论后总结 | 投资决策、医学诊断的多视角 |

**新手优先选"监督者"模式** — 一个 orchestrator 把任务拆给 worker,worker 跑完汇报。这个结构最像传统软件工程,容易调试。

辩论模式很酷,但成本是单 Agent 的 5-10 倍,**只在质量瓶颈非常明显时启用**。

## 一个真实多 Agent 的协作时序

「论文综述 Agent」的真实运行 timeline:

\`\`\`text
t=0     用户提交主题
t=200ms  Orchestrator Agent 决定:先生成检索关键词
t=1.2s  Searcher Agent 调 arXiv + Semantic Scholar 各 1 次
t=3.5s  拿到 50 篇论文 meta,Orchestrator 决定:挑前 5 篇深度阅读
t=4s    5 个 Reader Agent 并发启动(每个读一篇)
t=18s   5 个 Reader 完成,汇总到共享 DO
t=19s   Synthesizer Agent 开始综述写作(Claude Opus)
t=42s   综述完成
t=43s   Formatter Agent 转 BibTeX + Markdown
t=45s   通过 webhook 通知用户、邮件发送
\`\`\`

3 类角色,7 个 Agent 实例,中间 4 次共享状态读写。**整个流程对外只是"45 秒后收到一份综述"** — 内部复杂性对用户透明。

## Workflows 的 sleep / wake / 定时

Workflows 提供了几个很有用的"时间原语":

\`\`\`typescript
// 等 24 小时再继续
await step.sleep("wait-a-day", "24 hours");

// 等到指定时刻
await step.sleepUntil("next-monday", new Date("2026-06-09T09:00:00Z"));

// 等外部信号(webhook、用户确认)
const decision = await step.waitForEvent("user-approval", {
  type: "approval-event",
  timeout: "3 days",
});
\`\`\`

这些原语让 Workflows 不仅能做"长跑步",还能做**事件驱动的长期流程**:用户提交申请 → Agent 评估 → 等人工审核(可能 2 天)→ 通过则继续。**整个流程对你的代码而言就是一个 async 函数**,没有数据库表来追踪状态。

## Queues 的优先级、死信、重试

Queues 不只是"先进先出"。生产配置至少要管 3 件事:

| 设置 | 用途 | 经验值 |
| --- | --- | --- |
| \`max_retries\` | 失败重试次数 | 3 次,指数退避 |
| \`dead_letter_queue\` | 重试穷尽后去的死信队列 | 独立队列,定期人工查 |
| \`max_batch_size\` | 单次拉取的消息数 | 1-10,看下游能力 |
| \`max_batch_timeout\` | 攒 batch 的最长等待 | 1-5 秒 |

死信队列是生产线的安全网 — 任何"反复失败"的消息进这里,**避免无限阻塞主流程**。每周扫一次死信、人工归因、修代码,这是必经流程。

## 多 Agent 的两个反模式

| 反模式 | 现象 | 修正 |
| --- | --- | --- |
| **互相递归** | A 调 B,B 又调 A,token 暴增 | 强制 depth limit,显式 DAG |
| **全部塞一个超长 prompt 里** | 上下文超 100k,质量反降 | 拆成短 prompt,中间产物落地 |
| **OrchestrAgent 过度细分任务** | 把简单任务拆 10 步,token × 10 | 拆分粒度匹配实际复杂度 |
| **Worker 之间共享 prompt 状态** | 一个 worker 的修改影响其他 worker | 显式传参,不共享可变状态 |

## 一个真实多 Agent 系统的成本拆分

「论文综述 Agent」实际成本(单次综述):

| 阶段 | 模型 | 调用次数 | 单价 | 小计 |
| --- | --- | --- | --- | --- |
| 选题理解 | GPT-4o-mini | 1 | $0.001 | $0.001 |
| 检索关键词生成 | GPT-4o-mini | 1 | $0.001 | $0.001 |
| Worker 并发综述 5 篇 | Claude Haiku | 5 | $0.003 | $0.015 |
| 主旨抽取 + 排序 | GPT-4o | 1 | $0.025 | $0.025 |
| 最终综述写作 | Claude Opus | 1 | $0.080 | $0.080 |
| 引用格式化 | GPT-4o-mini | 1 | $0.001 | $0.001 |
| **合计** | | 10 | | **~$0.12** |

定价 $0.99/次,**毛利 ~88%**。这就是多 Agent + 大小模型分工的真实经济。

> ⚠️ **注意** 多 Agent 的「智能」往往不如「单 Agent + 好工具」。在升级到多 Agent 前,先问自己:**是不是给 1 个 Agent 把工具做完整就够了?** 90% 的情况答案是 yes。

:::figure caption="Blog Pipeline 的 Workflows 断点续跑" alt="时序图,中间一步失败重启,前面的步骤不重跑"
:::
`

const s_auth_billing = `
# 4.3 鉴权、计费、限流:把 Agent 包装成 SaaS

跑通 demo 容易,把 Agent **变成能持续收钱的产品**才是工程。这一节我们走完一个 SaaS Agent 必须有的三件事:鉴权、按量计费、限流;并把"免费额度怎么设、海外支付怎么接、月活怎么转付费"这些产品视角也讲清楚 — 这部分知识在工程类教程里普遍缺失。

## 最小可用鉴权:JWT + Workers

边缘场景的鉴权要**轻**。JWT 在 Workers 上是天作之合:无状态、可缓存、握手不打数据库。

\`\`\`typescript
import { jwtVerify } from "jose";

async function auth(req: Request, env: Env): Promise<{ uid: string; plan: string }> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Response("missing token", { status: 401 });
  const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET));
  return { uid: payload.sub as string, plan: (payload as any).plan ?? "free" };
}
\`\`\`

> 💡 **提示** 用 Stytch / Clerk / Auth.js 接 OAuth 与邮件登录,JWT 只是会话载荷。**不要自己写密码哈希**。

## 按量计费:把 token 计入用户账本

\`\`\`typescript
async function chargeTokens(env: Env, uid: string, inTok: number, outTok: number) {
  const cost = inTok * 0.000_002 + outTok * 0.000_006; // 单价示例,按你的模型
  await env.DB.prepare(
    \`INSERT INTO usage (uid, ts, in_tok, out_tok, cost) VALUES (?, ?, ?, ?, ?)\`
  ).bind(uid, Date.now(), inTok, outTok, cost).run();

  // 写入用户余额(原子)
  await env.DB.prepare(
    \`UPDATE accounts SET balance = balance - ? WHERE uid = ? AND balance >= ?\`
  ).bind(cost, uid, cost).run();
}
\`\`\`

## 计费要不要按 token 给最终用户看

这是产品决策,工程上都做得到,但选错会直接影响转化率。两种思路对比:

| 方式 | 优点 | 缺点 |
| --- | --- | --- |
| 透明按 token | 用得多付得多,对开发者用户透明 | 普通用户不懂 token,有"被坑感" |
| 套餐 + 模糊额度 | 易理解,价格锚定清晰 | 重度用户被补贴 |

**面向开发者(API 平台)**:按 token + 月度上限,标准 SaaS 做法。面向普通用户(C 端聊天):**套餐 + "本月还剩 X 次"显式额度**,把 token 完全隐藏。混合用户群:两套并行,用户首次注册按内容引导走对应路径。

经验:**绝大多数 C 端 Agent 产品最终都收敛到了"月费 + 隐式额度"**,因为用户不愿意为"思考的字数"付费。

## 限流的三层金字塔

| 层 | 工具 | 防什么 |
| --- | --- | --- |
| **L1 IP 限流** | Workers Rate Limiting binding | DDoS、爬虫 |
| **L2 用户限流** | Durable Object + sliding window | 单用户刷调用 |
| **L3 余额限流** | D1 \`balance > 0\` 校验 | 防赊账 |

L2 的最小实现:每个用户一个 DO,DO 内维护过去 60 秒的请求 timestamp 数组。

\`\`\`typescript
export class UserLimiter {
  async fetch(req: Request) {
    const max = 30; // 每分钟最多 30 次
    const now = Date.now();
    const list = (await this.state.storage.get<number[]>("ts")) ?? [];
    const recent = list.filter((t) => now - t < 60_000);
    if (recent.length >= max) return new Response("rate limited", { status: 429 });
    recent.push(now);
    await this.state.storage.put("ts", recent);
    return new Response("ok");
  }
}
\`\`\`

## 限流策略的产品对话

限流不只是工程,**话术也是产品**。被限流的用户看到什么文案,决定了他下一步是离开还是付费:

| 文案 | 效果 |
| --- | --- |
| "请求过多,请稍后重试" | 用户大概率离开 |
| "你今天的免费额度已用完(20/20)" | 用户开始权衡升级 |
| "升级 Pro,无限制,首月仅 ¥9" | 转化率最高,但有压迫感 |
| "想继续吗?升级 Pro 立即解锁,或 24 小时后免费额度刷新" | 中性,转化与留存平衡 |

最后一行是经验上最优解 — **同时给两条路**(付费 or 等待),用户自己选,转化率 vs 留存率都不会被牺牲。

## 价格分层 = 产品分层

| 套餐 | 月费 | 模型 | RPM 上限 | 工具集 |
| --- | --- | --- | --- | --- |
| Free | ¥0 | 8B | 10 | 仅检索 |
| Pro | ¥39 | 70B | 100 | 全工具 |
| Team | ¥299/座 | 70B + GPT-4o 兜底 | 1000 | 全工具 + 私有知识库 |
| Enterprise | 谈 | 私有部署/自托管 | 无限 | 自定义 |

> ✅ **TAKEAWAY** 不要做"按 token 计费"给最终用户(他们不懂)。做"按套餐分层 + 套餐内按调用次数计数"。token 计费只用于内部成本控制。

## 一个真实 pricing page 的 5 个要素

定价页是 SaaS 的转化关键。Agent 产品的 pricing page 至少包含:

1. **3 档显式套餐**(Free / Pro / Team)— 心理学上 3 档转化率最高
2. **价格锚定**:Team 套餐定个"高得离谱"的价,显衬出 Pro 的"划算"
3. **额度可视化**:不是写"无限",而是写"每月 500 次,够日均 16 次"
4. **FAQ 模块**:回答"超额怎么办""能退款吗""能开发票吗"等高频问题
5. **社会证明**:用户头像、客户 logo、Twitter 截图

经验:**Free → Pro 转化率行业基线约 1-3%**。低于 1% 说明 Free 给得太多或激活不够;高于 5% 通常是因为 Free 过于鸡肋,会损失增长。

## 试用、coupon、企业版

| 工具 | 用法 |
| --- | --- |
| 14 天 Pro 试用 | 注册即送,不要信用卡;转化率 vs 14 天后自动扣费差 3× |
| 限时 coupon | 节日促销,7 折 1 个月,带紧迫感 |
| 年付折扣 | 月费 \$29,年付一次 \$290(相当于 10 折给 2 个月) |
| 企业版 | "Contact Us" 走销售对接,不公开报价 |

> 💡 **提示** Stripe 提供 promotion code 直接管理 coupon,**不要自己写优惠券系统**。

## 失败支付与外发邮件链路

订阅 SaaS 的常见 churn 原因不是用户不喜欢产品,是**信用卡过期了**。处理流程:

\`\`\`text
信用卡续费失败
  ├─ 立即重试 1 次
  ├─ 24 小时后再试
  ├─ 发邮件提醒(D+1)
  ├─ 再次重试(D+3)
  ├─ 短信/产品内推送(D+5)
  └─ 转 Free 套餐(D+7)
\`\`\`

每一个邮件/推送都要有 \`update payment\` 一键链接。Stripe 的 \`smart retries\` 已经把前 4 步包好了,**你需要做的是后面的 in-app 推送和降级逻辑**。

## 反作弊清单

- 注册时邮箱 OTP + Cloudflare Turnstile
- 同一邮箱后缀(\`+1\`, \`+2\`)归一
- 同 IP 多账号阈值告警
- 高额输出前要求二次确认(防爬数据库)

## 免费额度设计

免费额度不是慈善,是漏斗顶。设计原则:**让用户体验到产品价值,但不足以让他们持续白嫖**。

| 维度 | 免费阈值 | 转化关键点 |
| --- | --- | --- |
| 每月调用次数 | 30-50 次 | 第 7 天起开始提示"还剩 X 次" |
| 单次回答上限 | 短回答(<500 token) | Pro 给长回答能力 |
| 模型档次 | 限定 8B 小模型 | Pro 才能用 70B / GPT-4o |
| 工具集 | 仅 1-2 个基础工具 | Pro 解锁全工具 |
| 历史保留 | 7 天 | Pro 永久 |

**至少保留 3 个升级理由**,任何单一维度都不要"卡得太死",否则用户没体验到价值就走。

## 退款、降级、续费

订阅产品逃不掉这三件事:

| 场景 | 实现 |
| --- | --- |
| 用户要求退款(7 天内) | Stripe API 直接 refund,自动取消订阅 |
| 用户主动降级 | 当前周期保留 Pro 权益,下周期降级 |
| 续费失败(卡过期) | grace period 3 天 + 邮件提醒,然后降级 free |

> ⚠️ **注意** Stripe 的 \`subscription_schedule\` API 是处理"现在升级、下月生效"这类复杂订阅变更的关键,**不要自己造轮子**。

## 海外 vs 国内的支付网关

| 区域 | 网关 | 抽成 | 说明 |
| --- | --- | --- | --- |
| 海外 | Stripe | 2.9% + $0.3 | 标准,DX 极好 |
| 海外 | Lemon Squeezy / Paddle | 5%(MoR) | Merchant of Record,他们替你交税 |
| 国内 | 微信支付 | 0.6% | 个人不能直接接,要企业 |
| 国内 | 支付宝 | 0.6% | 同上 |
| 国内独立站 | 钉钉 / 飞书工作台 | - | B2B 场景内嵌 |

独立开发者出海卖 Agent SaaS,**优先 Paddle / Lemon Squeezy** — 它们是 Merchant of Record,帮你处理全球 VAT/GST,初期能省下大量合规成本。规模做大再迁 Stripe。

## 「月活变付费」漏斗示例

某 Agent SaaS 真实漏斗数据(从访问到付费):

| 阶段 | 数量 | 转化率 |
| --- | --- | --- |
| 落地页访问 | 10000 | 100% |
| 注册免费账号 | 1200 | 12% |
| 完成首次会话 | 850 | 70% (注册→激活) |
| 用满免费额度 | 320 | 38% (激活→满额) |
| 升级 Pro | 95 | 30% (满额→付费) |
| **付费率** | **0.95%** | |

关键提升点:**激活率**(让注册用户真的用上)和**满额→付费转化**(在用户用到价值后及时弹升级)。前者靠 onboarding 引导,后者靠用量提示文案。

:::figure caption="Agent SaaS 鉴权 + 计费 + 限流的整体数据流" alt="架构图"
:::

下一节是工程化的最后一块:**可观测性、灰度、回滚**。
`

const s_observability = `
# 4.4 可观测性、灰度、回滚

Agent 出问题时,**不是代码报错,而是模型悄悄变蠢**。这种问题没法靠看堆栈定位,只能靠日志、指标、trace。这一节给你一套边缘原生的可观测方案,同时分享一次真实的"模型变蠢"故障排查过程,让你看清线上 Agent 真正会出什么问题。

## 三件套:Logs / Metrics / Traces

| 维度 | Cloudflare 原生 | 推荐外接 |
| --- | --- | --- |
| Logs | \`wrangler tail\` / Logpush | Datadog / Better Stack |
| Metrics | Workers Analytics Engine | Grafana(via Logpush) |
| Traces | Tail Worker | OpenTelemetry 转 Sentry |

## 落实:为 Agent 主循环加上结构化日志

\`\`\`typescript
async function runAgent(env: Env, history: Msg[], reqId: string) {
  const log = (event: string, data: object) => console.log(JSON.stringify({
    ts: Date.now(), reqId, event, ...data,
  }));

  for (let step = 0; step < 6; step++) {
    const t0 = Date.now();
    const res = await env.AI.run("@cf/meta/llama-3.1-70b-instruct", { messages: history, tools: TOOLS });
    log("llm_call", { step, latency_ms: Date.now() - t0, tokens_out: (res as any).usage?.completion_tokens });

    // ... 工具调用、记录工具延迟与结果
  }
}
\`\`\`

把 \`reqId\` 贯穿 worker / DO / 工具调用,后续在日志系统里就能拉出整条 trace。

## Analytics Engine:免费的低基数指标

\`\`\`typescript
env.METRICS.writeDataPoint({
  blobs: [model, toolName, plan],
  doubles: [latencyMs, cost],
  indexes: [uid],
});
\`\`\`

每月免费 1000 万数据点,够你跑出"按模型 / 按工具 / 按套餐"的延迟与成本看板。

## 灰度:Worker 的 \`routes\` + \`versions\`

Cloudflare Workers 支持**版本化部署**和**流量切分**。新版本先放 1% 流量,观察 4 小时再放大。

\`\`\`bash
# 部署但不上线
wrangler versions upload

# 拿到 versionId,切 1% 流量
wrangler versions deploy <id-old>@99% <id-new>@1%
\`\`\`

\`\`\`text
[流量切分时序]

t0     ┌───────────┐
       │  v1 100%   │
       └───────────┘

t1     ┌──────────────┐
       │ v1 99% │v2 1%│  ← 观察 4h,看错误率/延迟
       └──────────────┘

t2     ┌──────────────┐
       │ v1 50% │v2 50%│  ← 平稳放大
       └──────────────┘

t3     ┌──────────────┐
       │     v2 100%   │
       └──────────────┘
\`\`\`

## 回滚的三种姿势

| 姿势 | 命令 | 适用 |
| --- | --- | --- |
| 立即回滚 | \`wrangler rollback\` | 上线就崩 |
| 版本切回 | \`wrangler versions deploy <old-id>@100%\` | 灰度阶段发现问题 |
| 多区域熔断 | \`routes\` 移除某个 zone | 单区域异常 |

> ⚠️ **注意** Agent 的"变蠢"很多时候不是代码问题,而是 **模型版本悄悄升级**(\`@cf/meta/llama-3.1-70b-instruct\` 本身被替换)。生产代码**一定要锁版本号**,Cloudflare 的 \`@cf/meta/llama-3.1-70b-instruct-fp8\` 这类 sku 锁得更死。

## 评估(Eval)比监控更重要

Agent 不像普通 API,200 OK 不代表正确。必须有**离线/在线评估**:

| 评估类型 | 方法 | 频率 |
| --- | --- | --- |
| **离线** | 固定问题集 + 标准答案 + 自动打分(用 GPT-4o 当裁判) | 每次 prompt 改动 |
| **在线** | 抽样 5% 真实对话,人工标注好/坏 | 每周 |
| **回归** | 上一版 + 新版各跑相同 50 个 case,对比胜率 | 每次发版 |

## 落实:为 Agent 主循环加上结构化日志(进阶)

刚才的日志只记录了 LLM 调用。完整的 Agent observability 还要捕获:

- 工具调用的入参、出参、耗时、失败原因
- RAG 检索的 query、返回 top-K、命中得分
- 反思(reflection)步骤的中间思考(选填,会膨胀日志量)
- 用户主动停止 / 反馈点赞点踩 的事件

每一类用不同的 \`event\` 名记录,后续在 Grafana 上按 event 类型聚合。**90% 的"模型变蠢"问题,通过看 tool 调用模式 + RAG 命中得分变化能定位**,不需要看 prompt 全文。

## 关键指标清单(打印贴墙)

Agent 产品上线后,这些指标必须每日/每周回看:

| 指标 | 健康值 | 异常解读 |
| --- | --- | --- |
| TTFT(首字延迟) | <500ms | 网络/路由/模型负载问题 |
| TPS(token/秒) | >30 | 模型变慢或被降级 |
| Tool call latency P95 | <2s | 工具实现/外部 API 拖累 |
| Cost per session | 稳定 | 突然升高 = prompt 改坏或循环卡死 |
| 用户主动停止率 | <5% | 输出质量崩 / 速度慢 |
| 工具失败率 | <2% | 工具实现 / 鉴权过期 |
| 多轮平均步数 | 稳定 | 突然变多 = 模型规划能力变差 |

把这 7 个指标做成一个 Grafana / Looker 看板,**每天早上扫一眼**,问题暴露在变化里,不在绝对值里。

## 告警阈值的经验值

按"严重程度"分级:

| 级别 | 触发条件 | 通知方式 |
| --- | --- | --- |
| P0 | 错误率 > 10% 持续 5 分钟 | 电话 + 短信 |
| P1 | TTFT P95 > 2s 持续 10 分钟 | Slack @here |
| P2 | 单用户成本 > 平均 5× | 邮件日报 |
| P3 | 工具 X 失败率突增 | 周报 |

> 💡 **提示** 告警阈值不要"凭感觉",应该基于历史 P95/P99 + 一定 buffer。**第一个月只观察、不告警**,收集数据后再开告警,避免被自己折磨疯。

## 一次"模型变蠢"故障的真实排查

某周一早上,客服 Agent 答对率突然从 88% 掉到 64%,无错误日志。排查过程:

1. **看监控**:TTFT 正常、错误率正常,但回答平均长度变短 30%
2. **抽样看 trace**:发现模型经常"不调工具,直接编",而不是查 RAG
3. **看版本**:wrangler.toml 里写的 \`@cf/meta/llama-3.1-70b\` — 没改过
4. **怀疑 Workers AI 后端模型悄悄换了**:用 \`-fp8\` 后缀锁住精度版本,重试,**恢复 87%**

教训:**Workers AI 的"通用 sku"会被静默升级**,生产代码一定用带精度后缀的具体版本(如 \`-fp8\`、\`-awq\`),并把版本号写进 alert 规则,有变化就报警。

## Sentry 接入实战

错误日志在边缘上特别贵 — 没有"上 SSH 看 log"这种方式。Sentry 是边缘项目的事实标准。最小接入:

\`\`\`typescript
import * as Sentry from "@sentry/cloudflare";

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: env.ENV,
  }),
  {
    async fetch(req, env, ctx) {
      // ... 你的正常 Worker 代码
    },
  }
);
\`\`\`

任何未捕获异常自动上报到 Sentry,带 trace + breadcrumbs + 用户上下文。**Sentry 比 \`console.error\` 强 100 倍**,因为它能跨请求聚合"同一类错误",而不是淹没在日志流里。

## Prompt 版本化与回滚

Prompt 改坏是 Agent 系统最常见的"回归"。工程化做法:

1. **Prompts as code**:所有 system prompt 进 git,不要散在数据库
2. **版本字符串**:每个 prompt 带一个 \`v1.3.2\` 后缀
3. **A/B 框架**:KV 配置控制比例,新 prompt 先放 10% 流量
4. **Eval gate**:新 prompt 必须在 eval 集上 >= 老 prompt 才能合并
5. **回滚单点**:发现问题,改一个 KV 值就回滚,不需要重新部署

Anthropic 和 OpenAI 的内部工具都把 prompt 当作"代码 + 配置"的混合体管理。**这是 2026 年 Agent 工程师的标配能力**。

## 灰度发布的产品策略

技术上能灰度,产品上要决定"按什么维度灰度":

| 维度 | 适合 | 注意 |
| --- | --- | --- |
| 按用户 ID 哈希 | 通用,公平 | 新功能用户可能反复看到/不到 |
| 按套餐 | Pro 用户先体验 | 制造升级动力 |
| 按地区 | 国家级合规验证 | 适合海外产品 |
| 按用户主动加入 beta | 老粉先体验 | 反馈质量最高 |

**新功能的最佳上线节奏**:beta 用户 → 10% Pro → 30% Pro → 100% Pro → Free。每一档观察 3-7 天,有任何指标退化立刻暂停。

## Eval 数据集的构建与维护

Eval(评估)比监控更早暴露问题。一个最小 Eval pipeline:

| 步骤 | 内容 |
| --- | --- |
| 1. 收集 | 从真实日志抽样 50-100 个"代表性问题" |
| 2. 标注 | 人工或 GPT-4o 标"标准答案" |
| 3. 打分 | 用 GPT-4o 当裁判,对比新版 Agent 回答与标准答案,打 1-5 分 |
| 4. 回归 | 每次 prompt/模型/工具改动,跑全量 eval,看胜率 |
| 5. 扩充 | 把线上发现的 bad case 加入 eval 集,持续生长 |

**目标**:eval 集稳定在 100-500 条,每条都有人工核过的标准答案。这是你产品质量的"基线",任何改动如果让 eval 胜率下降 >5%,直接拒绝合并。

> ✅ **TAKEAWAY** "好用的 Agent" 不是写出来的,是**评估出来的**。没有 eval pipeline 的 Agent 项目,等于在沙漠里盲走。

:::figure caption="Agent 可观测性栈:Logs / Metrics / Traces / Evals" alt="架构图"
:::
`

const s_cases = `
# 5.1 5 个真实案例拆解

理论讲完,现在把镜头拉到产品。下面 5 个案例都是在边缘上跑、月活在万级以上的真 Agent — 不是 demo,是赚钱的。重点看它们怎么组装前面讲过的零件,关键指标如何、最难的工程问题在哪。最后再讲两个"挂掉的案例",看看哪些事不能干。

## 案例 1:Cursor 风格的代码补全 Agent

| 维度 | 实现 |
| --- | --- |
| 边缘运行时 | Workers + Durable Objects(每用户一个会话) |
| 模型 | 自托管 7B FIM 模型 + GPT-4o 兜底,用 AI Gateway 路由 |
| 检索 | 本地代码 AST + Vectorize 跨仓库 |
| 流式 | SSE,首字延迟目标 < 200ms |
| 计费 | Pro $20/月,内含 500 次重型补全 |
| 关键设计 | 80% 请求小模型秒回,只有"复杂多文件"才路由到 GPT-4o |

> ✅ **拿走什么**:**路由策略**胜过"用更大的模型"。便宜模型 + 智能 fallback = 利润空间。

## 案例 2:做客服的「产品手册问答 Agent」

| 维度 | 实现 |
| --- | --- |
| 边缘运行时 | Workers + Workflows |
| 模型 | Llama 70B + reranker |
| 检索 | Vectorize(2 万条文档块) |
| 鉴权 | 商家 JWT + 终端用户 anonymous |
| 计费 | 按商家月度对话量阶梯 |
| 关键设计 | 答错时自动转人工 + 反馈进入 D1,夜间用于 prompt 优化 |

> ✅ **拿走什么**:**给 Agent 加 \"我不知道\" 的能力**比让它无所不知更重要。"不会就转人工"反而提升满意度。

## 案例 3:小红书风格「文案 Agent」

| 维度 | 实现 |
| --- | --- |
| 边缘运行时 | Workers + Queues(批量任务) |
| 模型 | Claude Haiku + 自有微调 |
| 输入 | 用户上传素材图 → R2 |
| 输出 | 5 种风格文案 + Hashtag |
| 计费 | 按条 ¥0.5,套餐 ¥99/月 含 300 条 |
| 关键设计 | "风格"是 prompt 模板 + few-shot,用户可保存自己的风格,沉淀私域价值 |

> ✅ **拿走什么**:**让用户能"训练"自己的风格**,是把一次性工具变成订阅产品的关键钩子。

## 案例 4:研究助手「论文综述 Agent」

| 维度 | 实现 |
| --- | --- |
| 边缘运行时 | Workflows(每篇论文一个 workflow) |
| 模型 | GPT-4o + Claude Opus 兜底长文档 |
| 检索 | arXiv API + Semantic Scholar + Vectorize |
| 输出 | Markdown 综述 + 引用 BibTeX |
| 计费 | 学术机构席位制 |
| 关键设计 | **每一步可中断、可重启**(Workflows 原生),长任务 30 分钟内可恢复 |

> ✅ **拿走什么**:**长任务 ≠ 阻塞用户**。给个进度页 + 邮件通知,用户体验照样好。

## 案例 5:语音陪练「英语口语 Agent」

| 维度 | 实现 |
| --- | --- |
| 边缘运行时 | Durable Objects + WebSocket(双向音频) |
| 模型 | Whisper(转写)+ Llama 70B(对话)+ ElevenLabs(TTS) |
| 状态 | DO 内保留对话历史 + 用户错题本 |
| 计费 | 月卡 ¥49,内含 30 分钟语音 |
| 关键设计 | **延迟预算分解**:STT 200ms + LLM 600ms + TTS 400ms,总 < 1.5s 才有"在对话"感 |

> ✅ **拿走什么**:语音类产品的所有体验都来自**延迟分配**。先列预算,再选模型。

## 5 个案例的真实指标对比

| 案例 | MAU | 月营收区间 | 毛利 | 单次会话成本 |
| --- | --- | --- | --- | --- |
| 代码补全 | 5 万+ | $30-80 万 | ~70% | $0.02 |
| 客服问答 | 8 千+(商家) | ¥50-150 万 | ~60% | ¥0.06 |
| 文案 Agent | 12 万+ | ¥80-200 万 | ~75% | ¥0.05 |
| 论文综述 | 3 千+(机构) | $20-50 万 | ~88% | $0.12 |
| 语音陪练 | 6 万+ | ¥40-100 万 | ~55% | ¥0.18 |

**毛利率高的产品共性**:大小模型分工 + 自有数据壁垒;**毛利率低的共性**:依赖第三方贵模型(GPT-4o)或重度多模态(语音/视频)。

## 每个案例最难的工程问题

| 案例 | 最难的事 | 怎么解的 |
| --- | --- | --- |
| 代码补全 | 低延迟下做"项目级语境" | AST 解析后用边缘缓存,每个开发者一个 DO |
| 客服问答 | 知识库每周更新但不能影响线上 | 双索引轮换,新索引验收后切流 |
| 文案 Agent | 用户的"风格"如何沉淀 | 每条用户接受的文案进 Vectorize,作为 few-shot |
| 论文综述 | 30 分钟任务的中断恢复 | Workflows + 阶段性 R2 落地 |
| 语音陪练 | 延迟预算 1.5 秒内塞下 STT+LLM+TTS | 流式 STT + 流式 LLM 重叠 + 短句 TTS |

## 补一个国内案例:跨境电商「商品详情自动改写」

国内电商客户的真实场景。需求:每天新增 5 万 SKU,需要根据卖点 + 类目 + 用户评论自动生成中英日韩四语种详情页。

| 维度 | 实现 |
| --- | --- |
| 边缘运行时 | 阿里云 ESA + 函数计算(国内合规) |
| 模型 | 通义千问 turbo + 私有微调 |
| 队列 | RocketMQ 异步派发 |
| 检索 | 自有 ES + 嵌入 SDK |
| 输出 | 落对象存储 + CDN 分发 |
| 计费 | 按 SKU 包月,大客户企业内嵌 |
| 关键设计 | "卖点抽取"模型与"文案生成"模型分两层,前者准、后者快 |

**国内场景与海外差异**:模型供应、合规、计费方式都不同,但 Agent 工程的核心模式(状态层 + 工具调用 + 主循环)完全一致。换平台时,要迁移的是 API 和部署细节,不是这套工程骨架。

## MVP 第一周长什么样

如果你今天动手做一个 Agent 产品,7 天能做到什么?给你一个真实节奏参考(独立开发者):

| Day | 任务 | 产出 |
| --- | --- | --- |
| 1 | 跑通 Hello + 选定垂类 | 第一个能流式回答的 Worker |
| 2 | 加 DO 记忆 + 写 2-3 个工具 | 多轮对话的 Agent |
| 3 | 接 RAG,导入垂类资料 | 能回答专业问题 |
| 4 | 做最简洁的前端(Next + shadcn) | 可用的 UI |
| 5 | 加鉴权 + Stripe 接入 | 能收钱 |
| 6 | 落地页 + 部署 | 可对外公开 URL |
| 7 | 找 5 个朋友/真实用户测 | 反馈清单 |

**第 7 天底,你应该已经知道"这个产品到底值不值得做下去"**。MVP 不是要完美,是要快速验证需求。

## 两个"挂掉的案例"(避坑)

### 失败案例 1:面向 C 端的"AI 律师"

定位:用户上传合同,Agent 帮你审、找漏洞、给改写建议。

为什么挂:**法律幻觉成本无限**。模型偶尔编出一条不存在的法条,用户照此修改后吃了官司,产品被告。**任何"错了用户会真受伤"的领域,Agent 都不能直接做 to C**,只能做"专业人员的助手"。

### 失败案例 2:全自动"AI 销售线索挖掘"

定位:Agent 自动爬目标公司网站、找联系人、发开场邮件、跟进。

为什么挂:**法律 + 平台双重红线**。GDPR、CCPA 严管自动化外联,LinkedIn / 邮箱厂商封号。技术上可以,但**产品天花板不在工程,在法律**。

> ⚠️ **教训** 上线前必须问自己两个问题:
> 1. 如果模型这次答错,**最坏后果是谁来承担**?
> 2. 我做的事**有没有违反任何平台 ToS 或国家法律**?

## 5 个案例的共同模式

| 模式 | 出现次数 |
| --- | --- |
| 大小模型路由(便宜模型兜底) | 5/5 |
| 流式 + 过程透明 | 5/5 |
| 自有私有数据(KB / 文档 / 风格) | 4/5 |
| 兜底转人工/兜底大模型 | 4/5 |
| 用 Workflows 做长任务 | 3/5 |
| WebSocket | 1/5 |

:::figure caption="5 案例共享的边缘 Agent 通用架构" alt="参考架构图"
:::

> ✅ **TAKEAWAY** 你不需要发明新架构。**90% 的边缘 Agent 产品都是这同一套零件不同排列**。先抄,再调,后创新。先选一个"错了不致命"的垂类,再加规模。
`

const s_next = `
# 5.2 成本对比、风险与下一步

终章。我们把视角拉远,看看边缘 Agent 真实的**单位经济**、**法律与合规风险**,以及**你下一步该怎么学**。

## 成本对比:边缘 vs 中心化(同样跑 100 万 Agent 调用)

| 项目 | 中心化(AWS) | 边缘(Cloudflare) |
| --- | --- | --- |
| 计算 | 4× c5.2xlarge × 720h = ~$1100 | Workers 100万请求 = ~$5 |
| 模型推理 | OpenAI $4-6k(GPT-4o 中等) | Workers AI Llama 70B ~$400 |
| 数据库 | RDS PostgreSQL ~$120 | D1 ~$5 |
| 向量库 | Pinecone ~$70 | Vectorize ~$5 |
| 对象存储 | S3 + 出口 ~$50 | R2 出口 $0 |
| **小计** | **~$5300+** | **~$415** |
| **每千次调用** | **~$5.3** | **~$0.42** |

> 数据基于公开价目表估算,实际取决于 prompt 长度、模型、缓存命中率。

**边缘 Agent 的成本结构性更优,而且是数量级差距**。这不是 Cloudflare 写 PR,是物理规律 — 不维护机器、按调用计费、就近返回省带宽。

## 三类必须正视的风险

### 1 模型供应商风险

- **政策变化**:OpenAI 区域可用性、Anthropic ToS 调整,随时可能影响你
- **模型替换**:Workers AI 默认 sku 会迭代,生产**必须锁版本**
- **价格上涨**:Anthropic Opus 4 上线后旧版本逐步涨价
- **应对**:AI Gateway 做抽象层,代码里**不要直接 \`fetch openai.com\`**

### 2 数据合规风险

| 风险 | 中国市场 | 出海市场 |
| --- | --- | --- |
| 个人信息出境 | PIPL + 备案 | GDPR、CCPA |
| 模型生成内容备案 | 大模型备案制度 | EU AI Act |
| 数据训练授权 | 用户协议要写清 | 同左 |

> ⚠️ **注意** 给中国用户做 Agent 产品,生成式 AI 服务备案是绕不开的。先看清要不要,再投入。

### 3 工程债务

Agent 工程的隐藏债务比普通 SaaS 多:**prompt 没版本控、eval 没自动化、知识库没刷新机制**。早期为了快可以放,但要心里有数,**6 个月后要还**。

## 下一步学习路径(按周计划)

| 周次 | 任务 | 产出 |
| --- | --- | --- |
| W1 | 跑通前 5 节 | 个人 Agent demo |
| W2-3 | 接入 RAG,做自己的知识库 | 私人助手 |
| W4 | 加鉴权、计费、灰度 | 1.0 alpha |
| W5-6 | 跑通 5 个真实用户 | 反馈清单 |
| W7-8 | 建 eval pipeline | 可量化迭代 |
| W9+ | 选择垂类深耕 / 跑用户增长 | 真正的产品 |

## 30 天可执行清单

把"学完→上线"压缩到 30 天的具体动作:

| 周次 | 每周必做 | 周末复盘问题 |
| --- | --- | --- |
| W1 | 跑通 Hello Agent、加 DO 记忆、写 3 个工具 | 我的 Agent 解决了一个真实痛点吗? |
| W2 | 接 RAG,导入你领域的 10 万字资料 | 答对率 > 70% 了吗? |
| W3 | 加 SSE 流式 + 鉴权 + 计费 + 限流 | 端到端 P95 延迟 < 4 秒了吗? |
| W4 | 找 5 个真实用户内测,埋指标 | 他们愿意推荐给朋友吗? |

满足"答对率 > 70% + P95 < 4s + 真实推荐 > 0"才算合格,可以开始考虑公开发布。

## 「先做用户,再做架构」的执行细则

最常见的错误:**还没用户,就纠结要不要上 Workflows、要不要换 70B**。正确顺序:

1. **0-100 用户**:Llama 8B + Hello Agent 框架 + DO 记忆,什么都不优化
2. **100-1000 用户**:开始看真实痛点,只优化最贵/最慢/最容易出错的那一处
3. **1000-10000 用户**:RAG + 大小模型路由 + 计费 + Eval pipeline
4. **10000+ 用户**:多 Agent、Workflows、自有微调

每一步**只解决当前阶段的关键问题**,不要"为未来扩展性"过早投入。Agent 产品迭代速度极快,过早架构 = 沉没成本。

## 反图书清单(警惕这些资源)

正面书单很多,但有些资源**反而会让你浪费时间**,提前预警:

- 任何"3 天精通 LangChain"类教程 — 不要花时间在某个框架的 API 上,框架两年一变
- 标榜"一键无代码搭建 Agent"的 SaaS — 跑通玩具可以,做产品做不深
- 国内某些"AGI 训练营"售卖 wide-and-shallow 课程,几千块买回一堆 demo 代码
- 2024 年之前出版的 LLM 应用书,内容多半已过时

学习的核心是**亲手做一个能赚 1 块钱的产品**,任何不能直接让你做产品的资源都是次要的。

## Agent 工程师的职业发展

最后聊一下职业。2026 年的"AI 应用工程师"职位画像:

| 能力 | 重要性 |
| --- | --- |
| 工程能力(后端 / 全栈) | ★★★★★ |
| Prompt + Eval 工程 | ★★★★★ |
| 模型选型与计费控制 | ★★★★ |
| ML 基础(不需要会训) | ★★★ |
| 产品 sense | ★★★★ |

**最稀缺的是"懂工程 + 懂产品的全栈"**。纯算法工程师不缺,纯前端不缺。能从需求一路打通到上线、还能算清账的人,薪资一般是普通后端 1.5-2 倍。

Agent 这个赛道的好处是**老人没什么积累优势**,2 年经验和 10 年经验在这个领域差距远小于传统后端。**这是你换轨的窗口期**。

## 加入哪些社区

学习的另一半是社区,这里是我个人认为信噪比最高的几个:

- **Cloudflare Developers Discord** — Workers / DO 官方频道,工程师本人答疑
- **Hacker News** — 关注 \`ai-agents\` \`llm-engineering\` 标签
- **r/LocalLLaMA** — 模型/微调/本地部署的最大社区
- **Latent Space** podcast — AI engineer 视角的访谈与分析
- **buildspace / Pioneer** — 独立开发者出海的社群
- 国内:**即刻、X / Twitter** 上的 AI 应用工程师们,关注 30 个就够
- 微信生态:作者自己运营的 **2aran 写作变现** 公众号有详细案例

**社区不在多,在精**。3-5 个高质量来源 + 自己动手实践,比订阅 50 个 newsletter 强 10 倍。

## 推荐书单与外部资源

精选(不水):

- 《AI Engineering》— Chip Huyen,2025 年最系统的 AI 工程书
- 《Designing Machine Learning Systems》— Chip Huyen,系统设计基本功
- Anthropic 官方博客「Building effective agents」(2024) — 业界引用最广的 Agent 工程指南
- Cloudflare \`developers.cloudflare.com/agents/\` — 边缘 Agent 官方文档
- \`github.com/Mastra-AI/mastra\` — 开源 TypeScript Agent 框架,可读源码学习
- \`github.com/openai/swarm\` — OpenAI 多 Agent 参考实现
- 公众号「2aran 写作变现」(本作者本人 — 本书所有案例数据原始记录在这里)

## 作者的踩坑笔记(让结语有点人味)

最后讲三件我个人 2024-2026 这两年踩过的坑,给你避雷:

**1. 我曾经花 2 个月做"多 Agent 编排框架"**,结果第一个客户用单 Agent + 5 个工具就赢了我。**框架是结果,不是起点**。

**2. 我曾经迷信 GPT-4o 万能**,结果 80% 的客户场景 8B 模型 + 好 prompt 就能跑通。GPT-4o 的钱可以省下来做用户增长。

**3. 我曾经觉得"上线就完了"**,结果上线只是开始 — 真正的工程在持续 eval、prompt 迭代、bad case 收集、模型版本管理。**Agent 是养出来的,不是建出来的**。

## 结语

边缘 + Agent 不是"两个技术热词的拼接",而是 **2026 年新一代 SaaS 的默认架构**。你今天写的这套代码,3 年后会是行业基线。但**先有用户,再有架构** — 别本末倒置。

> ✅ **TAKEAWAY**
> 1. **先跑通 Hello,再谈优化** — 不要一开始就上 Workflows 多 Agent
> 2. **盯单用户 ROI** — Agent 产品的护城河是垂类数据,不是模型
> 3. **把代码当作脚手架** — 复制代码,删掉不需要的,加上你的领域
> 4. **30 天上线,3 年迭代** — 短期靠工程,长期靠产品节奏

谢谢你读到这里。下一站,在你的 Agent 产品里见。

— 写于 2026 春,边缘上
`

/* ========================== assemble ========================== */

function withPractice(markdown: string, exercise: string, figureCaption: string) {
  return `${markdown}

---

## 动手做

${exercise}

:::figure caption="${figureCaption}"
:::
`
}

const edgeAgentDevCourseSource = {
  slug: 'edge-agent-dev-course',
  title: '边缘智能体开发实战',
  subtitle: '从 0 到 1 把 AI Agent 跑在 Cloudflare Workers 上',
  intro:
    '一本写给「想把 AI Agent 做成可上线产品」的开发者的小册。我们不讲调参玄学,只讲架构、状态、流式、计费、监控 — 那些把 demo 变成 SaaS 的工程细节。每一节都有可直接复制的代码与可粘贴到掘金编辑器的 Markdown 源。',
  cover: {
    badge: '边缘 × Agent · 2026 实战',
    externalEditorUrl: 'https://juejin.cn/editor/book/7646241526789963814/section/summary',
  },
  audience: [
    '已经写过 OpenAI / Anthropic 调用、但没把它产品化的全栈开发者',
    '想用最低运维成本上线 SaaS 的独立开发者',
    '前端/Next.js 工程师,想把 Agent 嵌进自己的产品',
    '团队里负责 LLM 应用工程化的技术 Lead',
  ],
  outcomes: [
    '理解 Workflow / Agent / 边缘运行时的本质区别',
    '用 Cloudflare Workers + Workers AI 从零搭出可流式、可扩展的 Agent',
    '用 Durable Objects、Vectorize、D1、R2 组装一套生产级状态层',
    '为 Agent 加上鉴权、计费、限流、灰度与可观测性,直接上线收钱',
  ],
  prerequisites: [
    'TypeScript / JavaScript 熟练(异步、Stream API)',
    '用过任意一种 LLM API(OpenAI / Anthropic / 通义千问 均可)',
    '对 HTTP、WebSocket、SSE 有基本认知',
    '**不需要**机器学习/训练经验',
  ],
  meta: {
    sectionCount: 16,
    totalMinutes: 276,
    updatedAt: '2026-06-01',
    suggestedPrice: '免费公开阅读',
  },
  chapters: [
    {
      slug: 'ch-intro',
      title: '第一章 · 作者介绍与购买须知',
      sections: [
        {
          slug: 'intro-and-purchase-notes',
          title: '作者介绍、小册介绍与购买须知',
          summary: '正式阅读前,先了解作者、内容范围、适宜人群和购买说明。',
          estMinutes: 6,
          free: true,
          markdown: s_intro,
        },
      ],
    },
    {
      slug: 'ch-landscape',
      title: '第二章 · 边缘智能体的全景',
      sections: [
        {
          slug: 'why-edge-2026',
          title: '为什么 2026 年 Agent 必须跑在边缘',
          summary: 'Agent 的瓶颈不是模型,是距离和状态。边缘把两者一次性解决。',
          estMinutes: 8,
          free: true,
          markdown: withPractice(
            s_open,
            '找一个你现在熟悉的 AI 功能,把它拆成三列:模型调用、状态读写、外部工具。然后标出每一步发生在哪个地理位置、需要等待什么网络请求、失败后能不能恢复。这个练习会很快暴露出一个事实:Agent 慢,往往不是模型慢,而是状态和工具链路被拉得太长。',
            '一次 Agent 请求在中心化架构和边缘架构中的链路差异',
          ),
        },
        {
          slug: 'edge-runtime-landscape',
          title: '边缘运行时全景:Workers / Edge Functions / Durable Objects',
          summary: '三层能力金字塔 + 主流平台逐项对比 + 为什么用 Cloudflare。',
          estMinutes: 12,
          free: true,
          markdown: withPractice(
            s_landscape,
            '为你的 Agent 画一张运行时选型表。横向写 Workers、Vercel Edge、传统 Node 服务、云函数,纵向写冷启动、状态、长连接、数据库、部署、成本。不要急着选最酷的,先看哪一个能让你的第一个版本最快上线。',
            'Agent 运行时选型矩阵',
          ),
        },
        {
          slug: 'agent-vs-workflow',
          title: 'Agent vs Workflow:本质区别与选择',
          summary: '一句话讲清两者差异,给出决策矩阵和嵌套模式。',
          estMinutes: 10,
          free: true,
          markdown: withPractice(
            s_agent_vs_workflow,
            '拿一个真实需求做判断:用户目标是否固定,步骤是否固定,失败后是否需要重新规划,是否需要读工具返回结果再决定下一步。四个问题里只要有两个以上答案是“不固定”,再考虑 Agent；否则先用 Workflow。',
            'Workflow 与 Agent 的决策分叉图',
          ),
        },
      ],
    },
    {
      slug: 'ch-hello-agent',
      title: '第三章 · 5 分钟跑通第一个 Edge Agent',
      sections: [
        {
          slug: 'hello-edge-agent',
          title: 'Hello, Edge Agent — Workers AI 起手式',
          summary: '50 行代码,流式 Hello,全球部署。',
          estMinutes: 10,
          free: true,
          markdown: withPractice(
            s_hello_agent,
            '把 Hello Agent 部署到 Cloudflare Workers 后,不要只在本地看返回。用手机热点、公司网络、家庭网络各访问一次,记录首字延迟和完整响应时间。第一次数据不用精确,重点是建立“上线后要看真实网络”的习惯。',
            'Hello Agent 从本地到边缘节点的请求路径',
          ),
        },
        {
          slug: 'agent-main-loop',
          title: 'Agent 主循环:Perception → Plan → Action → Observe',
          summary: 'ReAct 循环的可生产实现 + 三种退出条件设计。',
          estMinutes: 14,
          free: true,
          markdown: withPractice(
            s_main_loop,
            '给主循环加三个硬限制:最大轮数、最大耗时、最大工具调用次数。然后故意让模型遇到一个无法完成的任务,观察它会不会停下来。能停下来的 Agent,才有资格继续加能力。',
            'Agent 主循环与退出条件',
          ),
        },
        {
          slug: 'tool-use-on-edge',
          title: '在边缘上做 Tool Use(函数调用)',
          summary: '工具签名、实现、安全护栏 5 准则、不可回滚动作的人工确认。',
          estMinutes: 12,
          free: true,
          markdown: withPractice(
            s_tool_use,
            '先只给 Agent 暴露一个只读工具,例如 searchDocs 或 getUserProfile。等日志里确认参数稳定、错误可控后,再加写入类工具。不要一开始就让模型拥有删除、付款、发邮件这类不可回滚能力。',
            '工具能力从只读到可写的权限阶梯',
          ),
        },
      ],
    },
    {
      slug: 'ch-state',
      title: '第四章 · 状态、记忆与检索',
      sections: [
        {
          slug: 'durable-objects',
          title: 'Durable Objects:每个会话一个小宇宙',
          summary: 'DO 三承诺 + 给 Hello Agent 加记忆 + 三种存储模式取舍。',
          estMinutes: 14,
          free: true,
          markdown: withPractice(
            s_durable_objects,
            '为一个用户会话设计 Durable Object ID。先写清楚它应该按 userId、conversationId 还是 workspaceId 分片,再决定记忆保存在对象状态、D1 还是 R2。ID 设计错了,后面迁移会很痛。',
            '每个会话一个 Durable Object 的状态边界',
          ),
        },
        {
          slug: 'storage-zoo',
          title: 'KV / D1 / R2 在 Agent 里的角色分工',
          summary: '一张图分清四种存储产品的位置和取舍小抄。',
          estMinutes: 10,
          free: true,
          markdown: withPractice(
            s_storage_zoo,
            '把你的 Agent 数据分成四类:配置、结构化记录、大文件、向量索引。分别放到 KV、D1、R2、Vectorize 的候选位置,然后标出哪些数据可以丢、哪些必须强一致、哪些需要审计。',
            'Agent 数据在 KV、D1、R2、Vectorize 之间的分工',
          ),
        },
        {
          slug: 'rag-on-edge',
          title: 'Vectorize 实战:RAG on the Edge',
          summary: '建索引、向量化、检索、prompt 拼接,以及让 RAG 真能用的三个旋钮。',
          estMinutes: 14,
          free: true,
          markdown: withPractice(
            s_rag,
            '选 10 篇你自己的文章或 10 个产品文档做一个最小知识库。先不要追求自动化流水线,手动切块、写入向量库、跑 20 个问题,把答错的样本记录下来。RAG 的优化从 bad case 开始。',
            'RAG 从文档切块到回答回放的闭环',
          ),
        },
      ],
    },
    {
      slug: 'ch-engineering',
      title: '第五章 · 工程化与产品化',
      sections: [
        {
          slug: 'streaming',
          title: '流式响应:SSE 与 WebSocket 在 Workers',
          summary: 'SSE 三方案对比、夹带工具事件的 stream 设计、WS 的两个真实用例。',
          estMinutes: 14,
          free: true,
          markdown: withPractice(
            s_streaming,
            '给流式响应加三类事件:message、tool_call、done。前端不要只拼文本,也要把工具调用过程显示出来。用户看到 Agent 正在查什么、调用什么,等待的焦虑会明显降低。',
            'SSE 事件流中的文本、工具和完成事件',
          ),
        },
        {
          slug: 'multi-agent',
          title: '多 Agent 协作:Workflows + 队列',
          summary: '三种协作拓扑、Durable Execution 实战、两个常见反模式。',
          estMinutes: 14,
          free: true,
          markdown: withPractice(
            s_multi_agent,
            '先不要设计 5 个 Agent。把任务拆成 planner、worker、reviewer 三个角色就够了。每个角色只保留一项职责,并把中间产物写入队列或数据库,这样失败后才有地方恢复。',
            'Planner、Worker、Reviewer 的最小协作拓扑',
          ),
        },
        {
          slug: 'auth-billing-rate-limit',
          title: '鉴权、计费、限流:把 Agent 包装成 SaaS',
          summary: 'JWT、按 token 计费、三层限流金字塔、价格分层 + 反作弊清单。',
          estMinutes: 14,
          free: true,
          markdown: withPractice(
            s_auth_billing,
            '即使产品暂时免费,也要先加用量记录。至少记录 userId、模型、输入 token、输出 token、工具次数、总耗时。没有这些数据,后面谈定价、限流和成本优化都只能靠猜。',
            '免费阶段也应该保留的用量账本',
          ),
        },
        {
          slug: 'observability',
          title: '可观测性、灰度与回滚',
          summary: 'Logs/Metrics/Traces 三件套、灰度命令、Eval 为什么比监控更重要。',
          estMinutes: 12,
          free: true,
          markdown: withPractice(
            s_observability,
            '为 Agent 准备 20 条固定评测问题,每次改 prompt、换模型、加工具都跑一遍。不要只看是否能回答,还要看是否调用了不该调用的工具、是否漏掉关键上下文、成本是否突然上升。',
            'Prompt、模型、工具变更前后的评测对照',
          ),
        },
      ],
    },
    {
      slug: 'ch-cases-next',
      title: '第六章 · 真实案例与下一步',
      sections: [
        {
          slug: 'five-cases',
          title: '5 个真实案例拆解',
          summary: 'Cursor 风格代码补全、客服问答、文案 Agent、研究助手、语音陪练。',
          estMinutes: 16,
          free: true,
          markdown: withPractice(
            s_cases,
            '从案例里挑一个最接近你业务的,只复刻它的最小闭环:一个入口、一个核心工具、一个状态存储、一个可观察指标。不要一开始复刻完整产品,先复刻价值链路。',
            '从案例拆出最小可复刻闭环',
          ),
        },
        {
          slug: 'cost-risk-next-steps',
          title: '成本对比、风险与下一步学习路径',
          summary: '边缘 vs 中心化的单位经济、三类必须正视的风险、按周学习计划。',
          estMinutes: 12,
          free: true,
          markdown: withPractice(
            s_next,
            '最后做一张 30 天路线图。第一周跑通 Hello Agent,第二周加工具和状态,第三周接 RAG 和流式,第四周补日志、限流和评测。每周只交付一个能被真实用户试用的小版本。',
            '30 天把边缘 Agent 从原型推到试用版',
          ),
        },
      ],
    },
  ],
}

export const edgeAgentDevCourse: PublishLabBooklet = {
  slug: edgeAgentDevCourseSource.slug,
  title: edgeAgentDevCourseSource.title,
  subtitle: edgeAgentDevCourseSource.subtitle,
  badge: edgeAgentDevCourseSource.cover.badge,
  suggestedPrice: edgeAgentDevCourseSource.meta.suggestedPrice,
  audience: [...edgeAgentDevCourseSource.audience],
  outcomes: [...edgeAgentDevCourseSource.outcomes],
  sections: edgeAgentDevCourseSource.chapters.flatMap(chapter =>
    chapter.sections.map(section => ({
      slug: section.slug,
      title: section.title,
      summary: section.summary,
      minutes: section.estMinutes,
      markdown: section.markdown,
    })),
  ),
}
