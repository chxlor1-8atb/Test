const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
    console.log('🚀 Starting Audit Logs migration...');

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER, -- Can be null if system action or failed login
                action VARCHAR(50) NOT NULL, -- e.g. 'LOGIN', 'CREATE_ENTITY', 'UPDATE_RECORD'
                entity_type VARCHAR(100), -- e.g. 'users', 'licenses', 'products'
                entity_id TEXT, -- The ID of the affected item (can be string or int)
                details JSONB DEFAULT '{}'::jsonb, -- Store diff or metadata
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;

        await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`;

        console.log('✅ Created audit_logs table');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

runMigration();
