import * as os from "os";
import * as path from "path";
import { DEFAULT_CONFIG } from "./config.js";
import { FileStorageService } from "../storage/StorageService.js";
export class ConfigServiceImpl {
    storage = new FileStorageService();
    configPath = path.join(os.homedir(), ".wakem", "config.json");
    async getConfig() {
        const content = await this.storage.load(this.configPath);
        if (!content)
            return DEFAULT_CONFIG;
        try {
            return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
        }
        catch (error) {
            return DEFAULT_CONFIG;
        }
    }
    async saveConfig(config) {
        await this.storage.save(this.configPath, JSON.stringify(config, null, 2));
    }
    getWakemDir() {
        return path.join(os.homedir(), ".wakem");
    }
}
