# 📖 AlgoViz API Reference — `viz.py`

`viz.py` is AlgoViz's Python instrumentation module. It is a lightweight helper that records your algorithm's execution steps into a structured format that the WebView animator can replay.

You import it into your algorithm file, wrap key operations with `viz` calls, and run `viz.save()` at the end. That's it.

---

## Table of Contents

- [📖 AlgoViz API Reference — `viz.py`](#-algoviz-api-reference--vizpy)
  - [Table of Contents](#table-of-contents)
  - [Quick Start](#quick-start)
  - [API Reference](#api-reference)
    - [`viz.init(array, *, label=None)`](#vizinitarray--labelnone)
    - [`viz.compare(array, i, j, *, line=None)`](#vizcomparearray-i-j--linenone)
    - [`viz.swap(array, i, j, *, line=None)`](#vizswaparray-i-j--linenone)
    - [`viz.insert(array, from_index, to_index, *, line=None)`](#vizinsertarray-from_index-to_index--linenone)
    - [`viz.mark(array, index, *, color=None, label=None, line=None)`](#vizmarkarray-index--colornone-labelnone-linenone)
    - [`viz.annotate(message, *, line=None)`](#vizannotatemessage--linenone)
    - [`viz.save(*, path="steps.json")`](#vizsave-pathstepsjson)
    - [`viz.reset()`](#vizreset)
  - [Configuration](#configuration)
  - [Output Format](#output-format)
  - [Adding a New Algorithm](#adding-a-new-algorithm)
  - [Error Reference](#error-reference)

---

## Quick Start

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

Running this file writes `steps.json` in the same directory, which AlgoViz reads for animation.

---

## API Reference

---

### `viz.init(array, *, label=None)`

Records the initial state of your data structure. **Always call this first**, before any algorithm logic.

**Parameters**

| Parameter | Type   | Required | Description                                                           |
|-----------|--------|----------|-----------------------------------------------------------------------|
| `array`   | `list` | ✅        | The array to visualize. Must be a flat list of numbers.               |
| `label`   | `str`  | ❌        | Optional label shown in the animation header (e.g., `"Input Array"`). |

**Example**

```python
arr = [5, 3, 8, 1, 9, 2]
viz.init(arr, label="Unsorted Input")
```

**Recorded step**

```json
{
  "type": "init",
  "array": [5, 3, 8, 1, 9, 2],
  "label": "Unsorted Input",
  "line": 2
}
```

---

### `viz.compare(array, i, j, *, line=None)`

Records a comparison between two elements. Does **not** modify the array.

**Parameters**

| Parameter | Type   | Required | Description                                             |
|-----------|--------|----------|---------------------------------------------------------|
| `array`   | `list` | ✅        | The current array state.                                |
| `i`       | `int`  | ✅        | Index of the first element being compared.              |
| `j`       | `int`  | ✅        | Index of the second element being compared.             |
| `line`    | `int`  | ❌        | Source line number override (auto-detected if omitted). |

**Example**

```python
viz.compare(array, j, j + 1)
if array[j] > array[j + 1]:
    ...
```

**Recorded step**

```json
{
  "type": "compare",
  "indices": [3, 4],
  "array": [5, 3, 8, 1, 9, 2],
  "line": 9
}
```

---

### `viz.swap(array, i, j, *, line=None)`

Records a swap between two elements **and performs the swap** on the array in-place.

**Parameters**

| Parameter | Type   | Required | Description                  |
|-----------|--------|----------|------------------------------|
| `array`   | `list` | ✅        | The array to swap in.        |
| `i`       | `int`  | ✅        | Index of the first element.  |
| `j`       | `int`  | ✅        | Index of the second element. |
| `line`    | `int`  | ❌        | Source line number override. |

> ⚠️ `viz.swap()` performs the actual swap — you do **not** need to swap manually after calling this.

**Example**

```python
if array[j] > array[j + 1]:
    viz.swap(array, j, j + 1)   # swaps AND records
```

**Recorded step**

```json
{
  "type": "swap",
  "indices": [3, 4],
  "array": [5, 3, 8, 9, 1, 2],
  "line": 11
}
```

---

### `viz.insert(array, from_index, to_index, *, line=None)`

Records an element being picked up and inserted at a new position. Intended for insertion sort and similar algorithms.

**Parameters**

| Parameter    | Type   | Required | Description                   |
|--------------|--------|----------|-------------------------------|
| `array`      | `list` | ✅        | The current array state.      |
| `from_index` | `int`  | ✅        | Index of element being moved. |
| `to_index`   | `int`  | ✅        | Target index for insertion.   |
| `line`       | `int`  | ❌        | Source line number override.  |

**Example**

```python
key = array[i]
j = i - 1
while j >= 0 and array[j] > key:
    viz.insert(array, j, j + 1)
    array[j + 1] = array[j]
    j -= 1
```

---

### `viz.mark(array, index, *, color=None, label=None, line=None)`

Marks a specific element in the array — useful for highlighting pivots, boundaries, or found elements.

**Parameters**

| Parameter | Type   | Required | Description                                                                   |
|-----------|--------|----------|-------------------------------------------------------------------------------|
| `array`   | `list` | ✅        | Current array state.                                                          |
| `index`   | `int`  | ✅        | Index of the element to mark.                                                 |
| `color`   | `str`  | ❌        | Highlight color hint: `"pivot"`, `"found"`, `"boundary"`. Default: `"pivot"`. |
| `label`   | `str`  | ❌        | Text label shown above the element.                                           |
| `line`    | `int`  | ❌        | Source line number override.                                                  |

**Example**

```python
pivot = array[high]
viz.mark(array, high, color="pivot", label="pivot")
```

---

### `viz.annotate(message, *, line=None)`

Records a text annotation — a message that appears in the animation panel at this step. Useful for explaining what phase the algorithm is in.

**Parameters**

| Parameter | Type  | Required | Description                  |
|-----------|-------|----------|------------------------------|
| `message` | `str` | ✅        | The message to display.      |
| `line`    | `int` | ❌        | Source line number override. |

**Example**

```python
viz.annotate("Starting pass 3 — sorted region growing")
```

---

### `viz.save(*, path="steps.json")`

Writes all recorded steps to disk. **Always call this at the end of your file.**

**Parameters**

| Parameter | Type  | Required | Default        | Description       |
|-----------|-------|----------|----------------|-------------------|
| `path`    | `str` | ❌        | `"steps.json"` | Output file path. |

**Example**

```python
bubble_sort(arr)
viz.save()                        # writes steps.json
viz.save(path="output/steps.json")  # custom path
```

---

### `viz.reset()`

Clears all recorded steps. Useful if you want to instrument only part of an algorithm or run multiple visualizations in one script.

**Example**

```python
viz.init(arr)
bubble_sort(arr)         # first algorithm
steps_1 = viz.steps[:]  # save steps
viz.reset()

viz.init(arr2)
merge_sort(arr2)         # second algorithm
viz.save()
```

---

## Configuration

You can configure `viz` globally at the top of your file:

```python
import viz

viz.config(
    speed=300,          # ms per step in the animation (default: 200)
    max_steps=5000,     # stop recording after N steps (default: 10000)
    auto_line=True,     # auto-detect source line numbers (default: True)
)
```

| Option      | Type   | Default | Description                                     |
|-------------|--------|---------|-------------------------------------------------|
| `speed`     | `int`  | `200`   | Default animation delay in ms                   |
| `max_steps` | `int`  | `10000` | Max steps before recording stops (safety limit) |
| `auto_line` | `bool` | `True`  | Auto-detect source line via `inspect` module    |

---

## Output Format

`viz.save()` writes a JSON array where each element is one step:

```json
[
  { "type": "init",    "array": [64, 34, 25], "line": 4 },
  { "type": "compare", "array": [64, 34, 25], "indices": [0, 1], "line": 9 },
  { "type": "swap",    "array": [34, 64, 25], "indices": [0, 1], "line": 11 },
  { "type": "annotate","message": "Pass 1 complete", "line": 13 }
]
```

See [`architecture.md`](./architecture.md#data-schemas) for the full TypeScript schema.

---

## Adding a New Algorithm

1. Create `python/your_algorithm.py`
2. Import `viz` and instrument with appropriate calls
3. Add a benchmark case in `benchmark.py`
4. Test: run the file and verify `steps.json` is written correctly

```python
# python/selection_sort.py
import viz

arr = [29, 10, 14, 37, 13]
viz.init(arr)

def selection_sort(array):
    n = len(array)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            viz.compare(array, min_idx, j)
            if array[j] < array[min_idx]:
                min_idx = j
        if min_idx != i:
            viz.swap(array, i, min_idx)

selection_sort(arr)
viz.save()
```

---

## Error Reference

| Error                           | Cause                                      | Fix                                                       |
|---------------------------------|--------------------------------------------|-----------------------------------------------------------|
| `VisualizerNotInitializedError` | Called `viz.compare()` before `viz.init()` | Always call `viz.init(arr)` first                         |
| `IndexOutOfBoundsError`         | `i` or `j` outside array bounds            | Check your loop bounds                                    |
| `MaxStepsExceeded`              | Algorithm exceeded `max_steps` limit       | Reduce input size or increase `viz.config(max_steps=...)` |
| `steps.json not written`        | `viz.save()` never called                  | Add `viz.save()` at the end of your file                  |