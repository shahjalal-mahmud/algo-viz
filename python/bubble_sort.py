"""
bubble_sort.py - Instrumented Bubble Sort Example
==================================================
This is the file the user opens in VS Code and triggers "Visualize Algorithm" on.

Key rules:
  1. Import viz (must be in the same folder)
  2. Call viz.init(arr) before sorting
  3. Replace every swap with viz.swap(arr, i, j)
  4. Add viz.compare(arr, i, j) before comparisons (optional but gives richer UI)
  5. Call viz.save() at the very end
"""

import viz

# ── Sample data ──────────────────────────────────────────────────────────────
arr = [64, 34, 25, 12, 22, 11, 90]

# Step 1: Tell the visualizer about the starting state
viz.init(arr)


# ── Bubble Sort ───────────────────────────────────────────────────────────────
def bubble_sort(array):
    n = len(array)

    for i in range(n):
        # After each full pass, the largest unsorted element bubbles to the end.
        # We can skip the last `i` elements because they're already in place.
        for j in range(0, n - i - 1):

            # Record the comparison so the UI can highlight these two bars
            viz.compare(array, j, j + 1)

            # If the left element is bigger, swap them
            if array[j] > array[j + 1]:
                viz.swap(array, j, j + 1)   # ← instrumented swap (not a bare swap)


bubble_sort(arr)

# Step last: flush all recorded steps to disk
viz.save()

print("Sorted array:", arr)