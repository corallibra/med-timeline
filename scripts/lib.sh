# 供同目录脚本用 `.` 载入。不要单独执行。

cd_root() {
  ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
  cd "$ROOT"
}

warn_version_pin() {
  if [ ! -f .env ] || [ ! -f .env.example ]; then
    return 0
  fi
  cur=$(grep -E '^MED_TIMELINE_VERSION=' .env | head -n 1 | cut -d= -f2- | tr -d '[:space:]' || true)
  exp=$(grep -E '^MED_TIMELINE_VERSION=' .env.example | head -n 1 | cut -d= -f2- | tr -d '[:space:]' || true)
  if [ -n "$cur" ] && [ -n "$exp" ] && [ "$cur" != "$exp" ]; then
    echo "注意: .env 的 MED_TIMELINE_VERSION=$cur，本目录 .env.example 为 $exp。"
    echo "Compose 优先使用 .env。请把 .env 改成 $exp，否则仍会构建旧标签。"
  fi
}

require_compose() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "未找到 docker 命令。请先安装并启动 Docker Engine。" >&2
    exit 1
  fi
  if docker compose version >/dev/null 2>&1; then
    return 0
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    return 0
  fi
  echo "未找到 docker compose 或 docker-compose。" >&2
  echo "可安装 Compose v2，或在 Synology Container Manager 中选择本目录的 docker-compose.yml 创建项目。" >&2
  exit 1
}

run_compose() {
  require_compose
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}
