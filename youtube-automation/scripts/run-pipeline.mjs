// 전체 파이프라인을 순서대로 실행 (이미지 -> 클립 -> 나레이션 -> 자막 -> 조립 -> 썸네일)
// 사용법:
//   node scripts/run-pipeline.mjs <슬러그>              전체 실행
//   node scripts/run-pipeline.mjs <슬러그> --from 3      3단계부터 실행
//   node scripts/run-pipeline.mjs <슬러그> --only 5       5단계만 실행
import { requireSlugArg } from '../lib/util.mjs';
import { runStage as images } from './01-generate-images.mjs';
import { runStage as clips } from './02-generate-video-clips.mjs';
import { runStage as audio } from './03-generate-audio.mjs';
import { runStage as subtitles } from './04-generate-subtitles.mjs';
import { runStage as assemble } from './05-assemble.mjs';
import { runStage as thumbnail } from './06-generate-thumbnail.mjs';

const STAGES = [
  { n: 1, name: '이미지 생성', run: images },
  { n: 2, name: '영상 클립/애니메이션 생성', run: clips },
  { n: 3, name: '나레이션 생성', run: audio },
  { n: 4, name: '자막 생성', run: subtitles },
  { n: 5, name: '조립', run: assemble },
  { n: 6, name: '썸네일 생성', run: thumbnail },
];

async function main() {
  const slug = requireSlugArg();
  const args = process.argv.slice(3);

  const fromIdx = args.indexOf('--from');
  const onlyIdx = args.indexOf('--only');

  let stagesToRun = STAGES;
  if (onlyIdx !== -1) {
    const n = Number(args[onlyIdx + 1]);
    stagesToRun = STAGES.filter((s) => s.n === n);
  } else if (fromIdx !== -1) {
    const n = Number(args[fromIdx + 1]);
    stagesToRun = STAGES.filter((s) => s.n >= n);
  }

  for (const stage of stagesToRun) {
    console.log(`\n=== [${stage.n}단계] ${stage.name} ===`);
    await stage.run(slug);
  }

  console.log('\n파이프라인 완료.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
