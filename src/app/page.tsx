'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { WaveformPanel } from '@/components/WaveformPanel';
import { FlowBar } from '@/components/FlowBar';
import { analyzeAudio, bpmAlternatives, confidenceLabel } from '@/lib/audioAnalysis';
import { buildGrid } from '@/lib/beatGrid';
import { FlowChunk, buildFlowLines, parseLines } from '@/lib/lyrics';

type PersistedState = {
  lyrics: string;
  bpmOverride: string;
  downbeatOffset: number;
  subdivisions: 8 | 16 | 32;
  chunkEdits: Record<string, FlowChunk[]>;
};

const STORAGE_KEY = 'rap-flow-workbench-v1';

const initialState: PersistedState = {
  lyrics: '',
  bpmOverride: '',
  downbeatOffset: 0,
  subdivisions: 16,
  chunkEdits: {}
};

export default function Home() {
  const [fileError, setFileError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [beatType, setBeatType] = useState('other / unknown');
  const [state, setState] = useState<PersistedState>(initialState);
  const [playback, setPlayback] = useState({ time: 0, bar: 1, beat: 1 });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setState({ ...initialState, ...JSON.parse(raw) as PersistedState });
    } catch {
      setState(initialState);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const bpm = Number(state.bpmOverride) || detectedBpm || 90;

  const lines = useMemo(() => buildFlowLines(parseLines(state.lyrics)).map((line) => ({
    ...line,
    chunks: state.chunkEdits[line.id] ?? line.chunks
  })), [state.lyrics, state.chunkEdits]);

  const grid = useMemo(() => buildGrid(duration, bpm, state.downbeatOffset), [duration, bpm, state.downbeatOffset]);
  const barCount = Math.floor((duration - state.downbeatOffset) / ((60 / bpm) * 4));

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!(file.type.includes('mpeg') || file.type.includes('wav'))) {
      setFileError('Please upload an mp3 or wav file.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setFileError('Max file size is 100MB for MVP.');
      return;
    }
    const tempUrl = URL.createObjectURL(file);
    setAudioUrl(tempUrl);
    setFileError(null);

    const analysis = await analyzeAudio(file);
    if (analysis.duration > 600) {
      setFileError('Max duration is 10 minutes for MVP.');
      setAudioUrl(null);
      return;
    }

    setDetectedBpm(analysis.bpm);
    setConfidence(analysis.confidence);
    setBeatType(analysis.beatType);
    setDuration(analysis.duration);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-5">
      <h1 className="text-2xl font-bold">Rap Flow Workbench</h1>

      <section className="rounded-lg border border-border bg-panel p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Top Panel · Beat analysis</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="rounded border border-border p-2 text-sm">
            Upload beat (mp3/wav)
            <input type="file" accept="audio/mp3,audio/wav,audio/mpeg" onChange={onUpload} className="mt-2 block w-full text-xs" />
          </label>
          <div className="rounded border border-border p-2 text-sm">BPM: <strong>{bpm.toFixed(0)}</strong></div>
          <div className="rounded border border-border p-2 text-sm">
            Confidence: <strong>{confidenceLabel(confidence)}</strong> ({Math.round(confidence * 100)}%)
          </div>
          <div className="rounded border border-border p-2 text-sm">Beat type: <strong>likely {beatType}</strong></div>
          <div className="rounded border border-border p-2 text-sm">Bars (approx): <strong>{Math.max(0, barCount)}</strong></div>
        </div>
        {bpmAlternatives(bpm, confidence).length > 0 && (
          <p className="mt-2 text-xs text-white/70">Alternatives: {bpmAlternatives(bpm, confidence).join(' / ')}</p>
        )}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">Manual BPM override
            <input
              type="number"
              value={state.bpmOverride}
              onChange={(e) => setState((prev) => ({ ...prev, bpmOverride: e.target.value }))}
              className="mt-1 w-full rounded border border-border bg-slate-900 px-2 py-1"
            />
          </label>
          <label className="text-sm">Downbeat offset (seconds)
            <input
              type="number"
              step="0.01"
              value={state.downbeatOffset}
              onChange={(e) => setState((prev) => ({ ...prev, downbeatOffset: Number(e.target.value) }))}
              className="mt-1 w-full rounded border border-border bg-slate-900 px-2 py-1"
            />
          </label>
        </div>
        {fileError && <p className="mt-2 text-sm text-rose-300">{fileError}</p>}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Middle Panel · Waveform + beat grid</h2>
        <WaveformPanel
          audioUrl={audioUrl}
          markers={grid}
          bpm={bpm}
          downbeatOffset={state.downbeatOffset}
          onTimeUpdate={(time, bar, beatInBar) => setPlayback({ time, bar, beat: beatInBar })}
        />
        <p className="mt-2 text-sm text-white/80">Current bar: <strong>{playback.bar}</strong> · Beat: <strong>{playback.beat}</strong> · Time: {playback.time.toFixed(2)}s</p>
      </section>

      <section className="rounded-lg border border-border bg-panel p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Bottom Panel · Lyrics + flow map</h2>
        <label className="mb-3 block text-sm">Lyrics (one line = one bar)
          <textarea
            rows={6}
            value={state.lyrics}
            onChange={(e) => setState((prev) => ({ ...prev, lyrics: e.target.value }))}
            placeholder="Started from nothing, first day, I'm a beginner"
            className="mt-1 w-full rounded border border-border bg-slate-900 p-2"
          />
        </label>
        <div className="mb-3 flex items-center gap-3 text-sm">
          <span>Subdivision</span>
          {[8, 16, 32].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setState((prev) => ({ ...prev, subdivisions: value as 8 | 16 | 32 }))}
              className={`rounded border px-2 py-1 ${state.subdivisions === value ? 'border-accent bg-accent/20' : 'border-border'}`}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {lines.map((line) => (
            <FlowBar
              key={line.id}
              line={line}
              subdivisions={state.subdivisions}
              onMoveChunk={(lineId, chunkId, start) => {
                setState((prev) => {
                  const source = prev.chunkEdits[lineId] ?? lines.find((item) => item.id === lineId)?.chunks ?? [];
                  const next = source.map((chunk) => chunk.id === chunkId ? { ...chunk, start } : chunk);
                  return { ...prev, chunkEdits: { ...prev.chunkEdits, [lineId]: next } };
                });
              }}
              onReset={(lineId) => {
                setState((prev) => {
                  const next = { ...prev.chunkEdits };
                  delete next[lineId];
                  return { ...prev, chunkEdits: next };
                });
              }}
            />
          ))}
        </div>
      </section>

      <p className="pb-8 text-xs text-white/60">
        Known limits: BPM and downbeat can miss weak intros, beat type is approximate, and text chunk flow is only an estimate of performance.
      </p>
    </main>
  );
}
