import { execSync } from "child_process";

function listListeningPids(port) {
  if (process.platform === "win32") {
    try {
      const output = execSync(`netstat -ano -p tcp | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      const pids = new Set();
      for (const line of output.split(/\r?\n/)) {
        if (!/LISTENING/i.test(line)) continue;
        const pid = line.trim().split(/\s+/).at(-1);
        if (pid && pid !== "0") pids.add(pid);
      }
      return [...pids];
    } catch {
      return [];
    }
  }

  try {
    const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    return output
      .split(/\r?\n/)
      .map((pid) => pid.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (process.platform === "win32") {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    return;
  }
  execSync(`kill -9 ${pid}`, { stdio: "ignore" });
}

function stopPort(port) {
  const pids = listListeningPids(port);
  if (!pids.length) {
    console.log(`Port ${port}: nothing to stop`);
    return;
  }

  for (const pid of pids) {
    try {
      killPid(pid);
      console.log(`Port ${port}: stopped PID ${pid}`);
    } catch (err) {
      console.warn(`Port ${port}: could not stop PID ${pid} (${err.message})`);
    }
  }
}

for (const port of [3001, 5173]) {
  stopPort(port);
}
