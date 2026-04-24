# ⚡ AlgoViz — Visual DSA in VS Code

> **Run → See → Understand**

AlgoViz is a VS Code extension that helps you deeply understand algorithms by **visualizing execution step-by-step**, **measuring real performance**, and **analyzing time complexity with interactive graphs** — all inside your editor.

---

## 🚀 Features

### 🎬 1. Step-by-Step Visualization

* Visualize algorithms **line-by-line**
* Real-time animation of operations (compare, swap, etc.)
* Track execution flow directly from your code

### 📊 2. Performance Analysis

* Run benchmarks automatically
* Plot **runtime vs input size (n)**
* Clean interactive graph inside VS Code

### 📈 3. Empirical Time Complexity Detection

* Automatically estimates complexity:

  * `O(n)`
  * `O(n log n)`
  * `O(n²)`
* Based on real execution data (not guessing)

### 🧪 4. Normalized Complexity Curves

* Compare:

  * `time / n`
  * `time / (n log n)`
  * `time / n²`
* Helps you *see* why an algorithm behaves the way it does

### 🤖 5. AI-Powered Insights *(Coming Soon)*

* Explain your algorithm in simple terms
* Suggest optimizations
* Recommend better alternatives

---

## 🖥️ How It Works

```bash
1. Write your algorithm (Python for MVP)
2. Click: "Visualize Algorithm"
3. Split screen opens →
   - Animation runs
   - Graph renders
   - Complexity is detected
```

---

## 📸 Demo

> *(Add GIF here — this will massively increase engagement)*

---

## 🛠️ Installation

### From Source

```bash
git clone https://github.com/your-username/algoviz
cd algoviz
npm install
npm run compile
```

Then press:

```
F5 → Launch Extension Development Host
```

---

## 🧑‍💻 Usage

### 1. Create your Python file

```python
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

viz.save()
```

---

### 2. Add benchmark file

```bash
benchmark.py
```

This automatically measures runtime performance.

---

### 3. Run Visualizer

* Open Command Palette:

```
Ctrl + Shift + P
```

* Run:

```
AlgoViz: Visualize Algorithm
```

---

## 📊 Example Output

* 🎬 Animated sorting visualization
* 📈 Runtime graph (n vs time)
* 🧠 Estimated Complexity:

```
O(n²) (empirical)
```

---

## 🏗️ Project Structure

```
algoviz/
├── src/                # VS Code extension (TypeScript)
├── webview/           # UI (HTML, CSS, JS)
├── python/            # Algorithm + benchmark
│   ├── viz.py
│   ├── bubble_sort.py
│   └── benchmark.py
├── steps.json
├── performance.json
```

---

## 🔮 Roadmap

* [ ] Merge Sort visualization
* [ ] Graph & Tree algorithms (DFS, BFS)
* [ ] Recursion tree visualization
* [ ] Multi-language support (C++, Java)
* [ ] AI assistant integration
* [ ] Pattern detection (sliding window, two pointers)

---

## 🎯 Vision

AlgoViz is built to help students move beyond:

> “I solved the problem”

to:

> “I understand *why* this works”

---

## 🤝 Contributing

Contributions are welcome!

If you want to:

* Add new algorithms
* Improve UI/UX
* Optimize performance
* Integrate AI

Feel free to open a PR or issue.

---

## ⭐ Support

If you find this useful:

* ⭐ Star the repo
* 🧑‍💻 Share with others
* 🐛 Report issues

---

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.
****
