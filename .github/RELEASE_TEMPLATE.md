<!--
维护者发布新版本时，把下面这一节复制到 CHANGELOG.md 的 [Unreleased] 之下，
填好日期和条目，并删掉不需要的小标题。
工作流会把对应版本的这一节放进 GitHub Release 说明。
标签写成 vX.Y.Z；这里和 .env.example、docker-compose.yml、Dockerfile 里不写前缀 v。
-->

## [X.Y.Z] - YYYY-MM-DD

### 新增

-

### 变更

-

### 修复

-

### 部署提示

- 镜像标签：`med-timeline:X.Y.Z`（在部署机本地构建，仓库不推送镜像）
- 部署包：`med-timeline-X.Y.Z.tar.gz`
- 默认宿主机端口仍是 3007，除非修改 `MED_TIMELINE_PORT`
