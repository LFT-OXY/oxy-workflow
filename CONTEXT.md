# oxy-workflow

策展式 AI 工具链安装器：用户通过一条简短命令，从维护者策展的
目录中自选组件，安装进所选宿主（Claude Code、Codex 等）。本项目
交付的是"安装器 + 目录"，不交付组件内容本身。

## Language

**维护者（Maintainer）**:
目录的策展人与第一用户。组件是否收录仅由维护者认定。
_Avoid_: 管理员、作者

**推荐集（Recommended Set）**:
目录中被维护者标记为推荐的组件子集，向导中默认勾选。策展判断的
具体载体。
_Avoid_: 默认全选、必装项

**宿主（Host）**:
组件被安装进的目标 AI CLI 环境（如 Claude Code、Codex）。安装
位置与配置格式由宿主 × 组件类型 × 操作系统共同决定；向导第一步
即选择宿主。
_Avoid_: 平台（易与操作系统混淆）、target

**探测（Check）**:
判断某组件在某宿主中是否已安装（及配置是否完整）的实时检查，是
doctor 与卸载的唯一状态来源。宿主本身是否存在同样靠探测。
_Avoid_: Manifest、安装清单、lockfile——本项目不维护安装状态
文件

**doctor**:
对目录全量执行探测并报告环境健康度的维护命令。
_Avoid_: status、checkup

**安装器（Installer）**:
npm 包 `oxy-workflow` 提供的交互式 CLI，本项目唯一分发物。
_Avoid_: 脚手架、工作流引擎

**向导（Wizard）**:
安装器的组件选装流程：选宿主 → 按组件类型逐屏多选 → 汇总确认
→ 安装。确认前各步可回退，确认后不可逆。
_Avoid_: 安装流程（与"安装执行"混淆）

**目录（Catalog）**:
维护者策展的组件元数据清单（名称、官方链接、安装方式），随 npm
包分发。目录只含元数据，不含组件内容。
_Avoid_: 市场（marketplace）、registry

**组件（Component）**:
目录中的一条可安装条目，一律来源于官方上游项目，按其官方方式
安装。
_Avoid_: 载荷（Payload）、Vendored Payload——npm 包不携带任何
组件内容，该概念已废除

### 组件类型

**MCP**:
一个 MCP 服务器，安装即写入 Claude Code 的 MCP 配置。

**Skill**:
一个 Claude Code skill（含 SKILL.md 的能力包）。

**Agent**:
一个 Claude Code 子代理定义（角色化的 agents/*.md 文件）。
_Avoid_: Agent CLI——Codex/Gemini 等独立终端工具不属于此类型

**Spec**:
一个 spec 驱动开发工具（如 OpenSpec、spec-kit），按其官方命令
安装的独立 CLI。
_Avoid_: 规范模板、OpenSpec 集成——本项目不内嵌任何 spec 工具
的集成代码
