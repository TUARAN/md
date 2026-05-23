# md-cli

本地托管 Markdown 编辑器静态页，用于预览与导出。本仓库 fork 自 [doocs/md](https://github.com/doocs/md)，CLI 包路径为 `packages/md-cli`，与 [syncblog.cn](https://syncblog.cn) 使用同一套 Web 构建产物。

## 在本仓库中使用（推荐）

```bash
git clone https://github.com/TUARAN/md.git
cd md
pnpm install
pnpm build:cli
pnpm cli -- port=8800
```

浏览器访问 http://127.0.0.1:8800 。

## 通过 npm 安装（上游包名，仅编辑器本体）

npm 包名仍为 `@doocs/md-cli`（历史兼容）。若只需上游编辑器、不需要本站 CSYNC / 工作流，可：

```bash
npm install -g @doocs/md-cli
md-cli
```

完整多平台同步请 clone [TUARAN/md](https://github.com/TUARAN/md) 并按根目录 README 构建部署。

## 命令行参数

- `port` 指定端口号，默认 8800。
- `spaceId` / `clientSecret` dcloud 服务空间配置（可选，用于上传图床）。

## 维护

- 本站 fork：[TUARAN/md](https://github.com/TUARAN/md)
- 上游编辑器内核：[doocs/md](https://github.com/doocs/md)
