# AI Council — ₹0 Cost Multi-AI Agent Orchestrator

AI Council is an offline-first, multi-AI orchestrator designed to run entirely locally or on free cloud tiers with **₹0 API cost**. By leveraging multiple local models running on your machine via **Ollama** (or optional free-tier cloud models like **Google Gemini**), it distributes tasks to parallel agents, runs a critic agent to detect logical inconsistencies or code errors, refines candidate solutions, sandboxes code execution, and synthesizes a final consensus answer.

---

## ⚙️ How it Works (Orchestration Pipeline)

```
USER QUERY
   │
   ▼
1. TASK ANALYSIS ──► (Mathematics, Programming, Research, Logic, Writing, Simple)
   │
   ├─► [Simple Query]: Routes to a single default model to conserve CPU/RAM
   ▼
2. MULTI-MODEL PARALLEL RUN (Llama, Qwen, Gemma, etc.)
   │
   ├─► [Research Task]: Optional Web search (DuckDuckGo HTML scraper) injected into context
   ▼
3. LOCAL CODE EXECUTION ──► [Safe Sandbox]: If enabled, executes generated JS code
   │                                        in isolated child process with 2s timeout
   ▼
4. CRITIC EVALUATION ──► Compares candidate results, checks sandbox outputs & errors
   │
   ├──► [Consensus reached / Answers aligned] ───────────────┐
   └──► [Contradictions / Code errors] ──► Iterative Refinement (Max 3 Loops)
                                                             ▼
5. SYNTHESIS ──────────────────────────────────────► FINAL ANSWER (Estimated Cost: ₹0)
```

---

## 🖥️ System Requirements & Hardware Suggestions

The system detects CPU cores, physical RAM, and GPU capabilities on startup and advises:
* **Low RAM (<8GB / CPU-only):** Smaller local models under 4B parameters (e.g. `qwen2.5:3b`, `llama3.2:3b`).
* **Medium RAM (8GB-16GB / CPU-only):** Up to 8B models (e.g. `llama3.1:8b`, `gemma2:9b`), though responses will be slower on CPU.
* **GPU Accelerated (NVIDIA / VRAM >= 6GB):** Can comfortably accelerate 8B-14B models (e.g. `llama3.1:8b`, `qwen2.5:14b`).

---

## 🚀 Setup & Installation Instructions

### Prerequisites
1. **Node.js** (v18.0.0 or higher) installed on your system.
2. **Ollama** installed on your system (Required for local offline execution).

---

### Step 1: Install and Run Ollama
1. Download Ollama for Windows/macOS/Linux from [ollama.com](https://ollama.com).
2. Install and run the Ollama application. Ensure it is running in your taskbar/background.
3. Open your terminal (PowerShell, Command Prompt, or Bash) and download the local models of your choice:
   ```bash
   # We recommend Qwen 2.5 (3B) and Llama 3.2 (3B) as excellent lightweight local models:
   ollama pull qwen2.5:3b
   ollama pull llama3.2:3b
   
   # Optional: Pull larger models if you have an active GPU:
   ollama pull llama3.1:8b
   ```

### Step 2: Clone / Open Project Directory
Navigate to the root directory where the repository is located.

### Step 3: Install Dependencies
From the workspace root directory, run the monorepo helper script to install all packages in the root, backend, and frontend concurrently:
```bash
npm run install:all
```

---

## 🏃 Running the Application

### 1. Start Frontend and Backend Concurrently
To boot both the Express server (port 5000) and the Vite React server (port 5173) in parallel, run:
```bash
npm run dev
```
Once started, the CLI will output links. Open your browser to:
👉 **http://localhost:5173**

### 2. Verify Models Connection
* The dashboard settings panel on the right will display **"Ollama Online"** (with a green dot) and list your downloaded models.
* If Ollama is offline, the interface will display setup instructions and let you input an optional Google Gemini free-tier API key to use cloud models.

---

## 🧪 Running Integration Tests
To run unit and integration tests covering heuristic routing, sandbox process isolation, security keyword scanning, and refinement iteration boundaries, run:
```bash
npm run test
```

---

## 🔒 Security & Sandbox Isolation
* **Local Code Execution Sandbox:** The code runner spawns a separate, isolated node sub-process, wipes the environment variables (`env: {}`), and enforces a strict 2000ms timeout.
* **Input Sanitizer:** Static scanning rejects code containing forbidden system keywords (like `fs`, `require`, `child_process`, `net`, `http`, etc.).
* **File Upload Limits:** Upload size is limited to 10MB to protect host resources, and files are parsed in memory without being stored on disk.
