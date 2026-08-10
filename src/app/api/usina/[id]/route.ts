import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const inverterId = params.id;

  try {
    // 1. Buscar dados da usina
    const { data: inverter, error: invError } = await supabase
      .from('inverters')
      .select('*')
      .eq('id', inverterId)
      .single();

    if (invError || !inverter) {
      return NextResponse.json({ error: 'Usina não encontrada' }, { status: 404 });
    }

    // 2. Buscar histórico de hoje (para o gráfico) - Considerando fuso do Brasil (UTC-3)
    const now = new Date();
    const str = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const brazilDate = new Date(str);
    brazilDate.setHours(0, 0, 0, 0);
    // Para converter o início do dia no Brasil para UTC, somamos 3 horas
    const todayUTC = new Date(brazilDate.getTime() + (3 * 60 * 60 * 1000));
    
    const { data: history, error: histError } = await supabase
      .from('inverters_history')
      .select('*')
      .eq('inverter_id', inverterId)
      .gte('created_at', todayUTC.toISOString())
      .order('created_at', { ascending: true });

    let finalHistory = history || [];

    // Adiciona o ponto em tempo real atual no gráfico
    const currentPower = Number(inverter.power) || 0;
    const nowTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Se o último ponto for no mesmo minuto, apenas atualiza
    if (finalHistory.length > 0 && finalHistory[finalHistory.length - 1].created_at) {
       const lastDate = new Date(finalHistory[finalHistory.length - 1].created_at);
       const lastTimeStr = `${lastDate.getHours().toString().padStart(2, '0')}:${lastDate.getMinutes().toString().padStart(2, '0')}`;
       if (lastTimeStr === nowTimeStr) {
           finalHistory[finalHistory.length - 1].power = parseFloat(currentPower.toFixed(2));
       } else {
           finalHistory.push({
             inverter_id: inverterId,
             power: parseFloat(currentPower.toFixed(2)),
             created_at: now.toISOString()
           });
       }
    } else {
       finalHistory.push({
         inverter_id: inverterId,
         power: parseFloat(currentPower.toFixed(2)),
         created_at: now.toISOString()
       });
    }

    return NextResponse.json({
      inverter,
      history: finalHistory
    });

  } catch (error: any) {
    console.error('Erro ao buscar usina:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
