<div align="center">

[![syncblog-md](https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/gh/doocs/md/images/logo-2.png)](https://github.com/TUARAN/md)

</div>

<h1 align="center">Syncblog</h1>

<p align="center">一文多发，30 分钟完成 30+ 平台同步</p>

<div align="center">

[![CI](https://img.shields.io/github/actions/workflow/status/TUARAN/md/ci.yml?style=flat-square&label=CI&labelColor=564341&color=42cc23)](https://github.com/TUARAN/md/actions/workflows/ci.yml) [![version](https://img.shields.io/badge/version-2.2.0-42cc23?style=flat-square&labelColor=564341)](https://github.com/TUARAN/md/blob/main/CHANGELOG.md) [![node](https://img.shields.io/badge/node-%3E%3D22.19.0-42cc23?style=flat-square&labelColor=564341)](https://nodejs.org/en/about/previous-releases) [![stars](https://img.shields.io/github/stars/TUARAN/md?style=flat-square&labelColor=564341&color=42cc23)](https://github.com/TUARAN/md/stargazers) [![forks](https://img.shields.io/github/forks/TUARAN/md?style=flat-square&labelColor=564341&color=42cc23)](https://github.com/TUARAN/md/forks)

</div>

## 📝 项目介绍

**Syncblog**（中文：博主联盟同步工具）面向博主、开发者创作者与内容运营团队，用于搭建从**数据获取 → 风格二创 → 内容同步 → 创作名片**的一站式内容工作台。它保留 Markdown 编辑、主题排版、图床与 AI 辅助能力，并进一步强化多平台账号检测、跨平台草稿写入、创作者主页导航展示等分发场景。

**当前阶段重心**：**内容分发与同步**。编辑器通过 **COSE** 浏览器扩展把同一篇内容写入知乎、公众号、微博、CSDN、掘金等平台草稿；同时提供「创作名片」页面，汇总创作者的平台主页，便于对外展示账号矩阵。

> 本项目编辑器内核源自开源社区项目 [doocs/md](https://github.com/doocs/md)，在此基础上强化了产品与流程叙事。**若对你有帮助，欢迎点个 Star ⭐️。**

## 🌐 在线体验

[https://syncblog.cn](https://syncblog.cn)

> **推荐使用 Chrome 浏览器**，效果最佳。

## 🤔 产品定位说明

传统排版工具往往只管「单篇文章美化」，难以承接团队在多平台、多账号下的同步、复用与对外展示。**Syncblog** 以「内容工厂」为产品边界：当前版本先把素材获取、二创、排版、分发、账号主页展示这条链路跑顺，后续再迭代社群分发、内容校验、互动运营与数据回流。

欢迎在 [Issues](https://github.com/TUARAN/md/issues) 反馈场景需求。

## ✨ 功能特性

### 🎨 核心功能

- ✅ **完整 Markdown 支持** - 支持所有基础语法、数学公式
- ✅ **图表渲染** - 支持 Mermaid 图表和 [GFM 警告块](https://github.com/orgs/community/discussions/16925)
- ✅ **PlantUML 支持** - 强大的 UML 图表渲染
- ✅ **Ruby 注音扩展** - 支持 `[文字]{注音}`、`[文字]^(注音)` 格式，支持多种分隔符

### 🎯 编辑体验

- ✅ **代码高亮** - 丰富的代码块高亮主题，提升代码可读性
- ✅ **自定义样式** - 允许自定义主题色和 CSS 样式，灵活定制展示效果
- ✅ **草稿保存** - 内置本地内容管理功能，支持草稿自动保存

### 🚀 高级功能

- ✅ **多图床支持** - 提供多种图床选择，便捷的图片上传功能
- ✅ **文件管理** - 便捷的文件导入、导出功能，提升工作效率
- ✅ **AI 集成** - 集成主流 AI 模型（DeepSeek、OpenAI、通义千问、腾讯混元、火山方舟、302.AI 等），智能辅助内容创作
- ✅ **数据获取** - 接入资讯检索入口，支持把素材带入二创流程
- ✅ **风格二创** - 内置长文提示词模板，可将资讯素材转成可继续排版的 Markdown
- ✅ **内容同步** - 通过 COSE 扩展，支持多平台草稿写入
- ✅ **创作名片** - 自动缓存已登录平台账号，生成面向品牌方的平台主页导航页

## 🔄 工作流导航

顶部导航将能力组织为一条内容生产链路，当前成熟度如下：

| 步骤     | 说明                                                              | 状态         |
| -------- | ----------------------------------------------------------------- | ------------ |
| 数据获取 | 接入 GNews、NewsAPI 等资讯源，检索结果可带入二创                  | 可用         |
| 风格二创 | 长文提示词模板，将素材整理为可继续排版的 Markdown                 | 可用         |
| 内容同步 | Markdown 编辑、主题排版、富文本复制、多平台草稿写入               | **核心能力** |
| 平台矩阵 | 按创作者梳理各平台账号；粉丝/阅读优先取检测缓存，缺省回落仓库快照 | 主链路       |
| 宣发活跃 | 按创作者 + 平台切换宣发策略（CSDN / X / 云社区等）                | 建设中       |
| 闭环汇报 | 发布效果与数据回流                                                | 规划中       |

另提供 **创作名片** 独立页面：汇总各平台已检测到的账号主页，便于对外展示创作者矩阵（入口在编辑器顶栏）。

## 🔌 浏览器扩展（内容同步）

多平台草稿写入依赖 **COSE** 浏览器扩展：

| 扩展                                                                                                   | 适用场景                                       | 获取方式                                                                            |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| [COSE 官方版（doocs/cose）](https://chromewebstore.google.com/detail/ilhikcdphhpjofhlnbojifbihhfmmhfk) | 知乎 / 公众号 / 微博 / 思否 / 掘金 / CSDN 等   | Chrome 网上应用店安装                                                               |
| [COSE 改造版（TUARAN/cose）](https://github.com/TUARAN/cose/releases/latest)                           | 官方版漏写或字段对不上时的备选；覆盖更多边角场 | GitHub Releases 下载 `.zip`，`chrome://extensions/` → 「开发者模式」→「加载已解压」 |

> 装 **COSE** 任一版本即可在内容同步页检测账号并写入草稿。

## 🖼️ 支持的图床服务

> 「默认」图床由服务端代传 GitHub，用户零配置；部署者需在 Worker Secret 或 `.env.local` 中设置 `IMGBED_GITHUB_TOKENS`（勿提交到 Git）。

| #   | 图床                                                   | 使用时是否需要配置                                                         | 备注                                                                                                                   |
| --- | ------------------------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | 默认                                                   | 否（需部署方配置服务端 Token）                                             | 经 `/api/imgbed/default` 代传 GitHub                                                                                   |
| 2   | [GitHub](https://github.com)                           | 配置 `Repo`、`Token` 参数                                                  | [如何获取 GitHub token？](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) |
| 3   | [阿里云](https://www.aliyun.com/product/oss)           | 配置 `AccessKey ID`、`AccessKey Secret`、`Bucket`、`Region` 参数           | [如何使用阿里云 OSS？](https://help.aliyun.com/document_detail/31883.html)                                             |
| 4   | [腾讯云](https://cloud.tencent.com/act/pro/cos)        | 配置 `SecretId`、`SecretKey`、`Bucket`、`Region` 参数                      | [如何使用腾讯云 COS？](https://cloud.tencent.com/document/product/436/38484)                                           |
| 5   | [七牛云](https://www.qiniu.com/products/kodo)          | 配置 `AccessKey`、`SecretKey`、`Bucket`、`Domain`、`Region` 参数           | [如何使用七牛云 Kodo？](https://developer.qiniu.com/kodo)                                                              |
| 6   | [MinIO](https://min.io/)                               | 配置 `Endpoint`、`Port`、`UseSSL`、`Bucket`、`AccessKey`、`SecretKey` 参数 | [如何使用 MinIO？](http://docs.minio.org.cn/docs/master/)                                                              |
| 7   | [S3 协议](https://aws.amazon.com/s3/)                  | 配置 `Endpoint`、`Region`、`Bucket`、`AccessKey`、`SecretKey` 参数         | 支持 AWS S3、Oracle、DigitalOcean 等兼容 S3 的存储服务                                                                 |
| 8   | [公众号](https://mp.weixin.qq.com/)                    | 配置 `appID`、`appsecret`、`代理域名` 参数                                 | [如何使用公众号图床？](https://md-pages.doocs.org/tutorial)                                                            |
| 9   | [Cloudflare R2](https://developers.cloudflare.com/r2/) | 配置 `AccountId`、`AccessKey`、`SecretKey`、`Bucket`、`Domain` 参数        | [如何使用 S3 API 操作 R2？](https://developers.cloudflare.com/r2/api/s3/api/)                                          |
| 10  | [又拍云](https://www.upyun.com/)                       | 配置 `Bucket`、`Operator`、`Password`、`Domain` 参数                       | [如何使用 又拍云？](https://help.upyun.com/)                                                                           |
| 11  | [Telegram](https://core.telegram.org/api)              | 配置 `Bot Token`、`Chat ID` 参数                                           | [如何使用 Telegram 图床？](https://github.com/doocs/md/blob/main/docs/telegram-usage.md)                               |
| 12  | [Cloudinary](https://cloudinary.com/)                  | 配置 `Cloud Name`、`API Key`、`API Secret` 参数                            | [如何使用 Cloudinary？](https://cloudinary.com/documentation/upload_images)                                            |
| 13  | 自定义上传                                             | 是                                                                         | [如何自定义上传？](/docs/custom-upload.md)                                                                             |

## 🎬 产品演示

<div align="center">

|                                      🎨 主题切换                                      |                                      🖼️ 图片上传                                      |
| :-----------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------: |
| ![demo1](https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/gh/doocs/md/images/demo1.gif) | ![demo2](https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/gh/doocs/md/images/demo2.gif) |

|                                      📝 样式扩展                                      |                                      🤖 一键排版                                      |
| :-----------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------: |
| ![demo3](https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/gh/doocs/md/images/demo3.gif) | ![demo4](https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/gh/doocs/md/images/demo4.gif) |

</div>

## 🛠️ 开发与部署

```sh
# 安装 node 版本
nvm i && nvm use

# 安装依赖
pnpm i

# 启动开发模式
pnpm web dev
# 访问 http://localhost:5173/md/

# 部署在 /md 目录
pnpm web build

# 部署在根目录（Cloudflare / Netlify 等）
pnpm web build:h5-netlify

# 一键：CF 构建 + wrangler deploy
pnpm deploy:cloudflare

# Chrome 插件（WXT）启动及调试
pnpm web ext:dev
# 访问 chrome://extensions/ 打开开发者模式，加载 apps/web/.output/chrome-mv3-dev

# Chrome 插件打包
pnpm web ext:zip

# Firefox 扩展打包
pnpm web firefox:zip

# uTools 插件打包
pnpm utools:package

# Cloudflare Workers 开发 / 部署（apps/web）
pnpm web wrangler:dev
pnpm web wrangler:deploy
```

资讯检索（GNews 等）在部分环境下需配置代理 Worker，详见 [`workers/gnews-proxy/README.md`](workers/gnews-proxy/README.md)。

## 🚀 快速搭建私有服务

### 推荐：本站完整工作流

克隆本仓库并构建 Web 应用（含默认图床 API、工作流页面）：

```sh
git clone https://github.com/TUARAN/md.git
cd md
pnpm install
pnpm web build           # 静态资源
pnpm web wrangler:deploy # 部署到 Cloudflare（可选）
```

在线体验：[syncblog.cn](https://syncblog.cn)

### 📦 方式 1. 本仓库 CLI

```sh
pnpm install
pnpm build:cli
pnpm cli -- port=8800
open http://127.0.0.1:8800
```

`md-cli` 支持 `port`、`spaceId`、`clientSecret` 等参数，详见 [`packages/md-cli/README.md`](packages/md-cli/README.md)。

> npm 上的 `@doocs/md-cli` 为上游包名；完整同步能力请使用本仓库构建，而非仅安装上游 CLI。

### 🐳 方式 2. Docker（编辑器静态页）

在本仓库根目录构建：

```sh
docker build -f docker/latest/Dockerfile.static -t syncblog-md:local .
docker run -d -p 8080:80 syncblog-md:local
```

若只需上游原版编辑器、不需要本站工作流，仍可使用上游镜像 `doocs/md:latest`（见 [doocs/docker-md](https://github.com/doocs/docker-md)）。

## 👥 谁在使用

[📋 USERS.md](USERS.md) 记录的是上游 [doocs/md](https://github.com/doocs/md) 社区用户案例；本站为在其基础上的产品与流程演进 fork。

## 🤝 贡献指南

我们欢迎任何形式的贡献！请查看 [📖 CONTRIBUTING.md](./CONTRIBUTING.md) 获取提交 PR、Issue 的流程与规范。

## ☕ 支持项目

若本项目对你有帮助，欢迎给 [TUARAN/md](https://github.com/TUARAN/md) 点个 **Star ⭐️**，或在 [Issues](https://github.com/TUARAN/md/issues) 提交场景与改进建议。

编辑器内核维护者 [doocs/md](https://github.com/doocs/md) 亦接受社区赞助，详见其仓库 README。

## 💬 反馈与交流

- **功能与缺陷**：[TUARAN/md Issues](https://github.com/TUARAN/md/issues)
- **上游编辑器**（排版、图床、通用 Markdown 能力）：[doocs/md Issues](https://github.com/doocs/md/issues)
- **在线站点**：[syncblog.cn](https://syncblog.cn)
