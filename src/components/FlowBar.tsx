'use client';

import { FlowLine } from '@/lib/lyrics';

type Props = {
  line: FlowLine;
  subdivisions: 8 | 16 | 32;
  onMoveChunk: (lineId: string, chunkId: string, start: number) => void;
  onReset: (lineId: string) => void;
};

const densityColor: Record<FlowLine['density'], string> = {
  'Too short': 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
  Balanced: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
  Dense: 'bg-orange-500/20 text-orange-200 border-orange-500/40',
  'Very dense': 'bg-rose-500/20 text-rose-200 border-rose-500/40'
};

export function FlowBar({ line, subdivisions, onMoveChunk, onReset }: Props) {
  const step = 1 / subdivisions;

  return (
    <div className="rounded-lg border border-border bg-panel p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <p className="text-slate-300">{line.text}</p>
        <button type="button" onClick={() => onReset(line.id)} className="rounded border border-border px-2 py-1 hover:bg-white/5">
          Reset
        </button>
      </div>
      <div className="mb-2 grid grid-cols-4 gap-1 text-[10px] text-white/60">
        {[1, 2, 3, 4].map((beat) => (
          <div key={beat} className="border-l border-white/20 pl-1">Beat {beat}</div>
        ))}
      </div>
      <div className="relative h-16 rounded border border-white/15 bg-slate-950/50">
        {Array.from({ length: subdivisions - 1 }).map((_, idx) => (
          <div
            key={idx}
            className={`absolute top-0 h-full ${((idx + 1) % (subdivisions / 4) === 0) ? 'w-px bg-white/15' : 'w-px bg-white/5'}`}
            style={{ left: `${((idx + 1) / subdivisions) * 100}%` }}
          />
        ))}
        {line.chunks.map((chunk, idx) => (
          <div
            key={chunk.id}
            draggable
            onDragEnd={(event) => {
              const parent = event.currentTarget.parentElement?.getBoundingClientRect();
              if (!parent) return;
              const raw = (event.clientX - parent.left) / parent.width;
              const snapped = Math.round(raw / step) * step;
              onMoveChunk(line.id, chunk.id, Math.max(0, Math.min(1 - chunk.width, snapped)));
            }}
            className="absolute top-2 h-10 cursor-grab rounded bg-accent/70 px-1 text-[10px] text-slate-950 shadow"
            style={{ left: `${chunk.start * 100}%`, width: `${chunk.width * 100}%` }}
            title={chunk.text}
          >
            <span className="line-clamp-2">{chunk.text}</span>
            {idx === line.chunks.length - 1 && <div className="absolute -right-1 top-0 h-10 w-[2px] bg-white" />}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={`rounded border px-2 py-1 ${densityColor[line.density]}`}>{line.density}</span>
        <span className="text-white/70">{line.note} · {line.syllableCount} syllables</span>
      </div>
    </div>
  );
}
