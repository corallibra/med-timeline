#!/bin/sh
# 用当前目录里的文件重建并启动。不会自行下载新版本。
# 正确顺序：先备份，再把新部署包覆盖到本目录（保留 .env，并确认 data/timeline.json 是要留下的那一份），最后执行本脚本。
set -eu
BASE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
. "$BASE/lib.sh"
cd_root

echo "将先备份 data/timeline.json，再用当前目录重建镜像并启动。"
echo "本脚本不会访问 GitHub，也不会替换你的 .env。"
warn_version_pin
sh "$BASE/backup.sh"
MED_TIMELINE_SKIP_WARN=1 sh "$BASE/deploy.sh"
