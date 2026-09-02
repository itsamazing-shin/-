// ElevenLabs TTS 클라이언트 (문자 단위 타임스탬프 포함)
// 문서: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
import fs from 'node:fs/promises';
import { config, requireEnv } from './config.mjs';

export async function generateNarration(text, { outAudioFile, outAlignmentFile, voiceId, modelId = 'eleven_multilingual_v2' }) {
  requireEnv(['elevenLabsApiKey']);
  const voice = voiceId || config.elevenLabsVoiceId;
  if (!voice) throw new Error('ELEVENLABS_VOICE_ID가 설정되지 않았습니다.');

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': config.elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs TTS 실패 (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const audioBuffer = Buffer.from(json.audio_base64, 'base64');
  await fs.writeFile(outAudioFile, audioBuffer);

  const alignment = json.alignment || json.normalized_alignment;
  await fs.writeFile(outAlignmentFile, JSON.stringify(alignment, null, 2));

  return { outAudioFile, outAlignmentFile, alignment };
}
