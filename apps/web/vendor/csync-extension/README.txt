csync 浏览器扩展（本目录即「加载已解压的扩展程序」所用根目录）
================================================================

名称说明
--------
- csync：本扩展，侧重大陆常用的知乎 / 公众号 / 微博等同步（页面 API 仍为 window.$pluginSyncer）。
- COSE：https://github.com/doocs/cose ，与 md 编辑器配套的其它多平台发布，二者可同时安装。

用户下载安装（主推：部署站点上的 zip）
------------------------------------
  使用本站时，请在浏览器打开：
    {站点根路径}/csync-extension.zip
  例如 base 为 /md/ 时： https://你的域名/md/csync-extension.zip
  或在编辑器「发布」对话框内点击「下载 csync 扩展（.zip）」。
  解压得到 csync-extension 文件夹，在 Chrome → chrome://extensions → 开发者模式 →
  「加载已解压的扩展程序」→ 选中该文件夹。

维护者 / 自建部署
-----------------
  构建前在项目根执行 pnpm package:csync，再 pnpm web build；产物在 apps/web/public/。
  CI（deploy / Cloudflare / Gitee 等）已包含该步骤，线上一般已有 zip。

备选 · 从 Git 仓库直接加载（开发用）
  克隆仓库后加载目录： apps/web/vendor/csync-extension/

验证
----
在 https://syncblog.cn/ 、md.doocs.org 或本地编辑器页（且 manifest 已匹配该域名）打开后，
控制台应可见 $pluginSyncer，且 connected 为 true。

来源与版本
----------
由公开分发包 fork，上游核心在 dist/；本仓库已替换 assets/inject-web-api.js（启用 syncArticle），
manifest 已改名 csync 并增加 syncblog / doocs / 本地等 matches。扩展版本号见 manifest.json。
