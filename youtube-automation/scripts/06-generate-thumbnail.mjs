// 6단계: 썸네일 이미지 생성 (Grok) + 제목 텍스트 오버레이
// 사용법: node scripts/06-generate-thumbnail.mjs <슬러그>
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { generateImage } from '../lib/xai.mjs';
import { ensureDirs, loadScript, fileExists, requireSlugArg } from '../lib/util.mjs';

const execFileP = promisify(execFile);

export async function runStage(slug) {
  const p = await ensureDirs(slug);
  const script = await loadScript(slug);

  if (!script.thumbnailPrompt) {
    console.warn('script.json의 thumbnailPrompt가 비어있습니다. 건너뜁니다.');
    return;
  }

  const rawFile = path.join(p.outputDir, 'thumbnail-raw.jpg');
  if (!(await fileExists(rawFile))) {
    console.log('썸네일 원본 이미지 생성 중...');
    await generateImage(script.thumbnailPrompt, rawFile);
  }

  const outFile = path.join(p.outputDir, 'thumbnail.jpg');
  const title = (script.title || '').replace(/'/g, "\\'").replace(/:/g, '\\:');

  const drawtext = title
    ? `drawtext=text='${title}':fontcolor=white:fontsize=64:box=1:boxcolor=black@0.5:boxborderw=20:x=(w-text_w)/2:y=h-th-80`
    : null;

  await execFileP('ffmpeg', [
    '-y',
    '-i', rawFile,
    '-vf', drawtext ? `scale=1280:720,${drawtext}` : 'scale=1280:720',
    outFile,
  ]);

  console.log(`썸네일 완성: ${outFile}`);
  return outFile;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStage(requireSlugArg()).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
