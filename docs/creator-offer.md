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

| 页面                                    | 作用                                              |
| --------------------------------------- | ------------------------------------------------- |
| `/md/creator-offer/tuaran#content-sync` | **创作名片**：触达、合作档位、ROI、品牌适配       |
| `/md/creator-profile`                   | **平台矩阵**：扩展检测、各平台主页与粉丝/阅读缓存 |

编辑器顶栏「创作名片」→ 前者；账号分享链接（`?profile=`）→ 后者。

## 内容维护

文案与结构：`apps/web/src/constants/creatorOffer/tuaran.ts`  
路由工具：`apps/web/src/utils/creatorRoutes.ts`（`creatorCardRoute` / `CREATOR_CARD_HASH`）
