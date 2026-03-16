export type DensityLabel = 'Too short' | 'Balanced' | 'Dense' | 'Very dense';

export type FlowChunk = { id: string; text: string; start: number; width: number };

export type FlowLine = {
  id: string;
  text: string;
  chunks: FlowChunk[];
  wordCount: number;
  syllableCount: number;
  landingBeat: number;
  density: DensityLabel;
  note: string;
};

export function parseLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function estimateSyllables(word: string) {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!normalized) return 1;
  const matches = normalized.match(/[aeiouy]+/g);
  const count = matches?.length ?? 1;
  if (normalized.endsWith('e') && count > 1) return count - 1;
  return Math.max(1, count);
}

function buildChunks(words: string[]) {
  const chunks: { text: string; syllables: number }[] = [];
  let i = 0;
  while (i < words.length) {
    const current = words[i];
    const next = words[i + 1];
    const merge = next && current.length <= 3;
    const text = merge ? `${current} ${next}` : current;
    const syllables = estimateSyllables(current) + (merge ? estimateSyllables(next) : 0);
    chunks.push({ text, syllables });
    i += merge ? 2 : 1;
  }
  return chunks;
}

function classify(chunks: FlowChunk[], words: number) {
  const landingBeat = chunks.length ? 4 * (chunks[chunks.length - 1].start + chunks[chunks.length - 1].width) : 0;
  let density: DensityLabel = 'Balanced';
  if (landingBeat < 2.9) density = 'Too short';
  if (words > 14 || chunks.length > 10) density = 'Dense';
  if (words > 18 || chunks.length > 13 || landingBeat > 4) density = 'Very dense';

  let note = 'evenly distributed';
  const firstHalf = chunks.filter((chunk) => chunk.start < 0.5).length;
  if (landingBeat < 3) note = `dies near beat ${landingBeat.toFixed(1)}`;
  else if (landingBeat >= 3.7 && landingBeat <= 4.1) note = 'fills through beat 4';
  else if (landingBeat > 4.1) note = 'overflows bar length';
  else if (firstHalf > chunks.length * 0.7) note = 'front-loaded phrasing';

  return { density, note, landingBeat };
}

export function buildFlowLines(lines: string[]) {
  return lines.map((line, idx) => {
    const words = line.split(/\s+/).filter(Boolean);
    const base = buildChunks(words);
    const totalWeight = base.reduce((sum, item) => sum + item.syllables, 0) || 1;
    let cursor = 0;
    const chunks: FlowChunk[] = base.map((item, chunkIdx) => {
      const width = Math.max(0.05, item.syllables / totalWeight);
      const chunk = {
        id: `${idx}-${chunkIdx}`,
        text: item.text,
        start: cursor,
        width
      };
      cursor += width;
      return chunk;
    });

    const { density, note, landingBeat } = classify(chunks, words.length);

    return {
      id: `${idx}`,
      text: line,
      chunks,
      wordCount: words.length,
      syllableCount: words.reduce((sum, w) => sum + estimateSyllables(w), 0),
      density,
      landingBeat,
      note
    };
  });
}
