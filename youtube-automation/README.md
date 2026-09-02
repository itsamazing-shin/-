# youtube-automation

대본 1편(24~25 섹션)을 넣으면 아래 순서를 자동으로 처리해서 최종 mp4를 만들어주는 로컬 Node.js 스크립트 모음입니다.

```
대본(script.json)
  -> 1. Grok(xAI)로 섹션별 이미지 생성
  -> 2. 앞 N개 섹션은 Higgsfield 이미지→영상, 나머지는 Higgsfield 팬/줌 애니메이션
  -> 3. ElevenLabs로 섹션별 나레이션(+타임스탬프) 생성
  -> 4. 타임스탬프로 섹션별 SRT 자막 생성
  -> 5. 로고/자막 합성 + 나레이션 길이에 맞춰 조립 -> 최종 영상
  -> 6. (선택) 썸네일 생성
```

CapCut에서 손으로 하던 "이미지/영상 배치 -> 자막 -> 로고 -> 길이 맞추기" 부분을 대체하는 게 목표입니다.
최종 결과물을 CapCut에 다시 가져와 미세 조정하는 것도 물론 가능합니다 (5단계 산출물은 표준 mp4입니다).

## ⚠️ 먼저 알아둘 것 (Higgsfield API 스펙)

이 코드를 만든 환경에서는 네트워크 정책상 `docs.higgsfield.ai` 접속이 막혀 있어서
Higgsfield 공식 REST API 문서를 직접 확인하지 못했습니다. `lib/higgsfield.mjs`는
"작업 제출 -> job id -> 폴링 -> 완료 시 결과 URL 다운로드"라는 일반적인 비동기 생성 API
패턴으로 작성되어 있지만, **실제 엔드포인트 경로 / 요청 필드명은 검증되지 않았습니다.**

Higgsfield에서 API 키를 발급하면 대시보드에 Python/JS/cURL 예제 코드가 함께 제공됩니다.
그 예제를 보고 `lib/higgsfield.mjs` 상단의 `SUBMIT_PATH`, `STATUS_PATH`와 요청 바디 필드 3곳만
맞춰서 고치면 됩니다. 다른 파일은 손댈 필요 없습니다.

Higgsfield 키를 아직 세팅하지 않았거나 호출이 실패해도 파이프라인은 멈추지 않고,
**로컬 ffmpeg Ken Burns(줌/팬) 효과로 자동 대체**하도록 만들어 두었습니다. 즉 API 키가
하나도 없어도 이미지 생성(xAI)과 나레이션(ElevenLabs)만 있으면 전체 파이프라인이
끝까지 동작하는 걸 먼저 확인할 수 있습니다.

## 준비물

- Node.js 18 이상
- `ffmpeg`, `ffprobe` (시스템에 설치되어 PATH에 있어야 함)
- API 키: xAI(Grok), ElevenLabs, (선택) Higgsfield

```bash
cd youtube-automation
npm install
cp .env.example .env   # 이후 .env를 채워주세요
```

## 사용법

### 1) 새 프로젝트(영상 1편) 만들기

```bash
node scripts/00-new-project.mjs my-video-01 24
```

`projects/my-video-01/script.json`이 24섹션 스켈레톤으로 생성됩니다. 아래처럼 채워주세요.

```json
{
  "title": "영상 제목",
  "thumbnailPrompt": "썸네일용 이미지 프롬프트",
  "sections": [
    {
      "id": 1,
      "isVideo": true,
      "text": "이 섹션에서 읽을 나레이션 대본",
      "imagePrompt": "Grok에 줄 이미지 생성 프롬프트",
      "videoPrompt": "이 이미지를 영상으로 만들 때 줄 프롬프트 (앞 3섹션만)",
      "estimatedSeconds": 6
    },
    {
      "id": 4,
      "isVideo": false,
      "text": "...",
      "imagePrompt": "...",
      "estimatedSeconds": 5
    }
  ]
}
```

- `isVideo: true`인 섹션(기본: 앞 3개, `.env`의 `VIDEO_SECTION_COUNT`로 조절)은 `videoPrompt`로 Higgsfield 이미지→영상을 호출합니다.
- `isVideo: false`인 섹션은 이미지 + 은은한 팬/줌 애니메이션으로 처리됩니다.
- `estimatedSeconds`는 영상 생성 요청 시 참고용 길이일 뿐이고, 최종 길이는 5단계에서 **나레이션 길이에 자동으로 맞춰집니다.**

### 2) 전체 파이프라인 실행

```bash
node scripts/run-pipeline.mjs my-video-01
```

- 특정 단계부터: `node scripts/run-pipeline.mjs my-video-01 --from 3`
- 특정 단계만: `node scripts/run-pipeline.mjs my-video-01 --only 5`
- 각 단계는 이미 생성된 파일이 있으면 건너뛰므로, 중간에 실패해도 다시 실행하면 이어서 진행됩니다.

결과물: `projects/my-video-01/output/my-video-01.mp4`, `output/thumbnail.jpg`

### 로고 워터마크

`assets/logo.png` 파일을 넣어두면 5단계에서 자동으로 우상단에 오버레이됩니다. 없으면 생략됩니다.

## 폴더 구조

```
youtube-automation/
  lib/            API 클라이언트, ffmpeg 헬퍼, 공통 유틸
  scripts/        단계별 실행 스크립트 (00~06) + run-pipeline.mjs
  assets/         logo.png 등 공용 리소스
  projects/
    <슬러그>/
      script.json
      images/section-01.jpg ...
      clips/section-01.mp4 ...       (Higgsfield 또는 Ken Burns 결과)
      audio/section-01.mp3, .alignment.json ...
      subtitles/section-01.srt ...
      output/<슬러그>.mp4, thumbnail.jpg
```

## 다음에 자동화하면 좋은 부분

- 대본을 섹션 24~25개로 자동 분할해서 `script.json`을 채워주는 변환기 (지금은 수동 입력)
- 배경음악 자동 믹싱 (ffmpeg `amix` 필터로 5단계에 추가 가능)
- 유튜브 업로드 자동화 (YouTube Data API)
