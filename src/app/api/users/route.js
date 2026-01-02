
import { fetchAll, fetchOne, executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // Check authentication/authorization here (omitted for brevity, assumption: middleare or session check done)

        if (id) {
            const user = await fetchOne('SELECT id, username, full_name, role, created_at FROM users WHERE id = $1', [id]);
            return NextResponse.json({ success: true, user });
        }

        const users = await fetchAll('SELECT id, username, full_name, role, created_at FROM users ORDER BY id ASC');
        return NextResponse.json({ success: true, users });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { username, full_name, password, role } = body;

        if (!username || !password || !role) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // Check if username exists
        const existing = await fetchOne('SELECT id FROM users WHERE username = $1', [username]);
        if (existing) {
            return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await executeQuery(
            `INSERT INTO users (username, full_name, password, role) VALUES ($1, $2, $3, $4)`,
            [username, full_name || '', hashedPassword, role]
        );

        return NextResponse.json({ success: true, message: 'User created successfully' });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, full_name, password, role } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
        }

        let query = 'UPDATE users SET full_name = $1, role = $2';
        let params = [full_name || '', role];
        let paramIndex = 3;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password = $${paramIndex}`;
            params.push(hashedPassword);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex}`;
        params.push(id);

        await executeQuery(query, params);

        return NextResponse.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
        }

        // Prevent deleting self? (Ideally check session user id vs id)

        await executeQuery('DELETE FROM users WHERE id = $1', [id]);

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
