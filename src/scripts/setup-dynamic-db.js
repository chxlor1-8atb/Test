const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
    console.log('🚀 Starting Dynamic Schema migration...');

    try {
        // 1. Entities Table
        await sql`
            CREATE TABLE IF NOT EXISTS entities (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(100) NOT NULL UNIQUE,
                label VARCHAR(200) NOT NULL,
                icon VARCHAR(50),
                description TEXT,
                display_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ Created entities table');

        // 2. Entity Fields Table
        await sql`
            CREATE TABLE IF NOT EXISTS entity_fields (
                id SERIAL PRIMARY KEY,
                entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
                field_name VARCHAR(100) NOT NULL,
                field_label VARCHAR(200) NOT NULL,
                field_type VARCHAR(50) NOT NULL, -- text, number, date, select, image, relation
                field_options JSONB DEFAULT '{}'::jsonb,
                is_required BOOLEAN DEFAULT false,
                is_unique BOOLEAN DEFAULT false,
                show_in_list BOOLEAN DEFAULT true,
                show_in_form BOOLEAN DEFAULT true,
                display_order INTEGER DEFAULT 0,
                default_value TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(entity_id, field_name)
            )
        `;
        console.log('✅ Created entity_fields table');

        // 3. Entity Records Table (The header for each item)
        await sql`
            CREATE TABLE IF NOT EXISTS entity_records (
                id SERIAL PRIMARY KEY,
                entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
                created_by INTEGER, -- Optional: link to existing users table if needed
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        console.log('✅ Created entity_records table');

        // 4. Entity Values Table (The actual data)
        await sql`
            CREATE TABLE IF NOT EXISTS entity_values (
                id SERIAL PRIMARY KEY,
                record_id INTEGER REFERENCES entity_records(id) ON DELETE CASCADE,
                field_id INTEGER REFERENCES entity_fields(id) ON DELETE CASCADE,
                value_text TEXT,
                value_number NUMERIC,
                value_date TIMESTAMP,
                value_boolean BOOLEAN,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(record_id, field_id)
            )
        `;
        console.log('✅ Created entity_values table');

        // Create Indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_entity_values_record ON entity_values(record_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_entity_values_field ON entity_values(field_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_entity_records_entity ON entity_records(entity_id)`;

        console.log('🎉 Dynamic Schema migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

runMigration();
