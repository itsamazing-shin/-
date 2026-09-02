// ElevenLabs의 문자 단위 타임스탬프(alignment)를 SRT 자막으로 변환
function pad(n, len) {
  return String(n).padStart(len, '0');
}

function formatSrtTime(seconds) {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msRem = ms % 1000;
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(msRem, 3)}`;
}

export function alignmentToSrt(alignment, { maxCharsPerLine = 42, maxCueSeconds = 6, startOffsetSeconds = 0 } = {}) {
  const characters = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;

  const cues = [];
  let curText = '';
  let curStart = null;

  const pushCue = (endTime) => {
    if (curText.trim().length === 0) {
      curText = '';
      curStart = null;
      return;
    }
    cues.push({
      start: curStart + startOffsetSeconds,
      end: endTime + startOffsetSeconds,
      text: curText.trim(),
    });
    curText = '';
    curStart = null;
  };

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];
    if (curStart === null) curStart = starts[i];
    curText += ch;

    const atBreak = ch === ' ' || ch === '\n';
    const tooLong = curText.length >= maxCharsPerLine;
    const tooLongDuration = ends[i] - curStart >= maxCueSeconds;
    const isLast = i === characters.length - 1;

    if (isLast) {
      pushCue(ends[i]);
    } else if ((tooLong || tooLongDuration) && atBreak) {
      pushCue(ends[i]);
    }
  }

  return cues
    .map((cue, idx) => `${idx + 1}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}\n${cue.text}\n`)
    .join('\n');
}
