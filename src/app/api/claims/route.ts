import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`SELECT * FROM v_pending_claims_queue;`);
    return NextResponse.json({ success: true, claims: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lost_id, found_id, claimant_user_id, verification_proof, match_score } = body;

    if (!lost_id || !found_id || !verification_proof) {
      return NextResponse.json({ success: false, error: 'Missing claim details or secret proof.' }, { status: 400 });
    }

    const result = await query(
      `
      INSERT INTO claims (
        lost_id, found_id, claimant_user_id, verification_proof, match_score, claim_status
      ) VALUES ($1, $2, $3, $4, $5, 'SUBMITTED')
      RETURNING claim_id, claim_status, submitted_at;
      `,
      [
        lost_id,
        found_id,
        claimant_user_id || 'a0000000-0000-0000-0000-000000000001',
        verification_proof,
        match_score || 90.0,
      ]
    );

    return NextResponse.json({ success: true, claim: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
