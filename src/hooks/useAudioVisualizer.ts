import { useRef, useCallback } from 'react';
import { useProjectionStore } from '../store/projection-store';

export interface UseAudioVisualizerResult {
  startVisualizer: (deviceIdOverride?: string) => Promise<void>;
  stopVisualizer: () => void;
  mediaStreamRef: React.MutableRefObject<MediaStream | null>;
}

/**
 * Hook to capture microphone/mixer audio and compute FFT frequency waveform
 * bars (18 bars, scaled 10-100) for the live audio visualizer indicator.
 * Includes timeout protection and throttled rendering (~24fps) to eliminate CPU lag.
 */
export function useAudioVisualizer(): UseAudioVisualizerResult {
  const setAudioBars = useProjectionStore((s) => s.setAudioBars);
  const selectedAudioDeviceId = useProjectionStore((s) => s.selectedAudioDeviceId);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startVisualizer = useCallback(async (deviceIdOverride?: string) => {
    try {
      // 1. Clean up previous stream and loop if running
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          await audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return;
      }

      const devId = deviceIdOverride || selectedAudioDeviceId;
      // Use "ideal" instead of "exact" constraint so browser doesn't block on stale device IDs
      const constraints: MediaStreamConstraints = {
        audio: devId
          ? {
              deviceId: { ideal: devId },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }
          : true,
      };

      // 2. Safe getUserMedia with a 2-second timeout protection
      const getStreamWithTimeout = async (cfg: MediaStreamConstraints): Promise<MediaStream> => {
        const streamPromise = navigator.mediaDevices.getUserMedia(cfg);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Audio device acquisition timed out')), 2000)
        );
        return Promise.race([streamPromise, timeoutPromise]);
      };

      let stream: MediaStream;
      try {
        stream = await getStreamWithTimeout(constraints);
      } catch {
        // Fallback to default system audio if specific deviceId failed or timed out
        stream = await getStreamWithTimeout({ audio: true });
      }

      mediaStreamRef.current = stream;

      // 3. Initialize AudioContext & AnalyserNode
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch {}
      }
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastFrameTime = 0;

      // 4. Throttled animation loop (~24fps / every 42ms) to prevent CPU and React thrashing
      const updateWaveform = (now: number) => {
        if (!analyserRef.current) return;

        if (now - lastFrameTime >= 42) {
          lastFrameTime = now;
          analyserRef.current.getByteFrequencyData(dataArray);
          const bars = Array.from({ length: 18 }, (_, i) => {
            const val = dataArray[i] || 0;
            return Math.max(10, Math.min(100, Math.round((val / 255) * 100)));
          });
          setAudioBars(bars);
        }

        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      animFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch {
      // Audio capture permission denied, unavailable, or dismissed
    }
  }, [selectedAudioDeviceId, setAudioBars]);

  const stopVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioBars(new Array(18).fill(10));
  }, [setAudioBars]);

  return { startVisualizer, stopVisualizer, mediaStreamRef };
}
