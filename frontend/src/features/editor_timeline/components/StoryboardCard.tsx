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
  Sliders,
  Music,
  Mic,
  MessageSquare,
  BookOpen,
  Volume2,
  Palette,
  Video,
  Clock,
  Wand2,
  Bot,
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
  analyzingPanelId: number | null;
  isAnalyzingAll?: boolean;
  handleShiftPanel: (idx: number, dir: "left" | "right") => void;
  panelsLength: number;
  handleModifySpeechText: (id: number, val: string) => void;
  handleModifyMotion: (id: number, val: string) => void;
  handleModifyDuration: (id: number, val: number) => void;
  handleModifySFX: (id: number, val: string) => void;
  handleModifyVisualDescription: (id: number, val: string) => void;
  handleModifyNarrative?: (id: number, val: string) => void;
  handleAnalyzePanel: (id: number, url: string) => void;
  handleCancelAnalysis?: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  onPanelClick?: (idx: number, panelId: number, shiftKey: boolean, ctrlOrMeta: boolean) => void;
  onPanelDoubleClick?: (idx: number, panelId: number) => void;
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

const DialogueClipSlider: React.FC<DialogueClipSliderProps> = ({ panel, setPanels }) => {
  const duration = panel.duration || 3.0;

  const dialogueMap = panel.syncMap?.dialogue_map || [];
  const currentSegment = dialogueMap[0] || {
    ocr_index: 0,
    ocr_text: panel.speech_text || "",
    whisper_text: panel.speech_text || "",
    start_time: 0.0,
    end_time: duration,
    confidence: 1.0
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
      initialEnd: endTime
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
        newStart = Math.max(0, Math.min(duration - clipDuration, dragState.initialStart + deltaT));
        newEnd = newStart + clipDuration;
      } else if (dragState.type === "left") {
        newStart = Math.max(0, Math.min(dragState.initialEnd - 0.1, dragState.initialStart + deltaT));
      } else if (dragState.type === "right") {
        newEnd = Math.max(dragState.initialStart + 0.1, Math.min(duration, dragState.initialEnd + deltaT));
      }

      setPanels((prev) =>
        prev.map((p) => {
          if (p.id !== panel.id) return p;

          const currentSyncMap = p.syncMap || { dialogue_map: [], audio_peaks: [] };
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
                confidence: 1.0
              }
            ];
          } else {
            updatedMap[0] = {
              ...updatedMap[0],
              start_time: Number(newStart.toFixed(2)),
              end_time: Number(newEnd.toFixed(2))
            };
          }

          return {
            ...p,
            syncMap: {
              ...currentSyncMap,
              dialogue_map: updatedMap
            }
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
    <div className="flex-1 max-w-[130px] flex flex-col gap-1 select-none" onClick={(e) => e.stopPropagation()}>
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
            width: `${widthPct}%`
          }}
          className="absolute top-0 bottom-0 bg-purple-600 hover:bg-purple-500/90 border-l border-r border-purple-400 rounded flex items-center justify-between group cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => handleMouseDown(e, "center")}
        >
          <div
            className="w-1.5 h-full bg-purple-400/70 hover:bg-white cursor-ew-resize flex-shrink-0"
            onMouseDown={(e) => handleMouseDown(e, "left")}
          />

          <span className="text-[7px] font-mono font-bold text-white leading-none truncate pointer-events-none px-0.5">
            {startTime.toFixed(1)}s-{endTime.toFixed(1)}s
          </span>

          <div
            className="w-1.5 h-full bg-purple-400/70 hover:bg-white cursor-ew-resize flex-shrink-0"
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
  const [activeTab, setActiveTab] = React.useState<"dialogue" | "narrative" | "sfx" | "visual">("dialogue");
  const [isTracksExpanded, setIsTracksExpanded] = React.useState(false);
  const [isMagicProcessing, setIsMagicProcessing] = React.useState(false);
  // Playback state for Narrative
  const [isNarrativePlaying, setIsNarrativePlaying] = React.useState(false);
  const [isNarrativePaused, setIsNarrativePaused] = React.useState(false);
  const narrativeAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const narrativeUtteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  // Playback state for Dialogue
  const [isDialoguePlaying, setIsDialoguePlaying] = React.useState(false);
  const [isDialoguePaused, setIsDialoguePaused] = React.useState(false);
  const dialogueAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const dialogueUtteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  // Audio & Voice Settings State synced with central AudioSettings profile
  const [selectedVoiceModel, setSelectedVoiceModel] = React.useState<string>(
    () => voiceActor || localStorage.getItem("ai_comic_voice_actor") || localStorage.getItem("ai_comic_narrator_voice") || "en-US-ChristopherNeural"
  );
  const [customSpeechRate, setCustomSpeechRate] = React.useState<number>(
    () => speechRate || parseFloat(localStorage.getItem("ai_comic_speech_rate") || "1.0") || 1.0
  );
  const [customSpeechPitch, setCustomSpeechPitch] = React.useState<number>(
    () => speechPitch || parseFloat(localStorage.getItem("ai_comic_speech_pitch") || "1.0") || 1.0
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

  const stopNarrativeAudio = React.useCallback(() => {
    if (narrativeAudioRef.current) {
      narrativeAudioRef.current.pause();
      narrativeAudioRef.current.currentTime = 0;
      narrativeAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    narrativeUtteranceRef.current = null;
    setIsNarrativePlaying(false);
    setIsNarrativePaused(false);
  }, []);

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
  }, []);

  const stopAllAudio = React.useCallback(() => {
    stopNarrativeAudio();
    stopDialogueAudio();
  }, [stopNarrativeAudio, stopDialogueAudio]);

  React.useEffect(() => {
    stopAllAudio();
    return () => {
      stopAllAudio();
    };
  }, [panel.id, stopAllAudio]);

  // Speech Synthesis fallback for Narrative Text
  const speakNarrativeFallback = React.useCallback(() => {
    const textToRead = panel.narrative || panel.speech_text || "";
    if (!textToRead.trim()) {
      addNotification?.("Please enter text in Narrative Text to hear audio preview.", "info");
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
        const selectedVoice = voices.find(v => v.name.includes(selectedVoiceModel) || v.lang.startsWith("en") || v.default) || voices[0];
        if (selectedVoice) {
          utt.voice = selectedVoice;
          utt.lang = selectedVoice.lang;
        }
      }

      utt.onstart = () => {
        setIsNarrativePlaying(true);
        setIsNarrativePaused(false);
      };
      utt.onend = () => stopNarrativeAudio();
      utt.onerror = (err) => {
        console.error("[SpeechSynthesis Narrative] error:", err);
        stopNarrativeAudio();
      };

      narrativeUtteranceRef.current = utt;
      window.speechSynthesis.speak(utt);
      setIsNarrativePlaying(true);
      setIsNarrativePaused(false);
    } else {
      addNotification?.("Speech synthesis is not supported in this browser.", "error");
    }
  }, [panel.narrative, panel.speech_text, addNotification, customSpeechRate, customSpeechPitch, selectedVoiceModel, stopNarrativeAudio]);

  // Speech Synthesis fallback for Dialogue Text
  const speakDialogueFallback = React.useCallback(() => {
    const textToRead = panel.speech_text || panel.narrative || "";
    if (!textToRead.trim()) {
      addNotification?.("Please enter dialogue text to hear audio preview.", "info");
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
        const selectedVoice = voices.find(v => v.name.includes(selectedVoiceModel) || v.lang.startsWith("en") || v.default) || voices[0];
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
        console.error("[SpeechSynthesis Dialogue] error:", err);
        stopDialogueAudio();
      };

      dialogueUtteranceRef.current = utt;
      window.speechSynthesis.speak(utt);
      setIsDialoguePlaying(true);
      setIsDialoguePaused(false);
    } else {
      addNotification?.("Speech synthesis is not supported in this browser.", "error");
    }
  }, [panel.speech_text, panel.narrative, addNotification, customSpeechRate, customSpeechPitch, selectedVoiceModel, stopDialogueAudio]);

  // Toggle Narrative Audio
  const handleToggleNarrativeAudio = () => {
    // Scenario 1: Currently Playing -> Pause
    if (isNarrativePlaying && !isNarrativePaused) {
      if (narrativeAudioRef.current) {
        narrativeAudioRef.current.pause();
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
      }
      setIsNarrativePaused(true);
      return;
    }

    // Scenario 2: Currently Paused -> Resume
    if (isNarrativePlaying && isNarrativePaused) {
      if (narrativeAudioRef.current) {
        narrativeAudioRef.current.play().catch((err) => console.error("Narrative audio resume failed:", err));
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
      setIsNarrativePaused(false);
      return;
    }

    // Scenario 3: Stopped -> Stop Dialogue audio first and start Narrative Playback
    stopAllAudio();

    const targetAudioUrl = panel.narrative_audio_url || panel.audio_url;

    if (targetAudioUrl) {
      const audio = new Audio(targetAudioUrl);
      narrativeAudioRef.current = audio;
      audio.volume = 1.0;
      audio.onended = () => stopNarrativeAudio();
      audio.onerror = (e) => {
        console.warn("Narrative audio URL failed to load, using Speech Synthesis fallback:", e);
        stopNarrativeAudio();
        speakNarrativeFallback();
      };
      audio.play()
        .then(() => {
          setIsNarrativePlaying(true);
          setIsNarrativePaused(false);
        })
        .catch((err) => {
          console.warn("Narrative audio play failed, using Speech Synthesis fallback:", err);
          stopNarrativeAudio();
          speakNarrativeFallback();
        });
    } else {
      speakNarrativeFallback();
    }
  };

  // Toggle Dialogue Audio
  const handleToggleDialogueAudio = () => {
    // Scenario 1: Currently Playing -> Pause
    if (isDialoguePlaying && !isDialoguePaused) {
      if (dialogueAudioRef.current) {
        dialogueAudioRef.current.pause();
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
      }
      setIsDialoguePaused(true);
      return;
    }

    // Scenario 2: Currently Paused -> Resume
    if (isDialoguePlaying && isDialoguePaused) {
      if (dialogueAudioRef.current) {
        dialogueAudioRef.current.play().catch((err) => console.error("Dialogue audio resume failed:", err));
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
      setIsDialoguePaused(false);
      return;
    }

    // Scenario 3: Stopped -> Stop Narrative audio first and start Dialogue Playback
    stopAllAudio();

    const targetAudioUrl = panel.audio_url || panel.speech_audio_url;

    if (targetAudioUrl) {
      const audio = new Audio(targetAudioUrl);
      dialogueAudioRef.current = audio;
      audio.volume = 1.0;
      audio.onended = () => stopDialogueAudio();
      audio.onerror = (e) => {
        console.warn("Dialogue audio URL failed to load, using Speech Synthesis fallback:", e);
        stopDialogueAudio();
        speakDialogueFallback();
      };
      audio.play()
        .then(() => {
          setIsDialoguePlaying(true);
          setIsDialoguePaused(false);
        })
        .catch((err) => {
          console.warn("Dialogue audio play failed, using Speech Synthesis fallback:", err);
          stopDialogueAudio();
          speakDialogueFallback();
        });
    } else {
      speakDialogueFallback();
    }
  };

  const isCurrent =
    idx === currentPanelIndex && activePreviewTab === "timeline";

  const handleMagicMotion = async () => {
    if (!panel.speech_text?.trim()) {
      addNotification?.("Dialogue text is required for Dialogue Sync alignment. Please type some text first.", "warning");
      return;
    }

    setIsMagicProcessing(true);
    addNotification?.("Starting Magic Motion Macro...", "info");

    try {
      // 1. Separate Layers
      addNotification?.("Step 1/3: Running AI Layer Separation...", "info");
      const layerRes = await fetchWithInterceptor(`/api/image/process-layers/${panel.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: panel.image_url }),
      });

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
        target_duration: panel.duration && panel.duration > 0 ? panel.duration : undefined,
        voice: voiceActor || undefined,
        speech_rate: speechRate,
        speech_pitch: speechPitch,
      });

      let audioUrl = null;
      // Audio may come back as a cached URL or as base64
      if (ttsRes && ttsRes.success && ttsRes.audio_url) {
        audioUrl = ttsRes.audio_url;
      } else if (ttsRes && ttsRes.success && ttsRes.audio_base64) {
        // Convert base64 to a blob URL so the player can use it
        const binary = atob(ttsRes.audio_base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        audioUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      }

      // Capture the actual audio duration from TTS (precise timing)
      const audioDuration: number =
        ttsRes && ttsRes.duration_actual_s && ttsRes.duration_actual_s > 0
          ? Math.round(ttsRes.duration_actual_s * 10) / 10
          : 0;

      // 3. Dialogue Sync Alignment (only if audio succeeded)
      let syncMapObj = null;
      if (audioUrl) {
        addNotification?.("Step 3/3: Aligning dialogue to audio playhead...", "info");
        const ocr_texts = panel.speech_text.split("\n").map((s) => s.trim()).filter(Boolean);
        const alignRes = await fetchWithInterceptor(`/api/audio/align-dialogue/${panel.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio_url: audioUrl,
            ocr_texts: ocr_texts.length > 0 ? ocr_texts : [panel.speech_text],
          }),
        });
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
                motion_type: p.motion_type && p.motion_type.trim().length > 0
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

      addNotification?.("✓ Magic Motion successfully fully configured for this panel!", "success");
    } catch (err: any) {
      console.error("[Magic Motion] macro failed:", err);
      addNotification?.(`Magic Motion macro failed: ${err.message || String(err)}`, "error");
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
        playerPos: { x: 20, y: 80 }
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
    };
  };

  return (
    <div
      className={`${
        viewLayout === "grid" ? "w-full min-w-0" : "w-[260px] sm:w-[280px] shrink-0"
      } group relative rounded-[1.5rem] overflow-hidden border p-4 space-y-3.5 transition-all duration-300 ease-out select-none outline-none backdrop-blur-xl shadow-[0_20px_50px_-30px_rgba(0,0,0,0.65)] ${(panel.isAnalyzing || analyzingPanelId === panel.id || isAnalyzingAll)
          ? "border-2 border-purple-500 bg-purple-950/30 shadow-[0_0_28px_rgba(168,85,247,0.55)] ring-1 ring-purple-400/40 scale-[1.02]"
          : isCurrent && isSelected
            ? "bg-purple-950/40 border-purple-400 ring-2 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-[1.02]"
            : isCurrent
              ? "bg-[#0c0d16]/90 border-purple-500 shadow-lg scale-[1.01]"
              : isSelected
                ? "border-purple-500 bg-purple-950/30 shadow-[0_12px_40px_-12px_rgba(168,85,247,0.35)] ring-1 ring-purple-500/20 scale-[1.02]"
                : "border-white/10 bg-[#0c0d16]/80 hover:border-purple-500/50 hover:shadow-[0_18px_40px_-20px_rgba(168,85,247,0.25)] hover:scale-[1.02] hover:-translate-y-1"
        }`}
    >
      {/* Image Thumbnail */}
      <div
        onClick={handleThumbnailClick}
        className="relative h-48 sm:h-52 rounded-2xl overflow-hidden cursor-pointer select-none bg-gradient-to-br from-neutral-950 via-[#07050d] to-neutral-950 border border-white/8 shadow-inner flex items-center justify-center p-1.5 group/thumb"
      >
        <img
          src={panel.image_url}
          alt={`Panel ${panel.id}`}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="w-full h-full object-contain object-center group-hover/thumb:scale-[1.03] transition-transform duration-300 rounded-xl"
          style={{ filter: getPanelFilterStyle(panel) }}
          onError={(e) => {
            const img = e.currentTarget;
            if (img.dataset.retried) return;
            img.dataset.retried = "1";
            const src = img.src;
            if (!src.includes("/api/proxy-image") && !src.includes("/api/image/")) {
              img.src = `/api/proxy-image?url=${encodeURIComponent(src)}`;
            } else {
              img.style.display = "none";
            }
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {(panel.isAnalyzing || analyzingPanelId === panel.id || isAnalyzingAll) && (
          <PanelAnalyzingOverlay isAnalyzingAll={isAnalyzingAll} />
        )}

        {/* Selection indicator overlay when selected */}
        {isSelected && (
          <div className="absolute inset-0 bg-purple-600/10 border-2 border-purple-500/60 rounded-xl pointer-events-none z-[5]" />
        )}

        {/* Hover hint label overlay */}
        <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
          <div className="bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-transparent text-[9px] text-purple-300 font-mono text-center pb-2 pt-5 font-bold tracking-wide">
            Click select · 2x Click player · Shift range
          </div>
        </div>

        {/* Selection checkbox - always visible on hover, prominent when selected */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className={`absolute top-2 left-2 h-6 w-6 rounded-md flex items-center justify-center z-20 transition-all duration-150 ${isSelected
              ? "bg-purple-500 border-2 border-purple-300 shadow-lg shadow-purple-500/50 scale-110"
              : "bg-black/60 border-2 border-neutral-500 hover:border-purple-400 hover:bg-purple-900/50 opacity-0 group-hover/thumb:opacity-100"
            }`}
          title={isSelected ? "Deselect panel" : "Select panel"}
        >
          {isSelected ? (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="h-2.5 w-2.5 rounded-sm bg-neutral-600" />
          )}
        </button>

        {/* Number tag */}
        <div className="absolute top-2 left-8 h-5 rounded-md bg-black/80 backdrop-blur flex items-center justify-center font-mono text-[10px] text-purple-300 font-bold border border-purple-500/30 px-2">
          #{panel.id}
        </div>

        {/* Reorder Buttons */}
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log(`[TimelineCard] Shifting panel #${panel.id} left`);
              handleShiftPanel(idx, "left");
            }}
            disabled={idx === 0}
            className="p-1 rounded-md bg-black/85 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer font-mono text-[8px] leading-none"
            title="Move Panel Left"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log(`[TimelineCard] Shifting panel #${panel.id} right`);
              handleShiftPanel(idx, "right");
            }}
            disabled={idx === panelsLength - 1}
            className="p-1 rounded-md bg-black/85 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer font-mono text-[8px] leading-none"
            title="Move Panel Right"
          >
            ▶
          </button>
        </div>

        {/* Motion overlay text */}
        {panel.motion_type && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 text-[9px] font-mono uppercase tracking-wider text-neutral-300 border border-white/8">
            {panel.motion_type}
          </div>
        )}
      </div>

      <div className="space-y-2.5 w-full">
        {/* Content Inspector Mini Tabs */}
        <div className="flex items-center justify-between gap-1.5 border-b border-neutral-850 pb-2">
          <div className="grid grid-cols-4 gap-0.5 bg-neutral-900/90 p-0.5 rounded-xl border border-neutral-800 text-[9.5px] font-mono flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab("dialogue")}
              title="Dialogue & Subtitles"
              className={`flex items-center justify-center gap-1 px-1 py-0.5 rounded-lg font-bold transition-all cursor-pointer truncate ${
                activeTab === "dialogue"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <MessageSquare className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Dialogue</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("narrative")}
              title="Narrative Voiceover"
              className={`flex items-center justify-center gap-1 px-1 py-0.5 rounded-lg font-bold transition-all cursor-pointer truncate ${
                activeTab === "narrative"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <BookOpen className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Narrative</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sfx")}
              title="Sound Effects (SFX)"
              className={`flex items-center justify-center gap-1 px-1 py-0.5 rounded-lg font-bold transition-all cursor-pointer truncate ${
                activeTab === "sfx"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Volume2 className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">SFX</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("visual")}
              title="Visual Scene Prompt"
              className={`flex items-center justify-center gap-1 px-1 py-0.5 rounded-lg font-bold transition-all cursor-pointer truncate ${
                activeTab === "visual"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Palette className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Visual</span>
            </button>
          </div>

          {/* Audio Play/Stop Preview Button for Active Text Tab */}
          {activeTab === "dialogue" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleDialogueAudio();
                }}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                  isDialoguePlaying && !isDialoguePaused
                    ? "bg-amber-950/60 border-amber-500/50 text-amber-300"
                    : "bg-purple-950/40 border-purple-800/50 text-purple-300 hover:bg-purple-900/50"
                }`}
                title="Play Dialogue Preview"
              >
                {isDialoguePlaying && !isDialoguePaused ? <Pause className="w-2 h-2 fill-current" /> : <Play className="w-2 h-2 fill-current" />}
                <span>{isDialoguePlaying && !isDialoguePaused ? "Pause" : "Play"}</span>
              </button>
              {(isDialoguePlaying || isDialoguePaused) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopDialogueAudio();
                  }}
                  className="p-1 rounded-lg text-[9px] bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/70 cursor-pointer"
                  title="Stop Dialogue"
                >
                  <Square className="w-2 h-2 fill-current" />
                </button>
              )}
            </div>
          )}

          {activeTab === "narrative" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleNarrativeAudio();
                }}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                  isNarrativePlaying && !isNarrativePaused
                    ? "bg-amber-950/60 border-amber-500/50 text-amber-300"
                    : "bg-purple-950/40 border-purple-800/50 text-purple-300 hover:bg-purple-900/50"
                }`}
                title="Play Narration Preview"
              >
                {isNarrativePlaying && !isNarrativePaused ? <Pause className="w-2 h-2 fill-current" /> : <Play className="w-2 h-2 fill-current" />}
                <span>{isNarrativePlaying && !isNarrativePaused ? "Pause" : "Play"}</span>
              </button>
              {(isNarrativePlaying || isNarrativePaused) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopNarrativeAudio();
                  }}
                  className="p-1 rounded-lg text-[9px] bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/70 cursor-pointer"
                  title="Stop Narration"
                >
                  <Square className="w-2 h-2 fill-current" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Content Panels */}
        {activeTab === "dialogue" && (
          <div className="space-y-1 animate-in fade-in duration-150">
            <textarea
              rows={2}
              disabled={panel.isAnalyzing || analyzingPanelId === panel.id}
              value={panel.speech_text}
              onChange={(e) => handleModifySpeechText(panel.id, e.target.value)}
              placeholder="Enter dialogue or subtitle text..."
              className={`w-full bg-neutral-900/90 border border-neutral-800 text-[11px] rounded-xl p-2.5 text-neutral-100 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 font-sans transition-all resize-none ${
                panel.isAnalyzing || analyzingPanelId === panel.id
                  ? "opacity-60 cursor-not-allowed border-purple-900/40 text-purple-300"
                  : "hover:border-neutral-700"
              }`}
            />
          </div>
        )}

        {activeTab === "narrative" && (
          <div className="space-y-1 animate-in fade-in duration-150">
            <textarea
              rows={2}
              disabled={panel.isAnalyzing || analyzingPanelId === panel.id}
              value={panel.narrative || ""}
              onChange={(e) => handleModifyNarrative?.(panel.id, e.target.value)}
              placeholder="Enter narrative voiceover or scene description..."
              className={`w-full bg-neutral-900/90 border border-neutral-800 text-[11px] rounded-xl p-2.5 text-neutral-100 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 font-sans transition-all resize-none ${
                panel.isAnalyzing || analyzingPanelId === panel.id
                  ? "opacity-60 cursor-not-allowed border-purple-900/40 text-purple-300"
                  : "hover:border-neutral-700"
              }`}
            />
          </div>
        )}

        {activeTab === "sfx" && (
          <div className="space-y-1 animate-in fade-in duration-150">
            <input
              type="text"
              disabled={panel.isAnalyzing || analyzingPanelId === panel.id}
              value={panel.sfx || ""}
              onChange={(e) => handleModifySFX(panel.id, e.target.value)}
              placeholder="e.g. door slam, footsteps, thunder..."
              className={`w-full bg-neutral-900/90 border border-neutral-800 text-[11px] rounded-xl px-3 py-2 text-neutral-100 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 font-sans transition-all ${
                panel.isAnalyzing || analyzingPanelId === panel.id
                  ? "opacity-60 cursor-not-allowed text-purple-300 border-purple-900/40"
                  : "hover:border-neutral-700"
              }`}
            />
          </div>
        )}

        {activeTab === "visual" && (
          <div className="space-y-1 animate-in fade-in duration-150">
            <textarea
              rows={2}
              disabled={panel.isAnalyzing || analyzingPanelId === panel.id}
              value={panel.visual_description || ""}
              onChange={(e) => handleModifyVisualDescription(panel.id, e.target.value)}
              placeholder="Describe visual scene for lighting, atmosphere..."
              className={`w-full bg-[#07050e]/90 border border-white/10 text-[11px] rounded-xl p-2.5 text-neutral-100 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 font-sans transition-all resize-none ${
                panel.isAnalyzing || analyzingPanelId === panel.id
                  ? "opacity-60 cursor-not-allowed text-purple-300 border-purple-900/40"
                  : "hover:border-white/20"
              }`}
            />
          </div>
        )}

        {/* Compact Motion & Timing Row */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/8">
          <div className="flex items-center gap-1.5 bg-[#07050e]/90 border border-white/10 rounded-xl px-2.5 py-1.5">
            <Video className="w-3 h-3 text-purple-400 shrink-0" />
            <select
              value={panel.motion_type ?? ""}
              onChange={(e) => handleModifyMotion(panel.id, e.target.value)}
              className="appearance-none bg-transparent text-[10px] font-mono text-neutral-300 w-full outline-none cursor-pointer"
            >
              <option value="" className="bg-[#0c0d16] text-neutral-300">Motion: None</option>
              <option value="zoom_in" className="bg-[#0c0d16] text-neutral-300">Zoom In</option>
              <option value="zoom_out" className="bg-[#0c0d16] text-neutral-300">Zoom Out</option>
              <option value="pan_right" className="bg-[#0c0d16] text-neutral-300">Pan Right</option>
              <option value="pan_left" className="bg-[#0c0d16] text-neutral-300">Pan Left</option>
              <option value="pan_down" className="bg-[#0c0d16] text-neutral-300">Pan Down</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#07050e]/90 border border-white/10 rounded-xl px-2.5 py-1.5">
            <Clock className="w-3 h-3 text-purple-400 shrink-0" />
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
              className="bg-transparent text-[10px] font-mono text-neutral-300 w-full outline-none text-left"
            />
            <span className="text-[9px] font-mono text-neutral-500 shrink-0">sec</span>
          </div>
        </div>

        {/* Unified 3-in-1 AI Action Toolbar */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {/* 1. Analyze Image */}
          {analyzingPanelId === panel.id ? (
            <button
              type="button"
              onClick={() => handleCancelAnalysis && handleCancelAnalysis()}
              className="py-1.5 rounded-xl border text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all bg-rose-600/20 border-rose-500/50 text-rose-300"
              title="Stop Analyzing"
            >
              <X className="h-3 w-3 text-rose-400" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={analyzingPanelId !== null && analyzingPanelId !== panel.id}
              onClick={() => handleAnalyzePanel(panel.id, panel.image_url)}
              className="py-1.5 px-1 rounded-xl border text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 text-neutral-300 hover:text-purple-300 shadow-sm active:scale-95 disabled:opacity-40"
              title="Analyze Scene with AI"
            >
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>Analyze</span>
            </button>
          )}

          {/* 2. Magic Motion */}
          {setPanels && fetchWithInterceptor ? (
            <button
              type="button"
              disabled={isMagicProcessing}
              onClick={handleMagicMotion}
              className="py-1.5 px-1 rounded-xl border border-purple-900/60 bg-purple-950/30 hover:bg-purple-900/50 text-purple-300 hover:text-purple-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-40 active:scale-95"
              title="Apply Magic Motion"
            >
              {isMagicProcessing ? (
                <RefreshCw className="h-3 w-3 animate-spin text-purple-400" />
              ) : (
                <Wand2 className="h-3 w-3 text-purple-400" />
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
              window.history.pushState({}, "", `/creative-suite/panel-assistant?idx=${idx}`);
              window.dispatchEvent(new Event("popstate"));
            }}
            className="py-1.5 px-1 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:border-purple-600/50 text-neutral-350 hover:text-purple-300 text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
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
              className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 py-1 transition-all cursor-pointer outline-none focus:outline-none"
            >
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>Multi-Layer Tracks</span>
              </div>
              {isTracksExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
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
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="text-[10px] font-mono text-neutral-300">Background</span>
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
                                bg_visible: p.layers!.bg_visible !== false ? false : true,
                              },
                            }
                            : p
                        )
                      );
                    }}
                    className={`p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer ${panel.layers.bg_visible !== false ? "text-purple-400" : "text-neutral-600"
                      }`}
                  >
                    {panel.layers.bg_visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
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
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="text-[10px] font-mono text-neutral-300">Character</span>
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
                                char_visible: p.layers!.char_visible !== false ? false : true,
                              },
                            }
                            : p
                        )
                      );
                    }}
                    className={`p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer ${panel.layers.char_visible !== false ? "text-purple-400" : "text-neutral-600"
                      }`}
                  >
                    {panel.layers.char_visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
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
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="text-[10px] font-mono text-neutral-300 flex-shrink-0">Text Bubbles</span>
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
                                text_visible: p.layers!.text_visible !== false ? false : true,
                              },
                            }
                            : p
                        )
                      );
                    }}
                    className={`p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer ${panel.layers.text_visible !== false ? "text-purple-400" : "text-neutral-600"
                      }`}
                  >
                    {panel.layers.text_visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[9px] text-neutral-500 pt-1 font-mono">
          <span>
            {panel.layers ? "Motion Comic" : "Standard Panel"}
          </span>
          <span>
            {idx + 1} / {panelsLength}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StoryboardCard, (prevProps, nextProps) => {
  return (
    prevProps.panel === nextProps.panel &&
    prevProps.idx === nextProps.idx &&
    prevProps.currentPanelIndex === nextProps.currentPanelIndex &&
    prevProps.activePreviewTab === nextProps.activePreviewTab &&
    prevProps.analyzingPanelId === nextProps.analyzingPanelId &&
    prevProps.isAnalyzingAll === nextProps.isAnalyzingAll &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.panelsLength === nextProps.panelsLength
  );
});
