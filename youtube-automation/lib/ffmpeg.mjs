// ffmpeg / ffprobe 실행 헬퍼
// 사전 조건: 시스템에 ffmpeg, ffprobe 가 설치되어 PATH에 있어야 합니다.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';

const execFileP = promisify(execFile);

async function run(cmd, args) {
  try {
    return await execFileP(cmd, args, { maxBuffer: 1024 * 1024 * 64 });
  } catch (err) {
    throw new Error(`${cmd} 실행 실패\n명령: ${cmd} ${args.join(' ')}\n${err.stderr || err.message}`);
  }
}

export async function getDurationSeconds(mediaFile) {
  const { stdout } = await run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    mediaFile,
  ]);
  return parseFloat(stdout.trim());
}

// 정지 이미지를 지정한 길이만큼 은은한 줌인 애니메이션 영상으로 변환 (Ken Burns 효과)
// Higgsfield 없이도 파이프라인이 동작하도록 하는 로컬 대체 수단으로도 사용됩니다.
export async function kenBurnsClip(imageFile, seconds, outFile, { width = 1920, height = 1080, fps = 30 } = {}) {
  const frames = Math.max(1, Math.round(seconds * fps));
  const zoomExpr = `min(zoom+0.0008,1.15)`;
  await run('ffmpeg', [
    '-y',
    '-loop', '1',
    '-i', imageFile,
    '-vf',
    `scale=${width * 2}:${height * 2},zoompan=z='${zoomExpr}':d=${frames}:s=${width}x${height}:fps=${fps},format=yuv420p`,
    '-t', String(seconds),
    '-an',
    outFile,
  ]);
  return outFile;
}

// 임의의 입력 영상을 목표 해상도/fps로 맞추고, 목표 길이에 맞춰 트림하거나 필요시 루프
export async function normalizeAndFitDuration(inputFile, targetSeconds, outFile, { width = 1920, height = 1080, fps = 30 } = {}) {
  const srcDuration = await getDurationSeconds(inputFile);
  const needsLoop = srcDuration < targetSeconds;

  const args = ['-y'];
  if (needsLoop) {
    const loops = Math.ceil(targetSeconds / srcDuration);
    args.push('-stream_loop', String(loops - 1));
  }
  args.push(
    '-i', inputFile,
    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}`,
    '-t', String(targetSeconds),
    '-an',
    outFile,
  );
  await run('ffmpeg', args);
  return outFile;
}

// SRT 자막 번인 + (선택) 로고 오버레이
export async function burnSubtitlesAndLogo(inputVideo, srtFile, outFile, { logoFile } = {}) {
  const escapedSrt = srtFile.replace(/:/g, '\\:').replace(/'/g, "\\'");

  if (logoFile) {
    await run('ffmpeg', [
      '-y',
      '-i', inputVideo,
      '-i', logoFile,
      '-filter_complex',
      `[0:v]subtitles='${escapedSrt}':force_style='FontName=Malgun Gothic,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0'[sub];` +
      `[1:v]scale=180:-1[logo];` +
      `[sub][logo]overlay=W-w-30:30`,
      '-an',
      outFile,
    ]);
  } else {
    await run('ffmpeg', [
      '-y',
      '-i', inputVideo,
      '-vf',
      `subtitles='${escapedSrt}':force_style='FontName=Malgun Gothic,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0'`,
      '-an',
      outFile,
    ]);
  }
  return outFile;
}

// 무음 영상 + 나레이션 오디오 합치기 (오디오 길이 기준으로 자름)
export async function muxAudio(silentVideo, audioFile, outFile) {
  await run('ffmpeg', [
    '-y',
    '-i', silentVideo,
    '-i', audioFile,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-shortest',
    outFile,
  ]);
  return outFile;
}

// concat demuxer로 섹션 클립들을 순서대로 이어 붙이기 (모두 동일 코덱/해상도/fps 여야 함)
export async function concatClips(clipFiles, outFile, { listFile }) {
  const listContent = clipFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
  await fs.writeFile(listFile, listContent, 'utf8');

  await run('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listFile,
    '-c', 'copy',
    outFile,
  ]);
  return outFile;
}
