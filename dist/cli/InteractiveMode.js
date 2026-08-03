import React, { useState, useEffect } from "react";
import { render, Text, Box, useInput, useApp } from "ink";
import { BuildInfo } from "../core/BuildInfo.js";
import { ProjectManagerImpl } from "../project/ProjectManager.js";
import { ConfigServiceImpl } from "../core/ConfigService.js";
import { SkillLoaderImpl } from "../skills/SkillLoader.js";
import { PromptManagerImpl } from "../prompts/PromptManager.js";
import { DefaultPredictionEngine } from "../prediction/PredictionEngine.js";
import { OllamaRuntime } from "../runtime/AIRuntime.js";
const Header = () => (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
    React.createElement(Text, { bold: true, color: "cyan" }, BuildInfo.APP_NAME.toUpperCase()),
    React.createElement(Text, { dimColor: true },
        "Version ",
        BuildInfo.VERSION)));
const InfoRow = ({ label, value, color }) => (React.createElement(Box, null,
    React.createElement(Box, { width: 20 },
        React.createElement(Text, { bold: true },
            label,
            ":")),
    React.createElement(Text, { color: color }, value)));
const Dashboard = () => {
    const { exit } = useApp();
    const [status, setStatus] = useState("Ready.");
    const [project, setProject] = useState(null);
    const [isHealthy, setIsHealthy] = useState(false);
    const [predictions, setPredictions] = useState([]);
    const [skillCount, setSkillCount] = useState(0);
    const [promptCount, setPromptCount] = useState(0);
    const [currentView, setCurrentView] = useState("dashboard");
    const [prompts, setPrompts] = useState([]);
    const [skills, setSkills] = useState([]);
    useEffect(() => {
        const loadContext = async () => {
            const cs = new ConfigServiceImpl();
            const pm = new ProjectManagerImpl();
            const sl = new SkillLoaderImpl();
            const prm = new PromptManagerImpl();
            const pe = new DefaultPredictionEngine();
            const config = await cs.getConfig();
            const activeProject = config.activeProjectId ? await pm.getProject(config.activeProjectId) : null;
            setProject(activeProject);
            if (activeProject) {
                const runtime = new OllamaRuntime(config.ollamaUrl);
                setStatus("Checking runtime...");
                const healthy = await runtime.checkHealth();
                setIsHealthy(healthy);
                let errorMsg = null;
                if (healthy) {
                    const installedModels = await runtime.listModels();
                    const missingModels = activeProject.targetModels.filter(target => {
                        const targetLower = target.toLowerCase();
                        return !installedModels.some(installed => {
                            const installedLower = installed.toLowerCase();
                            return installedLower === targetLower || installedLower === `${targetLower}:latest`;
                        });
                    });
                    if (missingModels.length > 0) {
                        errorMsg = `Error: Models not installed: ${missingModels.join(", ")}`;
                    }
                }
                setStatus("Loading context...");
                const loadedSkills = await sl.listSkills(activeProject);
                const loadedPrompts = await prm.listPrompts(activeProject);
                setSkills(loadedSkills);
                setPrompts(loadedPrompts);
                setSkillCount(loadedSkills.length);
                setPromptCount(loadedPrompts.length);
                setStatus("Running prediction...");
                const preds = pe.predictModels({ project: activeProject, skills: loadedSkills, prompts: loadedPrompts });
                setPredictions(preds);
                setStatus(errorMsg || "Ready.");
            }
            else {
                setStatus("No active project. Use 'wakem project use <name>'.");
            }
        };
        loadContext();
    }, []);
    useInput((input, key) => {
        const cmd = input.toLowerCase();
        if (key.escape) {
            setCurrentView("dashboard");
            setStatus("Ready.");
            return;
        }
        if (cmd === "q") {
            exit();
            return;
        }
        if (currentView === "dashboard") {
            if (cmd === "w") {
                if (project) {
                    const checkAndWarm = async () => {
                        setStatus("Checking models...");
                        const cs = new ConfigServiceImpl();
                        const config = await cs.getConfig();
                        const runtime = new OllamaRuntime(config.ollamaUrl);
                        const installedModels = await runtime.listModels();
                        const missingModels = project.targetModels.filter(target => {
                            const targetLower = target.toLowerCase();
                            return !installedModels.some(installed => {
                                const installedLower = installed.toLowerCase();
                                return installedLower === targetLower || installedLower === `${targetLower}:latest`;
                            });
                        });
                        if (missingModels.length > 0) {
                            setStatus(`Error: Models not installed: ${missingModels.join(", ")}`);
                        }
                        else {
                            setStatus("Warm started.");
                        }
                    };
                    checkAndWarm();
                }
            }
            if (cmd === "p") {
                if (project) {
                    setCurrentView("prompts");
                    setStatus("Viewing prompts. ESC to back.");
                }
            }
            if (cmd === "s") {
                if (project) {
                    setCurrentView("skills");
                    setStatus("Viewing skills. ESC to back.");
                }
            }
        }
    });
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Header, null),
        currentView === "dashboard" && (React.createElement(Box, { flexDirection: "column" }, project ? (React.createElement(Box, { flexDirection: "column" },
            React.createElement(InfoRow, { label: "Project", value: project.name }),
            React.createElement(InfoRow, { label: "Runtime", value: `${project.runtimeType} ● ${isHealthy ? "Connected" : "Disconnected"}`, color: isHealthy ? "green" : "red" }),
            project.targetModels.length > 0 && (React.createElement(InfoRow, { label: "Target Models", value: project.targetModels.join(", ") })),
            React.createElement(Box, { marginTop: 1, flexDirection: "column" },
                React.createElement(Text, { bold: true }, "Prediction"),
                predictions.length === 0 ? (React.createElement(Text, null, "  No models predicted.")) : (predictions.map((p, i) => (React.createElement(Box, { key: i, flexDirection: "column" },
                    React.createElement(Text, { color: "cyan" },
                        "  \u25CF ",
                        p.modelName,
                        " (",
                        Math.round(p.confidence * 100),
                        "%)"),
                    React.createElement(Text, { dimColor: true },
                        "    Rationale: ",
                        p.rationale)))))),
            React.createElement(Box, { marginTop: 1 },
                React.createElement(Box, { marginRight: 4 },
                    React.createElement(InfoRow, { label: "Recent prompts", value: promptCount.toString() })),
                React.createElement(InfoRow, { label: "Skills loaded", value: skillCount.toString() })))) : (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "yellow" }, "No active project selected."),
            React.createElement(Text, { dimColor: true }, "Please run: wakem project use <name>"))))),
        currentView === "prompts" && (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { bold: true }, "Prompts"),
            prompts.length === 0 ? (React.createElement(Text, null, "  No prompts found.")) : (prompts.map((p, i) => (React.createElement(Text, { key: i },
                "  [",
                p.id,
                "] ",
                p.text)))))),
        currentView === "skills" && (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { bold: true }, "Skills"),
            skills.length === 0 ? (React.createElement(Text, null, "  No skills found.")) : (skills.map((s, i) => (React.createElement(Text, { key: i },
                "  - ",
                s.name)))))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: status === "Ready." ? "green" : undefined },
                status !== "Ready." && status !== "Viewing prompts. ESC to back." && status !== "Viewing skills. ESC to back." && React.createElement(Text, { color: "yellow" }, "\u25CF"),
                " ",
                status)),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true },
                "[Q] Quit   ",
                currentView === "dashboard" ? "[W] Warm model   [P] Prompts   [S] Skills" : "[ESC] Back"))));
};
export const runInteractiveMode = async () => {
    const { waitUntilExit } = render(React.createElement(Dashboard, null));
    await waitUntilExit();
};
