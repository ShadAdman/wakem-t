import { ModelPrediction } from "../core/models.js";
import { ProjectContext } from "../core/context.js";

export interface PredictionEngine {
    predictModels(context: ProjectContext): ModelPrediction[];
}

export class DefaultPredictionEngine implements PredictionEngine {
    predictModels(context: ProjectContext): ModelPrediction[] {
        const { project } = context;

        if (!project.enablePrediction) {
            return project.targetModels.map((modelName: string) => ({
                modelName,
                confidence: 1.0,
                rationale: "Manually configured in project target models."
            }));
        }

        if (project.targetModels.length > 0) {
            return project.targetModels.map((modelName: string) => ({
                modelName,
                confidence: 0.9,
                rationale: "Predicted based on project affinity."
            }));
        }

        // Final fallback
        return [
            {
                modelName: "qwen2.5-coder",
                confidence: 0.5,
                rationale: "Default fallback model for coding projects."
            }
        ];
    }
}
