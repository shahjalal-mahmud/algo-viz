/**
 * extension.ts — Algorithm Visualizer VS Code Extension
 * ======================================================
 * Entry point. Registers the "Visualize Algorithm" command which:
 *   1. Finds the currently open Python file
 *   2. Runs it with Python so viz.py writes steps.json
 *   3. Reads steps.json
 *   4. Opens a WebView panel in a split editor
 *   5. Sends the step data into the WebView for animation
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

  // Save the file so we always run the latest version
  await doc.save();

  const pythonFilePath = doc.uri.fsPath;
  const pythonDir = path.dirname(pythonFilePath);
  const stepsFilePath = path.join(pythonDir, "steps.json");

  // ── 2. Run the Python file ───────────────────────────────────────────────
  vscode.window.showInformationMessage("AlgoViz: Running algorithm…");

  try {
    await runPython(pythonFilePath, pythonDir);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`AlgoViz: Python error — ${msg}`);
    return;
  }

  // ── 3. Read steps.json ───────────────────────────────────────────────────
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

  // ── 4. Open (or reuse) a WebView panel ──────────────────────────────────
  const panel = vscode.window.createWebviewPanel(
    "algoViz",                          // internal identifier
    "Algorithm Visualizer",             // tab title
    vscode.ViewColumn.Beside,           // open in split pane
    {
      enableScripts: true,              // allow JS in the webview
      localResourceRoots: [
        // Allow the webview to load files from the webview/ folder
        vscode.Uri.joinPath(context.extensionUri, "webview"),
      ],
    }
  );

  // ── 5. Load HTML and inject step data ────────────────────────────────────
  panel.webview.html = buildWebviewHtml(panel.webview, context, steps);
}

// ---------------------------------------------------------------------------
// Python runner (Promise wrapper around child_process.exec)
// ---------------------------------------------------------------------------

function runPython(filePath: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Try "python3" first; fall back to "python" for Windows environments
    const pythonBin = process.platform === "win32" ? "python" : "python3";
    const cmd = `${pythonBin} "${filePath}"`;

    cp.exec(cmd, { cwd }, (error, _stdout, stderr) => {
      if (error) {
        // stderr usually has the traceback — include it for clarity
        reject(new Error(stderr || error.message));
      } else {
        resolve();
      }
    });
  });
}

// ---------------------------------------------------------------------------
// WebView HTML builder
// ---------------------------------------------------------------------------

/**
 * Reads the webview source files from disk (or embeds them inline for MVP
 * simplicity), substitutes the steps data, and returns the full HTML string.
 *
 * For this MVP we embed CSS + JS inline rather than using local resource URIs
 * so the extension works immediately without any build step for the webview.
 */
function buildWebviewHtml(
  webview: vscode.Webview,
  context: vscode.ExtensionContext,
  steps: Step[]
): string {
  // Read the three webview source files that sit next to extension.ts
  const webviewDir = path.join(context.extensionPath, "webview");

  const readFile = (name: string): string => {
    const filePath = path.join(webviewDir, name);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
    // Graceful fallback so the extension doesn't crash during development
    return `/* ${name} not found */`;
  };

  const css = readFile("styles.css");
  const js  = readFile("script.js");

  // Safely JSON-encode the steps array and inject it as a JS global.
  // The nonce prevents the VS Code Content Security Policy from blocking it.
  const nonce = getNonce();
  const stepsJson = JSON.stringify(steps);

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
    <h1 class="header__title">⚡ Bubble Sort Visualizer</h1>
    <div class="header__meta">
      <span id="stepCounter" class="badge">Step 0 / 0</span>
      <span id="lineNumber" class="badge badge--line">Line —</span>
    </div>
  </header>

  <!-- ── Array bars ──────────────────────────────────────────────── -->
  <section class="viz-section">
    <div id="arrayContainer" class="array-container" aria-label="Array visualization"></div>
  </section>

  <!-- ── Step info strip ─────────────────────────────────────────── -->
  <div id="stepInfo" class="step-info">Initializing…</div>

  <!-- ── Controls ────────────────────────────────────────────────── -->
  <div class="controls">
    <button id="btnPlay"  class="btn btn--primary">▶ Play</button>
    <button id="btnPause" class="btn" disabled>⏸ Pause</button>
    <button id="btnReset" class="btn">↺ Reset</button>
    <label class="speed-label">
      Speed
      <input id="speedSlider" type="range" min="50" max="1000" value="500" step="50" />
    </label>
  </div>

  <!-- ── Legend ──────────────────────────────────────────────────── -->
  <div class="legend">
    <span class="legend__item legend__item--compare">Comparing</span>
    <span class="legend__item legend__item--swap">Swapping</span>
    <span class="legend__item legend__item--normal">Unsorted</span>
    <span class="legend__item legend__item--done">Sorted</span>
  </div>

  <!-- Inject step data as a global before script.js runs -->
  <script nonce="${nonce}">
    window.ALGO_STEPS = ${stepsJson};
  </script>
  <script nonce="${nonce}">${js}</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Generate a random nonce for Content Security Policy. */
function getNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 32 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

// ---------------------------------------------------------------------------
// Shared types (mirrored from Python output)
// ---------------------------------------------------------------------------

interface Step {
  type: "init" | "compare" | "swap";
  array: number[];
  i: number;
  j: number;
  line: number;
}