// ─── useVoiceRecorder ────────────────────────────────────────────────────────
// Canonical location: hooks/useVoiceRecorder.ts
// Real browser microphone recording using navigator.mediaDevices & MediaRecorder

import { useState, useRef, useCallback, useEffect } from "react";

export interface RecordedAudioItem {
  id: string;
  url: string;
  blob: Blob;
  durationSecs: number;
  timestamp: number;
}

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudioItem | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(24).fill(10));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [audioUrl]);

  // Live real-time audio visualization level meter
  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevels = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const levels = Array.from(dataArray.slice(0, 24)).map(
          (val) => Math.max(10, Math.round((val / 255) * 100))
        );
        setAudioLevels(levels);
        animFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();
    } catch {
      // Fallback if Web Audio context cannot initialize
    }
  };

  const startRecording = useCallback(async () => {
    setPermissionError(null);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordedAudio(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone recording is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalType = mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        const durationSecs = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        
        setAudioBlob(blob);
        setAudioUrl(url);
        setRecordedAudio({
          id: `voice-${Date.now()}`,
          url,
          blob,
          durationSecs,
          timestamp: Date.now(),
        });

        // Clean up tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close().catch(() => {});
        }
      };

      mediaRecorder.start(100);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordSeconds(0);

      startVisualizer(stream);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      const msg =
        err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
          ? "Microphone access was denied. Please allow microphone permissions."
          : err?.message || "Failed to start microphone recording.";
      setPermissionError(msg);
      setIsRecording(false);
    }
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return {
    isRecording,
    recordTime: formatTime(recordSeconds),
    recordSeconds,
    audioBlob,
    audioUrl,
    recordedAudio,
    permissionError,
    audioLevels,
    startRecording,
    stopRecording,
  };
};
