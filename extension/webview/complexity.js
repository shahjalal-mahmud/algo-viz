/**
 * complexity.js — AlgoViz WebView Module
 * =======================================
 * Empirical complexity estimation from benchmark data.
 * Exposed globally so main.js and graph.js can use it.
 */

"use strict";

window.AlgoVizComplexity = (() => {

  /**
   * Coefficient of variation — lower = more stable = better fit
   */
  function cv(ratios) {
    if (ratios.length === 0) return Infinity;
    const mean     = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    if (mean === 0) return Infinity;
    const variance = ratios.reduce((s, r) => s + (r - mean) ** 2, 0) / ratios.length;
    return Math.sqrt(variance) / mean;
  }

  /**
   * Returns the best-fit complexity label, confidence, and raw cv score.
   * @param {Array<{n, time, n_norm, nlogn_norm, n2_norm}>} data
   */
  function estimate(data) {
    if (!data || data.length < 3) {
      return { label: "O(n²)", unicodeLabel: "O(n²)", confidence: "low", cvWinner: 99, color: "red" };
    }

    const candidates = [
      { label: "O(1)",       unicodeLabel: "O(1)",       key: null,          color: "teal"   },
      { label: "O(n)",       unicodeLabel: "O(n)",       key: "n_norm",      color: "green"  },
      { label: "O(n log n)", unicodeLabel: "O(n log n)", key: "nlogn_norm",  color: "yellow" },
      { label: "O(n²)",      unicodeLabel: "O(n²)",      key: "n2_norm",     color: "red"    },
    ];

    // O(1) check: if the time barely grows at all
    const firstTime = data[0].time;
    const lastTime  = data[data.length - 1].time;
    const growRatio = lastTime / (firstTime || 1e-9);
    const o1Score   = growRatio < 2.0 ? 0.05 : Infinity; // treat near-constant as O(1)

    let best = { label: "O(n²)", unicodeLabel: "O(n²)", cvWinner: Infinity, color: "red" };

    for (const c of candidates) {
      let score;
      if (c.key === null) {
        score = o1Score;
      } else {
        const ratios = data.map(d => d[c.key]).filter(v => isFinite(v) && v > 0);
        score = cv(ratios);
      }
      if (score < best.cvWinner) {
        best = { ...c, cvWinner: score };
      }
    }

    const confidence = best.cvWinner < 0.08  ? "high"
                     : best.cvWinner < 0.25  ? "medium"
                     :                         "low";

    return { ...best, confidence };
  }

  /**
   * Human-readable growth description.
   */
  function growthSummary(data) {
    if (!data || data.length < 2) return null;
    const first = data[0];
    const last  = data[data.length - 1];
    const nMult = (last.n    / first.n).toFixed(0);
    const tMult = (last.time / first.time).toFixed(1);
    return { nMult, tMult, firstN: first.n, lastN: last.n };
  }

  return { estimate, growthSummary };
})();