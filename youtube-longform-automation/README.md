# 유튜브 롱폼 자동화 파이프라인

가로 1920x1080 롱폼 영상용 워처(Watcher) 기반 파이프라인입니다.
구조: **인트로(고정 영상) → 섹션1~3(그록 영상 생성) → 섹션4~24(그록 이미지 생성 + 팬/줌 애니메이션) → 아웃트로(고정 영상)**

현재 **1단계(텍스트 → 음성)까지** 구현되어 있습니다. 이 단계를 함께 테스트한 뒤
2~5단계(자막, 클립 생성, 조립, 업로드)를 순서대로 이어서 만듭니다.

---

## 1. 시작 전 준비물 체크리스트

| 항목 | 용도 | 비고 |
|---|---|---|
| ElevenLabs API 키 | 1단계 음성 생성(TTS) | https://elevenlabs.io → Profile → API Keys |
| 보이스 설정 조회 URL | 1단계에서 목소리/톤 설정값을 코드에 박지 않고 조회 | 직접 운영 중인 설정 서버 주소 (아래 3번 참고) |
| Groq API 키 | 2단계 Whisper 자막 타임코드 (그록과 다른 회사입니다. 이름이 비슷해서 헷갈리기 쉬워요) | https://console.groq.com |
| xAI(그록) API 키 | 3단계 영상/이미지 생성 (공식 API, 종량 과금) | https://console.x.ai |
| YouTube Data API 인증정보(client_secret.json) | 5단계 자동 업로드 | Google Cloud Console |
| 인트로/아웃트로 mp4 파일 | 매 영상 앞뒤에 고정으로 붙는 영상 (AI로 만들지 않음) | 아래 4번 참고 |

준비 안 된 게 있으면 말씀해주시면 발급 방법을 한 단계씩 알려드리겠습니다.

**참고**: 그록(Grok, xAI사) 영상/이미지 생성은 브라우저 자동화 없이 **공식 API로 직접 호출**하도록
결정했습니다. 구독 UI를 흉내 내는 방식이 아니라서 계정 정지 리스크는 없지만, 호출한 만큼
과금됩니다(3번 참고). 편당 예상 비용은 3단계를 만들 때 함께 계산해드리겠습니다.

---

## 2. 비밀키 등록 방법 (한 번만 하면 됩니다)

터미널(검은 화면)을 열고 아래 명령을 **한 줄씩** 그대로 붙여넣고 Enter 하세요.

```bash
mkdir -p ~/.config/watch
touch ~/.config/watch/.env
chmod 600 ~/.config/watch/.env
```

그다음 `~/.config/watch/.env` 파일을 텍스트 편집기로 열어서 아래 내용을 채워 넣으세요
(오른쪽 `발급받은 값`만 실제 키로 교체):

```
ELEVENLABS_API_KEY=발급받은 값
VOICE_CONFIG_URL=보이스 설정을 조회할 주소 (예: http://localhost:8080/voice)
GROQ_API_KEY=발급받은 값
XAI_API_KEY=발급받은 값
```

---

## 3. "보이스 설정 조회 URL"이 뭔가요?

목소리 종류나 톤 같은 세부 설정값을 코드 안에 직접 적어두지 않고, 요청이 올 때마다
정해진 주소(`VOICE_CONFIG_URL`)에 조회해서 가져오는 방식입니다. 이런 설정 서버를
이미 운영 중이시면 그 주소를 넣으시면 되고, 없으시면 간단한 걸 만들어드릴 수 있으니
말씀해주세요.

응답 형식 예시:
```json
{
  "voice_id": "ElevenLabs 보이스 ID",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": { "stability": 0.5, "similarity_boost": 0.75 }
}
```

---

## 4. 인트로/아웃트로 파일 넣는 방법

가지고 계신 고정 인트로/아웃트로 mp4 파일을 아래 경로에 그대로 복사해 넣으세요
(파일 이름도 정확히 맞춰야 합니다):

```
youtube-longform-automation/config/assets/intro.mp4
youtube-longform-automation/config/assets/outro.mp4
```

---

## 5. 패키지 설치

```bash
cd youtube-longform-automation
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 6. 대본 작성 규칙 (1단계 린터가 검사하는 항목)

- 파일 하나 = 영상 한 편. `[섹션1]`부터 `[섹션24]`까지 **정확히 24개**, 순서 상관없이 전부 있어야 합니다.
- 섹션당 글자수: 최소 20자 ~ 최대 500자
- 문장 하나 최대 120자
- `<`, `>`, `{`, `}` 문자 사용 금지
- 규칙을 어기면 **음성 생성 API를 호출하지 않고** 즉시 반려됩니다 (크레딧 보호)
  - 원본 파일 → `work/00_inbox/_rejected/`
  - 반려 사유 → `errors/<파일명>_stage1_error.txt`

예시 파일: `samples/sample_script.txt` (그대로 테스트에 사용하셔도 됩니다)

---

## 7. 1단계 테스트 방법

1. 위 1~6번 준비를 마칩니다.
2. 아래 명령으로 1단계만 실행합니다:
   ```bash
   cd youtube-longform-automation
   source venv/bin/activate
   python pipeline/stage1_tts.py
   ```
3. 다른 터미널(또는 파일 탐색기)에서 `samples/sample_script.txt`를 복사해
   `work/00_inbox/` 폴더 안에 넣습니다. (파일 이름은 자유롭게 바꿔도 됩니다. 예: `ep001.txt`)
4. 2초 안에 처리가 시작됩니다. 터미널에 로그가 찍히는지 확인하세요.
5. **성공하면**: `work/01_audio_ready/ep001/` 폴더 안에 `section_01.mp3` ~ `section_24.mp3`
   파일 24개와 대본 텍스트 파일들이 생깁니다. 하나를 재생해서 음성이 잘 나오는지 확인해주세요.
6. **실패하면**: `errors/ep001_stage1_error.txt` 파일을 열어서 내용을 복사해 보여주세요.
7. 종료할 때는 터미널에서 `Ctrl + C`를 누르세요.

이 테스트가 통과하면 2단계(자막)로 넘어가겠습니다.
