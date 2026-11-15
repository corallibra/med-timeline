#!/bin/sh
# 备份宿主机上的 data/timeline.json。容器不能写这个只读挂载，数据只在宿主机文件里。
set -eu
BASE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
. "$BASE/lib.sh"
cd_root

if [ ! -f data/timeline.json ]; then
  echo "找不到 data/timeline.json。" >&2
  exit 1
fi

mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="backups/med-timeline-data-${STAMP}-$$.tar.gz"
tar -czf "$OUT" data/timeline.json
echo "已备份到 $OUT"
echo "backups/ 不会进 Git，也不会打进发布包。换目录覆盖代码前，请把需要保留的备份拷到目录外面。"
