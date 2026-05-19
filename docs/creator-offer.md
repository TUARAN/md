# 安东尼 · 个人 IP 合作说明页

面向品牌方的**个人**内容与引流服务说明，不是博主联盟统一商务页。

## 访问地址

| 项        | 值                                                       |
| --------- | -------------------------------------------------------- |
| 路径      | `/md/creator-offer/tuaran`（本地开发随 `BASE_URL` 变化） |
| 创作者 ID | `tuaran`（URL 路径段，小写）                             |
| 线上示例  | https://syncblog.cn/md/creator-offer/tuaran              |

## 与创作名片的关系

| 页面                       | 作用                                   |
| -------------------------- | -------------------------------------- |
| `/md/creator-profile`      | 账号矩阵、粉丝/阅读（扩展缓存 + 快照） |
| `/md/creator-offer/tuaran` | 合作档位、ROI 示意、品牌适配、联系入口 |

名片页在创作者 ID 为 `TUARAN` / `tuaran` 时展示「内容与引流合作」按钮。

## 内容维护

文案与结构：`apps/web/src/constants/creatorOffer/tuaran.ts`  
路由工具：`apps/web/src/utils/creatorRoutes.ts`

新增其他创作者：增加 `constants/creatorOffer/<id>.ts` 并在 `creatorOffer/index.ts` 注册。
