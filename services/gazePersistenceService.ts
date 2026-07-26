// Services for Eye-Tracking Data Persistence, Intent Prediction Engine, and Zero-Latency UI State Pre-loading

export interface ModuleGazeStat {
  moduleId: string;
  totalDwellMs: number;
  hoverCount: number;
  lastHoveredAt: number;
  averageDwellMs: number;
  preloadsTriggered: number;
  successfulIntentSwitches: number;
}

export interface GazeTransition {
  fromModule: string;
  toModule: string;
  count: number;
}

export interface GazePersistenceData {
  version: string;
  totalGazeSessions: number;
  totalTrackingTimeMs: number;
  moduleStats: Record<string, ModuleGazeStat>;
  transitions: GazeTransition[];
  lastUpdated: number;
}

const STORAGE_KEY = 'SARAH_GAZE_INTENT_PERSISTENCE_V1';

const DEFAULT_MODULE_IDS = [
  'comms', 'radar', 'diagnostics', 'settings', 
  'neuralchat', 'studio', 'repository'
];

class GazePersistenceManager {
  private data: GazePersistenceData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): GazePersistenceData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.version === '1.0') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[GazePersistence] Failed to parse stored gaze data, resetting.', e);
    }

    // Default Schema Initialization
    const initialStats: Record<string, ModuleGazeStat> = {};
    DEFAULT_MODULE_IDS.forEach(id => {
      initialStats[id] = {
        moduleId: id,
        totalDwellMs: 1200, // Seeded base history for instant prediction
        hoverCount: 15,
        lastHoveredAt: Date.now(),
        averageDwellMs: 450,
        preloadsTriggered: 5,
        successfulIntentSwitches: 4
      };
    });

    return {
      version: '1.0',
      totalGazeSessions: 1,
      totalTrackingTimeMs: 60000,
      moduleStats: initialStats,
      transitions: [
        { fromModule: 'comms', toModule: 'radar', count: 8 },
        { fromModule: 'comms', toModule: 'diagnostics', count: 12 },
        { fromModule: 'radar', toModule: 'diagnostics', count: 6 },
        { fromModule: 'diagnostics', toModule: 'settings', count: 5 }
      ],
      lastUpdated: Date.now()
    };
  }

  public saveData(): void {
    try {
      this.data.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('[GazePersistence] Save failed:', e);
    }
  }

  public getData(): GazePersistenceData {
    return { ...this.data };
  }

  /**
   * Calculates the predicted intent probability (0 to 100%) that the user
   * intends to switch focus to `targetModuleId` based on current dwell duration
   * and historical dwell affinity.
   */
  public predictIntentProbability(
    targetModuleId: string, 
    currentDwellMs: number, 
    currentFocusedModule?: string
  ): { probability: number; isPreloadWarranted: boolean; isIntentLocked: boolean } {
    const stat = this.data.moduleStats[targetModuleId] || {
      totalDwellMs: 500,
      hoverCount: 5,
      averageDwellMs: 350
    };

    // Base probability from current dwell time curve (sigmoid function around 350ms dwell)
    const dwellThresholdMs = Math.min( stat.averageDwellMs * 0.8, 600 );
    const timeFactor = Math.min(1.0, currentDwellMs / dwellThresholdMs);

    // Transition Markov probability multiplier
    let transitionBoost = 1.0;
    if (currentFocusedModule && currentFocusedModule !== targetModuleId) {
      const transition = this.data.transitions.find(
        t => t.fromModule === currentFocusedModule && t.toModule === targetModuleId
      );
      if (transition) {
        transitionBoost = 1.25; // boost probability if user frequently moves gaze between these two
      }
    }

    // Affinity weight from historical frequency
    const affinityWeight = Math.min(1.3, 0.8 + (stat.hoverCount / 50));

    // Raw confidence score
    const rawProbability = timeFactor * transitionBoost * affinityWeight * 100;
    const probability = Math.min(100, Math.round(rawProbability));

    const isPreloadWarranted = probability >= 45; // Pre-load target module state when intent >= 45%
    const isIntentLocked = probability >= 85;     // Instant intent lock when intent >= 85%

    return { probability, isPreloadWarranted, isIntentLocked };
  }

  /**
   * Records a dwell event when user gazes at a module
   */
  public recordDwell(moduleId: string, dwellMs: number, currentFocusedModule?: string): void {
    if (!this.data.moduleStats[moduleId]) {
      this.data.moduleStats[moduleId] = {
        moduleId,
        totalDwellMs: 0,
        hoverCount: 0,
        lastHoveredAt: Date.now(),
        averageDwellMs: 0,
        preloadsTriggered: 0,
        successfulIntentSwitches: 0
      };
    }

    const stat = this.data.moduleStats[moduleId];
    stat.hoverCount += 1;
    stat.totalDwellMs += dwellMs;
    stat.lastHoveredAt = Date.now();
    stat.averageDwellMs = Math.round(stat.totalDwellMs / stat.hoverCount);

    if (currentFocusedModule && currentFocusedModule !== moduleId) {
      const existingTrans = this.data.transitions.find(
        t => t.fromModule === currentFocusedModule && t.toModule === moduleId
      );
      if (existingTrans) {
        existingTrans.count += 1;
      } else {
        this.data.transitions.push({ fromModule: currentFocusedModule, toModule: moduleId, count: 1 });
      }
    }

    this.saveData();
  }

  /**
   * Increments metrics for successful preloads and zero-latency switches
   */
  public recordPreloadSuccess(moduleId: string): void {
    if (this.data.moduleStats[moduleId]) {
      this.data.moduleStats[moduleId].preloadsTriggered += 1;
      this.data.moduleStats[moduleId].successfulIntentSwitches += 1;
      this.saveData();
    }
  }

  public resetData(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.loadData();
  }
}

export const gazePersistence = new GazePersistenceManager();
