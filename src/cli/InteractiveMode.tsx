import React, { useState, useEffect } from "react";
import { render, Text, Box, useInput, useApp } from "ink";
import { BuildInfo } from "../core/BuildInfo.js";
import { ProjectManagerImpl } from "../project/ProjectManager.js";
import { ConfigServiceImpl } from "../core/ConfigService.js";
import { SkillLoaderImpl } from "../skills/SkillLoader.js";
import { PromptManagerImpl } from "../prompts/PromptManager.js";
import { DefaultPredictionEngine } from "../prediction/PredictionEngine.js";
import { OllamaRuntime } from "../runtime/AIRuntime.js";
import { Project, ModelPrediction, Prompt, Skill } from "../core/models.js";

const Header = () => (
    <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">{BuildInfo.APP_NAME.toUpperCase()}</Text>
        <Text dimColor>Version {BuildInfo.VERSION}</Text>
    </Box>
);

const InfoRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <Box>
        <Box width={20}>
            <Text bold>{label}:</Text>
        </Box>
        <Text color={color}>{value}</Text>
    </Box>
);

type View = "dashboard" | "prompts" | "skills";

const Dashboard = () => {
    const { exit } = useApp();
    const [status, setStatus] = useState("Ready.");
    const [project, setProject] = useState<Project | null>(null);
    const [isHealthy, setIsHealthy] = useState(false);
    const [predictions, setPredictions] = useState<ModelPrediction[]>([]);
    const [skillCount, setSkillCount] = useState(0);
    const [promptCount, setPromptCount] = useState(0);
    const [currentView, setCurrentView] = useState<View>("dashboard");
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);

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
            } else {
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
                        } else {
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

    return (
        <Box flexDirection="column" padding={1}>
            <Header />

            {currentView === "dashboard" && (
                <Box flexDirection="column">
                    {project ? (
                        <Box flexDirection="column">
                            <InfoRow label="Project" value={project.name} />
                            <InfoRow
                                label="Runtime"
                                value={`${project.runtimeType} ● ${isHealthy ? "Connected" : "Disconnected"}`}
                                color={isHealthy ? "green" : "red"}
                            />

                            {project.targetModels.length > 0 && (
                                <InfoRow label="Target Models" value={project.targetModels.join(", ")} />
                            )}

                            <Box marginTop={1} flexDirection="column">
                                <Text bold>Prediction</Text>
                                {predictions.length === 0 ? (
                                    <Text>  No models predicted.</Text>
                                ) : (
                                    predictions.map((p, i) => (
                                        <Box key={i} flexDirection="column">
                                            <Text color="cyan">  ● {p.modelName} ({Math.round(p.confidence * 100)}%)</Text>
                                            <Text dimColor>    Rationale: {p.rationale}</Text>
                                        </Box>
                                    ))
                                )}
                            </Box>

                            <Box marginTop={1}>
                                <Box marginRight={4}>
                                    <InfoRow label="Recent prompts" value={promptCount.toString()} />
                                </Box>
                                <InfoRow label="Skills loaded" value={skillCount.toString()} />
                            </Box>
                        </Box>
                    ) : (
                        <Box flexDirection="column">
                            <Text color="yellow">No active project selected.</Text>
                            <Text dimColor>Please run: wakem project use &lt;name&gt;</Text>
                        </Box>
                    )}
                </Box>
            )}

            {currentView === "prompts" && (
                <Box flexDirection="column">
                    <Text bold>Prompts</Text>
                    {prompts.length === 0 ? (
                        <Text>  No prompts found.</Text>
                    ) : (
                        prompts.map((p, i) => (
                            <Text key={i}>  [{p.id}] {p.text}</Text>
                        ))
                    )}
                </Box>
            )}

            {currentView === "skills" && (
                <Box flexDirection="column">
                    <Text bold>Skills</Text>
                    {skills.length === 0 ? (
                        <Text>  No skills found.</Text>
                    ) : (
                        skills.map((s, i) => (
                            <Text key={i}>  - {s.name}</Text>
                        ))
                    )}
                </Box>
            )}

            <Box marginTop={1}>
                <Text color={status === "Ready." ? "green" : undefined}>
                    {status !== "Ready." && status !== "Viewing prompts. ESC to back." && status !== "Viewing skills. ESC to back." && <Text color="yellow">●</Text>} {status}
                </Text>
            </Box>

            <Box marginTop={1}>
                <Text dimColor>
                    [Q] Quit   {currentView === "dashboard" ? "[W] Warm model   [P] Prompts   [S] Skills" : "[ESC] Back"}
                </Text>
            </Box>
        </Box>
    );
};

export const runInteractiveMode = async () => {
    const { waitUntilExit } = render(<Dashboard />);
    await waitUntilExit();
};
