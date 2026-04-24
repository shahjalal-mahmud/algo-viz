/**
 * extension.ts — Algorithm Visualizer VS Code Extension (v3.1)
 * =============================================================
 * Fix: postMessage timing bug.
 *
 * The WebView takes time to parse and execute script.js after
 * panel.webview.html is assigned. Any postMessage sent before the
 * WebView's message listener is registered is silently dropped.
 *
 * Solution: WebView sends { type: "ready" } once script.js has run.
 * The extension holds its messages in a queue and flushes them only
 * after that handshake arrives. If the WebView never becomes ready
 * (e.g. CSP error) we flush after a 5-second fallback timeout.
 */

import * as vscode from "vscode";
import * as cp     from "child_process";
import * as fs     from "fs";
import * as path   from "path";
import * as https  from "https";

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

export function deactivate(): void {}

// ---------------------------------------------------------------------------
// Core command handler
// ---------------------------------------------------------------------------

async function runVisualizer(context: vscode.ExtensionContext): Promise<void> {

  // ── 1. Validate active editor ─────────────────────────────────────────────
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
  const benchmarkPath  = path.join(pythonDir, "benchmark.py");
  const perfFilePath   = path.join(pythonDir, "performance.json");

  // ── 2. Run algorithm ──────────────────────────────────────────────────────
  vscode.window.showInformationMessage("AlgoViz: Running algorithm...");
  try {
    await runPython(pythonFilePath, pythonDir);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`AlgoViz: Python error -- ${msg}`);
    return;
  }

  // ── 3. Run benchmark (non-fatal) ──────────────────────────────────────────
  let perfData: PerfPoint[] = [];
  if (fs.existsSync(benchmarkPath)) {
    vscode.window.showInformationMessage("AlgoViz: Running benchmark...");
    try {
      await runPython(benchmarkPath, pythonDir);
      if (fs.existsSync(perfFilePath)) {
        perfData = JSON.parse(fs.readFileSync(perfFilePath, "utf-8")) as PerfPoint[];
      }
    } catch (err: unknown) {
      console.warn("[AlgoViz] benchmark.py failed:", err);
      vscode.window.showWarningMessage("AlgoViz: Benchmark failed. Animation still works.");
    }
  }

  // ── 4. Read steps.json ────────────────────────────────────────────────────
  if (!fs.existsSync(stepsFilePath)) {
    vscode.window.showErrorMessage(
      "AlgoViz: steps.json not found. Make sure your script calls viz.save()."
    );
    return;
  }
  let steps: Step[];
  try {
    steps = JSON.parse(fs.readFileSync(stepsFilePath, "utf-8")) as Step[];
  } catch {
    vscode.window.showErrorMessage("AlgoViz: Could not parse steps.json.");
    return;
  }

  // ── 5. Open WebView ───────────────────────────────────────────────────────
  const panel = vscode.window.createWebviewPanel(
    "algoViz",
    "Algorithm Visualizer",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "webview")],
    }
  );
  panel.webview.html = buildWebviewHtml(panel.webview, context, steps, perfData);

  // ── 6. Ready-handshake message queue ─────────────────────────────────────
  //
  // We cannot postMessage immediately — script.js may not have registered
  // its listener yet. Instead we queue outgoing messages and flush them
  // only after the WebView sends { type: "ready" }.
  //
  // Fallback: if "ready" never arrives (e.g. CSP misconfiguration), flush
  // anyway after 5 seconds so the user sees an error rather than a spinner.

  let webviewReady = false;
  const messageQueue: object[] = [];

  const flush = (msg: object) => {
    if (webviewReady) {
      panel.webview.postMessage(msg);
    } else {
      messageQueue.push(msg);
    }
  };

  const fallbackTimer = setTimeout(() => {
    if (!webviewReady) {
      console.warn("[AlgoViz] WebView never sent 'ready' — flushing anyway");
      webviewReady = true;
      messageQueue.forEach(m => panel.webview.postMessage(m));
      messageQueue.length = 0;
    }
  }, 5000);

  // Listen for messages FROM the WebView
  panel.webview.onDidReceiveMessage(
    (msg: { type: string }) => {
      if (msg.type === "ready" && !webviewReady) {
        webviewReady = true;
        clearTimeout(fallbackTimer);
        // Flush anything queued while we were waiting
        messageQueue.forEach(m => panel.webview.postMessage(m));
        messageQueue.length = 0;
      }
    },
    undefined,
    context.subscriptions
  );

  // ── 7. AI analysis — async, non-blocking ─────────────────────────────────
  const cfg = readConfig();
  if (cfg.apiKey) {
    const userCode       = fs.readFileSync(pythonFilePath, "utf-8");
    const complexityHint = estimateComplexityLabel(perfData);

    analyzeWithAI(userCode, perfData, complexityHint, cfg)
      .then(aiText => {
        if (!panel.visible) return;
        flush({ type: "ai_result", text: aiText });
      })
      .catch(err => {
        console.error("[AlgoViz] AI analysis failed:", err);
        flush({ type: "ai_result", text: `AI analysis unavailable: ${String(err)}` });
      });
  } else {
    // No key — queue the nudge message; it will send once WebView is ready
    flush({ type: "ai_no_key" });
  }
}

// ---------------------------------------------------------------------------
// Python runner
// ---------------------------------------------------------------------------

function runPython(filePath: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = process.platform === "win32" ? "python" : "python3";
    cp.exec(`${bin} "${filePath}"`, { cwd }, (error, _out, stderr) => {
      error ? reject(new Error(stderr || error.message)) : resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// AI integration (unchanged from v3)
// ---------------------------------------------------------------------------

function readConfig(): AiConfig {
  const cfg = vscode.workspace.getConfiguration("algoViz");
  return {
    apiKey:   cfg.get<string>("aiApiKey",   ""),
    provider: cfg.get<string>("aiProvider", "deepseek") as AiProvider,
    model:    cfg.get<string>("aiModel",    ""),
  };
}

async function analyzeWithAI(
  userCode:       string,
  perfData:       PerfPoint[],
  complexityHint: string,
  cfg:            AiConfig
): Promise<string> {
  const { url, model } = resolveEndpoint(cfg);
  const prompt         = buildPrompt(userCode, perfData, complexityHint);

  const body = JSON.stringify({
    model,
    max_tokens: 600,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are an algorithm educator. Be concise, precise, and beginner-friendly. " +
          "Structure your response in exactly three labeled sections: " +
          "EXPLANATION, COMPLEXITY, and OPTIMIZATIONS. " +
          "Use plain text — no markdown, no bullet symbols.",
      },
      { role: "user", content: prompt },
    ],
  });

  const responseText = await httpsPost(url, body, cfg.apiKey);
  const json = JSON.parse(responseText) as ChatCompletionResponse;

  if (json.error) {
    throw new Error(json.error.message ?? "API returned an error");
  }
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI API");
  return content.trim();
}

function buildPrompt(
  userCode:       string,
  perfData:       PerfPoint[],
  complexityHint: string
): string {
  const perfTable = perfData
    .map(d => `n=${d.n}: ${(d.time * 1000).toFixed(3)}ms`)
    .join(", ");

  return `
I have written the following Python sorting algorithm:

\`\`\`python
${userCode}
\`\`\`

Benchmark results (average of 5 runs each):
${perfTable}

Statistical complexity estimate: ${complexityHint}

Please respond in exactly three labeled sections:

EXPLANATION
Explain in 2-3 sentences what this algorithm does and how it works.
Use simple language suitable for a beginner developer.

COMPLEXITY
Confirm or correct the estimated complexity (${complexityHint}).
Explain in one sentence WHY this is the complexity (what causes it).
Give the best-case and worst-case.

OPTIMIZATIONS
List 2-3 concrete improvements or alternative algorithms that would be faster.
For each, state what complexity it achieves.
`.trim();
}

function resolveEndpoint(cfg: AiConfig): { url: string; model: string } {
  switch (cfg.provider) {
    case "openrouter":
      return {
        url:   "https://openrouter.ai/api/v1/chat/completions",
        model: cfg.model || "deepseek/deepseek-chat",
      };
    case "deepseek":
    default:
      return {
        url:   "https://api.deepseek.com/v1/chat/completions",
        model: cfg.model || "deepseek-chat",
      };
  }
}

function httpsPost(url: string, body: string, apiKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      path:     parsed.pathname,
      method:   "POST",
      headers: {
        "Content-Type":   "application/json",
        "Authorization":  `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end",  () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });

    req.on("error", reject);
    req.setTimeout(30_000, () => {
      req.destroy();
      reject(new Error("AI API request timed out after 30s"));
    });

    req.write(body);
    req.end();
  });
}

function estimateComplexityLabel(data: PerfPoint[]): string {
  if (data.length < 3) return "O(n²)";
  const cv = (ratios: number[]): number => {
    const mean     = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const variance = ratios.reduce((s, r) => s + (r - mean) ** 2, 0) / ratios.length;
    return Math.sqrt(variance) / mean;
  };
  const scores = [
    { label: "O(n)",       cv: cv(data.map(d => d.time / d.n))                    },
    { label: "O(n log n)", cv: cv(data.map(d => d.time / (d.n * Math.log2(d.n)))) },
    { label: "O(n²)",      cv: cv(data.map(d => d.time / (d.n * d.n)))            },
  ];
  return scores.reduce((best, s) => s.cv < best.cv ? s : best).label;
}

// ---------------------------------------------------------------------------
// WebView HTML builder
// ---------------------------------------------------------------------------

function buildWebviewHtml(
  _webview: vscode.Webview,
  context:  vscode.ExtensionContext,
  steps:    Step[],
  perfData: PerfPoint[]
): string {
  const webviewDir = path.join(context.extensionPath, "webview");
  const readFile   = (name: string): string => {
    const p = path.join(webviewDir, name);
    return fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : `/* ${name} not found */`;
  };

  const css   = readFile("styles.css");
  const js    = readFile("script.js");
  const nonce = getNonce();

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

  <header class="header">
    <h1 class="header__title">&#9889; Bubble Sort Visualizer</h1>
    <div class="header__meta">
      <span id="stepCounter" class="badge">Step 0 / 0</span>
      <span id="lineNumber"  class="badge badge--line">Line --</span>
    </div>
  </header>

  <section class="viz-section">
    <div id="arrayContainer" class="array-container" aria-label="Array visualization"></div>
  </section>

  <div id="stepInfo" class="step-info">Initializing...</div>

  <div class="controls">
    <button id="btnPlay"  class="btn btn--primary">&#9654; Play</button>
    <button id="btnPause" class="btn" disabled>&#9646;&#9646; Pause</button>
    <button id="btnReset" class="btn">&#8634; Reset</button>
    <label class="speed-label">
      Speed
      <input id="speedSlider" type="range" min="50" max="1000" value="500" step="50" />
    </label>
  </div>

  <div class="legend">
    <span class="legend__item legend__item--compare">Comparing</span>
    <span class="legend__item legend__item--swap">Swapping</span>
    <span class="legend__item legend__item--normal">Unsorted</span>
    <span class="legend__item legend__item--done">Sorted</span>
  </div>

  <div class="section-divider"><span>Performance Analysis</span></div>

  <div class="complexity-row">
    <span class="complexity-label">Estimated Complexity:</span>
    <span id="complexityBadge" class="complexity-badge">--</span>
    <span id="complexityNote"  class="complexity-note"></span>
  </div>

  <div class="graph-section">
    <div class="graph-header">
      <span class="graph-title">Runtime vs Input Size</span>
      <span class="graph-subtitle">averaged over 5 runs</span>
      <label class="norm-toggle-label">
        <input type="checkbox" id="normToggle" />
        Show normalized curves
      </label>
    </div>
    <canvas id="perfChart" class="perf-canvas" aria-label="Performance graph"></canvas>
    <div id="graphEmpty" class="graph-empty" style="display:none">
      No performance data. Make sure benchmark.py is in the same folder.
    </div>
    <div id="graphExplanation" class="graph-explanation"></div>
  </div>

  <div class="section-divider"><span>AI Analysis</span></div>

  <div id="aiPanel" class="ai-panel">
    <div class="ai-panel__loading" id="aiLoading">
      <span class="ai-spinner"></span> Running AI analysis...
    </div>
    <div id="aiResult" class="ai-result" hidden>
      <div class="ai-section-block" id="aiExplanation"></div>
      <div class="ai-section-block" id="aiComplexity"></div>
      <div class="ai-section-block" id="aiOptimizations"></div>
    </div>
    <div id="aiNoKey" class="ai-no-key" hidden>
      No API key configured. Add <code>algoViz.aiApiKey</code> in VS Code User Settings (not workspace settings) to enable AI analysis.
    </div>
  </div>

  <script nonce="${nonce}">
    window.ALGO_STEPS = ${JSON.stringify(steps)};
    window.PERF_DATA  = ${JSON.stringify(perfData)};
  </script>
  <script nonce="${nonce}">${js}</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Utilities + Types
// ---------------------------------------------------------------------------

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 32 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

interface Step {
  type:  "init" | "compare" | "swap";
  array: number[];
  i:     number;
  j:     number;
  line:  number;
}

interface PerfPoint {
  n:          number;
  time:       number;
  n_norm:     number;
  nlogn_norm: number;
  n2_norm:    number;
}

type AiProvider = "deepseek" | "openrouter";

interface AiConfig {
  apiKey:   string;
  provider: AiProvider;
  model:    string;
}

interface ChatCompletionResponse {
  choices?: Array<{ message: { content: string } }>;
  error?:   { message?: string };
}