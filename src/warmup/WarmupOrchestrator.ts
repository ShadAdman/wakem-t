import { WarmupPlan } from "../core/models.js";
import { AIRuntime } from "../runtime/AIRuntime.js";

export type WarmupEvent =
    | { type: "ModelLoading"; model: string }
    | { type: "ModelLoaded"; model: string }
    | { type: "PrimingPrompt"; prompt: string }
    | { type: "PromptCompleted"; prompt: string }
    | { type: "Error"; message: string }
    | { type: "Completed" };

export interface WarmupOrchestrator {
    execute(plan: WarmupPlan, onEvent: (event: WarmupEvent) => void): Promise<void>;
}

export class WarmupOrchestratorImpl implements WarmupOrchestrator {
    constructor(private runtime: AIRuntime) {}

    async execute(plan: WarmupPlan, onEvent: (event: WarmupEvent) => void): Promise<void> {
        // 1. Load models
        for (const model of plan.modelsToLoad) {
            onEvent({ type: "ModelLoading", model });
            const success = await this.runtime.warmup(model);
            if (success) {
                onEvent({ type: "ModelLoaded", model });
            } else {
                onEvent({ type: "Error", message: `Failed to load model: ${model}` });
            }
        }

        // 2. Run priming prompts
        for (const promptText of plan.primingPrompts) {
            onEvent({ type: "PrimingPrompt", prompt: promptText });
            try {
                await this.runtime.predict({
                    id: "warmup",
                    text: promptText,
                    timestamp: Date.now()
                });
                onEvent({ type: "PromptCompleted", prompt: promptText });
            } catch (error: any) {
                onEvent({ type: "Error", message: `Failed to run priming prompt: ${error.message}` });
            }
        }

        onEvent({ type: "Completed" });
    }
}
