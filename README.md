# dsh-session-id

**Session ID footer for DeepSeek Harness (DSH): shows the current session id under the composer, click to copy.**

DeepSeek Harness 会话 ID 显示插件：在输入框（composer）下方的 footer 位置以小字显示当前会话 ID，点击一键复制。

> 仓库 / 目录名是 `dsh-session-id`；内部 bundle 包名沿用既有安装名 `dsh-session-id-footer`（与 `~/.dsh/profiles/web/cordis.patch.yml` 中的注册名一致，`dsh plugin` 从本仓库安装后即与现网安装完全同名）。

## Why

DSH 的会话 ID 是排查、归档、跨会话协作时的关键标识，但 GUI 默认不展示当前会话 ID——只能靠开发者工具或归档面板间接获取。本插件补上最后一步：**在 composer 下方的 dock 内以小字常驻显示当前会话 ID，点击即复制**，并给出「✓ 已复制」反馈。

- **纯 UI 插件**：不碰 host 状态、不注册 HTTP 端点，零风险、零权限。
- **即时复制**：优先 `navigator.clipboard`，降级 `execCommand('copy')` 兼容旧浏览器。
- **贴近官方插件机制**：走 `window.__ModuleLoader__.load` 标准 bundle 格式 + `slots.inject("conversation.composer.dock")` 官方插槽。

## Features

- 🆔 当前会话 ID 以 11px 小字常驻 composer 底部 dock
- 📋 点击复制会话 ID（1.6s「✓ 已复制」反馈 + 绿色高亮）
- 🖱️ hover 提亮、`user-select: text` 可手动框选
- 🎯 无会话时自动隐藏（`sessionId` 为空不渲染）

## Install

> 标准 DSH **profile bundle**（官方外部插件分发路径，见 [docs/user/develop/basic/publish.md](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.md)）：包声明 `dsh.bundle.patch`，`dsh plugin` 安装后由 bundle 的 `cordis.patch.yml` 自动插入插件行。无需构建步骤——纯 JS，git 安装不需要 `prepare` 脚本或 `allowBuilds`。

### Option A — official `dsh plugin` (recommended)

```bash
# From a directory that contains this checkout:
dsh plugin --profile web add ./dsh-session-id
# or straight from GitHub (plain JS, no build permission needed):
dsh plugin --profile web add github:realpkuasule/dsh-session-id

# Verify the composed layer without booting:
dsh --profile web --dump-config | grep -A2 dsh-session-id-footer
```

`dsh plugin` links the package, records it in the profile's dependencies, and the bundle layer inserts the `session-id-footer` plugin row.

### Option B — manual (no CLI)

```bash
# 1. Copy the package into your profile's node_modules
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
mkdir -p "$DSH_HOME/profiles/node_modules/dsh-session-id-footer"
cp -R plugins/dsh-session-id-footer/. "$DSH_HOME/profiles/node_modules/dsh-session-id-footer/"
```

```yaml
# 2. Add the bundle layer to $DSH_HOME/profiles/web/cordis.patch.yml
#    (an `- insert:` list entry — same shape as the bundle's own patch file)
    - id: session-id-footer
      name: dsh-session-id-footer
```

```bash
# 3. Restart `dsh web`
```

Open the GUI: the composer dock now shows the current session ID in small text. Click it to copy.

## Architecture

```
Browser (client.js, __ModuleLoader__ bundle)
 └─ slots.inject("conversation.composer.dock", order 10) ──▶ <span> session id
      • props.sessionId / props.session.id → display string
      • click → navigator.clipboard → fallback execCommand('copy')
      • 1.6s "✓ 已复制" feedback via ctx.timeout
Node (index.js, profile Cordis plugin)
 └─ empty apply(): pure UI plugin, exists only so the package
    registers in the host cordis.yml / Loader; the browser half
    ships via exports["./client"] + the package.json dsh.client declaration
```

- 数据来源：composer dock 插槽注入的 `props.sessionId`（官方 `dsh-client-ui-*` 渲染链自带），无需额外数据层。
- 渲染位置：`conversation.composer.dock` 插槽 `order: 10`，位于 composer 卡片下方的 dock 条内。
- 隐藏逻辑：无会话（`sessionId` 为空）时不渲染任何元素，不占位。

## Repository layout

```
dsh-session-id/
├── README.md
├── DESIGN.md              # full design doc: decisions, risks, verification
├── LICENSE                # MIT
└── plugins/
    └── dsh-session-id-footer/
        ├── package.json   # dsh.bundle.patch + dsh.client.platform: web declarations
        ├── cordis.patch.yml   # the bundle's patch layer (inserts the plugin row)
        └── lib/
            ├── index.js   # host half (empty apply)
            └── client.js  # browser half (__ModuleLoader__ bundle)
```

## License

MIT
