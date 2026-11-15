#!/bin/sh
# 在当前目录构建镜像并后台启动。不会下载 GitHub Release。
# docker-compose.yml 的 pull_policy 是 build：只在本机构建 med-timeline，不会从镜像仓库拉取这个标签。
set -eu
BASE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
. "$BASE/lib.sh"
cd_root
require_compose

if [ ! -f .env ]; then
  cp .env.example .env
  echo "已根据 .env.example 创建 .env。需要改端口时先编辑它，再重新执行本脚本。"
fi

if [ "${MED_TIMELINE_SKIP_WARN:-}" != 1 ]; then
  warn_version_pin
fi

if [ ! -f data/timeline.json ]; then
  echo "缺少 data/timeline.json，页面将无法加载时间轴。" >&2
  exit 1
fi

run_compose up -d --build
run_compose ps

PORT=$(grep -E '^MED_TIMELINE_PORT=' .env | head -n 1 | cut -d= -f2- | tr -d '[:space:]' || true)
if [ -z "${PORT:-}" ]; then
  PORT=3007
fi
echo "已启动。本机打开 http://127.0.0.1:${PORT}/ ，局域网请把 127.0.0.1 换成这台机器的 IP。"
