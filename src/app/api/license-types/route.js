
import { fetchAll } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const types = await fetchAll('SELECT * FROM license_types ORDER BY id ASC');
        return NextResponse.json({ success: true, types });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
