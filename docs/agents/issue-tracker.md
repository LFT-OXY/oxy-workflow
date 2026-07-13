# Issue 跟踪器：本地 Markdown

本仓库的 issue 与 PRD 以 markdown 文件形式存放在 `.scratch/` 下。

## 约定

- 每个 feature 一个目录：`.scratch/<feature-slug>/`
- PRD 为 `.scratch/<feature-slug>/PRD.md`
- 实现 issue 为 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，
  从 `01` 起编号
- Triage 状态记录在 issue 文件顶部的 `Status:` 行
  （角色字符串见 `triage-labels.md`）
- 评论与讨论历史追加在文件底部 `## Comments` 标题下

## 当 skill 要求"发布到 issue 跟踪器"

在 `.scratch/<feature-slug>/` 下新建文件（目录不存在则先创建）。

## 当 skill 要求"获取相关 ticket"

读取所引用路径的文件。用户通常会直接给出路径或 issue 编号。
