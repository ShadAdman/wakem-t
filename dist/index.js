#!/usr/bin/env node
import { Command } from "commander";
import { BuildInfo } from "./core/BuildInfo.js";
import { projectHandler, promptHandler, runtimeHandler, warmHandler } from "./cli/CommandHandlers.js";
const program = new Command();
program
    .name(BuildInfo.APP_NAME)
    .description("Predictive AI Warmup Infrastructure")
    .version(BuildInfo.VERSION);
const project = program.command("project").description("Manage Wakem projects");
project.command("create <name> [sourcePath]").action(projectHandler.create);
project.command("list").action(projectHandler.list);
project.command("use <name>").action(projectHandler.use);
project.command("delete <name>").action(projectHandler.delete);
project.command("config-runtime [models...]").action(projectHandler.configRuntime);
project.command("config-prediction <enabled>").action(projectHandler.configPrediction);
project.command("context").action(projectHandler.context);
const prompt = program.command("prompt").description("Manage warmup prompts");
prompt.command("add <text>").action(promptHandler.add);
prompt.command("list").action(promptHandler.list);
prompt.command("delete <id>").action(promptHandler.delete);
const runtime = program.command("runtime").description("Control AI backend");
runtime.command("status").action(runtimeHandler.status);
runtime.command("models").action(runtimeHandler.models);
program.command("warm").description("Trigger manual warmup").action(warmHandler.warm);
// Interactive mode when no arguments
if (process.argv.length === 2) {
    // Import dynamically to avoid loading React/Ink unnecessarily for simple CLI commands
    import("./cli/InteractiveMode.js").then(async ({ runInteractiveMode }) => {
        await runInteractiveMode();
    });
}
else {
    program.parse(process.argv);
}
