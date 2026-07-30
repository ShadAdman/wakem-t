import * as path from "path";
import * as os from "os";
import { Project, Prompt } from "../core/models.js";
import { StorageService, FileStorageService } from "../storage/StorageService.js";

export interface PromptManager {
    addPrompt(project: Project, text: string): Promise<Prompt>;
    listPrompts(project: Project): Promise<Prompt[]>;
    deletePrompt(project: Project, id: string): Promise<void>;
}

export class PromptManagerImpl implements PromptManager {
    private storage: StorageService = new FileStorageService();
    private wakemDir: string = path.join(os.homedir(), ".wakem");

    private getPromptsPath(project: Project): string {
        return path.join(this.wakemDir, "projects", project.name, "prompts.jsonl");
    }

    async addPrompt(project: Project, text: string): Promise<Prompt> {
        const id = Math.floor(Math.random() * 9000 + 1000).toString();
        const prompt: Prompt = { id, text, timestamp: Date.now() };
        const filePath = this.getPromptsPath(project);

        const line = JSON.stringify(prompt) + "\n";
        const existingContent = (await this.storage.load(filePath)) || "";
        await this.storage.save(filePath, existingContent + line);

        return prompt;
    }

    async listPrompts(project: Project): Promise<Prompt[]> {
        const filePath = this.getPromptsPath(project);
        const content = await this.storage.load(filePath);
        if (!content) return [];

        return content
            .split("\n")
            .filter(line => line.trim().length > 0)
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch (error) {
                    return null;
                }
            })
            .filter((p): p is Prompt => p !== null);
    }

    async deletePrompt(project: Project, id: string): Promise<void> {
        const filePath = this.getPromptsPath(project);
        const prompts = await this.listPrompts(project);
        const updatedPrompts = prompts.filter(p => p.id !== id);

        const newContent = updatedPrompts.map(p => JSON.stringify(p)).join("\n");
        await this.storage.save(filePath, newContent.length > 0 ? newContent + "\n" : "");
    }
}
