"""
auto_benchmark.py — AlgoViz Auto-Benchmarker (v5)
==================================================
Automatically finds the main algorithm function in ANY Python file
and benchmarks it across increasing input sizes.

NO instrumentation needed in the user's code.

Usage (called by extension.ts):
    python3 auto_benchmark.py /path/to/user_solution.py

Output:
    performance.json written next to the user's file.
"""

import json
import math
import random
import time
import sys
import os
import importlib.util
import inspect

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

TARGET_FILE = sys.argv[1] if len(sys.argv) > 1 else None
if not TARGET_FILE or not os.path.exists(TARGET_FILE):
    print(f"[auto_benchmark] ERROR: File not found: {TARGET_FILE}")
    sys.exit(1)

OUTPUT_PATH = os.path.join(os.path.dirname(TARGET_FILE), "performance.json")
INPUT_SIZES = [50, 100, 500, 1000, 2000, 5000]
REPEATS     = 5

# ---------------------------------------------------------------------------
# Suppress viz calls so instrumented files still load correctly
# ---------------------------------------------------------------------------

class _FakeViz:
    """Silently absorbs any viz.* call so instrumented files don't crash."""
    def __getattr__(self, _name):
        return lambda *args, **kwargs: None

import sys as _sys
_sys.modules.setdefault("viz", _FakeViz())

# ---------------------------------------------------------------------------
# Load the user's module
# ---------------------------------------------------------------------------

spec = importlib.util.spec_from_file_location("_user_module", TARGET_FILE)
mod  = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]

try:
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
except Exception as e:
    print(f"[auto_benchmark] Warning: module-level error (non-fatal): {e}")

# ---------------------------------------------------------------------------
# Find the best candidate function
# ---------------------------------------------------------------------------

ALGO_KEYWORDS = [
    "sort", "search", "find", "solve", "run", "compute",
    "bfs", "dfs", "dp", "max_", "min_", "count", "check",
    "is_", "can_", "num_", "length", "path", "sum", "merge",
    "quick", "binary", "bubble", "insert", "select", "heap",
    "twoSum", "maxProfit", "maxSubArray", "climbStairs",
    "longestCommonPrefix", "isValid", "numIslands",
]

def pick_function(module):
    """
    Score every non-private function defined in the module.
    Also inspects Solution class methods (LeetCode-style).
    Returns the best match, or None.
    """
    candidates = []

    # Top-level functions
    for name, obj in inspect.getmembers(module, inspect.isfunction):
        if not name.startswith("_"):
            mod_name = getattr(obj, "__module__", None)
            if mod_name in ("_user_module", None):
                candidates.append((name, obj))

    # Solution class methods (very common in LeetCode solutions)
    solution_cls = getattr(module, "Solution", None)
    if solution_cls and inspect.isclass(solution_cls):
        sol_instance = solution_cls()
        for name, obj in inspect.getmembers(solution_cls, predicate=inspect.isfunction):
            if not name.startswith("_"):
                # Wrap as bound method
                bound = getattr(sol_instance, name)
                candidates.append((name, bound))

    if not candidates:
        return None

    def score(name, fn):
        s = 0
        lname = name.lower()
        for kw in ALGO_KEYWORDS:
            if kw.lower() in lname:
                s += 10
        try:
            params = [
                p for p in inspect.signature(fn).parameters.values()
                if p.name not in ("self", "cls")
            ]
            if len(params) >= 1:
                s += 5
        except (ValueError, TypeError):
            pass
        return s

    scored = sorted(candidates, key=lambda x: score(x[0], x[1]), reverse=True)

    for name, fn in scored:
        try:
            params = [
                p for p in inspect.signature(fn).parameters.values()
                if p.name not in ("self", "cls")
            ]
            if len(params) >= 1:
                return fn
        except (ValueError, TypeError):
            continue
    return None


fn = pick_function(mod)

if fn is None:
    print("[auto_benchmark] No benchmarkable function found. Skipping.")
    sys.exit(0)

print(f"[auto_benchmark] Benchmarking: {fn.__name__}()")

# ---------------------------------------------------------------------------
# Input generator
# ---------------------------------------------------------------------------

def make_input(fn, n):
    """
    Inspect parameter names and type annotations to guess the right input.
    Covers the vast majority of LeetCode problem signatures.
    """
    try:
        params = [
            p for p in inspect.signature(fn).parameters.values()
            if p.name not in ("self", "cls")
        ]
    except (ValueError, TypeError):
        params = []

    args = []
    for p in params:
        name = p.name.lower()
        ann  = str(p.annotation).lower()

        if "str" in ann or name in ("s", "t", "word", "pattern", "text", "string"):
            args.append("".join(random.choices("abcdefghijklmnop", k=max(1, n // 10))))
        elif "list[list" in ann or name in ("matrix", "grid", "board", "graph"):
            side = max(1, int(math.sqrt(n)))
            args.append([[random.randint(0, 9) for _ in range(side)] for _ in range(side)])
        elif "int" in ann or name in ("n", "k", "m", "target", "num", "x", "val"):
            args.append(random.randint(1, n))
        else:
            args.append([random.randint(1, 10_000) for _ in range(n)])

    if not args:
        args.append([random.randint(1, 10_000) for _ in range(n)])

    return args

# ---------------------------------------------------------------------------
# Benchmark loop
# ---------------------------------------------------------------------------

import copy

results = []

for n in INPUT_SIZES:
    times = []

    for rep in range(REPEATS):
        args = make_input(fn, n)
        args = copy.deepcopy(args)

        try:
            t0 = time.perf_counter()
            fn(*args)
            elapsed = time.perf_counter() - t0
            times.append(elapsed)
        except Exception as e:
            print(f"[auto_benchmark] Warning: n={n} rep={rep} failed: {e}")
            times.append(float("nan"))

    valid = [t for t in times if not math.isnan(t)]
    avg   = sum(valid) / len(valid) if valid else 0.0

    log2n = math.log2(n) if n > 1 else 1.0

    row = {
        "n":           n,
        "time":        round(avg, 8),
        "n_norm":      round(avg / n,             12) if n > 0 else 0,
        "nlogn_norm":  round(avg / (n * log2n),   12) if n > 0 else 0,
        "n2_norm":     round(avg / (n * n),        12) if n > 0 else 0,
    }
    results.append(row)

    print(
        f"  n={n:>5} | avg={avg:.6f}s | "
        f"t/n={row['n_norm']:.2e} | "
        f"t/nlogn={row['nlogn_norm']:.2e} | "
        f"t/n²={row['n2_norm']:.2e}"
    )

# ---------------------------------------------------------------------------
# Write output
# ---------------------------------------------------------------------------

with open(OUTPUT_PATH, "w", encoding="utf-8") as fh:
    json.dump(results, fh, indent=2)

print(f"[auto_benchmark] Saved {len(results)} rows -> {OUTPUT_PATH}")