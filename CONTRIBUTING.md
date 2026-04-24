# 🤝 Contributing to AlgoViz

First off — **thank you** for taking the time to contribute. AlgoViz is a student-built, open source project and every contribution, big or small, genuinely matters.

This document will walk you through everything you need to know to get started.

---

## 📋 Table of Contents

- [🤝 Contributing to AlgoViz](#-contributing-to-algoviz)
  - [📋 Table of Contents](#-table-of-contents)
  - [🌟 Code of Conduct](#-code-of-conduct)
  - [💡 How Can I Contribute?](#-how-can-i-contribute)
  - [🚀 Getting Started](#-getting-started)
    - [1. Fork \& Clone](#1-fork--clone)
    - [2. Install Dependencies](#2-install-dependencies)
    - [3. Compile the Extension](#3-compile-the-extension)
    - [4. Launch in Development Mode](#4-launch-in-development-mode)
    - [5. Python Setup](#5-python-setup)
  - [🔄 Development Workflow](#-development-workflow)
    - [Branch Naming Convention](#branch-naming-convention)
    - [Making Changes](#making-changes)
  - [📝 Commit Message Format](#-commit-message-format)
  - [🗂️ Project Structure](#️-project-structure)
    - [Adding a New Algorithm](#adding-a-new-algorithm)
  - [🔃 Pull Request Guidelines](#-pull-request-guidelines)
    - [Before Submitting](#before-submitting)
    - [PR Title Format](#pr-title-format)
    - [PR Description Template](#pr-description-template)
    - [Review Process](#review-process)
  - [🐛 Reporting Bugs](#-reporting-bugs)
  - [💡 Suggesting Features](#-suggesting-features)
  - [🎨 Style Guidelines](#-style-guidelines)
    - [TypeScript (Extension)](#typescript-extension)
    - [JavaScript (WebView)](#javascript-webview)
    - [Python](#python)
  - [🌱 First-Time Contributors](#-first-time-contributors)
  - [🙏 Thank You](#-thank-you)

---

## 🌟 Code of Conduct

This project is a learning space — for us and for you. We ask that everyone:

- Be kind, patient, and respectful
- Welcome beginners and their questions
- Give constructive, not harsh, feedback
- Assume good intent in all interactions

Disrespectful or exclusionary behavior will not be tolerated.

---

## 💡 How Can I Contribute?

There are many ways to contribute — you don't have to write code to make a difference:

| Type | Examples |
|------|----------|
| 🧩 **New Algorithm** | Add Merge Sort, Quick Sort, BFS, DFS visualization |
| 🎨 **UI/UX** | Improve animation smoothness, layout, colors |
| 🐛 **Bug Fix** | Fix a broken step, graph glitch, or incorrect complexity detection |
| 📖 **Documentation** | Improve README, add usage examples, write tutorials |
| 🧪 **Testing** | Add test cases, benchmark edge cases |
| 🤖 **AI Integration** | Help build the AI explanation/suggestion layer |
| 🌍 **Multi-language** | Extend support beyond Python (C++, Java, JS) |
| 💬 **Feedback** | Open issues with ideas, suggestions, or pain points |

---

## 🚀 Getting Started

### 1. Fork & Clone

```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/shahjalal-mahmud/algo-viz.git
cd algo-viz
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile the Extension

```bash
npm run compile
```

### 4. Launch in Development Mode

Open the project in VS Code and press `F5`.

This launches an **Extension Development Host** — a new VS Code window with AlgoViz loaded and ready to test.

### 5. Python Setup

```bash
cd python
pip install -r requirements.txt  # if applicable
```

---

## 🔄 Development Workflow

```
fork → clone → branch → code → test → commit → push → pull request
```

### Branch Naming Convention

Use clear, descriptive branch names:

```bash
feature/merge-sort-visualization
fix/graph-rendering-bug
docs/update-usage-section
refactor/viz-instrumentation-cleanup
```

### Making Changes

Always branch off from `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

Make your changes, then commit with a clear message (see below).

---

## 📝 Commit Message Format

We follow a simple convention:

```
type: short description (max 72 chars)

Optional longer explanation if needed.
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | New feature or algorithm |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure, no behavior change |
| `test` | Adding or fixing tests |
| `chore` | Build process, dependency updates |

**Examples:**

```
feat: add merge sort step-by-step visualization
fix: correct O(n log n) curve normalization in graph
docs: add usage example for binary search
```

---

## 🗂️ Project Structure

Understanding the structure will help you know where to make changes:

```
algo-viz/
│
├── src/                        # VS Code Extension (TypeScript)
│   ├── extension.ts            # Entry point — add new commands here
│   ├── visualizer.ts           # WebView panel management
│   └── benchmarkRunner.ts      # Python execution & data collection
│
├── webview/                    # Frontend UI shown in the split panel
│   ├── index.html              # Main WebView shell
│   ├── animator.js             # Animation engine — edit for new visualizations
│   ├── graph.js                # Canvas-based performance graph
│   └── complexity.js           # Curve fitting & complexity detection
│
├── python/                     # Python instrumentation layer
│   ├── viz.py                  # Core helper (compare, swap, init, save)
│   ├── bubble_sort.py          # Example algorithm
│   └── benchmark.py           # Benchmark runner
│
├── steps.json                  # Auto-generated: execution steps
├── performance.json            # Auto-generated: timing data
│
└── package.json                # Extension manifest & commands
```

### Adding a New Algorithm

1. Create `python/your_algorithm.py` using `viz.py` helpers
2. Add a benchmark case in `benchmark.py`
3. If the algorithm needs a new visual type (e.g., tree, graph), extend `animator.js`
4. Add the algorithm to the command list in `package.json` if needed
5. Document it in the README under the Features section

---

## 🔃 Pull Request Guidelines

### Before Submitting

- [ ] Your code compiles without errors (`npm run compile`)
- [ ] The extension launches correctly in Development Host (`F5`)
- [ ] Your changes don't break existing visualizations
- [ ] You've tested the feature/fix manually
- [ ] Commit messages follow the convention above

### PR Title Format

```
feat: add merge sort visualization with recursion tree
fix: resolve performance graph axis scaling on small n
docs: add contributing guide and license
```

### PR Description Template

When opening a PR, please include:

```markdown
## What does this PR do?
Brief description of the change.

## Why?
The motivation or problem being solved.

## How to test?
Steps to verify the change works correctly.

## Screenshots / GIFs (if UI changes)
Add before/after screenshots or a GIF if applicable.

## Checklist
- [ ] Tested in Extension Development Host
- [ ] No console errors
- [ ] Follows code style
```

### Review Process

- We aim to review PRs within **3–5 days**
- We may suggest changes — please don't take feedback personally, it's collaborative
- Once approved, a maintainer will merge your PR

---

## 🐛 Reporting Bugs

Found something broken? Please [open an issue](https://github.com/shahjalal-mahmud/algo-viz/issues) and include:

1. **What happened** — describe the bug clearly
2. **What you expected** — what should have happened
3. **Steps to reproduce** — exact steps to trigger the bug
4. **Environment** — OS, VS Code version, Python version, Node version
5. **Screenshots or error logs** — paste any console errors

```markdown
**Bug:** Graph renders blank when n < 50

**Steps to Reproduce:**
1. Run bubble_sort.py with arr size = 20
2. Open AlgoViz: Visualize Algorithm
3. Performance graph panel is blank

**Expected:** Graph should render with available data points

**VS Code:** 1.85.0 | Python: 3.10.2 | Node: 18.12.0
```

---

## 💡 Suggesting Features

Have an idea? We'd love to hear it. [Open a feature request](https://github.com/shahjalal-mahmud/algo-viz/issues) with:

1. **The problem** — what pain point does this solve?
2. **Your idea** — describe the feature
3. **Why it fits AlgoViz** — how does it align with the "Run → See → Understand" goal?
4. **Alternatives considered** — any other ways to solve it?

Please check existing issues first to avoid duplicates.

---

## 🎨 Style Guidelines

### TypeScript (Extension)

- Use `camelCase` for variables and functions
- Use `PascalCase` for classes and interfaces
- Add comments for non-obvious logic
- Keep functions focused — one responsibility per function

### JavaScript (WebView)

- Keep animation logic in `animator.js`, graph logic in `graph.js`
- Avoid global state where possible
- Comment animation sequences clearly

### Python

- Follow [PEP 8](https://peps.python.org/pep-0008/)
- Use descriptive variable names
- Keep `viz.py` minimal — it runs inside every instrumented algorithm
- Document any new `viz` helper functions with a docstring

---

## 🌱 First-Time Contributors

Never contributed to open source before? This is a great place to start.

Look for issues labeled:

- `good first issue` — small, well-defined, beginner-friendly
- `help wanted` — we actively need contributions here
- `documentation` — great for non-code contributions

Some beginner-friendly tasks to get started:

- Add a new algorithm using the existing `viz.py` pattern (e.g., Selection Sort)
- Improve the animation speed control in `animator.js`
- Fix a typo or unclear section in the README
- Add comments to an existing file that lacks them

**Don't be afraid to ask questions.** Open an issue or start a discussion — we're happy to guide you.

---

## 🙏 Thank You

Every contribution to AlgoViz helps make DSA more understandable for students everywhere.

Whether it's a bug report, a new algorithm, a documentation fix, or a feature idea — it all adds up. We're grateful you're here.

**Happy coding. Run → See → Understand. ⚡**

---

*Have questions not covered here? Open a [GitHub Discussion](https://github.com/shahjalal-mahmud/algo-viz/issues) or reach out via Issues.*