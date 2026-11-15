# 更新日志

版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。Git 标签写成 `vX.Y.Z`，本文件里的标题不带 `v`。

发布工作流会读取与标签对应的 `## [X.Y.Z]` 一节，作为 GitHub Release 说明的正文。新改动先写在 `[Unreleased]`，发布前再移到具体版本下。条目示例见 [`.github/RELEASE_TEMPLATE.md`](.github/RELEASE_TEMPLATE.md)。

## [Unreleased]

## [1.0.0] - 2026-11-15

第一个打标签的版本。时间轴页面、`data/timeline.json` 和 nginx 镜像在此之前已经在仓库里；这一版补上可重复的 Docker 部署说明和 GitHub Release 流程。

### 应用

- 静态单页「中西医发展对照时间轴」：西方医学与中国传统医学共用一条时间轴，左右分列，事件不必成对
- 数据文件 `data/timeline.json`：265 条事件（西方 160，中国传统医学 105），`meta.updated` 为 2026-10-17，范围从史前到约 2000 年
- 容器使用 `nginx:alpine`，容器内端口 80；宿主机默认端口 3007
- 修改宿主机上的 `data/timeline.json` 后刷新浏览器即可，不必为了改数据重建镜像

### 新增

- 中文 README、`.env.example`、`.gitignore`
- Compose 健康检查和 json 日志体积上限；宿主机端口和本地镜像标签可用 `.env` 配置，默认仍是端口 3007、镜像 `med-timeline:1.0.0`
- 镜像 OCI 版本标签（构建参数 `VERSION`）
- `scripts/` 中的部署、升级、备份、恢复脚本
- 推送 `vX.Y.Z` 标签，或在 Actions 里手动运行 Release 工作流时，创建 GitHub Release 并附带 `med-timeline-X.Y.Z.tar.gz`

### 修复

- `build_timeline.py` 和 `add_more_events.py` 不再把数据路径写死为 `/workspace/med-timeline/data/timeline.json`，改为脚本所在仓库下的 `data/timeline.json`
