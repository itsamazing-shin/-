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

# --- 3단계: 이미지 섹션 팬/줌(켄번즈) 애니메이션 ---
KEN_BURNS_ZOOM_RATE = 0.0004   # 프레임당 확대 비율 (천천히 밀어 들어가는 정도)
KEN_BURNS_MAX_ZOOM = 1.15      # 최대 확대 배율
OUTPUT_FPS = 30

# --- 4단계: FFmpeg 조립 (CapCut 아님 — GUI 없이 완전 자동 실행되어야 하므로) ---
CLIP_AUDIO_DB = -10            # AI 생성 클립의 현장음 감쇠량
SUBTITLE_FONT_SIZE = 48
SUBTITLE_MARGIN_V = 90         # 화면 아래에서 띄울 픽셀
SUBTITLE_PRIMARY_COLOR = "&H00FFFFFF"   # 흰 글자 (ASS 색상 표기: &HAABBGGRR)
SUBTITLE_OUTLINE_COLOR = "&H00000000"   # 검은 테두리
SUBTITLE_OUTLINE_WIDTH = 3

# 한글 자막을 태우려면 실제 폰트 '파일'이 필요하다. OS별 기본값을 잡아두고,
# 다른 폰트를 쓰고 싶으면 이 값만 바꾸면 된다.
SUBTITLE_FONT_NAME = "맑은 고딕"        # 윈도우 기본 한글 폰트
SUBTITLE_FONT_DIR = r"C:\Windows\Fonts"  # 맥/리눅스면 해당 폰트 폴더로 교체


def is_video_section(num: int) -> bool:
    lo, hi = VIDEO_SECTION_RANGE
    return lo <= num <= hi


def is_image_section(num: int) -> bool:
    lo, hi = IMAGE_SECTION_RANGE
    return lo <= num <= hi
