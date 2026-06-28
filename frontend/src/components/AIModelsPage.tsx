import React, { useState, useEffect } from "react";
import { ArrowLeft, Award, Zap } from "lucide-react";
import * as api from "../api/index.js";

import CredentialsAndTuner from "./ai_models/CredentialsAndTuner";
import ModelRegistryExplorer from "./ai_models/ModelRegistryExplorer";
import ModelPlaygroundAndSkills from "./ai_models/ModelPlaygroundAndSkills";
import APITokenLedgerAndCosts from "./ai_models/APITokenLedgerAndCosts";
import BenchmarkRunHistory from "./ai_models/BenchmarkRunHistory";

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
  const [verifyingProvider, setVerifyingProvider] = useState<string | null>(
    null
  );
  const [verificationResult, setVerificationResult] = useState<
    Record<string, { success: boolean; message: string } | null>
  >({});

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
  const [playgroundProvider, setPlaygroundProvider] =
    useState<string>("gemini");
  const [playgroundPrompt, setPlaygroundPrompt] = useState(
    "Explain the concept of Webtoons in three short sentences."
  );
  const [isRunningPlayground, setIsRunningPlayground] = useState(false);
  const [playgroundResult, setPlaygroundResult] = useState<any | null>(null);

  // New Enhanced Features States
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<
    "single" | "compare" | "skills"
  >("single");
  const [compareModelList, setCompareModelList] = useState<string[]>([]);
  const [compareResults, setCompareResults] = useState<Record<string, any>>({});
  const [isBenchmarkingCompare, setIsBenchmarkingCompare] = useState(false);

  const [selectedSkill, setSelectedSkill] = useState<string>("translation");
  const [skillInputs, setSkillInputs] = useState<Record<string, any>>({});
  const [isRunningSkill, setIsRunningSkill] = useState(false);
  const [skillOutput, setSkillOutput] = useState<any | null>(null);

  const [copiedStatus, setCopiedStatus] = useState<Record<string, boolean>>({});
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

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
  const [systemPrompt, setSystemPrompt] = useState<string>(
    () =>
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
      const data = await api.checkHealth();
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
    if (
      globalSelectedModel.includes("gpt") ||
      globalSelectedModel.includes("o1")
    ) {
      setPlaygroundProvider("openai");
    } else if (globalSelectedModel.includes("claude")) {
      setPlaygroundProvider("anthropic");
    } else if (
      globalSelectedModel.includes("huggingface") ||
      globalSelectedModel.includes("/") ||
      globalSelectedModel.includes("llama")
    ) {
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
      const data = await api.getProjectTokenAnalytics(token);
      if (data) {
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
      const data = await api.listModels(activeFetch, { provider: prov });
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
    const confirmed =
      (await (window as any).confirmAsync?.(
        "Are you sure you want to clear all locally stored API credentials? You will fall back to server-configured keys.",
        "Clear Keys",
        "red"
      )) || window.confirm("Clear all locally stored API keys?");

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
      setCompareModelList((prev) => prev.filter((id) => id !== modelId));
      addNotification(`Removed ${modelId} from comparison list.`, "info");
    } else {
      if (compareModelList.length >= 5) {
        addNotification(
          "Maximum 5 models can be compared simultaneously.",
          "warning"
        );
        return;
      }
      setCompareModelList((prev) => [...prev, modelId]);
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
    addNotification(
      `Starting parallel benchmarks on ${compareModelList.length} models...`,
      "info"
    );

    const promises = compareModelList.map(async (modelName) => {
      let provider = "gemini";
      if (modelName.includes("gpt") || modelName.includes("o1")) {
        provider = "openai";
      } else if (modelName.includes("claude")) {
        provider = "anthropic";
      } else if (
        modelName.includes("huggingface") ||
        modelName.includes("/") ||
        modelName.includes("llama")
      ) {
        provider = "huggingface";
      }

      const customKey =
        localStorage.getItem(`user_${provider}_key`) || undefined;

      try {
        const startMonotonic = performance.now();
        const data = await api.testModelLatency(activeFetch, {
          provider,
          model: modelName,
          apiKey: customKey,
          prompt: playgroundPrompt,
        });
        const endMonotonic = performance.now();
        const elapsedMs = Math.round(endMonotonic - startMonotonic);

        if (data.success) {
          const cost = calculateEstimatedCost(
            provider,
            modelName,
            data.inputTokens || 0,
            data.outputTokens || 0
          );

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

  // Execute Skill sandbox action
  const executeSkill = async () => {
    const config = [
      {
        id: "translation",
        endpoint: "/api/skills/translate",
        name: "Dialogue Translation Studio",
        inputs: [{ name: "text" }, { name: "target_lang" }],
      },
      {
        id: "dramatize",
        endpoint: "/api/skills/dramatize",
        name: "Script Dramatization",
        inputs: [
          { name: "raw_ocr_text" },
          { name: "genre" },
          { name: "scene_context" },
        ],
      },
      {
        id: "seo",
        endpoint: "/api/skills/seo",
        name: "YouTube SEO Metadata Generator",
        inputs: [
          { name: "title" },
          { name: "genre" },
          { name: "storyboard_summary" },
        ],
      },
      {
        id: "cliffhanger",
        endpoint: "/api/skills/cliffhanger",
        name: "Cliffhanger Generator",
        inputs: [{ name: "story_outline" }],
      },
      {
        id: "voice-cast",
        endpoint: "/api/skills/voice-cast",
        name: "Voice Casting Profiler",
        inputs: [
          { name: "character_name" },
          { name: "visual_description" },
          { name: "dialogue_sample" },
        ],
      },
      {
        id: "copyright-scrub",
        endpoint: "/api/skills/copyright-scrub",
        name: "Copyright Text Scrubber",
        inputs: [{ name: "text" }],
      },
      {
        id: "bgm-vibe",
        endpoint: "/api/skills/bgm-vibe",
        name: "BGM Mood Selector",
        inputs: [{ name: "narrative_mood" }, { name: "action_scale" }],
      },
      {
        id: "translation",
        endpoint: api.SKILL_ENDPOINTS.TRANSLATE,
        name: "Dialogue Translation Studio",
        inputs: [{ name: "text" }, { name: "target_lang" }],
      },
      {
        id: "dramatize",
        endpoint: api.SKILL_ENDPOINTS.DRAMATIZE,
        name: "Script Dramatization",
        inputs: [
          { name: "raw_ocr_text" },
          { name: "genre" },
          { name: "scene_context" },
        ],
      },
      {
        id: "seo",
        endpoint: api.SKILL_ENDPOINTS.SEO,
        name: "YouTube SEO Metadata Generator",
        inputs: [
          { name: "title" },
          { name: "genre" },
          { name: "storyboard_summary" },
        ],
      },
      {
        id: "cliffhanger",
        endpoint: api.SKILL_ENDPOINTS.CLIFFHANGER,
        name: "Cliffhanger Generator",
        inputs: [{ name: "story_outline" }],
      },
      {
        id: "voice-cast",
        endpoint: api.SKILL_ENDPOINTS.VOICE_CAST,
        name: "Voice Casting Profiler",
        inputs: [
          { name: "character_name" },
          { name: "visual_description" },
          { name: "dialogue_sample" },
        ],
      },
      {
        id: "copyright-scrub",
        endpoint: api.SKILL_ENDPOINTS.COPYRIGHT_SCRUB,
        name: "Copyright Text Scrubber",
        inputs: [{ name: "text" }],
      },
      {
        id: "bgm-vibe",
        endpoint: api.SKILL_ENDPOINTS.BGM_VIBE,
        name: "BGM Mood Selector",
        inputs: [{ name: "narrative_mood" }, { name: "action_scale" }],
      },
    ].find((s) => s.id === selectedSkill);
    if (!config) return;

    setIsRunningSkill(true);
    setSkillOutput(null);

    const modelToUse =
      playgroundModel || globalSelectedModel || "gemini-2.5-flash";
    let provider = "gemini";
    if (modelToUse.includes("gpt") || modelToUse.includes("o1")) {
      provider = "openai";
    } else if (modelToUse.includes("claude")) {
      provider = "anthropic";
    } else if (
      modelToUse.includes("huggingface") ||
      modelToUse.includes("/") ||
      modelToUse.includes("llama")
    ) {
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

    config.inputs.forEach((input) => {
      const val = skillInputs[input.name];
      if (input.name === "raw_ocr_text" && typeof val === "string") {
        payload[input.name] = val
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      } else {
        payload[input.name] = val;
      }
    });

    try {
      const startMonotonic = performance.now();
      const data = await api.executeSkill(
        activeFetch,
        config.endpoint,
        payload,
        {
          headers: customHeaders,
        }
      );
      const endMonotonic = performance.now();
      const elapsedMs = Math.round(endMonotonic - startMonotonic);

      if (data.success) {
        setSkillOutput(data);

        logRunToHistory({
          timestamp: new Date().toISOString(),
          model: `Skill: ${config.name} (${modelToUse})`,
          provider,
          prompt: JSON.stringify(payload),
          latencyMs: elapsedMs,
          inputTokens: data.inputTokens || 0,
          outputTokens: data.outputTokens || 0,
          cost: calculateEstimatedCost(
            provider,
            modelToUse,
            data.inputTokens || 0,
            data.outputTokens || 0
          ),
          success: true,
        });

        addNotification(
          `Skill '${config.name}' executed successfully.`,
          "success"
        );
      } else {
        setSkillOutput({
          error: data.error || data.detail || "Skill execution failed.",
        });
        addNotification(
          `Skill execution failed: ${data.error || data.detail || "Error"}`,
          "error"
        );
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
    setCopiedStatus((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStatus((prev) => ({ ...prev, [id]: false }));
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
    if (provider === "huggingface")
      testModel = "mistralai/Mistral-7B-Instruct-v0.2";

    try {
      const data = await api.testModelLatency(activeFetch, {
        provider,
        model: testModel,
        apiKey: keyValue || undefined,
        prompt: "Say: OK",
      });
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
            message:
              data.error || "Verification test failed. Check key validity.",
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
  const handleEnhancePrompt = async () => {
    if (!playgroundPrompt.trim()) {
      addNotification("Please enter a short prompt to enhance.", "warning");
      return;
    }

    setIsEnhancingPrompt(true);
    addNotification("Enhancing prompt with Gemini AI...", "info");

    // Always use Gemini for prompt enhancement (most reliable)
    const geminiKey = localStorage.getItem("user_gemini_key") || undefined;
    const enhanceModel =
      playgroundProvider === "gemini" && playgroundModel
        ? playgroundModel
        : "gemini-2.5-flash";

    try {
      const data = await api.enhancePrompt(
        activeFetch,
        {
          prompt: playgroundPrompt,
          model: enhanceModel,
          apiKey: geminiKey,
        },
        geminiKey ? { headers: { "X-User-Gemini-Key": geminiKey } } : {}
      );
      if (data.success && data.enhanced_prompt) {
        setPlaygroundPrompt(data.enhanced_prompt.trim());
        addNotification(
          "✨ Prompt enhanced successfully using Gemini AI!",
          "success"
        );
      } else {
        throw new Error(data.error || "Prompt enhancement returned no result.");
      }
    } catch (err: any) {
      console.warn(
        "AI prompt enhancement failed, falling back to template:",
        err.message
      );
      // Fallback to static template so the button is always useful
      const enhanced = `[ROLE]
You are a developer-grade AI optimization assistant specialized in webtoon content analysis and narrative generation.

[TASK]
Fulfill the following instruction with strict adherence to detail, completeness, and structure.

[USER INSTRUCTION]
${playgroundPrompt}

[OUTPUT FORMAT]
- Present your response in clear, structured sections.
- Use precise professional terminology.
- Provide a summary and action points if applicable.

[CONSTRAINTS]
- Do not include conversational preambles or meta-commentary.
- Focus strictly on factual, high-utility details.
- Keep the response concise yet comprehensive.`;
      setPlaygroundPrompt(enhanced);
      addNotification(
        "Enhanced prompt using structured template (AI offline).",
        "info"
      );
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Export Run History to JSON
  const exportRunHistory = () => {
    if (runHistory.length === 0) {
      addNotification("No run history to export.", "warning");
      return;
    }
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(runHistory, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `playground_run_history_${new Date().toISOString().split("T")[0]}.json`
    );
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

    const customKey =
      localStorage.getItem(`user_${playgroundProvider}_key`) || undefined;

    try {
      const startMonotonic = performance.now();
      const data = await api.testModelLatency(activeFetch, {
        provider: playgroundProvider,
        model: playgroundModel,
        apiKey: customKey,
        prompt: playgroundPrompt,
      });
      const endMonotonic = performance.now();
      const elapsedMs = Math.round(endMonotonic - startMonotonic);

      if (data.success) {
        const estCost = calculateEstimatedCost(
          playgroundProvider,
          playgroundModel,
          data.inputTokens || 0,
          data.outputTokens || 0
        );
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
          error:
            data.error ||
            "Model returned an error. Check credentials or quotas.",
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
        error:
          err.message ||
          "Request timed out or failed to connect to local server.",
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
    // Pricing per 1M tokens in USD
    let inputPrice = 0.075; // default low baseline (e.g. Gemini Flash / Llama-3-8B)
    let outputPrice = 0.3; // default low baseline

    if (provider === "gemini") {
      if (model.includes("pro")) {
        // Gemini 1.5/2.5 Pro pricing
        inputPrice = 1.25;
        outputPrice = 5.0;
      } else {
        // Flash/Lite pricing
        inputPrice = 0.075;
        outputPrice = 0.3;
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
      } else {
        inputPrice = 0.8;
        outputPrice = 4.0;
      }
    } else if (provider === "huggingface") {
      // standard open source inference endpoint pricing simulation
      if (model.includes("llama-3-70b") || model.includes("mixtral")) {
        inputPrice = 0.7;
        outputPrice = 0.9;
      } else {
        inputPrice = 0.15;
        outputPrice = 0.15;
      }
    }

    const inputCost = (inputTokens / 1000000) * inputPrice;
    const outputCost = (outputTokens / 1000000) * outputPrice;
    return inputCost + outputCost;
  };

  return (
    <div className="flex-1 bg-neutral-955 text-neutral-100 overflow-y-auto min-h-screen">
      {/* HEADER SECTION */}
      <div className="border-b border-neutral-905 bg-neutral-955/70 backdrop-blur-md sticky top-0 z-10 px-8 py-5 flex items-center justify-between">
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
              Manage API keys, select global models, tune settings, and
              benchmark latency.
            </p>
          </div>
        </div>

        {/* Currently active model pill */}
        <div className="bg-purple-950/20 border border-purple-500/20 px-4 py-2 rounded-2xl flex items-center gap-3 font-mono text-xs shadow-inner">
          <div>
            <span className="text-[9px] text-purple-400 uppercase tracking-wider block font-bold">
              Active System Model
            </span>
            <span className="text-white font-bold block mt-0.5">
              {globalSelectedModel}
            </span>
          </div>
          <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 text-[8px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-0.5">
            <Zap className="h-2.5 w-2.5 text-emerald-400 fill-emerald-400" />{" "}
            Active
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Credentials Manager & Parameter Tuner */}
        <CredentialsAndTuner
          geminiKey={geminiKey}
          setGeminiKey={setGeminiKey}
          openAiKey={openAiKey}
          setOpenAiKey={setOpenAiKey}
          anthropicKey={anthropicKey}
          setAnthropicKey={setAnthropicKey}
          huggingFaceKey={huggingFaceKey}
          setHuggingFaceKey={setHuggingFaceKey}
          showKey={showKey}
          setShowKey={setShowKey}
          savedStatus={savedStatus}
          envKeys={envKeys}
          verifyingProvider={verifyingProvider}
          verificationResult={verificationResult}
          verifyKey={verifyKey}
          handleClearKeys={handleClearKeys}
          handleSaveKeys={handleSaveKeys}
          temperature={temperature}
          setTemperature={setTemperature}
          topP={topP}
          setTopP={setTopP}
          maxTokens={maxTokens}
          setMaxTokens={setMaxTokens}
          systemPrompt={systemPrompt}
          setSystemPrompt={setSystemPrompt}
          applyPreset={applyPreset}
          handleSaveParameters={handleSaveParameters}
        />

        {/* Model Registry Explorer */}
        <ModelRegistryExplorer
          globalSelectedModel={globalSelectedModel}
          compareModelList={compareModelList}
          models={models}
          loadingModels={loadingModels}
          modelsError={modelsError}
          filterQuery={filterQuery}
          setFilterQuery={setFilterQuery}
          selectedProvider={selectedProvider}
          handleProviderTabChange={handleProviderTabChange}
          showFreeOnly={showFreeOnly}
          setShowFreeOnly={setShowFreeOnly}
          fetchModels={fetchModels}
          handleToggleCompare={handleToggleCompare}
          handleSetActiveModel={handleSetActiveModel}
          setPlaygroundModel={setPlaygroundModel}
          setPlaygroundProvider={setPlaygroundProvider}
          addNotification={addNotification}
        />

        {/* Playground & Skills Studio */}
        <ModelPlaygroundAndSkills
          activePlaygroundTab={activePlaygroundTab}
          setActivePlaygroundTab={setActivePlaygroundTab}
          playgroundProvider={playgroundProvider}
          setPlaygroundProvider={setPlaygroundProvider}
          playgroundModel={playgroundModel}
          setPlaygroundModel={setPlaygroundModel}
          playgroundPrompt={playgroundPrompt}
          setPlaygroundPrompt={setPlaygroundPrompt}
          isRunningPlayground={isRunningPlayground}
          playgroundResult={playgroundResult}
          handleRunPlayground={handleRunPlayground}
          copiedStatus={copiedStatus}
          copyToClipboard={copyToClipboard}
          compareModelList={compareModelList}
          handleToggleCompare={handleToggleCompare}
          runMultiModelBenchmark={runMultiModelBenchmark}
          isBenchmarkingCompare={isBenchmarkingCompare}
          compareResults={compareResults}
          selectedSkill={selectedSkill}
          setSelectedSkill={setSelectedSkill}
          skillInputs={skillInputs}
          setSkillInputs={setSkillInputs}
          isRunningSkill={isRunningSkill}
          executeSkill={executeSkill}
          skillOutput={skillOutput}
          handleEnhancePrompt={handleEnhancePrompt}
          isEnhancingPrompt={isEnhancingPrompt}
        />

        {/* API Token Ledger & Costs */}
        <APITokenLedgerAndCosts
          tokenLogs={tokenLogs}
          runHistory={runHistory}
          loadingTokenLogs={loadingTokenLogs}
          tokenLogsError={tokenLogsError}
          fetchTokenLogs={fetchTokenLogs}
          addNotification={addNotification}
        />

        {/* Metrics Dashboard & Run History */}
        <BenchmarkRunHistory
          runHistory={runHistory}
          totalRuns={totalRuns}
          avgLatency={avgLatency}
          totalCost={totalCost}
          totalTokens={totalTokens}
          clearHistory={clearHistory}
          exportRunHistory={exportRunHistory}
        />
      </div>
    </div>
  );
}
