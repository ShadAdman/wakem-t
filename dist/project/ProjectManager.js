import * as path from "path";
import * as os from "os";
import { RuntimeType } from "../core/models.js";
import { FileStorageService } from "../storage/StorageService.js";
export class ProjectManagerImpl {
    storage = new FileStorageService();
    projectsDir = path.join(os.homedir(), ".wakem", "projects");
    async createProject(name, description, sourcePath, skillPath) {
        const project = {
            id: name,
            name,
            description,
            sourcePath,
            skillPath,
            runtimeType: RuntimeType.OLLAMA,
            targetModels: [],
            enablePrediction: false,
            lastWarmupTimestamp: 0
        };
        const projectPath = path.join(this.projectsDir, name, "project.json");
        await this.storage.save(projectPath, JSON.stringify(project, null, 2));
        return project;
    }
    async listProjects() {
        const projectDirs = await this.storage.list(this.projectsDir);
        const projects = [];
        for (const dir of projectDirs) {
            const name = path.basename(dir);
            const project = await this.getProject(name);
            if (project)
                projects.push(project);
        }
        return projects;
    }
    async deleteProject(name) {
        const projectDir = path.join(this.projectsDir, name);
        await this.storage.deleteDirectory(projectDir);
    }
    async getProject(name) {
        const projectPath = path.join(this.projectsDir, name, "project.json");
        const content = await this.storage.load(projectPath);
        if (!content)
            return null;
        try {
            return JSON.parse(content);
        }
        catch (error) {
            return null;
        }
    }
    async updateProject(project) {
        const projectPath = path.join(this.projectsDir, project.name, "project.json");
        await this.storage.save(projectPath, JSON.stringify(project, null, 2));
    }
}
