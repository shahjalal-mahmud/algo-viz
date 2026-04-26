"""
two_sum.py — LeetCode #1 Two Sum
=================================
Example of a plain LeetCode solution with NO instrumentation.
AlgoViz will auto-benchmark this and generate AI analysis.

Just open this file in VS Code and run "AlgoViz: Visualize Algorithm".
No viz.init / viz.swap calls needed!
"""


class Solution:
    def twoSum(self, nums: list, target: int) -> list:
        """
        Given an array of integers nums and an integer target,
        return indices of the two numbers such that they add up to target.

        Uses a hash map for O(n) time complexity.
        """
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []


# ── Quick local test ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    sol = Solution()
    print(sol.twoSum([2, 7, 11, 15], 9))   # [0, 1]
    print(sol.twoSum([3, 2, 4],      6))   # [1, 2]
    print(sol.twoSum([3, 3],         6))   # [0, 1]