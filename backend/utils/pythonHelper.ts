/**
 * backend/utils/pythonHelper.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified helper for calling Python scripts across the backend.
 * Handles platform-specific binary resolution (python vs python3).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { spawn } from 'child_process';
import os from 'os';

/**
 * Returns the correct python binary name based on the current platform.
 */
export function getPythonBin(): string {
  return process.platform === 'win32' ? 'python' : 'python3';
}

/**
 * Interface for the result of a Python script execution.
 */
export interface PythonExecResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Spawns a Python process and returns a promise that resolves with the result.
 * @param scriptPath Path to the Python script relative to project root.
 * @param args Array of arguments to pass to the script.
 * @returns Promise<PythonExecResult>
 */
export async function runPythonScript(scriptPath: string, args: string[]): Promise<PythonExecResult> {
  const pythonBin = getPythonBin();
  const fullArgs = [scriptPath, ...args];

  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, fullArgs);
    let stdout = "";
    let stderr = "";

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}
