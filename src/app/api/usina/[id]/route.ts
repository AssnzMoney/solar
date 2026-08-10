import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

    // 2. Buscar histórico de hoje (para o gráfico)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: history, error: histError } = await supabase
      .from('inverters_history')
      .select('*')
      .eq('inverter_id', inverterId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: true });

    return NextResponse.json({
      inverter,
      history: history || []
    });

  } catch (error: any) {
    console.error('Erro ao buscar usina:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
