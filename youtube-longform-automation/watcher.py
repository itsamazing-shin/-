"""
감독자 — 각 스테이지를 별도 프로세스로 띄우고, 죽으면 재시작한다.
스테이지 내부 로직(파일 단위 실패 처리)과는 별개로, 프로세스 자체가
죽었을 때(설정 오류, 미처리 예외로 인터프리터 크래시 등)만 여기서 관여한다.
"""
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from config import settings  # noqa: E402
from lib.logger import get_logger  # noqa: E402

logger = get_logger("watcher", settings.LOGS_DIR)

# 아직 만들어진 스테이지만 등록한다. 2~5단계는 완성되는 대로 주석 해제.
STAGES = [
    "pipeline/stage1_tts.py",
    # "pipeline/stage2_captions.py",
    # "pipeline/stage3_clips.py",
    # "pipeline/stage4_assembly.py",
    # "pipeline/stage5_upload.py",
]

RESTART_DELAY_SEC = 3


def spawn(stage: str) -> subprocess.Popen:
    proc = subprocess.Popen([sys.executable, str(ROOT / stage)])
    logger.info(f"{stage} 시작 (pid={proc.pid})")
    return proc


def run() -> None:
    procs = {stage: spawn(stage) for stage in STAGES}

    try:
        while True:
            for stage, proc in list(procs.items()):
                code = proc.poll()
                if code is not None:
                    logger.warning(
                        f"{stage} 종료됨 (code={code}) → {RESTART_DELAY_SEC}초 후 재시작"
                    )
                    time.sleep(RESTART_DELAY_SEC)
                    procs[stage] = spawn(stage)
            time.sleep(settings.POLL_INTERVAL_SEC)
    except KeyboardInterrupt:
        logger.info("종료 신호 수신 — 모든 스테이지 종료 중")
        for proc in procs.values():
            proc.terminate()


if __name__ == "__main__":
    run()
