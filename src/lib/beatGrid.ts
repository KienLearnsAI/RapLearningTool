export type GridMarker = { time: number; type: 'beat' | 'bar'; index: number };

export function buildGrid(duration: number, bpm: number, downbeatOffset = 0) {
  const beatDur = 60 / bpm;
  const markers: GridMarker[] = [];
  let beatIndex = 0;
  for (let t = downbeatOffset; t <= duration; t += beatDur) {
    const normalized = Number(t.toFixed(4));
    if (normalized < 0) continue;
    const isBar = beatIndex % 4 === 0;
    markers.push({ time: normalized, type: isBar ? 'bar' : 'beat', index: beatIndex });
    beatIndex += 1;
  }
  return markers;
}

export function getPlaybackPosition(currentTime: number, bpm: number, downbeatOffset = 0) {
  const beatDur = 60 / bpm;
  const beatsSinceDownbeat = Math.max(0, (currentTime - downbeatOffset) / beatDur);
  const beatIndex = Math.floor(beatsSinceDownbeat);
  return {
    bar: Math.floor(beatIndex / 4) + 1,
    beatInBar: (beatIndex % 4) + 1,
    beatProgress: beatsSinceDownbeat - beatIndex
  };
}
