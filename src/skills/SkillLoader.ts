import * as path from "path";
import { Project, Skill } from "../core/models.js";
import { StorageService, FileStorageService } from "../storage/StorageService.js";

export interface SkillLoader {
    listSkills(project: Project): Promise<Skill[]>;
    loadSkill(project: Project, name: string): Promise<Skill | null>;
}

export class SkillLoaderImpl implements SkillLoader {
    private storage: StorageService = new FileStorageService();

    async listSkills(project: Project): Promise<Skill[]> {
        const skills: Skill[] = [];

        if (project.skillPath) {
            skills.push(...(await this.discoverSkillsInPath(project.skillPath)));
        }

        if (project.sourcePath) {
            const internalPath = path.join(project.sourcePath, ".wakem", "skills");
            skills.push(...(await this.discoverSkillsInPath(internalPath)));
        }

        // De-duplicate by name
        const uniqueSkills = new Map<string, Skill>();
        for (const skill of skills) {
            uniqueSkills.set(skill.name, skill);
        }
        return Array.from(uniqueSkills.values());
    }

    async loadSkill(project: Project, name: string): Promise<Skill | null> {
        if (project.sourcePath) {
            const internalPath = path.join(project.sourcePath, ".wakem", "skills");
            const skill = await this.loadSkillFromPath(internalPath, name);
            if (skill) return skill;
        }

        if (project.skillPath) {
            const skill = await this.loadSkillFromPath(project.skillPath, name);
            if (skill) return skill;
        }

        return null;
    }

    private async discoverSkillsInPath(dirPath: string): Promise<Skill[]> {
        if (!(await this.storage.exists(dirPath))) return [];
        const files = await this.storage.list(dirPath);
        const skills: Skill[] = [];

        for (const filePath of files) {
            if (filePath.endsWith(".md")) {
                const name = path.basename(filePath, ".md");
                skills.push({
                    id: name,
                    name,
                    description: "",
                    content: ""
                });
            }
        }
        return skills;
    }

    private async loadSkillFromPath(dirPath: string, name: string): Promise<Skill | null> {
        const filePath = path.join(dirPath, `${name}.md`);
        const content = await this.storage.load(filePath);
        if (content === null) return null;

        return {
            id: name,
            name,
            description: "",
            content
        };
    }
}
