// Higgsfield 이미지→영상 / 이미지 애니메이션 클라이언트
//
// ⚠️ 스펙 확인 필요
// 이 샌드박스 환경은 네트워크 정책상 docs.higgsfield.ai 접속이 차단되어 있어서,
// 공식 REST API 문서를 직접 열람하지 못한 채로 이 파일을 작성했습니다.
// Higgsfield는 API 키를 발급하면 대시보드에서 Python/JS/cURL 예제 코드를 보여주므로,
// 그 예제를 보고 아래 SUBMIT_PATH / STATUS_PATH / 요청 바디 필드명 3곳만
// 맞춰서 고쳐주세요. (일반적인 "제출 -> job id 받기 -> 폴링 -> 완료 시 결과 URL" 구조는
// 대부분의 비동기 생성형 API와 동일해서 골격은 그대로 재사용 가능할 가능성이 높습니다.)
//
// 이 파일만 수정하면 01~05번 파이프라인 스크립트는 그대로 동작합니다.
import fs from 'node:fs/promises';
import { config, requireEnv } from './config.mjs';

const SUBMIT_PATH = process.env.HIGGSFIELD_SUBMIT_PATH || '/v1/image2video';
const STATUS_PATH_TEMPLATE = process.env.HIGGSFIELD_STATUS_PATH || '/v1/jobs/{id}';

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${config.higgsfieldApiBase}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${config.higgsfieldApiKey}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Higgsfield API 오류 (${res.status}) ${path}: ${errText}`);
  }
  return res.json();
}

async function pollForVideoUrl(jobId, { intervalMs = 5000, timeoutMs = 10 * 60 * 1000 } = {}) {
  const start = Date.now();
  const path = STATUS_PATH_TEMPLATE.replace('{id}', jobId);

  while (Date.now() - start < timeoutMs) {
    const statusJson = await apiFetch(path, { method: 'GET' });
    const status = statusJson.status;

    if (['completed', 'succeeded', 'success'].includes(status)) {
      const url = statusJson.output?.video_url || statusJson.video_url || statusJson.result?.url;
      if (!url) throw new Error('완료 상태지만 응답에서 video_url을 찾지 못했습니다: ' + JSON.stringify(statusJson));
      return url;
    }
    if (['failed', 'error'].includes(status)) {
      throw new Error('Higgsfield 작업 실패: ' + JSON.stringify(statusJson));
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Higgsfield 작업(${jobId}) 대기 시간을 초과했습니다.`);
}

async function submitAndDownload(imageFile, prompt, outVideoFile, extraFields = {}) {
  requireEnv(['higgsfieldApiKey']);

  const imageBase64 = (await fs.readFile(imageFile)).toString('base64');

  const submitJson = await apiFetch(SUBMIT_PATH, {
    method: 'POST',
    body: JSON.stringify({
      image: imageBase64,
      prompt,
      ...extraFields,
    }),
  });

  const jobId = submitJson.id || submitJson.job_id || submitJson.task_id;
  if (!jobId) throw new Error('Higgsfield 응답에서 작업 ID를 찾지 못했습니다: ' + JSON.stringify(submitJson));

  const videoUrl = await pollForVideoUrl(jobId);
  const videoRes = await fetch(videoUrl);
  await fs.writeFile(outVideoFile, Buffer.from(await videoRes.arrayBuffer()));
  return outVideoFile;
}

// 대본에 맞춘 영상 프롬프트로 이미지를 영상화 (앞쪽 핵심 섹션용)
export async function imageToVideo(imageFile, prompt, outVideoFile, { motionStrength = 'medium', durationSeconds } = {}) {
  return submitAndDownload(imageFile, prompt, outVideoFile, {
    motion_strength: motionStrength,
    duration_seconds: durationSeconds,
  });
}

// 정적 이미지에 은은한 팬/줌 애니메이션만 부여 (나머지 섹션용)
export async function animateImage(imageFile, outVideoFile, { durationSeconds } = {}) {
  const gentlePrompt = 'subtle slow camera pan and zoom, minimal motion, cinematic, no distortion';
  return submitAndDownload(imageFile, gentlePrompt, outVideoFile, {
    motion_strength: 'low',
    duration_seconds: durationSeconds,
  });
}
