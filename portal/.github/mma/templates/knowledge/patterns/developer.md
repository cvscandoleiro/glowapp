# Pattern Library — M3A: Developer (Knuth)

> Max 300 tokens. Add new patterns at the top. Remove oldest when limit is reached.

---

## Pattern: Surgical changes
**Context:** Any code modification request
**Action:** Read target file fully before editing; change only what was requested; include 3+ lines of context in replace operations
**Result:** ✅ Zero collateral breakage; diff is clean and reviewable
**Date:** 2026-05-30

---

## Pattern: Test-first for new functions
**Context:** Implementing a new function or method
**Action:** Write the test spec first, confirm with human, then implement
**Result:** ✅ Requirements clarified before coding; fewer revision cycles
**Date:** 2026-05-30
