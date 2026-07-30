import { ProjectManagerImpl } from "../project/ProjectManager.js";
import { ConfigServiceImpl } from "../core/ConfigService.js";
import { SkillLoaderImpl } from "../skills/SkillLoader.js";
import { PromptManagerImpl } from "../prompts/PromptManager.js";
import { OllamaRuntime } from "../runtime/AIRuntime.js";
import { WarmupOrchestratorImpl } from "../warmup/WarmupOrchestrator.js";
import { DefaultPredictionEngine } from "../prediction/PredictionEngine.js";
import chalk from "chalk";
export const projectHandler = {
    async create(name, sourcePath) {
        const pm = new ProjectManagerImpl();
        await pm.createProject(name, "", sourcePath || null, null);
        console.log(chalk.green(`Project '${name}' created${sourcePath ? ` with source path: ${sourcePath}` : "."}`));
    },
    async list() {
        const pm = new ProjectManagerImpl();
        const projects = await pm.listProjects();
        if (projects.length === 0) {
            console.log("No projects found.");
        }
        else {
            console.log(chalk.bold("Projects:"));
            projects.forEach(p => console.log(`- ${p.name}${p.sourcePath ? ` (${p.sourcePath})` : ""}`));
        }
    },
    async use(name) {
        const pm = new ProjectManagerImpl();
        const cs = new ConfigServiceImpl();
        const project = await pm.getProject(name);
        if (project) {
            const config = await cs.getConfig();
            config.activeProjectId = name;
            await cs.saveConfig(config);
            console.log(chalk.green(`Now using project '${name}'.`));
        }
        else {
            console.log(chalk.red(`Project '${name}' not found.`));
        }
    },
    async delete(name) {
        const pm = new ProjectManagerImpl();
        await pm.deleteProject(name);
        console.log(chalk.yellow(`Project '${name}' deleted.`));
    },
    async configRuntime(models) {
        const pm = new ProjectManagerImpl();
        const cs = new ConfigServiceImpl();
        const config = await cs.getConfig();
        if (!config.activeProjectId)
            return console.log(chalk.red("Error: No active project selected."));
        const project = await pm.getProject(config.activeProjectId);
        if (!project)
            return console.log(chalk.red(`Error: Project '${config.activeProjectId}' not found.`));
        if (models.length === 0) {
            console.log(`Project: ${project.name}`);
            console.log(`Runtime: ${project.runtimeType}`);
            console.log(`Target Models: ${project.targetModels.length ? project.targetModels.join(", ") : "None"}`);
            return;
        }
        project.targetModels = models;
        await pm.updateProject(project);
        console.log(chalk.green(`Target models updated for project '${project.name}'.`));
    },
    async configPrediction(enabled) {
        const pm = new ProjectManagerImpl();
        const cs = new ConfigServiceImpl();
        const config = await cs.getConfig();
        if (!config.activeProjectId)
            return console.log(chalk.red("Error: No active project selected."));
        const project = await pm.getProject(config.activeProjectId);
        if (!project)
            return console.log(chalk.red(`Error: Project '${config.activeProjectId}' not found.`));
        const isEnabled = enabled.toLowerCase() === "true";
        project.enablePrediction = isEnabled;
        await pm.updateProject(project);
        console.log(chalk.green(`Prediction ${isEnabled ? "ENABLED" : "DISABLED"} for project '${project.name}'.`));
    },
    async context() {
        const pm = new ProjectManagerImpl();
        const cs = new ConfigServiceImpl();
        const sl = new SkillLoaderImpl();
        const prm = new PromptManagerImpl();
        const config = await cs.getConfig();
        if (!config.activeProjectId)
            return console.log(chalk.red("Error: No active project selected."));
        const project = await pm.getProject(config.activeProjectId);
        if (!project)
            return console.log(chalk.red(`Error: Project '${config.activeProjectId}' not found.`));
        const skills = await sl.listSkills(project);
        const prompts = await prm.listPrompts(project);
        const context = { project, skills, prompts };
        console.log(chalk.blue(`--- Project Context: ${project.name} ---`));
        console.log(JSON.stringify(context, null, 2));
    }
};
export const promptHandler = {
    async add(text) {
        const pm = new ProjectManagerImpl();
        const cs = new ConfigServiceImpl();
        const prm = new PromptManagerImpl();
        const config = await cs.getConfig();
        if (!config.activeProjectId)
            return console.log(chalk.red("No active project."));
        const project = await pm.getProject(config.activeProjectId);
        if (!project)
            return;
        const prompt = await prm.addPrompt(project, text);
        console.log(chalk.green(`Prompt added [${prompt.id}]`));
    },
    async list() {
        const pm = new ProjectManagerImpl();
        const cs = new ConfigServiceImpl();
        const prm = new PromptManagerImpl();
        const config = await cs.getConfig();
        if (!config.activeProjectId)
            return console.log("No active project.");
        const project = await pm.getProject(config.activeProjectId);
        if (!project)
            return;
        const prompts = await prm.listPrompts(project);
        if (prompts.length === 0)
            return console.log("No prompts found.");
        prompts.forEach(p => console.log(`[${p.id}] ${p.text}`));
    },
    async delete(id) {
        const pm = new ProjectManagerImpl();
        const cs = new ConfigServiceImpl();
        const prm = new PromptManagerImpl();
        const config = await cs.getConfig();
        if (!config.activeProjectId)
            return;
        const project = await pm.getProject(config.activeProjectId);
        if (!project)
            return;
        await prm.deletePrompt(project, id);
        console.log(chalk.yellow(`Prompt ${id} deleted.`));
    }
};
export const runtimeHandler = {
    async status() {
        const cs = new ConfigServiceImpl();
        const config = await cs.getConfig();
        const runtime = new OllamaRuntime(config.ollamaUrl);
        const healthy = await runtime.checkHealth();
        console.log(`Runtime (${config.ollamaUrl}): ${healthy ? chalk.green("HEALTHY") : chalk.red("UNREACHABLE")}`);
    },
    async models() {
        const cs = new ConfigServiceImpl();
        const config = await cs.getConfig();
        const runtime = new OllamaRuntime(config.ollamaUrl);
        const models = await runtime.listModels();
        console.log(chalk.bold("Available Models:"));
        models.forEach(m => console.log(`- ${m}`));
    }
};
export const warmHandler = {
    async warm() {
        const pm = new ProjectManagerImpl();
        const cs = new ConfigServiceImpl();
        const sl = new SkillLoaderImpl();
        const prm = new PromptManagerImpl();
        const pe = new DefaultPredictionEngine();
        const config = await cs.getConfig();
        if (!config.activeProjectId)
            return console.log(chalk.red("No active project."));
        const project = await pm.getProject(config.activeProjectId);
        if (!project)
            return;
        const skills = await sl.listSkills(project);
        const prompts = await prm.listPrompts(project);
        const context = { project, skills, prompts };
        const predictions = pe.predictModels(context);
        const runtime = new OllamaRuntime(config.ollamaUrl);
        const orchestrator = new WarmupOrchestratorImpl(runtime);
        const plan = {
            id: `warm_${Date.now()}`,
            projectId: project.id,
            modelsToLoad: predictions.map(p => p.modelName),
            primingPrompts: prompts.map(p => p.text)
        };
        console.log(chalk.blue(`Warming up project: ${project.name}`));
        await orchestrator.execute(plan, event => {
            switch (event.type) {
                case "ModelLoading":
                    console.log(chalk.dim(`Loading model: ${event.model}...`));
                    break;
                case "ModelLoaded":
                    console.log(chalk.green(`Model loaded: ${event.model}`));
                    break;
                case "PrimingPrompt":
                    console.log(chalk.dim(`Priming prompt: ${event.prompt}...`));
                    break;
                case "PromptCompleted":
                    console.log(chalk.green(`Prompt primed.`));
                    break;
                case "Error":
                    console.log(chalk.red(`Error: ${event.message}`));
                    break;
                case "Completed":
                    console.log(chalk.bold.green("Warmup Completed."));
                    break;
            }
        });
    }
};
