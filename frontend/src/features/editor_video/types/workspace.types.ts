export type WorkspaceId =
  | "media"
  | "characters"
  | "story"
  | "elements"
  | "text"
  | "audio"
  | "ai"
  | "templates"
  | "resources"
  | "marketplace"
  | "apps";

export interface MediaAsset {
  id: string;
  title: string;
  url: string;
  type: "panel" | "image" | "video" | "audio" | "generated";
  duration?: string;
  badge?: string;
  size?: string;
}

export interface CharacterItem {
  id: string;
  name: string;
  role: "Protagonist" | "Antagonist" | "Sidekick" | "Narrator";
  avatar: string;
  voiceActor: string;
  badge?: string;
}

export interface StoryScene {
  id: string;
  sceneNumber: number;
  title: string;
  dialogue: string;
  narration: string;
  panelCount: number;
  duration: string;
}

export interface ElementItem {
  id: string;
  title: string;
  category:
    | "speech-bubbles"
    | "comic-frames"
    | "manga-fx"
    | "speed-lines"
    | "panel-borders"
    | "motion-lines"
    | "dialogue-boxes"
    | "screen-tones"
    | "comic-icons";
  img?: string;
  emoji?: string;
  preview?: string;
  badge?: string;
  desc?: string;
}

export interface TextPreset {
  id: string;
  title: string;
  category: "titles" | "captions" | "speech-bubble" | "narration" | "credits" | "typography" | "animations";
  previewText: string;
  fontFamily: string;
  styleClass: string;
  badge?: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  category: "music" | "voice" | "sfx" | "ambient" | "mixer" | "recorder" | "ai-voice";
  duration: string;
  mood?: string;
  genre?: string;
  url?: string;
  badge?: string;
}

export interface AiEngineTool {
  id: string;
  engine: "generate" | "analyze" | "enhance" | "voice" | "motion" | "translation" | "automation";
  title: string;
  badge: string;
  desc: string;
  iconName: string;
}

export interface TemplateProject {
  id: string;
  title: string;
  category: "manga" | "webtoon" | "anime" | "story-recap" | "shorts" | "tiktok" | "reels" | "trailer" | "opening" | "ending";
  badge: string;
  gradient: string;
  accent: string;
  desc: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  category: "fonts" | "logos" | "colors" | "watermarks" | "intro" | "outro";
  detail: string;
  badge?: string;
  hex?: string;
}

export interface MarketplacePack {
  id: string;
  title: string;
  category: "comic-packs" | "transition-packs" | "voice-packs" | "character-packs" | "template-packs" | "animation-packs" | "plugin-store";
  badge: string;
  price: string;
  rating: number;
  downloads: string;
  img: string;
}

export interface AppExtension {
  id: string;
  name: string;
  category: "cloud" | "ai" | "stock" | "social" | "developer" | "automation";
  desc: string;
  icon: string;
  installed: boolean;
  badge?: string;
  color: string;
}
