/**
 * main.js — AlgoViz WebView Orchestrator
 * ========================================
 * Boots the UI, wires data into cards + graph, listens for messages.
 * Depends on: complexity.js, graph.js, ai.js (loaded before this file).
 */

"use strict";

(function () {

  const perfData = window.PERF_DATA || [];

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function $(id) { return document.getElementById(id); }

  function setStatus(text, state = "active") {
    const dot  = $("statusDot");
    const span = $("statusText");
    if (span) span.textContent = text;
    if (dot) {
      dot.className = `status-dot status-dot--${state}`;
    }
  }

  // ── 1. Populate metric cards ─────────────────────────────────────────────────

  function populateCards() {
    if (!perfData || perfData.length === 0) {
      $("timeComplexity").textContent = "No data";
      $("benchPoints").textContent   = "0";
      $("growthFactor").textContent  = "N/A";
      setStatus("No benchmark data", "warn");
      return;
    }

    const result = window.AlgoVizComplexity.estimate(perfData);
    const growth = window.AlgoVizComplexity.growthSummary(perfData);

    // Time complexity card
    const timeEl = $("timeComplexity");
    if (timeEl) {
      timeEl.textContent = result.unicodeLabel || result.label;
      timeEl.className   = `metric-card__value metric-card__value--${result.color}`;
    }

    const confEl = $("timeConfidence");
    if (confEl) {
      confEl.textContent = `${result.confidence} confidence · empirical`;
    }

    // Benchmark points card
    const benchEl = $("benchPoints");
    if (benchEl) benchEl.textContent = String(perfData.length);

    const rangeEl = $("benchRange");
    if (rangeEl && growth) {
      rangeEl.textContent = `n = ${growth.firstN} → ${growth.lastN}`;
    }

    // Growth factor card
    const growthEl = $("growthFactor");
    if (growthEl && growth) {
      growthEl.textContent = `${growth.tMult}×`;
    }

    // Space complexity will be filled by AI module — show placeholder
    const spaceEl = $("spaceComplexity");
    if (spaceEl) spaceEl.textContent = "—";

    setStatus("Analysis complete", "active");
  }

  // ── 2. Graph ─────────────────────────────────────────────────────────────────

  function initGraph() {
    const canvas   = $("perfChart");
    const emptyMsg = $("graphEmpty");
    const toggle   = $("normToggle");
    const explEl   = $("graphExplanation");

    if (!perfData || perfData.length === 0) {
      if (canvas)   canvas.style.display   = "none";
      if (emptyMsg) emptyMsg.style.display = "flex";
      return;
    }

    if (emptyMsg) emptyMsg.style.display = "none";
    if (canvas)   canvas.style.display   = "block";

    function redraw() {
      window.AlgoVizGraph.draw(canvas, perfData, toggle ? toggle.checked : false);
    }

    redraw();

    if (toggle) {
      toggle.addEventListener("change", redraw);
    }

    // Re-draw on resize (debounced)
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(redraw, 120);
    });

    // Graph explanation text
    if (explEl && perfData.length >= 2) {
      const result = window.AlgoVizComplexity.estimate(perfData);
      const growth = window.AlgoVizComplexity.growthSummary(perfData);
      if (growth) {
        const curveNames = {
          "O(1)":       "flat (time/1)",
          "O(n)":       "n-normalized (t/n)",
          "O(n log n)": "n·log(n)-normalized",
          "O(n²)":      "n²-normalized (t/n²)",
        };
        const curveName = curveNames[result.label] || result.label;
        explEl.textContent =
          `The ${curveName} curve is most stable across all input sizes ` +
          `(${result.confidence} confidence). When n grew ${growth.nMult}× ` +
          `(${growth.firstN} → ${growth.lastN}), runtime grew ${growth.tMult}× — ` +
          `consistent with ${result.label}. ` +
          `Toggle "Normalized curves" to overlay all three ratio lines.`;
      }
    }
  }

  // ── 3. VS Code message listener ──────────────────────────────────────────────

  window.addEventListener("message", event => {
    const msg = event.data;
    switch (msg.type) {
      case "ai_result":
        window.AlgoVizAI.renderResult(msg.text);
        setStatus("Analysis complete", "active");
        break;
      case "ai_no_key":
        window.AlgoVizAI.renderNoKey();
        setStatus("API key missing", "warn");
        break;
      case "ai_error":
        window.AlgoVizAI.renderError(msg.text || "Unknown error");
        setStatus("AI error", "warn");
        break;
    }
  });

  // ── 4. Boot ───────────────────────────────────────────────────────────────────

  function boot() {
    populateCards();
    initGraph();

    // Stagger card entrance animations
    document.querySelectorAll(".metric-card").forEach((card, i) => {
      card.style.animationDelay = `${i * 80}ms`;
      card.classList.add("metric-card--animate");
    });

    // Notify extension that webview is ready (flushes message queue)
    try {
      const vscode = acquireVsCodeApi();
      vscode.postMessage({ type: "ready" });
    } catch {
      // Standalone browser preview — no-op
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();