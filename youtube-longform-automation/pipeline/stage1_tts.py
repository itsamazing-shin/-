"""
1단계 — 텍스트 → 음성 (롱폼 버전)

work/00_inbox/*.txt 를 감시한다. 입력 포맷은 [섹션1]~[섹션24] 마커로
구분된 대본 하나(=에피소드 하나). 인트로/아웃트로는 고정 영상이라
이 단계에서 다루지 않는다 (config/settings.py의 INTRO_VIDEO/OUTRO_VIDEO 참고).

입력 예시:
    [섹션1]
    (첫 번째 섹션 대본...)

    [섹션2]
    (두 번째 섹션 대본...)
    ...
    [섹션24]
    (스물네 번째 섹션 대본...)

섹션별로 개별 TTS 호출을 해서 섹션마다 정확한 오디오 길이를 바로 알 수 있게 한다.
(전체를 한 번에 TTS 후 Whisper로 섹션 경계를 추정하는 방식보다 안전함 —
 섹션1~3은 영상, 섹션4~24는 이미지+애니메이션으로 소스가 갈리기 때문에
 경계가 어긋나면 안 됨)
"""
import re
import sys
import time
from pathlib import Path
from typing import Dict, List

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import settings  # noqa: E402
from lib.env_loader import load_env, EnvError  # noqa: E402
from lib.claim import claim, reject, write_error  # noqa: E402
from lib.logger import get_logger  # noqa: E402

logger = get_logger("stage1_tts", settings.LOGS_DIR)

SECTION_PATTERN = re.compile(r"\[섹션(\d+)\]")
SENTENCE_SPLIT_PATTERN = re.compile(r"[^.!?\n]+[.!?]?")


def parse_sections(text: str) -> Dict[int, str]:
    matches = list(SECTION_PATTERN.finditer(text))
    if not matches:
        raise ValueError("[섹션N] 마커를 찾을 수 없습니다. 예: [섹션1] ... [섹션24]")

    sections: Dict[int, str] = {}
    for i, m in enumerate(matches):
        num = int(m.group(1))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        if num in sections:
            raise ValueError(f"섹션{num} 마커가 중복되었습니다.")
        sections[num] = body
    return sections


def lint_sections(sections: Dict[int, str]) -> List[str]:
    errors: List[str] = []
    expected = set(range(1, settings.TOTAL_SECTIONS + 1))
    missing = expected - sections.keys()
    extra = sections.keys() - expected
    if missing:
        errors.append(f"누락된 섹션: {sorted(missing)}")
    if extra:
        errors.append(f"허용되지 않는 섹션 번호(1~{settings.TOTAL_SECTIONS} 범위 밖): {sorted(extra)}")

    for num in sorted(sections.keys() & expected):
        body = sections[num]
        if not body:
            errors.append(f"섹션{num}: 내용이 비어 있습니다.")
            continue
        length = len(body)
        if length < settings.SECTION_MIN_CHARS:
            errors.append(f"섹션{num}: {length}자 (최소 {settings.SECTION_MIN_CHARS}자 미만)")
        if length > settings.SECTION_MAX_CHARS:
            errors.append(f"섹션{num}: {length}자 (최대 {settings.SECTION_MAX_CHARS}자 초과)")
        for ch in settings.FORBIDDEN_CHARS:
            if ch in body:
                errors.append(f"섹션{num}: 금지 문자 '{ch}' 포함")
        for raw_sentence in SENTENCE_SPLIT_PATTERN.findall(body):
            sentence = raw_sentence.strip()
            if len(sentence) > settings.MAX_SENTENCE_CHARS:
                preview = sentence[:30]
                errors.append(
                    f"섹션{num}: 문장 길이 {len(sentence)}자 초과 "
                    f"(최대 {settings.MAX_SENTENCE_CHARS}자) → \"{preview}...\""
                )
    return errors


def fetch_voice_settings(voice_config_url: str) -> dict:
    resp = requests.get(voice_config_url, timeout=10)
    resp.raise_for_status()
    return resp.json()


def call_elevenlabs_tts(api_key: str, voice: dict, text: str) -> bytes:
    voice_id = voice["voice_id"]
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    resp = requests.post(
        url,
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        json={
            "text": text,
            "model_id": voice.get("model_id", "eleven_multilingual_v2"),
            "voice_settings": voice.get("voice_settings", {}),
        },
        timeout=120,
    )
    resp.raise_for_status()
    return resp.content


def process_file(path: Path, env: dict) -> None:
    ep_id = path.stem
    claimed_path = claim(path, settings.INBOX_DIR / "_claimed")
    if claimed_path is None:
        return  # 다른 워커가 이미 가져갔거나 사라짐

    logger.info(f"{ep_id}: 처리 시작")
    text = claimed_path.read_text(encoding="utf-8")

    try:
        sections = parse_sections(text)
    except ValueError as e:
        reject(claimed_path, settings.INBOX_DIR / "_rejected")
        write_error(settings.ERRORS_DIR, ep_id, "stage1", str(e))
        logger.warning(f"{ep_id}: 파싱 실패 - {e}")
        return

    errors = lint_sections(sections)
    if errors:
        reject(claimed_path, settings.INBOX_DIR / "_rejected")
        write_error(settings.ERRORS_DIR, ep_id, "stage1", "\n".join(errors))
        logger.warning(f"{ep_id}: 린트 실패 ({len(errors)}건) - TTS 호출 안 함(크레딧 보호)")
        return

    try:
        voice = fetch_voice_settings(env["VOICE_CONFIG_URL"])
    except Exception as e:
        write_error(settings.ERRORS_DIR, ep_id, "stage1", f"보이스 설정 조회 실패: {e}")
        logger.error(f"{ep_id}: 보이스 설정 조회 실패 - {e}")
        return  # 원본은 _claimed에 남겨 다음 루프에서 재시도

    out_dir = settings.AUDIO_READY_DIR / ep_id
    out_dir.mkdir(parents=True, exist_ok=True)

    for num in range(1, settings.TOTAL_SECTIONS + 1):
        body = sections[num]
        section_id = f"section_{num:02d}"
        mp3_path = out_dir / f"{section_id}.mp3"
        if mp3_path.exists():
            continue  # 재시작 후 재개 시 이미 만든 섹션은 건너뜀 (비용 방어)
        try:
            audio = call_elevenlabs_tts(env["ELEVENLABS_API_KEY"], voice, body)
        except Exception as e:
            write_error(
                settings.ERRORS_DIR, ep_id, "stage1",
                f"섹션{num} TTS 호출 실패: {e}",
            )
            logger.error(f"{ep_id}/{section_id}: TTS 실패 - {e}")
            return  # 원본은 _claimed에 남아있어 다음 루프에서 이어서 시도
        mp3_path.write_bytes(audio)
        (out_dir / f"{section_id}.script.txt").write_text(body, encoding="utf-8")
        logger.info(f"{ep_id}/{section_id}: TTS 완료 ({len(body)}자)")

    (out_dir / f"{ep_id}.script.txt").write_text(text, encoding="utf-8")
    claimed_path.unlink()
    logger.info(f"{ep_id}: 1단계 완료 → work/01_audio_ready/{ep_id}/")


def ensure_dirs() -> None:
    for d in (
        settings.INBOX_DIR,
        settings.INBOX_DIR / "_claimed",
        settings.INBOX_DIR / "_rejected",
        settings.AUDIO_READY_DIR,
        settings.ERRORS_DIR,
        settings.LOGS_DIR,
    ):
        d.mkdir(parents=True, exist_ok=True)


def main() -> None:
    ensure_dirs()

    try:
        env = load_env(["ELEVENLABS_API_KEY", "VOICE_CONFIG_URL"])
    except EnvError as e:
        logger.error(str(e))
        raise SystemExit(1)

    logger.info("stage1_tts 감시 시작 (2초 간격)")
    while True:
        for path in sorted(settings.INBOX_DIR.glob("*.txt")):
            try:
                process_file(path, env)
            except Exception:
                logger.exception(f"{path.name}: 예기치 못한 오류 (다음 파일 계속 진행)")
        time.sleep(settings.POLL_INTERVAL_SEC)


if __name__ == "__main__":
    main()
