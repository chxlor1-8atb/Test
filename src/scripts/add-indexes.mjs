
import { neon } from '@neondatabase/serverless';
// Load environment variables via --env-file
// import dotenv from 'dotenv'; // Removed to use native node --env-file
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not defined');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function addIndexes() {
    console.log('Adding performance indexes...');

    const indexes = [
        // Licenses Foreign Keys
        { name: 'idx_licenses_shop_id', query: 'CREATE INDEX IF NOT EXISTS idx_licenses_shop_id ON licenses(shop_id);' },
        { name: 'idx_licenses_type_id', query: 'CREATE INDEX IF NOT EXISTS idx_licenses_type_id ON licenses(license_type_id);' },

        // Licenses Filtering
        { name: 'idx_licenses_status', query: 'CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);' },
        { name: 'idx_licenses_expiry', query: 'CREATE INDEX IF NOT EXISTS idx_licenses_expiry ON licenses(expiry_date);' },

        // Shops Filtering
        { name: 'idx_shops_name', query: 'CREATE INDEX IF NOT EXISTS idx_shops_name ON shops(shop_name);' }
    ];

    for (const idx of indexes) {
        try {
            console.log(`Creating index: ${idx.name}...`);
            await sql(idx.query);
            console.log(`✅ Index ${idx.name} created or already exists.`);
        } catch (error) {
            console.error(`❌ Failed to create index ${idx.name}:`, error.message);
        }
    }

    console.log('All index operations completed.');
}

addIndexes().catch(console.error);
