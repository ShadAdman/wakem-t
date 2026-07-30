import * as os from "os";
import * as path from "path";
import { GlobalConfig, DEFAULT_CONFIG } from "./config.js";
import { StorageService, FileStorageService } from "../storage/StorageService.js";

export interface ConfigService {
    getConfig(): Promise<GlobalConfig>;
    saveConfig(config: GlobalConfig): Promise<void>;
}

export class ConfigServiceImpl implements ConfigService {
    private storage: StorageService = new FileStorageService();
    private configPath: string = path.join(os.homedir(), ".wakem", "config.json");

    async getConfig(): Promise<GlobalConfig> {
        const content = await this.storage.load(this.configPath);
        if (!content) return DEFAULT_CONFIG;
        try {
            return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
        } catch (error) {
            return DEFAULT_CONFIG;
        }
    }

    async saveConfig(config: GlobalConfig): Promise<void> {
        await this.storage.save(this.configPath, JSON.stringify(config, null, 2));
    }

    getWakemDir(): string {
        return path.join(os.homedir(), ".wakem");
    }
}
