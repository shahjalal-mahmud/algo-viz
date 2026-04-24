# 🗺️ AlgoViz Roadmap

> **Run → See → Understand** — one milestone at a time.

This document tracks where AlgoViz has been and where it's going. It's a living document — updated as the project grows and community priorities shift.

Want to help shape the roadmap? [Open a feature request](https://github.com/shahjalal-mahmud/algo-viz/issues/new?template=feature_request.md) or [start a discussion](https://github.com/shahjalal-mahmud/algo-viz/discussions).

---

## ✅ Phase 1 — MVP (Shipped in v0.1.0)

The foundation. Everything needed to go from code to visualization.

| Feature | Status |
|---------|--------|
| VS Code extension scaffold (TypeScript) | ✅ Done |
| `viz.py` instrumentation helper (`init`, `compare`, `swap`, `save`) | ✅ Done |
| Bubble Sort step-by-step animation | ✅ Done |
| Line tracking (code highlighting in sync with animation) | ✅ Done |
| `steps.json` execution recording pipeline | ✅ Done |
| Automatic benchmarking across multiple input sizes | ✅ Done |
| `performance.json` data pipeline | ✅ Done |
| Canvas-based interactive performance graph | ✅ Done |
| Empirical complexity detection (`O(n)`, `O(n log n)`, `O(n²)`) | ✅ Done |
| Normalized curve comparison (visual complexity fitting) | ✅ Done |
| Rule-based explanation system | ✅ Done |
| Split-screen WebView (animation + graph) | ✅ Done |
| MIT License + README + CONTRIBUTING.md | ✅ Done |

---

## 🔜 Phase 2 — More Algorithms & Better UX

*Target: v0.2.0 – v0.4.0*

Expanding what AlgoViz can visualize and making the experience smoother.

### 🧩 Algorithm Coverage

| Algorithm | Status |
|-----------|--------|
| Selection Sort | 🔲 Planned |
| Insertion Sort | 🔲 Planned |
| Merge Sort (with recursion tree) | 🔲 Planned |
| Quick Sort (with pivot highlighting) | 🔲 Planned |
| Binary Search (on sorted array) | 🔲 Planned |
| Linear Search | 🔲 Planned |
| DFS on graphs | 🔲 Planned |
| BFS on graphs | 🔲 Planned |
| Linked List operations (insert, delete, traverse) | 🔲 Planned |
| Stack push/pop | 🔲 Planned |
| Queue enqueue/dequeue | 🔲 Planned |

### 🎬 Animation Engine

| Feature | Status |
|---------|--------|
| Timeline scrubber (step forward/backward) | 🔲 Planned |
| Adjustable animation speed | 🔲 Planned |
| Recursion tree view | 🔲 Planned |
| Stack frame visualization | 🔲 Planned |
| Pointer/index movement animation | 🔲 Planned |
| Color-coded comparison regions | 🔲 Planned |
| Code sync improvements (smoother highlighting) | 🔲 Planned |

### 📊 Benchmarking & Complexity

| Feature | Status |
|---------|--------|
| `O(log n)` complexity detection | 🔲 Planned |
| `O(n³)` detection | 🔲 Planned |
| Best / average / worst case comparison | 🔲 Planned |
| Comparison counter overlay on animation | 🔲 Planned |

---

## 🔮 Phase 3 — AI & Intelligence

*Target: v0.5.0 – v0.9.0*

Making AlgoViz not just a viewer, but a teacher.

| Feature | Status |
|---------|--------|
| AI-powered plain-English explanations | 🔲 Planned |
| Pattern recognition (sliding window, two pointers, divide & conquer) | 🔲 Planned |
| Optimization suggestions ("This could be O(n log n) using...") | 🔲 Planned |
| Step-level AI commentary ("At this step, we're comparing...") | 🔲 Planned |
| LeetCode problem context integration | 🔲 Exploring |
| Auto-instrumentation (no manual `viz.py` calls needed) | 🔲 Planned |
| Multi-language support: C++ | 🔲 Planned |
| Multi-language support: Java | 🔲 Planned |
| Multi-language support: JavaScript | 🔲 Planned |

---

## 🌐 Phase 4 — Platform & Community

*Target: v1.0.0+*

Taking AlgoViz beyond a VS Code extension.

| Feature | Status |
|---------|--------|
| VS Code Marketplace release | 🔲 Planned |
| Web version (no VS Code required) | 🔲 Exploring |
| Guided algorithm walkthroughs / Learning Mode | 🔲 Planned |
| Share visualizations with a link | 🔲 Planned |
| Community solution comparison | 🔲 Exploring |
| University / bootcamp integration | 🔲 Exploring |
| Embeddable widget for blogs / course platforms | 🔲 Exploring |

---

## 💬 How to Influence the Roadmap

This roadmap reflects our current thinking, but the community shapes what gets built.

- **Vote on existing issues** — react with 👍 to signal demand
- **Open a feature request** — [use the template](https://github.com/shahjalal-mahmud/algo-viz/issues/new?template=feature_request.md)
- **Contribute directly** — see [CONTRIBUTING.md](CONTRIBUTING.md) to get started
- **Start a discussion** — for bigger ideas that need conversation first

We prioritize features that: (1) help the most learners, (2) align with the "Run → See → Understand" philosophy, and (3) have community contributors ready to help build them.

---

## 📌 Legend

| Symbol | Meaning |
|--------|---------|
| ✅ Done | Shipped and available |
| 🚧 In Progress | Actively being worked on |
| 🔲 Planned | On the roadmap, not yet started |
| 🔍 Exploring | Considering — no commitment yet |
| ❌ Dropped | Decided not to build (with reason in issues) |

---

*Last updated: April 2026 · For full version history, see [CHANGELOG.md](CHANGELOG.md)*