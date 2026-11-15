#!/bin/sh
# 在本机预览部署包和 Release 说明。不会创建 GitHub Release。
# 用法: sh scripts/make-release-asset.sh 1.0.0
set -eu
BASE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
exec python3 "$BASE/make-release-asset.py" "$@"
