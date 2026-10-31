-- ==========================================================
-- SMART CAMPUS LOST-AND-FOUND PLATFORM
-- Seed Data: Sample Campus Locations, Users, and Inventory
-- ==========================================================

-- 1. Insert Campus Locations
INSERT INTO campus_locations (location_id, building_name, floor_number, zone_type, description) VALUES
(1, 'Central Library', 3, 'LIBRARY', '3rd Floor Quiet Reading Hall and Reference Section'),
(2, 'B-Block', 1, 'CAFETERIA', 'Main Student Food Court & Cafeteria Ground/First Floor'),
(3, 'Tech Park', 5, 'LAB', 'Level 5 CSE High-Performance Computing Labs'),
(4, 'GJBC Auditorium', 1, 'AUDITORIUM', 'Golden Jubilee Block Main Auditorium and Foyer'),
(5, 'Sports Complex', 1, 'SPORTS_COMPLEX', 'Indoor Badminton Courts and Table Tennis Arena')
ON CONFLICT (location_id) DO NOTHING;

-- 2. Insert Categories
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Electronics', 'Laptops, mobile phones, chargers, earphones, smartwatches'),
(2, 'ID & Cards', 'Campus ID cards, driver licenses, access cards, library badges'),
(3, 'Keys', 'Dorm keys, bike/car keys, locker access fobs'),
(4, 'Personal Accessories', 'Watches, spectacles, umbrellas, backpacks, water bottles'),
(5, 'Stationery & Books', 'Textbooks, lab manuals, notebooks, calculator, pencil pouches')
ON CONFLICT (category_id) DO NOTHING;

-- 3. Insert Users (Student and Security Staff Roles)
INSERT INTO users (user_id, full_name, email, prn_or_emp_id, role, phone) VALUES
('a0000000-0000-0000-0000-000000000001', 'Alex Chen', 'alex.chen@campus.edu', 'STU-2024-001', 'STUDENT', '5550192831'),
('a0000000-0000-0000-0000-000000000002', 'Sarah Jenkins', 'sarah.j@campus.edu', 'STU-2024-042', 'STUDENT', '5550192832'),
('a0000000-0000-0000-0000-000000000003', 'Marcus Vance', 'marcus.v@campus.edu', 'STU-2024-098', 'STUDENT', '5550192833'),
('b0000000-0000-0000-0000-000000000001', 'Officer Robert Miller', 'r.miller@campus.edu', 'SEC-EMP-88', 'STAFF', '5550192834'),
('b0000000-0000-0000-0000-000000000002', 'Elena Rostova', 'elena.r@campus.edu', 'ADM-EMP-12', 'ADMIN', '5550192835')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Helper to generate mock 384-dimensional normalized vector for seeds
-- (When running with Next.js, real embeddings are computed via @xenova/transformers)
CREATE OR REPLACE FUNCTION fn_mock_vector(seed_val FLOAT) RETURNS vector AS $$
DECLARE
    v_arr FLOAT[];
    i INT;
BEGIN
    v_arr := ARRAY[]::FLOAT[];
    FOR i IN 1..384 LOOP
        v_arr := array_append(v_arr, (sin(i * seed_val) * 0.05)::FLOAT);
    END LOOP;
    RETURN v_arr::vector;
END;
$$ LANGUAGE plpgsql;

-- 5. Insert Lost Items (Reported by Students)
INSERT INTO lost_items (lost_id, user_id, category_id, title, description, primary_color, brand, lost_location_id, date_lost, status, embedding) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    1,
    'Silver MacBook Air M2',
    '13-inch silver MacBook Air with a small GitHub Octocat sticker near trackpad and tiny dent on left corner.',
    'Silver',
    'Apple',
    1, -- Central Library
    CURRENT_DATE - INTERVAL '2 days',
    'SEARCHING',
    fn_mock_vector(1.15)
),
(
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    2,
    'Student ID Badge in Navy Blue Lanyard',
    'Campus ID card with photo badge, navy blue woven lanyard with a metallic key ring attached.',
    'Blue',
    'CampusAdmin',
    2, -- B-Block Cafeteria
    CURRENT_DATE - INTERVAL '1 day',
    'POTENTIAL_MATCH',
    fn_mock_vector(2.45)
),
(
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    4,
    'Titan Black Chronograph Watch',
    'Black dial with red seconds hand, metal link strap with minor scratches on buckle clasp.',
    'Black',
    'Titan',
    5, -- Sports Complex
    CURRENT_DATE - INTERVAL '3 days',
    'POTENTIAL_MATCH',
    fn_mock_vector(3.85)
)
ON CONFLICT (lost_id) DO NOTHING;

-- 6. Insert Found Items (Handed to Security Desk)
INSERT INTO found_items (found_id, finder_user_id, category_id, title, description, primary_color, brand, found_location_id, date_found, storage_custody_location, status, embedding) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    1,
    'Apple MacBook Air Laptop with Stickers',
    'Apple notebook computer, silver finish, coder sticker near bottom-right of keyboard, light scuff on casing.',
    'Silver',
    'Apple',
    1, -- Central Library
    CURRENT_DATE - INTERVAL '2 days',
    'Security Locker B-12 (Central Desk)',
    'IN_CUSTODY',
    fn_mock_vector(1.16) -- High cosine similarity with c0000000...0001
),
(
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    2,
    'Campus ID Card & Lanyard',
    'Student identification card in blue neck strap found on dining table.',
    'Blue',
    'CampusAdmin',
    2, -- B-Block Cafeteria
    CURRENT_DATE - INTERVAL '1 day',
    'Security Drawer A-04',
    'IN_CUSTODY',
    fn_mock_vector(2.46) -- Matches lost ID
),
(
    'd0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    4,
    'Black Metal Strap Wristwatch',
    'Black analog watch found on seating bench court 2.',
    'Black',
    'Titan',
    5, -- Sports Complex
    CURRENT_DATE - INTERVAL '3 days',
    'Security Locker C-01',
    'IN_CUSTODY',
    fn_mock_vector(3.86) -- Matches Titan watch
)
ON CONFLICT (found_id) DO NOTHING;

-- 7. Insert Sample Ownership Claims
INSERT INTO claims (claim_id, lost_id, found_id, claimant_user_id, verification_proof, match_score, claim_status) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'Has a small silver locker key tied to the lanyard knot and student ID ending in 042.',
    94.50,
    'SUBMITTED'
),
(
    'e0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'Red seconds hand, model number stamped on back plate is 1805NM01.',
    89.80,
    'VERIFIED_BY_STAFF'
)
ON CONFLICT (claim_id) DO NOTHING;
