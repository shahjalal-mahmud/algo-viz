/**
 * graph.js — AlgoViz WebView Module
 * ==================================
 * High-quality canvas performance graph with normalized curve overlay.
 */

"use strict";

window.AlgoVizGraph = (() => {

  const COLORS = {
    raw:    "#7dd3fc",  // sky blue
    n:      "#4ade80",  // green
    nlogn:  "#facc15",  // yellow
    n2:     "#f87171",  // red
    grid:   "rgba(255,255,255,0.04)",
    axis:   "rgba(255,255,255,0.18)",
    text:   "rgba(255,255,255,0.35)",
    dot:    "#7dd3fc",
    area:   "rgba(125,211,252,0.06)",
    areaB:  "rgba(125,211,252,0.00)",
  };

  function formatTime(s) {
    if (s < 0.000001) return `${(s * 1e9).toFixed(0)}ns`;
    if (s < 0.001)    return `${(s * 1e6).toFixed(1)}µs`;
    if (s < 1)        return `${(s * 1000).toFixed(2)}ms`;
    return `${s.toFixed(2)}s`;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  /**
   * Draw the full performance graph onto `canvas`.
   * @param {HTMLCanvasElement} canvas
   * @param {Array} data - PerfPoint array
   * @param {boolean} showNormed - show normalized curves overlay
   */
  function draw(canvas, data, showNormed) {
    const W     = canvas.offsetWidth  || 600;
    const H     = canvas.offsetHeight || 240;
    const ratio = window.devicePixelRatio || 1;
    canvas.width  = W * ratio;
    canvas.height = H * ratio;

    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, W, H);

    // Padding
    const legendW = showNormed ? 130 : 0;
    const pad = { top: 24, right: 20 + legendW, bottom: 52, left: 64 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top  - pad.bottom;

    if (plotW <= 0 || plotH <= 0) return;

    const maxN    = Math.max(...data.map(d => d.n));
    const maxTime = Math.max(...data.map(d => d.time));
    if (maxN === 0 || maxTime === 0) return;

    const toX = n    => pad.left + (n / maxN) * plotW;
    const toY = (v, maxV) => pad.top + plotH - (v / (maxV || 1)) * plotH;

    // ── Background ──────────────────────────────────────────────────────────
    // transparent — handled by CSS on the panel

    // ── Grid ────────────────────────────────────────────────────────────────
    const gridLines = 5;
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const y   = pad.top + (i / gridLines) * plotH;
      const val = maxTime * (1 - i / gridLines);

      // Horizontal grid line
      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();

      // Y-axis label
      ctx.fillStyle   = COLORS.text;
      ctx.font        = `${10 * ratio / ratio}px "SF Mono", "Fira Code", monospace`;
      ctx.textAlign   = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(formatTime(val), pad.left - 10, y);
    }

    // Vertical grid lines at each data point
    data.forEach(d => {
      const x = toX(d.n);
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
    });

    // ── Axes ────────────────────────────────────────────────────────────────
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle   = COLORS.text;
    ctx.font        = `10px "SF Mono", "Fira Code", monospace`;
    ctx.textAlign   = "center";
    ctx.textBaseline = "top";
    data.forEach(d => {
      ctx.fillText(`n=${d.n}`, toX(d.n), pad.top + plotH + 10);
    });

    ctx.fillStyle    = "rgba(255,255,255,0.25)";
    ctx.font         = `11px "SF Mono", "Fira Code", monospace`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("Input size (n)", pad.left + plotW / 2, H - 4);

    // Rotate y-axis label
    ctx.save();
    ctx.translate(12, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = "top";
    ctx.fillStyle    = "rgba(255,255,255,0.25)";
    ctx.font         = `11px "SF Mono", "Fira Code", monospace`;
    ctx.fillText("Time", 0, 0);
    ctx.restore();

    // ── Helper: draw a smooth line ───────────────────────────────────────────
    function drawSmoothLine(points, color, maxV, dashed = false, lineWidth = 2) {
      if (points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth   = lineWidth;
      ctx.lineJoin    = "round";
      ctx.lineCap     = "round";
      if (dashed) ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(toX(points[0][0]), toY(points[0][1], maxV));
      for (let i = 1; i < points.length; i++) {
        const x0 = toX(points[i - 1][0]);
        const y0 = toY(points[i - 1][1], maxV);
        const x1 = toX(points[i][0]);
        const y1 = toY(points[i][1], maxV);
        const mx = (x0 + x1) / 2;
        ctx.bezierCurveTo(mx, y0, mx, y1, x1, y1);
      }
      ctx.stroke();
      ctx.restore();
    }

    // ── Area under raw curve ─────────────────────────────────────────────────
    const rawPts = data.map(d => [d.n, d.time]);
    {
      ctx.save();
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
      grad.addColorStop(0, COLORS.area);
      grad.addColorStop(1, COLORS.areaB);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(toX(rawPts[0][0]), pad.top + plotH);
      rawPts.forEach(([n, v]) => ctx.lineTo(toX(n), toY(v, maxTime)));
      ctx.lineTo(toX(rawPts[rawPts.length - 1][0]), pad.top + plotH);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // ── Raw curve ────────────────────────────────────────────────────────────
    drawSmoothLine(rawPts, COLORS.raw, maxTime, false, 2.5);

    // ── Normalized curves ────────────────────────────────────────────────────
    if (showNormed) {
      const maxN_norm  = Math.max(...data.map(d => d.n_norm).filter(isFinite));
      const maxNlogn   = Math.max(...data.map(d => d.nlogn_norm).filter(isFinite));
      const maxN2_norm = Math.max(...data.map(d => d.n2_norm).filter(isFinite));

      drawSmoothLine(data.map(d => [d.n, d.n_norm]),     COLORS.n,     maxN_norm,  true, 1.5);
      drawSmoothLine(data.map(d => [d.n, d.nlogn_norm]), COLORS.nlogn, maxNlogn,   true, 1.5);
      drawSmoothLine(data.map(d => [d.n, d.n2_norm]),    COLORS.n2,    maxN2_norm, true, 1.5);

      // Legend
      const legendEntries = [
        { color: COLORS.raw,   label: "raw time",     dashed: false },
        { color: COLORS.n,     label: "t / n",        dashed: true  },
        { color: COLORS.nlogn, label: "t / n·logn",   dashed: true  },
        { color: COLORS.n2,    label: "t / n²",       dashed: true  },
      ];
      const lx = pad.left + plotW + 12;
      legendEntries.forEach(({ color, label, dashed }, i) => {
        const ly = pad.top + 10 + i * 24;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.5;
        if (dashed) ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 18, ly); ctx.stroke();
        ctx.restore();
        ctx.fillStyle    = "rgba(255,255,255,0.45)";
        ctx.font         = `10px "SF Mono", "Fira Code", monospace`;
        ctx.textAlign    = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(label, lx + 24, ly);
      });
    }

    // ── Data dots ────────────────────────────────────────────────────────────
    data.forEach(d => {
      const x = toX(d.n);
      const y = toY(d.time, maxTime);

      // Glow ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(125,211,252,0.12)";
      ctx.fill();
      ctx.restore();

      // Outer ring
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(125,211,252,0.5)";
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.dot;
      ctx.fill();

      // Tooltip label
      ctx.fillStyle    = "rgba(255,255,255,0.5)";
      ctx.font         = `9px "SF Mono", "Fira Code", monospace`;
      ctx.textAlign    = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(formatTime(d.time), x, y - 9);
    });
  }

  return { draw, formatTime };
})();