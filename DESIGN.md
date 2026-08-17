# 会话 ID 显示插件（dsh-session-id）设计

> 状态：需求已澄清，技术方案已验证，**已实现并部署**（DSH web profile，`~/.dsh/profiles/web`）
> 实现载体：动态 Cordis 插件（Host + Client）的 **profile bundle** 形式
> 适用版本：DSH web profile（路径以部署的 `DSH_HOME` 为准，本文示例为 `~/.dsh`）

---

## 1. 背景与问题

DSH 的会话（session）是工作区内的核心对象，每个会话有全局唯一 ID。会话 ID 在以下场景是硬需求：

- **排查问题**：向 DSH 团队 / 文档反馈 bug 时，需要附上会话 ID；
- **跨会话协作**：把会话 ID 交给另一个 Agent / 会话继续工作（`archived-sessions` 等工具也以 ID 为准）；
- **归档与恢复**：归档面板按 ID 列出/取消归档。

但 **GUI 默认不展示当前会话 ID**：会话列表只显示标题，composer 上方只有模型选择，页面上没有任何可读的当前会话 ID。用户只能：

1. 打开浏览器 DevTools，在 store / DOM 里翻找 `session.id`；
2. 或等归档后去「已归档」面板里看（本机配套插件 `dsh-archive-panel` 提供了该面板）。

**结论**：缺一个「常驻、可复制」的当前会话 ID 展示。这是一个纯 UI 问题，不需要动 host 状态机或数据层。

## 2. 需求（澄清结果）

| # | 问题 | 决定 |
| --- | --- | --- |
| 1 | 显示什么 | 当前会话 ID（`props.sessionId`，兼容 `props.session.id`） |
| 2 | 显示在哪 | composer 卡片下方的 **dock**（`conversation.composer.dock` 插槽），11px 小字、半透明，不抢视觉 |
| 3 | 交互 | 点击复制到剪贴板；成功显示「✓ 已复制」1.6s + 绿色高亮；hover 提亮 |
| 4 | 无会话时 | 不渲染（返回 `null`），不占位 |
| 5 | 复制方式 | 优先 `navigator.clipboard.writeText`，失败降级 `textarea + execCommand('copy')` |
| 6 | 实现形态 | **纯 UI 插件**：host 半部空 `apply()` 仅用于 Loader 注册；不注册 HTTP 端点、不碰 registry |
| 7 | 分发 | profile bundle：`dsh.bundle.patch` + `exports["./client"]` + `dsh.client.platform: web` |

## 3. 技术方案

### 3.1 插件形态（profile bundle）

沿用官方外部插件分发路径（`docs/user/develop/basic/publish.md`）：

- `package.json` 声明 `dsh.bundle.patch: ./cordis.patch.yml`（bundle 自带 patch 层，安装即自动插入插件行）与 `dsh.client.platform: web`（浏览器半部发现机制）；
- `cordis.patch.yml`：一个 `- insert:` 条目，`id: session-id-footer, name: dsh-session-id-footer`，与既有手动注册行完全一致（`~/.dsh/profiles/web/cordis.patch.yml`），因此从本仓库 `dsh plugin` 安装后与现网安装**同名同构**，可直接替换；
- 纯 JS，无构建步骤，git 安装无需 `prepare` / `allowBuilds`。

### 3.2 浏览器半部（client.js）

- 走 `window.__ModuleLoader__.load({ id, factory })` 标准 bundle 格式（与官方 `dsh-client-ui-*` 包一致），seed 词 `react` 来自静态模块表；
- `inject = ["slots", "timer"]`：声明所需客户端服务；
- 组件 `SessionIdFooter` 读取 `props.sessionId || props.session.id`，空则 `return null`；
- 通过 `ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({ name, id: "session-id-footer", order: 10 }, SessionIdFooter))` 注册进 composer dock 插槽（`order: 10` 保证排在 dock 内靠前位置）；
- 复制反馈用 `ctx.timeout`（客户端 timer 服务），避免直接 `setTimeout` 与 DSH 生命周期脱节。

### 3.3 Host 半部（index.js）

纯 UI 插件，`apply()` 为空函数，仅保证包在 host 侧 cordis.yml / Loader 中可见；浏览器半部经 `exports["./client"]` 被发现。

### 3.4 与同类插件的边界

| 插件 | 职责 | 与本插件的关系 |
| --- | --- | --- |
| `dsh-archive-panel` | 归档会话的查看 / 取消归档面板（含 ID 复制） | 互补：它管**已归档**会话，本插件管**当前**会话 |
| 官方会话标题 | 显示会话标题 | 本插件显示**原始 ID**（标题可重复，ID 唯一） |

## 4. 验证

- [x] `dsh --profile web --dump-config | grep dsh-session-id-footer`：插件行已合成
- [x] GUI 打开后 composer dock 显示当前会话 ID（11px 半透明小字）
- [x] 点击复制成功（剪贴板内容 == 会话 ID），显示「✓ 已复制」1.6s
- [x] 无会话（新空会话创建前）不渲染任何元素
- [x] 与 `dsh-archive-panel`、`model-toggle` 等共存无冲突（不同插槽 / 不同 order）

## 5. 风险与取舍

| 风险 | 说明 | 对策 |
| --- | --- | --- |
| 插槽 props 结构变化 | `sessionId` / `session.id` 是当前渲染链的实际结构 | 兼容两种取值，空值自动隐藏 |
| `navigator.clipboard` 不可用 | 非安全上下文 / 旧浏览器 | `execCommand('copy')` 降级 + try/catch 静默 |
| 与官方 UI 更新冲突 | 未来官方可能自带会话 ID 展示 | 独立 bundle、独立插槽，禁用/卸载零残留 |

## 6. 仓库布局

```
dsh-session-id/
├── README.md
├── DESIGN.md
├── LICENSE                # MIT, Copyright (c) 2026 realpkuasule
└── plugins/
    └── dsh-session-id-footer/
        ├── package.json
        ├── cordis.patch.yml
        └── lib/
            ├── index.js   # host half (empty apply)
            └── client.js  # browser half (__ModuleLoader__ bundle)
```
