const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const activeProcesses = new Map(); // runId -> childProcess

function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    exec(`taskkill /PID ${pid} /T /F`, (err) => {
      if (err) console.warn(`taskkill warning for PID ${pid}:`, err.message);
    });
  } else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch (e) {
      try { process.kill(pid, 'SIGKILL'); } catch (err) {}
    }
  }
}

function runCommandSafe({ executable, args, cwd, timeoutMs = 300000, runId }) {
  return new Promise((resolve) => {
    let stdoutBuffer = '';
    let stderrBuffer = '';
    let isFinished = false;

    // Ensure working directory exists
    if (cwd && !fs.existsSync(cwd)) {
      fs.mkdirSync(cwd, { recursive: true });
    }

    // Clean minimal environment without sensitive API keys
    const cleanEnv = { ...process.env };
    delete cleanEnv.JWT_SECRET;
    delete cleanEnv.GEMINI_API_KEY;
    delete cleanEnv.LUMA_API_KEY;

    let child;
    try {
      child = spawn(executable, args, {
        cwd: cwd || process.cwd(),
        shell: false,
        env: cleanEnv,
        windowsHide: true
      });
    } catch (err) {
      return resolve({
        exitCode: 1,
        outputTail: `Failed to spawn process: ${err.message}`,
        timedOut: false
      });
    }

    if (runId && child.pid) {
      activeProcesses.set(runId, child);
    }

    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        if (child.pid) killProcessTree(child.pid);
        activeProcesses.delete(runId);
        resolve({
          exitCode: 124,
          outputTail: `${stdoutBuffer}\n[Process timed out after ${timeoutMs / 1000}s and was terminated]`,
          timedOut: true
        });
      }
    }, timeoutMs);

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      stdoutBuffer = (stdoutBuffer + text).slice(-4000); // keep last 4KB
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      stderrBuffer = (stderrBuffer + text).slice(-4000);
    });

    child.on('error', (err) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        activeProcesses.delete(runId);
        resolve({
          exitCode: 1,
          outputTail: `Execution error: ${err.message}\n${stderrBuffer}`,
          timedOut: false
        });
      }
    });

    child.on('close', (code) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        activeProcesses.delete(runId);
        const combined = (stdoutBuffer + '\n' + stderrBuffer).trim().slice(-2000);
        resolve({
          exitCode: code !== null ? code : 0,
          outputTail: combined || `Process finished with exit code ${code}`,
          timedOut: false
        });
      }
    });
  });
}

function cancelRunProcess(runId) {
  const child = activeProcesses.get(runId);
  if (child && child.pid) {
    killProcessTree(child.pid);
    activeProcesses.delete(runId);
    return true;
  }
  return false;
}

module.exports = {
  runCommandSafe,
  cancelRunProcess
};
