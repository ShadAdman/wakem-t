import * as path from "path";
import * as os from "os";
import { Project, RuntimeType } from "../core/models.js";
import { StorageService, FileStorageService } from "../storage/StorageService.js";

export interface ProjectManager {
    createProject(name: string, description: string, sourcePath: string | null, skillPath: string | null): Promise<Project>;
    listProjects(): Promise<Project[]>;
    deleteProject(name: string): Promise<void>;
    getProject(name: string): Promise<Project | null>;
    updateProject(project: Project): Promise<void>;
}

export class ProjectManagerImpl implements ProjectManager {
    private storage: StorageService = new FileStorageService();
    private projectsDir: string = path.join(os.homedir(), ".wakem", "projects");

    async createProject(name: string, description: string, sourcePath: string | null, skillPath: string | null): Promise<Project> {
        const project: Project = {
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

    async listProjects(): Promise<Project[]> {
        const projectDirs = await this.storage.list(this.projectsDir);
        const projects: Project[] = [];
        for (const dir of projectDirs) {
            const name = path.basename(dir);
            const project = await this.getProject(name);
            if (project) projects.push(project);
        }
        return projects;
    }

    async deleteProject(name: string): Promise<void> {
        const projectDir = path.join(this.projectsDir, name);
        await this.storage.deleteDirectory(projectDir);
    }

    async getProject(name: string): Promise<Project | null> {
        const projectPath = path.join(this.projectsDir, name, "project.json");
        const content = await this.storage.load(projectPath);
        if (!content) return null;
        try {
            return JSON.parse(content);
        } catch (error) {
            return null;
        }
    }

    async updateProject(project: Project): Promise<void> {
        const projectPath = path.join(this.projectsDir, project.name, "project.json");
        await this.storage.save(projectPath, JSON.stringify(project, null, 2));
    }
}
