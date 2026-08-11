const puppeteer = require('puppeteer');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const solarzUuids = [
  "27541927-a490-4d88-8e83-56e627db2396", // Supermercado Natianas
  "6e42c1c6-fdb0-4501-b66c-06e586fc2b82", // Sup Valdenice
  "c510a089-9302-4586-86a4-a6652f525034", // Galpão Valdenice
  "f39b11da-2d00-424f-871c-0c9a44243184", // Sup Valdenice Ltda
  "85f94804-bb42-4580-9342-1347b8428889"  // Atacad Tomezao
];

async function scrapeSolarZ() {
  console.log('Iniciando scraper do SolarZ...', new Date().toISOString());
  const browser = await puppeteer.launch({ headless: 'new' });
  
  for (const uuid of solarzUuids) {
    try {
      console.log(`Extraindo dados da usina: ${uuid}`);
      const page = await browser.newPage();
      await page.goto(`https://app.solarz.com.br/pages/shareable/usina/${uuid}`, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Esperar os números aparecerem
      await new Promise(r => setTimeout(r, 4000));
      
      const text = await page.evaluate(() => document.body.innerText);
      
      // Parse do texto
      // Exemplo de retorno: 
      // ONTEM \n 441,1kWh \n ESSA SEMANA \n 1.084,5kWh \n ESSE MÊS \n 5.587,3kWh \n ESSE ANO \n 58.686kWh
      let geracaoHoje = 0;
      let geracaoMes = 0;
      let geracaoTotal = 0;
      let power = 0; // O texto diz "AGORA ... OK", mas talvez a potência não esteja lá se offline.
      
      const lines = text.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === 'HOJE' || line === 'ONTEM') {
            let valStr = lines[i+1].replace(/[^\d.,]/g, '');
            // Se tiver ponto e vírgula, o ponto é milhar e a vírgula é decimal.
            // Se só tiver ponto, e 3 casas decimais, é milhar.
            valStr = valStr.replace(/\./g, '').replace(',', '.');
            geracaoHoje = parseFloat(valStr) || 0;
        }
        // Se HOJE não existir, tentar pegar ONTEM? Vamos focar no Hoje se existir, se não 0.
        if (line === 'ESSE MÊS') {
            let valStr = lines[i+1].replace(/[^\d.,]/g, '');
            valStr = valStr.replace(/\./g, '').replace(',', '.');
            geracaoMes = parseFloat(valStr) || 0;
        }
        if (line === 'ÚLTIMOS 12 MESES' || line === 'ESSE ANO') {
            let valStr = lines[i+1].replace(/[^\d.,]/g, '');
            valStr = valStr.replace(/\./g, '').replace(',', '.');
            geracaoTotal = parseFloat(valStr) || 0;
        }
        if (line.includes('AGORA')) {
            // Pode haver a potencia embaixo se online
        }
      }
      
      if (uuid) {
          console.log(`[${uuid}] Hoje: ${geracaoHoje}, Mês: ${geracaoMes}, Total: ${geracaoTotal}`);
          try {
              const fs = require('fs');
              const path = require('path');
              const cachePath = path.join(process.cwd(), 'solarz_cache.json');
              let cache = {};
              if (fs.existsSync(cachePath)) {
                  cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
              }
              cache[`SZ-${uuid}`] = {
                  generation_today: geracaoHoje,
                  generation_month: geracaoMes,
                  generation_total: geracaoTotal,
                  updated_at: new Date().toISOString()
              };
              fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
          } catch (err) {
              console.error(`Erro ao salvar cache da usina ${uuid}:`, err);
          }
      }
      
      await page.close();
    } catch (e) {
      console.error(`Erro ao raspar ${uuid}:`, e.message);
    }
  }
  
  await browser.close();
  console.log('Scraper finalizado!');
}

scrapeSolarZ();
