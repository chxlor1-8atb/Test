const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load env locally
const envPath = path.join(process.cwd(), '.env.local');
let databaseUrl = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
    if (match) databaseUrl = match[1];
}

if (!databaseUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
}

const sql = neon(databaseUrl);

async function resetPassword() {
    try {
        const username = 'admin';
        const newPassword = '1234';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log(`Resetting password for user '${username}'...`);

        await sql('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, username]);

        console.log('Password reset successfully.');
        console.log(`Username: ${username}`);
        console.log(`New Password: ${newPassword}`);

    } catch (err) {
        console.error('Error resetting password:', err);
    }
}

resetPassword();
