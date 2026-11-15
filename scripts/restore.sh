#!/bin/sh
# 从 backup.sh 生成的压缩包恢复 data/timeline.json。
# 用法: sh scripts/restore.sh backups/med-timeline-data-YYYYMMDD-HHMMSS-<pid>.tar.gz
set -eu
BASE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
. "$BASE/lib.sh"

if [ $# -ne 1 ]; then
  echo "用法: sh scripts/restore.sh <备份.tar.gz>" >&2
  exit 1
fi
if [ ! -f "$1" ]; then
  echo "找不到备份文件: $1" >&2
  exit 1
fi
ARCHIVE_DIR=$(CDPATH= cd -- "$(dirname "$1")" && pwd)
ARCHIVE="$ARCHIVE_DIR/$(basename "$1")"
cd_root

if tar -tzf "$ARCHIVE" | grep -E '(^/|(^|/)\.\.(/|$))' >/dev/null 2>&1; then
  echo "备份包包含不安全路径，已拒绝恢复。" >&2
  exit 1
fi
if ! tar -tzf "$ARCHIVE" | grep -Fxq "data/timeline.json"; then
  echo "备份包里没有 data/timeline.json。" >&2
  exit 1
fi

echo "恢复前会再备份当前的 data/timeline.json。"
sh "$BASE/backup.sh"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
tar -xzf "$ARCHIVE" -C "$TMP" data/timeline.json
if [ ! -f "$TMP/data/timeline.json" ]; then
  echo "解压后没有 data/timeline.json。" >&2
  exit 1
fi
if command -v python3 >/dev/null 2>&1; then
  python3 -c 'import json,sys; json.load(open(sys.argv[1], encoding="utf-8"))' "$TMP/data/timeline.json"
fi
cp "$TMP/data/timeline.json" "$ROOT/data/timeline.json"
echo "已恢复 data/timeline.json。数据目录是只读挂载，刷新浏览器即可，不必重建镜像。"
