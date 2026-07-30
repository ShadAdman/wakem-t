import * as path from "path";
import * as os from "os";
import { Project, Skill } from "../core/models.js";
import { StorageService, FileStorageService } from "../storage/StorageService.js";

export interface SkillLoader {
    listSkills(project: Project): Promise<Skill[]>;
    loadSkill(project: Project, name: string): Promise<Skill | null>;
}

export class SkillLoaderImpl implements SkillLoader {
    private storage: StorageService = new FileStorageService();
    private wakemDir: string = path.join(os.homedir(), ".wakem");

    private resolvePath(p: string): string {
        if (path.isAbsolute(p)) {
            return p;
        }
        return path.join(this.wakemDir, p);
    }

    async listSkills(project: Project): Promise<Skill[]> {
        const skills: Skill[] = [];

        if (project.skillPath) {
            skills.push(...(await this.discoverSkillsInPath(project.skillPath)));
        }

        if (project.sourcePath) {
            // Check .wakem/skills
            const internalPath = path.join(project.sourcePath, ".wakem", "skills");
            skills.push(...(await this.discoverSkillsInPath(internalPath)));

            // Check sourcePath directly for .md files
            skills.push(...(await this.discoverSkillsInPath(project.sourcePath)));
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
        const resolvedPath = this.resolvePath(dirPath);
        if (!(await this.storage.exists(resolvedPath))) return [];
        const files = await this.storage.list(resolvedPath);
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
        const resolvedPath = this.resolvePath(dirPath);
        const filePath = path.join(resolvedPath, `${name}.md`);
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
