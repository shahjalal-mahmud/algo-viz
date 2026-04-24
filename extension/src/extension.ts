/**
 * extension.ts — Algorithm Visualizer VS Code Extension
 * ======================================================
 * Entry point. Registers the "Visualize Algorithm" command which:
 *   1. Finds the currently open Python file
 *   2. Runs it with Python so viz.py writes steps.json
 *   3. ALSO runs benchmark.py so it writes performance.json   ← NEW
 *   4. Reads steps.json + performance.json                    ← NEW
 *   5. Opens a WebView panel in a split editor
 *   6. Sends both datasets to WebView for animation + graph   ← NEW
 */

import * as vscode from "vscode";
import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Extension lifecycle
// ---------------------------------------------------------------------------

export function activate(context: vscode.ExtensionContext): void {
  console.log("[AlgoViz] Extension activated");

  const disposable = vscode.commands.registerCommand(
    "algoViz.visualize",
    () => runVisualizer(context)
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  console.log("[AlgoViz] Extension deactivated");
}

// ---------------------------------------------------------------------------
// Core command handler
// ---------------------------------------------------------------------------

async function runVisualizer(context: vscode.ExtensionContext): Promise<void> {
  // ── 1. Make sure a Python file is open ───────────────────────────────────
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("AlgoViz: No active editor found.");
    return;
  }

  const doc = editor.document;
  if (doc.languageId !== "python") {
    vscode.window.showErrorMessage("AlgoViz: Please open a Python file first.");
    return;
  }

  await doc.save();

  const pythonFilePath = doc.uri.fsPath;
  const pythonDir      = path.dirname(pythonFilePath);
  const stepsFilePath  = path.join(pythonDir, "steps.json");

  // ── NEW: benchmark.py lives in the same folder as the user's Python file ─
  const benchmarkPath  = path.join(pythonDir, "benchmark.py");
  const perfFilePath   = path.join(pythonDir, "performance.json");

  // ── 2. Run the user's algorithm file ────────────────────────────────────
  vscode.window.showInformationMessage("AlgoViz: Running algorithm...");
  try {
    await runPython(pythonFilePath, pythonDir);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`AlgoViz: Python error -- ${msg}`);
    return;
  }

  // ── 3. NEW: Run benchmark.py (non-fatal if missing) ─────────────────────
  let perfData: PerfPoint[] = [];
  if (fs.existsSync(benchmarkPath)) {
    vscode.window.showInformationMessage("AlgoViz: Running benchmark...");
    try {
      await runPython(benchmarkPath, pythonDir);
      if (fs.existsSync(perfFilePath)) {
        const raw = fs.readFileSync(perfFilePath, "utf-8");
        perfData = JSON.parse(raw) as PerfPoint[];
      }
    } catch (err: unknown) {
      // Benchmark failure is non-fatal — animation still works without it
      console.warn("[AlgoViz] benchmark.py failed:", err);
      vscode.window.showWarningMessage(
        "AlgoViz: Benchmark failed. Animation will still work."
      );
    }
  }

  // ── 4. Read steps.json ───────────────────────────────────────────────────
  if (!fs.existsSync(stepsFilePath)) {
    vscode.window.showErrorMessage(
      "AlgoViz: steps.json not found. Make sure your script calls viz.save()."
    );
    return;
  }

  let steps: Step[];
  try {
    const raw = fs.readFileSync(stepsFilePath, "utf-8");
    steps = JSON.parse(raw) as Step[];
  } catch {
    vscode.window.showErrorMessage("AlgoViz: Could not parse steps.json.");
    return;
  }

  // ── 5. Open WebView panel ────────────────────────────────────────────────
  const panel = vscode.window.createWebviewPanel(
    "algoViz",
    "Algorithm Visualizer",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, "webview"),
      ],
    }
  );

  // ── 6. Build HTML — now passes perfData too ──────────────────────────────
  panel.webview.html = buildWebviewHtml(panel.webview, context, steps, perfData);
}

// ---------------------------------------------------------------------------
// Python runner (unchanged)
// ---------------------------------------------------------------------------

function runPython(filePath: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const pythonBin = process.platform === "win32" ? "python" : "python3";
    const cmd = `${pythonBin} "${filePath}"`;

    cp.exec(cmd, { cwd }, (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve();
      }
    });
  });
}

// ---------------------------------------------------------------------------
// WebView HTML builder — only change: accepts + injects perfData
// ---------------------------------------------------------------------------

function buildWebviewHtml(
  webview: vscode.Webview,
  context: vscode.ExtensionContext,
  steps: Step[],
  perfData: PerfPoint[]        // ← NEW parameter
): string {
  const webviewDir = path.join(context.extensionPath, "webview");

  const readFile = (name: string): string => {
    const filePath = path.join(webviewDir, name);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
    return `/* ${name} not found */`;
  };

  const css = readFile("styles.css");
  const js  = readFile("script.js");

  const nonce     = getNonce();
  const stepsJson = JSON.stringify(steps);
  const perfJson  = JSON.stringify(perfData);   // ← NEW

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
             style-src 'nonce-${nonce}';
             script-src 'nonce-${nonce}';" />
  <title>Algorithm Visualizer</title>
  <style nonce="${nonce}">${css}</style>
</head>
<body>

  <!-- ── Header ─────────────────────────────────────────────────── -->
  <header class="header">
    <h1 class="header__title">&#9889; Bubble Sort Visualizer</h1>
    <div class="header__meta">
      <span id="stepCounter" class="badge">Step 0 / 0</span>
      <span id="lineNumber" class="badge badge--line">Line --</span>
    </div>
  </header>

  <!-- ── Array bars (EXISTING — untouched) ───────────────────────── -->
  <section class="viz-section">
    <div id="arrayContainer" class="array-container" aria-label="Array visualization"></div>
  </section>

  <!-- ── Step info strip (EXISTING — untouched) ──────────────────── -->
  <div id="stepInfo" class="step-info">Initializing...</div>

  <!-- ── Controls (EXISTING — untouched) ─────────────────────────── -->
  <div class="controls">
    <button id="btnPlay"  class="btn btn--primary">&#9654; Play</button>
    <button id="btnPause" class="btn" disabled>&#9646;&#9646; Pause</button>
    <button id="btnReset" class="btn">&#8634; Reset</button>
    <label class="speed-label">
      Speed
      <input id="speedSlider" type="range" min="50" max="1000" value="500" step="50" />
    </label>
  </div>

  <!-- ── Legend (EXISTING — untouched) ───────────────────────────── -->
  <div class="legend">
    <span class="legend__item legend__item--compare">Comparing</span>
    <span class="legend__item legend__item--swap">Swapping</span>
    <span class="legend__item legend__item--normal">Unsorted</span>
    <span class="legend__item legend__item--done">Sorted</span>
  </div>

  <!-- ════════════════════════════════════════════════════════════════
       NEW SECTIONS BELOW — added without touching anything above
       ════════════════════════════════════════════════════════════════ -->

  <!-- ── Divider ──────────────────────────────────────────────────── -->
  <div class="section-divider">
    <span>Performance Analysis</span>
  </div>

  <!-- ── Complexity badge ─────────────────────────────────────────── -->
  <div class="complexity-row">
    <span class="complexity-label">Estimated Complexity:</span>
    <span id="complexityBadge" class="complexity-badge">--</span>
    <span id="complexityNote" class="complexity-note"></span>
  </div>

  <!-- ── Performance graph ────────────────────────────────────────── -->
  <div class="graph-section">
    <div class="graph-header">
      <span class="graph-title">Runtime vs Input Size</span>
      <span class="graph-subtitle">averaged over 3 runs</span>
    </div>
    <canvas id="perfChart" class="perf-canvas" aria-label="Performance graph"></canvas>
    <div id="graphEmpty" class="graph-empty">
      No performance data. Make sure benchmark.py is in the same folder.
    </div>
  </div>

  <!-- ── AI Explanation ───────────────────────────────────────────── -->
  <div class="ai-section">
    <label class="ai-toggle-label">
      <input type="checkbox" id="aiToggle" class="ai-toggle-input" />
      <span class="ai-toggle-track"><span class="ai-toggle-thumb"></span></span>
      Show AI Explanation
    </label>
    <div id="aiBox" class="ai-box" hidden>
      <div class="ai-box__header">&#129302; AI Analysis</div>
      <p id="aiText" class="ai-box__text"></p>
    </div>
  </div>

  <!-- Inject both datasets as globals -->
  <script nonce="${nonce}">
    window.ALGO_STEPS = ${stepsJson};
    window.PERF_DATA  = ${perfJson};
  </script>
  <script nonce="${nonce}">${js}</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function getNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 32 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Step {
  type: "init" | "compare" | "swap";
  array: number[];
  i: number;
  j: number;
  line: number;
}

// ← NEW
interface PerfPoint {
  n: number;
  time: number;
}