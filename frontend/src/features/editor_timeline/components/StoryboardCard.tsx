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
          className="absolute top-0 bottom-0 bg-blue-600/80 hover:bg-blue-500 border-l-2 border-r-2 border-blue-400 rounded flex items-center justify-between group cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => handleMouseDown(e, "center")}
        >
          <div
            className="w-1.5 h-full bg-blue-300 hover:bg-white cursor-ew-resize flex-shrink-0"
            onMouseDown={(e) => handleMouseDown(e, "left")}
          />

          <span className="text-[7px] font-mono font-bold text-white leading-none truncate pointer-events-none px-0.5">
            {startTime.toFixed(1)}s-{endTime.toFixed(1)}s
          </span>

          <div
            className="w-1.5 h-full bg-blue-300 hover:bg-white cursor-ew-resize flex-shrink-0"
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
  const [showDetails, setShowDetails] = React.useState(false);

  const hasExtraDetails = Boolean(
    panel.speech_text?.trim() ||
    panel.sfx?.trim() ||
    panel.visual_description?.trim() ||
    panel.layers
  );

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
        `/api/v1/images/process-layers/${panel.id}`,
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
          `/api/v1/audio/align-dialogue/${panel.id}`,
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
      className={`${viewLayout === "grid"
          ? "w-full min-w-0"
          : panelsLength === 1
            ? "w-full max-w-[420px] sm:w-[380px] shrink-0"
            : "w-[85vw] max-w-[340px] sm:w-[300px] shrink-0 snap-center"
        } group relative rounded-2xl border p-3 sm:p-3.5 space-y-2.5 sm:space-y-3 transition-colors duration-150 select-none outline-none shadow-sm ${isMenuOpen ? "z-50" : "z-0"
        } ${isThisPanelAnalyzing
          ? "border-purple-500/70 bg-neutral-900 ring-1 ring-purple-500/30 shadow-lg shadow-purple-500/10"
          : currentPanelIndex === idx
            ? "border-blue-500/80 bg-neutral-900/90 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30"
            : isSelected
              ? "border-blue-500/40 bg-blue-950/20 shadow-md ring-1 ring-blue-500/20"
              : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
        }`}
    >
      {/* Image Thumbnail */}
      <div
        onClick={handleThumbnailClick}
        className={`relative ${panelsLength === 1 ? "h-64 sm:h-72" : "h-56 sm:h-64"
          } rounded-xl cursor-pointer select-none bg-neutral-950 border border-neutral-800/80 shadow-inner flex items-center justify-center p-1.5 group/thumb hover:border-neutral-700 transition-colors duration-150`}
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
                !src.includes("/api/v1/proxy/image") &&
                !src.includes("/api/proxy-image") &&
                !src.includes("/api/v1/images/") &&
                !src.includes("/media/") &&
                !src.includes("/videos/")
              ) {
                img.src = `/api/v1/proxy/image?url=${encodeURIComponent(src)}`;
              } else {
                img.style.display = "none";
              }
            }}
          />
        </div>

        {isThisPanelAnalyzing && (
          <PanelAnalyzingOverlay isAnalyzingAll={isAnalyzingAll} />
        )}

        {/* Top-Left: Index Badge & Reorder Controls */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-20">
          <div className={`px-2 py-0.5 rounded-md backdrop-blur-sm border text-[10px] font-mono transition-colors ${
            currentPanelIndex === idx
              ? "bg-blue-950/80 border-blue-500/40 text-blue-300 font-bold"
              : "bg-black/70 border-neutral-800 text-neutral-300 font-medium"
          }`}>
            #{idx + 1}
          </div>

          {/* Reorder Buttons (◀ ▶) */}
          <div className="flex items-center bg-black/70 backdrop-blur-sm rounded-md border border-neutral-800 p-0.5 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-150">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleShiftPanel(idx, "left");
              }}
              disabled={idx === 0}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer text-[10px] leading-none"
              title="Move Panel Left"
            >
              ◀
            </button>
            <div className="w-[1px] h-2.5 bg-neutral-800" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleShiftPanel(idx, "right");
              }}
              disabled={idx === panelsLength - 1}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer text-[10px] leading-none"
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
              className="p-1 rounded-md bg-black/70 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 backdrop-blur-sm transition-colors cursor-pointer flex items-center justify-center opacity-0 group-hover/thumb:opacity-100"
              title="Panel Options"
            >
              <MoreVertical className="h-3 w-3" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 w-48 bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 shadow-xl z-50 animate-in fade-in duration-100 font-sans space-y-0.5"
              >
                {/* Panel Resolution & Aspect Ratio Info */}
                {dimensions && (
                  <div className="px-2 py-1 bg-neutral-950 rounded-lg border border-neutral-800/80 flex items-center justify-between text-[9px] font-mono text-neutral-400 select-none mb-1">
                    <span>{dimensions.width} × {dimensions.height} px</span>
                    {aspectRatioLabel && (
                      <span className="text-neutral-300 font-medium">
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                >
                  <Wand2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Magic Motion</span>
                </button>

                {/* 2. Open Assistant */}
                <button
                  type="button"
                  onClick={handleOpenAssistant}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                >
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                >
                  <Mic className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Create Voice Audio</span>
                </button>

                {/* 4. Copy Dialogue */}
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copy Dialogue</span>
                </button>

                {/* 5. Duplicate Panel */}
                <button
                  type="button"
                  onClick={handleDuplicatePanel}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Duplicate Panel</span>
                </button>

                {/* Divider */}
                <div className="h-[1px] bg-neutral-800 my-1" />

                {/* 6. Delete Panel */}
                <button
                  type="button"
                  onClick={handleDeletePanel}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete Panel</span>
                </button>
              </div>
            )}
          </div>

          {/* Selection Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className={`rounded-full p-1 border transition-colors cursor-pointer ${isSelected
                ? "bg-blue-600 border-blue-500 text-white opacity-100"
                : "bg-black/70 border-neutral-700 text-neutral-400 opacity-0 group-hover/thumb:opacity-100 hover:border-neutral-500"
              }`}
            title={isSelected ? "Deselect panel" : "Select panel"}
          >
            <Check className="h-2.5 w-2.5 stroke-[3]" />
          </button>
        </div>

        {/* Motion overlay text */}
        {panel.motion_type && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-mono uppercase tracking-wider text-indigo-300 border border-indigo-500/30 z-20">
            {panel.motion_type.replace("_", " ")}
          </div>
        )}
      </div>

      <div className="space-y-2 w-full">
        {/* 1. Primary Script & Audio Editor (Narrator by default, or Details when toggled) */}
        <div className="space-y-1.5 animate-in fade-in duration-150">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-1 px-0 min-w-0">
            {/* View Mode Toggle: Narrator (Main) vs Details */}
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-neutral-800 gap-0.5 select-none shrink-0">
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer ${!showDetails
                    ? "bg-purple-950/60 text-purple-200 shadow-xs border border-purple-500/40 font-semibold"
                    : "text-neutral-400 hover:text-neutral-200"
                  }`}
                title="Story Narrator"
              >
                <Mic className="w-2.5 h-2.5 text-purple-400" />
                <span>Narrator</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer ${showDetails
                    ? "bg-blue-950/60 text-blue-200 shadow-xs border border-blue-500/40 font-semibold"
                    : "text-neutral-400 hover:text-neutral-200"
                  }`}
                title="Details: Dialogue, SFX, Scene"
              >
                <MessageSquare className="w-2.5 h-2.5 text-blue-400" />
                <span>Details</span>
                {hasExtraDetails && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 ml-0.5" />
                )}
              </button>
            </div>

            {/* Audio Synthesis & Playback Controls for active view */}
            <div className="flex items-center gap-1 shrink-0">
              {(!showDetails || activeTab === "speech") && (
                <>
                  <button
                    type="button"
                    disabled={
                      Boolean(
                        isGeneratingVoice &&
                        generatingVoiceMode === (!showDetails ? "narrative" : "speech")
                      ) || isThisPanelAnalyzing
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateVoice(false, !showDetails ? "narrative" : "speech");
                    }}
                    className="h-6 px-1.5 rounded-md text-[10px] font-medium flex items-center gap-1 border border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    title={!showDetails ? "Synthesize story narration voice" : "Synthesize speech bubble voice"}
                  >
                    {isGeneratingVoice &&
                      generatingVoiceMode === (!showDetails ? "narrative" : "speech") ? (
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-purple-400" />
                    ) : (
                      <Mic className="w-2.5 h-2.5 text-purple-400" />
                    )}
                    <span>
                      {isGeneratingVoice &&
                        generatingVoiceMode === (!showDetails ? "narrative" : "speech")
                        ? "Voicing"
                        : "Voice"}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={
                      Boolean(
                        isGeneratingVoice &&
                        generatingVoiceMode === (!showDetails ? "narrative" : "speech")
                      ) || isThisPanelAnalyzing
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleDialogueAudio(!showDetails ? "narrative" : "speech");
                    }}
                    className={`h-6 px-1.5 rounded-md text-[10px] font-medium flex items-center gap-1 border transition-colors cursor-pointer shrink-0 ${isDialoguePlaying &&
                        !isDialoguePaused &&
                        playingAudioType === (!showDetails ? "narrative" : "speech")
                        ? "bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                        : "bg-emerald-950/30 border-emerald-500/30 hover:bg-emerald-900/40 text-emerald-300 hover:text-white"
                      }`}
                    title="Play/Pause Audio"
                  >
                    {isDialoguePlaying &&
                      !isDialoguePaused &&
                      playingAudioType === (!showDetails ? "narrative" : "speech") ? (
                      <Pause className="w-2.5 h-2.5 fill-current" />
                    ) : (
                      <Play className="w-2.5 h-2.5 fill-current text-emerald-400" />
                    )}
                    <span>
                      {isDialoguePlaying &&
                        !isDialoguePaused &&
                        playingAudioType === (!showDetails ? "narrative" : "speech")
                        ? "Pause"
                        : "Play"}
                    </span>
                  </button>

                  {(isDialoguePlaying || isDialoguePaused) &&
                    playingAudioType === (!showDetails ? "narrative" : "speech") && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          stopDialogueAudio();
                        }}
                        className="h-6 w-6 rounded-md flex items-center justify-center bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:bg-rose-900/60 cursor-pointer"
                        title="Stop Audio"
                      >
                        <Square className="w-2.5 h-2.5 fill-current" />
                      </button>
                    )}
                </>
              )}
            </div>
          </div>

          {/* Body: Narrator Textarea or Details Subtab View */}
          {!showDetails ? (
            <textarea
              rows={2}
              disabled={isThisPanelAnalyzing}
              value={panel.narrative || ""}
              onChange={(e) => handleModifyNarrative?.(panel.id, e.target.value)}
              placeholder="Story narration explaining actions, atmosphere, and context..."
              className="w-full min-h-[46px] bg-neutral-900 border border-neutral-800 text-xs rounded-lg p-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-neutral-700 font-sans transition-colors resize-y leading-relaxed"
            />
          ) : (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              {/* Segmented Subtabs: Dialogue, SFX, Scene */}
              <div className="flex items-center p-0.5 rounded-lg bg-neutral-950 border border-neutral-850 gap-0.5 select-none">
                <button
                  type="button"
                  onClick={() => setActiveTab("speech")}
                  title="Speech Bubble Dialogue"
                  className={`flex-1 flex items-center justify-center gap-1 py-0.5 px-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${activeTab === "speech"
                      ? "bg-blue-950/60 text-blue-200 shadow-xs border border-blue-500/40 font-semibold"
                      : "text-neutral-400 hover:text-neutral-200"
                    }`}
                >
                  <MessageSquare className="w-3 h-3 text-blue-400 shrink-0" />
                  <span>Dialogue</span>
                  {Boolean(panel.speech_text?.trim()) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("sfx")}
                  title="Sound Effects (SFX Cue)"
                  className={`flex-1 flex items-center justify-center gap-1 py-0.5 px-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${activeTab === "sfx"
                      ? "bg-emerald-950/60 text-emerald-200 shadow-xs border border-emerald-500/40 font-semibold"
                      : "text-neutral-400 hover:text-neutral-200"
                    }`}
                >
                  <Volume2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>SFX</span>
                  {Boolean(panel.sfx?.trim()) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("visual")}
                  title="Visual Scene Prompt"
                  className={`flex-1 flex items-center justify-center gap-1 py-0.5 px-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${activeTab === "visual"
                      ? "bg-amber-950/60 text-amber-200 shadow-xs border border-amber-500/40 font-semibold"
                      : "text-neutral-400 hover:text-neutral-200"
                    }`}
                >
                  <Palette className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Scene</span>
                  {Boolean(panel.visual_description?.trim()) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
                  )}
                </button>
              </div>

              {/* Subtab Content */}
              {activeTab === "speech" && (
                <textarea
                  rows={2}
                  disabled={isThisPanelAnalyzing}
                  value={panel.speech_text || ""}
                  onChange={(e) => handleModifySpeechText(panel.id, e.target.value)}
                  placeholder="Character dialogue or speech bubbles from this panel..."
                  className="w-full min-h-[46px] bg-neutral-900 border border-neutral-800 text-xs rounded-lg p-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-blue-500/50 font-sans transition-colors resize-y leading-relaxed"
                />
              )}

              {activeTab === "sfx" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1 px-0.5">
                    <span className="text-[9px] font-mono text-emerald-400/80 uppercase tracking-wider">
                      Quick SFX
                    </span>
                    <div className="flex items-center gap-1">
                      {["BOOM", "WHOOSH", "SLASH", "STEP"].map((sfxTag) => (
                        <button
                          key={sfxTag}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const curr = (panel.sfx || "").trim();
                            const next = curr ? `${curr}, ${sfxTag}` : sfxTag;
                            handleModifySFX(panel.id, next);
                          }}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-white border border-emerald-500/20 transition-colors cursor-pointer"
                        >
                          +{sfxTag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    disabled={isThisPanelAnalyzing}
                    value={panel.sfx || ""}
                    onChange={(e) => handleModifySFX(panel.id, e.target.value)}
                    placeholder="e.g. footsteps, rain, glass shatter..."
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 text-neutral-100 placeholder-neutral-500 outline-none focus:border-emerald-500/50 font-sans transition-colors"
                  />
                </div>
              )}

              {activeTab === "visual" && (
                <textarea
                  rows={2}
                  disabled={isThisPanelAnalyzing}
                  value={panel.visual_description || ""}
                  onChange={(e) =>
                    handleModifyVisualDescription(panel.id, e.target.value)
                  }
                  placeholder="Describe scene environment, lighting, camera angle, and atmosphere..."
                  className="w-full min-h-[46px] bg-neutral-900 border border-neutral-800 text-xs rounded-lg p-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-amber-500/50 font-sans transition-colors resize-y leading-relaxed"
                />
              )}
            </div>
          )}
        </div>

        {/* 2. Motion & Timing Row */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5 select-none">
          {/* Motion Selector */}
          <div className="relative flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 hover:border-indigo-500/40 rounded-lg px-2.5 py-1 h-7.5 transition-colors cursor-pointer">
            <Video className="w-3.5 h-3.5 text-indigo-400 shrink-0 pointer-events-none" />
            <select
              value={panel.motion_type ?? ""}
              onChange={(e) => handleModifyMotion(panel.id, e.target.value)}
              className="appearance-none bg-transparent border-none p-0 pr-4 text-[11px] font-medium text-neutral-200 w-full outline-none cursor-pointer truncate"
            >
              <option value="" className="bg-neutral-900 text-neutral-200">
                Motion: None
              </option>
              <option value="zoom_in" className="bg-neutral-900 text-neutral-200">
                Zoom In
              </option>
              <option value="zoom_out" className="bg-neutral-900 text-neutral-200">
                Zoom Out
              </option>
              <option value="pan_right" className="bg-neutral-900 text-neutral-200">
                Pan Right
              </option>
              <option value="pan_left" className="bg-neutral-900 text-neutral-200">
                Pan Left
              </option>
              <option value="pan_down" className="bg-neutral-900 text-neutral-200">
                Pan Down
              </option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-500 pointer-events-none absolute right-2 shrink-0" />
          </div>

          {/* Duration Counter with Stepper */}
          <div className="flex items-center justify-between gap-1 bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 rounded-lg px-2 py-1 h-7.5 transition-colors">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 pointer-events-none" />
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
                placeholder="3.0"
                className="bg-transparent border-none p-0 text-[11px] font-mono font-medium text-neutral-100 w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[10px] font-mono text-neutral-500 shrink-0 select-none">
                sec
              </span>
            </div>
            <div className="flex items-center gap-0.5 pl-1 border-l border-neutral-800 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const current = Number(panel.duration) || 0;
                  const next = Math.max(0.5, Math.round((current - 0.5) * 10) / 10);
                  handleModifyDuration(panel.id, next);
                }}
                className="h-4 w-4 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs leading-none select-none"
                title="Decrease 0.5s"
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
                className="h-4 w-4 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs leading-none select-none"
                title="Increase 0.5s"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 3. Action Toolbar: Analyze, Magic, Details / Narrator Toggle */}
        <div className="grid grid-cols-3 gap-1 pt-0.5 select-none">
          {/* Analyze Image */}
          {isThisPanelAnalyzing ? (
            <button
              type="button"
              onClick={() => handleCancelAnalysis && handleCancelAnalysis()}
              className="h-7.5 rounded-lg border border-rose-500/50 bg-rose-950/40 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Stop Analyzing"
            >
              <X className="h-3.5 w-3.5 text-rose-400" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={
                analyzingPanelId !== null && String(analyzingPanelId) !== String(panel.id)
              }
              onClick={() => handleAnalyzePanel(panel.id, panel.image_url)}
              className="h-7.5 rounded-lg border border-blue-500/30 bg-blue-950/30 hover:bg-blue-900/40 text-blue-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 outline-none focus:outline-none focus:ring-0"
              title="Analyze Scene"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>Analyze</span>
            </button>
          )}

          {/* Magic Motion */}
          {setPanels && fetchWithInterceptor ? (
            <button
              type="button"
              disabled={isMagicProcessing}
              onClick={handleMagicMotion}
              className="h-7.5 rounded-lg border border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 outline-none focus:outline-none focus:ring-0"
              title="Magic Motion"
            >
              {isMagicProcessing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-300" />
              ) : (
                <Wand2 className="h-3.5 w-3.5 text-purple-400" />
              )}
              <span>{isMagicProcessing ? "Magic..." : "Magic"}</span>
            </button>
          ) : (
            <div />
          )}

          {/* AI Panel Assistant */}
          <button
            type="button"
            onClick={handleOpenAssistant}
            className="h-7.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors outline-none focus:outline-none focus:ring-0"
            title="Open AI Panel Assistant"
          >
            <Bot className="h-3.5 w-3.5 text-emerald-400" />
            <span>AI Asset</span>
          </button>
        </div>

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
