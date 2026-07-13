# Triage 标签

各 skill 以五个规范 triage 角色沟通。本文件把角色映射到本仓库
issue 跟踪器实际使用的标签字符串（当前全部为默认值）。

| mattpocock/skills 标签 | 本仓库标签        | 含义                     |
| ---------------------- | ----------------- | ------------------------ |
| `needs-triage`         | `needs-triage`    | 维护者需要评估该 issue   |
| `needs-info`           | `needs-info`      | 等待报告人补充信息       |
| `ready-for-agent`      | `ready-for-agent` | 规格完整，AFK 代理可接手 |
| `ready-for-human`      | `ready-for-human` | 需要人工实现             |
| `wontfix`              | `wontfix`         | 不予处理                 |

当 skill 提到某个角色（如"打上 AFK-ready 标签"）时，使用表中对应
字符串。本地 markdown 跟踪器中，标签写在 issue 文件的 `Status:` 行。
