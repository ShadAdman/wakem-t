import React, { useState, useEffect } from "react";
import { render, Text, Box, useInput, useApp } from "ink";
import { BuildInfo } from "../core/BuildInfo.js";
import { ProjectManagerImpl } from "../project/ProjectManager.js";
import { ConfigServiceImpl } from "../core/ConfigService.js";
import { SkillLoaderImpl } from "../skills/SkillLoader.js";
import { PromptManagerImpl } from "../prompts/PromptManager.js";
import { DefaultPredictionEngine } from "../prediction/PredictionEngine.js";
import { OllamaRuntime } from "../runtime/AIRuntime.js";
import { Project, ModelPrediction } from "../core/models.js";

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

const Dashboard = () => {
    const { exit } = useApp();
    const [status, setStatus] = useState("Ready.");
    const [project, setProject] = useState<Project | null>(null);
    const [isHealthy, setIsHealthy] = useState(false);
    const [predictions, setPredictions] = useState<ModelPrediction[]>([]);
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
            } else {
                setStatus("No active project. Use 'wakem project use <name>'.");
            }
        };

        loadContext();
    }, []);

    useInput((input: string) => {
        if (input === "q" || input === "Q") {
            exit();
        }
    });

    return (
        <Box flexDirection="column" padding={1}>
            <Header />

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

            <Box marginTop={1}>
                <Text color={status === "Ready." ? "green" : undefined}>
                    {status !== "Ready." && <Text color="yellow">●</Text>} {status}
                </Text>
            </Box>

            <Box marginTop={1}>
                <Text dimColor>
                    [W] Warm model   [P] Prompts   [S] Skills   [Q] Quit
                </Text>
            </Box>
        </Box>
    );
};

export const runInteractiveMode = () => {
    render(<Dashboard />);
};
