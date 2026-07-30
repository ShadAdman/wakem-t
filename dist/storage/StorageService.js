import pkg from "fs-extra";
const { ensureDir, writeFile, readFile, remove, pathExists, readdir } = pkg;
import * as path from "path";
export class FileStorageService {
    async save(filePath, content) {
        await ensureDir(path.dirname(filePath));
        await writeFile(filePath, content, "utf8");
    }
    async load(filePath) {
        if (!(await this.exists(filePath)))
            return null;
        return await readFile(filePath, "utf8");
    }
    async delete(filePath) {
        await remove(filePath);
    }
    async exists(filePath) {
        return await pathExists(filePath);
    }
    async list(dirPath) {
        if (!(await this.exists(dirPath)))
            return [];
        const files = await readdir(dirPath);
        return files.map(f => path.join(dirPath, f));
    }
    async deleteDirectory(dirPath) {
        await remove(dirPath);
    }
}
