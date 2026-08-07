const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações da UAZAPI
const token = process.env.UAZAPI_TOKEN;
const apiUrl = process.env.UAZAPI_URL + "/send/text";
const phone = process.env.WHATSAPP_PHONE;

async function checkAndNotify() {
  console.log(`[${new Date().toISOString()}] Iniciando verificação de saúde das usinas...`);

  try {
    const { data: inverters, error } = await supabase
      .from('inverters')
      .select('id, plant_name, status');

    if (error) {
      console.error("Erro ao acessar banco de dados:", error);
      return;
    }

    if (!inverters || inverters.length === 0) {
      console.log("Nenhuma usina encontrada no banco.");
      return;
    }

    // Verifica se TODAS estão online
    const allOnline = inverters.every(inv => inv.status === 'online');

    if (allOnline) {
      console.log("Todas as usinas estão OK. Enviando notificação...");
      
      const text = `*[SolarMonitor]* ☀️\n\nTudo certo por aqui! Todas as suas usinas estão operando perfeitamente e conectadas à rede.`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': token,
          'api-key': token,
          'Authorization': `Bearer ${token}`,
          'token': token,
          'Client-Token': token,
          'instance_token': token
        },
        body: JSON.stringify({
          number: phone,
          text: text
        })
      });

      if (response.ok) {
        console.log("Notificação enviada com sucesso no WhatsApp!");
      } else {
        console.error("Falha ao enviar notificação UAZAPI:", await response.text());
      }
    } else {
      console.log("Nem todas as usinas estão online. Nenhuma notificação enviada.");
    }
  } catch (err) {
    console.error("Erro fatal no bot:", err);
  }
}

// Executar a cada 50 minutos (50 * 60 * 1000 ms)
const INTERVALO = 50 * 60 * 1000;

console.log("Bot do WhatsApp iniciado! Verificando a cada 50 minutos...");
// Executa imediatamente na primeira vez
checkAndNotify();
// Agenda as próximas execuções
setInterval(checkAndNotify, INTERVALO);
