<div align="center">

<img src="https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white"  alt="VS Code-Extension"/>
<img src="https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white"  alt="Python-3.8"/>
<img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge"  alt="License-MIT"/>
<img src="https://img.shields.io/badge/Status-MVP-f59e0b?style=for-the-badge"  alt="MVP"/>
<img src="https://img.shields.io/badge/Open%20Source-❤️-ef4444?style=for-the-badge"  alt="Open Source"/>

<br /><br />

```
 █████╗ ██╗      ██████╗  ██████╗ ██╗   ██╗██╗███████╗
██╔══██╗██║     ██╔════╝ ██╔═══██╗██║   ██║██║╚══███╔╝
███████║██║     ██║  ███╗██║   ██║██║   ██║██║  ███╔╝ 
██╔══██║██║     ██║   ██║██║   ██║╚██╗ ██╔╝██║ ███╔╝  
██║  ██║███████╗╚██████╔╝╚██████╔╝ ╚████╔╝ ██║███████╗
╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝  ╚═══╝  ╚═╝╚══════╝
```

### ⚡ Visual DSA Understanding — Right Inside VS Code

**Run → See → Understand**

*Stop memorizing. Start understanding.*

[🚀 Get Started](#-installation) · [📖 How It Works](#%EF%B8%8F-how-it-works) · [🗺️ Roadmap](#-roadmap) · [🤝 Contributing](#-contributing)

<br />

> **AlgoViz** was born from a simple frustration — getting "Accepted" on LeetCode but having no idea *why* the algorithm actually works.
> Built by two CS students who wanted to *see* the code think.

</div>

---

## 🧠 The Problem We're Solving

Every DSA learner hits the same wall:

```
Write code → Submit → Accepted ✅ → Move on → Forget everything
```

You solved it. But did you *understand* it?

Most learners end up:
- 📝 **Memorizing patterns** instead of building intuition
- 🤷 **Guessing complexity** instead of understanding it empirically  
- 🐛 **Struggling to debug** because they can't *see* what the algorithm does
- 🔄 **Re-learning the same concepts** because nothing ever clicked

**AlgoViz fixes this.** It puts you *inside* the algorithm.

---

## ✨ What AlgoViz Does

AlgoViz is a VS Code extension that gives your algorithms a visual brain. You write the code — AlgoViz shows you exactly what it's doing, how fast it's doing it, and why it behaves the way it does.

```
┌──────────────────────────────────────────────────────────┐
│                    YOUR VS CODE EDITOR                   │
│                                                          │
│  📝 Your Code          │  🎬 Live Animation             │
│  ─────────────────     │  ──────────────────            │
│  bubble_sort(arr)  ◄───┤  [ 64 | 34 | 25 | 12 ]        │
│    ► compare j, j+1    │       ↕ comparing              │
│    ► swap if needed    │  [ 34 | 64 | 25 | 12 ]        │
│                        │                                │
│                        │  📊 Performance Graph          │
│                        │  ──────────────────           │
│                        │  n=100  → 0.8ms               │
│                        │  n=500  → 18ms                │
│                        │  n=1000 → 72ms   O(n²) 🎯    │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Features

### 🎬 1. Step-by-Step Algorithm Visualization

Watch your algorithm think — one operation at a time.

- **Line-by-line execution tracking** with real-time code highlighting
- **Animated data structure transformations** — see every compare, swap, insert, and shift
- **Full execution control** — play, pause, step forward, step backward
- **Timeline scrubber** — jump to any moment in the algorithm's execution
- Supports **arrays, trees, graphs, stacks, queues, recursion trees** and more *(expanding)*

```python
# Your code stays clean — viz.py is a lightweight helper
import viz

arr = [64, 34, 25, 12, 22, 11, 90]
viz.init(arr)

def bubble_sort(array):
    n = len(array)
    for i in range(n):
        for j in range(0, n - i - 1):
            viz.compare(array, j, j + 1)     # ← tracked
            if array[j] > array[j + 1]:
                viz.swap(array, j, j + 1)    # ← tracked

bubble_sort(arr)
viz.save()
```

Every `compare` and `swap` is recorded and replayed as a smooth animation. You'll never wonder "what just happened" again.

---

### 📊 2. Real Performance Benchmarking

No more theoretical guessing — see how your algorithm *actually* performs.

- **Automatic benchmarking** runs your algorithm across multiple input sizes
- **Interactive runtime graph** — plot `n` vs `execution time (ms)` right inside VS Code
- **Canvas-based graph rendering** — no external dependencies
- See exactly how performance degrades (or doesn't) as `n` grows

```
Runtime (ms)
│                                              ●
│                                         ●
│                                    ●
│                               ●
│                          ●
│                    ●
│              ●
│        ●
│   ●
└──────────────────────────────────────────── n (input size)
  100  200  300  400  500  600  700  800  900  1000
```

---

### 📈 3. Empirical Time Complexity Detection

Stop guessing `O(n²)`. Let the data tell you.

AlgoViz analyzes your actual runtime data and fits it against known complexity curves:

| Normalized Curve   | What It Reveals                      |
|--------------------|--------------------------------------|
| `time / n`         | Is this O(n)? → Should flatten       |
| `time / (n log n)` | Is this O(n log n)? → Should flatten |
| `time / n²`        | Is this O(n²)? → Should flatten      |

The curve that **flattens** is your algorithm's complexity. You'll *see* it happen.

```
Detected Complexity: O(n²)   [empirical, 94% confidence]
```

This builds real intuition — not just memorized labels.

---

### 🤖 4. AI-Powered Insights *(Coming Soon)*

An intelligent assistant that understands your code, not just your question.

- **Plain-English explanations** — "Your algorithm is O(n²) because for each element, you're scanning the rest of the array"
- **Pattern recognition** — detects sliding window, two pointers, divide and conquer, etc.
- **Optimization suggestions** — "This can be improved to O(n log n) using merge sort because..."
- **Complexity reasoning** — explains *why*, not just *what*

---

## 🛠️ How It Works

```
┌─────────────┐    ┌──────────────┐    ┌───────────────────┐
│  Write Code │ →  │ Instrumented │ →  │   Run Visualizer  │
│  (Python)   │    │  with viz.py │    │  (Ctrl+Shift+P)   │
└─────────────┘    └──────────────┘    └─────────┬─────────┘
                                                 │
                          ┌──────────────────────┼──────────────────────┐
                          ▼                      ▼                      ▼
               ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────┐
               │   🎬 Animation   │  │  📊 Graph        │  │  🤖 AI Insight  │
               │  Step-by-step    │  │  Runtime data    │  │  Explanation    │
               │  WebView panel   │  │  Complexity fit  │  │  Suggestions    │
               └──────────────────┘  └─────────────────┘  └─────────────────┘
```

**Step 1 — Instrument your code** using `viz.py` helpers (`viz.compare()`, `viz.swap()`, `viz.init()`, `viz.save()`).

**Step 2 — Run the benchmark** — `benchmark.py` runs your algorithm over increasing input sizes and collects timing data automatically.

**Step 3 — Trigger AlgoViz** — Open Command Palette (`Ctrl+Shift+P`) and run `AlgoViz: Visualize Algorithm`.

**Step 4 — Watch & Learn** — A split-screen WebView opens with your animation, performance graph, and complexity detection running in parallel.

---

## 📦 Installation

### Prerequisites

- [VS Code](https://code.visualstudio.com/) `1.75+`
- [Node.js](https://nodejs.org/) `16+`
- [Python](https://python.org/) `3.8+`

### Install from Source (Development)

```bash
# Clone the repository
git clone https://github.com/shahjalal-mahmud/algo-viz.git
cd algoviz

# Install dependencies
npm install

# Compile the extension
npm run compile
```

Then press `F5` in VS Code to launch the **Extension Development Host** — a new VS Code window will open with AlgoViz active.

> 📌 **VS Code Marketplace release coming soon.** Follow the repo to get notified.

---

## 🧑‍💻 Usage

### Step 1 — Set up your algorithm file

Create a Python file and instrument it with `viz.py`:

```python
# bubble_sort.py
import viz

arr = [64, 34, 25, 12, 22, 11, 90]
viz.init(arr)

def bubble_sort(array):
    n = len(array)
    for i in range(n):
        for j in range(0, n - i - 1):
            viz.compare(array, j, j + 1)
            if array[j] > array[j + 1]:
                viz.swap(array, j, j + 1)

bubble_sort(arr)
viz.save()  # saves steps.json
```

### Step 2 — Set up the benchmark file

```python
# benchmark.py
import time
import random
from bubble_sort import bubble_sort

sizes = [100, 200, 300, 500, 750, 1000]
results = []

for n in sizes:
    arr = random.sample(range(n * 10), n)
    start = time.perf_counter()
    bubble_sort(arr)
    elapsed = (time.perf_counter() - start) * 1000  # ms
    results.append({"n": n, "time": elapsed})

# AlgoViz reads this automatically
import json
with open("performance.json", "w") as f:
    json.dump(results, f)
```

### Step 3 — Launch AlgoViz

```
Ctrl + Shift + P  →  AlgoViz: Visualize Algorithm
```

Your split-screen panel opens instantly with animation + graph + complexity detection.

---

## 🗂️ Project Structure

```
algoviz/
│
├── src/                        # VS Code Extension (TypeScript)
│   ├── extension.ts            # Entry point, command registration
│   ├── visualizer.ts           # WebView management
│   └── benchmarkRunner.ts      # Triggers benchmark execution
│
├── webview/                    # Frontend UI (HTML + CSS + JS)
│   ├── index.html              # Main WebView shell
│   ├── animator.js             # Step-by-step animation engine
│   ├── graph.js                # Canvas-based performance graph
│   └── complexity.js           # Curve fitting & complexity detection
│
├── python/                     # Python Layer
│   ├── viz.py                  # Instrumentation helper (compare, swap, etc.)
│   ├── bubble_sort.py          # Example: Bubble Sort
│   └── benchmark.py           # Benchmark runner
│
├── steps.json                  # Generated: execution steps
├── performance.json            # Generated: timing data
│
├── package.json                # Extension manifest
├── tsconfig.json               # TypeScript config
└── README.md
└── LISENCE.txt
```

---

## 📸 Demo

> 🎬 *Demo GIF coming soon — this will show the full animation + graph in action.*
>
> Want to help? Run AlgoViz and share a screen recording — we'd love to feature community demos here!

---

## 🗺️ Roadmap

AlgoViz is actively being developed. Here's where we're headed:

### ✅ MVP (Current)
- [x] Bubble Sort visualization
- [x] Step-by-step animation with line tracking
- [x] Real performance benchmarking
- [x] Empirical complexity detection
- [x] Normalized curve comparison (`O(n)`, `O(n log n)`, `O(n²)`)
- [x] Interactive performance graph (canvas-based)
- [x] Rule-based explanation system

### 🔜 Phase 2 — More Algorithms & Better UX
- [ ] Merge Sort visualization
- [ ] Quick Sort visualization
- [ ] Binary Search visualization
- [ ] DFS / BFS on graphs
- [ ] Recursion tree view
- [ ] Stack frame visualization
- [ ] Pointer movement animation
- [ ] Timeline scrubber (step forward/backward)
- [ ] Code sync improvements

### 🔮 Phase 3 — AI & Multi-Language
- [ ] AI-powered algorithm explanations (Claude / GPT integration)
- [ ] Pattern recognition (sliding window, two pointers, divide & conquer)
- [ ] Auto-optimization suggestions
- [ ] Multi-language support: C++, Java, JavaScript
- [ ] Auto-instrumentation (no manual `viz.py` calls needed)

### 🌐 Phase 4 — Platform
- [ ] Web version (browser-based, no VS Code required)
- [ ] Guided algorithm walkthroughs / Learning Mode
- [ ] Share visualizations with others
- [ ] Community solution comparison
- [ ] University / bootcamp integration

---

## 🔬 Why AlgoViz Is Different

Most tools either show you pre-built animations that have nothing to do with your code, or they give you an "Accepted" and send you on your way. AlgoViz is neither.

| Feature                | AlgoViz    | Static Visualizers | LeetCode / Codeforces |
|------------------------|------------|--------------------|-----------------------|
| Works inside VS Code   | ✅          | ❌                  | ❌                     |
| Visualizes YOUR code   | ✅          | ❌                  | ❌                     |
| Step-by-step execution | ✅          | Limited            | ❌                     |
| Real performance data  | ✅          | ❌                  | ❌                     |
| Empirical complexity   | ✅          | ❌                  | ❌                     |
| AI insights            | ✅ *(soon)* | ❌                  | Limited               |
| Open Source            | ✅          | Varies             | ❌                     |

---

## 🤝 Contributing

AlgoViz is open source and built for the community — contributions are not just welcome, they're what makes this project grow.

Whether you're a student, a developer, or someone who just wants better DSA tools, you can help.

### Ways to contribute

```
🧩 Add new algorithm visualizations
🎨 Improve UI/UX and animations
🐛 Fix bugs and edge cases
🤖 Integrate AI features
🌍 Add multi-language support
📖 Write documentation or tutorials
🧪 Add tests and benchmarks
```

### Getting started

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR-USERNAME/algoviz.git
cd algoviz
npm install
npm run compile

# Create a feature branch
git checkout -b feature/merge-sort-visualization

# Make your changes, then open a Pull Request
```

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines on code style, PR format, and how we review contributions.

> 💬 Have an idea but not sure where to start? Open an [Issue](https://github.com/shahjalal-mahmud/algo-viz/issues) and let's discuss it.

---

## 🌱 Who This Is For

AlgoViz was built by students, for students — but it's useful for anyone learning or working with algorithms.

- 🎓 **CS students** preparing for internships and placements
- 🧑‍💻 **Self-taught developers** building DSA fundamentals
- 🏫 **Educators** who want to show algorithms visually in class
- 🔭 **Curious programmers** who want to understand what their code is really doing

---

## 💬 Our Story

This project started between two university friends who kept asking the same question after every LeetCode submission:

> *"Okay it works… but WHY does it work? And why does it slow down like that?"*

We couldn't find a tool that answered both questions at once, inside our editor, with our actual code. So we built one.

AlgoViz is our attempt to make DSA something you *feel*, not just something you pass.

We're sharing it publicly because we believe every student deserves tools that teach instead of just judge.

---

## ⭐ Support the Project

If AlgoViz has helped you understand an algorithm better:

- ⭐ **Star the repository** — it helps others find it
- 🐛 **Report bugs** — help us make it more stable
- 💡 **Suggest features** — open an issue with your idea
- 🧑‍💻 **Contribute** — every PR matters, big or small
- 📣 **Share it** — tell a friend who's struggling with DSA

---

## 📄 License

This project is licensed under the **MIT License** — see the [`LICENSE`](LICENSE.txt) file for details.

You're free to use, modify, and distribute AlgoViz. If you build something cool on top of it, we'd love to hear about it.

---

<div align="center">

**Built with ❤️ by two students who wanted to understand algorithms, not just solve them.**

*If this project helps even one person move from "I memorized the pattern" to "I understand why it works" — it was worth building.*

[⭐ Star on GitHub](https://github.com/shahjalal-mahmud/algo-viz) · [🐛 Report a Bug](https://github.com/shahjalal-mahmud/algo-viz/issues) · [💡 Request a Feature](https://github.com/shahjalal-mahmud/algo-viz/issues)

</div>