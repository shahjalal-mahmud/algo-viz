# Changelog

All notable changes to **AlgoViz** will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Merge Sort visualization with recursion tree
- Quick Sort with pivot highlighting
- Binary Search step-by-step on sorted arrays
- DFS / BFS on graph structures
- Stack frame visualization for recursion
- Timeline scrubber (step forward / backward)
- AI-powered explanation layer (Claude / GPT integration)
- Pattern recognition (sliding window, two pointers, divide & conquer)

---

## [0.1.0] — 2025 (MVP Release)

### Added
- **Core VS Code Extension** — TypeScript extension scaffolded with command registration and WebView management
- **`viz.py` instrumentation helper** — lightweight Python module with `init()`, `compare()`, `swap()`, and `save()` methods for capturing algorithm execution steps
- **Bubble Sort visualization** — first fully instrumented algorithm with step-by-step animation
- **Step-by-step animation engine** — WebView-based animator that replays recorded steps with configurable speed
- **Line tracking** — active code line highlighted in sync with animation playback
- **Automatic benchmarking** — `benchmark.py` runs algorithms across multiple input sizes and collects timing data
- **Interactive performance graph** — canvas-based renderer plotting `n` vs `time (ms)` inside VS Code
- **Empirical complexity detection** — normalized curve fitting for `O(n)`, `O(n log n)`, and `O(n²)`
- **Normalized complexity curves** — `time/n`, `time/(n log n)`, `time/n²` rendered for visual comparison
- **Rule-based explanation system** — static explanations matched to detected complexity class
- **`steps.json` pipeline** — structured execution data format consumed by the WebView animator
- **`performance.json` pipeline** — benchmark output format consumed by the graph renderer
- **Split-screen WebView layout** — animation panel + graph panel displayed side by side

### Project
- Repository made public and open source under MIT License
- `README.md` with full project overview, usage guide, and roadmap
- `CONTRIBUTING.md` with setup instructions, PR guidelines, and style conventions
- `LICENSE` (MIT)
- GitHub Actions CI pipeline for extension build, Python validation, and security audit
- Issue and PR templates added

---

## Versioning Guide

| Version | Meaning |
|---------|---------|
| `0.x.x` | Pre-release / MVP phase — API and features may change |
| `1.0.0` | Stable release — core visualization, benchmarking, and complexity detection finalized |
| `1.x.0` | New algorithm support, UI improvements |
| `2.0.0` | AI integration layer, multi-language support |

---

*For the full list of commits, see the [GitHub commit history](https://github.com/shahjalal-mahmud/algo-viz/commits/main).*