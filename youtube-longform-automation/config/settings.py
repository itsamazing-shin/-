"""롱폼 파이프라인 전역 설정값. 비밀키는 여기 두지 않는다 (env_loader 참고)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# --- 영상 포맷 (롱폼: 가로 1920x1080) ---
VIDEO_WIDTH = 1920
VIDEO_HEIGHT = 1080

# --- 구조: 인트로(고정) + 섹션1~24(생성) + 아웃트로(고정) ---
TOTAL_SECTIONS = 24
VIDEO_SECTION_RANGE = (1, 3)     # 이 구간: 그록 영상 생성
IMAGE_SECTION_RANGE = (4, 24)    # 이 구간: 그록 이미지 생성 + 팬/줌 애니메이션(스테이지3)

INTRO_VIDEO = ROOT / "config" / "assets" / "intro.mp4"
OUTRO_VIDEO = ROOT / "config" / "assets" / "outro.mp4"

# --- 대본 린터 (섹션 단위, 롱폼 기준) ---
SECTION_MIN_CHARS = 20
SECTION_MAX_CHARS = 500
MAX_SENTENCE_CHARS = 120
FORBIDDEN_CHARS = ["<", ">", "{", "}"]

# --- 작업 폴더 ---
WORK_DIR = ROOT / "work"
INBOX_DIR = WORK_DIR / "00_inbox"
AUDIO_READY_DIR = WORK_DIR / "01_audio_ready"
CAPTIONS_READY_DIR = WORK_DIR / "02_captions_ready"
CLIPS_READY_DIR = WORK_DIR / "03_clips_ready"
EXPORT_READY_DIR = WORK_DIR / "04_export_ready"
UPLOADED_DIR = WORK_DIR / "05_uploaded"

ERRORS_DIR = ROOT / "errors"
LOGS_DIR = ROOT / "logs"

POLL_INTERVAL_SEC = 2


def is_video_section(num: int) -> bool:
    lo, hi = VIDEO_SECTION_RANGE
    return lo <= num <= hi


def is_image_section(num: int) -> bool:
    lo, hi = IMAGE_SECTION_RANGE
    return lo <= num <= hi
