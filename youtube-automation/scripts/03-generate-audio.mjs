// 3단계: ElevenLabs로 섹션별 나레이션 음성 + 타임스탬프 생성
// 사용법: node scripts/03-generate-audio.mjs <슬러그>
import path from 'node:path';
import { generateNarration } from '../lib/elevenlabs.mjs';
import { ensureDirs, loadScript, fileExists, pad2, requireSlugArg } from '../lib/util.mjs';

export async function runStage(slug) {
  const p = await ensureDirs(slug);
  const script = await loadScript(slug);

  for (const section of script.sections) {
    const idStr = pad2(section.id);
    if (!section.text) {
      console.warn(`[section-${idStr}] text가 비어있어 건너뜁니다.`);
      continue;
    }
    const outAudioFile = path.join(p.audioDir, `section-${idStr}.mp3`);
    const outAlignmentFile = path.join(p.audioDir, `section-${idStr}.alignment.json`);
    if (await fileExists(outAudioFile)) {
      console.log(`[section-${idStr}] 이미 존재함, 건너뜀`);
      continue;
    }
    console.log(`[section-${idStr}] 나레이션 생성 중...`);
    await generateNarration(section.text, { outAudioFile, outAlignmentFile });
    console.log(`[section-${idStr}] -> ${outAudioFile}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStage(requireSlugArg()).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
