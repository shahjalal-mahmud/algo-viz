"""
benchmark.py - Bubble Sort Performance Benchmarker
===================================================
Runs bubble sort on arrays of increasing sizes and measures execution time.
Writes results to performance.json in the same folder.

Run automatically by the VS Code extension after bubble_sort.py,
or manually: python benchmark.py
"""

import json
import time
import random
import os

# Output path — sits next to this file (in python/)
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "performance.json")

# Input sizes to test. Keep reasonable — bubble sort is O(n²) so 2000+ gets slow.
INPUT_SIZES = [10, 50, 100, 250, 500, 750, 1000]

# How many times to repeat each size and take the average.
# Averaging removes timing noise from OS scheduling.
REPEATS = 3


def bubble_sort_plain(array):
    """
    Plain bubble sort with NO viz instrumentation — pure speed, no overhead.
    We measure THIS version, not the instrumented one in bubble_sort.py.
    """
    n = len(array)
    arr = list(array)   # work on a copy so we don't mutate the original
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr


def measure_one(n):
    """
    Run bubble sort on a random array of size n, REPEATS times.
    Returns the average elapsed time in seconds.
    """
    total = 0.0
    for _ in range(REPEATS):
        # Fresh random array each repeat so we always get worst/average case
        data = [random.randint(1, 1000) for _ in range(n)]
        start = time.perf_counter()
        bubble_sort_plain(data)
        end = time.perf_counter()
        total += (end - start)
    return total / REPEATS


def run_benchmark():
    results = []
    print("[benchmark] Starting performance measurement...")

    for n in INPUT_SIZES:
        avg_time = measure_one(n)
        results.append({
            "n": n,
            "time": round(avg_time, 6)   # 6 decimal places (microsecond precision)
        })
        print(f"  n={n:>5}  ->  {avg_time:.6f}s")

    # Write to performance.json
    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2)

    print(f"[benchmark] Saved {len(results)} data points -> {OUTPUT_PATH}")
    return results


if __name__ == "__main__":
    run_benchmark()