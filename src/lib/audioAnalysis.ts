export type BeatType = 'boom bap' | 'trap' | 'drill-like' | 'melodic / slow groove' | 'other / unknown';

export type AnalysisResult = {
  bpm: number;
  bpmPrecise: number;
  confidence: number;
  beatType: BeatType;
  duration: number;
};

const MIN_BPM = 60;
const MAX_BPM = 200;

function envelopeFromChannel(data: Float32Array, sampleRate: number) {
  const frameSize = 1024;
  const hop = 512;
  const envelope: number[] = [];
  for (let i = 0; i + frameSize < data.length; i += hop) {
    let sum = 0;
    for (let j = 0; j < frameSize; j += 1) {
      const v = data[i + j];
      sum += v * v;
    }
    envelope.push(Math.sqrt(sum / frameSize));
  }
  const frameRate = sampleRate / hop;
  return { envelope, frameRate };
}

function autocorrelate(envelope: number[], frameRate: number) {
  const minLag = Math.floor((60 / MAX_BPM) * frameRate);
  const maxLag = Math.floor((60 / MIN_BPM) * frameRate);
  let bestLag = minLag;
  let bestCorr = -Infinity;
  let secondCorr = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let corr = 0;
    for (let i = lag; i < envelope.length; i += 1) {
      corr += envelope[i] * envelope[i - lag];
    }
    if (corr > bestCorr) {
      secondCorr = bestCorr;
      bestCorr = corr;
      bestLag = lag;
    } else if (corr > secondCorr) {
      secondCorr = corr;
    }
  }

  const bpmPrecise = 60 / (bestLag / frameRate);
  const confidence = bestCorr > 0 ? Math.max(0.2, Math.min(0.99, 1 - secondCorr / bestCorr)) : 0.25;

  return { bpmPrecise, confidence };
}

function estimateBeatType(bpm: number, channel: Float32Array): BeatType {
  let highEnergy = 0;
  let lowEnergy = 0;
  const step = 512;
  for (let i = 0; i < channel.length; i += step) {
    const v = Math.abs(channel[i]);
    if (i % 2048 < 512) lowEnergy += v;
    else highEnergy += v;
  }

  const energyRatio = highEnergy / Math.max(0.0001, lowEnergy);

  if (bpm < 78) return 'melodic / slow groove';
  if (bpm >= 78 && bpm <= 100) return 'boom bap';
  if (bpm > 140 && energyRatio > 1.1) return 'drill-like';
  if (bpm >= 120) return 'trap';
  return 'other / unknown';
}

export function confidenceLabel(confidence: number) {
  if (confidence >= 0.72) return 'High';
  if (confidence >= 0.45) return 'Medium';
  return 'Low';
}

export function bpmAlternatives(bpm: number, confidence: number) {
  if (confidence > 0.58) return [] as number[];
  return [Math.round(bpm * 2), Number((bpm / 2).toFixed(1))];
}

export async function analyzeAudio(file: File): Promise<AnalysisResult> {
  const arrayBuffer = await file.arrayBuffer();
  const context = new AudioContext();
  const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
  const channel = decoded.getChannelData(0);
  const { envelope, frameRate } = envelopeFromChannel(channel, decoded.sampleRate);
  const { bpmPrecise, confidence } = autocorrelate(envelope, frameRate);
  const bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(bpmPrecise)));

  return {
    bpm,
    bpmPrecise,
    confidence,
    beatType: estimateBeatType(bpm, channel),
    duration: decoded.duration
  };
}
