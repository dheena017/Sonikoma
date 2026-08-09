import { StoryScene } from "../types/workspace.types";

export const STORY_SUB_TABS = [
  "Scenes",
  "Storyboard",
  "Script",
  "Timeline",
  "Narration",
  "Dialogue",
  "Notes",
];

export const MOCK_STORY_SCENES: StoryScene[] = [
  {
    id: "s-1",
    sceneNumber: 1,
    title: "Entrance into the Double Dungeon",
    dialogue: "Is this... a secret quest room?",
    narration: "The air grew thick with ancient mana as the heavy stone door slammed shut behind them.",
    panelCount: 4,
    duration: "0:15",
  },
  {
    id: "s-2",
    sceneNumber: 2,
    title: "Awakening of the Statue King",
    dialogue: "Don't move! Look at its eyes!",
    narration: "A crimson beam flared from the statue's gaze, obliterating everything in its path.",
    panelCount: 6,
    duration: "0:25",
  },
  {
    id: "s-3",
    sceneNumber: 3,
    title: "The System Window Notification",
    dialogue: "[You have completed the secret requirement: 'Courage of the Weak']",
    narration: "A glowing blue holographic window materialized before Jin-Woo's fading consciousness.",
    panelCount: 3,
    duration: "0:12",
  },
];
