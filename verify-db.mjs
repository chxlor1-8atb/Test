import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_dmWJrab3uSP5@ep-lively-bird-a1vsnlbg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function checkConnection() {
    try {
        const sql = neon(DATABASE_URL);
        console.log('Connecting to Neon...');
        const result = await sql('SELECT NOW()');
        console.log('Connection successful:', result);

        console.log('Checking users table...');
        try {
            const users = await sql('SELECT count(*) FROM users');
            console.log('Users table exists. Count:', users);
        } catch (err) {
            console.log('Users table query failed (might not exist yet):', err.message);
        }

    } catch (error) {
        console.error('Connection failed:', error);
        process.exit(1);
    }
}

checkConnection();
