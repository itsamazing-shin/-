"""원자적 파일 클레임 유틸. os.rename 을 락으로 사용한다 (같은 파일시스템 한정)."""
import os
import shutil
from pathlib import Path
from typing import Optional


def claim(src: Path, claimed_dir: Path) -> Optional[Path]:
    claimed_dir.mkdir(parents=True, exist_ok=True)
    dest = claimed_dir / src.name
    try:
        os.rename(src, dest)
        return dest
    except OSError:
        return None


def reject(path: Path, rejected_dir: Path) -> Path:
    rejected_dir.mkdir(parents=True, exist_ok=True)
    dest = rejected_dir / path.name
    shutil.move(str(path), str(dest))
    return dest


def write_error(errors_dir: Path, ep_id: str, stage: str, message: str) -> Path:
    errors_dir.mkdir(parents=True, exist_ok=True)
    dest = errors_dir / f"{ep_id}_{stage}_error.txt"
    dest.write_text(message, encoding="utf-8")
    return dest
