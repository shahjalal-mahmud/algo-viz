"""
viz.py - Algorithm Visualizer Instrumentation Module
=====================================================
This module records algorithm execution steps and saves them to a JSON file.
The VS Code extension reads this file to drive the WebView animation.

Usage in your algorithm file:
    import viz
    viz.init(array)          # Call once at the start with your initial array
    viz.swap(arr, i, j)      # Call instead of a normal swap
    viz.compare(arr, i, j)   # Call when comparing two elements
    viz.save()               # Call once at the end to write steps.json
"""

import json
import inspect
import os

# Internal state: list of recorded steps and initial snapshot
_steps = []
_initialized = False

# Output path — written next to this file by default
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "steps.json")


def init(array: list) -> None:
    """
    Initialize the visualizer with the starting state of the array.
    Must be called BEFORE any swap/compare calls.

    Args:
        array: The array you are about to sort (will be deep-copied as step 0)
    """
    global _steps, _initialized
    _steps = []
    _initialized = True

    # Step 0: record the initial state so the UI can render the starting frame
    _steps.append({
        "type": "init",
        "array": list(array),   # snapshot — not a reference
        "i": -1,
        "j": -1,
        "line": _caller_line()
    })


def swap(array: list, i: int, j: int) -> None:
    """
    Swap array[i] and array[j] AND record the step.
    Replace every direct swap in your algorithm with this call.

    Args:
        array: The array being sorted (mutated in-place)
        i: Index of the first element
        j: Index of the second element
    """
    _require_init()

    # Perform the actual swap so the algorithm state stays correct
    array[i], array[j] = array[j], array[i]

    # Record state AFTER the swap so the UI shows the result
    _steps.append({
        "type": "swap",
        "array": list(array),   # snapshot of current state
        "i": i,
        "j": j,
        "line": _caller_line()
    })


def compare(array: list, i: int, j: int) -> None:
    """
    Record a comparison step (no mutation — just for highlighting).
    Call this when you evaluate arr[i] vs arr[j] in a conditional.

    Args:
        array: The array being sorted
        i: Index of the first element being compared
        j: Index of the second element being compared
    """
    _require_init()

    _steps.append({
        "type": "compare",
        "array": list(array),   # snapshot
        "i": i,
        "j": j,
        "line": _caller_line()
    })


def save(path: str = None) -> None:
    """
    Write all recorded steps to a JSON file.
    Must be called AFTER the algorithm completes.

    Args:
        path: Optional custom output path. Defaults to steps.json next to viz.py.
    """
    _require_init()
    output = path or OUTPUT_PATH

    with open(output, "w") as f:
        json.dump(_steps, f, indent=2)

    print(f"[viz] Saved {len(_steps)} steps -> {output}")


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _require_init():
    """Raise a clear error if viz.init() was never called."""
    if not _initialized:
        raise RuntimeError(
            "[viz] You must call viz.init(array) before using swap/compare/save."
        )


def _caller_line() -> int:
    """
    Walk up the call stack to find the line number in the USER's algorithm file
    (not inside viz.py itself). This is what gets highlighted in the UI.
    """
    frame = inspect.currentframe()
    try:
        # Go up: _caller_line → swap/compare/init → user's algorithm file
        caller = frame.f_back.f_back
        return caller.f_lineno
    finally:
        del frame  # avoid reference cycles (Python docs recommend this)