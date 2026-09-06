"""~/.config/watch/.env (권한 600) 에서만 비밀키를 읽는다. 코드에 키를 박지 않는다."""
import stat
from pathlib import Path

ENV_PATH = Path.home() / ".config" / "watch" / ".env"


class EnvError(RuntimeError):
    pass


def _check_permissions(path: Path) -> None:
    mode = stat.S_IMODE(path.stat().st_mode)
    if mode != 0o600:
        raise EnvError(
            f"{path} 권한이 600이 아닙니다 (현재: {oct(mode)}). "
            f"터미널에서 chmod 600 {path} 실행 후 다시 시도하세요."
        )


def load_env(required: list) -> dict:
    if not ENV_PATH.exists():
        raise EnvError(
            f"{ENV_PATH} 파일이 없습니다. mkdir -p {ENV_PATH.parent} 후 "
            f"해당 경로에 .env 파일을 만들고 chmod 600 을 적용하세요."
        )
    _check_permissions(ENV_PATH)

    values: dict = {}
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        values[key.strip()] = val.strip().strip('"').strip("'")

    missing = [k for k in required if not values.get(k)]
    if missing:
        raise EnvError(f"{ENV_PATH} 에 다음 키가 없습니다: {', '.join(missing)}")

    return values
