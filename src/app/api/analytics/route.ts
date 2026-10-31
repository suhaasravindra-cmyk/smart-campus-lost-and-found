import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const hotspots = await query(`SELECT * FROM v_campus_loss_hotspots;`);

    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM lost_items) AS total_lost,
        (SELECT COUNT(*) FROM found_items WHERE status = 'IN_CUSTODY') AS in_custody,
        (SELECT COUNT(*) FROM custody_handovers) AS total_handovers,
        (SELECT COUNT(*) FROM item_audit_log) AS audit_events;
    `);

    const audits = await query(`
      SELECT * FROM item_audit_log 
      ORDER BY changed_at DESC 
      LIMIT 15;
    `);

    return NextResponse.json({
      success: true,
      hotspots: hotspots.rows,
      summary: stats.rows[0],
      audit_stream: audits.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
