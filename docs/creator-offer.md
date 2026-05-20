# 安东尼 · 创作名片

面向品牌方的**个人**内容与引流服务说明（创作名片），不是博主联盟统一商务页。

## 访问地址

| 项        | 值                                                       |
| --------- | -------------------------------------------------------- |
| 创作名片  | `/md/creator-offer/tuaran#content-sync`                  |
| 平台矩阵  | `/md/creator-profile`                                    |
| 创作者 ID | `tuaran`                                                 |
| 线上示例  | https://syncblog.cn/md/creator-offer/tuaran#content-sync |

## 与平台矩阵的关系

| 页面                                    | 作用                                                                |
| --------------------------------------- | ------------------------------------------------------------------- |
| `/md/creator-offer/tuaran#content-sync` | **创作名片**：触达、合作档位、ROI、品牌适配                         |
| `/md/creator-profile`                   | **平台矩阵**：COSE/CSYNC 检测缓存优先，缺省用仓库快照（可手动维护） |
| 工作流 `#platform-matrix`               | **平台矩阵（工作流内）**：同上，按创作者 ID 梳理后进入宣发活跃      |

编辑器顶栏「创作名片」→ 前者；账号分享链接（`?profile=`）→ 后者。

## 内容维护

文案与结构：`apps/web/src/constants/creatorOffer/tuaran.ts`  
路由工具：`apps/web/src/utils/creatorRoutes.ts`（`creatorCardRoute` / `CREATOR_CARD_HASH`）
