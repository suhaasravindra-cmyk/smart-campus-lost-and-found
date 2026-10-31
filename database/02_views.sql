-- ==========================================================
-- SMART CAMPUS LOST-AND-FOUND PLATFORM
-- Migration 02: Analytical & Queue Views
-- ==========================================================

-- 1. View: Campus Loss Hotspots (Aggregates with GROUP BY & HAVING)
-- Demonstrates multi-table joins, conditional COUNT aggregates, NULLIF division, and rounding
CREATE OR REPLACE VIEW v_campus_loss_hotspots AS
SELECT 
    cl.location_id,
    cl.building_name,
    cl.zone_type,
    COUNT(DISTINCT l.lost_id) AS total_lost_reported,
    COUNT(DISTINCT f.found_id) AS total_found_in_custody,
    COUNT(DISTINCT CASE WHEN f.status = 'RETURNED_TO_OWNER' THEN f.found_id END) AS total_recovered,
    ROUND(
        (COUNT(DISTINCT CASE WHEN f.status = 'RETURNED_TO_OWNER' THEN f.found_id END)::NUMERIC / 
        NULLIF(COUNT(DISTINCT l.lost_id), 0)::NUMERIC) * 100, 
        2
    ) AS recovery_rate_percentage
FROM campus_locations cl
LEFT JOIN lost_items l ON cl.location_id = l.lost_location_id
LEFT JOIN found_items f ON cl.location_id = f.found_location_id
GROUP BY cl.location_id, cl.building_name, cl.zone_type
HAVING COUNT(DISTINCT l.lost_id) > 0
ORDER BY total_lost_reported DESC;

-- 2. View: Active Unresolved Match Candidates
-- Connects lost items currently 'SEARCHING' with items 'IN_CUSTODY' matching category and sane date
CREATE OR REPLACE VIEW v_active_match_candidates AS
SELECT 
    l.lost_id,
    l.title AS lost_title,
    u.full_name AS claimant_name,
    c.category_name,
    l.date_lost,
    f.found_id,
    f.title AS found_title,
    f.storage_custody_location,
    f.date_found,
    ROUND((1 - (f.embedding <=> l.embedding))::NUMERIC * 100, 2) AS cosine_match_percentage
FROM lost_items l
JOIN users u ON l.user_id = u.user_id
JOIN categories c ON l.category_id = c.category_id
JOIN found_items f ON l.category_id = f.category_id
WHERE l.status = 'SEARCHING'
  AND f.status = 'IN_CUSTODY'
  AND f.date_found >= l.date_lost;

-- 3. View: Security Desk Pending Claims Queue
-- Formats claim verification proof, claimant student identity, and locker shelf assignment
CREATE OR REPLACE VIEW v_pending_claims_queue AS
SELECT 
    clm.claim_id,
    clm.submitted_at,
    clm.claim_status,
    clm.match_score,
    u.full_name AS student_name,
    u.prn_or_emp_id AS student_prn,
    u.phone AS student_phone,
    f.title AS item_title,
    f.storage_custody_location,
    clm.verification_proof
FROM claims clm
JOIN users u ON clm.claimant_user_id = u.user_id
JOIN found_items f ON clm.found_id = f.found_id
WHERE clm.claim_status IN ('SUBMITTED', 'VERIFIED_BY_STAFF')
ORDER BY clm.submitted_at ASC;
