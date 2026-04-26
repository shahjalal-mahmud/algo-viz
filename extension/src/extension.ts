/**
 * extension.ts — AlgoViz v5.0
 * ============================
 * Complexity analysis + AI explanation for Python & C++ DSA solutions.
 * Animation system removed — focus is purely on complexity insight.
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

  // ── 1. Validate active editor ──────────────────────────────────────────────
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("AlgoViz: No active editor found.");
    return;
  }
  const doc  = editor.document;
  const lang = doc.languageId;

  const SUPPORTED = ["python", "cpp"];
  if (!SUPPORTED.includes(lang)) {
    vscode.window.showErrorMessage(
      "AlgoViz: Supports Python (.py) and C++ (.cpp) files only."
    );
    return;
  }
  await doc.save();

  const filePath = doc.uri.fsPath;
  const fileDir  = path.dirname(filePath);
  const perfPath = path.join(fileDir, "performance.json");

  // ── 2. Run the user's code ─────────────────────────────────────────────────
  vscode.window.showInformationMessage(`AlgoViz: Running ${lang.toUpperCase()} file…`);
  try {
    if (lang === "python") {
      await runPython(filePath, fileDir);
    } else {
      await compileCpp(filePath, fileDir);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`AlgoViz: Run error — ${msg}`);
    return;
  }

  // ── 3. Auto-benchmark (non-fatal) ─────────────────────────────────────────
  let perfData: PerfPoint[] = [];
  vscode.window.showInformationMessage("AlgoViz: Benchmarking…");
  try {
    const benchmarkScript = path.join(context.extensionPath, "resources", "auto_benchmark.py");
    if (!fs.existsSync(benchmarkScript)) {
      throw new Error("auto_benchmark.py not found in extension resources/");
    }

    if (lang === "python") {
      await runPythonArgs(benchmarkScript, [filePath], fileDir);
    } else {
      await compileCppBenchmark(filePath, fileDir, context);
    }

    if (fs.existsSync(perfPath)) {
      perfData = JSON.parse(fs.readFileSync(perfPath, "utf-8")) as PerfPoint[];
    }
  } catch (err: unknown) {
    console.warn("[AlgoViz] Benchmark failed:", err);
    vscode.window.showWarningMessage(
      "AlgoViz: Benchmark skipped — complexity chart will be empty."
    );
  }

  // ── 4. Open WebView ────────────────────────────────────────────────────────
  const panel = vscode.window.createWebviewPanel(
    "algoViz",
    `AlgoViz — ${path.basename(filePath)}`,
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "webview")],
    }
  );
  panel.webview.html = buildWebviewHtml(panel.webview, context, perfData, lang, path.basename(filePath));

  // ── 5. Ready-handshake message queue ──────────────────────────────────────
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

  panel.webview.onDidReceiveMessage(
    (msg: { type: string }) => {
      if (msg.type === "ready" && !webviewReady) {
        webviewReady = true;
        clearTimeout(fallbackTimer);
        messageQueue.forEach(m => panel.webview.postMessage(m));
        messageQueue.length = 0;
      }
    },
    undefined,
    context.subscriptions
  );

  // ── 6. AI analysis — async, non-blocking ──────────────────────────────────
  const cfg = readConfig();
  if (cfg.apiKey) {
    const userCode       = fs.readFileSync(filePath, "utf-8");
    const complexityHint = estimateComplexityLabel(perfData);

    analyzeWithAI(userCode, perfData, complexityHint, lang, cfg)
      .then(aiText => {
        if (!panel.visible) return;
        flush({ type: "ai_result", text: aiText });
      })
      .catch(err => {
        console.error("[AlgoViz] AI analysis failed:", err);
        flush({ type: "ai_result", text: `AI analysis unavailable: ${String(err)}` });
      });
  } else {
    flush({ type: "ai_no_key" });
  }
}

// ---------------------------------------------------------------------------
// Language runners
// ---------------------------------------------------------------------------

function runPython(filePath: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = process.platform === "win32" ? "python" : "python3";
    cp.exec(`${bin} "${filePath}"`, { cwd }, (error, _out, stderr) => {
      error ? reject(new Error(stderr || error.message)) : resolve();
    });
  });
}

function runPythonArgs(scriptPath: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin     = process.platform === "win32" ? "python" : "python3";
    const argList = args.map(a => `"${a}"`).join(" ");
    cp.exec(`${bin} "${scriptPath}" ${argList}`, { cwd }, (error, _out, stderr) => {
      error ? reject(new Error(stderr || error.message)) : resolve();
    });
  });
}

function compileCpp(filePath: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const outPath = filePath.replace(/\.cpp$/, process.platform === "win32" ? ".exe" : "");
    cp.exec(`g++ -O2 -std=c++17 -o "${outPath}" "${filePath}"`, { cwd }, (err, _, stderr) => {
      if (err) return reject(new Error(`Compile error:\n${stderr}`));
      // For files with #ifndef ALGOVIZ_BENCH guards, run is optional — non-fatal
      cp.exec(`"${outPath}"`, { cwd }, (err2, _, stderr2) => {
        err2 ? reject(new Error(stderr2 || err2.message)) : resolve();
      });
    });
  });
}

async function compileCppBenchmark(
  userFilePath: string,
  cwd:          string,
  context:      vscode.ExtensionContext
): Promise<void> {
  const templatePath = path.join(context.extensionPath, "resources", "cpp_benchmark_template.cpp");
  if (!fs.existsSync(templatePath)) {
    throw new Error("cpp_benchmark_template.cpp not found in extension resources/");
  }

  const userCode = fs.readFileSync(userFilePath, "utf-8");
  const template = fs.readFileSync(templatePath, "utf-8");

  // Strip any existing main() from user code to avoid conflicts
  const userCodeNoMain = userCode.replace(
    /#ifndef\s+ALGOVIZ_BENCH[\s\S]*?#endif/g,
    ""
  );

  const combined = template.replace("// {{USER_CODE}}", userCodeNoMain);

  const benchSrc = path.join(cwd, "_algoviz_bench.cpp");
  const benchExe = path.join(cwd, "_algoviz_bench" + (process.platform === "win32" ? ".exe" : ""));
  fs.writeFileSync(benchSrc, combined, "utf-8");

  return new Promise((resolve, reject) => {
    cp.exec(
      `g++ -O2 -std=c++17 -DALGOVIZ_BENCH -o "${benchExe}" "${benchSrc}"`,
      { cwd },
      (err, _, stderr) => {
        if (err) {
          try { fs.unlinkSync(benchSrc); } catch {}
          return reject(new Error(`C++ benchmark compile error:\n${stderr}`));
        }
        cp.exec(`"${benchExe}"`, { cwd }, (err2, _, stderr2) => {
          try { fs.unlinkSync(benchSrc); } catch {}
          try { fs.unlinkSync(benchExe); } catch {}
          err2 ? reject(new Error(stderr2 || err2.message)) : resolve();
        });
      }
    );
  });
}

// ---------------------------------------------------------------------------
// AI integration
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
  language:       string,
  cfg:            AiConfig
): Promise<string> {
  const { url, model } = resolveEndpoint(cfg);
  const prompt         = buildPrompt(userCode, perfData, complexityHint, language);

  const body = JSON.stringify({
    model,
    max_tokens: 800,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are a concise algorithm coach. Reply in exactly five ALL-CAPS sections: " +
          "EXPLANATION, COMPLEXITY, STEP_BY_STEP, OPTIMIZATIONS, RELATED_PROBLEMS. " +
          "Plain text only, no markdown, no bullets.",
      },
      { role: "user", content: prompt },
    ],
  });

  const responseText = await httpsPost(url, body, cfg.apiKey);
  const json = JSON.parse(responseText) as ChatCompletionResponse;

  if (json.error) throw new Error(json.error.message ?? "API returned an error");
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI API");
  return content.trim();
}

/**
 * Truncate user code to ~60 lines max so the prompt stays within free-tier limits.
 */
function truncateCode(code: string, maxLines = 60): string {
  const lines = code.split("\n");
  if (lines.length <= maxLines) return code;
  return lines.slice(0, maxLines).join("\n") + `\n... (truncated at ${maxLines} lines)`;
}

function buildPrompt(
  userCode:       string,
  perfData:       PerfPoint[],
  complexityHint: string,
  language:       string
): string {
  const code = truncateCode(userCode);
  const bench = perfData.length > 0
    ? perfData.map(d => `n=${d.n}:${(d.time * 1000).toFixed(2)}ms`).join(" ")
    : "none";

  return `${language.toUpperCase()} code:
\`\`\`
${code}
\`\`\`
Benchmark: ${bench}
Estimated complexity: ${complexityHint}

Reply in these five sections (ALL CAPS header, plain text, be brief):

EXPLANATION
2-3 sentences: what problem, what approach.

COMPLEXITY
Time: O(?), why. Space: O(?), why. Best/worst case.

STEP_BY_STEP
Tiny example (3-4 elements), trace key steps.

OPTIMIZATIONS
3 alternatives: name, complexity, one-line reason.

RELATED_PROBLEMS
3 LeetCode problems: name, difficulty, one-line connection.`.trim();
}

function resolveEndpoint(cfg: AiConfig): { url: string; model: string } {
  switch (cfg.provider) {
    case "openrouter":
      return { url: "https://openrouter.ai/api/v1/chat/completions", model: cfg.model || "deepseek/deepseek-chat" };
    case "deepseek":
    default:
      return { url: "https://api.deepseek.com/v1/chat/completions", model: cfg.model || "deepseek-chat" };
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
    req.setTimeout(30_000, () => { req.destroy(); reject(new Error("AI API request timed out")); });
    req.write(body);
    req.end();
  });
}

function estimateComplexityLabel(data: PerfPoint[]): string {
  if (data.length < 3) return "O(n²) (insufficient data)";
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
  perfData: PerfPoint[],
  language: string,
  filename: string
): string {
  const webviewDir = path.join(context.extensionPath, "webview");
  const readFile   = (name: string): string => {
    const p = path.join(webviewDir, name);
    return fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : `/* ${name} not found */`;
  };

  // Load all JS modules inline
  const jsGraph      = readFile("graph.js");
  const jsComplexity = readFile("complexity.js");
  const jsAi         = readFile("ai.js");
  const jsMain       = readFile("main.js");
  const css          = readFile("styles.css");

  const nonce     = getNonce();
  const langLabel = language === "cpp" ? "C++" : "Python";
  const langIcon  = language === "cpp" ? "⚙" : "🐍";

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
             style-src 'nonce-${nonce}' https://fonts.googleapis.com;
             font-src https://fonts.gstatic.com;
             script-src 'nonce-${nonce}';" />
  <title>AlgoViz — ${filename}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <style nonce="${nonce}">${css}</style>
</head>
<body>

  <!-- ── Ambient background ─────────────────────────────────────── -->
  <div class="bg-grid" aria-hidden="true"></div>
  <div class="bg-glow bg-glow--1" aria-hidden="true"></div>
  <div class="bg-glow bg-glow--2" aria-hidden="true"></div>

  <!-- ── Header ─────────────────────────────────────────────────── -->
  <header class="header">
    <div class="header__brand">
      <div class="header__logo">
        <span class="logo-icon">⟨/⟩</span>
        <span class="logo-text">AlgoViz</span>
        <span class="logo-version">v5</span>
      </div>
      <div class="header__file">
        <span class="lang-badge lang-badge--${language}">${langIcon} ${langLabel}</span>
        <span class="filename">${filename}</span>
      </div>
    </div>
    <div class="header__status">
      <div class="status-dot status-dot--active" id="statusDot"></div>
      <span class="status-text" id="statusText">Analyzing…</span>
    </div>
  </header>

  <!-- ── Main content ───────────────────────────────────────────── -->
  <main class="main-grid">

    <!-- ── Complexity cards row ─────────────────────────────────── -->
    <section class="cards-row" aria-label="Complexity summary">
      <div class="metric-card" id="cardTime">
        <div class="metric-card__icon">⏱</div>
        <div class="metric-card__body">
          <div class="metric-card__label">Time Complexity</div>
          <div class="metric-card__value" id="timeComplexity">—</div>
          <div class="metric-card__sub" id="timeConfidence"></div>
        </div>
        <div class="metric-card__glow"></div>
      </div>
      <div class="metric-card" id="cardSpace">
        <div class="metric-card__icon">🗄</div>
        <div class="metric-card__body">
          <div class="metric-card__label">Space Complexity</div>
          <div class="metric-card__value" id="spaceComplexity">—</div>
          <div class="metric-card__sub" id="spaceNote">AI-inferred</div>
        </div>
        <div class="metric-card__glow"></div>
      </div>
      <div class="metric-card" id="cardBench">
        <div class="metric-card__icon">📊</div>
        <div class="metric-card__body">
          <div class="metric-card__label">Benchmark Points</div>
          <div class="metric-card__value" id="benchPoints">—</div>
          <div class="metric-card__sub" id="benchRange"></div>
        </div>
        <div class="metric-card__glow"></div>
      </div>
      <div class="metric-card" id="cardGrowth">
        <div class="metric-card__icon">📈</div>
        <div class="metric-card__body">
          <div class="metric-card__label">Growth Factor</div>
          <div class="metric-card__value" id="growthFactor">—</div>
          <div class="metric-card__sub">n min → max</div>
        </div>
        <div class="metric-card__glow"></div>
      </div>
    </section>

    <!-- ── Graph panel ──────────────────────────────────────────── -->
    <section class="panel graph-panel">
      <div class="panel__header">
        <div class="panel__title">
          <span class="panel__title-icon">◈</span>
          Runtime vs Input Size
        </div>
        <div class="graph-controls">
          <label class="toggle-pill">
            <input type="checkbox" id="normToggle" />
            <span class="toggle-pill__track">
              <span class="toggle-pill__thumb"></span>
            </span>
            Normalized curves
          </label>
        </div>
      </div>
      <div class="panel__body">
        <div id="graphEmpty" class="graph-empty" style="display:none">
          <span class="graph-empty__icon">⚠</span>
          <span>No benchmark data collected.</span>
        </div>
        <canvas id="perfChart" class="perf-canvas" aria-label="Performance graph"></canvas>
        <div id="graphExplanation" class="graph-explanation"></div>
      </div>
    </section>

    <!-- ── AI Analysis panel ────────────────────────────────────── -->
    <section class="panel ai-panel" aria-label="AI Analysis">
      <div class="panel__header">
        <div class="panel__title">
          <span class="panel__title-icon">✦</span>
          AI Analysis
        </div>
        <div class="ai-model-badge" id="aiModelBadge">DeepSeek</div>
      </div>
      <div class="panel__body" id="aiPanelBody">

        <!-- Loading state -->
        <div id="aiLoading" class="ai-loading">
          <div class="ai-loading__spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring spinner-ring--delay"></div>
          </div>
          <div class="ai-loading__text">
            <div class="ai-loading__headline">Running AI Analysis</div>
            <div class="ai-loading__sub">Examining your algorithm…</div>
          </div>
        </div>

        <!-- Result state -->
        <div id="aiResult" class="ai-result" hidden>
          <div class="ai-tabs" role="tablist">
            <button class="ai-tab ai-tab--active" role="tab" data-section="aiExplanation">Explanation</button>
            <button class="ai-tab" role="tab" data-section="aiComplexity">Complexity</button>
            <button class="ai-tab" role="tab" data-section="aiStepByStep">Trace</button>
            <button class="ai-tab" role="tab" data-section="aiOptimizations">Optimize</button>
            <button class="ai-tab" role="tab" data-section="aiRelatedProblems">Related</button>
          </div>
          <div class="ai-content">
            <div class="ai-section" id="aiExplanation"></div>
            <div class="ai-section" id="aiComplexity"    hidden></div>
            <div class="ai-section" id="aiStepByStep"    hidden></div>
            <div class="ai-section" id="aiOptimizations" hidden></div>
            <div class="ai-section" id="aiRelatedProblems" hidden></div>
          </div>
        </div>

        <!-- No-key state -->
        <div id="aiNoKey" class="ai-no-key" hidden>
          <div class="ai-no-key__icon">🔑</div>
          <div class="ai-no-key__title">API Key Required</div>
          <div class="ai-no-key__body">
            Add your key to VS Code User Settings to unlock AI analysis.<br>
            Setting: <code>algoViz.aiApiKey</code>
          </div>
        </div>

      </div>
    </section>

  </main>

  <!-- Inline data for the scripts -->
  <script nonce="${nonce}">
    window.PERF_DATA = ${JSON.stringify(perfData)};
  </script>

  <!-- Modular JS — order matters -->
  <script nonce="${nonce}">${jsComplexity}</script>
  <script nonce="${nonce}">${jsGraph}</script>
  <script nonce="${nonce}">${jsAi}</script>
  <script nonce="${nonce}">${jsMain}</script>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Utilities + Types
// ---------------------------------------------------------------------------

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
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