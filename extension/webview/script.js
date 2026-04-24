/**
 * script.js — Algorithm Visualizer WebView Controller
 * =====================================================
 * Reads window.ALGO_STEPS (injected by the extension) and drives the
 * bar chart animation step-by-step.
 *
 * State machine:
 *   idle -> playing -> paused -> idle (reset)
 *
 * Each "step" from Python looks like:
 *   { type: "init"|"compare"|"swap", array: [...], i: N, j: N, line: N }
 */

"use strict";

// ── DOM references ──────────────────────────────────────────────────────────
const arrayContainer = document.getElementById("arrayContainer");
const stepCounter    = document.getElementById("stepCounter");
const lineNumber     = document.getElementById("lineNumber");
const stepInfo       = document.getElementById("stepInfo");
const btnPlay        = document.getElementById("btnPlay");
const btnPause       = document.getElementById("btnPause");
const btnReset       = document.getElementById("btnReset");
const speedSlider    = document.getElementById("speedSlider");

// ── Data (injected by extension.ts) ────────────────────────────────────────
const steps = window.ALGO_STEPS || [];

// ── Player state ────────────────────────────────────────────────────────────
let currentStep = 0;
let isPlaying   = false;
let timerId     = null;

// Track which indices are "done" (confirmed sorted) so we can keep them green
const doneIndices = new Set();

// ── Derived: max value for scaling bar heights ──────────────────────────────
const maxValue = steps.length > 0
  ? Math.max(...steps[0].array)
  : 1;

// ── Initialise ──────────────────────────────────────────────────────────────
if (steps.length === 0) {
  stepInfo.textContent = "No steps found. Run your Python file first.";
} else {
  renderStep(0);            // draw the initial frame immediately
  updateCounterDisplay();
}

// ── Button handlers ─────────────────────────────────────────────────────────

btnPlay.addEventListener("click", () => {
  if (currentStep >= steps.length - 1) {
    // Auto-reset if we're at the end
    resetPlayer();
  }
  startPlaying();
});

btnPause.addEventListener("click", pausePlaying);

btnReset.addEventListener("click", () => {
  pausePlaying();
  resetPlayer();
});

// Speed slider: higher value = slower (we map it so slider right = faster)
speedSlider.addEventListener("input", () => {
  if (isPlaying) {
    // Restart the interval with the new speed
    pausePlaying();
    startPlaying();
  }
});

// ── Player controls ─────────────────────────────────────────────────────────

function startPlaying() {
  if (isPlaying) return;
  isPlaying = true;

  btnPlay.disabled  = true;
  btnPause.disabled = false;

  // Calculate delay: slider goes 50-1000ms; we invert so right = fast
  const delay = 1050 - parseInt(speedSlider.value, 10);

  timerId = setInterval(() => {
    if (currentStep >= steps.length - 1) {
      pausePlaying();
      markSortComplete();
      return;
    }
    currentStep++;
    renderStep(currentStep);
    updateCounterDisplay();
  }, delay);
}

function pausePlaying() {
  if (!isPlaying) return;
  isPlaying = false;
  clearInterval(timerId);
  timerId = null;

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

// ── Rendering ────────────────────────────────────────────────────────────────

function renderStep(index) {
  const step = steps[index];
  if (!step) return;

  stepInfo.textContent = describeStep(step);
  lineNumber.textContent = step.line > 0 ? `Line ${step.line}` : "Line --";

  if (step.type === "done") {
    step.doneIndices?.forEach(i => doneIndices.add(i));
  }

  arrayContainer.innerHTML = "";

  step.array.forEach((value, i) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.setAttribute("data-value", value);
    bar.setAttribute("data-index", i);

    const heightPercent = (value / maxValue) * 85;
    bar.style.height = `${heightPercent}%`;

    if (doneIndices.has(i)) {
      bar.classList.add("done");
    } else if (step.type === "swap" && (i === step.i || i === step.j)) {
      bar.classList.add("swap");
    } else if (step.type === "compare" && (i === step.i || i === step.j)) {
      bar.classList.add("compare");
    }

    if (index === steps.length - 1) {
      bar.classList.remove("swap", "compare");
      bar.classList.add("done");
    }

    arrayContainer.appendChild(bar);
  });
}

function updateCounterDisplay() {
  stepCounter.textContent = `Step ${currentStep} / ${steps.length - 1}`;
}

function markSortComplete() {
  stepInfo.textContent = "Sorting complete! All elements are in place.";
  const bars = arrayContainer.querySelectorAll(".bar");
  bars.forEach(bar => {
    bar.classList.remove("swap", "compare");
    bar.classList.add("done");
  });
}

function describeStep(step) {
  switch (step.type) {
    case "init":
      return `Initial array: [${step.array.join(", ")}]`;
    case "compare":
      return `Comparing arr[${step.i}]=${step.array[step.i]} with arr[${step.j}]=${step.array[step.j]}`;
    case "swap":
      return `Swapping arr[${step.i}]=${step.array[step.i]} with arr[${step.j}]=${step.array[step.j]}`;
    default:
      return `Step type: ${step.type}`;
  }
}


// =============================================================================
// NEW CODE BELOW — Performance graph, complexity estimation, AI explanation
// Everything above this line is unchanged from the original script.js
// =============================================================================

// ── Performance data (injected alongside ALGO_STEPS) ─────────────────────────
const perfData = window.PERF_DATA || [];

// Run all new features once the page has loaded
initPerformancePanel();

// -----------------------------------------------------------------------------
// FEATURE 1 + 2: Draw the performance graph + detect complexity
// -----------------------------------------------------------------------------

function initPerformancePanel() {
  const canvas   = document.getElementById("perfChart");
  const emptyMsg = document.getElementById("graphEmpty");

  if (!perfData || perfData.length === 0) {
    // No data — show the empty-state message, hide the canvas
    canvas.style.display  = "none";
    emptyMsg.style.display = "block";
    document.getElementById("complexityBadge").textContent = "No data";
    return;
  }

  // Hide the empty-state message, show the canvas
  emptyMsg.style.display = "none";
  canvas.style.display   = "block";

  drawGraph(canvas, perfData);
  const complexity = estimateComplexity(perfData);
  showComplexity(complexity);
}

/**
 * Draw a clean line + dot chart on a <canvas> element.
 * Pure vanilla JS — no libraries.
 */
function drawGraph(canvas, data) {
  // Make canvas crisp on high-DPI screens
  const W      = canvas.offsetWidth  || 560;
  const H      = canvas.offsetHeight || 200;
  const ratio  = window.devicePixelRatio || 1;
  canvas.width  = W * ratio;
  canvas.height = H * ratio;

  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);

  // Padding inside the canvas for axes
  const pad = { top: 20, right: 20, bottom: 44, left: 60 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top  - pad.bottom;

  // Data range
  const maxN    = Math.max(...data.map(d => d.n));
  const maxTime = Math.max(...data.map(d => d.time));

  // Helper: map data values to canvas pixel coordinates
  const toX = n    => pad.left + (n    / maxN)    * plotW;
  const toY = time => pad.top  + plotH - (time / maxTime) * plotH;

  // ── Background (match VS Code dark theme) ──────────────────────────────
  ctx.fillStyle = "#161b22";
  ctx.fillRect(0, 0, W, H);

  // ── Grid lines ──────────────────────────────────────────────────────────
  ctx.strokeStyle = "#30363d";
  ctx.lineWidth   = 1;

  // Horizontal grid (5 lines)
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (i / 4) * plotH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();

    // Y-axis labels (time in ms)
    const val = maxTime * (1 - i / 4);
    ctx.fillStyle   = "#8b949e";
    ctx.font        = "11px monospace";
    ctx.textAlign   = "right";
    ctx.fillText(formatTime(val), pad.left - 6, y + 4);
  }

  // Vertical grid (one per data point)
  data.forEach(d => {
    const x = toX(d.n);
    ctx.strokeStyle = "#30363d";
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotH);
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = "#8b949e";
    ctx.font      = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`n=${d.n}`, x, pad.top + plotH + 18);
  });

  // ── Axis labels ─────────────────────────────────────────────────────────
  ctx.fillStyle = "#8b949e";
  ctx.font      = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Input size (n)", pad.left + plotW / 2, H - 4);

  // Rotated Y-axis label
  ctx.save();
  ctx.translate(12, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Time", 0, 0);
  ctx.restore();

  // ── Data line ────────────────────────────────────────────────────────────
  ctx.strokeStyle = "#58a6ff";
  ctx.lineWidth   = 2;
  ctx.lineJoin    = "round";
  ctx.beginPath();
  data.forEach((d, idx) => {
    const x = toX(d.n);
    const y = toY(d.time);
    idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // ── Shaded area under the line ───────────────────────────────────────────
  ctx.save();
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
  grad.addColorStop(0,   "rgba(88, 166, 255, 0.25)");
  grad.addColorStop(1,   "rgba(88, 166, 255, 0.00)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(toX(data[0].n), pad.top + plotH);
  data.forEach(d => ctx.lineTo(toX(d.n), toY(d.time)));
  ctx.lineTo(toX(data[data.length - 1].n), pad.top + plotH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── Data point dots ──────────────────────────────────────────────────────
  data.forEach(d => {
    const x = toX(d.n);
    const y = toY(d.time);

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(88, 166, 255, 0.3)";
    ctx.fill();

    // Solid dot
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#58a6ff";
    ctx.fill();
  });
}

/** Format a time value into a human-readable string (auto-pick ms or s). */
function formatTime(seconds) {
  if (seconds < 0.001) return `${(seconds * 1000000).toFixed(0)}us`;
  if (seconds < 1)     return `${(seconds * 1000).toFixed(2)}ms`;
  return `${seconds.toFixed(2)}s`;
}

// -----------------------------------------------------------------------------
// FEATURE 3: Complexity estimation — no AI, pure math
// -----------------------------------------------------------------------------

/**
 * For each candidate complexity class, compute ratio = time / f(n).
 * If the algorithm truly IS that complexity, the ratio should be roughly
 * constant across all input sizes. We pick the class with the lowest
 * coefficient of variation (std-dev / mean) — i.e. the most constant ratio.
 */
function estimateComplexity(data) {
  // We need at least 3 points to make a meaningful comparison
  if (data.length < 3) return { label: "O(n²)", confidence: "low" };

  const candidates = [
    {
      label: "O(n)",
      fn: n => n,
    },
    {
      label: "O(n log n)",
      fn: n => n * Math.log2(n),
    },
    {
      label: "O(n²)",
      fn: n => n * n,
    },
  ];

  let bestLabel = "O(n²)";
  let bestCV    = Infinity;

  candidates.forEach(candidate => {
    // Compute ratio time / f(n) for each data point
    const ratios = data.map(d => d.time / candidate.fn(d.n));

    const mean  = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const variance = ratios.reduce((s, r) => s + (r - mean) ** 2, 0) / ratios.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;   // coefficient of variation — lower = more constant

    if (cv < bestCV) {
      bestCV    = cv;
      bestLabel = candidate.label;
    }
  });

  // Confidence: how cleanly does the winner beat the others?
  const confidence = bestCV < 0.15 ? "high" : bestCV < 0.35 ? "medium" : "low";
  return { label: bestLabel, confidence };
}

function showComplexity(result) {
  const badge = document.getElementById("complexityBadge");
  const note  = document.getElementById("complexityNote");

  badge.textContent = result.label;

  // Colour the badge based on detected complexity
  badge.className = "complexity-badge";
  if      (result.label === "O(n)")       badge.classList.add("complexity-badge--green");
  else if (result.label === "O(n log n)") badge.classList.add("complexity-badge--yellow");
  else                                     badge.classList.add("complexity-badge--red");

  note.textContent = `(${result.confidence} confidence)`;
}

// -----------------------------------------------------------------------------
// FEATURE 4: Rule-based AI explanation — no external API
// -----------------------------------------------------------------------------

const aiToggle = document.getElementById("aiToggle");
const aiBox    = document.getElementById("aiBox");
const aiText   = document.getElementById("aiText");

aiToggle.addEventListener("change", () => {
  if (aiToggle.checked) {
    aiBox.hidden = false;
    // Generate explanation lazily — only when the user asks for it
    aiText.textContent = generateExplanation(perfData);
  } else {
    aiBox.hidden = true;
  }
});

/**
 * Rule-based explanation generator.
 * Looks at the performance data and produces a human-readable paragraph.
 * No AI API — deterministic logic, always free.
 */
function generateExplanation(data) {
  if (!data || data.length === 0) {
    return "No performance data available. Run benchmark.py to enable this analysis.";
  }

  const complexity = estimateComplexity(data);

  // Compute how much time grew when n doubled (last two points)
  const last  = data[data.length - 1];
  const prev  = data[data.length - 2];
  const nRatio = last.n    / prev.n;
  const tRatio = last.time / prev.time;
  const growthDesc = tRatio.toFixed(1) + "x";

  // Count swaps in the recorded steps
  const swapCount    = steps.filter(s => s.type === "swap").length;
  const compareCount = steps.filter(s => s.type === "compare").length;

  return [
    `Bubble Sort works by repeatedly comparing neighbouring elements and swapping them if they are in the wrong order.`,
    `Each full pass through the array guarantees that the largest unsorted element moves to its correct position at the end.`,
    `\nFor the visualized array of ${steps[0]?.array.length ?? "?"} elements, the algorithm performed ${compareCount} comparisons and ${swapCount} swaps.`,
    `\nThe benchmark shows that when input size grew from n=${prev.n} to n=${last.n} (${nRatio.toFixed(1)}x larger), the runtime grew by ${growthDesc}.`,
    complexity.label === "O(n²)"
      ? `This ~${tRatio.toFixed(0)}x growth for a ${nRatio.toFixed(0)}x increase in size is consistent with O(n\u00B2) — quadratic — behaviour: doubling n roughly quadruples the work.`
      : `The estimated complexity is ${complexity.label}, which means runtime grows ${complexity.label} relative to input size.`,
    `\nBubble Sort is rarely used in production because O(n\u00B2) algorithms become very slow for large inputs. Faster alternatives like Merge Sort or Quick Sort run in O(n log n).`,
  ].join(" ");
}