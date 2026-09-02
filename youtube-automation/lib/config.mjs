import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function projectDir(slug) {
  return path.join(ROOT, 'projects', slug);
}

export function projectPaths(slug) {
  const base = projectDir(slug);
  return {
    base,
    scriptFile: path.join(base, 'script.json'),
    imagesDir: path.join(base, 'images'),
    clipsDir: path.join(base, 'clips'),
    audioDir: path.join(base, 'audio'),
    subtitlesDir: path.join(base, 'subtitles'),
    outputDir: path.join(base, 'output'),
  };
}

export const config = {
  xaiApiKey: process.env.XAI_API_KEY,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID,
  higgsfieldApiKey: process.env.HIGGSFIELD_API_KEY,
  higgsfieldApiBase: process.env.HIGGSFIELD_API_BASE || 'https://api.higgsfield.ai',
  videoAspect: process.env.VIDEO_ASPECT || '16:9',
  videoWidth: Number(process.env.VIDEO_WIDTH || 1920),
  videoHeight: Number(process.env.VIDEO_HEIGHT || 1080),
  videoSectionCount: Number(process.env.VIDEO_SECTION_COUNT || 3),
  assetsDir: path.join(ROOT, 'assets'),
  root: ROOT,
};

export function requireEnv(keys) {
  const missing = keys.filter((k) => !config[k]);
  if (missing.length) {
    throw new Error(
      `다음 환경변수가 .env에 설정되지 않았습니다: ${missing.join(', ')}\n` +
        `youtube-automation/.env.example 을 복사해서 youtube-automation/.env 로 만들고 채워주세요.`
    );
  }
}
