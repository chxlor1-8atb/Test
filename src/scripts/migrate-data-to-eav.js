const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function migrateData() {
    console.log('🚀 Starting Data Migration to EAV...');

    try {
        // --- 1. SETUP ENTITIES ---

        // 1.1 Shops Entity
        console.log('📦 Creating Shops Entity...');
        const shopsEntity = await sql`
            INSERT INTO entities (slug, label, icon, description, display_order)
            VALUES ('shops', 'ร้านค้า', 'fa-store', 'ข้อมูลร้านค้าทั้งหมด', 1)
            ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label
            RETURNING id
        `;
        const shopEntityId = shopsEntity[0].id;

        // 1.2 Licenses Entity
        console.log('📄 Creating Licenses Entity...');
        const licensesEntity = await sql`
            INSERT INTO entities (slug, label, icon, description, display_order)
            VALUES ('licenses', 'ใบอนุญาต', 'fa-file-alt', 'ข้อมูลใบอนุญาตต่างๆ', 2)
            ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label
            RETURNING id
        `;
        const licenseEntityId = licensesEntity[0].id;


        // --- 2. SETUP FIELDS ---

        // Helper to create fields
        const createField = async (entId, name, label, type, order, showInList = true) => {
            await sql`
                INSERT INTO entity_fields (entity_id, field_name, field_label, field_type, display_order, show_in_list, show_in_form)
                VALUES (${entId}, ${name}, ${label}, ${type}, ${order}, ${showInList}, true)
                ON CONFLICT (entity_id, field_name) DO NOTHING
            `;
        };

        // 2.1 Shop Fields
        console.log('Creating Shop Fields...');
        await createField(shopEntityId, 'shop_name', 'ชื่อร้านค้า', 'text', 1);
        await createField(shopEntityId, 'address', 'ที่อยู่', 'text', 2, false);
        await createField(shopEntityId, 'contact_info', 'ข้อมูลติดต่อ', 'text', 3);
        await createField(shopEntityId, 'tax_id', 'เลขประจำตัวผู้เสียภาษี', 'text', 4, false);

        // 2.2 License Fields
        console.log('Creating License Fields...');
        await createField(licenseEntityId, 'license_name', 'ชื่อใบอนุญาต', 'text', 1);
        await createField(licenseEntityId, 'shop_id', 'รหัสร้านค้า', 'number', 2, false); // For now simple number, ideally relation
        await createField(licenseEntityId, 'license_type_id', 'ประเภทใบอนุญาต (ID)', 'number', 3, false);
        await createField(licenseEntityId, 'issue_date', 'วันที่ออก', 'date', 4);
        await createField(licenseEntityId, 'expiry_date', 'วันหมดอายุ', 'date', 5);
        await createField(licenseEntityId, 'status', 'สถานะ', 'text', 6);
        await createField(licenseEntityId, 'license_number', 'เลขที่ใบอนุญาต', 'text', 7);


        // --- 3. MIGRATE DATA ---

        // 3.1 Migrate Shops
        console.log('🔄 Migrating Shops Data...');
        const oldShops = await sql`SELECT * FROM shops`;

        // Get field IDs mapping
        const shopFields = await sql`SELECT field_name, id FROM entity_fields WHERE entity_id = ${shopEntityId}`;
        const sMap = {};
        shopFields.forEach(f => sMap[f.field_name] = f.id);

        for (const shop of oldShops) {
            // Create Record
            const rec = await sql`INSERT INTO entity_records (entity_id, created_at) VALUES (${shopEntityId}, ${shop.created_at}) RETURNING id`;
            const recId = rec[0].id;

            // Insert Values
            if (shop.shop_name) await sql`INSERT INTO entity_values (record_id, field_id, value_text) VALUES (${recId}, ${sMap['shop_name']}, ${shop.shop_name})`;
            if (shop.address) await sql`INSERT INTO entity_values (record_id, field_id, value_text) VALUES (${recId}, ${sMap['address']}, ${shop.address})`;
            if (shop.contact_info) await sql`INSERT INTO entity_values (record_id, field_id, value_text) VALUES (${recId}, ${sMap['contact_info']}, ${shop.contact_info})`;
            // tax_id might not exist in old schema but if it did...
        }

        // 3.2 Migrate Licenses
        console.log('🔄 Migrating Licenses Data...');
        const oldLicenses = await sql`SELECT * FROM licenses`;

        // Get field IDs mapping
        const licFields = await sql`SELECT field_name, id FROM entity_fields WHERE entity_id = ${licenseEntityId}`;
        const lMap = {};
        licFields.forEach(f => lMap[f.field_name] = f.id);

        for (const lic of oldLicenses) {
            // Create Record
            const rec = await sql`INSERT INTO entity_records (entity_id, created_at) VALUES (${licenseEntityId}, ${lic.created_at}) RETURNING id`;
            const recId = rec[0].id;

            // Insert Values
            if (lic.license_number) await sql`INSERT INTO entity_values (record_id, field_id, value_text) VALUES (${recId}, ${lMap['license_number']}, ${lic.license_number})`;
            if (lic.shop_id) await sql`INSERT INTO entity_values (record_id, field_id, value_number) VALUES (${recId}, ${lMap['shop_id']}, ${lic.shop_id})`;
            if (lic.license_type_id) await sql`INSERT INTO entity_values (record_id, field_id, value_number) VALUES (${recId}, ${lMap['license_type_id']}, ${lic.license_type_id})`;
            if (lic.issue_date) await sql`INSERT INTO entity_values (record_id, field_id, value_date) VALUES (${recId}, ${lMap['issue_date']}, ${lic.issue_date})`;
            if (lic.expiry_date) await sql`INSERT INTO entity_values (record_id, field_id, value_date) VALUES (${recId}, ${lMap['expiry_date']}, ${lic.expiry_date})`;
            if (lic.status) await sql`INSERT INTO entity_values (record_id, field_id, value_text) VALUES (${recId}, ${lMap['status']}, ${lic.status})`;
        }

        console.log('✨ Data Migration Completed Successfully!');

    } catch (err) {
        console.error('❌ Data Migration Failed:', err);
    }
}

migrateData();
