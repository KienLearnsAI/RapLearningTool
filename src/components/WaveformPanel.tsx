'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { GridMarker, getPlaybackPosition } from '@/lib/beatGrid';

type Props = {
  audioUrl: string | null;
  markers: GridMarker[];
  bpm: number;
  downbeatOffset: number;
  onTimeUpdate: (time: number, bar: number, beatInBar: number) => void;
};

export function WaveformPanel({ audioUrl, markers, bpm, downbeatOffset, onTimeUpdate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    wsRef.current?.destroy();
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#37517f',
      progressColor: '#6cb8ff',
      cursorColor: '#f7f8fa',
      height: 160,
      barWidth: 2,
      normalize: true
    });
    ws.load(audioUrl);

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('timeupdate', (currentTime) => {
      const pos = getPlaybackPosition(currentTime, bpm, downbeatOffset);
      onTimeUpdate(currentTime, pos.bar, pos.beatInBar);
    });

    wsRef.current = ws;
    return () => ws.destroy();
  }, [audioUrl, bpm, downbeatOffset, onTimeUpdate]);

  const markerPositions = useMemo(() => {
    if (!wsRef.current) return [];
    const duration = wsRef.current.getDuration() || 1;
    return markers.map((m) => ({ ...m, left: `${(m.time / duration) * 100}%` }));
  }, [markers, audioUrl]);

  return (
    <div className="rounded-lg border border-border bg-panel p-3">
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => wsRef.current?.playPause()}
          disabled={!audioUrl}
          className="rounded bg-accent px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      <div className="relative">
        <div ref={containerRef} className="w-full" />
        <div className="pointer-events-none absolute inset-0">
          {markerPositions.map((m) => (
            <div
              key={`${m.type}-${m.index}`}
              className={`absolute top-0 h-full ${m.type === 'bar' ? 'w-[2px] bg-white/70' : 'w-px bg-white/20'}`}
              style={{ left: m.left }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
