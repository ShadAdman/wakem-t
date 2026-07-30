import * as path from "path";
import * as os from "os";
import { FileStorageService } from "../storage/StorageService.js";
export class PromptManagerImpl {
    storage = new FileStorageService();
    wakemDir = path.join(os.homedir(), ".wakem");
    getPromptsPath(project) {
        return path.join(this.wakemDir, "projects", project.name, "prompts.jsonl");
    }
    async addPrompt(project, text) {
        const id = Math.floor(Math.random() * 9000 + 1000).toString();
        const prompt = { id, text, timestamp: Date.now() };
        const filePath = this.getPromptsPath(project);
        const line = JSON.stringify(prompt) + "\n";
        const existingContent = (await this.storage.load(filePath)) || "";
        await this.storage.save(filePath, existingContent + line);
        return prompt;
    }
    async listPrompts(project) {
        const filePath = this.getPromptsPath(project);
        const content = await this.storage.load(filePath);
        if (!content)
            return [];
        return content
            .split("\n")
            .filter(line => line.trim().length > 0)
            .map(line => {
            try {
                return JSON.parse(line);
            }
            catch (error) {
                return null;
            }
        })
            .filter((p) => p !== null);
    }
    async deletePrompt(project, id) {
        const filePath = this.getPromptsPath(project);
        const prompts = await this.listPrompts(project);
        const updatedPrompts = prompts.filter(p => p.id !== id);
        const newContent = updatedPrompts.map(p => JSON.stringify(p)).join("\n");
        await this.storage.save(filePath, newContent.length > 0 ? newContent + "\n" : "");
    }
}
