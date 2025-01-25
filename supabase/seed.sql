-- Use supabase built-in feature called Vault to encrypts the data by storing the keys outside supabase
-- Vaults can be used for configuration as well as secrets
select vault.create_secret(
  'http://api.supabase.internal:8000',
  'supabase_url'
);
