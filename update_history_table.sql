-- Atualização da tabela de histórico para salvar dados completos

ALTER TABLE inverters_history ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE inverters_history ADD COLUMN IF NOT EXISTS voltage NUMERIC;
ALTER TABLE inverters_history ADD COLUMN IF NOT EXISTS frequency NUMERIC;
ALTER TABLE inverters_history ADD COLUMN IF NOT EXISTS generation_today NUMERIC;
ALTER TABLE inverters_history ADD COLUMN IF NOT EXISTS generation_month NUMERIC;
ALTER TABLE inverters_history ADD COLUMN IF NOT EXISTS generation_total NUMERIC;
