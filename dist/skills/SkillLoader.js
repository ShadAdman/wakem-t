import * as path from "path";
import * as os from "os";
import { FileStorageService } from "../storage/StorageService.js";
export class SkillLoaderImpl {
    storage = new FileStorageService();
    wakemDir = path.join(os.homedir(), ".wakem");
    resolvePath(p) {
        if (path.isAbsolute(p)) {
            return p;
        }
        return path.join(this.wakemDir, p);
    }
    async listSkills(project) {
        const skills = [];
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
        const uniqueSkills = new Map();
        for (const skill of skills) {
            uniqueSkills.set(skill.name, skill);
        }
        return Array.from(uniqueSkills.values());
    }
    async loadSkill(project, name) {
        if (project.sourcePath) {
            const internalPath = path.join(project.sourcePath, ".wakem", "skills");
            const skill = await this.loadSkillFromPath(internalPath, name);
            if (skill)
                return skill;
        }
        if (project.skillPath) {
            const skill = await this.loadSkillFromPath(project.skillPath, name);
            if (skill)
                return skill;
        }
        return null;
    }
    async discoverSkillsInPath(dirPath) {
        const resolvedPath = this.resolvePath(dirPath);
        if (!(await this.storage.exists(resolvedPath)))
            return [];
        const files = await this.storage.list(resolvedPath);
        const skills = [];
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
    async loadSkillFromPath(dirPath, name) {
        const resolvedPath = this.resolvePath(dirPath);
        const filePath = path.join(resolvedPath, `${name}.md`);
        const content = await this.storage.load(filePath);
        if (content === null)
            return null;
        return {
            id: name,
            name,
            description: "",
            content
        };
    }
}
