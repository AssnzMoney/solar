const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createHistoryTable() {
  console.log("Tentando criar inverters_history...");
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS inverters_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          inverter_id TEXT NOT NULL,
          power NUMERIC NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
      ALTER TABLE inverters_history DISABLE ROW LEVEL SECURITY;
    `
  });

  if (error) {
    console.error("RPC error (maybe rpc not defined):", error.message);
    console.log("Vamos inserir via API REST para criar a tabela se estiver habilitado o auto-schema, ou precisaremos fazer de outra forma.");
  } else {
    console.log("Sucesso ao criar tabela (RPC).");
  }
}

createHistoryTable();
