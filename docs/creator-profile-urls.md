# 创作名片 · 平台主页链接规则

创作名片展示的链接与「发布同步」用的编辑页链接分开处理，逻辑在 `apps/web/src/utils/socialAccounts.ts`。

## 解析顺序

对单个已登录账号，按以下顺序决定名片上的 `url`：

1. 扩展返回的明确主页字段（`profileUrl` / `profile` / `homepage`），且不是编辑/发布页
2. 用有效 `uid` 按平台规则拼接个人主页（见 `PLATFORM_PROFILE_URL_BUILDERS`）
3. 扩展的 `home` / `url`，仅当判断为个人主页而非编辑页时采用
4. 从编辑页 URL 中解析出用户名后再拼接主页
5. **`PLATFORM_DEFAULT_PROFILE_URLS`**：本站维护的默认主页（扩展/缓存拿不到时）
6. **`PLATFORM_HOME_URLS`**：平台门户首页（无默认配置时的最后兜底）

## 默认主页配置

当扩展未返回有效 uid、或最终只能落到「平台官方首页」时，使用下表链接（可在 `socialAccounts.ts` 中修改）：

| 平台 type      | 默认主页                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `csdn`         | https://blog.csdn.net/aifs2025                                                                                     |
| `juejin`       | https://juejin.cn/user/1521379823340792                                                                            |
| `zhihu`        | https://www.zhihu.com/people/tu-tu-tu-tu-tu-25-1                                                                   |
| `toutiao`      | https://www.toutiao.com/c/user/token/MS4wLjABAAAAqDPAgOjSsjLeLCA_T2AQUDIZsl29T4P4aymfpldAtA7cjg7FWpDigq4G2uwaHH7H/ |
| `oschina`      | https://my.oschina.net/u/9753726                                                                                   |
| `cto51`        | https://blog.51cto.com/u_13961087                                                                                  |
| `infoq`        | https://www.infoq.cn/profile/101F0D86A30093/publish                                                                |
| `baijiahao`    | https://mbd.baidu.com/newspage/data/dtlandingwise?sourceFrom=baijiahao&nid=dt_4601215864081255881                  |
| `weibo`        | https://weibo.com/u/7962821975                                                                                     |
| `xiaohongshu`  | https://xhslink.com/m/7w6ONgVXPX6                                                                                  |
| `tencentcloud` | https://cloud.tencent.com/developer/user/7738744                                                                   |
| `aliyun`       | https://developer.aliyun.com/article/1723858                                                                       |
| `huaweicloud`  | https://bbs.huaweicloud.com/blogs/388492                                                                           |
| `segmentfault` | https://segmentfault.com/u/aran_tu/articles                                                                        |

新增平台：在 `PLATFORM_DEFAULT_PROFILE_URLS` 增加一行即可；名片页会在「未检测到该账号」时补一条展示项，在「已有账号但链接无效」时替换链接。

## 缓存说明

- 名片数据存在浏览器 `localStorage`（键名带项目 `prefix`）
- 打开名片或点击「重新检测账号」后会重新走上述解析并写回缓存
- 修改默认表后，刷新名片页或重新检测即可生效，无需清缓存（`applyProfileHomeUrls` / `repairCreatorProfile` 会重算 url）

## 与 COSE / CSYNC 的关系

扩展检测只负责「是否已登录」和原始字段；**名片展示 URL 一律经 `resolveSocialAccountUrl` 处理**，避免把同步用的编辑页当成主页。
