import React from 'react';

export interface AutoCropEngine {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  settingsComponent: React.FC<any>;
  defaultSettings: any;
  detect?: (image: any) => Promise<any>;
  preview?: (image: any) => Promise<any>;
  validate?: () => boolean;
}

class EngineRegistryClass {
  private engines: Map<string, AutoCropEngine> = new Map();

  register(engine: AutoCropEngine) {
    this.engines.set(engine.id, engine);
  }

  get(id: string): AutoCropEngine | undefined {
    return this.engines.get(id);
  }

  getAll(): AutoCropEngine[] {
    return Array.from(this.engines.values());
  }
}

export const EngineRegistry = new EngineRegistryClass();
