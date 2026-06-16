# ◆ NAP — Multi-Agent Workspace

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Security Policy](https://img.shields.io/badge/Security-Policy-blue.svg)](SECURITY.md)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D_16.0.0-green.svg)](https://nodejs.org/)
[![Style](https://img.shields.io/badge/Aesthetics-Glassmorphism%20%2F%20Dark%20Mode-pink.svg)](#)

NAP is a state-of-the-art developer workspace where **7 specialized AI agents** collaborate to plan, write, review, and ship your software projects. With built-in support for multiple project scaffolding templates, real-time live preview, and advanced LLM orchestrations (including parallel model ensembles), NAP provides a premium desktop IDE experience powered entirely by AI.

---

## 🚀 Key Features

* **🧠 7-Agent Pipeline**: Direct a sequential workflow of specialized AI agents:
  1. **Product Manager**: Defines specifications & requirements.
  2. **Architect**: Plans project layout, dependencies, and file structures.
  3. **Engineer**: Generates code files, components, and styling.
  4. **Reviewer**: Lints, debugs, and provides constructive feedback.
  5. **QA Tester**: Generates test cases and runs verification scripts.
  6. **Security Officer**: Scans for vulnerabilities and locks down permissions.
  7. **Release Manager**: Packages, optimizes, and prepares the deployment.
* **🔥 Parallel Model Ensemble**: Run multiple local (Ollama) and cloud (Gemini) models in parallel. View performance metrics (latency) and choose the best response.
* **📦 Quick-Apply Scaffolding**: Bootstrap full apps instantly with templates:
  - **React App** & **Next.js Full-Stack**
  - **Express API** & **Python Flask Backend**
  - **React Native Mobile App** (simulated inside a mobile preview frame)
  - **CLI Tool**, **Static Site**, and **AST Interpreter VM**
* **🌐 Live Browser & Device Preview**: Real-time rendering of your web or mobile layout side-by-side with your code editor.
* **⌨️ Integrated Developer Suite**: Interactive file explorer, tabbed editor with code highlights, status indicators, and terminal console.

---

## 🛠️ Getting Started

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (v16.0.0 or higher recommended).

If you plan to run models locally, download and install [Ollama](https://ollama.com/). We recommend pulling a coding model before starting:
```bash
ollama pull qwen2.5-coder
```

### 2. Installation

Clone this repository and install its dependencies:
```bash
npm install
```

### 3. Running the Server

Start the NAP backend server:
```bash
npm start
```
The server will boot up at **`http://localhost:3000`**. Open this URL in your browser to experience the NAP workspace.

---

## 🤖 Configuring LLM Providers

NAP supports three AI orchestration modes:

1. **Simulation (Free)**: Runs a mocked pipeline to demonstrate agent collaboration without requiring LLM setup.
2. **Ollama (Local)**: Integrates directly with your local Ollama daemon on port `11434`. Enter your target model (e.g. `qwen2.5-coder`) and watch the agents build code locally on your machine.
3. **Gemini (Cloud)**: Leverages Google's flagship models. Enter your Gemini API key in the top bar to run the pipeline with remote cloud agents.
4. **Ensemble Mode**: Combine them all! Select multiple active Ollama models along with Gemini, run prompts concurrently, and view side-by-side performance results.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Run agent pipeline / build project |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Command Palette |
| <kbd>Ctrl</kbd> + <kbd>`</kbd> | Toggle integrated terminal |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | Search across all files |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Toggle file explorer sidebar |
| <kbd>Ctrl</kbd> + <kbd>W</kbd> | Close active editor tab |
| <kbd>Ctrl</kbd> + <kbd>/</kbd> | Show keyboard shortcut guide |

---

## 📄 License & Security

This project is licensed under the [MIT License](LICENSE).  
For instructions on reporting security vulnerabilities, please refer to the [Security Policy](SECURITY.md).
