import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        f.found_id,
        f.title,
        f.description,
        f.primary_color,
        f.brand,
        f.date_found,
        f.storage_custody_location,
        f.status,
        c.category_name,
        loc.building_name
      FROM found_items f
      JOIN categories c ON f.category_id = c.category_id
      LEFT JOIN campus_locations loc ON f.found_location_id = loc.location_id
      ORDER BY f.created_at DESC
      LIMIT 50;
    `);
    return NextResponse.json({ success: true, items: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, category_id, primary_color, brand, found_location_id, date_found, storage_custody_location, finder_user_id } = body;

    if (!title || !description || !primary_color) {
      return NextResponse.json({ success: false, error: 'Missing required item fields.' }, { status: 400 });
    }

    const textToEmbed = `${title}. ${description}. Color: ${primary_color}. Brand: ${brand || 'Unknown'}.`;
    const embedding = await generateEmbedding(textToEmbed);

    const insertResult = await query(
      `
      INSERT INTO found_items (
        finder_user_id, category_id, title, description, primary_color, brand, found_location_id, date_found, storage_custody_location, embedding, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'IN_CUSTODY')
      RETURNING found_id, title, storage_custody_location, created_at;
      `,
      [
        finder_user_id || 'b0000000-0000-0000-0000-000000000001',
        category_id || 1,
        title,
        description,
        primary_color,
        brand || null,
        found_location_id || 1,
        date_found || new Date().toISOString().split('T')[0],
        storage_custody_location || 'Central Security Locker B-01',
        embedding,
      ]
    );

    return NextResponse.json({
      success: true,
      found_item: insertResult.rows[0],
    });
  } catch (error: any) {
    console.error('[API found items error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
