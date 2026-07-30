export enum RuntimeType {
    OLLAMA = "OLLAMA"
}

export interface Project {
    id: string;
    name: string;
    description: string;
    sourcePath: string | null;
    skillPath: string | null;
    runtimeType: RuntimeType;
    targetModels: string[];
    enablePrediction: boolean;
    lastWarmupTimestamp: number;
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    content: string;
}

export interface Prompt {
    id: string;
    text: string;
    timestamp: number;
}

export interface Prediction {
    id: string;
    promptId: string;
    result: string;
    timestamp: number;
}

export interface ModelPrediction {
    modelName: string;
    confidence: number;
    rationale: string;
}

export interface WarmupPlan {
    id: string;
    projectId: string;
    modelsToLoad: string[];
    primingPrompts: string[];
}
