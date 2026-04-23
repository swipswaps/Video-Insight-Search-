# Security Specification - Verbatim Analytic Suite

## 1. Data Invariants
- A **Project** must always have a valid `ownerId` that matches the creator's `request.auth.uid`.
- A **Project** `videoId` must be a valid YouTube ID (11 chars typically, but we'll allow standard ID regex).
- **Transcripts** must be an array of objects with `start` (number) and `text` (string).
- Users can only access their own projects.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)

1. **Identity Spoofing**: Creating a project with `ownerId: "someone_else"`.
2. **Resource Poisoning**: Injecting a 2MB string into a `text` field.
3. **Ghost Fields**: Adding `isAdmin: true` to a project document.
4. **Orphaned Writes**: Creating a transcript segment without a `start` time.
5. **PII Leak**: Authenticated user trying to read `/users/another_user_id`.
6. **Cross-Project Drain**: User A trying to `list` projects where `ownerId != UserA`.
7. **Implicit Admin**: Trying to update a project once it's marked "locked" or "stable" by changing its `ownerId`.
8. **Malicious ID**: Using a 1KB string as a `projectId`.
9. **Negative Time**: Setting `start: -50` in a transcript segment.
10. **Type Confusion**: Sending `duration: "41:00"` (string) instead of a number.
11. **Shadow Update**: Updating `videoId` of an existing project.
12. **Anonymous Write**: Attempting to create a project without being logged in.

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
