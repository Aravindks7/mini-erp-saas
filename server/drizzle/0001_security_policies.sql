-- ============================================================================
-- MULTI-TENANT ROW LEVEL SECURITY (RLS) ENFORCEMENT
-- ============================================================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. Automated RLS for all business tables
    FOR r IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'organization_id' 
        AND table_schema = 'public'
        AND table_name != 'organizations'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.table_name);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', r.table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS organization_isolation_policy ON %I', r.table_name);
        
        EXECUTE format(
            'CREATE POLICY organization_isolation_policy ON %I 
             FOR ALL 
             TO public 
             USING (organization_id = NULLIF(current_setting(''app.current_organization_id'', true), '''')::uuid)', 
            r.table_name
        );
        
        RAISE NOTICE 'Applied Clinical RLS Isolation Policy to table: %', r.table_name;
    END LOOP;

    -- 2. Membership-based policy for the root 'organizations' table
    ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS organization_membership_policy ON organizations;
    CREATE POLICY organization_membership_policy ON organizations
    FOR SELECT
    TO public
    USING (id IN (
        SELECT organization_id FROM organization_memberships 
        WHERE user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    ));

    RAISE NOTICE 'Applied Membership-based RLS Isolation Policy to table: organizations';
END $$;
