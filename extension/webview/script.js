/**
 * script.js — Algorithm Visualizer WebView Controller
 * =====================================================
 * Reads window.ALGO_STEPS (injected by the extension) and drives the
 * bar chart animation step-by-step.
 *
 * State machine:
 *   idle → playing → paused → idle (reset)
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

  // Calculate delay: slider goes 50–1000ms; we invert so right = fast
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

/**
 * Render a single step from the steps array.
 * Rebuilds the bar DOM for simplicity (array size never changes mid-sort).
 */
function renderStep(index) {
  const step = steps[index];
  if (!step) return;

  // Update step-info text
  stepInfo.textContent = describeStep(step);

  // Update line number badge
  lineNumber.textContent = step.line > 0 ? `Line ${step.line}` : "Line —";

  // Track which indices are "confirmed done" after each full bubble pass.
  // After bubble sort pass i, the last i+1 elements are in their final spot.
  // We approximate by marking arr.length - floor(pass) as done.
  // For an exact solution the Python would emit a "done" event — for MVP,
  // we simply mark indices that haven't changed in several steps.
  // Easier MVP approach: after each swap, the j+1 position can be compared
  // to see if it's in final position. We keep it simple: no auto-detection —
  // the extension emits a "done" type we look for.
  if (step.type === "done") {
    step.doneIndices?.forEach(i => doneIndices.add(i));
  }

  // Rebuild bars
  arrayContainer.innerHTML = "";

  const n = step.array.length;
  step.array.forEach((value, i) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.setAttribute("data-value", value);
    bar.setAttribute("data-index", i);

    // Height proportional to value, capped at ~85% of container height
    const heightPercent = (value / maxValue) * 85;
    bar.style.height = `${heightPercent}%`;

    // Apply state classes
    if (doneIndices.has(i)) {
      bar.classList.add("done");
    } else if (step.type === "swap" && (i === step.i || i === step.j)) {
      bar.classList.add("swap");
    } else if (step.type === "compare" && (i === step.i || i === step.j)) {
      bar.classList.add("compare");
    }

    // Last element in each pass is sorted (simple heuristic for MVP)
    // We use the outer loop index to infer how many trailing elements are done.
    // Actually: on step index we look at how many "swap" steps occurred — too
    // complex for MVP. Instead we rely on whether we're at the final step.
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
  stepInfo.textContent = "✅ Sorting complete! All elements are in place.";
  // Re-render last step with all bars green
  const lastStep = steps[steps.length - 1];
  if (!lastStep) return;

  const bars = arrayContainer.querySelectorAll(".bar");
  bars.forEach(bar => {
    bar.classList.remove("swap", "compare");
    bar.classList.add("done");
  });
}

// ── Human-readable step description ─────────────────────────────────────────

function describeStep(step) {
  switch (step.type) {
    case "init":
      return `Initial array: [${step.array.join(", ")}]`;

    case "compare":
      return `Comparing arr[${step.i}]=${step.array[step.i]} ` +
             `with arr[${step.j}]=${step.array[step.j]}`;

    case "swap":
      return `Swapping arr[${step.i}]=${step.array[step.i]} ` +
             `↔ arr[${step.j}]=${step.array[step.j]}`;

    default:
      return `Step type: ${step.type}`;
  }
}