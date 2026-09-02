// 1단계: 각 섹션의 imagePrompt로 Grok(xAI) 이미지 생성
// 사용법: node scripts/01-generate-images.mjs <슬러그>
import path from 'node:path';
import { generateImage } from '../lib/xai.mjs';
import { ensureDirs, loadScript, fileExists, pad2, requireSlugArg } from '../lib/util.mjs';

export async function runStage(slug) {
  const p = await ensureDirs(slug);
  const script = await loadScript(slug);

  for (const section of script.sections) {
    if (!section.imagePrompt) {
      console.warn(`[section-${pad2(section.id)}] imagePrompt가 비어있어 건너뜁니다.`);
      continue;
    }
    const outFile = path.join(p.imagesDir, `section-${pad2(section.id)}.jpg`);
    if (await fileExists(outFile)) {
      console.log(`[section-${pad2(section.id)}] 이미 존재함, 건너뜀`);
      continue;
    }
    console.log(`[section-${pad2(section.id)}] 이미지 생성 중...`);
    await generateImage(section.imagePrompt, outFile);
    console.log(`[section-${pad2(section.id)}] -> ${outFile}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStage(requireSlugArg()).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
