# 🎬 Visualization Engine

This document covers the internals of AlgoViz's animation system — how it reads execution steps, renders array states, and synchronizes with source code highlighting.

---

## Table of Contents

- [🎬 Visualization Engine](#-visualization-engine)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Animation Loop](#animation-loop)
    - [State Machine](#state-machine)
  - [Rendering: Array Bars](#rendering-array-bars)
    - [Bar Color States](#bar-color-states)
  - [Step Types \& Visual Behavior](#step-types--visual-behavior)
    - [Swap Animation Detail](#swap-animation-detail)
  - [Code Line Highlighting](#code-line-highlighting)
  - [Playback Controls](#playback-controls)
  - [Performance Considerations](#performance-considerations)
  - [Extending the Engine](#extending-the-engine)
    - [Adding a New Visual Type](#adding-a-new-visual-type)
    - [Supporting Non-Array Data Structures](#supporting-non-array-data-structures)

---

## Overview

The visualization engine lives in `webview/animator.js`. It receives `steps.json` data from the VS Code extension via `postMessage` and replays each step as an animated frame in the WebView panel.

```
steps.json
    │
    ▼
postMessage (extension → webview)
    │
    ▼
animator.js
    ├── renderStep(step)
    │     ├── renderArray(step.array)       → draws bars on canvas
    │     ├── highlightIndices(step.indices) → colors active bars
    │     └── highlightLine(step.line)       → syncs code view
    │
    └── playLoop()  ← setTimeout-based frame loop
```

The engine is entirely canvas and DOM-based — no external animation libraries are required.

---

## Animation Loop

The animation runs as a `setTimeout`-driven loop over the steps array:

```javascript
let currentIndex = 0;
let speed = 200; // ms per step
let isPlaying = false;

function playLoop() {
  if (!isPlaying || currentIndex >= steps.length) return;

  renderStep(steps[currentIndex]);
  currentIndex++;

  setTimeout(playLoop, speed);
}
```

Each call to `playLoop` renders one step and schedules the next. Speed is adjustable at runtime — changing `speed` takes effect on the next frame.

### State Machine

The player has five states:

```
IDLE → PLAYING → PAUSED → PLAYING
                        → DONE
IDLE → STEPPING (manual forward/back)
```

| State      | Description                         |
|------------|-------------------------------------|
| `IDLE`     | Steps loaded, not yet started       |
| `PLAYING`  | Auto-playing through steps          |
| `PAUSED`   | Auto-play suspended                 |
| `STEPPING` | User manually stepping forward/back |
| `DONE`     | All steps rendered                  |

---

## Rendering: Array Bars

Array states are rendered as vertical bars on an HTML5 Canvas element. Each bar's height is proportional to the element's value relative to the array's maximum.

```javascript
function renderArray(array) {
  const canvas = document.getElementById('viz-canvas');
  const ctx = canvas.getContext('2d');
  const maxVal = Math.max(...array);
  const barWidth = canvas.width / array.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  array.forEach((val, idx) => {
    const barHeight = (val / maxVal) * (canvas.height - 20);
    const x = idx * barWidth;
    const y = canvas.height - barHeight;

    ctx.fillStyle = getBarColor(idx);   // default, active, sorted
    ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

    // Value label
    ctx.fillStyle = '#fff';
    ctx.fillText(val, x + barWidth / 2, y - 4);
  });
}
```

### Bar Color States

| Color                 | Meaning                              |
|-----------------------|--------------------------------------|
| `--color-bar-default` | Unaffected element                   |
| `--color-bar-active`  | Currently being compared or swapped  |
| `--color-bar-sorted`  | Element in its final sorted position |
| `--color-bar-pivot`   | Pivot element (Quick Sort)           |
| `--color-bar-found`   | Found element (Binary Search)        |

Colors are CSS variables, making theming easy.

---

## Step Types & Visual Behavior

Each step type triggers a distinct visual:

| Step Type  | Visual Effect                                                        |
|------------|----------------------------------------------------------------------|
| `init`     | Render all bars in default color                                     |
| `compare`  | Highlight `indices[0]` and `indices[1]` in active color, brief flash |
| `swap`     | Flash both bars, animate height exchange, re-render                  |
| `insert`   | Animate element "lifting" and sliding to new position                |
| `mark`     | Apply persistent color to index (pivot, boundary)                    |
| `annotate` | Display message in the info bar below the canvas                     |
| `done`     | Flash all bars in sorted color                                       |

### Swap Animation Detail

Swaps use a two-phase animation for visual clarity:

```
Phase 1 (50ms):  Both bars flash highlight color
Phase 2 (100ms): Bar heights animate to new values (CSS transition on height)
Phase 3 (50ms):  Colors return to default
```

This gives the user a clear visual signal that a swap happened, which is the most important operation to *see* in sorting algorithms.

---

## Code Line Highlighting

The WebView displays the user's algorithm source code alongside the animation. The `line` field in each step tells the engine which line to highlight.

```javascript
function highlightLine(lineNumber) {
  const codeLines = document.querySelectorAll('.code-line');

  // Remove previous highlight
  codeLines.forEach(el => el.classList.remove('active-line'));

  // Apply new highlight
  if (lineNumber && codeLines[lineNumber - 1]) {
    const target = codeLines[lineNumber - 1];
    target.classList.add('active-line');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
```

The source code is syntax-highlighted using a minimal tokenizer (no external library dependency). Line numbers are rendered as a separate column.

---

## Playback Controls

| Control        | Action                                 |
|----------------|----------------------------------------|
| ▶ Play         | Start auto-play from current position  |
| ⏸ Pause        | Suspend auto-play                      |
| ⏭ Step Forward | Advance one step                       |
| ⏮ Step Back    | Go back one step                       |
| ⏩ Speed Up     | Decrease `speed` by 50ms               |
| ⏪ Slow Down    | Increase `speed` by 50ms               |
| ↺ Reset        | Return to step 0, re-render init state |

Keyboard shortcuts *(planned)*:

| Key     | Action       |
|---------|--------------|
| `Space` | Play / Pause |
| `→`     | Step forward |
| `←`     | Step back    |
| `+`     | Speed up     |
| `-`     | Slow down    |
| `R`     | Reset        |

---

## Performance Considerations

- **Large arrays (n > 500):** Bar labels are hidden automatically to avoid overcrowding
- **Many steps (> 5000):** The step counter and progress bar help users navigate without scrubbing through all steps
- **Canvas redraws:** `clearRect` + full redraw per step is fast enough for arrays up to ~1000 elements at typical animation speeds (≥ 50ms/step)
- **Memory:** All steps are loaded into memory upfront. For very large traces, a streaming reader is planned (Phase 2)

---

## Extending the Engine

### Adding a New Visual Type

To support a new algorithm that needs a new kind of visual (e.g., a tree, a graph, a pointer):

1. Define a new step type in `viz.py` (e.g., `viz.node_visit()`)
2. Add a handler in `animator.js`:

```javascript
function renderStep(step) {
  switch (step.type) {
    case 'compare':  renderCompare(step); break;
    case 'swap':     renderSwap(step);    break;
    case 'node_visit': renderNodeVisit(step); break;  // new
    // ...
  }
}
```

3. Implement the `renderNodeVisit()` function using Canvas or DOM elements
4. Update `steps.json` schema in `architecture.md`

### Supporting Non-Array Data Structures

For trees and graphs, the engine will need a second canvas layer:

- **Layer 1:** Array bars (current)
- **Layer 2:** Tree / graph node renderer (planned, Phase 2)

The WebView HTML will use a `<div>` with two stacked `<canvas>` elements, and `animator.js` will route rendering to the appropriate layer based on the algorithm type.