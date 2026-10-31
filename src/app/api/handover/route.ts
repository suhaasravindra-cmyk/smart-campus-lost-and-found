import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { claim_id, staff_id, remarks } = body;

    if (!claim_id) {
      return NextResponse.json({ success: false, error: 'Claim ID is required.' }, { status: 400 });
    }

    // Executes the ACID Stored Procedure in PostgreSQL
    await query(
      `CALL sp_execute_item_handover($1::UUID, $2::UUID, $3::TEXT);`,
      [
        claim_id,
        staff_id || 'b0000000-0000-0000-0000-000000000001',
        remarks || 'Handover executed and verified via student identification badge.',
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Item handover transaction committed successfully.',
    });
  } catch (error: any) {
    console.error('[Handover Transaction Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
