-- ==========================================================
-- SMART CAMPUS LOST-AND-FOUND PLATFORM
-- Analytical Queries: Relational Joins, Grouping, and Window Functions
-- ==========================================================

-- ----------------------------------------------------------
-- QUERY 1: Multi-Table JOIN (4 Tables)
-- Retrieves comprehensive claim dossier for Security Custody Desk
-- Joins: claims, users, found_items, and campus_locations
-- ----------------------------------------------------------
SELECT 
    clm.claim_id,
    u.full_name AS student_name,
    u.prn_or_emp_id,
    f.title AS found_item_title,
    f.storage_custody_location,
    loc.building_name AS discovery_building,
    clm.match_score,
    clm.claim_status,
    clm.verification_proof
FROM claims clm
INNER JOIN users u ON clm.claimant_user_id = u.user_id
INNER JOIN found_items f ON clm.found_id = f.found_id
INNER JOIN campus_locations loc ON f.found_location_id = loc.location_id
ORDER BY clm.match_score DESC;

-- ----------------------------------------------------------
-- QUERY 2: GROUP BY with HAVING & Aggregate Functions
-- Identifies high-risk campus zones with > 0 unresolved lost items
-- ----------------------------------------------------------
SELECT 
    loc.building_name,
    loc.zone_type,
    COUNT(l.lost_id) AS total_unresolved_lost,
    MIN(l.date_lost) AS oldest_loss_report,
    MAX(l.date_lost) AS newest_loss_report
FROM campus_locations loc
JOIN lost_items l ON loc.location_id = l.lost_location_id
WHERE l.status IN ('SEARCHING', 'POTENTIAL_MATCH')
GROUP BY loc.building_name, loc.zone_type
HAVING COUNT(l.lost_id) >= 1
ORDER BY total_unresolved_lost DESC;

-- ----------------------------------------------------------
-- QUERY 3: Correlated Subquery
-- Finds students who have reported items lost that currently have
-- an identical category item residing in custody
-- ----------------------------------------------------------
SELECT 
    u.full_name,
    u.email,
    l.title AS reported_lost_item
FROM users u
JOIN lost_items l ON u.user_id = l.user_id
WHERE EXISTS (
    SELECT 1 
    FROM found_items f
    WHERE f.category_id = l.category_id
      AND f.status = 'IN_CUSTODY'
      AND f.date_found >= l.date_lost
);

-- ----------------------------------------------------------
-- QUERY 4: Common Table Expression (CTE / WITH clause) & Window Function
-- Ranks custody items by semantic distance relative to a lost item
-- ----------------------------------------------------------
WITH TargetReport AS (
    SELECT lost_id, embedding, category_id
    FROM lost_items
    WHERE title ILIKE '%MacBook%'
    LIMIT 1
)
SELECT 
    f.found_id,
    f.title,
    f.storage_custody_location,
    ROUND((1 - (f.embedding <=> tr.embedding))::NUMERIC * 100, 2) AS cosine_similarity_score,
    DENSE_RANK() OVER (ORDER BY (f.embedding <=> tr.embedding) ASC) AS proximity_rank
FROM found_items f, TargetReport tr
WHERE f.status = 'IN_CUSTODY';

-- ----------------------------------------------------------
-- QUERY 5: Stored Procedure Invocation (ACID Handover)
-- ----------------------------------------------------------
-- CALL sp_execute_item_handover(
--     'e0000000-0000-0000-0000-000000000002'::UUID,
--     'b0000000-0000-0000-0000-000000000001'::UUID,
--     'Student presented original Titan purchase invoice and matched red seconds hand.'
-- );
