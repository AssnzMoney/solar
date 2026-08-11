const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateHistoryTable() {
  console.log("Atualizando a tabela inverters_history...");
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE inverters_history ADD COLUMN IF NOT EXISTS status TEXT;
      ALTER TABLE inverters_history ADD COLUMN IF NOT EXISTS voltage NUMERIC;
      ALTER TABLE inverters_history ADD COLUMN IF NOT EXISTS frequency NUMERIC;
      ALTER TABLE inverters_history ADD COLUMN IF NOT EXISTS generation_today NUMERIC;
      ALTER TABLE inverters_history ADD COLUMN IF NOT EXISTS generation_month NUMERIC;
      ALTER TABLE inverters_history ADD COLUMN IF NOT EXISTS generation_total NUMERIC;
    `
  });

  if (error) {
    console.error("Erro ao executar as queries de migração (via RPC):", error.message);
  } else {
    console.log("Sucesso ao atualizar a tabela via RPC!");
  }
}

updateHistoryTable();
