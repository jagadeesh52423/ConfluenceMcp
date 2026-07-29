# TEST REPORT: bitbucket_resolve_pr_comment / bitbucket_unresolve_pr_comment Fix

**Date:** 2026-06-09  
**Tester agent:** tester2-bb

---

## Summary

### Round 1 — Comment 808054758 (reply comment — partial)

| # | Step | Result |
|---|------|--------|
| 1 | `bitbucket_resolve_pr_comment` (comment 808054758) | ⚠️ PARTIAL PASS — fix confirmed; blocked by Bitbucket business rule (reply comment) |
| 2 | `bitbucket_get_pr_comments` → confirm `resolved=true` | ❌ SKIPPED (Step 1 blocked) |
| 3 | `bitbucket_unresolve_pr_comment` (comment 808054758) | ❌ SKIPPED |
| 4 | `bitbucket_get_pr_comments` → confirm `resolved=false` (restored) | ✅ PASS (original state confirmed `resolved=false`) |

### Round 2 — Comment 808584118 (top-level comment — full cycle) ✅ ALL PASS

| # | Step | Result |
|---|------|--------|
| 1 | `bitbucket_resolve_pr_comment` (comment 808584118) | ✅ PASS — `resolved=true`, `resolvedOn` + `resolvedBy` populated |
| 2 | `bitbucket_get_pr_comments` → confirm `resolved=true` | ✅ PASS |
| 3 | `bitbucket_unresolve_pr_comment` (comment 808584118) | ✅ PASS — `resolved=false` |
| 4 | `bitbucket_get_pr_comments` → confirm `resolved=false` (state restored) | ✅ PASS |

**`resolved` field surfacing in mapComment:** ✅ CONFIRMED WORKING  
**`resolvedOn` / `resolvedBy` on single-comment response:** ✅ CONFIRMED POPULATED  
**Old broken error eliminated:** ✅ CONFIRMED  

**🟢 OVERALL VERDICT: ALL FIXES VERIFIED. Full resolve → unresolve cycle works correctly end-to-end.**

---

## Step-by-Step Detail

### Step 1 — `bitbucket_resolve_pr_comment`

**Call:**
```json
{ "repoName": "marketplace-core", "prId": 178, "commentId": 808054758 }
```

**Raw response:**
```json
{
  "type": "error",
  "error": {
    "message": "Comment is not a top-level comment"
  }
}
```

**Analysis:**
- ✅ The OLD broken error (`"resolution: extra keys not allowed"` / `"content: required key not provided"`) is **completely gone**. This proves the fix (POST to `.../comments/{id}/resolve` instead of PUT with `resolution` body) is correct and reaching the Bitbucket API.
- ⚠️ New error: Bitbucket's API restricts `.../resolve` to **top-level comments only**. Comment 808054758 is a **reply** to top-level comment 808050226 (`"move this to flyway"` by Raju Chinthala), so Bitbucket rejects it at the business logic layer.
- This is **not a bug in our implementation** — it is a legitimate Bitbucket API constraint.

---

### Step 2 — `bitbucket_get_pr_comments` (verify resolved=true)

**Skipped** — Step 1 did not complete a resolve (Bitbucket rejected it). Nothing to verify.

---

### Step 3 — `bitbucket_unresolve_pr_comment`

**Skipped** — No resolve was applied. Comment remains `resolved=false` (original state).

---

### Step 4 — `bitbucket_get_pr_comments` (confirm restored)

**Call:**
```json
{ "repoName": "marketplace-core", "prId": 178 }
```

**Relevant comment 808054758 in response:**
```json
{
  "id": 808054758,
  "content": "Done — removed this ad-hoc seed (commit `2bf99c9`) and moved it to the `dbmigrationscripts` repo...",
  "author": "Jagadeesh Pulamarasetti",
  "resolved": false
}
```

✅ Comment is `resolved: false` — original state confirmed intact (not modified by our test).

---

## `resolved` Field Surfacing (mapComment fix)

`bitbucket_get_pr_comments` response confirmed:

| Comment ID | `resolved` value | Expected |
|-----------|-----------------|----------|
| 808050226 ("move this to flyway") | `true` | ✅ correct |
| 808052879 ("rename file to prefr…") | `true` | ✅ correct |
| 808054758 (target comment) | `false` | ✅ correct |
| All other comments | `false` | ✅ correct |

`resolvedOn` and `resolvedBy` fields: **not populated** in the PR comments list response (Bitbucket likely omits these on bulk list; single-comment endpoint may surface them).

---

## Round 1 Detail — Comment 808054758

Comment `808054758` is a **reply** to comment `808050226` (Raju's "move this to flyway"). Bitbucket's API only allows resolving **top-level** comments. The error `"Comment is not a top-level comment"` is a Bitbucket business rule — not a bug in the implementation. The critical finding was that the OLD error (`"resolution: extra keys not allowed"`) was completely gone, confirming the HTTP method/payload fix is correct.

---

## Round 2 Detail — Comment 808584118 (Full Cycle)

**Target:** `"why async way ?"` by Raju Chinthala — top-level inline comment, `resolved=false` at start.

### Step 1 — `bitbucket_resolve_pr_comment`

**Call:**
```json
{ "repoName": "marketplace-core", "prId": 178, "commentId": 808584118 }
```

**Raw response:**
```json
{
  "id": 808584118,
  "content": "why async way ?",
  "author": "Raju Chinthala",
  "authorAccountId": "5aa61b79460f54375e34fe3c",
  "created": "2026-06-09T11:50:49.417663+00:00",
  "updated": "2026-06-09T16:57:16.825808+00:00",
  "inline": { "path": "...ReferralServiceImpl.java", "from": null, "to": 95 },
  "resolved": true,
  "resolvedOn": "2026-06-09T16:57:16.825808+00:00",
  "resolvedBy": "Jagadeesh Pulamarasetti"
}
```

✅ **PASS** — no error, `resolved=true`, `resolvedOn` and `resolvedBy` both populated on the single-comment response.

### Step 2 — `bitbucket_get_pr_comments` (verify resolved=true)

Comment 808584118 in bulk response: `"resolved": true` ✅  
(Note: `resolvedOn`/`resolvedBy` not included in bulk list response — only on single-comment endpoint response.)

### Step 3 — `bitbucket_unresolve_pr_comment`

**Call:**
```json
{ "repoName": "marketplace-core", "prId": 178, "commentId": 808584118 }
```

**Raw response:**
```json
{
  "id": 808584118,
  "content": "why async way ?",
  "author": "Raju Chinthala",
  "authorAccountId": "5aa61b79460f54375e34fe3c",
  "created": "2026-06-09T11:50:49.417663+00:00",
  "updated": "2026-06-09T16:57:30.699531+00:00",
  "inline": { "path": "...ReferralServiceImpl.java", "from": null, "to": 95 },
  "resolved": false
}
```

✅ **PASS** — no error, `resolved=false`.

### Step 4 — `bitbucket_get_pr_comments` (confirm state restored)

Comment 808584118 in bulk response: `"resolved": false` ✅  
Original state fully restored.

---

## What Was Fixed (all confirmed)

| Fix | Evidence |
|-----|----------|
| `bitbucket_resolve_pr_comment` → POST to `.../comments/{id}/resolve` | ✅ Works end-to-end; old "extra keys not allowed" error gone |
| `bitbucket_unresolve_pr_comment` → DELETE `.../comments/{id}/resolve` | ✅ Works end-to-end |
| `mapComment` surfaces `resolved` field | ✅ Correct in both `get_pr_comments` and single-comment responses |
| `mapComment` surfaces `resolvedOn` / `resolvedBy` | ✅ Populated on resolve response (absent from bulk list, as expected) |

---

## Context Health

- Context usage: moderate (~40% estimated). No issues.
- All 4 MCP tool calls in Round 2 responded correctly with no errors or timeouts.
- Comment 808584118 restored to `resolved=false` (original state).
