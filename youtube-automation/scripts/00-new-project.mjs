// 새 프로젝트(영상 1편) 스캐폴딩 생성
// 사용법: node scripts/00-new-project.mjs <슬러그> <섹션수(기본 24)>
import fs from 'node:fs/promises';
import { config, projectPaths } from '../lib/config.mjs';
import { ensureDirs } from '../lib/util.mjs';

async function main() {
  const slug = process.argv[2];
  const sectionCount = Number(process.argv[3] || 24);
  if (!slug) {
    console.error('사용법: node scripts/00-new-project.mjs <슬러그> <섹션수(기본 24)>');
    process.exit(1);
  }

  const p = await ensureDirs(slug);

  const sections = Array.from({ length: sectionCount }, (_, i) => ({
    id: i + 1,
    isVideo: i < config.videoSectionCount,
    text: '',
    imagePrompt: '',
    videoPrompt: i < config.videoSectionCount ? '' : undefined,
    estimatedSeconds: i < config.videoSectionCount ? 6 : 5,
  }));

  const scriptJson = {
    title: '',
    thumbnailPrompt: '',
    sections,
  };

  await fs.writeFile(projectPaths(slug).scriptFile, JSON.stringify(scriptJson, null, 2), 'utf8');
  console.log(`생성됨: ${p.scriptFile}`);
  console.log(`섹션 ${sectionCount}개 스켈레톤이 만들어졌습니다. 각 섹션의 text / imagePrompt / videoPrompt를 채워주세요.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
