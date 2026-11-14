# NEON_DEVELOPMENT_BRANCH_PLAN.md — Neon Development Branch Provisioning Plan
## VOIDTECH SOLUTION — Dedicated Development Branch Setup

**Project:** VOIDTECH SOLUTION  
**Repository:** `https://github.com/void-tech-shiv/Voidtechsolution.git`  
**Branch:** `session/phase-7-admin-auth`  
**Date:** 2026-11-15  
**Current Neon Project ID:** `cool-term-97592889`  
**Current Primary/Protected Branch:** `br-little-bird-bejretq1`  
**Current Primary Endpoint:** `ep-little-credit-beuthfde`  
**Status:** **PLAN STAGED FOR OWNER EXECUTION VIA NEON CONSOLE**  

---

## 1. Executive Summary & Objective

The primary Neon branch (`br-little-bird-bejretq1`) hosts active baseline records (admin credentials, session history, pricing tiers, services catalog, and initial lead intake records). In accordance with the strict zero-production-risk boundary, schema migrations must **never** be executed directly against the primary branch without validation on a dedicated development branch.

Neon provides native, instantaneous copy-on-write branching. Creating a dedicated `development` branch off `br-little-bird-bejretq1` provides:
1. An isolated compute endpoint (`ep-...`) and storage snapshot.
2. Complete data preservation: all 12 existing tables and rows are inherited instantly.
3. 100% blast-radius containment: migrations, tests, and schema changes applied to the development branch cannot affect the primary branch.

---

## 2. Neon Project & Branch State Inspection

| Parameter | Primary Branch State | Dedicated Dev Branch State |
|---|---|---|
| **Project ID** | `cool-term-97592889` | `cool-term-97592889` (Same project) |
| **Branch ID** | `br-little-bird-bejretq1` | To be provisioned (`development`) |
| **Role / Tier** | Primary / Protected Baseline | Dedicated Development Branch |
| **Endpoint (Direct)** | `ep-little-credit-beuthfde` | Unique isolated endpoint |
| **Endpoint (Pooler)** | `ep-little-credit-beuthfde-pooler` | Unique isolated pooler endpoint |
| **Database Name** | `neondb` | `neondb` |
| **Current Schema Version** | `20261112000000_init` (plus manual `admin_sessions`) | Inherited from primary snapshot |

**Inspection Conclusion:** No separate development branch currently exists in project `cool-term-97592889`.

---

## 3. Step-by-Step Instructions: Creating the Development Branch in Neon Console

The repository owner can provision the development branch in under 60 seconds through the Neon Console:

### Step 1: Open the Neon Project Console
1. Navigate to [https://console.neon.tech/app/projects](https://console.neon.tech/app/projects).
2. Select project **`cool-term-97592889`**.

### Step 2: Create Development Branch
1. In the left navigation sidebar, click on **Branches**.
2. Click the **Create Branch** button in the upper-right corner.
3. In the branch creation modal, configure:
   - **Branch Name:** `development` (or `dev`)
   - **Parent Branch:** Select `br-little-bird-bejretq1` (or `main`)
   - **Compute Endpoint:** Select **Create a compute endpoint** (default, ensures direct queryability).
4. Click **Create Branch**.
5. Neon will create the branch instantly via copy-on-write snapshot.

### Step 3: Retrieve Development Branch Connection Strings
1. Once created, click on the **Dashboard** or **Connection Details** tab for the new `development` branch.
2. Select database **`neondb`** and user role **`neondb_owner`**.
3. Copy the two connection strings:
   - **Pooled Connection String (`DATABASE_URL`):** Includes `-pooler` in the hostname (e.g. `ep-xyz-pooler.c-9.us-east-2.aws.neon.tech`).
   - **Direct Connection String (`DIRECT_URL`):** Direct compute endpoint without `-pooler` (e.g. `ep-xyz.c-9.us-east-2.aws.neon.tech`).

---

## 4. Local Environment Configuration (`.env`) Update Guide

Once the owner has created the branch and obtained the connection strings, update the local development `.env` (which is strictly git-ignored) as follows:

```bash
# ------------------------------------------------------------------------------
# 1. DATABASE CONFIGURATION (Neon Dedicated Development Branch)
# ------------------------------------------------------------------------------
# Pooled connection string pointing to dedicated development endpoint:
DATABASE_URL="postgresql://<user>:<password>@ep-<dev-endpoint>-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Direct non-pooled connection string pointing to dedicated development endpoint (for Prisma CLI migrations):
DIRECT_URL="postgresql://<user>:<password>@ep-<dev-endpoint>.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

> [!SECURITY]
> **Credential Protection:**  
> Never commit real connection strings or passwords into Git. `.env` is protected by root `.gitignore` (tested and verified in Task 15.1).

---

## 5. Branch Lifecycle & Disaster Recovery Workflow

```
[Primary Branch: br-little-bird-bejretq1]
       │
       │ (Instant Copy-on-Write Snapshot)
       ▼
[Dedicated Dev Branch: development]
       │
       ├─ Step 1: prisma migrate resolve --applied 20261112000001_add_admin_sessions
       ├─ Step 2: prisma migrate deploy (Applies CRM & CMS migrations)
       ├─ Step 3: npm run dev verification (0 schema errors)
       │
       ▼
[Verified Dev Environment]
```

### Safety Advantages:
- If a migration failure or unexpected state occurs during development testing, the `development` branch can simply be deleted and recreated from `br-little-bird-bejretq1` in 5 seconds.
- The primary branch `br-little-bird-bejretq1` is 100% isolated and protected from schema drift until explicitly approved for production promotion.
