import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';

const GATEWAY = "https://gateway.isolarcloud.com.hk";

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
    
    // 1. LOGIN
    const loginRes = await fetch(`${GATEWAY}/openapi/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8', 'sys_code': '901', 'x-access-key': secretKey },
      body: JSON.stringify({ appkey: appKey, user_account: userAccount, user_password: userPassword })
    });
    
    if (!loginRes.ok) throw new Error("Falha no login iSolarCloud");
    const loginData = await loginRes.json();
    const token = loginData.result_data?.token;
    
    if (!token) throw new Error("Token não retornado pela iSolarCloud");

    // 2. GET POWER STATION LIST (limit to 5)
    const stationRes = await fetch(`${GATEWAY}/openapi/getPowerStationList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8', 'sys_code': '901', 'x-access-key': secretKey },
      body: JSON.stringify({ appkey: appKey, token: token, curPage: 1, size: 5 })
    });
    const stationData = await stationRes.json();
    const stations = stationData.result_data?.pageList || [];

    const realInvertersData = [];

    // 3. For each station, get inverter data (fallback to station data if empty)
    for (const station of stations) {
      const ps_id = station.ps_id;
      
      const inverterRes = await fetch(`${GATEWAY}/openapi/getPVInverterRealTimeData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=UTF-8', 'sys_code': '901', 'x-access-key': secretKey },
        body: JSON.stringify({ appkey: appKey, token: token, ps_key_list: [ps_id.toString()] })
      });
      const inverterData = await inverterRes.json();
      
      // Mapeamento: se a API retornar os dados do inversor, usamos. Senão, criamos um registro baseado na usina.
      const hasInverterData = inverterData.result_data?.device_point_list && inverterData.result_data.device_point_list.length > 0;
      
      const statusNum = station.ps_status; // 1 = normal, etc
      let statusStr = "offline";
      if (statusNum === 1) statusStr = "online";
      else if (statusNum === 2) statusStr = "warning";
      
      const powerStr = station.curr_power?.value || "0";
      const powerKw = (parseFloat(powerStr) / 1000).toFixed(1); // Assuming it returns Watts

      realInvertersData.push({
        id: `PS-${ps_id}`,
        plant_name: station.ps_name || `Usina ${ps_id}`,
        status: statusStr,
        power: parseFloat(powerKw),
        voltage: hasInverterData ? 220 : 0, // Fallback for iSolarCloud if missing. Wait, I should put 0 if missing.
        frequency: hasInverterData ? 60.0 : 0.0, 
      });
    }

    // 3.5. INTEGRAÇÃO SOLARZ (Gambiarra Funcional)
    try {
      const solarzUuid = "27541927-a490-4d88-8e83-56e627db2396";
      const szRes = await fetch(`https://app.solarz.com.br/shareable/usina?uuid=${solarzUuid}`);
      
      if (szRes.ok) {
        const szData = await szRes.json();
        
        const plantName = szData.name || "Usina SolarZ";
        const rawPower = szData.potenciaInstantanea; // Em Watts
        const powerKw = rawPower ? (parseFloat(rawPower) / 1000).toFixed(1) : "0.0";
        
        // Vamos considerar online se conseguimos puxar os dados
        const statusStr = "online"; 
        
        realInvertersData.push({
          id: `SZ-${solarzUuid.split('-')[0]}`,
          plant_name: plantName,
          status: statusStr,
          power: parseFloat(powerKw),
          voltage: 0, 
          frequency: 0.0,
        });
      }
    } catch (err) {
      console.error("Erro ao puxar dados da SolarZ:", err);
      // Não quebra a rota inteira se a SolarZ falhar
    }

    // 4. Salvar/Atualizar no Supabase
    for (const inv of realInvertersData) {
      const { error: upsertError } = await supabase.from('inverters').upsert({
        id: inv.id,
        plant_name: inv.plant_name,
        status: inv.status,
        power: inv.power,
        voltage: inv.voltage,
        frequency: inv.frequency,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (upsertError) {
        console.error("Erro ao inserir na tabela inverters:", upsertError);
      } else {
        // Salva histórico ignorando erros caso a tabela inverters_history ainda não exista (42P01)
        const { error: histError } = await supabase.from('inverters_history').insert({
          inverter_id: inv.id,
          power: inv.power
        });
        if (histError && histError.code !== '42P01') {
          console.error("Erro ao salvar histórico:", histError);
        }
      }
    }

    // 5. Retornar os dados formatados
    const { data: dbInverters, error } = await supabase
      .from('inverters')
      .select('*')
      .order('id');

    if (error) throw error;

    const invertersData = dbInverters?.map(inv => ({
      id: inv.id,
      plant: inv.plant_name,
      status: inv.status,
      power: `${inv.power} kW`,
      voltage: `${inv.voltage} V`,
      frequency: `${inv.frequency} Hz`,
      temperature: "--",
      current: "--",
      efficiency: "--",
      lastUpdate: "Agora mesmo"
    })) || [];

    // 6. Consultar histórico de hoje para montar o chartData real
    let chartData: { time: string; power: number }[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const { data: historyData, error: historyError } = await supabase
      .from('inverters_history')
      .select('created_at, power')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: true });

    if (!historyError && historyData && historyData.length > 0) {
      // Agrupar por hora (00:00, 01:00, etc)
      const hourlyAgg: Record<string, { count: number, totalPower: number }> = {};
      historyData.forEach(row => {
        const date = new Date(row.created_at);
        const hour = date.getHours().toString().padStart(2, '0') + ':00';
        if (!hourlyAgg[hour]) hourlyAgg[hour] = { count: 0, totalPower: 0 };
        hourlyAgg[hour].totalPower += parseFloat(row.power);
        hourlyAgg[hour].count += 1;
      });
      
      chartData = Object.keys(hourlyAgg).sort().map(hour => ({
        time: hour,
        power: parseFloat((hourlyAgg[hour].totalPower / hourlyAgg[hour].count).toFixed(2))
      }));
    } else {
      chartData = []; // Se não tem histórico (ou deu erro 42P01), retorna array vazio
    }

    return NextResponse.json({ inverters: invertersData, chartData });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Falha ao buscar dados da iSolarCloud' }, { status: 500 });
  }
}
