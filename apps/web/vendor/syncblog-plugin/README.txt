SyncBlog Plugin 浏览器扩展
==========================

名称说明
--------
- SyncBlog Plugin：对外统一名称，用于编辑器文案、manifest 和插件下载说明。
- csync-extension.zip：旧版下载文件名，仍由打包脚本生成，兼容历史链接和已写入的站点路径。
- window.$syncblogPlugin：新版页面桥接对象；旧版 window.$cose / window.$pluginSyncer 保留兼容。

用户下载安装
------------
使用本站时，请在浏览器打开：
  {站点根路径}/syncblog-plugin.zip

旧链接仍可用：
  {站点根路径}/csync-extension.zip

下载后解压得到 syncblog-plugin 文件夹，在 Chrome → chrome://extensions →
开发者模式 →「加载已解压的扩展程序」→ 选中该文件夹。

维护者 / 自建部署
-----------------
构建前在项目根执行：
  pnpm package:syncblog-plugin

该命令会生成主下载包 syncblog-plugin.zip，同时生成 csync-extension.zip 作为旧链接兼容。
产物在 apps/web/public/ 和 apps/web/dist/。

备选 · 从 Git 仓库直接加载（开发用）
------------------------------------
克隆仓库后加载目录：
  apps/web/vendor/syncblog-plugin/

验证
----
在 https://syncblog.cn/、md.doocs.org 或本地编辑器页（且 manifest 已匹配该域名）
打开后，编辑器应能检测到 SyncBlog 发布插件并读取已登录平台账号。

来源与版本
----------
该目录保留公开分发包的构建产物并在本仓库内维护补丁。历史 CSYNC 命名仅作为
兼容线索保留在旧 zip 文件名中；对外产品名统一为 SyncBlog Plugin。
