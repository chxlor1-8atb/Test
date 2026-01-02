-- Custom Fields Migration Script
-- Run this to add dynamic custom fields support to the database

-- Table to store custom field definitions
CREATE TABLE IF NOT EXISTS custom_fields (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,           -- 'licenses', 'shops', 'users', 'license_types'
    field_name VARCHAR(100) NOT NULL,           -- Internal name (e.g., 'tax_id')
    field_label VARCHAR(200) NOT NULL,          -- Display label (e.g., 'เลขประจำตัวผู้เสียภาษี')
    field_type VARCHAR(50) NOT NULL DEFAULT 'text',  -- 'text', 'number', 'date', 'select', 'boolean', 'textarea'
    field_options JSONB DEFAULT '[]'::jsonb,    -- For select type: ["Option 1", "Option 2"]
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    show_in_table BOOLEAN DEFAULT true,         -- Show this field in data table
    show_in_form BOOLEAN DEFAULT true,          -- Show this field in add/edit form
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(entity_type, field_name)
);

-- Table to store actual values for custom fields
CREATE TABLE IF NOT EXISTS custom_field_values (
    id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_id INTEGER NOT NULL,                 -- The ID of the license/shop/user
    value TEXT,                                 -- The actual value (stored as text, converted on read)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(field_id, entity_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON custom_fields(entity_type);
CREATE INDEX IF NOT EXISTS idx_custom_fields_active ON custom_fields(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON custom_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity ON custom_field_values(entity_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_custom_fields_updated_at ON custom_fields;
CREATE TRIGGER update_custom_fields_updated_at
    BEFORE UPDATE ON custom_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_field_values_updated_at ON custom_field_values;
CREATE TRIGGER update_custom_field_values_updated_at
    BEFORE UPDATE ON custom_field_values
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some example custom fields (optional - can be removed)
-- INSERT INTO custom_fields (entity_type, field_name, field_label, field_type, display_order) VALUES
-- ('licenses', 'registration_number', 'เลขทะเบียนการค้า', 'text', 1),
-- ('licenses', 'branch_code', 'รหัสสาขา', 'text', 2),
-- ('shops', 'tax_id', 'เลขประจำตัวภาษี', 'text', 1),
-- ('shops', 'business_type', 'ประเภทธุรกิจ', 'select', 2);
