import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        l.lost_id,
        l.title,
        l.description,
        l.primary_color,
        l.brand,
        l.date_lost,
        l.status,
        c.category_name,
        loc.building_name,
        u.full_name AS reported_by
      FROM lost_items l
      JOIN categories c ON l.category_id = c.category_id
      LEFT JOIN campus_locations loc ON l.lost_location_id = loc.location_id
      JOIN users u ON l.user_id = u.user_id
      ORDER BY l.created_at DESC
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
    const { title, description, category_id, primary_color, brand, lost_location_id, date_lost, user_id } = body;

    if (!title || !description || !primary_color) {
      return NextResponse.json({ success: false, error: 'Missing required item fields.' }, { status: 400 });
    }

    // Generate 384-d semantic embedding from combined item text
    const textToEmbed = `${title}. ${description}. Color: ${primary_color}. Brand: ${brand || 'Unknown'}.`;
    const embedding = await generateEmbedding(textToEmbed);

    const insertResult = await query(
      `
      INSERT INTO lost_items (
        user_id, category_id, title, description, primary_color, brand, lost_location_id, date_lost, embedding, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SEARCHING')
      RETURNING lost_id, title, created_at;
      `,
      [
        user_id || 'a0000000-0000-0000-0000-000000000001',
        category_id || 1,
        title,
        description,
        primary_color,
        brand || null,
        lost_location_id || 1,
        date_lost || new Date().toISOString().split('T')[0],
        embedding,
      ]
    );

    const newLostId = insertResult.rows[0].lost_id;

    // Trigger instant vector similarity search for candidates
    const matchResult = await query(
      `SELECT * FROM fn_match_lost_item($1::UUID, 5, 0.60);`,
      [newLostId]
    );

    return NextResponse.json({
      success: true,
      lost_item: insertResult.rows[0],
      candidate_matches: matchResult.rows,
    });
  } catch (error: any) {
    console.error('[API lost items error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
