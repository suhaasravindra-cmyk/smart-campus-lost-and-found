-- ==========================================================
-- SMART CAMPUS LOST-AND-FOUND PLATFORM
-- Migration 04: Automated Audit Logging Triggers
-- ==========================================================

-- Trigger Function: Automatically records status transitions
CREATE OR REPLACE FUNCTION fn_audit_item_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO item_audit_log (
            table_name,
            record_id,
            old_status,
            new_status,
            changed_by,
            changed_at
        )
        VALUES (
            TG_TABLE_NAME,
            CASE 
                WHEN TG_TABLE_NAME = 'found_items' THEN NEW.found_id
                ELSE NEW.lost_id
            END,
            OLD.status,
            NEW.status,
            COALESCE(current_setting('app.current_user', true), CURRENT_USER),
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Trigger to found_items table
DROP TRIGGER IF EXISTS trg_audit_found_item_status ON found_items;
CREATE TRIGGER trg_audit_found_item_status
AFTER UPDATE OF status ON found_items
FOR EACH ROW
EXECUTE FUNCTION fn_audit_item_status_change();

-- Apply Trigger to lost_items table
DROP TRIGGER IF EXISTS trg_audit_lost_item_status ON lost_items;
CREATE TRIGGER trg_audit_lost_item_status
AFTER UPDATE OF status ON lost_items
FOR EACH ROW
EXECUTE FUNCTION fn_audit_item_status_change();
