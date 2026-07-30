import pkg from "fs-extra";
const { ensureDir, writeFile, readFile, remove, pathExists, readdir } = pkg;
import * as path from "path";

export interface StorageService {
    save(filePath: string, content: string): Promise<void>;
    load(filePath: string): Promise<string | null>;
    delete(filePath: string): Promise<void>;
    exists(filePath: string): Promise<boolean>;
    list(dirPath: string): Promise<string[]>;
    deleteDirectory(dirPath: string): Promise<void>;
}

export class FileStorageService implements StorageService {
    async save(filePath: string, content: string): Promise<void> {
        await ensureDir(path.dirname(filePath));
        await writeFile(filePath, content, "utf8");
    }

    async load(filePath: string): Promise<string | null> {
        if (!(await this.exists(filePath))) return null;
        return await readFile(filePath, "utf8");
    }

    async delete(filePath: string): Promise<void> {
        await remove(filePath);
    }

    async exists(filePath: string): Promise<boolean> {
        return await pathExists(filePath);
    }

    async list(dirPath: string): Promise<string[]> {
        if (!(await this.exists(dirPath))) return [];
        const files = await readdir(dirPath);
        return files.map(f => path.join(dirPath, f));
    }

    async deleteDirectory(dirPath: string): Promise<void> {
        await remove(dirPath);
    }
}
