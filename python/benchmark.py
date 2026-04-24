"""
benchmark.py - Bubble Sort Performance Benchmarker (v2)
=======================================================
Runs bubble sort on arrays of increasing sizes, averages REPEATS runs,
and writes both raw timings and three normalized ratios to performance.json.

The normalized ratios let the WebView determine complexity empirically:
  - time / n          → constant if O(n)
  - time / (n log2 n) → constant if O(n log n)
  - time / n²         → constant if O(n²)

Run automatically by the VS Code extension, or manually:
    python benchmark.py
"""

import json
import math
import random
import time
import os

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

INPUT_SIZES = [100, 500, 1000, 2000, 4000]
REPEATS     = 5                                    # averaged to reduce noise
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "performance.json")


# ---------------------------------------------------------------------------
# Pure bubble sort (no viz instrumentation — measures real speed)
# ---------------------------------------------------------------------------

def bubble_sort_plain(arr: list) -> None:
    """In-place bubble sort with zero overhead — used only for timing."""
    n = len(arr)
    for i in range(n):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]


# ---------------------------------------------------------------------------
# Timing helper
# ---------------------------------------------------------------------------

def measure_avg_time(n: int) -> float:
    """
    Run bubble sort on n fresh random integers REPEATS times.
    Returns the mean elapsed time in seconds.

    A fresh array is generated for every repeat so we always measure
    average-case behaviour (not a lucky already-sorted input).
    """
    total = 0.0
    for _ in range(REPEATS):
        data = [random.randint(1, 10_000) for _ in range(n)]
        t0   = time.perf_counter()
        bubble_sort_plain(data)
        total += time.perf_counter() - t0
    return total / REPEATS


# ---------------------------------------------------------------------------
# Normalized ratio helpers
# ---------------------------------------------------------------------------

def normalize(time_s: float, n: int) -> dict:
    """
    Compute time divided by each complexity class's growth function.

    If the algorithm is truly O(f(n)), dividing by f(n) should yield a
    value that is roughly constant across all input sizes — the constant
    factor C in T(n) ≈ C · f(n).

    Returns a dict with three keys so the caller can unpack cleanly.
    """
    return {
        "n_norm":    time_s / n,                          # O(n)       baseline
        "nlogn_norm": time_s / (n * math.log2(n)),        # O(n log n) baseline
        "n2_norm":   time_s / (n * n),                    # O(n²)      baseline
    }


# ---------------------------------------------------------------------------
# Main benchmark runner
# ---------------------------------------------------------------------------

def run_benchmark() -> list:
    results = []
    print("[benchmark] Starting — sizes:", INPUT_SIZES, f"| repeats: {REPEATS}")

    for n in INPUT_SIZES:
        avg_time = measure_avg_time(n)
        norms    = normalize(avg_time, n)

        row = {
            "n":          n,
            "time":       round(avg_time,          8),
            "n_norm":     round(norms["n_norm"],    12),
            "nlogn_norm": round(norms["nlogn_norm"],12),
            "n2_norm":    round(norms["n2_norm"],   12),
        }
        results.append(row)

        # Human-readable console output for debugging
        print(
            f"  n={n:>5} | "
            f"time={avg_time:.6f}s | "
            f"t/n={norms['n_norm']:.2e} | "
            f"t/nlogn={norms['nlogn_norm']:.2e} | "
            f"t/n²={norms['n2_norm']:.2e}"
        )

    with open(OUTPUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=2)

    print(f"[benchmark] Saved {len(results)} rows -> {OUTPUT_PATH}")
    return results


if __name__ == "__main__":
    run_benchmark()