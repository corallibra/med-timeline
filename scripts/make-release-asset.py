#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build dist/med-timeline-<version>.tar.gz and dist/release-notes.md.

Does not create a git tag or a GitHub Release.
"""
import hashlib
import json
import re
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION_RE = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")

PACKAGE_FILES = [
    "README.md",
    "CHANGELOG.md",
    "LICENSE",
    ".dockerignore",
    ".env.example",
    "Dockerfile",
    "docker-compose.yml",
    "nginx.conf",
    "index.html",
    "css/styles.css",
    "js/app.js",
    "data/timeline.json",
    "data/README-data.md",
    "build_timeline.py",
    "add_more_events.py",
    "scripts/lib.sh",
    "scripts/deploy.sh",
    "scripts/upgrade.sh",
    "scripts/backup.sh",
    "scripts/restore.sh",
]


def package_paths():
    """Files that go into the deployment tarball.

    docs/screenshots/ is included so README image links still resolve after
    the archive is unpacked. Only regular files are packed; nothing under
    that directory is a secret or a container layer.
    """
    paths = list(PACKAGE_FILES)
    shot_dir = ROOT / "docs" / "screenshots"
    if not shot_dir.is_dir():
        fail("打包缺少目录：docs/screenshots")
    shots = sorted(
        p.relative_to(ROOT).as_posix()
        for p in shot_dir.rglob("*")
        if p.is_file()
    )
    if not shots:
        fail("docs/screenshots 里没有可打包的文件")
    return paths + shots


def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)


def require_version_strings(version):
    checks = {
        "CHANGELOG.md": f"## [{version}]",
        ".env.example": f"MED_TIMELINE_VERSION={version}",
        "Dockerfile": f"ARG VERSION={version}",
        "docker-compose.yml": f"med-timeline:${{MED_TIMELINE_VERSION:-{version}}}",
    }
    errors = []
    for rel, needle in checks.items():
        text = (ROOT / rel).read_text(encoding="utf-8")
        if needle not in text:
            errors.append(f"{rel} 中找不到 `{needle}`")
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    build_arg = f"VERSION: \"${{MED_TIMELINE_VERSION:-{version}}}\""
    if build_arg not in compose:
        errors.append(f"docker-compose.yml 中找不到 `{build_arg}`")
    if errors:
        fail(
            "版本号与标签不一致，已停止打包（不会创建 Release）：\n- "
            + "\n- ".join(errors)
        )


def changelog_body(version):
    text = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
    match = re.search(
        rf"^## \[{re.escape(version)}\][^\n]*\n(?P<body>.*?)(?=^## |\Z)",
        text,
        re.M | re.S,
    )
    if not match:
        fail(f"CHANGELOG.md 没有 ## [{version}] 这一节。")
    body = match.group("body").strip()
    if not body:
        fail(f"CHANGELOG.md 里 ## [{version}] 是空的。")
    return body


def git_output(args):
    result = subprocess.run(
        args,
        cwd=ROOT,
        check=False,
        text=True,
        capture_output=True,
    )
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def commit_notes(version):
    tag = f"v{version}"
    code, _, _ = git_output(["git", "rev-parse", "--verify", "--quiet", f"refs/tags/{tag}"])
    if code == 0:
        end = tag
        prev_code, prev, _ = git_output(
            ["git", "describe", "--tags", "--abbrev=0", f"{tag}^"]
        )
        prev_tag = prev if prev_code == 0 else ""
        heading = "自上一标签以来的提交"
    else:
        end = "HEAD"
        prev_code, prev, _ = git_output(["git", "describe", "--tags", "--abbrev=0"])
        prev_tag = prev if prev_code == 0 else ""
        heading = "当前检出中、自上一标签以来的提交（本地预览，标签尚未指向这里）"
    if not prev_tag and code == 0:
        heading = "这是第一个版本标签，以下为该标签包含的提交"
    if prev_tag:
        log_code, log_text, log_err = git_output(
            ["git", "log", "--no-merges", "--pretty=format:- %s (%h)", f"{prev_tag}..{end}"]
        )
    else:
        log_code, log_text, log_err = git_output(
            ["git", "log", "--no-merges", "--pretty=format:- %s (%h)", end]
        )
    if log_code != 0:
        log_text = f"（无法读取 git 历史：{log_err}）"
    elif not log_text:
        log_text = "（没有新的非合并提交）"
    return heading, log_text


def image_note(version):
    return "\n".join(
        [
            f"med-timeline {version}",
            "",
            f"镜像标签：med-timeline:{version}",
            "构建方式：在本目录执行 docker compose up -d --build",
            "或：sh scripts/deploy.sh",
            "本包不包含已构建的容器镜像，也不包含密钥。仓库不推送 Docker Hub 或 GHCR。",
            "容器内端口：80",
            "默认宿主机端口：3007（见 .env 的 MED_TIMELINE_PORT）",
            "数据文件：data/timeline.json，只读挂载进容器。",
            "",
        ]
    )


def add_file(tar, src, arcname):
    info = tar.gettarinfo(str(src), arcname=arcname)
    info.uid = 0
    info.gid = 0
    info.uname = ""
    info.gname = ""
    if arcname.endswith(".sh"):
        info.mode = 0o755
    else:
        info.mode = 0o644
    with src.open("rb") as handle:
        tar.addfile(info, handle)


def build_tar(version, archive, notes_path):
    prefix = f"med-timeline-{version}"
    json.loads((ROOT / "data" / "timeline.json").read_text(encoding="utf-8"))
    with tempfile.TemporaryDirectory(prefix="stage-", dir=archive.parent) as stage_name:
        stage = Path(stage_name)
        # tar is written directly; stage dir only holds IMAGE.txt
        image_txt = stage / "IMAGE.txt"
        image_txt.write_text(image_note(version), encoding="utf-8")
        packed = package_paths()
        with tarfile.open(archive, "w:gz") as tar:
            for rel in packed:
                src = ROOT / rel
                if not src.is_file():
                    fail(f"打包缺少文件：{rel}")
                add_file(tar, src, f"{prefix}/{rel}")
            add_file(tar, image_txt, f"{prefix}/IMAGE.txt")
    with tarfile.open(archive, "r:gz") as tar:
        names = set(tar.getnames())
        for rel in packed + ["IMAGE.txt"]:
            member = f"{prefix}/{rel}"
            if member not in names:
                fail(f"压缩包缺少 {member}")
        for name in names:
            base = Path(name).name
            if base == ".env" or base.endswith((".pem", ".key")):
                fail(f"压缩包含有不该发布的文件：{name}")
        timeline = tar.extractfile(f"{prefix}/data/timeline.json")
        if timeline is None:
            fail("压缩包中的 timeline.json 无法读取。")
        json.loads(timeline.read().decode("utf-8"))
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    heading, commits = commit_notes(version)
    body = changelog_body(version)
    notes = "\n".join(
        [
            f"## med-timeline v{version}",
            "",
            f"部署包：`med-timeline-{version}.tar.gz`（SHA256：`{digest}`）",
            "",
            f"镜像标签：`med-timeline:{version}`。本仓库不推送容器镜像仓库，压缩包里没有镜像层。",
            "在解压目录执行 `docker compose up -d --build`（或 `sh scripts/deploy.sh`）后，本机会得到这个标签。",
            "容器内监听 80，默认映射宿主机端口 3007。",
            "",
            "### 变更说明",
            "",
            body,
            "",
            f"### {heading}",
            "",
            commits,
            "",
        ]
    )
    notes_path.write_text(notes, encoding="utf-8")
    print(f"Wrote {archive}")
    print(f"Wrote {notes_path}")
    print(f"SHA256 {digest}")


def main(argv):
    if len(argv) != 2:
        fail("用法: python3 scripts/make-release-asset.py X.Y.Z")
    version = argv[1]
    if version.startswith("v") or not VERSION_RE.fullmatch(version):
        fail("版本必须是 X.Y.Z，不带 v，例如 1.1.0")
    require_version_strings(version)
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    archive = dist / f"med-timeline-{version}.tar.gz"
    notes = dist / "release-notes.md"
    build_tar(version, archive, notes)


if __name__ == "__main__":
    main(sys.argv)
