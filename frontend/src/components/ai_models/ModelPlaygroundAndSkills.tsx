import React from "react";
import {
  Activity,
  RefreshCw,
  Play,
  Terminal,
  Copy,
  Check,
  HelpCircle,
  DollarSign,
  Scale,
  Sparkles,
  Languages,
} from "lucide-react";

interface ModelPlaygroundAndSkillsProps {
  activePlaygroundTab: "single" | "compare" | "skills";
  setActivePlaygroundTab: (tab: "single" | "compare" | "skills") => void;
  playgroundProvider: string;
  setPlaygroundProvider: (prov: string) => void;
  playgroundModel: string;
  setPlaygroundModel: (model: string) => void;
  playgroundPrompt: string;
  setPlaygroundPrompt: (prompt: string) => void;
  isRunningPlayground: boolean;
  playgroundResult: any | null;
  handleRunPlayground: () => Promise<void>;
  copiedStatus: Record<string, boolean>;
  copyToClipboard: (text: string, id: string) => void;
  compareModelList: string[];
  handleToggleCompare: (modelId: string) => void;
  runMultiModelBenchmark: () => Promise<void>;
  isBenchmarkingCompare: boolean;
  compareResults: Record<string, any>;
  selectedSkill: string;
  setSelectedSkill: (skillId: string) => void;
  skillInputs: Record<string, any>;
  setSkillInputs: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  isRunningSkill: boolean;
  executeSkill: () => Promise<void>;
  skillOutput: any | null;
  handleEnhancePrompt: () => void;
  isEnhancingPrompt: boolean;
}

const SUPPORTED_SKILLS = [
  {
    id: "translation",
    name: "Dialogue Translation Studio",
    endpoint: "/api/skills/translate",
    description: "Translate manga dialogue into a target language, retaining context and style.",
    inputs: [
      { name: "text", label: "Dialogue Text", type: "textarea", placeholder: "Stop right there! You won't get away with this!" },
      { name: "target_lang", label: "Target Language", type: "text", placeholder: "Japanese", defaultValue: "Japanese" },
    ],
  },
  {
    id: "dramatize",
    name: "Script Dramatization",
    endpoint: "/api/skills/dramatize",
    description: "Dramatize raw panel transcription texts based on genre and scene context.",
    inputs: [
      { name: "raw_ocr_text", label: "Raw OCR Text (Comma separated list)", type: "list", placeholder: "CRASH!, What was that?, Oh no!" },
      { name: "genre", label: "Genre", type: "text", placeholder: "Fantasy Action", defaultValue: "Fantasy Action" },
      { name: "scene_context", label: "Scene Context", type: "textarea", placeholder: "The hero breaks through the window to confront the villain." },
    ],
  },
  {
    id: "seo",
    name: "YouTube SEO Metadata Generator",
    endpoint: "/api/skills/seo",
    description: "Generate highly optimized video titles, tags, and descriptions for Webtoon recaps.",
    inputs: [
      { name: "title", label: "Webtoon Title", type: "text", placeholder: "Solo Leveling Chapter 1" },
      { name: "genre", label: "Genre", type: "text", placeholder: "Action Fantasy", defaultValue: "Action Fantasy" },
      { name: "storyboard_summary", label: "Storyboard Summary", type: "textarea", placeholder: "Jinwoo wakes up in the hospital after surviving the double dungeon..." },
    ],
  },
  {
    id: "cliffhanger",
    name: "Cliffhanger Generator",
    endpoint: "/api/skills/cliffhanger",
    description: "Suggest narrative hook variations or cliffhanger statements to boost viewer retention.",
    inputs: [
      { name: "story_outline", label: "Story Outline / Scene Summary", type: "textarea", placeholder: "The hero holds back the monster horde, but his sword cracks..." },
    ],
  },
  {
    id: "voice-cast",
    name: "Voice Casting Profiler",
    endpoint: "/api/skills/voice-cast",
    description: "Analyze characters' descriptions and suggest appropriate voice casting guides.",
    inputs: [
      { name: "character_name", label: "Character Name", type: "text", placeholder: "Jinwoo Sung" },
      { name: "visual_description", label: "Visual Description", type: "textarea", placeholder: "Tall black hair, glowing blue eyes, cold posture" },
      { name: "dialogue_sample", label: "Dialogue Sample", type: "textarea", placeholder: "I am no longer the weak Hunter I used to be." },
    ],
  },
  {
    id: "copyright-scrub",
    name: "Copyright Text Scrubber",
    endpoint: "/api/skills/copyright-scrub",
    description: "Clean up transcription errors, remove watermarks, scan/filter advertiser-unfriendly speech.",
    inputs: [
      { name: "text", label: "Transcribed Text", type: "textarea", placeholder: "Read free manga on manga-site.com - Huh? What is this?" },
    ],
  },
  {
    id: "bgm-vibe",
    name: "BGM Mood Selector",
    endpoint: "/api/skills/bgm-vibe",
    description: "Map current scene's narrative mood to background music vibe suggestions.",
    inputs: [
      { name: "narrative_mood", label: "Narrative Mood", type: "text", placeholder: "Suspenseful, dark, build-up" },
      { name: "action_scale", label: "Action Scale", type: "select", options: ["low", "medium", "high", "extreme"], defaultValue: "medium" },
    ],
  },
];

export default function ModelPlaygroundAndSkills({
  activePlaygroundTab,
  setActivePlaygroundTab,
  playgroundProvider,
  setPlaygroundProvider,
  playgroundModel,
  setPlaygroundModel,
  playgroundPrompt,
  setPlaygroundPrompt,
  isRunningPlayground,
  playgroundResult,
  handleRunPlayground,
  copiedStatus,
  copyToClipboard,
  compareModelList,
  handleToggleCompare,
  runMultiModelBenchmark,
  isBenchmarkingCompare,
  compareResults,
  selectedSkill,
  setSelectedSkill,
  skillInputs,
  setSkillInputs,
  isRunningSkill,
  executeSkill,
  skillOutput,
  handleEnhancePrompt,
  isEnhancingPrompt,
}: ModelPlaygroundAndSkillsProps) {
  const currentSkillConfig = SUPPORTED_SKILLS.find((s) => s.id === selectedSkill);

  return (
    <div id="playground-section" className="bg-neutral-955/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-900 pb-2 gap-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Model Playground & Skills Studio
            </h2>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
              Benchmark single models, compare response statistics, or interactively test raw backend AI skills.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-neutral-900/60 p-1 rounded-xl border border-neutral-850 text-xs font-mono">
            <button
              onClick={() => setActivePlaygroundTab("single")}
              className={`px-3 py-1.5 text-center rounded-lg transition-all cursor-pointer font-bold ${
                activePlaygroundTab === "single"
                  ? "bg-purple-650 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Single Test
            </button>
            <button
              onClick={() => setActivePlaygroundTab("compare")}
              className={`px-3 py-1.5 text-center rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                activePlaygroundTab === "compare"
                  ? "bg-purple-650 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Comparison Suite
              {compareModelList.length > 0 && (
                <span className="bg-purple-950/40 text-purple-300 border border-purple-800/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {compareModelList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActivePlaygroundTab("skills")}
              className={`px-3 py-1.5 text-center rounded-lg transition-all cursor-pointer font-bold ${
                activePlaygroundTab === "skills"
                  ? "bg-purple-650 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Skills Sandbox
            </button>
          </div>
        </div>

        {/* TAB VIEW 1: SINGLE MODEL BENCHMARK */}
        {activePlaygroundTab === "single" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
            {/* Left Column: Form Settings */}
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  Provider Type
                </label>
                <select
                  value={playgroundProvider}
                  onChange={(e) => {
                    setPlaygroundProvider(e.target.value);
                    setPlaygroundModel("");
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="huggingface">Hugging Face</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  Target Model ID
                </label>
                <input
                  type="text"
                  placeholder="Enter model name (e.g. gemini-2.5-flash)"
                  value={playgroundModel}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlaygroundModel(val);
                    if (val.includes("gpt") || val.includes("o1")) {
                      setPlaygroundProvider("openai");
                    } else if (val.includes("claude")) {
                      setPlaygroundProvider("anthropic");
                    } else if (val.includes("huggingface") || val.includes("/") || val.includes("llama")) {
                      setPlaygroundProvider("huggingface");
                    } else if (val.includes("gemini")) {
                      setPlaygroundProvider("gemini");
                    }
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <p className="text-[9px] text-neutral-500">
                  Type a manual identifier or select a model above to auto-populate.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    Test Prompt Input
                  </label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) setPlaygroundPrompt(val);
                    }}
                    defaultValue=""
                    className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-0.5 text-[9px] text-purple-300 font-bold focus:outline-none cursor-pointer max-w-[150px]"
                  >
                    <option value="" disabled>Prompt Presets Library</option>
                    <option value="Translate and localize the following dialogue lines into natural, character-appropriate English preserving original emotion, voice, and slang context:\n- Panel 1: (Surprised) 'N-Nani?! Ko... kore wa...!'\n- Panel 2: (Angry) 'Kono yarou... yurusanai!'">Dialogue Localization</option>
                    <option value="Analyze these visual storyboard sequence descriptions and generate appropriate cinematic sound effects (SFX) and ambient audio tracks with timestamps:\n- 0:00: Main character steps out onto a Tokyo street. Heavy neon lights.\n- 0:04: Suddenly, a large shadow crashes down from the roof.">SFX Audio Narrator</option>
                    <option value="Synthesize the provided comic episode summary into a structured 5-part script outline optimized for a YouTube video recap, highlighting hook, character arcs, and cliffhangers:\nEpisode Summary: Jinwoo and his party face the giant boss in the double dungeon. All other hunters are eliminated.">YouTube Video Outline</option>
                    <option value="Refine this raw transcription text into a highly detailed, descriptive scene description suitable for a text-to-image generator, defining lighting, camera angle, artistic style, and character pose:\nTranscript: A knight standing on a hill looking at a burning castle in the distance.">Visual Panel Description</option>
                  </select>
                </div>
                <textarea
                  rows={4}
                  value={playgroundPrompt}
                  onChange={(e) => setPlaygroundPrompt(e.target.value)}
                  placeholder="Type test instructions for the model..."
                  className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 transition-colors resize-none leading-relaxed"
                />
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancingPrompt || !playgroundPrompt.trim()}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-700/30 hover:border-indigo-500/50 text-indigo-300 hover:text-indigo-200 rounded-lg text-[9px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    type="button"
                    title="Enhance your prompt using Gemini AI into a structured professional instruction"
                  >
                    {isEnhancingPrompt ? (
                      <>
                        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                        <span>Enhancing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>⚡ Enhance Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleRunPlayground}
                disabled={isRunningPlayground || !playgroundModel.trim()}
                className="w-full py-2.5 bg-purple-650 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-950/30 cursor-pointer flex items-center justify-center gap-2"
              >
                {isRunningPlayground ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-purple-200" />
                    Testing Model Quota...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    Run Latency Test
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Console Results */}
            <div className="lg:col-span-2 flex flex-col h-full min-h-[300px]">
              <div className="flex-1 flex flex-col bg-neutral-950/80 border border-neutral-900 rounded-2xl relative overflow-hidden">
                {/* Console Header */}
                <div className="bg-neutral-900/60 border-b border-neutral-900 px-4 py-2 flex items-center justify-between text-[10px]">
                  <span className="text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-purple-400" /> Response Console Output
                  </span>
                  {playgroundResult && !playgroundResult.error && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(playgroundResult.response, "single")}
                        className="text-neutral-400 hover:text-white flex items-center gap-1 font-bold transition-colors"
                      >
                        {copiedStatus["single"] ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedStatus["single"] ? "Copied" : "Copy"}
                      </button>
                      <span className="text-emerald-450 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">
                        OK 200
                      </span>
                    </div>
                  )}
                </div>

                {/* Console Body */}
                <div className="flex-1 p-4 overflow-y-auto max-h-[320px] scrollbar-thin text-xs text-neutral-300 font-mono leading-relaxed select-text">
                  {isRunningPlayground && (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-purple-500" />
                      <p className="animate-pulse">Awaiting remote model packet...</p>
                    </div>
                  )}

                  {!isRunningPlayground && !playgroundResult && (
                    <div className="h-full flex items-center justify-center text-neutral-600 text-center">
                      Execute a latency test query to explore output statistics.
                    </div>
                  )}

                  {!isRunningPlayground && playgroundResult && (
                    <div className="space-y-4">
                      {playgroundResult.success ? (
                        <div className="whitespace-pre-wrap text-neutral-200 font-mono text-[11px] leading-relaxed">
                          {playgroundResult.response}
                        </div>
                      ) : (
                        <div className="text-rose-455 p-3 rounded-xl bg-rose-955/10 border border-rose-900/30">
                          {playgroundResult.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Console Footer Stats Panel */}
                {playgroundResult?.success && !isRunningPlayground && (
                  <div className="bg-neutral-900/40 border-t border-neutral-900 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-900 text-center text-[10px] font-mono py-2.5">
                    <div>
                      <span className="text-neutral-500 block uppercase font-bold">Latency</span>
                      <span className={`font-bold mt-0.5 block ${
                        playgroundResult.latencyMs < 1000
                          ? "text-emerald-400"
                          : playgroundResult.latencyMs < 2500
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}>{playgroundResult.latencyMs.toLocaleString()} ms</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block uppercase font-bold">Input Tokens</span>
                      <span className="text-cyan-400 font-bold mt-0.5 block">{playgroundResult.inputTokens}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block uppercase font-bold">Output Tokens</span>
                      <span className="text-cyan-400 font-bold mt-0.5 block">{playgroundResult.outputTokens}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block uppercase font-bold flex items-center justify-center gap-0.5">
                        Est. Cost <span title="Cost estimation based on standard public pricing for token volumes."><HelpCircle className="h-3 w-3 text-neutral-600 cursor-help" /></span>
                      </span>
                      <span className="text-emerald-450 font-bold mt-0.5 block flex items-center justify-center gap-0.5">
                        <DollarSign className="h-3 w-3 text-emerald-455" />
                        {playgroundResult.cost.toFixed(6)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB VIEW 2: MULTI-MODEL COMPARISON */}
        {activePlaygroundTab === "compare" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
            {/* Left Column: Config Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  Comparison Candidates ({compareModelList.length}/5)
                </label>

                {compareModelList.length === 0 ? (
                  <div className="p-6 bg-neutral-900/20 border border-neutral-900 border-dashed rounded-2xl text-center text-neutral-500 text-[10px] leading-relaxed">
                    No models added yet. Click <span className="text-purple-400 font-bold font-sans">Compare</span> on any model in the Registry Explorer above.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                    {compareModelList.map((mId) => (
                      <div key={mId} className="flex items-center justify-between px-3 py-2 bg-neutral-900/50 border border-neutral-850 rounded-xl">
                        <span className="truncate font-bold text-[10px] text-white max-w-[170px]" title={mId}>{mId}</span>
                        <button
                          onClick={() => handleToggleCompare(mId)}
                          className="text-rose-455 hover:text-rose-400 font-bold text-[9px] uppercase tracking-wide hover:underline cursor-pointer shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    Test Prompt Input
                  </label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) setPlaygroundPrompt(val);
                    }}
                    defaultValue=""
                    className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-0.5 text-[9px] text-purple-300 font-bold focus:outline-none cursor-pointer max-w-[150px]"
                  >
                    <option value="" disabled>Prompt Presets Library</option>
                    <option value="Translate and localize the following dialogue lines into natural, character-appropriate English preserving original emotion, voice, and slang context:\n- Panel 1: (Surprised) 'N-Nani?! Ko... kore wa...!'\n- Panel 2: (Angry) 'Kono yarou... yurusanai!'">Dialogue Localization</option>
                    <option value="Analyze these visual storyboard sequence descriptions and generate appropriate cinematic sound effects (SFX) and ambient audio tracks with timestamps:\n- 0:00: Main character steps out onto a Tokyo street. Heavy neon lights.\n- 0:04: Suddenly, a large shadow crashes down from the roof.">SFX Audio Narrator</option>
                    <option value="Synthesize the provided comic episode summary into a structured 5-part script outline optimized for a YouTube video recap, highlighting hook, character arcs, and cliffhangers:\nEpisode Summary: Jinwoo and his party face the giant boss in the double dungeon. All other hunters are eliminated.">YouTube Video Outline</option>
                    <option value="Refine this raw transcription text into a highly detailed, descriptive scene description suitable for a text-to-image generator, defining lighting, camera angle, artistic style, and character pose:\nTranscript: A knight standing on a hill looking at a burning castle in the distance.">Visual Panel Description</option>
                  </select>
                </div>
                <textarea
                  rows={4}
                  value={playgroundPrompt}
                  onChange={(e) => setPlaygroundPrompt(e.target.value)}
                  placeholder="Type benchmark instructions for all models..."
                  className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 transition-colors resize-none leading-relaxed"
                />
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancingPrompt || !playgroundPrompt.trim()}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-700/30 hover:border-indigo-500/50 text-indigo-300 hover:text-indigo-200 rounded-lg text-[9px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    type="button"
                    title="Enhance your prompt using Gemini AI into a structured professional instruction"
                  >
                    {isEnhancingPrompt ? (
                      <>
                        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                        <span>Enhancing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>⚡ Enhance Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={runMultiModelBenchmark}
                disabled={isBenchmarkingCompare || compareModelList.length === 0}
                className="w-full py-2.5 bg-purple-650 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-950/30 cursor-pointer flex items-center justify-center gap-2"
              >
                {isBenchmarkingCompare ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-purple-200" />
                    Comparing {compareModelList.length} Models...
                  </>
                ) : (
                  <>
                    <Scale className="h-4 w-4" />
                    Run Comparative Benchmark
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Comparative Grid */}
            <div className="lg:col-span-2">
              {isBenchmarkingCompare && (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-neutral-500 space-y-2 border border-neutral-900 rounded-2xl bg-neutral-955/80">
                  <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
                  <p className="animate-pulse font-mono text-[10px]">Awaiting parallel model response packets...</p>
                </div>
              )}

              {!isBenchmarkingCompare && Object.keys(compareResults).length === 0 && (
                <div className="h-full min-h-[300px] flex items-center justify-center text-neutral-650 text-center border border-neutral-900 rounded-2xl bg-neutral-955/80 p-6 leading-relaxed">
                  Select candidate models and click "Run Comparative Benchmark" to compare speed, latency, output tokens, and cost.
                </div>
              )}

              {!isBenchmarkingCompare && Object.keys(compareResults).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                  {compareModelList.map((mId) => {
                    const res = compareResults[mId];
                    return (
                      <div key={mId} className="bg-neutral-900/30 border border-neutral-900 rounded-2xl flex flex-col justify-between overflow-hidden">
                        <div className="p-3 border-b border-neutral-900 bg-neutral-955/40 flex items-center justify-between">
                          <div className="min-w-0">
                            <span className="text-[9px] text-purple-400 block font-bold uppercase tracking-wider">Candidate Model</span>
                            <h4 className="text-xs font-bold text-white truncate max-w-[160px]" title={mId}>{mId}</h4>
                          </div>
                          {res && (
                            <div className="flex items-center gap-1.5">
                              {res.success && (
                                <button
                                  onClick={() => copyToClipboard(res.response, mId)}
                                  className="text-neutral-500 hover:text-white transition-colors"
                                  title="Copy Output"
                                >
                                  {copiedStatus[mId] ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                </button>
                              )}
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                res.success
                                  ? "text-emerald-455 bg-emerald-500/10 border-emerald-500/20"
                                  : "text-rose-455 bg-rose-500/10 border-rose-500/20"
                              }`}>
                                {res.success ? "Success" : "Error"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 p-3 text-[11px] min-h-[120px] max-h-[180px] overflow-y-auto scrollbar-thin leading-relaxed text-neutral-350 bg-black/10">
                          {!res ? (
                            <div className="h-full flex items-center justify-center text-neutral-600">Pending benchmark...</div>
                          ) : res.success ? (
                            <p className="whitespace-pre-wrap select-text">{res.response}</p>
                          ) : (
                            <p className="text-rose-400 bg-rose-950/10 border border-rose-900/20 p-2 rounded-xl text-[10px]">{res.error}</p>
                          )}
                        </div>

                        {res?.success && (
                          <div className="bg-neutral-955/60 border-t border-neutral-900 grid grid-cols-3 divide-x divide-neutral-900 text-center py-2 text-[9px]">
                            <div>
                              <span className="text-neutral-500 block font-bold">Latency</span>
                              <span className={`font-bold mt-0.5 block ${
                                res.latencyMs < 1200 ? "text-emerald-400" : res.latencyMs < 2500 ? "text-amber-400" : "text-rose-400"
                              }`}>{res.latencyMs.toLocaleString()} ms</span>
                            </div>
                            <div>
                              <span className="text-neutral-500 block font-bold">Tokens Speed</span>
                              <span className="text-cyan-400 font-bold mt-0.5 block">
                                {res.outputTokens > 0 ? Math.round((res.outputTokens / (res.latencyMs / 1000)) * 10) / 10 : 0} t/s
                              </span>
                            </div>
                            <div>
                              <span className="text-neutral-500 block font-bold">Est. Cost</span>
                              <span className="text-emerald-455 font-bold mt-0.5 block">${res.cost.toFixed(5)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB VIEW 3: AI SKILLS SANDBOX */}
        {activePlaygroundTab === "skills" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
            {/* Left Column: Form Selector */}
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  Select AI Skill
                </label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  {SUPPORTED_SKILLS.map((sk) => (
                    <option key={sk.id} value={sk.id}>{sk.name}</option>
                  ))}
                </select>
                <p className="text-[9px] text-neutral-500 leading-normal bg-neutral-900/30 p-2 rounded-lg border border-neutral-900 mt-1.5">
                  {SUPPORTED_SKILLS.find((s) => s.id === selectedSkill)?.description}
                </p>
              </div>

              {/* Dynamic Inputs Form */}
              <div className="space-y-3 pt-3 border-t border-neutral-900 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {currentSkillConfig?.inputs.map((input) => (
                  <div key={input.name} className="space-y-1">
                    <label className="block text-neutral-300 font-bold text-[9px] uppercase tracking-wider">
                      {input.label}
                    </label>
                    {input.type === "textarea" ? (
                      <textarea
                        rows={3}
                        value={skillInputs[input.name] || ""}
                        onChange={(e) => setSkillInputs((prev) => ({ ...prev, [input.name]: e.target.value }))}
                        placeholder={input.placeholder}
                        className="w-full p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 transition-colors resize-none text-[11px] leading-relaxed"
                      />
                    ) : input.type === "select" ? (
                      <select
                        value={skillInputs[input.name] || ""}
                        onChange={(e) => setSkillInputs((prev) => ({ ...prev, [input.name]: e.target.value }))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer text-[11px]"
                      >
                        {input.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={skillInputs[input.name] || ""}
                        onChange={(e) => setSkillInputs((prev) => ({ ...prev, [input.name]: e.target.value }))}
                        placeholder={input.placeholder}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 transition-colors text-[11px]"
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={executeSkill}
                disabled={isRunningSkill}
                className="w-full py-2.5 bg-purple-650 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-950/30 cursor-pointer flex items-center justify-center gap-2"
              >
                {isRunningSkill ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-purple-200" />
                    Executing Skill...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white animate-pulse" />
                    Invoke Skill Sandbox
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Skill Output Console */}
            <div className="lg:col-span-2 flex flex-col h-full min-h-[300px]">
              <div className="flex-1 flex flex-col bg-neutral-955/80 border border-neutral-900 rounded-2xl relative overflow-hidden">
                <div className="bg-neutral-900/60 border-b border-neutral-900 px-4 py-2 flex items-center justify-between text-[10px]">
                  <span className="text-neutral-450 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-purple-400" /> Skill Response Output (Structured JSON)
                  </span>
                  {skillOutput && !skillOutput.error && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(skillOutput, null, 2), "skills")}
                        className="text-neutral-450 hover:text-white flex items-center gap-1 font-bold transition-colors"
                      >
                        {copiedStatus["skills"] ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedStatus["skills"] ? "Copied" : "Copy"}
                      </button>
                      <span className="text-emerald-450 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase font-mono">
                        OK 200
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-4 overflow-y-auto max-h-[320px] scrollbar-thin text-[11px] text-emerald-400 font-mono leading-relaxed select-text bg-black/30">
                  {isRunningSkill && (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-purple-500" />
                      <p className="animate-pulse">Awaiting backend skill response payload...</p>
                    </div>
                  )}

                  {!isRunningSkill && !skillOutput && (
                    <div className="h-full flex items-center justify-center text-neutral-605 text-center font-mono">
                      Fill parameters in the Sandbox form and execute to see structured outputs.
                    </div>
                  )}

                  {!isRunningSkill && skillOutput && (
                    <pre className={`whitespace-pre-wrap select-text ${
                      skillOutput.error ? "text-rose-455 font-mono" : "text-emerald-450 font-mono"
                    }`}>
                      {JSON.stringify(skillOutput, null, 2)}
                    </pre>
                  )}
                </div>

                {skillOutput && !skillOutput.error && !isRunningSkill && (
                  <div className="bg-neutral-900/40 border-t border-neutral-900 grid grid-cols-3 divide-x divide-neutral-900 text-center text-[9px] py-2">
                    <div>
                      <span className="text-neutral-500 block font-bold">Input Tokens</span>
                      <span className="text-cyan-400 font-bold block mt-0.5">{skillOutput.inputTokens || 0}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block font-bold">Output Tokens</span>
                      <span className="text-cyan-400 font-bold block mt-0.5">{skillOutput.outputTokens || 0}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block font-bold">Est. Cost</span>
                      <span className="text-emerald-450 font-bold block mt-0.5">
                        ${(skillOutput.cost || 0).toFixed(6)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
