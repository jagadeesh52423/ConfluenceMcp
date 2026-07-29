# Code Review — Bitbucket resolve/unresolve PR comment fix

**Reviewer:** reviewer-bb
**Scope:** `src/services/bitbucket.ts` — `resolvePRComment`, `unresolvePRComment`
**Diff:** 1 file changed, +13 / -8 (only the two target methods)
**Verdict: APPROVED**

---

## Stage 1 — Spec compliance (PASS)

| Check | Result |
|-------|--------|
| Uses dedicated `/comments/{id}/resolve` sub-resource (not generic PUT w/ resolution body) | PASS — `resolve` = POST, `unresolve` = DELETE |
| `resolvePRComment` POST body is `{}` (not undefined) | PASS |
| `unresolvePRComment` DELETE sent with no body | PASS |
| Re-fetches via GET and returns `mapComment(getResponse.data)` for BOTH methods | PASS |
| Method signatures unchanged (`(repoName, prId, commentId): Promise<BitbucketPRComment>`) | PASS |
| No unrelated changes | PASS — diff confined to the two methods |
| Build passes (`tsc`) | PASS — clean, no errors |

The previous implementation incorrectly used `PUT /comments/{id}` with a `{ resolution: ... }`
body, which is not a valid Bitbucket Cloud operation for (un)resolving. The fix correctly targets
the `resolve` sub-resource. Because POST/DELETE on that sub-resource do not return the comment
object, the follow-up GET + `mapComment` is the correct way to return a populated comment.

## Stage 2 — Quality (PASS)

No GitHub PR exists (local working-tree diff against a Bitbucket-oriented repo), so the
/code-review:code-review dimensions were applied directly with opus-level rigor rather than
spawning agents/`gh` against a nonexistent PR.

- **axios usage:** `post(url, {})` (empty object, not undefined), `delete(url)` (no body),
  `get(url)` — all correct and consistent with the axios client API.
- **Endpoint path convention:** relative paths `/repositories/${this.workspace}/${repoName}/...`
  match every sibling (`getPRComments`, `addPRComment`, `updatePRComment`, `deletePRComment`).
  No host prefix, no double slashes.
- **Error-handling consistency:** siblings do not wrap calls in try/catch — errors propagate to
  the `index.ts` structured-error layer. New code matches this; no divergent handling introduced.
- **`delete` w/ no body:** correct — mirrors existing `deletePRComment`.
- **Return contract:** `Promise<BitbucketPRComment>` preserved; `mapComment` applied in both paths.

### Non-blocking observation (pre-existing, out of scope)

`BitbucketService.mapComment` (line 84) and the `BitbucketPRComment` interface
(`src/types.ts:122-134`) do not carry a resolution/resolved field — `resolutionStatus` at
`src/types.ts:110` belongs to the Confluence comment interface, not the Bitbucket one. So the
returned comment object does not programmatically reflect the new resolved/reopened state. This is
**pre-existing** (the prior PUT implementation had the same limitation) and was not part of this
fix's spec. If callers later need to confirm state from the return value, a future enhancement
could add a `resolved`/`resolutionStatus` field to `BitbucketPRComment` and populate it in
`mapComment`. Not a regression and not blocking.

## Conclusion

Spec-compliant, build-clean, consistent with surrounding conventions, no introduced bugs.
**APPROVED.**

---

## Follow-on (task #4) — expose resolution state in mapComment (APPROVED)

`mapComment` (src/services/bitbucket.ts ~90) now maps Bitbucket's comment `resolution` object:

- `resolved: !!c.resolution` — correct boolean coercion (present-when-resolved, absent otherwise).
- `resolvedOn: c.resolution?.created_on` — matches the `created_on` on the resolution object.
- `resolvedBy: c.resolution?.user?.display_name` — matches `resolution.user.display_name`, and is
  consistent with how `author` is derived from `c.user?.display_name`.

Matching optional fields added to `BitbucketPRComment` (src/types.ts:134-137:
`resolved?`, `resolvedOn?`, `resolvedBy?`). Optional chaining cleanly yields `undefined` for
unresolved comments. Style consistent with existing mapComment; build clean. This resolves the
non-blocking observation noted above. **APPROVED.**
