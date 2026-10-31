-- ==========================================================
-- SMART CAMPUS LOST-AND-FOUND PLATFORM
-- Migration 03: Vector Search Functions & Custody Handover Procedures
-- ==========================================================

-- FUNCTION 1: Semantic Match Finder with Hybrid Scoring
-- Combines pgvector cosine similarity with location and category bonuses
CREATE OR REPLACE FUNCTION fn_match_lost_item(
    p_lost_id UUID,
    p_top_k INT DEFAULT 5,
    p_threshold FLOAT DEFAULT 0.65
)
RETURNS TABLE (
    found_id UUID,
    title VARCHAR,
    category_id INT,
    storage_custody_location VARCHAR,
    date_found DATE,
    cosine_similarity NUMERIC,
    location_match BOOLEAN,
    composite_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH target_lost AS (
        SELECT 
            embedding, 
            lost_location_id, 
            category_id, 
            date_lost
        FROM lost_items
        WHERE lost_id = p_lost_id
    )
    SELECT 
        f.found_id,
        f.title,
        f.category_id,
        f.storage_custody_location,
        f.date_found,
        ROUND((1 - (f.embedding <=> tl.embedding))::NUMERIC * 100, 2) AS cosine_similarity,
        (f.found_location_id = tl.lost_location_id) AS location_match,
        ROUND((
            -- 80% weight on Vector Semantic Similarity
            ((1 - (f.embedding <=> tl.embedding)) * 80) +
            -- 15% weight if found in identical campus building
            (CASE WHEN f.found_location_id = tl.lost_location_id THEN 15 ELSE 0 END) +
            -- 5% weight if category matches exactly
            (CASE WHEN f.category_id = tl.category_id THEN 5 ELSE 0 END)
        )::NUMERIC, 2) AS composite_score
    FROM found_items f, target_lost tl
    WHERE f.status = 'IN_CUSTODY'
      AND f.date_found >= tl.date_lost
      AND (1 - (f.embedding <=> tl.embedding)) >= p_threshold
    ORDER BY f.embedding <=> tl.embedding ASC
    LIMIT p_top_k;
END;
$$ LANGUAGE plpgsql;

-- STORED PROCEDURE 2: Atomic Item Handover & Custody Release
-- Implements an ACID transaction with row-level locking to prevent double-release
CREATE OR REPLACE PROCEDURE sp_execute_item_handover(
    p_claim_id UUID,
    p_staff_id UUID,
    p_remarks TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_lost_id UUID;
    v_found_id UUID;
    v_claimant_id UUID;
    v_current_status VARCHAR(25);
    v_staff_role VARCHAR(20);
BEGIN
    -- Verify authorized staff role
    SELECT role INTO v_staff_role FROM users WHERE user_id = p_staff_id;
    IF v_staff_role NOT IN ('STAFF', 'ADMIN') THEN
        RAISE EXCEPTION 'Authorization failure: User % is not authorized security staff.', p_staff_id;
    END IF;

    -- Row-Level Lock: Lock claim row to prevent concurrent handover processing
    SELECT lost_id, found_id, claimant_user_id, claim_status
    INTO v_lost_id, v_found_id, v_claimant_id, v_current_status
    FROM claims
    WHERE claim_id = p_claim_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Claim record with ID % not found.', p_claim_id;
    END IF;

    IF v_current_status NOT IN ('SUBMITTED', 'VERIFIED_BY_STAFF') THEN
        RAISE EXCEPTION 'Cannot handover item. Claim status is already %', v_current_status;
    END IF;

    -- 1. Insert Handover Custody Receipt
    INSERT INTO custody_handovers (
        handover_id,
        claim_id,
        authorized_by_staff_id,
        received_by_user_id,
        handover_timestamp,
        remarks
    ) VALUES (
        gen_random_uuid(),
        p_claim_id,
        p_staff_id,
        v_claimant_id,
        CURRENT_TIMESTAMP,
        p_remarks
    );

    -- 2. Mark Found Item as Returned to Owner
    UPDATE found_items
    SET status = 'RETURNED_TO_OWNER'
    WHERE found_id = v_found_id;

    -- 3. Mark Lost Item as Claimed
    UPDATE lost_items
    SET status = 'CLAIMED'
    WHERE lost_id = v_lost_id;

    -- 4. Mark Claim Record as Handed Over
    UPDATE claims
    SET claim_status = 'HANDED_OVER'
    WHERE claim_id = p_claim_id;

    RAISE NOTICE 'Item handover executed successfully for Claim ID %', p_claim_id;
END;
$$;
