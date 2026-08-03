import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
export class OllamaRuntime {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async checkHealth() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/version`);
            if (response.status === 200)
                return true;
        }
        catch (error) {
            try {
                const { stdout } = await execAsync("ollama --version");
                return stdout.includes("ollama version");
            }
            catch (cliError) {
                return false;
            }
        }
        return false;
    }
    async listModels() {
        let models = [];
        // 1. Try HTTP
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 2000 });
            if (response.status === 200 && response.data && Array.isArray(response.data.models)) {
                models = response.data.models.map((m) => m.name);
            }
        }
        catch (error) {
            // Fallback to CLI
        }
        // 2. Try CLI if HTTP failed or returned nothing
        if (models.length === 0) {
            try {
                const { stdout } = await execAsync("ollama list");
                models = stdout
                    .split("\n")
                    .slice(1)
                    .filter(line => line.trim().length > 0)
                    .map(line => line.split(/\s+/)[0]);
            }
            catch (cliError) {
                // Both failed
            }
        }
        return models;
    }
    async warmup(model, keepAlive = "-1", wait = true) {
        try {
            const keepAliveValue = isNaN(Number(keepAlive)) ? keepAlive : Number(keepAlive);
            const requestBody = {
                model,
                prompt: "",
                stream: false,
                keep_alive: keepAliveValue
            };
            if (wait) {
                const response = await axios.post(`${this.baseUrl}/api/generate`, requestBody);
                return response.status === 200;
            }
            else {
                // Fire and forget for non-waiting
                axios.post(`${this.baseUrl}/api/generate`, requestBody).catch(() => { });
                return true;
            }
        }
        catch (error) {
            try {
                // CLI Fallback
                await execAsync(`ollama run ${model} ""`);
                return true;
            }
            catch (cliError) {
                return false;
            }
        }
    }
    async predict(prompt) {
        return {
            id: `pred_${prompt.id}`,
            promptId: prompt.id,
            result: `Ollama prediction for: ${prompt.text}`,
            timestamp: Date.now()
        };
    }
}
