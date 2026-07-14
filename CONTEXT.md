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
即选择宿主。界面文案统一显示为「AI Agent」，「宿主」仅用于代码
与文档。宿主 CLI 本身也可由安装器引导安装（bootstrap），独立于
组件安装流程，入口为置顶的「安装 AI Agent」菜单。
_Avoid_: 平台（易与操作系统混淆）、target、AI 工具（旧文案，已弃）

**探测（Check）**:
判断某组件在某宿主中是否已安装（及配置是否完整）的实时检查，是
doctor 与管理的唯一状态来源。宿主本身是否存在同样靠探测。
_Avoid_: Manifest、安装清单、lockfile——本项目不维护安装状态
文件

**doctor**:
对目录全量执行探测并报告环境健康度的维护命令。菜单项显示为
「环境体检」，子命令名仍为 doctor。
_Avoid_: status、checkup

**安装器（Installer）**:
npm 包 `oxy-workflow` 提供的交互式 CLI，本项目唯一分发物。
_Avoid_: 脚手架、工作流引擎

**向导（Wizard）**:
组件选装的交互模式：宿主组件先选宿主 → 按类型多选 → 汇总确认 →
安装；确认前可回退，确认后不可逆。安装体验按组件类型拆成多个主菜单
入口（安装 MCP/技能、子代理、Skills 合集、Spec 工具、命令行工具、
AI 插件），各自复用此模式：宿主组件走"选宿主"，全局工具跳过。
_Avoid_: 安装流程（与"安装执行"混淆）；不再指"一屏装尽所有类型"

**管理（Manage）**:
单组件粒度的运维流程：全目录状态列表 → 组件详情 → 按宿主执行
安装/卸载。卸载能力归属管理流；动作执行后回到详情以呈现最新
探测状态。
_Avoid_: 浏览（只看不操作）、卸载菜单（已并入管理）

**目录（Catalog）**:
维护者策展的组件元数据清单（名称、官方链接、安装方式），随 npm
包分发。目录只含元数据，不含组件内容。
_Avoid_: 市场（marketplace）、registry

**组件（Component）**:
目录中的一条可安装条目，一律来源于公开上游仓库：第三方组件指向
其官方项目，自有组件指向维护者的公开集合仓库，均按官方方式安装。
**收录前提**：能被某一安装机制自动装入宿主或全局环境；独立 App、
普通代码库（如 pip/npm 库）、复制粘贴片段集、纯格式约定不属于组件，
不进目录，仅留在维护者的外部参考清单。
_Avoid_: 载荷（Payload）、Vendored Payload——npm 包不携带任何
组件内容，该概念已废除

### 组件类型

**MCP**:
一个 MCP 服务器，安装即写入 Claude Code 的 MCP 配置。

**Skill**:
一个 Claude Code skill（含 SKILL.md 的能力包）。

**Skills 合集（skill-collection）**:
一个含多个 skill 子目录的上游仓库；安装即把每个子技能摊平到宿主
skills 目录（各带 SKILL.md），"全装"不逐个挑。探测靠声明的哨兵
子技能，不建 manifest（ADR-0004）。
_Avoid_: 与单个 Skill 混同——合集是"一仓多技能"的整体安装单元

**Agent**:
一个 Claude Code 子代理定义（角色化的 agents/*.md 文件）。
_Avoid_: Agent CLI——Codex/Gemini 等独立终端工具不属于此类型

**Spec**:
一个 spec 驱动开发工具（如 OpenSpec、spec-kit），按其官方命令
安装的独立 CLI。
_Avoid_: 规范模板、OpenSpec 集成——本项目不内嵌任何 spec 工具
的集成代码

**CLI（命令行工具）**:
一个独立的全局命令行工具（如 auggie、Playwright CLI、oh-my-openagent），
按官方命令全局安装、留 PATH binary，不装进宿主。UI 文案「命令行工具」。
_Avoid_: 与 Spec 混同（Spec 专指 spec 驱动开发工具）；与 AI 插件混同
（插件是"插进宿主"的内容扩展，探 marker）；不含宿主 CLI（属宿主引导）

**AI 插件（plugin）**:
用自己的官方命令安装、内容落进宿主目录的扩展包（如 CCG、superpowers、
claude-mem）。探测查其在宿主内留下的标记路径（marker），非 PATH binary。
_Avoid_: 与命令行工具混同——cli 是独立全局工具（探 binary），插件是
宿主内容扩展（探 marker）
