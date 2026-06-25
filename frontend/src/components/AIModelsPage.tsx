import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Award,
  Zap,
  RefreshCw,
  Search,
  Sliders,
  Play,
  Activity,
  DollarSign,
  Key,
  Eye,
  EyeOff,
  Save,
  Trash2,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  HelpCircle,
  // Added icons for enhancements
  Scale,
  Cpu,
  History,
  Copy,
  Check,
  Sparkles,
  Languages,
  Coins,
  BarChart3,
  Download,
} from "lucide-react";

interface AIModelsPageProps {
  onNavigateHome: () => void;
  fetchWithInterceptor?: any;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  addNotification: (
    msg: string,
    type: "success" | "info" | "warning" | "error"
  ) => void;
}

export default function AIModelsPage({
  onNavigateHome,
  fetchWithInterceptor,
  selectedModel: globalSelectedModel,
  setSelectedModel: setGlobalSelectedModel,
  addNotification,
}: AIModelsPageProps) {
  const activeFetch = fetchWithInterceptor || fetch;

  // Credentials BYOK States
  const [geminiKey, setGeminiKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [huggingFaceKey, setHuggingFaceKey] = useState("");

  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [envKeys, setEnvKeys] = useState<Record<string, boolean>>({
    gemini: false,
    openai: false,
    anthropic: false,
    huggingface: false,
  });

  // Key Verification States
  const [verifyingProvider, setVerifyingProvider] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<Record<string, { success: boolean; message: string } | null>>({});

  // Model matrix & fetching states
  const [models, setModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<
    "gemini" | "huggingface" | "openai" | "anthropic"
  >("gemini");
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // Playground States
  const [playgroundModel, setPlaygroundModel] = useState<string>("");
  const [playgroundProvider, setPlaygroundProvider] = useState<string>("gemini");
  const [playgroundPrompt, setPlaygroundPrompt] = useState("Explain the concept of Webtoons in three short sentences.");
  const [isRunningPlayground, setIsRunningPlayground] = useState(false);
  const [playgroundResult, setPlaygroundResult] = useState<any | null>(null);

  // New Enhanced Features States
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<"single" | "compare" | "skills">("single");
  const [compareModelList, setCompareModelList] = useState<string[]>([]);
  const [compareResults, setCompareResults] = useState<Record<string, any>>({});
  const [isBenchmarkingCompare, setIsBenchmarkingCompare] = useState(false);

  const [selectedSkill, setSelectedSkill] = useState<string>("translation");
  const [skillInputs, setSkillInputs] = useState<Record<string, any>>({});
  const [isRunningSkill, setIsRunningSkill] = useState(false);
  const [skillOutput, setSkillOutput] = useState<any | null>(null);

  const [copiedStatus, setCopiedStatus] = useState<Record<string, boolean>>({});

  const [runHistory, setRunHistory] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("ai_playground_history") || "[]");
    } catch {
      return [];
    }
  });

  // Real Project API Token Ledger States
  const [tokenLogs, setTokenLogs] = useState<any[]>([]);
  const [loadingTokenLogs, setLoadingTokenLogs] = useState(true);
  const [tokenLogsError, setTokenLogsError] = useState<string | null>(null);

  // Calculate session statistics from runHistory
  const successfulRuns = runHistory.filter((r) => r.success);
  const totalRuns = runHistory.length;
  const avgLatency =
    successfulRuns.length > 0
      ? Math.round(
          successfulRuns.reduce((acc, curr) => acc + (curr.latencyMs || 0), 0) /
            successfulRuns.length
        )
      : 0;
  const totalCost = runHistory.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const totalTokens = runHistory.reduce(
    (acc, curr) => acc + (curr.inputTokens || 0) + (curr.outputTokens || 0),
    0
  );

  // Advanced Sliders States (persisted to localStorage)
  const [temperature, setTemperature] = useState<number>(() =>
    parseFloat(localStorage.getItem("ai_config_temperature") || "0.7")
  );
  const [topP, setTopP] = useState<number>(() =>
    parseFloat(localStorage.getItem("ai_config_topp") || "0.9")
  );
  const [maxTokens, setMaxTokens] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_config_max_tokens") || "2048")
  );
  const [systemPrompt, setSystemPrompt] = useState<string>(() =>
    localStorage.getItem("ai_config_system_prompt") ||
    "You are an AI assistant designed to help translate, narrate, and optimize webtoon comic strips for video rendering."
  );

  const checkSavedCredentials = () => {
    setSavedStatus({
      gemini: !!localStorage.getItem("user_gemini_key"),
      openai: !!localStorage.getItem("user_openai_key"),
      anthropic: !!localStorage.getItem("user_anthropic_key"),
      huggingface: !!localStorage.getItem("user_huggingface_key"),
    });
  };

  const fetchEnvKeyStatus = async () => {
    try {
      const res = await activeFetch("/api/health");
      const data = await res.json();
      if (data.success && data.env) {
        setEnvKeys({
          gemini: !!data.env.GEMINI_API_KEY,
          openai: !!data.env.OPENAI_API_KEY,
          anthropic: !!data.env.ANTHROPIC_API_KEY,
          huggingface: !!data.env.HUGGINGFACE_API_KEY,
        });
      }
    } catch (err) {
      console.error("Failed to load environment key status:", err);
    }
  };

  // Load configuration & environment key availability on mount
  useEffect(() => {
    setGeminiKey(localStorage.getItem("user_gemini_key") || "");
    setOpenAiKey(localStorage.getItem("user_openai_key") || "");
    setAnthropicKey(localStorage.getItem("user_anthropic_key") || "");
    setHuggingFaceKey(localStorage.getItem("user_huggingface_key") || "");
    checkSavedCredentials();
    fetchEnvKeyStatus();

    // Default playground model to globalSelectedModel
    setPlaygroundModel(globalSelectedModel);
    if (globalSelectedModel.includes("gpt") || globalSelectedModel.includes("o1")) {
      setPlaygroundProvider("openai");
    } else if (globalSelectedModel.includes("claude")) {
      setPlaygroundProvider("anthropic");
    } else if (globalSelectedModel.includes("huggingface") || globalSelectedModel.includes("llama")) {
      setPlaygroundProvider("huggingface");
    } else {
      setPlaygroundProvider("gemini");
    }
  }, [globalSelectedModel]);

  // Fetch real database token log analytics
  const fetchTokenLogs = async () => {
    try {
      setLoadingTokenLogs(true);
      setTokenLogsError(null);
      const token =
        localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token");
      if (!token) {
        setTokenLogs([]);
        return;
      }
      const res = await activeFetch("/api/projects/analytics/tokens", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token_logs) {
          setTokenLogs(data.token_logs);
        }
      }
    } catch (err: any) {
      console.warn("Failed to fetch backend token logs:", err.message);
      setTokenLogs([]);
    } finally {
      setLoadingTokenLogs(false);
    }
  };

  useEffect(() => {
    fetchTokenLogs();
  }, []);

  // Fetch models for the active tab
  const fetchModels = async (
    prov: "gemini" | "huggingface" | "openai" | "anthropic" = selectedProvider
  ) => {
    setLoadingModels(true);
    setModelsError(null);
    try {
      const res = await activeFetch("/api/list-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider: prov }),
      });
      const data = await res.json();
      if (data.success) {
        setModels(data.models || []);
      } else {
        setModelsError(data.error || "Failed to load models");
      }
    } catch (err: any) {
      setModelsError(err.message || "Failed to fetch models");
    } finally {
      setLoadingModels(false);
    }
  };

  // Run initial fetch on mount/tab change
  useEffect(() => {
    fetchModels(selectedProvider);
  }, [selectedProvider]);

  const handleProviderTabChange = (
    prov: "gemini" | "huggingface" | "openai" | "anthropic"
  ) => {
    setSelectedProvider(prov);
    setFilterQuery("");
    setModels([]);
  };

  // Save Credentials locally
  const handleSaveKeys = async () => {
    const keys = {
      user_gemini_key: geminiKey,
      user_openai_key: openAiKey,
      user_anthropic_key: anthropicKey,
      user_huggingface_key: huggingFaceKey,
    };

    let savedCount = 0;
    for (const [keyName, value] of Object.entries(keys)) {
      if (value.trim() === "") {
        localStorage.removeItem(keyName);
      } else {
        localStorage.setItem(keyName, value.trim());
        savedCount++;
      }
    }
    checkSavedCredentials();
    addNotification(
      `Saved ${savedCount} credentials successfully! Configuration reloaded.`,
      "success"
    );
    // Reload model list for currently selected provider
    fetchModels(selectedProvider);
  };

  const handleClearKeys = async () => {
    const confirmed = await (window as any).confirmAsync?.(
      "Are you sure you want to clear all locally stored API credentials? You will fall back to server-configured keys.",
      "Clear Keys",
      "red"
    ) || window.confirm("Clear all locally stored API keys?");

    if (!confirmed) return;

    setGeminiKey("");
    setOpenAiKey("");
    setAnthropicKey("");
    setHuggingFaceKey("");

    localStorage.removeItem("user_gemini_key");
    localStorage.removeItem("user_openai_key");
    localStorage.removeItem("user_anthropic_key");
    localStorage.removeItem("user_huggingface_key");

    checkSavedCredentials();
    addNotification("Cleared all local API keys.", "info");
    fetchModels(selectedProvider);
  };

  const handleSaveParameters = () => {
    localStorage.setItem("ai_config_temperature", String(temperature));
    localStorage.setItem("ai_config_topp", String(topP));
    localStorage.setItem("ai_config_max_tokens", String(maxTokens));
    localStorage.setItem("ai_config_system_prompt", systemPrompt);
    addNotification("Advanced model parameters updated!", "success");
  };

  // Toning Presets
  const applyPreset = (presetName: string) => {
    if (presetName === "creative") {
      setTemperature(0.95);
      setTopP(0.95);
      setMaxTokens(4096);
      setSystemPrompt(
        "You are an expert webtoon video script writer. Craft highly descriptive, vivid narratives and dramatic scripts optimized for YouTube recaps, drawing in target audiences with cinematic flow, emotional dialogue, and clear character motivations."
      );
      addNotification("Applied Creative Narration preset!", "info");
    } else if (presetName === "translation") {
      setTemperature(0.2);
      setTopP(0.3);
      setMaxTokens(2048);
      setSystemPrompt(
        "You are a professional literary translator specializing in webtoons and manga. Translate dialogue accurately, preserving original emotional nuance, idioms, character voice tone, and slang, while rendering fluid and natural localized phrasing."
      );
      addNotification("Applied Precise Translation preset!", "info");
    } else if (presetName === "json") {
      setTemperature(0.0);
      setTopP(0.1);
      setMaxTokens(1024);
      setSystemPrompt(
        "You are a precise data extractor. Analyze the input comic panels and return raw JSON data adhering STRICTLY to the requested schema. Do not write introductory, explanatory, or concluding text."
      );
      addNotification("Applied Strict JSON Extraction preset!", "info");
    } else if (presetName === "default") {
      setTemperature(0.7);
      setTopP(0.9);
      setMaxTokens(2048);
      setSystemPrompt(
        "You are an AI assistant designed to help translate, narrate, and optimize webtoon comic strips for video rendering."
      );
      addNotification("Restored default parameters!", "info");
    }
  };

  // Compare Models list toggle
  const handleToggleCompare = (modelId: string) => {
    if (compareModelList.includes(modelId)) {
      setCompareModelList(prev => prev.filter(id => id !== modelId));
      addNotification(`Removed ${modelId} from comparison list.`, "info");
    } else {
      if (compareModelList.length >= 5) {
        addNotification("Maximum 5 models can be compared simultaneously.", "warning");
        return;
      }
      setCompareModelList(prev => [...prev, modelId]);
      addNotification(`Added ${modelId} to comparison list.`, "success");
    }
  };

  // History & Session Stats Logging
  const logRunToHistory = (log: any) => {
    setRunHistory((prev) => {
      const updated = [log, ...prev].slice(0, 15);
      localStorage.setItem("ai_playground_history", JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    localStorage.removeItem("ai_playground_history");
    setRunHistory([]);
    addNotification("Cleared benchmark run history.", "info");
  };

  // Run Multi-Model Comparative Benchmark
  const runMultiModelBenchmark = async () => {
    if (compareModelList.length === 0) {
      addNotification("Please select models to compare first.", "warning");
      return;
    }

    setIsBenchmarkingCompare(true);
    setCompareResults({});
    addNotification(`Starting parallel benchmarks on ${compareModelList.length} models...`, "info");

    const promises = compareModelList.map(async (modelName) => {
      let provider = "gemini";
      if (modelName.includes("gpt") || modelName.includes("o1")) {
        provider = "openai";
      } else if (modelName.includes("claude")) {
        provider = "anthropic";
      } else if (modelName.includes("huggingface") || modelName.includes("/") || modelName.includes("llama")) {
        provider = "huggingface";
      }

      const customKey = localStorage.getItem(`user_${provider}_key`) || undefined;

      try {
        const startMonotonic = performance.now();
        const res = await activeFetch("/api/test-model-latency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            model: modelName,
            apiKey: customKey,
            prompt: playgroundPrompt,
          }),
        });
        const data = await res.json();
        const endMonotonic = performance.now();
        const elapsedMs = Math.round(endMonotonic - startMonotonic);

        if (data.success) {
          const cost = calculateEstimatedCost(provider, modelName, data.inputTokens || 0, data.outputTokens || 0);
          
          logRunToHistory({
            timestamp: new Date().toISOString(),
            model: modelName,
            provider,
            prompt: playgroundPrompt,
            latencyMs: data.latencyMs || elapsedMs,
            inputTokens: data.inputTokens || 0,
            outputTokens: data.outputTokens || 0,
            cost,
            success: true,
          });

          return {
            model: modelName,
            success: true,
            response: data.response,
            latencyMs: data.latencyMs || elapsedMs,
            inputTokens: data.inputTokens || 0,
            outputTokens: data.outputTokens || 0,
            cost,
          };
        } else {
          return {
            model: modelName,
            success: false,
            error: data.error || "Model latency test failed.",
          };
        }
      } catch (err: any) {
        return {
          model: modelName,
          success: false,
          error: err.message || "Request timed out or failed.",
        };
      }
    });

    try {
      const results = await Promise.all(promises);
      const resultsMap: Record<string, any> = {};
      results.forEach((r) => {
        resultsMap[r.model] = r;
      });
      setCompareResults(resultsMap);
      addNotification("Comparative benchmark finished!", "success");
    } catch (e: any) {
      addNotification(`Benchmark failure: ${e.message}`, "error");
    } finally {
      setIsBenchmarkingCompare(false);
    }
  };

  // Custom Skills Sandbox Config
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

  // Initialize sandbox input defaults
  useEffect(() => {
    const config = SUPPORTED_SKILLS.find(s => s.id === selectedSkill);
    if (config) {
      const defaults: Record<string, any> = {};
      config.inputs.forEach(input => {
        defaults[input.name] = input.defaultValue !== undefined ? input.defaultValue : "";
      });
      setSkillInputs(defaults);
      setSkillOutput(null);
    }
  }, [selectedSkill]);

  // Execute Skill sandbox action
  const executeSkill = async () => {
    const config = SUPPORTED_SKILLS.find(s => s.id === selectedSkill);
    if (!config) return;

    setIsRunningSkill(true);
    setSkillOutput(null);

    const modelToUse = playgroundModel || globalSelectedModel || "gemini-2.5-flash";
    let provider = "gemini";
    if (modelToUse.includes("gpt") || modelToUse.includes("o1")) {
      provider = "openai";
    } else if (modelToUse.includes("claude")) {
      provider = "anthropic";
    } else if (modelToUse.includes("huggingface") || modelToUse.includes("/") || modelToUse.includes("llama")) {
      provider = "huggingface";
    }

    const customHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const gemini = localStorage.getItem("user_gemini_key");
    const openai = localStorage.getItem("user_openai_key");
    const anthropic = localStorage.getItem("user_anthropic_key");
    const huggingface = localStorage.getItem("user_huggingface_key");
    if (gemini) customHeaders["X-User-Gemini-Key"] = gemini;
    if (openai) customHeaders["X-User-OpenAI-Key"] = openai;
    if (anthropic) customHeaders["X-User-Anthropic-Key"] = anthropic;
    if (huggingface) customHeaders["X-User-HuggingFace-Key"] = huggingface;

    const payload: Record<string, any> = {
      model: modelToUse,
    };

    config.inputs.forEach(input => {
      const val = skillInputs[input.name];
      if (input.type === "list") {
        payload[input.name] = typeof val === "string" 
          ? val.split(",").map(s => s.trim()).filter(s => s.length > 0)
          : val;
      } else if (input.type === "number") {
        payload[input.name] = parseFloat(val);
      } else {
        payload[input.name] = val;
      }
    });

    try {
      const startMonotonic = performance.now();
      const res = await activeFetch(config.endpoint, {
        method: "POST",
        headers: customHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const endMonotonic = performance.now();
      const elapsedMs = Math.round(endMonotonic - startMonotonic);

      if (res.ok && data.success) {
        setSkillOutput(data);
        
        logRunToHistory({
          timestamp: new Date().toISOString(),
          model: `Skill: ${config.name} (${modelToUse})`,
          provider,
          prompt: JSON.stringify(payload),
          latencyMs: elapsedMs,
          inputTokens: data.inputTokens || 0,
          outputTokens: data.outputTokens || 0,
          cost: calculateEstimatedCost(provider, modelToUse, data.inputTokens || 0, data.outputTokens || 0),
          success: true,
        });
        
        addNotification(`Skill '${config.name}' executed successfully.`, "success");
      } else {
        setSkillOutput({ error: data.error || data.detail || "Skill execution failed." });
        addNotification(`Skill execution failed: ${data.error || data.detail || "Error"}`, "error");
      }
    } catch (err: any) {
      setSkillOutput({ error: err.message || "Failed to contact backend." });
      addNotification(`Skill request failed: ${err.message}`, "error");
    } finally {
      setIsRunningSkill(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStatus(prev => ({ ...prev, [id]: false }));
    }, 2000);
    addNotification("Copied output to clipboard!", "success");
  };

  // Perform credentials verification test
  const verifyKey = async (provider: string, keyValue: string) => {
    if (!keyValue.trim() && !envKeys[provider]) {
      setVerificationResult((prev) => ({
        ...prev,
        [provider]: { success: false, message: "No key provided to verify." },
      }));
      return;
    }

    setVerifyingProvider(provider);
    setVerificationResult((prev) => ({ ...prev, [provider]: null }));

    // Choose default test model based on provider
    let testModel = "gemini-2.5-flash";
    if (provider === "openai") testModel = "gpt-4o-mini";
    if (provider === "anthropic") testModel = "claude-3-5-haiku-20241022";
    if (provider === "huggingface") testModel = "mistralai/Mistral-7B-Instruct-v0.2";

    try {
      const res = await activeFetch("/api/test-model-latency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model: testModel,
          apiKey: keyValue || undefined,
          prompt: "Say: OK",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVerificationResult((prev) => ({
          ...prev,
          [provider]: {
            success: true,
            message: `Key is fully operational. Dynamic response test passed in ${data.latencyMs}ms.`,
          },
        }));
      } else {
        setVerificationResult((prev) => ({
          ...prev,
          [provider]: {
            success: false,
            message: data.error || "Verification test failed. Check key validity.",
          },
        }));
      }
    } catch (err: any) {
      setVerificationResult((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          message: err.message || "Connection timeout or backend error.",
        },
      }));
    } finally {
      setVerifyingProvider(null);
    }
  };

  // Enhance / Optimize Playground Prompt
  const handleEnhancePrompt = () => {
    if (!playgroundPrompt.trim()) {
      addNotification("Please enter a short prompt to enhance.", "warning");
      return;
    }
    const enhanced = `[ROLE]
You are a developer-grade AI optimization assistant.

[TASK]
Fulfill the following instruction with strict adherence to detail, completeness, and structure.

[USER INSTRUCTION]
${playgroundPrompt}

[FORMATTING DIRECTIVE]
- Present your response in clear, structured sections.
- Use precise professional terminology.
- Provide a summary and action points if applicable.

[CONSTRAINTS]
- Do not include conversational preambles or meta-commentary.
- Focus strictly on factual, high-utility details.`;
    setPlaygroundPrompt(enhanced);
    addNotification("Enhanced prompt with structure and constraints!", "success");
  };

  // Export Token Ledger Logs to JSON
  const exportLedgerLogs = () => {
    if (tokenLogs.length === 0) {
      addNotification("No ledger logs to export.", "warning");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tokenLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `api_token_ledger_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addNotification("Exported API token ledger logs successfully!", "success");
  };

  // Export Run History to JSON
  const exportRunHistory = () => {
    if (runHistory.length === 0) {
      addNotification("No run history to export.", "warning");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(runHistory, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `playground_run_history_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addNotification("Exported benchmark run history successfully!", "success");
  };

  // Set the selected model globally in the webapp
  const handleSetActiveModel = (modelId: string) => {
    setGlobalSelectedModel(modelId);
    localStorage.setItem("ai_comic_model", modelId);
    addNotification(`Active model set to: ${modelId}`, "success");
  };

  // Run the benchmark test inside the playground
  const handleRunPlayground = async () => {
    if (!playgroundModel) {
      addNotification("Please select a model to test.", "warning");
      return;
    }

    setIsRunningPlayground(true);
    setPlaygroundResult(null);

    const customKey = localStorage.getItem(`user_${playgroundProvider}_key`) || undefined;

    try {
      const startMonotonic = performance.now();
      const res = await activeFetch("/api/test-model-latency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: playgroundProvider,
          model: playgroundModel,
          apiKey: customKey,
          prompt: playgroundPrompt,
        }),
      });
      const data = await res.json();
      const endMonotonic = performance.now();
      const elapsedMs = Math.round(endMonotonic - startMonotonic);

      if (data.success) {
        const estCost = calculateEstimatedCost(playgroundProvider, playgroundModel, data.inputTokens || 0, data.outputTokens || 0);
        setPlaygroundResult({
          success: true,
          response: data.response,
          latencyMs: data.latencyMs || elapsedMs,
          inputTokens: data.inputTokens || 0,
          outputTokens: data.outputTokens || 0,
          cost: estCost,
        });
        
        logRunToHistory({
          timestamp: new Date().toISOString(),
          model: playgroundModel,
          provider: playgroundProvider,
          prompt: playgroundPrompt,
          latencyMs: data.latencyMs || elapsedMs,
          inputTokens: data.inputTokens || 0,
          outputTokens: data.outputTokens || 0,
          cost: estCost,
          success: true,
        });
      } else {
        setPlaygroundResult({
          success: false,
          error: data.error || "Model returned an error. Check credentials or quotas.",
        });
        logRunToHistory({
          timestamp: new Date().toISOString(),
          model: playgroundModel,
          provider: playgroundProvider,
          prompt: playgroundPrompt,
          latencyMs: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          success: false,
          error: data.error || "Model returned an error.",
        });
      }
    } catch (err: any) {
      setPlaygroundResult({
        success: false,
        error: err.message || "Request timed out or failed to connect to local server.",
      });
      logRunToHistory({
        timestamp: new Date().toISOString(),
        model: playgroundModel,
        provider: playgroundProvider,
        prompt: playgroundPrompt,
        latencyMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        success: false,
        error: err.message || "Request timed out.",
      });
    } finally {
      setIsRunningPlayground(false);
    }
  };

  // Helper cost calculator
  const calculateEstimatedCost = (
    provider: string,
    modelName: string,
    inputTokens: number,
    outputTokens: number
  ): number => {
    const model = modelName.toLowerCase();
    // Pricing per 1M tokens
    let inputPrice = 0;
    let outputPrice = 0;

    if (provider === "gemini") {
      if (model.includes("pro")) {
        // Gemini 1.5/2.5 Pro pricing
        inputPrice = 1.25;
        outputPrice = 5.0;
      } else {
        // Flash/Lite free tier models
        return 0;
      }
    } else if (provider === "openai") {
      if (model.includes("gpt-4o-mini")) {
        inputPrice = 0.15;
        outputPrice = 0.6;
      } else if (model.includes("gpt-4o") || model.includes("gpt-4")) {
        inputPrice = 5.0;
        outputPrice = 15.0;
      } else {
        inputPrice = 1.0;
        outputPrice = 3.0;
      }
    } else if (provider === "anthropic") {
      if (model.includes("sonnet")) {
        inputPrice = 3.0;
        outputPrice = 15.0;
      } else if (model.includes("haiku")) {
        inputPrice = 0.8;
        outputPrice = 4.0;
      } else if (model.includes("opus")) {
        inputPrice = 15.0;
        outputPrice = 75.0;
      }
    }

    const inputCost = (inputTokens / 1000000) * inputPrice;
    const outputCost = (outputTokens / 1000000) * outputPrice;
    return inputCost + outputCost;
  };

  return (
    <div className="flex-1 bg-neutral-950 text-neutral-100 overflow-y-auto min-h-screen">
      {/* HEADER SECTION */}
      <div className="border-b border-neutral-900 bg-neutral-950/70 backdrop-blur-md sticky top-0 z-10 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:text-white transition-all cursor-pointer"
            title="Back to Workspace"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-400" />
              AI Model Control Hub
            </h1>
            <p className="text-xs text-neutral-500 font-mono">
              Manage API keys, select global models, tune settings, and benchmark latency.
            </p>
          </div>
        </div>

        {/* Currently active model pill */}
        <div className="bg-purple-950/20 border border-purple-500/20 px-4 py-2 rounded-2xl flex items-center gap-3 font-mono text-xs shadow-inner">
          <div>
            <span className="text-[9px] text-purple-400 uppercase tracking-wider block font-bold">Active System Model</span>
            <span className="text-white font-bold block mt-0.5">{globalSelectedModel}</span>
          </div>
          <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 text-[8px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-0.5">
            <Zap className="h-2.5 w-2.5 text-emerald-400 fill-emerald-400" /> Active
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        
        {/* TWO-COLUMN CONFIGURATION ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUMN 1: CREDENTIALS MANAGER */}
          <div className="bg-neutral-950/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-purple-600/5 blur-[85px] rounded-full pointer-events-none" />
            
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-neutral-900 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Key className="h-4 w-4 text-purple-400" />
                    AI Provider Credentials (BYOK)
                  </h2>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    Credentials are saved inside your local browser storage and processed client-side.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearKeys}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-455 border border-neutral-800 hover:border-rose-500/20 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" /> Clear
                  </button>
                  <button
                    onClick={handleSaveKeys}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-mono font-bold transition-all shadow-lg shadow-purple-950/30 cursor-pointer"
                  >
                    <Save className="h-3 w-3" /> Save Changes
                  </button>
                </div>
              </div>

              {/* API INPUT FIELD LIST */}
              <div className="space-y-4">
                {[
                  {
                    id: "gemini",
                    name: "Google Gemini",
                    val: geminiKey,
                    setter: setGeminiKey,
                    link: "https://aistudio.google.com/app/apikey",
                    placeholder: "e.g. AIzaSy...",
                    prefix: "AIza",
                  },
                  {
                    id: "openai",
                    name: "OpenAI",
                    val: openAiKey,
                    setter: setOpenAiKey,
                    link: "https://platform.openai.com/api-keys",
                    placeholder: "e.g. sk-proj-...",
                    prefix: "sk-",
                  },
                  {
                    id: "anthropic",
                    name: "Anthropic",
                    val: anthropicKey,
                    setter: setAnthropicKey,
                    link: "https://console.anthropic.com/settings/keys",
                    placeholder: "e.g. sk-ant-...",
                    prefix: "sk-ant",
                  },
                  {
                    id: "huggingface",
                    name: "Hugging Face",
                    val: huggingFaceKey,
                    setter: setHuggingFaceKey,
                    link: "https://huggingface.co/settings/tokens",
                    placeholder: "e.g. hf_...",
                    prefix: "hf_",
                  },
                ].map((prov) => {
                  const isSaved = savedStatus[prov.id];
                  const hasEnv = envKeys[prov.id];
                  const isInvalid = prov.val.length > 0 && !prov.val.startsWith(prov.prefix);
                  const verification = verificationResult[prov.id];

                  return (
                    <div key={prov.id} className="p-4 bg-neutral-900/30 border border-neutral-900 rounded-2xl space-y-3 font-mono">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                          {prov.name}
                        </label>
                        <div className="flex items-center gap-1.5 text-[9px]">
                          <a
                            href={prov.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors mr-2"
                          >
                            Get Key ↗
                          </a>
                          {isSaved ? (
                            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                              Stored
                            </span>
                          ) : hasEnv ? (
                            <span className="text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                              Active (Env)
                            </span>
                          ) : (
                            <span className="text-neutral-500 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded uppercase">
                              Missing
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative flex gap-2">
                        <div className="relative flex-1 group">
                          <input
                            type={showKey[prov.id] ? "text" : "password"}
                            value={prov.val}
                            onChange={(e) => prov.setter(e.target.value)}
                            placeholder={hasEnv ? "Active via backend configuration (.env)" : prov.placeholder}
                            className={`w-full pl-3 pr-10 py-2 bg-neutral-950/60 border rounded-xl text-xs text-white focus:outline-none focus:ring-1 transition-all placeholder:text-neutral-600 ${
                              isInvalid
                                ? "border-rose-500/40 focus:border-rose-500 focus:ring-rose-500/20"
                                : "border-neutral-800 focus:border-purple-500 focus:ring-purple-500/20"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(prev => ({ ...prev, [prov.id]: !prev[prov.id] }))}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
                          >
                            {showKey[prov.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        
                        <button
                          onClick={() => verifyKey(prov.id, prov.val)}
                          disabled={verifyingProvider !== null || (!prov.val.trim() && !hasEnv)}
                          className="px-3 py-2 bg-neutral-900 hover:bg-neutral-855 border border-neutral-800 text-neutral-300 rounded-xl text-[10px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                        >
                          {verifyingProvider === prov.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin text-purple-400" />
                          ) : (
                            "Verify"
                          )}
                        </button>
                      </div>

                      {/* Validation Warn / Verification Response */}
                      {isInvalid && (
                        <p className="text-[9px] text-rose-455">
                          ⚠️ Warning: Expected prefix "{prov.prefix}" not found. Key may fail.
                        </p>
                      )}
                      
                      {verification && (
                        <div className={`p-2 rounded-xl text-[9px] flex items-start gap-1.5 ${
                          verification.success 
                            ? "bg-emerald-950/30 border border-emerald-900/40 text-emerald-400" 
                            : "bg-rose-950/20 border border-rose-900/40 text-rose-400"
                        }`}>
                          {verification.success ? (
                            <CheckCircle className="h-3 w-3 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-3 w-3 shrink-0 mt-0.5" />
                          )}
                          <span>{verification.message}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUMN 2: ADVANCED GENERATION PARAMETERS */}
          <div className="bg-neutral-950/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-3/4 h-24 bg-purple-600/5 blur-[85px] rounded-full pointer-events-none" />

            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-neutral-900 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-purple-400" />
                    Advanced Generation Tuner
                  </h2>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    Configure generation presets, temperature, limits, and system prompt tuning.
                  </p>
                </div>
                <button
                  onClick={handleSaveParameters}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-mono font-bold transition-all shadow-lg shadow-purple-950/30 cursor-pointer"
                >
                  <Save className="h-3 w-3" /> Save Params
                </button>
              </div>

              {/* SLIDERS & PARAMETERS FORM */}
              <div className="space-y-5">
                
                {/* Temperature slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-neutral-300 font-bold">Temperature (Creativity)</span>
                    <span className="text-purple-400 font-bold">{temperature.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                    <span>Precise & Analytical (0.0)</span>
                    <span>Balanced (0.7)</span>
                    <span>Highly Creative (1.5)</span>
                  </div>
                </div>

                {/* Top P slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-neutral-300 font-bold">Top-P (Nucleus Sampling)</span>
                    <span className="text-purple-400 font-bold">{topP.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                    <span>Narrow Vocabulary (0.1)</span>
                    <span>Broad & Natural (1.0)</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-neutral-300 font-bold">Max Output Limit (Tokens)</span>
                    <span className="text-purple-400 font-bold">{maxTokens} tokens</span>
                  </div>
                  <input
                    type="range"
                    min="256"
                    max="8192"
                    step="256"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                    <span>Short Snippets (256)</span>
                    <span>Standard Responses (2048)</span>
                    <span>Long Narration (8192)</span>
                  </div>
                </div>

                {/* Tuning Presets */}
                <div className="space-y-2 border-t border-neutral-900 pt-4">
                  <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                    Quick-Select Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => applyPreset("creative")}
                      className="px-2 py-1.5 bg-neutral-900/60 hover:bg-purple-950/20 border border-neutral-850 hover:border-purple-500/30 rounded-xl text-[10px] text-neutral-300 font-mono font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3 text-purple-400" /> Creative Recaps
                    </button>
                    <button
                      onClick={() => applyPreset("translation")}
                      className="px-2 py-1.5 bg-neutral-900/60 hover:bg-purple-950/20 border border-neutral-850 hover:border-purple-500/30 rounded-xl text-[10px] text-neutral-300 font-mono font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer"
                    >
                      <Languages className="h-3 w-3 text-purple-400" /> Translation
                    </button>
                    <button
                      onClick={() => applyPreset("json")}
                      className="px-2 py-1.5 bg-neutral-900/60 hover:bg-purple-950/20 border border-neutral-855 hover:border-purple-500/30 rounded-xl text-[10px] text-neutral-300 font-mono font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer"
                    >
                      <Cpu className="h-3 w-3 text-purple-400" /> JSON / Strict
                    </button>
                    <button
                      onClick={() => applyPreset("default")}
                      className="px-2 py-1.5 bg-neutral-900/60 hover:bg-purple-950/20 border border-neutral-850 hover:border-purple-500/30 rounded-xl text-[10px] text-neutral-300 font-mono font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3 text-purple-400" /> Default Tuner
                    </button>
                  </div>
                </div>

                {/* System Prompt tuning */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold text-neutral-300">
                    System Instruction Override
                  </label>
                  <textarea
                    rows={4}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Provide standard instructions for the AI behavior..."
                    className="w-full p-3 bg-neutral-950/60 border border-neutral-900 rounded-2xl text-xs font-mono text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 placeholder:text-neutral-600 resize-none leading-relaxed"
                  />
                  <p className="text-[9px] text-neutral-500 leading-normal">
                    Tip: Overriding instructions forces models to conform to strict format targets, dialogue structure, or translation styles during comic compilation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE MODEL REGISTRY & SEARCH */}
        <div className="bg-neutral-950/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-purple-400" />
                  Model Registry Explorer
                </h2>
                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  Browse and filter supported vision/chat models. Highlight a model to set as active or load into benchmark playground.
                </p>
              </div>
              {models.length > 0 && (
                <span className="text-[10px] font-mono bg-purple-950/40 border border-purple-800/40 px-2.5 py-1 rounded-lg text-purple-300">
                  {models.length} Models Found
                </span>
              )}
            </div>

            {/* Provider Tabs, Search, and Free Filter */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Tabs */}
              <div className="flex bg-neutral-900/60 p-1 rounded-xl border border-neutral-850 text-xs font-mono flex-1">
                {(["gemini", "huggingface", "openai", "anthropic"] as const).map((prov) => (
                  <button
                    key={prov}
                    onClick={() => handleProviderTabChange(prov)}
                    className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer font-bold capitalize ${
                      selectedProvider === prov
                        ? "bg-purple-650 text-white"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {prov === "huggingface" ? "Hugging Face" : prov}
                  </button>
                ))}
              </div>

              {/* Search & filters */}
              <div className="flex gap-2 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="absolute inset-y-0 left-3 h-3.5 w-3.5 text-neutral-500 my-auto" />
                  <input
                    type="text"
                    placeholder={`Search ${selectedProvider === "huggingface" ? "HF" : selectedProvider} models...`}
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                {selectedProvider === "gemini" && (
                  <button
                    onClick={() => setShowFreeOnly(!showFreeOnly)}
                    className={`px-3 py-2 rounded-xl border text-xs font-mono transition-all duration-200 cursor-pointer shrink-0 ${
                      showFreeOnly
                        ? "bg-purple-950/40 text-purple-300 border-purple-500/40 font-bold"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {showFreeOnly ? "⚡ Free Tier Only" : "Show Free Only"}
                  </button>
                )}
              </div>
            </div>

            {/* List Loader / Error / Empty States */}
            {loadingModels && (
              <div className="text-center py-12 text-xs text-neutral-400 font-mono flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
                Querying {selectedProvider} dynamic capability list...
              </div>
            )}

            {!loadingModels && modelsError && (
              <div className="p-8 rounded-2xl border border-rose-500/10 bg-rose-955/10 text-rose-350 text-xs font-mono text-center space-y-2">
                <p>Failed to query API models for {selectedProvider}: {modelsError}</p>
                <button
                  onClick={() => fetchModels(selectedProvider)}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                >
                  Retry Query
                </button>
              </div>
            )}

            {!loadingModels && !modelsError && models.length === 0 && (
              <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-900/10 text-neutral-500 text-xs font-mono text-center">
                No active configurations loaded for {selectedProvider}. Ensure credentials are configured.
              </div>
            )}

            {/* Models Table */}
            {!loadingModels && !modelsError && models.length > 0 && (
              <div className="overflow-x-auto border border-neutral-900 rounded-2xl max-h-[400px] overflow-y-auto scrollbar-thin">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-[5]">
                      <th className="p-4">Model Name</th>
                      <th className="p-4">Model Identifier</th>
                      <th className="p-4">Tier / Pricing</th>
                      <th className="p-4">Token Limits</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models
                      .filter((m) => m.name.toLowerCase().includes(filterQuery.toLowerCase()))
                      .filter((m) => {
                        if (!showFreeOnly) return true;
                        if (selectedProvider !== "gemini") return true;
                        const name = m.name.toLowerCase();
                        return name.includes("flash") || name.includes("lite") || name.includes("8b");
                      })
                      .map((m, idx) => {
                        const isCurrentlyActive = globalSelectedModel === m.name;
                        const isHuggingFace = selectedProvider === "huggingface";
                        const pricingBadge = isHuggingFace
                          ? { text: "Open-Source", className: "bg-emerald-950/40 text-emerald-450 border-emerald-800/30" }
                          : selectedProvider === "gemini" && !m.name.includes("pro")
                          ? { text: "Free Tier", className: "bg-purple-950/40 text-purple-300 border-purple-800/30" }
                          : { text: "Paid Model", className: "bg-amber-950/40 text-amber-400 border-amber-800/30" };

                        return (
                          <tr key={idx} className={`border-b border-neutral-900/60 hover:bg-neutral-900/20 transition-all ${isCurrentlyActive ? "bg-purple-950/5" : ""}`}>
                            <td className="p-4 font-bold text-white max-w-[200px] truncate" title={m.displayName || m.name}>
                              {m.displayName || m.name}
                            </td>
                            <td className="p-4 text-[10px] text-neutral-400 select-all max-w-[250px] truncate" title={m.fullName || m.name}>
                              {m.name}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${pricingBadge.className}`}>
                                {pricingBadge.text}
                              </span>
                            </td>
                            <td className="p-4 text-neutral-400 text-[10px]">
                              {m.inputTokenLimit ? (
                                <span>In: {m.inputTokenLimit.toLocaleString()} | Out: {m.outputTokenLimit?.toLocaleString() || "N/A"}</span>
                              ) : (
                                <span className="text-neutral-600">Dynamic limit</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setPlaygroundModel(m.name);
                                    setPlaygroundProvider(selectedProvider);
                                    addNotification(`Loaded ${m.name} into Playground`, "info");
                                    const element = document.getElementById("playground-section");
                                    if (element) element.scrollIntoView({ behavior: "smooth" });
                                  }}
                                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-neutral-300 rounded-lg text-[10px] cursor-pointer transition-all"
                                >
                                  Test Playground
                                </button>
                                <button
                                  onClick={() => handleToggleCompare(m.name)}
                                  className={`px-2.5 py-1 border rounded-lg text-[10px] cursor-pointer transition-all flex items-center gap-1 ${
                                    compareModelList.includes(m.name)
                                      ? "bg-purple-950/60 border-purple-500/40 text-purple-300 font-bold"
                                      : "bg-neutral-900 hover:bg-neutral-855 border-neutral-855 text-neutral-400 hover:text-white"
                                  }`}
                                >
                                  {compareModelList.includes(m.name) ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-purple-400" /> Compared
                                    </>
                                  ) : (
                                    <>
                                      <Scale className="h-3.5 w-3.5" /> Compare
                                    </>
                                  )}
                                </button>
                                {isCurrentlyActive ? (
                                  <span className="bg-emerald-950/30 text-emerald-450 border border-emerald-800/30 text-[9px] font-bold px-2 py-1 rounded-lg uppercase flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Active
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSetActiveModel(m.name)}
                                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                                  >
                                    Set Active
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PLAYGROUND & EXPERIMENT TABS */}
        <div id="playground-section" className="bg-neutral-950/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
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
                      onChange={(e) => setPlaygroundModel(e.target.value)}
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
                    <div className="flex justify-end pt-0.5">
                      <button
                        onClick={handleEnhancePrompt}
                        disabled={!playgroundPrompt.trim()}
                        className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        type="button"
                      >
                        ⚡ Enhance Prompt
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
                        <TerminalIcon className="h-3.5 w-3.5 text-purple-400" /> Response Console Output
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
                            <div className="text-rose-455 p-3 rounded-xl bg-rose-950/10 border border-rose-900/30">
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
                            <DollarSign className="h-3 w-3 text-emerald-450" />
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
                    <div className="flex justify-end pt-0.5">
                      <button
                        onClick={handleEnhancePrompt}
                        disabled={!playgroundPrompt.trim()}
                        className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        type="button"
                      >
                        ⚡ Enhance Prompt
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
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-neutral-500 space-y-2 border border-neutral-900 rounded-2xl bg-neutral-950/80">
                      <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
                      <p className="animate-pulse font-mono text-[10px]">Awaiting parallel model response packets...</p>
                    </div>
                  )}

                  {!isBenchmarkingCompare && Object.keys(compareResults).length === 0 && (
                    <div className="h-full min-h-[300px] flex items-center justify-center text-neutral-650 text-center border border-neutral-900 rounded-2xl bg-neutral-950/80 p-6 leading-relaxed">
                      Select candidate models and click "Run Comparative Benchmark" to compare speed, latency, output tokens, and cost.
                    </div>
                  )}

                  {!isBenchmarkingCompare && Object.keys(compareResults).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                      {compareModelList.map((mId) => {
                        const res = compareResults[mId];
                        return (
                          <div key={mId} className="bg-neutral-900/30 border border-neutral-900 rounded-2xl flex flex-col justify-between overflow-hidden">
                            <div className="p-3 border-b border-neutral-900 bg-neutral-950/40 flex items-center justify-between">
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
                              <div className="bg-neutral-950/60 border-t border-neutral-900 grid grid-cols-3 divide-x divide-neutral-900 text-center py-2 text-[9px]">
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
                                  <span className="text-emerald-450 font-bold mt-0.5 block">${res.cost.toFixed(5)}</span>
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
                      {SUPPORTED_SKILLS.find(s => s.id === selectedSkill)?.description}
                    </p>
                  </div>

                  {/* Dynamic Inputs Form */}
                  <div className="space-y-3 pt-3 border-t border-neutral-900 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                    {SUPPORTED_SKILLS.find(s => s.id === selectedSkill)?.inputs.map((input) => (
                      <div key={input.name} className="space-y-1">
                        <label className="block text-neutral-300 font-bold text-[9px] uppercase tracking-wider">
                          {input.label}
                        </label>
                        {input.type === "textarea" ? (
                          <textarea
                            rows={3}
                            value={skillInputs[input.name] || ""}
                            onChange={(e) => setSkillInputs(prev => ({ ...prev, [input.name]: e.target.value }))}
                            placeholder={input.placeholder}
                            className="w-full p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 transition-colors resize-none text-[11px] leading-relaxed"
                          />
                        ) : input.type === "select" ? (
                          <select
                            value={skillInputs[input.name] || ""}
                            onChange={(e) => setSkillInputs(prev => ({ ...prev, [input.name]: e.target.value }))}
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
                            onChange={(e) => setSkillInputs(prev => ({ ...prev, [input.name]: e.target.value }))}
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
                  <div className="flex-1 flex flex-col bg-neutral-950/80 border border-neutral-900 rounded-2xl relative overflow-hidden">
                    <div className="bg-neutral-900/60 border-b border-neutral-900 px-4 py-2 flex items-center justify-between text-[10px]">
                      <span className="text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <TerminalIcon className="h-3.5 w-3.5 text-purple-400" /> Skill Response Output (Structured JSON)
                      </span>
                      {skillOutput && !skillOutput.error && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(skillOutput, null, 2), "skills")}
                            className="text-neutral-400 hover:text-white flex items-center gap-1 font-bold transition-colors"
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

        {/* API TOKEN LEDGER & COSTS SECTION */}
        <div className="bg-neutral-950/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-indigo-650/5 blur-[85px] rounded-full pointer-events-none" />
          
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-2xl">
                  <Coins className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    API Token Ledger & Costs
                  </h2>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    Monitor Gemini API consumption across your projects
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                { (tokenLogs.length > 0 || runHistory.some((r: any) => r.success)) && (
                  <button
                    onClick={() => {
                      const playgroundLogs = runHistory
                        .filter((r: any) => r.success)
                        .map((r: any, idx: number) => ({
                          id: `playground-${idx}-${r.timestamp}`,
                          project_id: "playground",
                          title: `Playground: ${r.model}`,
                          input_tokens: r.inputTokens || 0,
                          output_tokens: r.outputTokens || 0,
                          total_tokens: (r.inputTokens || 0) + (r.outputTokens || 0),
                          estimated_cost_usd: r.cost || 0,
                          created_at: r.timestamp,
                        }));
                      const fullLedger = [...tokenLogs, ...playgroundLogs].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullLedger, null, 2));
                      const downloadAnchor = document.createElement("a");
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `api_token_ledger_${new Date().toISOString().split('T')[0]}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      addNotification("Exported API token ledger logs successfully!", "success");
                    }}
                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold text-neutral-450"
                    title="Export Ledger logs to JSON"
                  >
                    <Download className="h-3.5 w-3.5" /> Export Logs
                  </button>
                )}
                <button
                  onClick={fetchTokenLogs}
                  disabled={loadingTokenLogs}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  title="Refresh Token Ledger"
                >
                  <RefreshCw className={`h-4 w-4 text-neutral-450 ${loadingTokenLogs ? "animate-spin text-indigo-400" : ""}`} />
                </button>
              </div>
            </div>

            {loadingTokenLogs ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-500 font-mono text-xs">
                <RefreshCw className="h-8 w-8 animate-spin mb-3 text-indigo-555" />
                <span>Loading token ledger...</span>
              </div>
            ) : (() => {
              const combinedLogs = [
                ...tokenLogs,
                ...runHistory
                  .filter((r: any) => r.success)
                  .map((r: any, idx: number) => ({
                    id: `playground-${idx}-${r.timestamp}`,
                    project_id: "playground",
                    title: `Playground: ${r.model}`,
                    input_tokens: r.inputTokens || 0,
                    output_tokens: r.outputTokens || 0,
                    total_tokens: (r.inputTokens || 0) + (r.outputTokens || 0),
                    estimated_cost_usd: r.cost || 0,
                    created_at: r.timestamp,
                  })),
              ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

              if (combinedLogs.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-neutral-600 font-mono text-xs text-center">
                    <BarChart3 className="h-12 w-12 mb-3 text-neutral-850 stroke-[1.5]" />
                    <p className="font-bold text-neutral-500">No token usage logged yet.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6 font-mono text-xs">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-900/30 border border-neutral-900 p-4 rounded-2xl relative overflow-hidden">
                      <p className="text-[9px] uppercase text-neutral-500 font-bold mb-1">
                        Total Tokens Used
                      </p>
                      <p className="text-2xl font-black text-indigo-400">
                        {combinedLogs.reduce((sum, log) => sum + log.total_tokens, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-neutral-900/30 border border-neutral-900 p-4 rounded-2xl relative overflow-hidden">
                      <p className="text-[9px] uppercase text-neutral-500 font-bold mb-1">
                        Estimated API Cost
                      </p>
                      <p className="text-2xl font-black text-emerald-400">
                        ${combinedLogs.reduce((sum, log) => sum + log.estimated_cost_usd, 0).toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown Bar Chart */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider border-b border-neutral-900 pb-2">
                      Usage by Project
                    </h3>
                    <div className="space-y-3">
                      {(() => {
                        const projectAggregates = combinedLogs.reduce((acc, log) => {
                          const key = log.project_id;
                          if (!acc[key]) {
                            acc[key] = {
                              title: log.title || log.project_id.substring(0, 8),
                              total_tokens: 0,
                              cost: 0,
                            };
                          }
                          acc[key].total_tokens += log.total_tokens;
                          acc[key].cost += log.estimated_cost_usd;
                          return acc;
                        }, {} as Record<string, { title: string; total_tokens: number; cost: number }>);

                        const chartData = Object.keys(projectAggregates).map(key => projectAggregates[key]).sort(
                          (a, b) => b.total_tokens - a.total_tokens
                        );
                        const maxTokens = Math.max(...chartData.map((d) => d.total_tokens), 1);

                        return chartData.map((d, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-neutral-350 truncate max-w-[250px] font-bold">
                                {d.title}
                              </span>
                              <span className="text-neutral-500 font-bold">
                                {d.total_tokens.toLocaleString()} tokens ($
                                {d.cost.toFixed(4)})
                              </span>
                            </div>
                            <div className="w-full bg-neutral-950 border border-neutral-900 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                                style={{
                                  width: `${(d.total_tokens / maxTokens) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Detailed Log Table */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider border-b border-neutral-900 pb-2">
                      Recent Activity Ledger
                    </h3>
                    <div className="border border-neutral-900 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto scrollbar-thin">
                      <table className="w-full text-left text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-neutral-900 border-b border-neutral-850 text-neutral-500 font-bold uppercase text-[8px] tracking-wider sticky top-0 z-[5]">
                            <th className="p-3">Date</th>
                            <th className="p-3">Project / Chapter</th>
                            <th className="p-3 text-right">Input Tokens</th>
                            <th className="p-3 text-right">Output Tokens</th>
                            <th className="p-3 text-right">Total Tokens</th>
                            <th className="p-3 text-right">Est. Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {combinedLogs.map((log, idx) => (
                            <tr key={idx} className="border-b border-neutral-900/60 hover:bg-neutral-900/10 transition-all">
                              <td className="p-3 text-neutral-500 whitespace-nowrap">
                                {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="p-3 text-white font-bold max-w-[180px] truncate" title={log.title || log.project_id}>
                                {log.title || log.project_id.substring(0, 8)}
                              </td>
                              <td className="p-3 text-right text-indigo-300 font-bold">
                                {log.input_tokens.toLocaleString()}
                              </td>
                              <td className="p-3 text-right text-purple-300 font-bold">
                                {log.output_tokens.toLocaleString()}
                              </td>
                              <td className="p-3 text-right text-cyan-300 font-bold">
                                {log.total_tokens.toLocaleString()}
                              </td>
                              <td className="p-3 text-right text-emerald-455 font-bold">
                                ${log.estimated_cost_usd.toFixed(4)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* METRICS DASHBOARD & HISTORY SECTION */}
        <div className="bg-neutral-950/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="h-4 w-4 text-purple-400" />
                  Benchmark Run Metrics & History
                </h2>
                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  Analyze session activity logs, prompt runs, estimated API expenditure, and latency averages.
                </p>
              </div>
              {runHistory.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportRunHistory}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-450 border border-neutral-800 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    title="Export Run History to JSON"
                  >
                    <Download className="h-3.5 w-3.5" /> Export History
                  </button>
                  <button
                    onClick={clearHistory}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-455 border border-neutral-800 hover:border-rose-500/20 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer"
                  >
                    Clear History
                  </button>
                </div>
              )}
            </div>

            {/* Session Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Runs", val: totalRuns, sub: "Single + Sandbox runs", color: "text-purple-400" },
                { label: "Avg Latency", val: `${avgLatency.toLocaleString()} ms`, sub: "Successful runs only", color: "text-cyan-400" },
                { label: "Est. Spend (USD)", val: `$${totalCost.toFixed(5)}`, sub: "Based on token pricing", color: "text-emerald-450" },
                { label: "Total Tokens", val: totalTokens.toLocaleString(), sub: "Input + Output volume", color: "text-amber-400" },
              ].map((stat, i) => (
                <div key={i} className="p-4 bg-neutral-900/30 border border-neutral-900 rounded-2xl font-mono text-center">
                  <span className="text-[9px] text-neutral-500 block uppercase font-bold">{stat.label}</span>
                  <span className={`text-lg font-bold block mt-1.5 ${stat.color}`}>{stat.val}</span>
                  <span className="text-[8px] text-neutral-600 block mt-1">{stat.sub}</span>
                </div>
              ))}
            </div>

            {/* Run History List */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Recent Queries Log
              </h3>
              {runHistory.length === 0 ? (
                <div className="p-6 bg-neutral-900/10 border border-neutral-900 border-dashed rounded-2xl text-center text-neutral-500 text-xs font-mono">
                  No query history recorded yet. Run a latency test or execute a skill above.
                </div>
              ) : (
                <div className="border border-neutral-900 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left font-mono text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-neutral-900 border-b border-neutral-850 text-neutral-500 font-bold uppercase text-[8px] tracking-wider sticky top-0 z-[5]">
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Model/Skill</th>
                        <th className="p-3">Inputs / Prompt</th>
                        <th className="p-3">Metrics</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runHistory.map((log, idx) => (
                        <tr key={idx} className="border-b border-neutral-900/60 hover:bg-neutral-900/10 transition-all">
                          <td className="p-3 text-neutral-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="p-3 text-white font-bold max-w-[150px] truncate" title={log.model}>
                            {log.model}
                          </td>
                          <td className="p-3 text-neutral-400 max-w-[280px] truncate" title={log.prompt}>
                            {log.prompt}
                          </td>
                          <td className="p-3 text-neutral-400 whitespace-nowrap">
                            {log.success ? (
                              <span>{log.latencyMs}ms | {log.inputTokens + log.outputTokens} tok | ${log.cost.toFixed(5)}</span>
                            ) : (
                              <span className="text-rose-500 truncate max-w-[150px] block" title={log.error}>{log.error || "Failed"}</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              log.success
                                ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                                : "bg-rose-950/40 text-rose-400 border border-rose-900/30"
                            }`}>
                              {log.success ? "Success" : "Error"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
