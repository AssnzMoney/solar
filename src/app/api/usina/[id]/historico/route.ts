import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const inverterId = params.id;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date'); // YYYY-MM-DD
  const type = searchParams.get('type'); // 'day' or 'month'

  if (!date || !type) {
    return NextResponse.json({ error: 'Parâmetros date e type são obrigatórios' }, { status: 400 });
  }

  try {
    // Integração Growatt
    if (inverterId.startsWith('GW-')) {
      const plantId = inverterId.replace('GW-', '');
      const growattToken = process.env.GROWATT_TOKEN;
      
      if (growattToken) {
        const endpoint = type === 'day' 
            ? `https://openapi.growatt.com/v1/plant/data?plant_id=${plantId}&date=${date}`
            : `https://openapi.growatt.com/v1/plant/energy?plant_id=${plantId}&start_date=${date}-01&end_date=${date}-31&time_unit=month`;
            
        try {
          const gwRes = await fetch(endpoint, { headers: { "Token": growattToken } });
          if (gwRes.ok) {
             const gwData = await gwRes.json();
             if (gwData.error_code === 0 && gwData.data) {
                return NextResponse.json({ 
                    source: 'growatt', 
                    type, 
                    data: gwData.data,
                    generation_today: gwData.data.today_energy,
                    generation_month: gwData.data.monthly_energy,
                    generation_total: gwData.data.total_energy
                });
             }
          }
        } catch (err) {
          console.warn("Erro ao buscar histórico da Growatt", err);
        }
      }
    }

    // Fallback: Tentar buscar do banco de dados (Supabase) se for do tipo 'day'
    if (type === 'day') {
      const supabase = await createClient();
      const startOfDay = new Date(`${date}T00:00:00-03:00`);
      const endOfDay = new Date(`${date}T23:59:59-03:00`);
      
      const { data: history } = await supabase
        .from('inverters_history')
        .select('*')
        .eq('inverter_id', inverterId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: true });

      if (history && history.length > 0) {
        return NextResponse.json({ source: 'supabase', type: 'day', history });
      }
    }

    // Se nenhuma API tiver os dados, retorna array vazio
    return NextResponse.json({
      source: 'none',
      type,
      history: [],
      message: 'Dados históricos não disponíveis para esta data/plataforma ainda.'
    });

  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
