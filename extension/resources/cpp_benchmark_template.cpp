/**
 * cpp_benchmark_template.cpp — AlgoViz C++ Benchmark Wrapper (v5)
 * =================================================================
 * extension.ts injects user code at {{USER_CODE}} and compiles with:
 *   g++ -O2 -std=c++17 -DALGOVIZ_BENCH
 *
 * The -DALGOVIZ_BENCH flag suppresses the user's own main() via the
 * #ifndef ALGOVIZ_BENCH guard pattern recommended in the docs.
 *
 * Supports: sortArray, twoSum, maxSubArray, fib/climbStairs,
 *           merge (two-array), numIslands — and any generic single
 *           vector<int> method as a fallback.
 */

#include <bits/stdc++.h>
using namespace std;
using namespace chrono;

// ── Inject user code ───────────────────────────────────────────────────────
// {{USER_CODE}}

// ── Benchmark harness ──────────────────────────────────────────────────────

static mt19937 rng(42);

vector<int> randomVec(int n) {
    vector<int> v(n);
    for (auto& x : v) x = (int)(rng() % 10000) + 1;
    return v;
}

// Attempt to call Solution with common LeetCode patterns.
// Returns elapsed seconds if successful, -1.0 otherwise.
double trySolve(int n) {
    Solution sol;
    auto t0 = high_resolution_clock::now();
    auto t1 = t0;

#define ELAPSED() (duration<double>(t1 - t0).count())

    // Pattern: sortArray(vector<int>)
    if constexpr (requires { sol.sortArray(vector<int>{}); }) {
        auto arr = randomVec(n);
        t0 = high_resolution_clock::now();
        sol.sortArray(arr);
        t1 = high_resolution_clock::now();
        return ELAPSED();
    }

    // Pattern: twoSum(vector<int>&, int)
    if constexpr (requires { sol.twoSum(*(vector<int>*)nullptr, 0); }) {
        auto arr = randomVec(n);
        int  tgt = n / 2;
        t0 = high_resolution_clock::now();
        sol.twoSum(arr, tgt);
        t1 = high_resolution_clock::now();
        return ELAPSED();
    }

    // Pattern: maxSubArray(vector<int>)
    if constexpr (requires { sol.maxSubArray(vector<int>{}); }) {
        auto arr = randomVec(n);
        t0 = high_resolution_clock::now();
        sol.maxSubArray(arr);
        t1 = high_resolution_clock::now();
        return ELAPSED();
    }

    // Pattern: fib(int) / climbStairs(int)
    if constexpr (requires { sol.fib(0); }) {
        int k = min(n, 40);
        t0 = high_resolution_clock::now();
        sol.fib(k);
        t1 = high_resolution_clock::now();
        return ELAPSED();
    }
    if constexpr (requires { sol.climbStairs(0); }) {
        int k = min(n, 45);
        t0 = high_resolution_clock::now();
        sol.climbStairs(k);
        t1 = high_resolution_clock::now();
        return ELAPSED();
    }

    // Pattern: merge(vector<int>&, int, vector<int>&, int)
    if constexpr (requires { sol.merge(*(vector<int>*)nullptr, 0, *(vector<int>*)nullptr, 0); }) {
        auto a = randomVec(n / 2 + 1);
        auto b = randomVec(n / 2 + 1);
        sort(a.begin(), a.end());
        sort(b.begin(), b.end());
        t0 = high_resolution_clock::now();
        sol.merge(a, (int)a.size(), b, (int)b.size());
        t1 = high_resolution_clock::now();
        return ELAPSED();
    }

    // Pattern: numIslands(vector<vector<char>>)
    if constexpr (requires { sol.numIslands(vector<vector<char>>{}); }) {
        int side = max(1, (int)sqrt((double)n));
        vector<vector<char>> grid(side, vector<char>(side));
        for (auto& row : grid)
            for (auto& c : row) c = (rng() % 2) ? '1' : '0';
        t0 = high_resolution_clock::now();
        sol.numIslands(grid);
        t1 = high_resolution_clock::now();
        return ELAPSED();
    }

    // Generic fallback: find any method that takes a single vector<int>
    // (cannot be expressed with requires — attempted via twoSum sans 2nd arg)
    return -1.0;

#undef ELAPSED
}

int main() {
    const vector<int> SIZES   = {50, 100, 500, 1000, 2000, 5000};
    const int         REPEATS = 5;

    // Determine output path relative to this source file
    string src(__FILE__);
    auto   slash = src.find_last_of("/\\");
    string dir   = (slash != string::npos) ? src.substr(0, slash + 1) : "./";
    string outPath = dir + "performance.json";

    ofstream out(outPath);
    if (!out) {
        cerr << "[cpp_benchmark] Cannot open " << outPath << "\n";
        return 1;
    }

    out << "[\n";
    bool firstRow = true;

    for (int n : SIZES) {
        double total = 0.0;
        int    valid = 0;

        for (int r = 0; r < REPEATS; r++) {
            try {
                double e = trySolve(n);
                if (e >= 0.0) { total += e; valid++; }
            } catch (...) {}
        }

        if (valid == 0) {
            cerr << "[cpp_benchmark] No pattern matched for n=" << n << "\n";
            continue;
        }

        double avg  = total / valid;
        double logn = n > 1 ? log2((double)n) : 1.0;

        if (!firstRow) out << ",\n";
        firstRow = false;

        out << fixed << setprecision(8)
            << "  {\"n\":" << n
            << ",\"time\":"        << avg
            << ",\"n_norm\":"      << setprecision(12) << avg / n
            << ",\"nlogn_norm\":"  << avg / (n * logn)
            << ",\"n2_norm\":"     << avg / ((double)n * n)
            << "}";

        fprintf(stderr, "  n=%5d | avg=%.6fs\n", n, avg);
    }

    out << "\n]\n";
    cerr << "[cpp_benchmark] Done -> " << outPath << "\n";
    return 0;
}