# Smart Campus Lost-and-Found Platform

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-HNSW%20Index-8A2BE2)](https://github.com/pgvector/pgvector)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, high-throughput lost-and-found recovery platform engineered with **PostgreSQL 16** and the **`pgvector`** extension. The platform uses 384-dimensional dense semantic embeddings to automatically match unstructured human descriptions with physical items stored in secure campus custody lockers.

---

## Architecture Overview

Traditional lost-and-found portals rely on exact lexical keywords (`LIKE '%laptop%'`), which fail when different parties describe the same physical object using varied vocabulary (*"silver ultra-thin notebook"* vs. *"MacBook Air M2"*).

This platform implements a dual-engine architecture:

1. **Semantic Matching Engine (`pgvector`)**:
   - Converts natural language descriptions into 384-dimensional dense vector embeddings using `all-MiniLM-L6-v2`.
   - Executes Approximate Nearest Neighbor (ANN) vector search via **HNSW (Hierarchical Navigable Small World)** indexing.
   - Calculates dynamic cosine distance ($\text{Cosine Distance} = 1 - \frac{u \cdot v}{\|u\|_2 \|v\|_2}$) combined with location proximity and category heuristics.

2. **Transactional Custody Engine (PostgreSQL)**:
   - Uses multi-statement ACID transactions and row-level locking (`SELECT ... FOR UPDATE`) in `sp_execute_item_handover` to prevent race conditions and double-handover fraud.
   - Automatically maintains immutable audit logs via database triggers on status mutations.
   - Enforces referential integrity, state machine enums, and temporal invariants directly at the schema level.

---

## Entity-Relationship Architecture

```mermaid
erDiagram
    USERS ||--o{ LOST_ITEMS : reports
    USERS ||--o{ FOUND_ITEMS : deposits
    USERS ||--o{ CLAIMS : submits
    USERS ||--o{ CUSTODY_HANDOVERS : authorizes_or_receives
    CAMPUS_LOCATIONS ||--o{ LOST_ITEMS : located_at
    CAMPUS_LOCATIONS ||--o{ FOUND_ITEMS : discovered_at
    CATEGORIES ||--o{ LOST_ITEMS : classifies
    CATEGORIES ||--o{ FOUND_ITEMS : classifies
    LOST_ITEMS ||--o{ CLAIMS : referenced_in
    FOUND_ITEMS ||--o{ CLAIMS : matched_against
    CLAIMS ||--o| CUSTODY_HANDOVERS : completes_with

    USERS {
        uuid user_id PK
        varchar full_name
        varchar email
        varchar campus_id
        varchar role "STUDENT | STAFF | ADMIN"
        varchar phone
    }

    CAMPUS_LOCATIONS {
        int location_id PK
        varchar building_name
        int floor_number
        varchar zone_type
    }

    LOST_ITEMS {
        uuid lost_id PK
        uuid user_id FK
        int category_id FK
        varchar title
        text description
        varchar primary_color
        vector_384 embedding "HNSW Indexed"
        date date_lost
        varchar status
    }

    FOUND_ITEMS {
        uuid found_id PK
        uuid finder_user_id FK
        int category_id FK
        varchar title
        text description
        varchar storage_custody_location
        vector_384 embedding "HNSW Indexed"
        date date_found
        varchar status
    }

    CLAIMS {
        uuid claim_id PK
        uuid lost_id FK
        uuid found_id FK
        uuid claimant_user_id FK
        text verification_proof
        numeric match_score
        varchar claim_status
    }

    CUSTODY_HANDOVERS {
        uuid handover_id PK
        uuid claim_id FK
        uuid authorized_by_staff_id FK
        uuid received_by_user_id FK
        timestamptz handover_timestamp
        text remarks
    }
```

---

## Core Database Subsystems

| Module | Implementation | Description |
| :--- | :--- | :--- |
| **Vector Engine** | `embedding vector(384)` with HNSW | Fast approximate nearest neighbor search utilizing cosine operator `<=>` with $m=16, ef=64$. |
| **Hybrid Matcher** | `fn_match_lost_item()` | In-database PL/pgSQL function computing composite scores (80% vector similarity + 15% location bonus + 5% category match). |
| **Atomic Handover** | `sp_execute_item_handover()` | Stored procedure running inside a single ACID boundary with row-level locks to atomically release custody. |
| **Audit Trigger** | `trg_audit_item_status` | Trigger capturing every transition of item lifecycle states into an append-only `item_audit_log` table. |
| **Hotspot Analytics** | `v_campus_loss_hotspots` | Aggregated view tracking incident frequencies, recovery rates, and zone vulnerabilities across campus buildings. |

---

## Quickstart

### Prerequisites
- Node.js v20+
- Docker & Docker Compose (Optional, for local PostgreSQL container)

### 1. Clone & Install
```bash
git clone https://github.com/<YOUR_USERNAME>/smart-campus-lost-and-found.git
cd smart-campus-lost-and-found
npm install
```

### 2. Run Application
```bash
# Start the local application runner
node server.js
```
Open **`http://localhost:3000`** in your browser.

---

## Database Initialization (Optional Local Docker)

If you wish to spin up a local PostgreSQL 16 container with `pgvector` pre-configured:

```bash
docker compose up -d
```

The container automatically mounts and executes the migration pipeline in `/database`:
1. `01_schema.sql` — Schema definitions, foreign keys, CHECK constraints, and HNSW indexes.
2. `02_views.sql` — Analytical views and claim queue views.
3. `03_functions_procedures.sql` — Stored procedures and vector match functions.
4. `04_triggers.sql` — Automated audit logging triggers.
5. `05_seed.sql` — Sample inventory and campus locations.

---

## Query Benchmarks & Analytics

To inspect complex analytical queries, refer to [`database/06_queries.sql`](database/06_queries.sql), which demonstrates:
- 4-Table relational joins for custody dossiers.
- Location grouping with `HAVING` filters and recovery rate computations.
- Correlated subqueries using `EXISTS` to identify candidate claim overlaps.
- Common Table Expressions (CTEs) combined with window ranking functions (`DENSE_RANK()`).

---

## License
Distributed under the MIT License. See `LICENSE` for more information.
