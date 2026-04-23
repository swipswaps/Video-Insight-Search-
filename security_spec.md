# Security Specification - Verbatim Analytic Suite (v2.9)

## 1. DATA_INVARIANTS
*The core laws of the analytic database. These must never be broken by any client-side operation.*

- **Identity Sync**: A **Project** must always have a valid `ownerId` that matches the creator's `request.auth.uid`.
- **Integrity**: A **Project** `videoId` must be a valid YouTube ID (11 chars typically).
- **Relational Consistency**: **Transcripts** must be an array of objects with `start` (number) and `text` (string).
- **Isolation**: Users are strictly forbidden from accessing, listing, or modifying projects where `ownerId != request.auth.uid`.

## 2. THE_DIRTY_DOZEN (ABAC Penetration Payloads)
*These payloads are used during 'Red Team' auditing to verify that our Master-Gate rules are bypass-proof.*

1.  **Identity Spoofing**: Attempting to create a project with `ownerId: "victim_user_id"`.
2.  **Resource Poisoning**: Injecting a 2MB string into a `text` field to trigger "Denial of Wallet".
3.  **Ghost Keys**: Adding unauthorized fields like `isAdmin: true` to a project document.
4.  **Orphaned Writes**: Creating a transcript segment with a missing `start` time.
5.  **PII Drain**: Authenticated User A attempting to `get` the profile at `/users/UserB`.
6.  **Query Scraping**: User A attempting to `list` projects without an ownership filter.
7.  **Privilege Escalation**: Attempting to change the `ownerId` of an existing project.
8.  **ID Poisoning**: Using a 1KB junk-character string as a `projectId`.
9.  **Temporal Paradox**: Setting a negative `start` time (e.g. -50s) in a segment.
10. **Type Confusion**: Sending `duration: "00:45"` (string) where a float is required.
11. **Shadow Update**: Attempting to modify the immutable `videoId` of an existing metadata node.
12. **Anonymous Breach**: Attempting ANY write operation without a valid `auth` token.

## 3. Test Runner (Draft)
```ts
// firestore.rules.test.ts (Pseudo-code for the logic runner)
describe("Verbatim Analytics Security", () => {
  it("rejects identity spoofing", async () => {
    const maliciousPayload = { videoId: "xyz", ownerId: "victim_id" };
    await assertFails(db.collection("projects").add(maliciousPayload));
  });
  // ... rest of the dozen
});
```
