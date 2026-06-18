Syncblog 同步助手浏览器扩展
============================

本目录不是 CSDN/CSYNC 插件，内容来自 TUARAN/cose 的 Chromium 构建产物。
TUARAN/cose 是 doocs/cose 的下游二次开发版本，保留 COSE 的多平台检测、
草稿写入和 window.$cose 页面协议，并增加 syncblog.cn 的站点权限与产品品牌。

当前来源
--------
- 源码目录：/Users/tuaran/Documents/GitHub/cose
- 源码提交：006b0fe
- 扩展版本：1.3.5
- 构建目录：apps/extension/dist

用户下载安装
------------
访问 {站点根路径}/syncblog-plugin.zip，解压后在 Chrome 的
chrome://extensions 中开启开发者模式，选择「加载已解压的扩展程序」。

维护同步
--------
1. 在 TUARAN/cose 中更新并执行 pnpm build。
2. 用 apps/extension/dist 的完整内容覆盖本目录（保留本说明文件）。
3. 在 md 仓库根目录执行 pnpm package:syncblog-plugin。

Web 端只调用 window.$cose，不再探测 CSDN/CSYNC 的 $pluginSyncer 协议。
