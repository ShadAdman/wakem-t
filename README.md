<h1 align="center">wakem</h1>

<p align="center">
  <video src="https://private-user-images.githubusercontent.com/19638473/628716711-16832a31-c017-4bfc-9113-771232d13329.mp4?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3ODUzNTQxMDgsIm5iZiI6MTc4NTM1MzgwOCwicGF0aCI6Ii8xOTYzODQ3My82Mjg3MTY3MTEtMTY4MzJhMzEtYzAxNy00YmZjLTkxMTMtNzcxMjMyZDEzMzI5Lm1wND9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjA3MjklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwNzI5VDE5MzY0OFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWNhNDkxNTc4MzQ4NmM4Y2VjODczNmFjNmU5ZGM3NDI0ZTExNWY2YjA0ZTZmY2MwOTllZDU1MmI2NGEzZGNiNTkmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT12aWRlbyUyRm1wNCJ9.DFdnuyLqLCe5V0Xx1YXRdiusC5tzmSxf1I0KBCyBplg" width="800" autoplay loop muted playsinline controls></video>
</p>

<p align="center">
  <b>The official wakem in TypeScript</b>
</p>

---

## What is Wakem?

**Wakem** is a specialized CLI infrastructure tool designed for **Predictive AI Warmup**. 

If you use local AI models (like Ollama, Llama.cpp, or LocalAI), you've likely experienced the "cold start" problem: the first time you ask a question or even sending just a hi, you wait several seconds for the model to load into VRAM and process the initial context. 

**Wakem eliminates this wait.** It acts as a bridge between your intent to work and your AI's readiness. By the time you start your IDE or terminal, Wakem has already:
1. Loaded the models into VRAM.
2. Primed them with your project's files, skills (Markdown files), and your specified prompts. 
3. Predicts which model you'll need based on some predefined rules. (optional, you can select your models manually)

### What Wakem is NOT
*   **NOT a Generative AI:** Wakem does not generate text, code, or images. It doesn't have its own "brain."
*   **NOT a Chatbot:** While it handles prompts, it doesn't "talk" to you. It talks to your AI backend to prepare it for you.
*   **Purely Infrastructure:** It is a DIY tool for managing your local inference environment efficiently.

---

## How it Works

Wakem operates on a **Context -> Predict -> Prime -> Warm** cycle:

1.  **Context Analysis**: When you "use" a project, Wakem scans the directory for structure and markers.
2.  **Skill Discovery**: It identifies skills by scanning for all Markdown (`.md`) files within your specified project directory.
3.  **Prediction Engine**: Using internal rules, it determines which of your installed models is best suited for the current project.
4. **Warmup**: It sends your predefined prompts and project context to the model, ensuring it understands your requirements before you even start working. It maintains a connection to your backend (like Ollama) to ensure the model stays active in memory according to your `keep_alive` settings. 

---

## Wakem Commands

The CLI is organized into logical groups to manage every aspect of the warmup process.

### `wakem project`
Manage your development environments.
*   `create <name> <path>`: Link a local directory to a Wakem project.
*   `use <name>`: Switch the active project.
*   `list`: See all managed projects.
*   `config-runtime`: Specify which models are preferred for this specific project.

### `wakem prompt`
Manage the "briefing" text sent to models during warmup. Be careful about your prompts. if you provide generative prompts that's on you.
*   `add "text"`: Add a new warmup instruction.
*   `list`: Review current prompts.
*   `delete <id>`: Remove old prompts.

**Effective Warmup Prompt Examples:**
- `wakem prompt add "Review the current project dependencies and structure to provide context-aware suggestions."`
- `wakem prompt add "Familiarize yourself with the established coding patterns and testing strategies used here."`
- `wakem prompt add "Prepare for a deep dive into the business logic and API endpoints defined in this repository."`
- `wakem prompt add "Ready yourself for troubleshooting and bug-fixing tasks by indexing the core modules."`


### `wakem warm`
The core action. Manually triggers the loading of models, skill files and runs the prompts for the current project. Use this just before you start a task.

### `wakem runtime`
Control your AI backend (default is Ollama).
*   `status`: Check if the backend is reachable.
*   `models`: List all models available for warming.
*   `config-url`: Set a custom API endpoint (e.g., a remote GPU server).

[Alpha]
### `wakem daemon`
The "Set it and Forget it" mode. Starts a background process that periodically checks your active project and ensures the models are warmed up without manual intervention.

### What's Next?
- `wakem recap`: Daily Recap (reports a summary of your last work by scanning git changes. You can also provide this summery to the models as a warmup plan).
- `wakem sch`: Schedule warming up (set recurring schedules like `EVERY_DAY` at a specific time or trigger `ON_STARTUP` to ensure readiness upon boot).

---

## Core Concepts

Wakem uses several data structures to manage the warmup lifecycle:

### `GlobalConfig`
The global state shared across all projects.
*   `activeProjectId`: The unique identifier of the project currently being used.
*   `ollamaUrl`: The URL of the Ollama server (default: `http://localhost:11434`).
*   `daemonIntervalMinutes`: How often the background daemon checks for updates.
*   `warmupCooldownMinutes`: Cooldown period between automatic warmups to prevent redundant processing.
*   `settings`: General configuration key-value pairs.

### `Project`
Defines a specific development environment.
*   `id`: Unique identifier (Slug).
*   `name`: Human-readable project name.
*   `description`: Brief description of the project.
*   `sourcePath`: Absolute path to the code repository.
*   `skillPath`: Path to custom AI skill files.
*   `runtimeType`: Target AI backend (e.g., `OLLAMA`).
*   `targetModels`: List of specific models to load for this project.
*   `enablePrediction`: If enabled, Wakem uses the Prediction Engine to select the best model based on file types and structure.
*   `lastWarmupTimestamp`: Unix timestamp of the last successful warmup.

### `ProjectContext`
The stateful representation of a project at runtime.
*   `project`: The project configuration.
*   `skills`: List of loaded skill files (Markdown) from the project directory.
*   `prompts`: List of project-specific warmup instructions.

---

## Download & Installation

### macOS / Linux
```bash
./install.sh
```

### Windows
```powershell
.\install.ps1
```

---

## Development & Build

This version is built using **TypeScript** and **Node.js**, offering a highly customizable and scriptable implementation.

### Run in development
```bash
npm run start -- warm
```

---

## Project Structure
- `src/cli`: Command handlers and Interactive UI (Ink/React).
- `src/core`: Core domain logic, models and configuration.
- `src/project`: Project lifecycle management.
- `src/runtime`: Integration with Ollama.
- `src/storage`: Filesystem-based persistent storage.
- `src/skills`: Markdown skill discovery and parsing.
- `src/prediction`: Heuristic-based model selection logic.
- `src/warmup`: The core engine for loading models and priming context.
