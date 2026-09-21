import React from "react";
import {
  Sparkles,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Layers,
  Play,
  Pause,
  Square,
  Mic,
  MessageSquare,
  Volume2,
  Palette,
  Video,
  Clock,
  Wand2,
  Bot,
  Check,
  MoreVertical,
  Copy,
  Trash2,
} from "lucide-react";
import { GeneratedPanel } from "@/types";
import { getPanelFilterStyle } from "@/utils";
import { generateTts } from "@/api";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";
import { PanelAnalyzingOverlay } from "@/shared/ui/loading/PanelAnalyzingOverlay";

let autoPlayHintShown = false;

interface StoryboardCardProps {
  panel: GeneratedPanel;
  idx: number;
  currentPanelIndex: number;
  activePreviewTab: "video" | "timeline";
  setCurrentPanelIndex: (idx: number) => void;
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  setPlaybackTime: (time: number) => void;
  analyzingPanelId: number | string | null;
  isAnalyzingAll?: boolean;
  handleShiftPanel: (idx: number, dir: "left" | "right") => void;
  panelsLength: number;
  handleModifySpeechText: (id: any, val: string) => void;
  handleModifyMotion: (id: any, val: string) => void;
  handleModifyDuration: (id: any, val: number) => void;
  handleModifySFX: (id: any, val: string) => void;
  handleModifyVisualDescription: (id: any, val: string) => void;
  handleModifyNarrative?: (id: any, val: string) => void;
  handleAnalyzePanel: (id: any, url: string) => void;
  handleCancelAnalysis?: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  onPanelClick?: (
    idx: number,
    panelId: any,
    shiftKey: boolean,
    ctrlOrMeta: boolean
  ) => void;
  onPanelDoubleClick?: (idx: number, panelId: any) => void;
  playStoryboardAudio?: (idx: number, forcePlay?: boolean) => void;
  autoPlayAudio?: boolean;
  addNotification?: (message: string, type: any) => void;
  setPanels?: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  fetchWithInterceptor?: any;
  voiceActor?: string;
  speechRate?: number;
  speechPitch?: number;
  viewLayout?: "scroll" | "grid";
}

interface DialogueClipSliderProps {
  panel: GeneratedPanel;
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
}

const DialogueClipSlider: React.FC<DialogueClipSliderProps> = ({
  panel,
  setPanels,
}) => {
  const duration = panel.duration || 3.0;

  const dialogueMap = panel.syncMap?.dialogue_map || [];
  const currentSegment = dialogueMap[0] || {
    ocr_index: 0,
    ocr_text: panel.speech_text || "",
    whisper_text: panel.speech_text || "",
    start_time: 0.0,
    end_time: duration,
    confidence: 1.0,
  };

  const startTime = currentSegment.start_time;
  const endTime = currentSegment.end_time;

  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = React.useState<{
    type: "center" | "left" | "right" | null;
    startX: number;
    initialStart: number;
    initialEnd: number;
  }>({ type: null, startX: 0, initialStart: 0, initialEnd: 0 });

  const handleMouseDown = (
    e: React.MouseEvent,
    type: "center" | "left" | "right"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setDragState({
      type,
      startX: e.clientX,
      initialStart: startTime,
      initialEnd: endTime,
    });
  };

  React.useEffect(() => {
    if (!dragState.type) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const trackWidth = rect.width;
      if (trackWidth <= 0) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaT = (deltaX / trackWidth) * duration;

      let newStart = dragState.initialStart;
      let newEnd = dragState.initialEnd;

      if (dragState.type === "center") {
        const clipDuration = dragState.initialEnd - dragState.initialStart;
        newStart = Math.max(
          0,
          Math.min(duration - clipDuration, dragState.initialStart + deltaT)
        );
        newEnd = newStart + clipDuration;
      } else if (dragState.type === "left") {
        newStart = Math.max(
          0,
          Math.min(dragState.initialEnd - 0.1, dragState.initialStart + deltaT)
        );
      } else if (dragState.type === "right") {
        newEnd = Math.max(
          dragState.initialStart + 0.1,
          Math.min(duration, dragState.initialEnd + deltaT)
        );
      }

      setPanels((prev) =>
        prev.map((p) => {
          if (p.id !== panel.id) return p;

          const currentSyncMap = p.syncMap || {
            dialogue_map: [],
            audio_peaks: [],
          };
          const currentMap = currentSyncMap.dialogue_map || [];

          let updatedMap = [...currentMap];
          if (updatedMap.length === 0) {
            updatedMap = [
              {
                ocr_index: 0,
                ocr_text: p.speech_text || "",
                whisper_text: p.speech_text || "",
                start_time: Number(newStart.toFixed(2)),
                end_time: Number(newEnd.toFixed(2)),
                confidence: 1.0,
              },
            ];
          } else {
            updatedMap[0] = {
              ...updatedMap[0],
              start_time: Number(newStart.toFixed(2)),
              end_time: Number(newEnd.toFixed(2)),
            };
          }

          return {
            ...p,
            syncMap: {
              ...currentSyncMap,
              dialogue_map: updatedMap,
            },
          };
        })
      );
    };

    const handleMouseUp = () => {
      setDragState({ type: null, startX: 0, initialStart: 0, initialEnd: 0 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, duration, panel.id, setPanels]);

  const leftPct = (startTime / duration) * 100;
  const widthPct = ((endTime - startTime) / duration) * 100;

  return (
    <div
      className="flex-1 max-w-[130px] flex flex-col gap-1 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={trackRef}
        className="h-4 bg-neutral-950 border border-neutral-800 rounded relative overflow-hidden"
      >
        <div className="absolute inset-0 flex justify-between opacity-15 pointer-events-none">
          <div className="w-[1px] h-full bg-white"></div>
          <div className="w-[1px] h-full bg-white"></div>
          <div className="w-[1px] h-full bg-white"></div>
          <div className="w-[1px] h-full bg-white"></div>
          <div className="w-[1px] h-full bg-white"></div>
        </div>

        <div
          style={{
            left: `${leftPct}%`,
            width: `${widthPct}%`,
          }}
          className="absolute top-0 bottom-0 bg-[#2A2A2A] hover:bg-[#3B82F6]/90 border-l border-r border-[#60A5FA] rounded flex items-center justify-between group cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => handleMouseDown(e, "center")}
        >
          <div
            className="w-1.5 h-full bg-[#2A2A2A] hover:bg-white cursor-ew-resize flex-shrink-0"
            onMouseDown={(e) => handleMouseDown(e, "left")}
          />

          <span className="text-[7px] font-mono font-bold text-white leading-none truncate pointer-events-none px-0.5">
            {startTime.toFixed(1)}s-{endTime.toFixed(1)}s
          </span>

          <div
            className="w-1.5 h-full bg-[#2A2A2A] hover:bg-white cursor-ew-resize flex-shrink-0"
            onMouseDown={(e) => handleMouseDown(e, "right")}
          />
        </div>
      </div>
    </div>
  );
};

const StoryboardCard = ({
  panel,
  idx,
  currentPanelIndex,
  activePreviewTab,
  setCurrentPanelIndex,
  setActivePreviewTab,
  setPlaybackTime,
  analyzingPanelId,
  isAnalyzingAll,
  handleShiftPanel,
  panelsLength,
  handleModifySpeechText,
  handleModifyMotion,
  handleModifyDuration,
  handleModifySFX,
  handleModifyVisualDescription,
  handleModifyNarrative,
  handleAnalyzePanel,
  handleCancelAnalysis,
  isSelected,
  onToggleSelect,
  onPanelClick,
  onPanelDoubleClick,
  playStoryboardAudio,
  autoPlayAudio,
  addNotification,
  setPanels,
  fetchWithInterceptor,
  voiceActor,
  speechRate,
  speechPitch,
  viewLayout = "scroll",
}: StoryboardCardProps) => {
  const [activeTab, setActiveTab] = React.useState<
    "speech" | "narrative" | "sfx" | "visual"
  >("speech");
  const [isGeneratingVoice, setIsGeneratingVoice] = React.useState(false);
  const [generatingVoiceMode, setGeneratingVoiceMode] = React.useState<"speech" | "narrative" | null>(null);
  const [isTracksExpanded, setIsTracksExpanded] = React.useState(false);
  const [isMagicProcessing, setIsMagicProcessing] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isMenuOpen) return;
    const close = () => setIsMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [isMenuOpen]);

  const handleDuplicatePanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (!setPanels) return;
    const duplicated: GeneratedPanel = {
      ...panel,
      id: Date.now(),
    };
    setPanels((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, duplicated);
      return next;
    });
    addNotification?.(`Panel #${idx + 1} duplicated!`, "success");
  };

  const handleDeletePanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (!setPanels) return;
    setPanels((prev) => prev.filter((p) => p.id !== panel.id));
    addNotification?.(`Panel #${idx + 1} deleted!`, "info");
  };

  const handleOpenAssistant = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    window.history.pushState({}, "", `/creative-suite/panel-assistant?idx=${idx}`);
    window.dispatchEvent(new Event("popstate"));
  };

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const txt = panel.speech_text || panel.narrative || "";
    if (txt) {
      navigator.clipboard.writeText(txt);
      addNotification?.("Copied dialogue text to clipboard!", "success");
    } else {
      addNotification?.("No text to copy", "info");
    }
  };

  // Unified Playback state for Speech / Voice Audio
  const [isDialoguePlaying, setIsDialoguePlaying] = React.useState(false);
  const [isDialoguePaused, setIsDialoguePaused] = React.useState(false);
  const [playingAudioType, setPlayingAudioType] = React.useState<"speech" | "narrative" | null>(null);
  const dialogueAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const dialogueUtteranceRef = React.useRef<SpeechSynthesisUtterance | null>(
    null
  );

  // Audio & Voice Settings State synced with central AudioSettings profile
  const [selectedVoiceModel, setSelectedVoiceModel] = React.useState<string>(
    () =>
      voiceActor ||
      localStorage.getItem("ai_comic_voice") ||
      localStorage.getItem("ai_comic_voice_actor") ||
      localStorage.getItem("ai_comic_narrator_voice") ||
      "en-US-ChristopherNeural"
  );
  const [customSpeechRate, setCustomSpeechRate] = React.useState<number>(
    () =>
      speechRate ||
      parseFloat(localStorage.getItem("ai_comic_speech_rate") || "1.0") ||
      1.0
  );
  const [customSpeechPitch, setCustomSpeechPitch] = React.useState<number>(
    () =>
      speechPitch ||
      parseFloat(localStorage.getItem("ai_comic_speech_pitch") || "1.0") ||
      1.0
  );

  React.useEffect(() => {
    if (voiceActor) setSelectedVoiceModel(voiceActor);
  }, [voiceActor]);

  React.useEffect(() => {
    if (speechRate !== undefined) setCustomSpeechRate(speechRate);
  }, [speechRate]);

  React.useEffect(() => {
    if (speechPitch !== undefined) setCustomSpeechPitch(speechPitch);
  }, [speechPitch]);

  const stopDialogueAudio = React.useCallback(() => {
    if (dialogueAudioRef.current) {
      dialogueAudioRef.current.pause();
      dialogueAudioRef.current.currentTime = 0;
      dialogueAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    dialogueUtteranceRef.current = null;
    setIsDialoguePlaying(false);
    setIsDialoguePaused(false);
    setPlayingAudioType(null);
  }, []);

  React.useEffect(() => {
    stopDialogueAudio();
    return () => {
      stopDialogueAudio();
    };
  }, [panel.id, stopDialogueAudio]);

  // Speech Synthesis browser fallback
  const speakDialogueFallback = React.useCallback(() => {
    const textToRead = panel.speech_text || panel.narrative || "";
    if (!textToRead.trim()) {
      addNotification?.(
        "Please enter dialogue or narration text to hear audio preview.",
        "info"
      );
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      const utt = new SpeechSynthesisUtterance(textToRead);
      utt.volume = 1.0;
      utt.rate = customSpeechRate;
      utt.pitch = customSpeechPitch;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const selectedVoice =
          voices.find(
            (v) =>
              v.name.includes(selectedVoiceModel) ||
              v.lang.startsWith("en") ||
              v.default
          ) || voices[0];
        if (selectedVoice) {
          utt.voice = selectedVoice;
          utt.lang = selectedVoice.lang;
        }
      }

      utt.onstart = () => {
        setIsDialoguePlaying(true);
        setIsDialoguePaused(false);
      };
      utt.onend = () => stopDialogueAudio();
      utt.onerror = (err) => {
        console.error("[SpeechSynthesis] error:", err);
        stopDialogueAudio();
      };

      dialogueUtteranceRef.current = utt;
      window.speechSynthesis.speak(utt);
      setIsDialoguePlaying(true);
      setIsDialoguePaused(false);
    } else {
      addNotification?.(
        "Speech synthesis is not supported in this browser.",
        "error"
      );
    }
  }, [
    panel.speech_text,
    panel.narrative,
    addNotification,
    customSpeechRate,
    customSpeechPitch,
    selectedVoiceModel,
    stopDialogueAudio,
  ]);

  // Toggle Dialogue / Narrator Audio
  const handleToggleDialogueAudio = async (mode?: "speech" | "narrative") => {
    const currentMode = mode || (activeTab === "narrative" ? "narrative" : "speech");

    // Scenario 1: Currently Playing THIS specific audio -> Pause
    if (isDialoguePlaying && !isDialoguePaused && playingAudioType === currentMode) {
      if (dialogueAudioRef.current) {
        dialogueAudioRef.current.pause();
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
      }
      setIsDialoguePaused(true);
      return;
    }

    // Scenario 2: Currently Paused on THIS specific audio -> Resume
    if (isDialoguePlaying && isDialoguePaused && playingAudioType === currentMode) {
      if (dialogueAudioRef.current) {
        dialogueAudioRef.current
          .play()
          .catch((err) => console.error("Audio resume failed:", err));
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
      setIsDialoguePaused(false);
      return;
    }

    // Scenario 3: Stopped or playing the other track -> Start Fresh Playback for currentMode
    stopDialogueAudio();

    // CRITICAL BUG FIX: Narrator audio is ONLY panel.narrative_audio_url. Never fall back to dialogue audio!
    const targetAudioUrl =
      currentMode === "narrative"
        ? panel.narrative_audio_url
        : (panel.speech_audio_url || panel.audio_url);

    if (targetAudioUrl) {
      const audio = new Audio(targetAudioUrl);
      dialogueAudioRef.current = audio;
      audio.volume = 1.0;
      audio.onended = () => stopDialogueAudio();
      audio.onerror = (e) => {
        console.warn(
          `${currentMode} audio URL failed to load, synthesizing fresh neural voice:`,
          e
        );
        stopDialogueAudio();
        handleGenerateVoice(true, currentMode);
      };
      try {
        await audio.play();
        setIsDialoguePlaying(true);
        setIsDialoguePaused(false);
        setPlayingAudioType(currentMode);
      } catch (err) {
        console.warn(
          `${currentMode} audio play failed, synthesizing fresh neural voice:`,
          err
        );
        stopDialogueAudio();
        handleGenerateVoice(true, currentMode);
      }
    } else {
      const textToSpeak =
        currentMode === "narrative"
          ? (panel.narrative || "").trim()
          : (panel.speech_text || "").trim();

      if (textToSpeak) {
        handleGenerateVoice(true, currentMode);
      } else {
        addNotification?.(
          `Please enter ${currentMode === "narrative" ? "narrator" : "dialogue"} text first.`,
          "info"
        );
      }
    }
  };

  const handleGenerateVoice = async (
    autoPlayAfterGenerate = false,
    mode?: "speech" | "narrative"
  ) => {
    const currentMode = mode || (activeTab === "narrative" ? "narrative" : "speech");
    const textToSpeak =
      currentMode === "narrative"
        ? (panel.narrative || "").trim()
        : (panel.speech_text || "").trim();

    if (!textToSpeak) {
      addNotification?.(
        `Please enter ${currentMode === "narrative" ? "narrator" : "dialogue"} text first.`,
        "warning"
      );
      return;
    }
    setIsGeneratingVoice(true);
    setGeneratingVoiceMode(currentMode);
    try {
      addNotification?.(
        `Synthesizing ${currentMode === "narrative" ? "narrator" : "dialogue"} voice...`,
        "info"
      );
      const chosenVoice =
        voiceActor ||
        localStorage.getItem("ai_comic_voice") ||
        localStorage.getItem("ai_comic_voice_actor") ||
        (currentMode === "narrative" ? localStorage.getItem("ai_comic_narrator_voice") : null) ||
        selectedVoiceModel ||
        "en-US-ChristopherNeural";

      const ttsRes = await generateTts(fetchWithInterceptor, {
        panel_id: panel.id,
        text: textToSpeak,
        dialogue_list: [textToSpeak],
        target_duration:
          panel.duration && panel.duration > 0 ? panel.duration : undefined,
        voice: chosenVoice,
        speech_rate: customSpeechRate || speechRate || 1.0,
        speech_pitch: customSpeechPitch || speechPitch || 1.0,
      });

      let audioUrl = null;
      if (ttsRes && ttsRes.success && ttsRes.audio_url) {
        audioUrl = ttsRes.audio_url;
      } else if (ttsRes && ttsRes.success && ttsRes.audio_base64) {
        audioUrl = `data:${ttsRes.mime_type || "audio/mpeg"};base64,${ttsRes.audio_base64}`;
      }

      const audioDuration: number =
        ttsRes && ttsRes.duration_actual_s && ttsRes.duration_actual_s > 0
          ? Math.round(ttsRes.duration_actual_s * 10) / 10
          : 0;

      if (audioUrl) {
        if (setPanels) {
          setPanels((prev) =>
            prev.map((p) =>
              p.id === panel.id
                ? {
                    ...p,
                    narrative_audio_url: currentMode === "narrative" ? audioUrl : p.narrative_audio_url,
                    speech_audio_url: currentMode === "speech" ? audioUrl : p.speech_audio_url,
                    audio_url: currentMode === "speech" ? audioUrl : (p.audio_url || audioUrl),
                    duration: audioDuration > 0 ? audioDuration : p.duration,
                  }
                : p
            )
          );
        }
        addNotification?.(
          `${currentMode === "narrative" ? "Narrator" : "Dialogue"} voice generated successfully!`,
          "success"
        );

        if (autoPlayAfterGenerate) {
          stopDialogueAudio();
          const audio = new Audio(audioUrl);
          dialogueAudioRef.current = audio;
          audio.volume = 1.0;
          audio.onended = () => stopDialogueAudio();
          await audio.play();
          setIsDialoguePlaying(true);
          setIsDialoguePaused(false);
          setPlayingAudioType(currentMode);
        }
      } else {
        addNotification?.(
          "Voice synthesis completed without audio output",
          "warning"
        );
      }
    } catch (err: any) {
      console.error("[Voice Gen] Failed:", err);
      addNotification?.(`Voice synthesis failed: ${err.message}`, "error");
    } finally {
      setIsGeneratingVoice(false);
      setGeneratingVoiceMode(null);
    }
  };

  const isCurrent =
    idx === currentPanelIndex && activePreviewTab === "timeline";

  const handleMagicMotion = async () => {
    if (!panel.speech_text?.trim()) {
      addNotification?.(
        "Dialogue text is required for Dialogue Sync alignment. Please type some text first.",
        "warning"
      );
      return;
    }

    setIsMagicProcessing(true);
    addNotification?.("Starting Magic Motion Macro...", "info");

    try {
      // 1. Separate Layers
      addNotification?.("Step 1/3: Running AI Layer Separation...", "info");
      const layerRes = await fetchWithInterceptor(
        `/api/image/process-layers/${panel.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: panel.image_url }),
        }
      );

      let layersObj = null;
      if (layerRes.ok) {
        const layerData = await layerRes.json();
        if (layerData.success && layerData.layers) {
          layersObj = {
            background_url: layerData.layers.background_url,
            character_url: layerData.layers.character_url,
            text_url: layerData.layers.text_url,
            bg_visible: true,
            char_visible: true,
            text_visible: true,
          };
        }
      }

      // 2. Generate Audio TTS
      addNotification?.("Step 2/3: Generating speech audio...", "info");
      const ttsRes = await generateTts(fetchWithInterceptor, {
        panel_id: panel.id,
        text: panel.speech_text,
        dialogue_list: [panel.speech_text],
        target_duration:
          panel.duration && panel.duration > 0 ? panel.duration : undefined,
        voice: voiceActor || undefined,
        speech_rate: speechRate,
        speech_pitch: speechPitch,
      });

      let audioUrl = null;
      if (ttsRes && ttsRes.success && ttsRes.audio_url) {
        audioUrl = ttsRes.audio_url;
      } else if (ttsRes && ttsRes.success && ttsRes.audio_base64) {
        audioUrl = `data:${ttsRes.mime_type || "audio/mpeg"};base64,${ttsRes.audio_base64}`;
      }

      // Capture the actual audio duration from TTS (precise timing)
      const audioDuration: number =
        ttsRes && ttsRes.duration_actual_s && ttsRes.duration_actual_s > 0
          ? Math.round(ttsRes.duration_actual_s * 10) / 10
          : 0;

      // 3. Dialogue Sync Alignment (only if audio succeeded)
      let syncMapObj = null;
      if (audioUrl) {
        addNotification?.(
          "Step 3/3: Aligning dialogue to audio playhead...",
          "info"
        );
        const ocr_texts = panel.speech_text
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        const alignRes = await fetchWithInterceptor(
          `/api/audio/align-dialogue/${panel.id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audio_url: audioUrl,
              ocr_texts: ocr_texts.length > 0 ? ocr_texts : [panel.speech_text],
            }),
          }
        );
        const alignData = await alignRes.json();

        if (alignData.success && alignData.dialogue_map) {
          syncMapObj = {
            dialogue_map: alignData.dialogue_map,
            audio_peaks: alignData.audio_peaks || [],
            peaks_fps: alignData.peaks_fps,
          };
        }
      }

      // 4. Update the panel state atomically with all results.
      //    - TIMING: always sync to actual audio duration (never estimate).
      //    - CAM MOTION: preserve the AI-decided motion from "Analyze Image".
      //      Only fall back to "zoom_in" when the panel has no motion yet.
      if (setPanels) {
        setPanels((prev: any[]) =>
          prev.map((p) =>
            p.id === panel.id
              ? {
                  ...p,
                  // Preserve AI-decided motion; only default if completely unset
                  motion_type:
                    p.motion_type && p.motion_type.trim().length > 0
                      ? p.motion_type
                      : "",
                  // Sync timing to actual audio length
                  duration: audioDuration > 0 ? audioDuration : p.duration,
                  audio_url: audioUrl || p.audio_url,
                  layers: layersObj || p.layers,
                  syncMap: syncMapObj || p.syncMap,
                }
              : p
          )
        );
      }

      addNotification?.(
        "✓ Magic Motion successfully fully configured for this panel!",
        "success"
      );
    } catch (err: any) {
      console.error("[Magic Motion] macro failed:", err);
      addNotification?.(
        `Magic Motion macro failed: ${err.message || String(err)}`,
        "error"
      );
    } finally {
      setIsMagicProcessing(false);
    }
  };

  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleThumbnailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const shiftKey = e.shiftKey;
    const ctrlOrMeta = e.ctrlKey || e.metaKey;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      // Perform double click actions
      onPanelDoubleClick?.(idx, panel.id);

      // Snap floating player coordinates to { x: 20, y: 80 } and set isPlayerOpen: true
      useImageEditorStore.getState().setPlayerSettings({
        isPlayerOpen: true,
        playerPos: { x: 20, y: 80 },
      });
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        console.log(
          `[TimelineCard] Selecting panel #${panel.id} at index ${idx}`
        );
        setCurrentPanelIndex(idx);
        setActivePreviewTab("timeline");
        setPlaybackTime(0);
        if (onPanelClick) {
          onPanelClick(idx, panel.id, shiftKey, ctrlOrMeta);
        } else {
          onToggleSelect();
        }
      }, 250);
    }
  };

  const [dimensions, setDimensions] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  const aspectRatioLabel = React.useMemo(() => {
    if (!dimensions) return null;
    const ratio = dimensions.width / dimensions.height;
    if (ratio > 1.25) return "Landscape";
    if (ratio < 0.28) return "Too Tall Strip";
    if (ratio < 0.6) return "Tall Strip";
    return "Portrait";
  }, [dimensions]);

  const isThisPanelAnalyzing =
    Boolean(panel.isAnalyzing) ||
    (analyzingPanelId !== null && String(analyzingPanelId) === String(panel.id));

  const cardRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: viewLayout === "grid" ? "320px 460px" : "300px 460px",
      }}
      className={`${
        viewLayout === "grid"
          ? "w-full min-w-0"
          : "w-[85vw] max-w-[340px] sm:w-[300px] shrink-0 snap-center"
      } group relative rounded-2xl border p-3 sm:p-3.5 space-y-2.5 sm:space-y-3 transition-colors duration-150 select-none outline-none shadow-sm ${
        isMenuOpen ? "z-50" : "z-0"
      } ${
        isThisPanelAnalyzing
          ? "border-2 border-[#3B82F6] bg-[#1a1a24] ring-1 ring-[#3B82F6]/50"
          : isCurrent && isSelected
          ? "bg-[#1f1f2e] border-[#60A5FA] ring-1 ring-[#3B82F6]/50"
          : isCurrent
          ? "bg-[#0c0d16] border-[#3B82F6]"
          : isSelected
          ? "border-[#3B82F6] bg-[#1a1a24]"
          : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
      }`}
    >
      {/* Image Thumbnail */}
      <div
        onClick={handleThumbnailClick}
        className="relative h-56 sm:h-64 rounded-xl cursor-pointer select-none bg-neutral-950 border border-neutral-800/80 shadow-inner flex items-center justify-center p-1.5 group/thumb hover:border-[#3B82F6]/40 transition-colors duration-150"
      >
        <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center relative">
          <img
            src={panel.image_url}
            alt={`Panel #${idx + 1}`}
            loading="lazy"
            decoding="async"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            className="w-full h-full object-contain object-center rounded-xl"
            style={{ filter: getPanelFilterStyle(panel) }}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                setDimensions({
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                });
              }
            }}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.retried) return;
              img.dataset.retried = "1";
              const src = img.src;
              if (
                !src.includes("/api/proxy-image") &&
                !src.includes("/api/image/") &&
                !src.includes("/media/") &&
                !src.includes("/videos/")
              ) {
                img.src = `/api/proxy-image?url=${encodeURIComponent(src)}`;
              } else {
                img.style.display = "none";
              }
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {isThisPanelAnalyzing && (
          <PanelAnalyzingOverlay isAnalyzingAll={isAnalyzingAll} />
        )}

        {/* Selection indicator overlay when selected */}
        {isSelected && (
          <div className="absolute inset-0 bg-[#3B82F6]/10 border-2 border-[#3B82F6]/60 rounded-xl pointer-events-none z-[5]" />
        )}

        {/* Hover hint label overlay */}
        <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
          <div className="bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-transparent text-[9px] text-[#60A5FA] font-mono text-center pb-2 pt-5 font-bold tracking-wide">
            Click select · 2x Click player · Shift range
          </div>
        </div>

        {/* Top-Left: Index Badge & Reorder Controls grouped together on the same side */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-20">
          <div
            className={[
              "backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold leading-none border transition-all duration-300",
              isSelected
                ? "bg-gradient-to-r from-[#2A2A2A] to-indigo-650 border-[#60A5FA]/50 text-white shadow-[0_4px_12px_rgba(59,130,246,0.35)]"
                : "bg-neutral-900 border-neutral-700 text-[#3B82F6] shadow-inner",
            ].join(" ")}
          >
            #{idx + 1}
          </div>

          {/* Reorder Buttons (◀ ▶) together in a unified pill */}
          <div className="flex items-center bg-black/85 backdrop-blur-md rounded-lg border border-neutral-700/80 p-0.5 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200 shadow-sm">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleShiftPanel(idx, "left");
              }}
              disabled={idx === 0}
              className="p-1 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer font-mono text-[9px] leading-none"
              title="Move Panel Left"
            >
              ◀
            </button>
            <div className="w-[1px] h-2.5 bg-neutral-700" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleShiftPanel(idx, "right");
              }}
              disabled={idx === panelsLength - 1}
              className="p-1 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer font-mono text-[9px] leading-none"
              title="Move Panel Right"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Top-Right: 3-Dots Action Menu & Selection Button */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-30">
          {/* 3-Dots More Options Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              className="p-1 rounded-md bg-black/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 backdrop-blur-md transition-all cursor-pointer shadow-sm flex items-center justify-center opacity-0 group-hover/thumb:opacity-100"
              title="Panel Options & Actions"
            >
              <MoreVertical className="h-3 w-3" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 w-52 bg-neutral-900/98 backdrop-blur-2xl border border-neutral-700/80 rounded-xl p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.85)] z-50 animate-in fade-in zoom-in-95 duration-100 font-sans space-y-1 ring-1 ring-black/40"
              >
                {/* Panel Resolution & Aspect Ratio Info */}
                {dimensions && (
                  <div className="px-2 py-1 bg-neutral-950/90 rounded-lg border border-neutral-800 flex items-center justify-between text-[9.5px] font-mono text-neutral-400 select-none mb-1">
                    <span className="font-semibold text-neutral-300">{dimensions.width} × {dimensions.height} px</span>
                    {aspectRatioLabel && (
                      <span className="text-[#60A5FA] bg-[#3B82F6]/10 px-1.5 py-0.5 rounded border border-[#3B82F6]/20 font-medium">
                        {aspectRatioLabel}
                      </span>
                    )}
                  </div>
                )}

                {/* 1. Magic Motion */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    handleMagicMotion();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Magic Motion</span>
                </button>

                {/* 2. Open Assistant */}
                <button
                  type="button"
                  onClick={handleOpenAssistant}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
                >
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Panel Assistant</span>
                </button>

                {/* 3. Generate Audio */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    handleGenerateVoice();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Create Voice Audio</span>
                </button>

                {/* 4. Copy Dialogue */}
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy Dialogue</span>
                </button>

                {/* 5. Duplicate Panel */}
                <button
                  type="button"
                  onClick={handleDuplicatePanel}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Duplicate Panel</span>
                </button>

                {/* Divider */}
                <div className="h-[1px] bg-neutral-800 my-1" />

                {/* 6. Delete Panel */}
                <button
                  type="button"
                  onClick={handleDeletePanel}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete Panel</span>
                </button>
              </div>
            )}
          </div>

          {/* Selection checkbox circle */}
          <div className="relative">
            {(isSelected || isCurrent) && (
              <div className="absolute inset-0 rounded-full bg-[#2A2A2A] animate-ping" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              className={`relative rounded-full p-1 border transition-all duration-300 ease-out cursor-pointer active:scale-90 ${
                isSelected || isCurrent
                  ? "bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] border-[#60A5FA] shadow-[0_4px_12px_rgba(59,130,246,0.4)] scale-110 opacity-100"
                  : "bg-neutral-900/60 border-neutral-600/70 hover:border-neutral-400 opacity-0 group-hover/thumb:opacity-100"
              }`}
              title={isSelected ? "Deselect panel" : "Select panel"}
            >
              <Check
                className={`h-2.5 w-2.5 ${
                  isSelected || isCurrent ? "text-white" : "text-neutral-400"
                }`}
                strokeWidth={3.5}
              />
            </button>
          </div>
        </div>

        {/* Motion overlay text */}
        {panel.motion_type && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 text-[9px] font-mono uppercase tracking-wider text-neutral-300 border border-white/8 z-20">
            {panel.motion_type}
          </div>
        )}
      </div>

      <div className="space-y-2 w-full">
        {/* Category Tabs: Dialogue, Narrator, SFX, Scene */}
        <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-[#0e1017] border border-neutral-800/80 select-none">
          <button
            type="button"
            onClick={() => setActiveTab("speech")}
            title="Speech Bubble Dialogue (In-Image Text)"
            className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] transition-all duration-200 cursor-pointer ${
              activeTab === "speech"
                ? "bg-blue-600 text-white shadow-sm font-bold"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 font-medium"
            }`}
          >
            <MessageSquare className="w-3 h-3 shrink-0" />
            <span className="whitespace-nowrap">Dialogue</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("narrative")}
            title="Voice Narrator (Explains Story & Actions)"
            className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] transition-all duration-200 cursor-pointer ${
              activeTab === "narrative"
                ? "bg-purple-600 text-white shadow-sm font-bold"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 font-medium"
            }`}
          >
            <Mic className="w-3 h-3 shrink-0" />
            <span className="whitespace-nowrap">Narrator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sfx")}
            title="Sound Effects (SFX)"
            className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] transition-all duration-200 cursor-pointer ${
              activeTab === "sfx"
                ? "bg-emerald-600 text-white shadow-sm font-bold"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 font-medium"
            }`}
          >
            <Volume2 className="w-3 h-3 shrink-0" />
            <span className="whitespace-nowrap">SFX</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            title="Visual Scene Prompt"
            className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] transition-all duration-200 cursor-pointer ${
              activeTab === "visual"
                ? "bg-amber-600 text-white shadow-sm font-bold"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 font-medium"
            }`}
          >
            <Palette className="w-3 h-3 shrink-0" />
            <span className="whitespace-nowrap">Scene</span>
          </button>
        </div>

        {/* Tab 1: Bubble Dialogue (Speech text from image) */}
        {activeTab === "speech" && (
          <div className="space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-1.5 px-0.5 min-w-0">
              <span className="text-[10px] font-medium text-neutral-300 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <MessageSquare className="w-3 h-3 text-[#60A5FA] shrink-0" />
                <span>Dialogue</span>
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {/* Create Voice for Speech */}
                <button
                  type="button"
                  disabled={Boolean(isGeneratingVoice && generatingVoiceMode === "speech") || isThisPanelAnalyzing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateVoice(false, "speech");
                  }}
                  className="h-6 px-2 rounded-lg text-[9.5px] font-medium flex items-center gap-1 border border-neutral-700/80 bg-neutral-800/90 hover:bg-neutral-750 text-neutral-200 hover:text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm whitespace-nowrap shrink-0 active:scale-95"
                  title="Synthesize dialogue voice"
                >
                  {isGeneratingVoice && generatingVoiceMode === "speech" ? (
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#3B82F6]" />
                  ) : (
                    <Mic className="w-2.5 h-2.5 text-[#3B82F6]" />
                  )}
                  <span>{isGeneratingVoice && generatingVoiceMode === "speech" ? "Voicing..." : "Create Voice"}</span>
                </button>

                {/* Play Dialogue Audio */}
                <button
                  type="button"
                  disabled={Boolean(isGeneratingVoice && generatingVoiceMode === "speech") || isThisPanelAnalyzing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleDialogueAudio("speech");
                  }}
                  className={`h-6 px-2 rounded-lg text-[9.5px] font-medium flex items-center gap-1 border transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                    isGeneratingVoice && generatingVoiceMode === "speech"
                      ? "bg-blue-950/80 border-blue-500 text-blue-200 shadow-sm"
                      : isDialoguePlaying && !isDialoguePaused && playingAudioType === "speech"
                      ? "bg-amber-950/80 border-amber-500 text-amber-200 shadow-sm"
                      : "bg-[#181a22] border-neutral-750 text-[#60A5FA] hover:bg-neutral-800 hover:text-white"
                  }`}
                  title="Play Dialogue Preview"
                >
                  {isGeneratingVoice && generatingVoiceMode === "speech" ? (
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#3B82F6]" />
                  ) : isDialoguePlaying && !isDialoguePaused && playingAudioType === "speech" ? (
                    <Pause className="w-2.5 h-2.5 fill-current" />
                  ) : (
                    <Play className="w-2.5 h-2.5 fill-current" />
                  )}
                  <span>
                    {isGeneratingVoice && generatingVoiceMode === "speech"
                      ? "Creating..."
                      : isDialoguePlaying && !isDialoguePaused && playingAudioType === "speech"
                      ? "Pause"
                      : "Play Audio"}
                  </span>
                </button>

                {(isDialoguePlaying || isDialoguePaused) && playingAudioType === "speech" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      stopDialogueAudio();
                    }}
                    className="h-6 w-6 rounded-lg flex items-center justify-center bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/80 cursor-pointer shrink-0 active:scale-95"
                    title="Stop Audio"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                  </button>
                )}
              </div>
            </div>

            {/* Bubble Dialogue Textarea */}
            <textarea
              rows={1}
              disabled={isThisPanelAnalyzing}
              value={panel.speech_text || ""}
              onChange={(e) => handleModifySpeechText(panel.id, e.target.value)}
              placeholder="Text from speech bubbles in image..."
              className={`w-full min-h-[36px] bg-[#090b10] border border-neutral-800/90 text-[11px] rounded-xl p-2.5 text-neutral-100 placeholder-neutral-500 outline-none focus:border-[#3B82F6]/80 focus:ring-1 focus:ring-[#3B82F6]/30 font-sans transition-all resize-none shadow-inner ${
                isThisPanelAnalyzing
                  ? "opacity-60 cursor-not-allowed border-[#2F2F2F] text-[#60A5FA]"
                  : "hover:border-neutral-700"
              }`}
            />
          </div>
        )}

        {/* Tab 1.5: Voice Narrator (Story Narrative / Explains scene actions) */}
        {activeTab === "narrative" && (
          <div className="space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-1.5 px-0.5 min-w-0">
              <span className="text-[10px] font-medium text-neutral-300 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Mic className="w-3 h-3 text-purple-400 shrink-0" />
                <span>Narrator</span>
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {/* Create Voice for Narrator */}
                <button
                  type="button"
                  disabled={Boolean(isGeneratingVoice && generatingVoiceMode === "narrative") || isThisPanelAnalyzing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateVoice(false, "narrative");
                  }}
                  className="h-6 px-2 rounded-lg text-[9.5px] font-medium flex items-center gap-1 border border-purple-800/60 bg-purple-950/50 hover:bg-purple-900/70 text-purple-200 hover:text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm whitespace-nowrap shrink-0 active:scale-95"
                  title="Synthesize story narration voice"
                >
                  {isGeneratingVoice && generatingVoiceMode === "narrative" ? (
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-purple-400" />
                  ) : (
                    <Mic className="w-2.5 h-2.5 text-purple-400" />
                  )}
                  <span>{isGeneratingVoice && generatingVoiceMode === "narrative" ? "Voicing..." : "Create Voice"}</span>
                </button>

                {/* Play Narrator Audio */}
                <button
                  type="button"
                  disabled={Boolean(isGeneratingVoice && generatingVoiceMode === "narrative") || isThisPanelAnalyzing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleDialogueAudio("narrative");
                  }}
                  className={`h-6 px-2 rounded-lg text-[9.5px] font-medium flex items-center gap-1 border transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                    isGeneratingVoice && generatingVoiceMode === "narrative"
                      ? "bg-purple-950/90 border-purple-400 text-purple-200 shadow-sm"
                      : isDialoguePlaying && !isDialoguePaused && playingAudioType === "narrative"
                      ? "bg-purple-950/80 border-purple-500 text-purple-300 shadow-sm"
                      : "bg-[#181a22] border-neutral-750 text-purple-300 hover:bg-neutral-800 hover:text-white"
                  }`}
                  title="Play Narrator Preview"
                >
                  {isGeneratingVoice && generatingVoiceMode === "narrative" ? (
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-purple-400" />
                  ) : isDialoguePlaying && !isDialoguePaused && playingAudioType === "narrative" ? (
                    <Pause className="w-2.5 h-2.5 fill-current" />
                  ) : (
                    <Play className="w-2.5 h-2.5 fill-current" />
                  )}
                  <span>
                    {isGeneratingVoice && generatingVoiceMode === "narrative"
                      ? "Creating..."
                      : isDialoguePlaying && !isDialoguePaused && playingAudioType === "narrative"
                      ? "Pause"
                      : "Play Audio"}
                  </span>
                </button>

                {(isDialoguePlaying || isDialoguePaused) && playingAudioType === "narrative" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      stopDialogueAudio();
                    }}
                    className="h-6 w-6 rounded-lg flex items-center justify-center bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/80 cursor-pointer shrink-0 active:scale-95"
                    title="Stop Audio"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                  </button>
                )}
              </div>
            </div>

            {/* Narrator Textarea */}
            <textarea
              rows={1}
              disabled={isThisPanelAnalyzing}
              value={panel.narrative || ""}
              onChange={(e) => handleModifyNarrative?.(panel.id, e.target.value)}
              placeholder="Story narration explaining actions, atmosphere, and context..."
              className={`w-full min-h-[36px] bg-[#090b10] border border-neutral-800/90 text-[11px] rounded-xl p-2.5 text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/30 font-sans transition-all resize-none shadow-inner ${
                isThisPanelAnalyzing
                  ? "opacity-60 cursor-not-allowed border-[#2F2F2F] text-purple-400"
                  : "hover:border-neutral-700"
              }`}
            />
          </div>
        )}

        {/* Tab 2: SFX */}
        {activeTab === "sfx" && (
          <div className="space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-1 px-0.5">
              <Volume2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-medium text-neutral-300">
                Sound Effects (SFX Cue)
              </span>
            </div>
            <input
              type="text"
              disabled={isThisPanelAnalyzing}
              value={panel.sfx || ""}
              onChange={(e) => handleModifySFX(panel.id, e.target.value)}
              placeholder="e.g. door slam, footsteps, explosion..."
              className={`w-full bg-[#090b10] border border-neutral-800/90 text-[11px] rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 font-sans transition-all shadow-inner ${
                isThisPanelAnalyzing
                  ? "opacity-60 cursor-not-allowed text-emerald-400 border-[#2F2F2F]"
                  : "hover:border-neutral-700"
              }`}
            />
          </div>
        )}

        {/* Tab 3: Visual Scene Prompt */}
        {activeTab === "visual" && (
          <div className="space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-1 px-0.5">
              <Palette className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-[10px] font-medium text-neutral-300">
                Visual Scene Prompt
              </span>
            </div>
            <textarea
              rows={1}
              disabled={isThisPanelAnalyzing}
              value={panel.visual_description || ""}
              onChange={(e) =>
                handleModifyVisualDescription(panel.id, e.target.value)
              }
              placeholder="Describe visual scene for lighting..."
              className={`w-full min-h-[36px] bg-[#090b10] border border-neutral-800/90 text-[11px] rounded-xl p-2.5 text-neutral-100 placeholder-neutral-500 outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 font-sans transition-all resize-none shadow-inner ${
                isThisPanelAnalyzing
                  ? "opacity-60 cursor-not-allowed text-amber-400 border-[#2F2F2F]"
                  : "hover:border-neutral-700"
              }`}
            />
          </div>
        )}

        {/* Motion & Timing Row */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5 select-none">
          {/* Motion Selector */}
          <div className="relative flex items-center gap-1.5 bg-[#0a0c12] border border-neutral-800/90 hover:border-neutral-700/90 focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/20 rounded-xl px-2.5 py-1.5 h-8 transition-all group cursor-pointer">
            <Video className="w-3 h-3 text-[#3B82F6] shrink-0 pointer-events-none group-hover:scale-105 transition-transform" />
            <select
              value={panel.motion_type ?? ""}
              onChange={(e) => handleModifyMotion(panel.id, e.target.value)}
              style={{ outline: "none", border: "none", boxShadow: "none", background: "transparent" }}
              className="appearance-none bg-transparent border-0 border-none p-0 pr-3.5 text-[10px] font-mono font-medium text-neutral-200 w-full outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-0 focus:shadow-none shadow-none cursor-pointer truncate seamless-select"
            >
              <option value="" className="bg-neutral-950 text-neutral-200">
                Motion: None
              </option>
              <option value="zoom_in" className="bg-neutral-950 text-neutral-200">
                Zoom In
              </option>
              <option
                value="zoom_out"
                className="bg-neutral-950 text-neutral-200"
              >
                Zoom Out
              </option>
              <option
                value="pan_right"
                className="bg-neutral-950 text-neutral-200"
              >
                Pan Right
              </option>
              <option
                value="pan_left"
                className="bg-neutral-950 text-neutral-200"
              >
                Pan Left
              </option>
              <option
                value="pan_down"
                className="bg-neutral-950 text-neutral-200"
              >
                Pan Down
              </option>
            </select>
            <ChevronDown className="w-2.5 h-2.5 text-neutral-500 group-hover:text-neutral-300 pointer-events-none absolute right-2 shrink-0 transition-colors" />
          </div>

          {/* Duration Counter with Stepper */}
          <div className="flex items-center justify-between gap-1 bg-[#0a0c12] border border-neutral-800/90 hover:border-neutral-700/90 focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/20 rounded-xl px-2 py-1.5 h-8 transition-all group">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Clock className="w-3 h-3 text-[#3B82F6] shrink-0 pointer-events-none group-hover:scale-105 transition-transform" />
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={panel.duration === 0 ? "" : panel.duration}
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  if (!isNaN(num) && num >= 0) {
                    handleModifyDuration(panel.id, num);
                  } else if (e.target.value === "") {
                    handleModifyDuration(panel.id, 0);
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "" || parseFloat(e.target.value) <= 0) {
                    handleModifyDuration(panel.id, 0);
                  }
                }}
                style={{ outline: "none", border: "none", boxShadow: "none", background: "transparent" }}
                placeholder="3.0"
                className="bg-transparent border-0 border-none p-0 text-[10px] font-mono font-bold text-neutral-100 w-full outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-0 focus:shadow-none shadow-none text-left seamless-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[9px] font-mono text-neutral-400 shrink-0 font-semibold select-none">
                sec
              </span>
            </div>
            {/* Quick Micro Steppers */}
            <div className="flex items-center gap-0.5 pl-1 border-l border-neutral-800/80 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const current = Number(panel.duration) || 0;
                  const next = Math.max(0.5, Math.round((current - 0.5) * 10) / 10);
                  handleModifyDuration(panel.id, next);
                }}
                className="h-4 w-4 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-[11px] leading-none font-bold select-none active:scale-90"
                title="Decrease duration (0.5s)"
              >
                -
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const current = Number(panel.duration) || 0;
                  const next = Math.round((current + 0.5) * 10) / 10;
                  handleModifyDuration(panel.id, next);
                }}
                className="h-4 w-4 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-[11px] leading-none font-bold select-none active:scale-90"
                title="Increase duration (0.5s)"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Unified 3-in-1 AI Action Toolbar */}
        <div className="grid grid-cols-3 gap-1 pt-0.5 select-none">
          {/* 1. Analyze Image */}
          {isThisPanelAnalyzing ? (
            <button
              type="button"
              onClick={() => handleCancelAnalysis && handleCancelAnalysis()}
              className="py-1.5 rounded-xl border text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all bg-rose-600/20 border-rose-500/50 text-rose-300 shadow-sm active:scale-95"
              title="Stop Analyzing"
            >
              <X className="h-3 w-3 text-rose-400" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={
                analyzingPanelId !== null && String(analyzingPanelId) !== String(panel.id)
              }
              onClick={() => handleAnalyzePanel(panel.id, panel.image_url)}
              className="py-1.5 px-1 rounded-xl border border-neutral-800 bg-[#0e1017] hover:bg-neutral-850 hover:border-[#3B82F6]/60 text-neutral-200 hover:text-[#93C5FD] text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-40"
              title="Analyze Scene with AI"
            >
              <Sparkles className="h-3 w-3 text-[#3B82F6]" />
              <span>Analyze</span>
            </button>
          )}

          {/* 2. Magic Motion */}
          {setPanels && fetchWithInterceptor ? (
            <button
              type="button"
              disabled={isMagicProcessing}
              onClick={handleMagicMotion}
              className="py-1.5 px-1 rounded-xl border border-[#3B82F6]/40 bg-gradient-to-r from-[#181a24] to-indigo-950/70 hover:from-[#1e2230] hover:to-indigo-900/70 text-[#60A5FA] hover:text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm disabled:opacity-40 active:scale-95"
              title="Apply Magic Motion"
            >
              {isMagicProcessing ? (
                <RefreshCw className="h-3 w-3 animate-spin text-[#3B82F6]" />
              ) : (
                <Wand2 className="h-3 w-3 text-[#3B82F6]" />
              )}
              <span>{isMagicProcessing ? "Magic..." : "Magic"}</span>
            </button>
          ) : (
            <div />
          )}

          {/* 3. Panel Assistant */}
          <button
            type="button"
            onClick={() => {
              if (typeof (window as any).navigateTo === "function") {
                (window as any).navigateTo(`/creative-suite/panel-assistant?panel_id=${panel.id}`);
              }
            }}
            className="py-1.5 px-1 rounded-xl border border-neutral-800 bg-[#0e1017] hover:bg-neutral-850 hover:border-purple-500/50 text-neutral-200 hover:text-purple-300 text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
            title="Open Panel Assistant"
          >
            <Bot className="h-3 w-3 text-purple-400" />
            <span>Assistant</span>
          </button>
        </div>

        {/* Accordion Layer Tracks (Motion Comic Mode) */}
        {panel.layers && setPanels && (
          <div className="pt-2 border-t border-neutral-900 space-y-2 no-drag">
            <button
              type="button"
              onClick={() => setIsTracksExpanded(!isTracksExpanded)}
              className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-[#3B82F6] hover:text-[#93C5FD] py-1 transition-all cursor-pointer outline-none focus:outline-none"
            >
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>Multi-Layer Tracks</span>
              </div>
              {isTracksExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {isTracksExpanded && (
              <div className="space-y-1.5 pl-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* BG Track */}
                <div className="flex items-center justify-between bg-neutral-900 border border-neutral-850 px-2 py-1 rounded-lg gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={panel.layers.background_url}
                      alt="Background Thumbnail"
                      className="h-8 w-8 object-contain rounded border border-neutral-850 bg-neutral-950 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="text-[10px] font-mono text-neutral-300">
                      Background
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPanels((prev) =>
                        prev.map((p) =>
                          p.id === panel.id
                            ? {
                                ...p,
                                layers: {
                                  ...p.layers!,
                                  bg_visible:
                                    p.layers!.bg_visible !== false
                                      ? false
                                      : true,
                                },
                              }
                            : p
                        )
                      );
                    }}
                    className={`p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer ${
                      panel.layers.bg_visible !== false
                        ? "text-[#3B82F6]"
                        : "text-neutral-600"
                    }`}
                  >
                    {panel.layers.bg_visible !== false ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Character Track */}
                <div className="flex items-center justify-between bg-neutral-900 border border-neutral-850 px-2 py-1 rounded-lg gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={panel.layers.character_url}
                      alt="Character Thumbnail"
                      className="h-8 w-8 object-contain rounded border border-neutral-850 bg-neutral-950 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="text-[10px] font-mono text-neutral-300">
                      Character
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPanels((prev) =>
                        prev.map((p) =>
                          p.id === panel.id
                            ? {
                                ...p,
                                layers: {
                                  ...p.layers!,
                                  char_visible:
                                    p.layers!.char_visible !== false
                                      ? false
                                      : true,
                                },
                              }
                            : p
                        )
                      );
                    }}
                    className={`p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer ${
                      panel.layers.char_visible !== false
                        ? "text-[#3B82F6]"
                        : "text-neutral-600"
                    }`}
                  >
                    {panel.layers.char_visible !== false ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Text Track */}
                <div className="flex items-center justify-between bg-neutral-900 border border-neutral-850 px-2 py-1 rounded-lg gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img
                      src={panel.layers.text_url}
                      alt="Text Thumbnail"
                      className="h-8 w-8 object-contain rounded border border-neutral-850 bg-neutral-950 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="text-[10px] font-mono text-neutral-300 flex-shrink-0">
                      Text Bubbles
                    </span>
                    <DialogueClipSlider panel={panel} setPanels={setPanels} />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPanels((prev) =>
                        prev.map((p) =>
                          p.id === panel.id
                            ? {
                                ...p,
                                layers: {
                                  ...p.layers!,
                                  text_visible:
                                    p.layers!.text_visible !== false
                                      ? false
                                      : true,
                                },
                              }
                            : p
                        )
                      );
                    }}
                    className={`p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer ${
                      panel.layers.text_visible !== false
                        ? "text-[#3B82F6]"
                        : "text-neutral-600"
                    }`}
                  >
                    {panel.layers.text_visible !== false ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(StoryboardCard, (prevProps, nextProps) => {
  const prevIsCurrent = prevProps.currentPanelIndex === prevProps.idx;
  const nextIsCurrent = nextProps.currentPanelIndex === nextProps.idx;
  if (prevIsCurrent !== nextIsCurrent) return false;

  const prevIsAnalyzing =
    Boolean(prevProps.panel.isAnalyzing) ||
    (prevProps.analyzingPanelId !== null &&
      String(prevProps.analyzingPanelId) === String(prevProps.panel.id));
  const nextIsAnalyzing =
    Boolean(nextProps.panel.isAnalyzing) ||
    (nextProps.analyzingPanelId !== null &&
      String(nextProps.analyzingPanelId) === String(nextProps.panel.id));
  if (prevIsAnalyzing !== nextIsAnalyzing) return false;

  return (
    prevProps.panel === nextProps.panel &&
    prevProps.idx === nextProps.idx &&
    prevProps.activePreviewTab === nextProps.activePreviewTab &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.viewLayout === nextProps.viewLayout &&
    prevProps.panelsLength === nextProps.panelsLength
  );
});
