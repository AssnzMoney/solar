import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Buscar últimos 10 logs da IA no banco
    const { data: logs, error } = await supabase
      .from('ai_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      // Caso a tabela ainda não exista no Supabase, retornar array vazio
      if (error.code === '42P01') {
        return NextResponse.json({ logs: [] });
      }
      throw error;
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error("Erro ao buscar logs da IA:", error);
    return NextResponse.json({ error: 'Falha ao buscar logs da IA' }, { status: 500 });
  }
}
