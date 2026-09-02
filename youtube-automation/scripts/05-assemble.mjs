// 5단계: 영상 클립/애니메이션 + 나레이션 + 자막 + 로고를 섹션별로 합성한 뒤
//        순서대로 이어붙여 최종 영상을 만듭니다.
// 사용법: node scripts/05-assemble.mjs <슬러그>
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../lib/config.mjs';
import {
  getDurationSeconds,
  kenBurnsClip,
  normalizeAndFitDuration,
  burnSubtitlesAndLogo,
  muxAudio,
  concatClips,
} from '../lib/ffmpeg.mjs';
import { ensureDirs, loadScript, fileExists, pad2, requireSlugArg } from '../lib/util.mjs';

export async function runStage(slug) {
  const p = await ensureDirs(slug);
  const script = await loadScript(slug);
  const tmpDir = path.join(p.base, 'tmp');
  const finalClipsDir = path.join(p.clipsDir, 'final');

  const defaultLogoPath = path.join(config.assetsDir, 'logo.png');
  const logoFile = (await fileExists(defaultLogoPath)) ? defaultLogoPath : null;

  const orderedFinalClips = [];

  for (const section of script.sections) {
    const idStr = pad2(section.id);
    const audioFile = path.join(p.audioDir, `section-${idStr}.mp3`);
    const clipFile = path.join(p.clipsDir, `section-${idStr}.mp4`);
    const imageFile = path.join(p.imagesDir, `section-${idStr}.jpg`);
    const srtFile = path.join(p.subtitlesDir, `section-${idStr}.srt`);
    const finalClip = path.join(finalClipsDir, `section-${idStr}.mp4`);

    if (!(await fileExists(audioFile))) {
      console.warn(`[section-${idStr}] 나레이션이 없어 건너뜁니다. (3단계 먼저 실행)`);
      continue;
    }
    if (!(await fileExists(srtFile))) {
      console.warn(`[section-${idStr}] 자막이 없어 건너뜁니다. (4단계 먼저 실행)`);
      continue;
    }

    const duration = await getDurationSeconds(audioFile);
    const normClip = path.join(tmpDir, `section-${idStr}.norm.mp4`);
    const styledClip = path.join(tmpDir, `section-${idStr}.styled.mp4`);

    if (await fileExists(clipFile)) {
      await normalizeAndFitDuration(clipFile, duration, normClip, {
        width: config.videoWidth,
        height: config.videoHeight,
      });
    } else if (await fileExists(imageFile)) {
      console.warn(`[section-${idStr}] 영상 클립이 없어 이미지로 즉석 Ken Burns 애니메이션을 만듭니다.`);
      await kenBurnsClip(imageFile, duration, normClip, { width: config.videoWidth, height: config.videoHeight });
    } else {
      console.warn(`[section-${idStr}] 이미지도, 영상도 없어 건너뜁니다.`);
      continue;
    }

    await burnSubtitlesAndLogo(normClip, srtFile, styledClip, { logoFile });
    await muxAudio(styledClip, audioFile, finalClip);

    orderedFinalClips.push(finalClip);
    console.log(`[section-${idStr}] 합성 완료 -> ${finalClip}`);
  }

  if (orderedFinalClips.length === 0) {
    throw new Error('합성할 섹션이 하나도 없습니다. 1~4단계가 모두 완료되었는지 확인하세요.');
  }

  const outFile = path.join(p.outputDir, `${slug}.mp4`);
  const listFile = path.join(tmpDir, 'concat-list.txt');
  await concatClips(orderedFinalClips, outFile, { listFile });

  console.log(`\n최종 영상 완성: ${outFile}`);
  return outFile;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStage(requireSlugArg()).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
