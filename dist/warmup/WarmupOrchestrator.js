export class WarmupOrchestratorImpl {
    runtime;
    constructor(runtime) {
        this.runtime = runtime;
    }
    async execute(plan, onEvent) {
        // 1. Load models
        for (const model of plan.modelsToLoad) {
            onEvent({ type: "ModelLoading", model });
            const success = await this.runtime.warmup(model);
            if (success) {
                onEvent({ type: "ModelLoaded", model });
            }
            else {
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
            }
            catch (error) {
                onEvent({ type: "Error", message: `Failed to run priming prompt: ${error.message}` });
            }
        }
        onEvent({ type: "Completed" });
    }
}
