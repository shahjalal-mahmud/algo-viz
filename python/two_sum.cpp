/**
 * two_sum.cpp — LeetCode #1 Two Sum (C++ version)
 * =================================================
 * Example C++ solution. Open in VS Code and run "AlgoViz: Visualize Algorithm".
 * AlgoViz will compile this, benchmark it, and generate AI analysis.
 *
 * IMPORTANT: Do NOT define main() in files you want to visualize.
 *            The extension injects its own benchmark main() at compile time.
 *            Use the #ifndef guard below if you need a local test main().
 */

#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    /**
     * Given a vector of integers and a target, return indices of
     * the two numbers that sum to target.
     * Uses a hash map — O(n) time, O(n) space.
     */
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.count(complement)) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};

// ── Local test main — guarded so the benchmark wrapper can inject its own ──
#ifndef ALGOVIZ_BENCH
int main() {
    Solution sol;
    vector<int> nums1 = {2, 7, 11, 15};
    auto r1 = sol.twoSum(nums1, 9);
    cout << "[" << r1[0] << ", " << r1[1] << "]\n";  // [0, 1]

    vector<int> nums2 = {3, 2, 4};
    auto r2 = sol.twoSum(nums2, 6);
    cout << "[" << r2[0] << ", " << r2[1] << "]\n";  // [1, 2]
    return 0;
}
#endif