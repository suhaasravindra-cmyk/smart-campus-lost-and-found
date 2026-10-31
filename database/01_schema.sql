-- ==========================================================
-- SMART CAMPUS LOST-AND-FOUND PLATFORM
-- Migration 01: Core Relational Schema & HNSW Vector Indexes
-- Database: PostgreSQL 16 with pgvector extension
-- ==========================================================

-- 1. Enable pgvector Extension for Dense Vector Storage
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Existing Tables (Cascade Drop for Clean Setup)
DROP TABLE IF EXISTS custody_handovers CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS item_audit_log CASCADE;
DROP TABLE IF EXISTS found_items CASCADE;
DROP TABLE IF EXISTS lost_items CASCADE;
DROP TABLE IF EXISTS campus_locations CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. Users Table (Role-Based Access: Student, Staff, Admin)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    prn_or_emp_id VARCHAR(30) UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'STAFF', 'ADMIN')),
    phone VARCHAR(15),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Campus Locations Table
CREATE TABLE campus_locations (
    location_id SERIAL PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,
    floor_number INT NOT NULL,
    zone_type VARCHAR(30) NOT NULL CHECK (
        zone_type IN ('LIBRARY', 'CAFETERIA', 'CLASSROOM', 'LAB', 'SPORTS_COMPLEX', 'AUDITORIUM', 'OPEN_GROUND')
    ),
    description VARCHAR(200)
);

-- 5. Categories Table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(60) NOT NULL UNIQUE,
    description TEXT
);

-- 6. Lost Items Table (Includes 384-d semantic embedding)
CREATE TABLE lost_items (
    lost_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    primary_color VARCHAR(50) NOT NULL,
    brand VARCHAR(80),
    lost_location_id INT REFERENCES campus_locations(location_id) ON DELETE SET NULL,
    date_lost DATE NOT NULL CHECK (date_lost <= CURRENT_DATE),
    status VARCHAR(20) NOT NULL DEFAULT 'SEARCHING' CHECK (
        status IN ('SEARCHING', 'POTENTIAL_MATCH', 'CLAIMED', 'CLOSED')
    ),
    embedding vector(384), -- 384-dimensional dense semantic vector
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Found Items Table (Includes physical custody storage shelf)
CREATE TABLE found_items (
    found_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finder_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    category_id INT NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    primary_color VARCHAR(50) NOT NULL,
    brand VARCHAR(80),
    found_location_id INT REFERENCES campus_locations(location_id) ON DELETE SET NULL,
    date_found DATE NOT NULL CHECK (date_found <= CURRENT_DATE),
    storage_custody_location VARCHAR(120) NOT NULL DEFAULT 'Central Security Desk Locker #01',
    status VARCHAR(20) NOT NULL DEFAULT 'IN_CUSTODY' CHECK (
        status IN ('IN_CUSTODY', 'CLAIM_PENDING', 'RETURNED_TO_OWNER', 'DISPOSED')
    ),
    embedding vector(384), -- 384-dimensional dense semantic vector
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Ownership Claims Table (Verification mechanism)
CREATE TABLE claims (
    claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lost_id UUID NOT NULL REFERENCES lost_items(lost_id) ON DELETE CASCADE,
    found_id UUID NOT NULL REFERENCES found_items(found_id) ON DELETE CASCADE,
    claimant_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    verification_proof TEXT NOT NULL, -- Secret proof entered by student (e.g. wallpaper, serial #)
    match_score NUMERIC(5, 2) NOT NULL CHECK (match_score >= 0.0 AND match_score <= 100.0),
    claim_status VARCHAR(25) NOT NULL DEFAULT 'SUBMITTED' CHECK (
        claim_status IN ('SUBMITTED', 'VERIFIED_BY_STAFF', 'REJECTED', 'HANDED_OVER')
    ),
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Custody Handovers Table (Audit tracking for physical item return)
CREATE TABLE custody_handovers (
    handover_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL UNIQUE REFERENCES claims(claim_id) ON DELETE CASCADE,
    authorized_by_staff_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    received_by_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    handover_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT
);

-- 10. Item Audit Log Table (Populated automatically by Triggers)
CREATE TABLE item_audit_log (
    audit_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by VARCHAR(100) DEFAULT CURRENT_USER,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- INDEXING SPECIFICATION
-- ==========================================================
-- B-Tree Indexes on Foreign Keys & Status fields
CREATE INDEX idx_lost_items_user_id ON lost_items(user_id);
CREATE INDEX idx_lost_items_status ON lost_items(status);
CREATE INDEX idx_found_items_status ON found_items(status);
CREATE INDEX idx_claims_status ON claims(claim_status);

-- Partial Index for active unresolved items in custody
CREATE INDEX idx_active_found_items ON found_items(found_location_id, category_id) 
WHERE status = 'IN_CUSTODY';

-- HNSW Vector Index for blazing-fast Cosine Similarity Search
-- Using vector_cosine_ops with Hierarchical Navigable Small World algorithm
CREATE INDEX idx_lost_items_hnsw_embedding ON lost_items 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_found_items_hnsw_embedding ON found_items 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
