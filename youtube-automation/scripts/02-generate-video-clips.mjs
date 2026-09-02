// 2단계: 앞 N개 섹션은 대본에 맞는 영상 프롬프트로 이미지→영상 변환,
//        나머지 섹션은 은은한 팬/줌 애니메이션 영상으로 변환 (기본: Higgsfield 사용)
// Higgsfield API 키가 없거나 호출이 실패하면 로컬 ffmpeg Ken Burns 효과로 자동 대체합니다.
// 사용법: node scripts/02-generate-video-clips.mjs <슬러그>
import path from 'node:path';
import { config } from '../lib/config.mjs';
import { imageToVideo, animateImage } from '../lib/higgsfield.mjs';
import { kenBurnsClip } from '../lib/ffmpeg.mjs';
import { ensureDirs, loadScript, fileExists, pad2, requireSlugArg } from '../lib/util.mjs';

export async function runStage(slug) {
  const p = await ensureDirs(slug);
  const script = await loadScript(slug);

  for (const section of script.sections) {
    const idStr = pad2(section.id);
    const outFile = path.join(p.clipsDir, `section-${idStr}.mp4`);
    if (await fileExists(outFile)) {
      console.log(`[section-${idStr}] 이미 존재함, 건너뜀`);
      continue;
    }

    const imageFile = path.join(p.imagesDir, `section-${idStr}.jpg`);
    if (!(await fileExists(imageFile))) {
      console.warn(`[section-${idStr}] 이미지가 없습니다. 1단계(이미지 생성)를 먼저 실행하세요.`);
      continue;
    }

    const duration = section.estimatedSeconds || (section.isVideo ? 6 : 5);

    try {
      if (!config.higgsfieldApiKey) throw new Error('HIGGSFIELD_API_KEY 미설정');

      if (section.isVideo) {
        if (!section.videoPrompt) {
          console.warn(`[section-${idStr}] videoPrompt가 비어있어 애니메이션으로 대체합니다.`);
          await animateImage(imageFile, outFile, { durationSeconds: duration });
        } else {
          console.log(`[section-${idStr}] Higgsfield 영상 생성 중 (핵심 섹션)...`);
          await imageToVideo(imageFile, section.videoPrompt, outFile, { durationSeconds: duration });
        }
      } else {
        console.log(`[section-${idStr}] Higgsfield 애니메이션 생성 중...`);
        await animateImage(imageFile, outFile, { durationSeconds: duration });
      }
    } catch (err) {
      console.warn(`[section-${idStr}] Higgsfield 실패(${err.message}), 로컬 Ken Burns 효과로 대체합니다.`);
      await kenBurnsClip(imageFile, duration, outFile, { width: config.videoWidth, height: config.videoHeight });
    }

    console.log(`[section-${idStr}] -> ${outFile}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStage(requireSlugArg()).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
