# 🏗️ AlgoViz — System Architecture

This document explains how AlgoViz is structured end-to-end: from the moment a user writes an algorithm to the moment they see it animated with complexity analysis.

---

## Table of Contents

- [High-Level Overview](#high-level-overview)
- [VS Code Extension Flow](#vs-code-extension-flow)
- [Python → JSON → WebView Pipeline](#python--json--webview-pipeline)
- [Benchmark System](#benchmark-system)
- [Future AI Pipeline](#future-ai-pipeline)
- [Data Schemas](#data-schemas)

---

## High-Level Overview

AlgoViz is composed of three layers that communicate through structured JSON files:

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S VS CODE                           │
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌────────────────┐   │
│   │   LAYER 1    │    │   LAYER 2    │    │    LAYER 3     │   │
│   │              │    │              │    │                │   │
│   │  TypeScript  │◄──►│    Python    │    │    WebView     │   │
│   │  Extension   │    │  Execution   │    │   Frontend     │   │
│   │              │    │  Engine      │    │                │   │
│   │  Commands    │    │  viz.py      │    │  Animator      │   │
│   │  WebView Mgr │    │  benchmark   │    │  Graph         │   │
│   │  File I/O    │    │  steps.json  │    │  Complexity    │   │
│   └──────────────┘    └──────────────┘    └────────────────┘   │
│          │                   │                    ▲            │
│          │         steps.json│                    │            │
│          │         perf.json │                    │            │
│          └───────────────────┴────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

The layers never call each other directly. Communication happens entirely through two JSON files written to disk:

| File | Written by | Read by | Purpose |
|------|-----------|---------|---------|
| `steps.json` | `viz.py` (Python) | WebView `animator.js` | Execution step replay |
| `performance.json` | `benchmark.py` (Python) | WebView `graph.js` | Runtime data for graphing |

This decoupled design means any layer can be replaced or extended independently.

---

## VS Code Extension Flow

The TypeScript extension is the orchestrator. It handles user commands, manages the WebView panel, and triggers Python execution.

```
User opens Command Palette
         │
         ▼
"AlgoViz: Visualize Algorithm"  ←── registered in package.json
         │
         ▼
extension.ts → activate()
         │
         ├─── 1. Reads the active editor file path
         │
         ├─── 2. Calls benchmarkRunner.ts
         │         └── spawns: python benchmark.py
         │               └── writes: performance.json
         │
         ├─── 3. Spawns: python <user_file>.py
         │         └── viz.py captures steps
         │               └── writes: steps.json
         │
         └─── 4. Opens WebView panel (visualizer.ts)
                   └── loads webview/index.html
                         ├── reads steps.json   → animator.js
                         └── reads performance.json → graph.js
```

### Key Files

**`src/extension.ts`**
- Registers the `algoviz.visualize` command
- Entry point: `activate(context)` function
- Coordinates Python execution and WebView launch

**`src/visualizer.ts`**
- Creates and manages the `vscode.WebviewPanel`
- Passes `steps.json` and `performance.json` content into the WebView via `postMessage`
- Handles messages sent back from the WebView (e.g., "ready", "step complete")

**`src/benchmarkRunner.ts`**
- Spawns the Python subprocess for `benchmark.py`
- Captures stdout/stderr for debugging
- Returns a promise that resolves when `performance.json` is written

**`package.json`**
- Declares the `algoviz.visualize` command
- Defines activation events (`onCommand`)
- Specifies the extension's VS Code engine version requirement

---

## Python → JSON → WebView Pipeline

This is the core data flow. Python captures what the algorithm does; JSON stores it; the WebView replays it.

### Step 1: Instrumentation with `viz.py`

The user imports `viz` and wraps their algorithm with helper calls:

```python
import viz

arr = [64, 34, 25, 12, 22, 11, 90]
viz.init(arr)            # records initial state

def bubble_sort(array):
    n = len(array)
    for i in range(n):
        for j in range(0, n - i - 1):
            viz.compare(array, j, j + 1)       # records a comparison
            if array[j] > array[j + 1]:
                viz.swap(array, j, j + 1)       # records a swap

bubble_sort(arr)
viz.save()               # writes steps.json
```

### Step 2: `viz.py` Internal State Machine

```
viz.init(arr)
    └── stores initial array snapshot
    └── appends { type: "init", array: [...], line: N } to steps[]

viz.compare(array, i, j)
    └── appends { type: "compare", indices: [i,j], array: [...], line: N }

viz.swap(array, i, j)
    └── performs the actual swap in-place
    └── appends { type: "swap", indices: [i,j], array: [...], line: N }

viz.save()
    └── writes steps[] → steps.json
```

### Step 3: `steps.json` Format

```json
[
  {
    "type": "init",
    "array": [64, 34, 25, 12, 22, 11, 90],
    "line": 4
  },
  {
    "type": "compare",
    "indices": [0, 1],
    "array": [64, 34, 25, 12, 22, 11, 90],
    "line": 9
  },
  {
    "type": "swap",
    "indices": [0, 1],
    "array": [34, 64, 25, 12, 22, 11, 90],
    "line": 11
  }
  // ... hundreds more steps
]
```

### Step 4: WebView Reads & Animates

The TypeScript extension passes `steps.json` content into the WebView via `postMessage`:

```typescript
// visualizer.ts
panel.webview.postMessage({
  command: 'loadSteps',
  steps: JSON.parse(fs.readFileSync('steps.json', 'utf8'))
});
```

Inside the WebView:

```javascript
// animator.js
window.addEventListener('message', event => {
  const { command, steps } = event.data;
  if (command === 'loadSteps') {
    renderStep(steps, currentIndex);
  }
});

function renderStep(steps, index) {
  const step = steps[index];
  highlightLine(step.line);         // sync code highlight
  renderArray(step.array);          // redraw the array bars
  highlightIndices(step.indices);   // mark active positions
}
```

---

## Benchmark System

The benchmark system answers: *"How does my algorithm scale with input size?"*

### Flow

```
benchmark.py
    │
    ├── defines: sizes = [100, 200, 300, 500, 750, 1000]
    │
    ├── for each n:
    │     ├── generates random array of size n
    │     ├── records start time (time.perf_counter)
    │     ├── runs the algorithm
    │     └── records elapsed time in ms
    │
    └── writes performance.json
```

### `performance.json` Format

```json
[
  { "n": 100,  "time": 0.82  },
  { "n": 200,  "time": 3.21  },
  { "n": 300,  "time": 7.14  },
  { "n": 500,  "time": 19.87 },
  { "n": 750,  "time": 44.51 },
  { "n": 1000, "time": 79.30 }
]
```

### Complexity Detection (`complexity.js`)

The WebView's `complexity.js` receives this data and fits it against known curves:

```
For each complexity class C (n, n log n, n²):
    normalized[i] = time[i] / C(n[i])

If normalized[] is approximately constant → complexity is C
```

The flattest normalized curve wins. The variance across normalized values determines confidence.

```javascript
function detectComplexity(data) {
  const curves = {
    'O(n)':        n => n,
    'O(n log n)':  n => n * Math.log2(n),
    'O(n²)':       n => n * n,
  };

  let best = null, bestVariance = Infinity;

  for (const [label, fn] of Object.entries(curves)) {
    const normalized = data.map(d => d.time / fn(d.n));
    const variance = computeVariance(normalized);
    if (variance < bestVariance) {
      bestVariance = variance;
      best = label;
    }
  }

  return best;
}
```

### Graph Rendering (`graph.js`)

Uses the HTML5 Canvas API (no external libraries):

```
Canvas setup → draw axes → plot data points → draw curve → label axes
```

The graph renders inside the VS Code WebView panel alongside the animation.

---

## Future AI Pipeline

The AI layer is planned for Phase 3. Here is the intended architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    AI PIPELINE (Phase 3)                │
│                                                         │
│  Input Bundle                                           │
│  ─────────────────────────────────────────────────      │
│  • User's algorithm source code                         │
│  • steps.json (execution trace)                         │
│  • performance.json (timing data)                       │
│  • Detected complexity class                            │
│                          │                              │
│                          ▼                              │
│            ┌─────────────────────────┐                  │
│            │     AI API Call         │                  │
│            │  (Claude / GPT / local) │                  │
│            └─────────────────────────┘                  │
│                          │                              │
│                          ▼                              │
│  Output                                                 │
│  ─────────────────────────────────────────────────      │
│  • Plain-English algorithm explanation                  │
│  • Complexity reasoning ("O(n²) because...")            │
│  • Pattern recognition (sliding window, etc.)           │
│  • Optimization suggestions                             │
│  • Alternative algorithm recommendations                │
└─────────────────────────────────────────────────────────┘
```

### Planned Integration Points

| Where | What |
|-------|------|
| `src/aiService.ts` | Handles API calls, prompt construction, response parsing |
| `webview/ai-panel.js` | Renders AI output in a third panel column |
| `viz.py` | Will export richer metadata (operation counts, recursion depth) for better AI context |

### Prompt Strategy

The AI will receive a structured context block rather than a raw question:

```
You are an algorithm tutor. Analyze the following:

ALGORITHM CODE:
<source code>

EXECUTION SUMMARY:
- Total steps: 312
- Comparisons: 210
- Swaps: 102

EMPIRICAL COMPLEXITY: O(n²) (confidence: 94%)

Provide:
1. A simple explanation of what this algorithm does
2. Why the complexity is O(n²) in this specific case
3. Any optimization opportunities
4. Pattern classification if applicable
```

---

## Data Schemas

### `steps.json` — Full Schema

```typescript
type StepType = "init" | "compare" | "swap" | "insert" | "mark" | "done";

interface Step {
  type: StepType;
  array: number[];        // full array state at this step
  indices?: number[];     // indices involved (compare, swap)
  line?: number;          // source line number for highlighting
  meta?: {                // optional extra context
    depth?: number;       // recursion depth
    pivot?: number;       // for quick sort
    message?: string;     // arbitrary annotation
  };
}

type StepsFile = Step[];
```

### `performance.json` — Full Schema

```typescript
interface DataPoint {
  n: number;       // input size
  time: number;    // elapsed time in milliseconds
  ops?: number;    // optional: operation count
}

type PerformanceFile = DataPoint[];
```

---

*For implementation details of specific components, see the other docs:*
- [`api.md`](./api.md) — `viz.py` API reference
- [`visualization-engine.md`](./visualization-engine.md) — Animation system deep dive
- [`benchmarking.md`](./benchmarking.md) — Benchmark system details
- [`ai-integration.md`](./ai-integration.md) — AI layer design