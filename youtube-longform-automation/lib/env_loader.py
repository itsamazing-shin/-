"""~/.config/watch/.env 에서만 비밀키를 읽는다. 코드에 키를 박지 않는다.

경로는 OS별로 이렇게 잡힌다:
  윈도우: C:\\Users\\<사용자이름>\\.config\\watch\\.env
  맥/리눅스: /home/<사용자이름>/.config/watch/.env

권한 600 검사는 POSIX(맥/리눅스)에서만 강제한다. 윈도우는 이 권한 개념이
없어서 항상 다른 값이 나오므로, 검사하면 무조건 실패한다.
"""
import os
import stat
import warnings
from pathlib import Path

ENV_PATH = Path.home() / ".config" / "watch" / ".env"

IS_WINDOWS = os.name == "nt"


class EnvError(RuntimeError):
    pass


def _check_permissions(path: Path) -> None:
    if IS_WINDOWS:
        # 윈도우엔 POSIX 권한이 없다. 대신 한 번 알려만 주고 통과시킨다.
        warnings.warn(
            f"{path} 는 윈도우라 권한 검사를 건너뜁니다. "
            f"이 파일에 API 키가 들어있으니 다른 사람과 공유되는 폴더에 두지 마세요.",
            stacklevel=2,
        )
        return

    mode = stat.S_IMODE(path.stat().st_mode)
    if mode != 0o600:
        raise EnvError(
            f"{path} 권한이 600이 아닙니다 (현재: {oct(mode)}). "
            f"터미널에서 chmod 600 {path} 실행 후 다시 시도하세요."
        )


def _setup_hint() -> str:
    if IS_WINDOWS:
        return (
            f"{ENV_PATH} 파일이 없습니다.\n"
            f"파일 탐색기 주소창에 %USERPROFILE% 를 입력해 내 사용자 폴더로 간 뒤,\n"
            f".config 폴더 → 그 안에 watch 폴더를 만들고, 그 안에 .env 파일을 만드세요."
        )
    return (
        f"{ENV_PATH} 파일이 없습니다. mkdir -p {ENV_PATH.parent} 후 "
        f"해당 경로에 .env 파일을 만들고 chmod 600 을 적용하세요."
    )


def load_env(required: list) -> dict:
    if not ENV_PATH.exists():
        raise EnvError(_setup_hint())
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
