import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Queries candidates using v_active_match_candidates view
    const result = await query(`
      SELECT 
        l.lost_id,
        l.title AS lost_title,
        l.description AS lost_description,
        l.date_lost,
        loc1.building_name AS lost_building,
        u.full_name AS claimant_name,
        c.category_name,
        f.found_id,
        f.title AS found_title,
        f.description AS found_description,
        f.storage_custody_location,
        f.date_found,
        loc2.building_name AS found_building,
        ROUND((1 - (f.embedding <=> l.embedding))::NUMERIC * 100, 2) AS cosine_similarity,
        ROUND((
          ((1 - (f.embedding <=> l.embedding)) * 80) +
          (CASE WHEN f.found_location_id = l.lost_location_id THEN 15 ELSE 0 END) +
          (CASE WHEN f.category_id = l.category_id THEN 5 ELSE 0 END)
        )::NUMERIC, 2) AS composite_score
      FROM lost_items l
      JOIN users u ON l.user_id = u.user_id
      JOIN categories c ON l.category_id = c.category_id
      LEFT JOIN campus_locations loc1 ON l.lost_location_id = loc1.location_id
      CROSS JOIN found_items f
      LEFT JOIN campus_locations loc2 ON f.found_location_id = loc2.location_id
      WHERE l.status = 'SEARCHING'
        AND f.status = 'IN_CUSTODY'
        AND (1 - (f.embedding <=> l.embedding)) >= 0.65
      ORDER BY composite_score DESC
      LIMIT 20;
    `);

    return NextResponse.json({ success: true, matches: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
