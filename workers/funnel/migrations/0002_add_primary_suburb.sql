ALTER TABLE leads ADD COLUMN primary_suburb TEXT;

UPDATE component_health
SET safe_detail_json = '{"schemaVersion":"2"}',
    status = 'healthy',
    updated_at = CURRENT_TIMESTAMP
WHERE component = 'schema';
