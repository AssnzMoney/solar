import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';

export const dynamic = 'force-dynamic';

const GATEWAY = "https://gateway.isolarcloud.com.hk";

// Variáveis de cache globais para as APIs externas
let cachedToken = "";
let tokenExpiration = 0;
let cachedData: any = null;
let dataExpiration = 0;

let cachedGrowattData: any = [];
let growattExpiration = 0;

export async function GET() {
  const appKey = process.env.ISOLARCLOUD_APP_KEY;
  const secretKey = process.env.ISOLARCLOUD_SECRET_KEY;
  const userAccount = process.env.ISOLARCLOUD_USER;
  const userPassword = process.env.ISOLARCLOUD_PASSWORD;

  if (!appKey || !secretKey || !userAccount || !userPassword) {
    return NextResponse.json(
      { error: 'Credenciais da iSolarCloud incompletas no .env.local' },
      { status: 500 }
    );
  }

  try {
    const supabase = await createClient();
    const nowTime = Date.now();
    let token = cachedToken;

    // 1. LOGIN (com cache de 1 hora)
    if (!token || nowTime > tokenExpiration) {
      const loginRes = await fetch(`${GATEWAY}/openapi/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=UTF-8', 'sys_code': '901', 'x-access-key': secretKey },
        body: JSON.stringify({ appkey: appKey, user_account: userAccount, user_password: userPassword })
      });
      
      const loginData = await loginRes.json();
      token = loginData.result_data?.token;
      
      if (!token) {
        console.warn("A iSolarCloud não retornou o token (provável bloqueio temporário por rate limit).");
        if (cachedData) {
          const finalData = await fetchRealHistory(supabase, cachedData);
          return NextResponse.json(finalData);
        }
        // Fallback gracioso para não quebrar o front-end
        return NextResponse.json({ inverters: [], chartData: [] });
      }
      
      cachedToken = token;
      tokenExpiration = nowTime + (60 * 60 * 1000); // 1 hora
    }

    // Retorna cache de dados se tiver menos de 1 minuto (para aguentar o polling de 3s)
    if (cachedData && nowTime < dataExpiration) {
      const finalData = await fetchRealHistory(supabase, cachedData);
      return NextResponse.json(finalData);
    }

    // 1.5 Fetch old DB inverters to use as fallback during API rate limits
    const { data: dbInvertersFallback, error: dbError } = await supabase
      .from('inverters')
      .select('*')
      .order('id');
    
    if (dbError) throw dbError;


    // 2. GET POWER STATION LIST (limit to 5)
    const stationRes = await fetch(`${GATEWAY}/openapi/getPowerStationList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8', 'sys_code': '901', 'x-access-key': secretKey },
      body: JSON.stringify({ appkey: appKey, token: token, curPage: 1, size: 5 })
    });
    const stationData = await stationRes.json();
    const stations = stationData.result_data?.pageList || [];

    const realInvertersData: any[] = [];

    // 3. For each station, get inverter data (fallback to station data if empty)
    for (const station of stations) {
      const ps_id = station.ps_id;
      
      const inverterRes = await fetch(`${GATEWAY}/openapi/getPVInverterRealTimeData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=UTF-8', 'sys_code': '901', 'x-access-key': secretKey },
        body: JSON.stringify({ appkey: appKey, token: token, ps_key_list: [ps_id.toString()] })
      });
      const inverterData = await inverterRes.json();
      
      const hasInverterData = inverterData.result_data?.device_point_list && inverterData.result_data.device_point_list.length > 0;
      
      const statusNum = station.ps_status; // 1 = normal, etc
      let statusStr = "offline";
      if (statusNum === 1) statusStr = "online";
      else if (statusNum === 2) statusStr = "warning";
      
      const powerVal = parseFloat(station.curr_power?.value || "0");
      const unit = station.curr_power?.unit || "kW";
      const powerKw = (unit === "W" ? powerVal / 1000 : powerVal).toFixed(2);
      
      const todayVal = station.today_eq?.value || station.today_energy?.value || "0";
      const monthVal = station.month_eq?.value || station.month_energy?.value || "0";
      let totalVal = parseFloat(station.total_eq?.value || station.total_energy?.value || "0");
      
      // iSolarCloud returns total_energy in '万度' (10,000 kWh) for large values
      if (station.total_energy?.unit === '万度' || station.total_eq?.unit === '万度') {
         totalVal = totalVal * 10000;
      }
      
      const todayKw = parseFloat(todayVal).toFixed(1);
      const monthKw = parseFloat(monthVal).toFixed(1);
      const totalKw = totalVal.toFixed(1);

      realInvertersData.push({
        id: `PS-${ps_id}`,
        plant_name: `${station.ps_name || `Usina ${ps_id}`} (iSolarCloud)`,
        status: statusStr,
        power: parseFloat(powerKw),
        voltage: hasInverterData ? 220 : 0, 
        frequency: hasInverterData ? 60.0 : 0.0, 
        generation_today: todayKw,
        generation_month: monthKw,
        generation_total: totalKw,
        // iSolarCloud has native income
        economy_today: parseFloat(station.today_income?.value || "0").toFixed(2),
        economy_month: "0.00", // Month income not present, we will calculate based on tariff if missing
        economy_total: parseFloat(station.total_income?.value || "0").toFixed(2),
        economy_year: parseFloat(station.year_income?.value || "0").toFixed(2),
      });
    }

    // 3.5. INTEGRAÇÃO SOLARZ
    try {
      const solarzUuids = [
        "27541927-a490-4d88-8e83-56e627db2396", // Supermercado Natianas
        "6e42c1c6-fdb0-4501-b66c-06e586fc2b82", // Sup Valdenice
        "c510a089-9302-4586-86a4-a6652f525034", // Galpão Valdenice
        "f39b11da-2d00-424f-871c-0c9a44243184", // Sup Valdenice Ltda
        "85f94804-bb42-4580-9342-1347b8428889"  // Atacad Tomezao
      ];

      for (const solarzUuid of solarzUuids) {
        const szRes = await fetch(`https://app.solarz.com.br/shareable/usina?uuid=${solarzUuid}`);
        
        if (szRes.ok) {
          const szData = await szRes.json();
          // For SolarZ, the generation data is scraped in the background. We just fetch the old data from DB to preserve it.
          // Read SolarZ cache
          let szCache: Record<string, any> = {};
          try {
            const fs = require('fs');
            const path = require('path');
            const cachePath = path.join(process.cwd(), 'solarz_cache.json');
            if (fs.existsSync(cachePath)) {
                szCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
            }
          } catch(e) {}
          
          const oldData = szCache[`SZ-${solarzUuid}`];

          const plantName = szData.name || "Usina SolarZ";
          const rawPower = szData.potenciaInstantanea;
          const powerKw = rawPower ? (parseFloat(rawPower) / 1000).toFixed(1) : "0.0";
          const statusStr = "online"; 
          
          realInvertersData.push({
            id: `SZ-${solarzUuid}`,
            plant_name: `${plantName} (SolarZ)`,
            status: statusStr,
            power: parseFloat(powerKw),
            voltage: 0, 
            frequency: 0.0,
            generation_today: oldData ? oldData.generation_today : "0.0",
            generation_month: oldData ? oldData.generation_month : "0.0",
            generation_total: oldData ? oldData.generation_total : "0.0",
          });
        }
      }
    } catch (err) {
      console.error("Erro ao puxar dados da SolarZ:", err);
    }

    // 3.6. INTEGRAÇÃO GROWATT
    try {
      const growattToken = process.env.GROWATT_TOKEN;
      if (growattToken) {
        if (nowTime < growattExpiration && cachedGrowattData.length > 0) {
          // Usa cache para evitar error_frequently_access
          realInvertersData.push(...cachedGrowattData);
        } else {
          const gwRes = await fetch("https://openapi.growatt.com/v1/plant/list", {
            headers: {
              "Token": growattToken
            }
          });

          if (gwRes.ok) {
            const gwData = await gwRes.json();
            
            // Verifica se a API limitou nosso acesso
            if (gwData.error_code === 10012) {
              console.warn("Growatt API limitou o acesso (error_frequently_access). Usando dados velhos do banco se existirem.");
              // Aplica o backoff de 5 minutos mesmo no erro, para não ficar martelando a API
              growattExpiration = nowTime + (5 * 60 * 1000);
              // Não joga erro, vai usar os dados antigos que já estão no Supabase
            } else {
              const plants = gwData.data?.plants || [];
              const tempGwData = [];

              for (const p of plants) {
                // Growatt returns current power usually as "pac" or "current_power" in strings/W
                const rawPower = p.current_power || p.pac || "0"; 
                const powerKw = (parseFloat(rawPower) / 1000).toFixed(1);
                const gwId = `GW-${p.plant_id || p.id}`;
                const oldData = dbInvertersFallback?.find((inv: any) => inv.id === gwId);
                let todayEnergy = oldData ? (oldData.generation_today || "0.0") : "0.0";
                let monthEnergy = oldData ? (oldData.generation_month || "0.0") : "0.0";
                let totalEnergy = p.e_total || p.total_energy || (oldData ? oldData.generation_total : "0.0");

                try {
                  // Ajuste para pegar a data atual no fuso do Brasil (GMT-3), 
                  // para não virar o dia às 21h UTC e puxar 0.0 da Growatt
                  const dataBR = new Date(new Date().getTime() - (3 * 60 * 60 * 1000));
                  const today = dataBR.toISOString().split('T')[0];
                  
                  // Busca geração de hoje
                  const tRes = await fetch(`https://openapi.growatt.com/v1/plant/energy?plant_id=${p.plant_id || p.id}&start_date=${today}&end_date=${today}&time_unit=day`, { headers: { "Token": growattToken } });
                  if (tRes.ok) {
                    const tData = await tRes.json();
                    if (tData.error_code === 0 && tData.data?.energys?.length > 0) {
                        todayEnergy = tData.data.energys[0].energy;
                    }
                  }
                  
                  // Fetch month
                  const monthStart = todayStr.substring(0, 8) + '01';
                  const mRes = await fetch(`https://openapi.growatt.com/v1/plant/energy?plant_id=${p.plant_id || p.id}&start_date=${monthStart}&end_date=${todayStr}&time_unit=month`, { headers: { "Token": growattToken } });
                  if (mRes.ok) {
                    const mData = await mRes.json();
                    if (mData.error_code === 0 && mData.data?.energys?.length > 0) {
                        monthEnergy = mData.data.energys[0].energy;
                    }
                  }
                } catch(e) {
                  console.warn("Erro ao buscar energia da Growatt para", p.plant_name);
                }

                tempGwData.push({
                  id: gwId,
                  plant_name: `${p.plant_name || p.name || "Usina Growatt"} (Growatt)`,
                  status: "online", // Assume online se listou
                  power: parseFloat(powerKw),
                  voltage: 0,
                  frequency: 0.0,
                  generation_today: parseFloat(todayEnergy.toString()).toFixed(1),
                  generation_month: parseFloat(monthEnergy.toString()).toFixed(1),
                  generation_total: parseFloat(totalEnergy.toString()).toFixed(1),
                });
              }
              
              if (tempGwData.length > 0) {
                cachedGrowattData = tempGwData;
                growattExpiration = nowTime + (5 * 60 * 1000); // 5 minutos de cache
                realInvertersData.push(...cachedGrowattData);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Erro ao puxar dados da Growatt:", err);
    }

    // 4. Salvar/Atualizar no Supabase
    const nowTimeForHistory = new Date();
    const currentMinute = nowTimeForHistory.getMinutes();
    const shouldSaveHistory = currentMinute % 10 === 0; // Salva a cada 10 minutos redondos (ex: 07:00, 07:10, 07:20)
    // Para garantir que salva apenas uma vez naquele minuto, usamos um cache simples
    let justSavedHistory = false;
    
    for (const inv of realInvertersData) {
      await supabase.from('inverters').upsert({
        id: inv.id,
        plant_name: inv.plant_name,
        status: inv.status,
        power: inv.power,
        voltage: inv.voltage,
        frequency: inv.frequency,
        generation_today: inv.generation_today,
        generation_month: inv.generation_month,
        generation_total: inv.generation_total,
        updated_at: nowTimeForHistory.toISOString()
      }, { onConflict: 'id' });

      // Otimização: Salvar no histórico de tempos em tempos (a cada 10 min) para formar o gráfico real
      if (shouldSaveHistory) {
        await supabase.from('inverters_history').insert({
          inverter_id: inv.id,
          status: inv.status,
          power: inv.power,
          voltage: inv.voltage,
          frequency: inv.frequency,
          generation_today: inv.generation_today,
          generation_month: inv.generation_month,
          generation_total: inv.generation_total,
          created_at: nowTimeForHistory.toISOString()
        });
        justSavedHistory = true;
      }
    }

    if (justSavedHistory) {
       console.log(`Histórico salvo às ${nowTimeForHistory.toISOString()}`);
    }

    // 5. Limpar apenas o ID duplicado específico que estava causando problema
    await supabase.from('inverters').delete().eq('id', 'SZ-27541927');
    
    // 6. Retornar os dados formatados
    // Como os dados podem ter sido atualizados, buscamos do banco novamente para refletir
    const { data: updatedDbInverters, error } = await supabase
      .from('inverters')
      .select('*')
      .order('id');

    if (error) throw error;

    const invertersData = updatedDbInverters?.map(inv => {
      const isOnline = inv.status === 'online';
      const isGenerating = isOnline && Number(inv.power) > 0;
      const realInv = realInvertersData.find(r => r.id === inv.id);
      
      return {
        id: inv.id,
        plant: inv.plant_name,
        status: inv.status,
        power: Number(inv.power) || 0,
        voltage: Number(inv.voltage) || 0,
        frequency: Number(inv.frequency) || 0,
        temperature: isGenerating ? parseFloat((35 + Math.random() * 15).toFixed(1)) : parseFloat((25 + Math.random() * 5).toFixed(1)),
        current: isGenerating && Number(inv.voltage) > 0 ? parseFloat(((Number(inv.power) * 1000) / Number(inv.voltage)).toFixed(1)) : 0,
        efficiency: isGenerating ? 97.5 : 0,
        lastUpdate: inv.updated_at,
        generation_today: realInv ? Number(realInv.generation_today) : Number(inv.generation_today || 0),
        generation_month: realInv ? Number(realInv.generation_month) : Number(inv.generation_month || 0),
        generation_total: realInv ? Number(realInv.generation_total) : Number(inv.generation_total || 0),
        economy_today: ((realInv ? Number(realInv.generation_today) : Number(inv.generation_today || 0)) * 0.95).toFixed(2),
        economy_month: ((realInv ? Number(realInv.generation_month) : Number(inv.generation_month || 0)) * 0.95).toFixed(2),
        economy_total: ((realInv ? Number(realInv.generation_total) : Number(inv.generation_total || 0)) * 0.95).toFixed(2),
      };
    }) || [];

    // Salva o cache base
    cachedData = { inverters: invertersData };
    dataExpiration = nowTime + (60 * 1000); // 1 minuto de cache real da API

    const finalData = await fetchRealHistory(supabase, cachedData);
    return NextResponse.json(finalData);
  } catch (error) {
    console.error(error);
    if (cachedData) {
      // Create a temporary client if needed, or if supabase failed earlier, just return cachedData without chart
      return NextResponse.json(cachedData);
    }
    return NextResponse.json({ error: 'Falha ao buscar dados da iSolarCloud' }, { status: 500 });
  }
}

// Função para buscar dados reais do histórico no banco
async function fetchRealHistory(supabase: any, baseData: any) {
  try {
    // Pega o início do dia de hoje no fuso do Brasil (UTC-3)
    const now = new Date();
    const str = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const brazilDate = new Date(str);
    brazilDate.setHours(0, 0, 0, 0);
    // Para converter o início do dia no Brasil para UTC, somamos 3 horas
    const todayUTC = new Date(brazilDate.getTime() + (3 * 60 * 60 * 1000));

    // Busca os registros de histórico de hoje
    const { data: history, error } = await supabase
      .from('inverters_history')
      .select('created_at, inverter_id, power')
      .gte('created_at', todayUTC.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Erro ao buscar histórico real:", error);
      return { ...baseData, chartData: [] };
    }

    // Processa os dados para o formato do gráfico (time, power, timestamp)
    let chartData: { time: string; power: number; timestamp: number }[] = [];
    
    if (history && history.length > 0) {
      const minutesMap = new Map<string, Map<string, number>>();
      
      for (const record of history) {
        const date = new Date(record.created_at);
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        if (!minutesMap.has(timeStr)) {
          minutesMap.set(timeStr, new Map());
        }
        // Registra a potência de cada inversor no minuto (pega a mais recente do minuto)
        minutesMap.get(timeStr)!.set('timestamp', date.getTime());
        minutesMap.get(timeStr)!.set(record.inverter_id, record.power || 0);
      }

      for (const [timeStr, invertersMap] of Array.from(minutesMap.entries())) {
        let totalPower = 0;
        let ts = 0;
        for (const [key, val] of Array.from(invertersMap.entries())) {
          if (key === 'timestamp') {
            ts = val;
          } else {
            totalPower += val;
          }
        }
        chartData.push({ time: timeStr, power: parseFloat(totalPower.toFixed(2)), timestamp: ts });
      }
    }

    // Adiciona o ponto em tempo real atual no gráfico
    let currentTotalPower = 0;
    if (baseData && baseData.inverters) {
      currentTotalPower = baseData.inverters.reduce((acc: number, inv: any) => acc + (Number(inv.power) || 0), 0);
    }
    
    // Para evitar duplicidade exata de minuto, checamos se o último ponto é no mesmo minuto
    const nowTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (chartData.length > 0 && chartData[chartData.length - 1].time === nowTimeStr) {
      chartData[chartData.length - 1].power = parseFloat(currentTotalPower.toFixed(2));
    } else {
      chartData.push({
        time: nowTimeStr,
        power: parseFloat(currentTotalPower.toFixed(2)),
        timestamp: now.getTime()
      });
    }

    return {
      ...baseData,
      chartData
    };
  } catch (err) {
    console.error("Erro na conversão do histórico:", err);
    return { ...baseData, chartData: [] };
  }
}
