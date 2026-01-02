const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
    console.log('🚀 Starting Custom Fields migration...');

    try {
        // Create custom_fields table
        await sql`
            CREATE TABLE IF NOT EXISTS custom_fields (
                id SERIAL PRIMARY KEY,
                entity_type VARCHAR(50) NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                field_label VARCHAR(200) NOT NULL,
                field_type VARCHAR(50) NOT NULL DEFAULT 'text',
                field_options JSONB DEFAULT '[]'::jsonb,
                is_required BOOLEAN DEFAULT false,
                display_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                show_in_table BOOLEAN DEFAULT true,
                show_in_form BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(entity_type, field_name)
            )
        `;
        console.log('✅ Created custom_fields table');

        // Create custom_field_values table
        await sql`
            CREATE TABLE IF NOT EXISTS custom_field_values (
                id SERIAL PRIMARY KEY,
                field_id INTEGER NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
                entity_id INTEGER NOT NULL,
                value TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(field_id, entity_id)
            )
        `;
        console.log('✅ Created custom_field_values table');

        // Create indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON custom_fields(entity_type)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_custom_fields_active ON custom_fields(is_active)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON custom_field_values(field_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity ON custom_field_values(entity_id)`;
        console.log('✅ Created indexes');

        console.log('🎉 Custom Fields migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

runMigration();
