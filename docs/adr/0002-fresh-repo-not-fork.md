# 全新仓库，不 fork ccg-workflow

纯目录分发（ADR-0001）使 fork 的继承价值全部失效：ccg 的
templates/ 载荷、引擎、Go wrapper 与二进制 CI 在本项目中都是
待删除的死重，且上游同步已决定走手动策略，无合并诉求。决定从零
新建最小 TypeScript CLI 仓库；ccg-workflow 的 src/ 安装器与既有
的 oxyccg（188 行）仅作阅读参考，不继承代码与 git 历史。

**Status**: accepted（取代上一轮会话"fork ccg-workflow 全局
改名"的决策，该决策未落盘）
