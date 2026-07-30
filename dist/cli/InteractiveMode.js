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
                setStatus("Loading context...");
                const skills = await sl.listSkills(activeProject);
                const prompts = await prm.listPrompts(activeProject);
                setSkillCount(skills.length);
                setPromptCount(prompts.length);
                setStatus("Running prediction...");
                const preds = pe.predictModels({ project: activeProject, skills, prompts });
                setPredictions(preds);
                setStatus("Ready.");
            }
            else {
                setStatus("No active project. Use 'wakem project use <name>'.");
            }
        };
        loadContext();
    }, []);
    useInput((input) => {
        if (input === "q" || input === "Q") {
            exit();
        }
    });
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Header, null),
        project ? (React.createElement(Box, { flexDirection: "column" },
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
            React.createElement(Text, { dimColor: true }, "Please run: wakem project use <name>"))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: status === "Ready." ? "green" : undefined },
                status !== "Ready." && React.createElement(Text, { color: "yellow" }, "\u25CF"),
                " ",
                status)),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "[W] Warm model   [P] Prompts   [S] Skills   [Q] Quit"))));
};
export const runInteractiveMode = () => {
    render(React.createElement(Dashboard, null));
};
