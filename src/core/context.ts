import { Project, Skill, Prompt } from "./models.js";

export interface ProjectContext {
    project: Project;
    skills: Skill[];
    prompts: Prompt[];
}
