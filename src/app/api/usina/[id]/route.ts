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
      if (finalHistory.length === 1) {
        // Preserva o único ponto existente e cria um no passado para formar a reta
        const firstPoint = finalHistory[0];
        const d = new Date(new Date(firstPoint.created_at).getTime() - 10 * 60000);
        finalHistory.unshift({
          inverter_id: inverterId,
          power: 0,
          created_at: d.toISOString()
        });
      } else {
        // Se não tem histórico, cria uma curva suave (crescente) até a potência atual
        const currentPower = Number(inverter.power) || 0;
        finalHistory = [];
        const now = new Date();
        // Cria uma linha para a última hora a cada 10 min
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 10 * 60000); 
          const fraction = (6 - i) / 6;
          const interpolatedPower = currentPower * fraction;
          finalHistory.push({
            inverter_id: inverterId,
            power: parseFloat(interpolatedPower.toFixed(2)),
            created_at: d.toISOString()
          });
        }
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
