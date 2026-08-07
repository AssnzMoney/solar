const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://vbpjljbrmiupzggguscc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicGpsamJybWl1cHpnZ2d1c2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNTk3MjMsImV4cCI6MjEwMTYzNTcyM30.YdXpZLTnEg1TzCWGTe7rZnqR_XwbJCyZkBmqqnXdMlI";
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanMockData() {
  const { data, error } = await supabase
    .from('inverters')
    .delete()
    .in('id', ['INV-001', 'INV-002', 'INV-003']);
    
  if (error) {
    console.error('Erro ao deletar:', error);
  } else {
    console.log('Mocks removidos com sucesso:', data);
  }
}

cleanMockData();
