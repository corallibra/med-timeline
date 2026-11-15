# 中西医发展对照时间轴（med-timeline）

一个用浏览器阅读的静态网站：把西方医学和中国传统医学的历史事件放在同一条时间轴上，左右分列。事件不必成对。适合放在自己的电脑、局域网或 NAS 上自己看，或在诊室、工作室的内网里打开。

页面页脚署名为 Li Yuxian TCM Studio。仓库许可证是 MIT，版权声明见 [LICENSE](LICENSE)（Copyright (c) 2026 Michael）。

这不是诊疗、病历、预约或账号系统。默认数据是医学史条目，不含就诊记录。服务端不保存访问者数据。

当前数据包在 `data/timeline.json` 的 `meta` 里：265 条事件（西方 160，中国传统医学 105），`updated` 为 2026-10-17，范围从史前到约 2000 年。字段约定写在 [data/README-data.md](data/README-data.md)。

## 架构

浏览器只访问这一台 nginx。没有应用后端、数据库、账号或外部 API。

```text
浏览器  --HTTP 宿主机端口 3007-->  容器 med-timeline（nginx:alpine，容器内 80）
                                      |-- index.html、css/styles.css、js/app.js  （构建时打进镜像）
                                      `-- data/timeline.json                     （只读挂载宿主机 ./data）
```

| 部分 | 作用 |
| --- | --- |
| `index.html`、`css/styles.css`、`js/app.js` | 页面。脚本用 `fetch("./data/timeline.json")` 读数据，可按侧别、标签、考古证据和关键字筛选，并打开事件详情 |
| `data/timeline.json` | 唯一的运行时数据。`meta` 提供标题和更新时间，`events[]` 是事件 |
| `nginx.conf` | 站点配置。`/data/timeline.json` 关闭缓存；页面走 SPA 回退到 `index.html` |
| `Dockerfile` | 基于 `nginx:alpine` 复制页面和一份数据，并带有健康检查 |
| `docker-compose.yml` | 构建本地镜像、映射端口、只读挂载 `./data`、失败重启 |
| `build_timeline.py`、`add_more_events.py` | 维护数据的 Python 脚本。部署和浏览都不依赖它们 |

页面字体使用系统里已有的中文字体（苹方、思源黑体、微软雅黑等），不请求 CDN。镜像构建完成后，浏览网站不需要再访问外网。

数据目录用的是**宿主机目录挂载**，不是 Docker 命名卷。时间轴就是 `data/timeline.json` 这一个文件，直接用编辑器修改、复制备份即可。命名卷藏在 Docker 的数据目录里，反而不适合这个用法。

## 目录

```text
index.html              页面
css/styles.css          样式
js/app.js               交互
data/timeline.json      时间轴数据
data/README-data.md     字段说明
nginx.conf              nginx 站点配置
Dockerfile              镜像
docker-compose.yml      编排
.env.example            可复制的 Compose 变量示例（没有密钥）
scripts/deploy.sh       构建并启动
scripts/upgrade.sh      先备份数据，再按当前目录重建启动
scripts/backup.sh       备份 timeline.json
scripts/restore.sh      从备份恢复 timeline.json
build_timeline.py       用脚本内的条目覆盖生成 timeline.json
add_more_events.py      按 id 追加脚本里还没有的条目
CHANGELOG.md            版本说明（Release 正文来源）
```

## 环境要求

- Docker Engine，以及 Docker Compose v2（命令是 `docker compose`）。只有旧的 `docker-compose` 时，`scripts/deploy.sh` 也会尝试它
- 能拉取基础镜像 `nginx:alpine`（Docker Hub）。拉过一次后，不加重 `--pull` 的构建可以离线复用本地缓存
- 宿主机端口 **3007** 空闲。这是唯一对外端口，对应容器内的 **80**。要换端口只改 `MED_TIMELINE_PORT`，不要改容器内端口
- 磁盘占用很小：基础镜像大约几十 MB，数据文件约 170 KB。没有数据库卷
- 同一台 Docker 主机上容器名固定为 `med-timeline`。再部署一份时，需要另改 `container_name` 和宿主机端口，否则会和已有容器冲突

Synology DSM 的 Container Manager 可以直接用这份 `docker-compose.yml` 建项目。菜单名称随系统版本可能不同，关键是选择本目录的 Compose 文件，而不是另写一套端口。

不需要 Node.js、数据库或域名。本地改数据时才需要 Python 3（标准库即可，没有 `requirements.txt`）。

## 配置

应用进程没有配置文件，也不读取环境变量。`.env` 只供 Docker Compose 替换 `docker-compose.yml` 里的 `${变量}`，不会传进容器。

```bash
cp .env.example .env
```

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `MED_TIMELINE_PORT` | `3007` | 宿主机端口，映射到容器 80 |
| `MED_TIMELINE_VERSION` | `1.0.0` | 本地镜像标签，实际镜像名是 `med-timeline:1.0.0` |

没有账号、口令、API 地址或数据库连接串。不要把密钥写进 `.env`。`.env` 已被 `.gitignore` 忽略；发布包里只有 `.env.example`。

不创建 `.env` 也可以启动。Compose 会使用 `docker-compose.yml` 里写死的默认值，结果同样是端口 3007、镜像标签 `med-timeline:1.0.0`。

仓库**不会**推送 `latest` 标签，也没有 Docker Hub / GHCR 上的现成镜像。标签只存在于执行构建的那台机器上。

## 首次部署

在解压后的目录（或 git 克隆的仓库根目录）执行。

### 命令行

```bash
cp .env.example .env
docker compose up -d --build
```

或者：

```bash
sh scripts/deploy.sh
```

`deploy.sh` 会在没有 `.env` 时从示例复制一份，然后执行同样的 `docker compose up -d --build`。

构建会下载 `nginx:alpine`（若本地还没有），打出镜像 `med-timeline:1.0.0`，并启动容器。看状态：

```bash
docker compose ps
docker compose logs -f med-timeline
```

浏览器打开：

- 本机：<http://127.0.0.1:3007/>
- 局域网或 NAS：`http://<这台机器的 IP>:3007/`

改过 `MED_TIMELINE_PORT` 后，把地址里的 `3007` 换成你的端口，并重新执行上面的启动命令。

停止：

```bash
docker compose down
```

`down` 只停容器，不删除宿主机上的 `data/`。不要加 `-v` 来“清卷”：这份编排没有命名卷，数据就在当前目录的 `data/` 里。

### 只更新 nginx 基础镜像时

日常升级网站不要加 `--pull`。需要换新的 `nginx:alpine` 时再执行：

```bash
docker compose build --pull
docker compose up -d
```

## 升级

升级包是 GitHub Release 里的 `med-timeline-X.Y.Z.tar.gz`，不是预先打好的镜像。步骤：

1. 在旧目录执行 `sh scripts/backup.sh`。把打出来的 `backups/*.tar.gz` 拷到本目录外面。`backups/` 只在本机，换一个新目录时不会跟着走。
2. 解压新包。若直接覆盖旧目录，先确认两件事：
   - 留下原来的 `.env`（新包没有你的 `.env`）
   - 若改过 `data/timeline.json`，不要让新包里的同名文件盖掉它。覆盖后用第 1 步的备份执行 `sh scripts/restore.sh <备份.tar.gz>`
3. 打开 `.env`，把 `MED_TIMELINE_VERSION` 改成新版本号（不带 `v`）。Compose 优先读 `.env`。这里若仍是旧号，即使用了新代码，镜像标签仍是旧的。
4. 启动：

```bash
sh scripts/upgrade.sh
```

`upgrade.sh` 会再备份一次当前的 `data/timeline.json`，然后 `docker compose up -d --build`。它不会访问 GitHub。

用 git 更新时同样：在仓库根目录 `git pull` 之后核对 `.env` 的版本号，再执行 `sh scripts/upgrade.sh`。提交历史里没有 `.env`。

改的是 HTML、CSS、JS 或 nginx 配置时必须重建镜像。只改 `data/timeline.json` 时刷新浏览器即可，不必升级镜像。

## 备份与恢复

需要保留的状态只有 `data/timeline.json`。页面文件在镜像和部署包里，可以重新构建。

```bash
sh scripts/backup.sh
sh scripts/restore.sh backups/med-timeline-data-YYYYMMDD-HHMMSS-<进程号>.tar.gz
```

文件名以 `backup.sh` 打印的路径为准。同一秒内多次备份会带上不同的进程号，避免互相覆盖。

备份内容就是这个 JSON。恢复会先再备份当前文件，再覆盖 `data/timeline.json`。站点正在运行时，恢复后刷新浏览器即可。

手动复制同一个文件同样有效。请把要长期保留的备份放到部署目录外面。

## 本地预览和修改数据

仓库里没有前端构建工具、开发服务器或热更新。

在仓库根目录起一个静态文件服务（`8080` 只是这条临时命令用的端口，不是 Docker 端口）：

```bash
python3 -m http.server 8080
```

打开 <http://127.0.0.1:8080/> 。不要用 `file://` 直接双击 `index.html`：浏览器会拦截 `fetch` 读取 `timeline.json`，页面显示“无法加载时间轴数据”。

改数据：

- 直接编辑 `data/timeline.json`。字段、年代写法和不确定点见 [data/README-data.md](data/README-data.md)。保存后刷新浏览器。Docker 正在运行时也是改宿主机上的这个文件，不用进容器。
- `build_timeline.py` 会**覆盖** `data/timeline.json`，条目来自脚本内部，不是“在现有文件上打补丁”。只有确定要用脚本内容重新生成时才运行，并且先备份。
- `add_more_events.py` 会读入现有 JSON，按 `id` 追加脚本中还没有的条目，然后整文件重写。

```bash
sh scripts/backup.sh
python3 build_timeline.py
python3 add_more_events.py
```

部署网站不需要运行这两个脚本。

## 常见问题

**页面提示无法加载时间轴数据。** 确认地址是 `http://` 而不是 `file://`。确认宿主机 `data/timeline.json` 存在且是合法 JSON。看挂载是否仍是 `./data:/usr/share/nginx/html/data:ro`。文件若被存成仅所有者可读（例如 `600`），容器内的 nginx 用户会读不到，改成 `chmod 644 data/timeline.json`，目录本身也需要可进入（一般是 `755`）。

**改了 JSON 但页面没变。** 刷新或避开浏览器缓存。确认改的是挂载的那份 `data/timeline.json`，不是只改了尚未重建的镜像副本。nginx 对该文件响应 `Cache-Control: no-cache`，前端请求也带了 `cache: "no-cache"`。

**改了 HTML、CSS 或 JS 却没变化。** 这些文件打在镜像里，不在挂载目录里。执行 `docker compose up -d --build`。

**端口被占用。** 修改 `.env` 的 `MED_TIMELINE_PORT`，再执行 `docker compose up -d`。容器内始终是 80，健康检查也访问容器自己的 80，与宿主机端口无关。

**容器状态是 unhealthy，但页面能打开。** 健康检查与 `Dockerfile` 里原有的检查相同，使用 `nginx:alpine` 自带的 wget：`wget -qO- http://127.0.0.1/`。查看 `docker inspect med-timeline --format '{{json .State.Health}}'`。

**拉不到 `nginx:alpine`。** 部署机需要能访问 Docker Hub，或事先把该基础镜像导入本机。这只影响构建，不影响已经启动的容器。

**`docker compose` 不存在。** 安装 Compose v2，或使用仍提供 `docker-compose` 的环境。Synology 可在 Container Manager 里选择本目录的 `docker-compose.yml`。

**同一台机器上第二次启动失败，提示容器名已存在。** 容器名是 `med-timeline`。先 `docker compose down`，或改 Compose 里的 `container_name` 和宿主机端口后再启动另一份。

**升级后还是旧页面。** 看 `.env` 的 `MED_TIMELINE_VERSION` 是否仍是旧号。改成新版本号后重新 `docker compose up -d --build`。

## 版本号和 GitHub Release

版本从 **v1.0.0** 起。仓库里此前没有版本标签。版本号遵循语义化版本：

- 补丁（`v1.0.Z`）：部署修复、缺陷修复、说明更正
- 次版本（`v1.Y.0`）：向后兼容的内容，例如新增事件、不改变现有 JSON 字段含义的页面能力
- 主版本（`vX.0.0`）：不兼容变更，例如改掉现有端口默认值、数据字段或挂载路径，导致原部署不能原样启动

标签格式是 `vX.Y.Z`（例如 `v1.0.0`）。`.env`、Compose 和 Dockerfile 里写 `X.Y.Z`，不带 `v`。不使用 `v1.0`、`v1` 或带预发布后缀的标签；工作流会拒绝它们。

### 每次改完之后，维护者要做的事

1. 在功能分支上改完，并用 Pull Request 合并到 `main`。不要在尚未合并的分支上对默认分支发生产 Release，也不要 force-push `main`。
2. 按上一节选择新版本号。
3. 让下面几处变成同一个 `X.Y.Z`。发布工作流会核对它们，不一致就失败且不会创建 Release：
   - `CHANGELOG.md`：把 `[Unreleased]` 里已经完成的条目移到新的 `## [X.Y.Z] - YYYY-MM-DD`。写法可照 [.github/RELEASE_TEMPLATE.md](.github/RELEASE_TEMPLATE.md)
   - `.env.example` 的 `MED_TIMELINE_VERSION=`
   - `docker-compose.yml` 里两处 `${MED_TIMELINE_VERSION:-X.Y.Z}`
   - `Dockerfile` 的 `ARG VERSION=X.Y.Z`
4. 把第 3 步的改动也合并进 `main`。可以就在同一次 Pull Request 里完成。
5. 在包含这些文件的 `main` 提交上打附注标签并推送。推送标签才会触发工作流；合并 Pull Request 本身不会发布。

```bash
git checkout main
git pull origin main
git tag -a vX.Y.Z -m "med-timeline vX.Y.Z"
git push origin vX.Y.Z
```

6. 打开 GitHub Actions，确认名为 Release 的工作流成功。成功后 Releases 页面会出现：
   - 标签 `vX.Y.Z`
   - 标题 `med-timeline vX.Y.Z`
   - 说明：镜像标签、部署包 SHA256、`CHANGELOG.md` 里该版本的正文，以及自上一个标签以来的提交
   - 附件 `med-timeline-X.Y.Z.tar.gz`
7. 不想用推送标签的方式时：等工作流文件已经在默认分支上，到 Actions → Release → Run workflow，输入**已经存在**的标签（例如 `v1.0.0`）。这一步不会创建标签。标签指向的提交里必须有 `scripts/make-release-asset.py`。

工作流失败且 Release 还没建出来时，可以删掉这个标签，改完文件后再打一次同名标签。不要 force-push 分支。

```bash
git push origin :refs/tags/vX.Y.Z
git tag -d vX.Y.Z
```

本地可以预览压缩包和说明，不会联系 GitHub：

```bash
sh scripts/make-release-asset.sh 1.0.0
```

输出在 `dist/`（已被 git 忽略）：`med-timeline-1.0.0.tar.gz` 和 `release-notes.md`。

### 部署包里有什么

解压后的目录可以直接 `docker compose up -d --build`。包含 Compose 文件、`.env.example`、`.dockerignore`、`Dockerfile`、`nginx.conf`、README、CHANGELOG、LICENSE、页面、`css/`、`js/`、`data/`（含 `timeline.json`）、数据脚本，以及 `scripts/` 里的部署、升级、备份、恢复脚本。根目录还有 `IMAGE.txt`，写明本次要用的镜像标签。

不包含：`.git`、`.env`、密钥、`backups/`、已构建的镜像或二进制。镜像在部署机上现构建。

### 工作流权限

[`.github/workflows/release.yml`](.github/workflows/release.yml) 只声明 `permissions: contents: write`。创建 Release 和上传附件需要它，同时把它没有列出的权限留空。

不需要 `id-token`、`attestations` 或 `packages`：没有构建溯源证明，也不往镜像仓库推送。

若组织或仓库把 Actions 的 `GITHUB_TOKEN` 设成只读，创建 Release 会失败。到仓库的 Settings → Actions → General → Workflow permissions，允许 Read and write permissions。工作流文件里的 `permissions` 不会超出这个上限。

### 第一个版本

本仓库目前没有标签。介绍部署流程的这一版已经把 **1.0.0** 写进 `CHANGELOG.md`、`.env.example`、`docker-compose.yml` 和 `Dockerfile`。合并到 `main` 之后，若没有新的改动要写进更新日志，不必再改版本号，在合并提交上执行：

```bash
git tag -a v1.0.0 -m "med-timeline v1.0.0"
git push origin v1.0.0
```

在此之前不要从功能分支推送 `v1.0.0`。
