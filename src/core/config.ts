export interface GlobalConfig {
    activeProjectId: string | null;
    ollamaUrl: string;
    daemonIntervalMinutes: number;
    warmupCooldownMinutes: number;
    settings: Record<string, string>;
}

export const DEFAULT_CONFIG: GlobalConfig = {
    activeProjectId: null,
    ollamaUrl: "http://localhost:11434",
    daemonIntervalMinutes: 5,
    warmupCooldownMinutes: 30,
    settings: {}
};
