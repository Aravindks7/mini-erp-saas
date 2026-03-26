-- Custom SQL migration file, put your code below! --
-- Enable Row Level Security for all business tables
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_ledgers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_levels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales_order_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_order_lines" ENABLE ROW LEVEL SECURITY;

-- Create isolation policies based on the 'app.current_organization_id' session variable
-- We use current_setting to retrieve the organization ID set by the middleware

CREATE POLICY tenant_isolation_policy ON "customers"
USING ("organization_id" = (current_setting('app.current_organization_id')::uuid));

CREATE POLICY tenant_isolation_policy ON "products"
USING ("organization_id" = (current_setting('app.current_organization_id')::uuid));

CREATE POLICY tenant_isolation_policy ON "suppliers"
USING ("organization_id" = (current_setting('app.current_organization_id')::uuid));

CREATE POLICY tenant_isolation_policy ON "inventory_ledgers"
USING ("organization_id" = (current_setting('app.current_organization_id')::uuid));

CREATE POLICY tenant_isolation_policy ON "inventory_levels"
USING ("organization_id" = (current_setting('app.current_organization_id')::uuid));

CREATE POLICY tenant_isolation_policy ON "sales_orders"
USING ("organization_id" = (current_setting('app.current_organization_id')::uuid));

CREATE POLICY tenant_isolation_policy ON "sales_order_lines"
USING ("organization_id" = (current_setting('app.current_organization_id')::uuid));

CREATE POLICY tenant_isolation_policy ON "purchase_orders"
USING ("organization_id" = (current_setting('app.current_organization_id')::uuid));

CREATE POLICY tenant_isolation_policy ON "purchase_order_lines"
USING ("organization_id" = (current_setting('app.current_organization_id')::uuid));
