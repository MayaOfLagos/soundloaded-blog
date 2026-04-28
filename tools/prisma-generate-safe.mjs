import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const isWindows = process.platform === "win32";
const rootDir = process.cwd();

const firstRun = runPrismaGenerate({ printOutput: false });
if (firstRun.status === 0) {
  printRunOutput(firstRun);
  process.exit(0);
}

if (!isWindows || !isWindowsPrismaEngineLock(firstRun.output)) {
  printRunOutput(firstRun);
  process.exit(firstRun.status ?? 1);
}

console.warn("\n[prisma-generate-safe] Prisma generate hit the Windows query engine DLL lock.");
console.warn(
  "[prisma-generate-safe] Stopping local Next dev processes for this repo and retrying..."
);

const stopped = stopLocalNextProcesses();
if (stopped.length > 0) {
  console.warn(
    `[prisma-generate-safe] Stopped process IDs: ${stopped
      .map((processInfo) => processInfo.ProcessId)
      .join(", ")}`
  );
} else {
  console.warn("[prisma-generate-safe] No matching local Next dev process was found.");
}

const removedTemps = removePrismaTempEngines();
if (removedTemps > 0) {
  console.warn(`[prisma-generate-safe] Removed ${removedTemps} stale Prisma temp engine file(s).`);
}

sleep(1500);

const retryRun = runPrismaGenerate({ printOutput: true });
process.exit(retryRun.status ?? 1);

function runPrismaGenerate({ printOutput }) {
  const result = spawnSync("prisma", ["generate"], {
    cwd: rootDir,
    encoding: "utf8",
    shell: isWindows,
  });

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const run = {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    output,
  };

  if (result.error) {
    run.status = 1;
    run.stderr += `${result.error.message}\n`;
    run.output += `\n${result.error.message}`;
  }

  if (printOutput) {
    printRunOutput(run);
  }

  return run;
}

function printRunOutput(run) {
  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
}

function isWindowsPrismaEngineLock(output) {
  return (
    output.includes("EPERM: operation not permitted, rename") &&
    output.includes("query_engine-windows.dll.node")
  );
}

function stopLocalNextProcesses() {
  const processes = findLocalNextProcesses();
  for (const processInfo of processes) {
    spawnSync("powershell.exe", [
      "-NoProfile",
      "-Command",
      `Stop-Process -Id ${Number(processInfo.ProcessId)} -Force -ErrorAction SilentlyContinue`,
    ]);
  }
  return processes;
}

function findLocalNextProcesses() {
  const ps = `
$repo = ${toPowerShellString(rootDir)}
Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
  Where-Object {
    $_.CommandLine -and
    $_.CommandLine.Contains($repo) -and
    (
      $_.CommandLine -like '*pnpm.cjs* dev*' -or
      $_.CommandLine -like '*next* dev*' -or
      $_.CommandLine -like '*.next*dev*' -or
      $_.CommandLine -like '*next*start-server.js*'
    )
  } |
  Select-Object ProcessId,CommandLine |
  ConvertTo-Json -Compress
`;

  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", ps], {
    encoding: "utf8",
  });

  const stdout = result.stdout?.trim();
  if (!stdout) return [];

  try {
    const parsed = JSON.parse(stdout);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function removePrismaTempEngines() {
  const pnpmStore = path.join(rootDir, "node_modules", ".pnpm");
  if (!existsSync(pnpmStore)) return 0;

  let removed = 0;
  for (const packageDir of readdirSync(pnpmStore, { withFileTypes: true })) {
    if (!packageDir.isDirectory() || !packageDir.name.startsWith("@prisma+client@")) continue;

    const clientDir = path.join(pnpmStore, packageDir.name, "node_modules", ".prisma", "client");
    if (!existsSync(clientDir)) continue;

    for (const entry of readdirSync(clientDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.startsWith("query_engine-windows.dll.node.tmp")) {
        continue;
      }

      rmSync(path.join(clientDir, entry.name), { force: true });
      removed += 1;
    }
  }

  return removed;
}

function toPowerShellString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
