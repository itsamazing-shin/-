import fs from 'node:fs/promises';
import path from 'node:path';
import { projectPaths, config } from './config.mjs';

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export async function ensureDirs(slug) {
  const p = projectPaths(slug);
  for (const dir of [p.imagesDir, p.clipsDir, p.audioDir, p.subtitlesDir, p.outputDir, path.join(p.base, 'tmp'), path.join(p.clipsDir, 'final')]) {
    await fs.mkdir(dir, { recursive: true });
  }
  return p;
}

export async function loadScript(slug) {
  const p = projectPaths(slug);
  const raw = await fs.readFile(p.scriptFile, 'utf8');
  const script = JSON.parse(raw);
  script.sections.forEach((s, i) => {
    if (s.isVideo === undefined) s.isVideo = i < config.videoSectionCount;
  });
  return script;
}

export async function fileExists(f) {
  try {
    await fs.access(f);
    return true;
  } catch {
    return false;
  }
}

export function requireSlugArg() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('사용법: node scripts/<단계>.mjs <프로젝트-슬러그>');
    process.exit(1);
  }
  return slug;
}
