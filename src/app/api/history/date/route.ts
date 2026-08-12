import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json({ error: 'Parâmetro "date" é obrigatório (YYYY-MM-DD)' }, { status: 400 });
    }

    const supabase = await createClient();

    // The date is provided in local time (e.g. 2026-08-10)
    // BRT is UTC-3. So "2026-08-10" starts at "2026-08-10T03:00:00.000Z" and ends at "2026-08-11T03:00:00.000Z"
    const startDateUTC = new Date(`${dateParam}T03:00:00.000Z`);
    
    // Add 1 day to get the end date
    const endDateUTC = new Date(startDateUTC.getTime() + (24 * 60 * 60 * 1000));

    // Fetch all history records for that day
    const { data: history, error } = await supabase
      .from('inverters_history')
      .select('created_at, inverter_id, status, power, voltage, frequency, generation_today, generation_month, generation_total')
      .gte('created_at', startDateUTC.toISOString())
      .lt('created_at', endDateUTC.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    if (!history || history.length === 0) {
       return NextResponse.json({ inverters: [], chartData: [] });
    }

    // Process chart data and find the latest snapshot for each inverter to represent the "end of day" values
    let chartData: { time: string; power: number; timestamp: number }[] = [];
    const latestSnapshotMap = new Map<string, any>();
    const maxPowerMap = new Map<string, number>();
    const maxGenTodayMap = new Map<string, number>();
    const maxGenMonthMap = new Map<string, number>();
    const maxGenTotalMap = new Map<string, number>();
    
    const minutesMap = new Map<string, Map<string, number>>();
      
    for (const record of history) {
      // Keep track of the latest record for the summary table
      latestSnapshotMap.set(record.inverter_id, record);

      // Track max values
      const currentMaxPower = maxPowerMap.get(record.inverter_id) || 0;
      if (Number(record.power) > currentMaxPower) maxPowerMap.set(record.inverter_id, Number(record.power));

      const currentMaxGenToday = maxGenTodayMap.get(record.inverter_id) || 0;
      if (Number(record.generation_today) > currentMaxGenToday) maxGenTodayMap.set(record.inverter_id, Number(record.generation_today));

      const currentMaxGenMonth = maxGenMonthMap.get(record.inverter_id) || 0;
      if (Number(record.generation_month) > currentMaxGenMonth) maxGenMonthMap.set(record.inverter_id, Number(record.generation_month));

      const currentMaxGenTotal = maxGenTotalMap.get(record.inverter_id) || 0;
      if (Number(record.generation_total) > currentMaxGenTotal) maxGenTotalMap.set(record.inverter_id, Number(record.generation_total));

      // We need to convert UTC to BRT for the chart labels
      const recordDate = new Date(record.created_at);
      const brtDate = new Date(recordDate.getTime() - (3 * 60 * 60 * 1000));
      
      const timeStr = `${brtDate.getUTCHours().toString().padStart(2, '0')}:${brtDate.getUTCMinutes().toString().padStart(2, '0')}`;
      
      if (!minutesMap.has(timeStr)) {
        minutesMap.set(timeStr, new Map());
      }
      minutesMap.get(timeStr)!.set('timestamp', recordDate.getTime());
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

    // Now format the inverters list using the latest snapshot of that day
    // We also need plant names which are in the 'inverters' table
    const { data: invertersInfo } = await supabase.from('inverters').select('id, plant_name');
    const plantNamesMap = new Map(invertersInfo?.map(i => [i.id, i.plant_name]) || []);

    const invertersData = Array.from(latestSnapshotMap.values()).map(inv => {
      return {
        id: inv.inverter_id,
        plant: plantNamesMap.get(inv.inverter_id) || inv.inverter_id,
        status: inv.status,
        power: maxPowerMap.get(inv.inverter_id) || 0,
        voltage: Number(inv.voltage) || 0,
        frequency: Number(inv.frequency) || 0,
        temperature: 25.0, // dummy history value
        current: 0,
        efficiency: 0,
        lastUpdate: inv.created_at,
        generation_today: maxGenTodayMap.get(inv.inverter_id) || Number(inv.generation_today || 0),
        generation_month: maxGenMonthMap.get(inv.inverter_id) || Number(inv.generation_month || 0),
        generation_total: maxGenTotalMap.get(inv.inverter_id) || Number(inv.generation_total || 0),
        economy_today: ((maxGenTodayMap.get(inv.inverter_id) || Number(inv.generation_today || 0)) * 0.95).toFixed(2),
        economy_month: ((maxGenMonthMap.get(inv.inverter_id) || Number(inv.generation_month || 0)) * 0.95).toFixed(2),
        economy_total: ((maxGenTotalMap.get(inv.inverter_id) || Number(inv.generation_total || 0)) * 0.95).toFixed(2),
      };
    });

    // Sort by generation_today descending (most generation first)
    invertersData.sort((a, b) => b.generation_today - a.generation_today);

    return NextResponse.json({
      inverters: invertersData,
      chartData
    });

  } catch (error) {
    console.error("Erro ao buscar histórico por data:", error);
    return NextResponse.json({ error: 'Falha ao buscar histórico' }, { status: 500 });
  }
}
