import { spawn } from 'child_process';

export interface SandboxResult {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}

export function executeCode(code: string): Promise<SandboxResult> {
  return new Promise((resolve) => {
    // 1. Static Security Checks
    const blockedKeywords = [
      'require', 'import', 'fs', 'child_process', 'process', 'net', 'http',
      'eval', 'Function', 'global', 'env', 'os', 'path', 'dns', 'cluster',
      'v8', 'vm', 'worker_threads', 'dgram', 'tls', 'https', 'readline', 'repl',
      'module', '__dirname', '__filename', 'process.kill', 'process.exit'
    ];

    const codeLower = code.toLowerCase();
    for (const keyword of blockedKeywords) {
      // Match word boundaries to prevent false positives (e.g. variable "myProcess" shouldn't trigger "process")
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(codeLower)) {
        return resolve({
          success: false,
          stdout: '',
          stderr: '',
          error: `Security Check Failed: Blocked library or keyword '${keyword}' detected.`
        });
      }
    }

    // 2. Process Isolation: Spawn a Node process with empty environment variables
    const worker = spawn('node', ['-e', code], {
      env: {}, // completely empty environment variables
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdoutData = '';
    let stderrData = '';
    let completed = false;

    worker.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    worker.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    // 3. Timeout: Kill process if running longer than 2000ms
    const timeout = setTimeout(() => {
      if (!completed) {
        completed = true;
        try {
          worker.kill('SIGKILL');
        } catch (e) {}
        resolve({
          success: false,
          stdout: stdoutData,
          stderr: stderrData,
          error: 'Execution Timed Out (Maximum limit 2000ms exceeded)'
        });
      }
    }, 2000);

    worker.on('close', (code) => {
      if (!completed) {
        completed = true;
        clearTimeout(timeout);
        resolve({
          success: code === 0,
          stdout: stdoutData,
          stderr: stderrData,
          error: code === 0 ? undefined : `Process exited with code ${code}`
        });
      }
    });

    worker.on('error', (err) => {
      if (!completed) {
        completed = true;
        clearTimeout(timeout);
        resolve({
          success: false,
          stdout: stdoutData,
          stderr: stderrData,
          error: `Process error: ${err.message}`
        });
      }
    });
  });
}
