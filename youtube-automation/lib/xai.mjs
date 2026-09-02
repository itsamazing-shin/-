// xAI (Grok) 이미지 생성 클라이언트
// 문서: https://docs.x.ai/developers/model-capabilities/images/generation
// OpenAI SDK와 호환되는 REST 형식 (base_url: https://api.x.ai/v1)
import fs from 'node:fs/promises';
import { config, requireEnv } from './config.mjs';

const ENDPOINT = 'https://api.x.ai/v1/images/generations';

export async function generateImage(prompt, outFile, { model = 'grok-2-image' } = {}) {
  requireEnv(['xaiApiKey']);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.xaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      response_format: 'url',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`xAI 이미지 생성 실패 (${res.status}): ${text}`);
  }

  const json = await res.json();
  const item = json.data?.[0];
  if (!item) throw new Error('xAI 응답에 이미지가 없습니다: ' + JSON.stringify(json));

  let bytes;
  if (item.url) {
    const imgRes = await fetch(item.url);
    bytes = Buffer.from(await imgRes.arrayBuffer());
  } else if (item.b64_json) {
    bytes = Buffer.from(item.b64_json, 'base64');
  } else {
    throw new Error('xAI 응답에서 url/b64_json을 찾을 수 없습니다');
  }

  await fs.writeFile(outFile, bytes);
  return outFile;
}
