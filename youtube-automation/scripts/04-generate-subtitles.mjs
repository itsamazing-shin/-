// 4단계: 3단계에서 받은 문자 단위 타임스탬프로 섹션별 SRT 자막 생성
// 사용법: node scripts/04-generate-subtitles.mjs <슬러그>
import fs from 'node:fs/promises';
import path from 'node:path';
import { alignmentToSrt } from '../lib/srt.mjs';
import { ensureDirs, loadScript, fileExists, pad2, requireSlugArg } from '../lib/util.mjs';

export async function runStage(slug) {
  const p = await ensureDirs(slug);
  const script = await loadScript(slug);

  for (const section of script.sections) {
    const idStr = pad2(section.id);
    const alignmentFile = path.join(p.audioDir, `section-${idStr}.alignment.json`);
    if (!(await fileExists(alignmentFile))) {
      console.warn(`[section-${idStr}] 타임스탬프가 없습니다. 3단계(나레이션 생성)를 먼저 실행하세요.`);
      continue;
    }
    const alignment = JSON.parse(await fs.readFile(alignmentFile, 'utf8'));
    const srt = alignmentToSrt(alignment);
    const outFile = path.join(p.subtitlesDir, `section-${idStr}.srt`);
    await fs.writeFile(outFile, srt, 'utf8');
    console.log(`[section-${idStr}] -> ${outFile}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStage(requireSlugArg()).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
