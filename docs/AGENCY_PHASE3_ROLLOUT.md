# VOIDTECH SOLUTION 2.0 — Phase 3 deployment checklist

Phase 3 adds a protected admin workflow:
- `/admin/proposals` — create enquiry-linked quotations with integer INR line items, server-recomputed totals, a manual sent/accepted/rejected lifecycle, and **Print / Save as PDF**.
- `/admin/projects` — create a project exactly once from each accepted proposal and track its five delivery milestones, private notes, deadline and status.
- Existing CRM enquiries, contact forms, Quick Quote, Cloudflare Web Analytics and WhatsApp remain unchanged.

## Release dependency: database migration

**DO NOT merge to production until this migration is applied to the production Neon database or the release workflow is configured to apply it before deployment.** A GitHub CI success means the migration passed only on CI's isolated PostgreSQL instance. It does not migrate your production Neon database.

Migration: `prisma/migrations/20261120000000_agency_proposals_projects/migration.sql`

1. Confirm a recent recoverable Neon backup/branch/snapshot and maintenance plan.
2. In a trusted environment with `DATABASE_URL` and `DIRECT_URL` configured **privately**, run:
   ```bash
   npm ci
   npx prisma migrate status
   npx prisma migrate deploy
   npx prisma migrate status
   ```
3. Confirm new tables exist: `agency_proposals`, `agency_proposal_items`, `agency_projects`, `agency_project_milestones`.
4. Merge the PR only after CI succeeds and production migration is confirmed. Deploy to Cloudflare Workers through the existing main-branch build integration.
5. Authenticate to `/admin/proposals` as SUPER_ADMIN or ADMIN. Create a quotation from a test enquiry, print to PDF, mark sent, manually confirm acceptance, convert to project, and toggle a milestone. Verify logs and permissions.
6. Do not use personal client records for smoke testing; use a consented test enquiry and remove it appropriately.

## Guarantees and limits

- Editing or deleting existing enquiry records after a proposal is created is restricted by relational foreign keys to protect quotation history.
- Unique `agency_projects.proposalId` prevents duplicate projects after repeated or concurrent conversion attempts.
- Amounts are whole INR, not floating-point currency, and discounts cannot exceed the quoted subtotal. Taxes are not calculated: confirm tax treatment externally.
- Proposal `SENT` and `ACCEPTED` statuses are **manual admin attestations**, not proof of client email delivery or legally binding electronic signature.
- PDFs use browser-native Print / Save as PDF; there is no server-side downloadable PDF attachment or automatic email.
- Admin actions validate same-origin requests, active PostgreSQL-backed sessions and role permissions. Audit events record important changes.
- This phase does not take payments, send contracts, or expose a client portal. Those require separate payment/legal workflows.

## Rollback

Revert the application deployment to the prior Worker version if application issues occur. Do **not** automatically drop the new tables or delete production data; data rollback requires a deliberate, backed-up database recovery process.
