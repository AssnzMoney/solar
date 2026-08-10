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

    if (finalHistory.length < 2) {
      // Se não tem histórico suficiente, pegamos a potência atual do inversor
      const currentPower = Number(inverter.power) || 0;
      finalHistory = [];
      const now = new Date();
      // Cria uma linha para a última hora a cada 10 min
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 10 * 60000); 
        finalHistory.push({
          inverter_id: inverterId,
          power: i === 0 ? parseFloat(currentPower.toFixed(2)) : 0,
          created_at: d.toISOString()
        });
      }
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
