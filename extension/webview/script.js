/**
 * script.js — Algorithm Visualizer WebView (v4)
 * ===============================================
 * Sections:
 *   A. Animation system (original — only runs when HAS_ANIMATION is true)
 *   B. Performance graph with normalized curve toggle
 *   C. Complexity estimation
 *   D. AI panel with 5 sections: Explanation, Complexity, Step-by-Step,
 *      Optimizations, Related Problems
 *   E. Ready handshake — notifies extension.ts this script has loaded
 */

"use strict";

// =============================================================================
// A. ANIMATION SYSTEM
// =============================================================================

const steps    = window.ALGO_STEPS || [];
const perfData = window.PERF_DATA  || [];

if (window.HAS_ANIMATION && steps.length > 0) {
  initAnimationSystem();
}

function initAnimationSystem() {
  const arrayContainer = document.getElementById("arrayContainer");
  const stepCounter    = document.getElementById("stepCounter");
  const lineNumber     = document.getElementById("lineNumber");
  const stepInfo       = document.getElementById("stepInfo");
  const btnPlay        = document.getElementById("btnPlay");
  const btnPause       = document.getElementById("btnPause");
  const btnReset       = document.getElementById("btnReset");
  const speedSlider    = document.getElementById("speedSlider");

  let currentStep   = 0;
  let isPlaying     = false;
  let timerId       = null;
  const doneIndices = new Set();
  const maxValue    = steps.length > 0 ? Math.max(...steps[0].array) : 1;

  renderStep(0);
  updateCounterDisplay();

  btnPlay.addEventListener("click",  () => { if (currentStep >= steps.length - 1) resetPlayer(); startPlaying(); });
  btnPause.addEventListener("click", pausePlaying);
  btnReset.addEventListener("click", () => { pausePlaying(); resetPlayer(); });
  speedSlider.addEventListener("input", () => { if (isPlaying) { pausePlaying(); startPlaying(); } });

  function startPlaying() {
    if (isPlaying) return;
    isPlaying = true;
    btnPlay.disabled  = true;
    btnPause.disabled = false;
    const delay = 1050 - parseInt(speedSlider.value, 10);
    timerId = setInterval(() => {
      if (currentStep >= steps.length - 1) { pausePlaying(); markSortComplete(); return; }
      currentStep++;
      renderStep(currentStep);
      updateCounterDisplay();
    }, delay);
  }

  function pausePlaying() {
    if (!isPlaying) return;
    isPlaying = false;
    clearInterval(timerId);
    timerId   = null;
    btnPlay.disabled  = false;
    btnPause.disabled = true;
  }

  function resetPlayer() {
    currentStep = 0;
    doneIndices.clear();
    renderStep(0);
    updateCounterDisplay();
    btnPlay.disabled  = false;
    btnPause.disabled = true;
  }

  function renderStep(index) {
    const step = steps[index];
    if (!step) return;

    stepInfo.textContent   = describeStep(step);
    lineNumber.textContent = step.line > 0 ? `Line ${step.line}` : "Line --";

    if (step.type === "done") step.doneIndices?.forEach(i => doneIndices.add(i));

    arrayContainer.innerHTML = "";
    step.array.forEach((value, i) => {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.setAttribute("data-value", value);
      bar.setAttribute("data-index", i);
      bar.style.height = `${(value / maxValue) * 85}%`;

      if (doneIndices.has(i))                                      bar.classList.add("done");
      else if (step.type === "swap"    && (i===step.i||i===step.j)) bar.classList.add("swap");
      else if (step.type === "compare" && (i===step.i||i===step.j)) bar.classList.add("compare");
      if (index === steps.length - 1) { bar.classList.remove("swap","compare"); bar.classList.add("done"); }

      arrayContainer.appendChild(bar);
    });
  }

  function updateCounterDisplay() {
    stepCounter.textContent = `Step ${currentStep} / ${steps.length - 1}`;
  }

  function markSortComplete() {
    stepInfo.textContent = "Sorting complete! All elements are in place.";
    arrayContainer.querySelectorAll(".bar").forEach(bar => {
      bar.classList.remove("swap","compare");
      bar.classList.add("done");
    });
  }

  function describeStep(step) {
    switch (step.type) {
      case "init":    return `Initial array: [${step.array.join(", ")}]`;
      case "compare": return `Comparing arr[${step.i}]=${step.array[step.i]} with arr[${step.j}]=${step.array[step.j]}`;
      case "swap":    return `Swapping arr[${step.i}]=${step.array[step.i]} with arr[${step.j}]=${step.array[step.j]}`;
      default:        return `Step type: ${step.type}`;
    }
  }
}


// =============================================================================
// B. PERFORMANCE GRAPH
// =============================================================================

const CURVE_COLORS = {
  raw:   "#58a6ff",
  n:     "#f0883e",
  nlogn: "#d2a8ff",
  n2:    "#3fb950",
};

const canvas     = document.getElementById("perfChart");
const emptyMsg   = document.getElementById("graphEmpty");
const normToggle = document.getElementById("normToggle");

initPerformancePanel();
normToggle.addEventListener("change", () => drawGraph(canvas, perfData, normToggle.checked));

function initPerformancePanel() {
  if (!perfData || perfData.length === 0) {
    canvas.style.display   = "none";
    emptyMsg.style.display = "block";
    document.getElementById("complexityBadge").textContent = "No data";
    return;
  }
  emptyMsg.style.display = "none";
  canvas.style.display   = "block";
  drawGraph(canvas, perfData, false);
  const result = estimateComplexity(perfData);
  showComplexity(result);
  showGraphExplanation(result, perfData);
}

function drawGraph(canvas, data, showNormed) {
  const W     = canvas.offsetWidth  || 560;
  const H     = canvas.offsetHeight || 200;
  const ratio = window.devicePixelRatio || 1;
  canvas.width  = W * ratio;
  canvas.height = H * ratio;

  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);

  const pad   = { top: 20, right: showNormed ? 130 : 20, bottom: 44, left: 60 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top  - pad.bottom;

  ctx.fillStyle = "#161b22";
  ctx.fillRect(0, 0, W, H);

  const maxN    = Math.max(...data.map(d => d.n));
  const maxTime = Math.max(...data.map(d => d.time));
  const toX     = n    => pad.left + (n / maxN) * plotW;
  const toY     = (v, maxV) => pad.top + plotH - (v / maxV) * plotH;

  // Grid lines
  ctx.strokeStyle = "#30363d";
  ctx.lineWidth   = 1;
  for (let i = 0; i <= 4; i++) {
    const y   = pad.top + (i / 4) * plotH;
    const val = maxTime * (1 - i / 4);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    ctx.fillStyle = "#8b949e"; ctx.font = "11px monospace"; ctx.textAlign = "right";
    ctx.fillText(formatTime(val), pad.left - 6, y + 4);
  }
  data.forEach(d => {
    const x = toX(d.n);
    ctx.strokeStyle = "#30363d";
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
    ctx.fillStyle = "#8b949e"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText(`n=${d.n}`, x, pad.top + plotH + 18);
  });

  // Axis labels
  ctx.fillStyle = "#8b949e"; ctx.font = "12px monospace"; ctx.textAlign = "center";
  ctx.fillText("Input size (n)", pad.left + plotW / 2, H - 4);
  ctx.save();
  ctx.translate(12, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Time", 0, 0);
  ctx.restore();

  function drawLine(points, color, maxV, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = dashed ? 1.5 : 2; ctx.lineJoin = "round";
    if (dashed) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    points.forEach(([n, v], idx) => {
      const x = toX(n); const y = toY(v, maxV);
      idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke(); ctx.restore();
  }

  function drawArea(points, maxV) {
    ctx.save();
    ctx.fillStyle = "rgba(88,166,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(toX(points[0][0]), pad.top + plotH);
    points.forEach(([n, v]) => ctx.lineTo(toX(n), toY(v, maxV)));
    ctx.lineTo(toX(points[points.length - 1][0]), pad.top + plotH);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  const rawPoints = data.map(d => [d.n, d.time]);
  drawArea(rawPoints, maxTime);
  drawLine(rawPoints, CURVE_COLORS.raw, maxTime);

  if (showNormed) {
    const maxN_norm    = Math.max(...data.map(d => d.n_norm));
    const maxNlogn     = Math.max(...data.map(d => d.nlogn_norm));
    const maxN2_norm   = Math.max(...data.map(d => d.n2_norm));
    drawLine(data.map(d => [d.n, d.n_norm]),    CURVE_COLORS.n,     maxN_norm,  true);
    drawLine(data.map(d => [d.n, d.nlogn_norm]),CURVE_COLORS.nlogn, maxNlogn,   true);
    drawLine(data.map(d => [d.n, d.n2_norm]),   CURVE_COLORS.n2,    maxN2_norm, true);

    const legendX = pad.left + plotW + 8;
    [
      { color: CURVE_COLORS.raw,   label: "raw time" },
      { color: CURVE_COLORS.n,     label: "t / n" },
      { color: CURVE_COLORS.nlogn, label: "t / n\u00B7logn" },
      { color: CURVE_COLORS.n2,    label: "t / n\u00B2" },
    ].forEach(({ color, label }, i) => {
      const ly = pad.top + 16 + i * 22;
      ctx.fillStyle = color; ctx.fillRect(legendX, ly - 6, 14, 3);
      ctx.fillStyle = "#8b949e"; ctx.font = "10px monospace"; ctx.textAlign = "left";
      ctx.fillText(label, legendX + 18, ly);
    });
  }

  // Dots on raw line
  data.forEach(d => {
    const x = toX(d.n); const y = toY(d.time, maxTime);
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(88,166,255,0.3)"; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = CURVE_COLORS.raw; ctx.fill();
  });
}

function formatTime(s) {
  if (s < 0.001) return `${(s * 1e6).toFixed(0)}us`;
  if (s < 1)     return `${(s * 1000).toFixed(2)}ms`;
  return `${s.toFixed(2)}s`;
}


// =============================================================================
// C. COMPLEXITY ESTIMATION
// =============================================================================

function estimateComplexity(data) {
  if (data.length < 3) return { label: "O(n\u00B2)", confidence: "low", cvWinner: 99 };

  const cv = ratios => {
    const mean     = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const variance = ratios.reduce((s, r) => s + (r - mean) ** 2, 0) / ratios.length;
    return Math.sqrt(variance) / mean;
  };

  const candidates = [
    { label: "O(n)",       key: "n_norm"     },
    { label: "O(n log n)", key: "nlogn_norm" },
    { label: "O(n\u00B2)", key: "n2_norm"    },
  ];

  let best = { label: "O(n\u00B2)", cvWinner: Infinity };
  candidates.forEach(c => {
    const score = cv(data.map(d => d[c.key]));
    if (score < best.cvWinner) best = { label: c.label, cvWinner: score };
  });

  const confidence = best.cvWinner < 0.10 ? "high"
                   : best.cvWinner < 0.30 ? "medium"
                   :                        "low";
  return { ...best, confidence };
}

function showComplexity({ label, confidence }) {
  const badge = document.getElementById("complexityBadge");
  const note  = document.getElementById("complexityNote");
  badge.textContent = label;
  note.textContent  = `(empirical, ${confidence} confidence)`;
  badge.className   = "complexity-badge";
  if      (label === "O(n)")       badge.classList.add("complexity-badge--green");
  else if (label === "O(n log n)") badge.classList.add("complexity-badge--yellow");
  else                              badge.classList.add("complexity-badge--red");
}

function showGraphExplanation({ label, confidence }, data) {
  const el = document.getElementById("graphExplanation");
  if (!el || data.length < 2) return;
  const curveNames = {
    "O(n)":       "n-normalized (t/n)",
    "O(n log n)": "n\u00B7log(n)-normalized (t/n\u00B7logn)",
    "O(n\u00B2)": "n\u00B2-normalized (t/n\u00B2)",
  };
  const first  = data[0];
  const last   = data[data.length - 1];
  const nMult  = (last.n    / first.n).toFixed(0);
  const tMult  = (last.time / first.time).toFixed(1);
  el.textContent =
    `The ${curveNames[label] ?? label} curve is most stable across all input sizes, ` +
    `indicating ${label} growth (${confidence} confidence). ` +
    `When n grew ${nMult}x (${first.n} \u2192 ${last.n}), ` +
    `runtime grew ${tMult}x \u2014 consistent with ${label}. ` +
    `Enable "Show normalized curves" to see all three ratios overlaid.`;
}


// =============================================================================
// D. AI PANEL — 5 sections
// =============================================================================

window.addEventListener("message", event => {
  const msg = event.data;
  switch (msg.type) {
    case "ai_result": renderAiResult(msg.text); break;
    case "ai_no_key": renderAiNoKey();           break;
  }
});

function renderAiResult(text) {
  document.getElementById("aiLoading").hidden = true;
  document.getElementById("aiResult").hidden  = false;

  const sections = parseSections(text);

  renderAiSection("aiExplanation",    "Explanation",      sections.EXPLANATION);
  renderAiSection("aiComplexity",     "Complexity",       sections.COMPLEXITY);
  renderAiSection("aiStepByStep",     "Step-by-Step",     sections.STEP_BY_STEP);
  renderAiSection("aiOptimizations",  "Optimizations",    sections.OPTIMIZATIONS);
  renderAiSection("aiRelatedProblems","Related Problems", sections.RELATED_PROBLEMS);
}

function parseSections(text) {
  const HEADERS = ["EXPLANATION", "COMPLEXITY", "STEP_BY_STEP", "OPTIMIZATIONS", "RELATED_PROBLEMS"];
  const result  = {};
  let current   = null;
  let buffer    = [];

  text.split("\n").forEach(line => {
    const trimmed = line.trim().toUpperCase().replace(/[:\-\s]+$/, "");
    if (HEADERS.includes(trimmed)) {
      if (current) result[current] = buffer.join("\n").trim();
      current = trimmed;
      buffer  = [];
    } else {
      buffer.push(line);
    }
  });
  if (current) result[current] = buffer.join("\n").trim();

  // Fallback: if model ignored structure, show everything under Explanation
  if (Object.keys(result).length === 0) {
    result["EXPLANATION"] = text.trim();
  }
  return result;
}

function renderAiSection(elementId, title, content) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (!content) { el.hidden = true; return; }
  el.hidden   = false;
  el.innerHTML =
    `<div class="ai-section-title">${title}</div>` +
    `<p class="ai-section-body">${escapeHtml(content).replace(/\n/g, "<br>")}</p>`;
}

function renderAiNoKey() {
  document.getElementById("aiLoading").hidden = true;
  document.getElementById("aiNoKey").hidden   = false;
}

function escapeHtml(str) {
  return str
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}


// =============================================================================
// E. READY HANDSHAKE — must be last
// =============================================================================

// Tell extension.ts that this script has fully loaded and the message
// listener above is now registered. Any queued messages will be flushed.
(function sendReady() {
  try {
    // acquireVsCodeApi() is only available inside a real VS Code WebView
    const vscode = acquireVsCodeApi();
    vscode.postMessage({ type: "ready" });
  } catch {
    // Running standalone in a browser (dev preview) — no-op
  }
})();