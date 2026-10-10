-- Pinterest publisher support. Run after migration_connected_accounts.sql.
-- Existing connected_accounts rows are preserved.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'connected_accounts_provider_check') THEN
    ALTER TABLE connected_accounts DROP CONSTRAINT connected_accounts_provider_check;
  END IF;
  ALTER TABLE connected_accounts ADD CONSTRAINT connected_accounts_provider_check CHECK (provider IN ('tiktok','youtube','instagram','meta','pinterest','shopify','woocommerce'));
END $$;