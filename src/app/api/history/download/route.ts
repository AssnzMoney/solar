import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Busca todo o histórico ordenado por data e por inversor
    const { data: history, error } = await supabase
      .from('inverters_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!history || history.length === 0) {
      return new NextResponse('Nenhum dado encontrado no histórico.', { status: 404 });
    }

    // Cabecalhos do CSV
    const headers = [
      'Data/Hora',
      'ID Inversor',
      'Status',
      'Potência Instantânea (kW)',
      'Tensão (V)',
      'Frequência (Hz)',
      'Geração Hoje (kWh)',
      'Geração Mês (kWh)',
      'Geração Total (kWh)'
    ];

    // Monta as linhas do CSV
    const csvRows = [];
    csvRows.push(headers.join(',')); // Linha de cabeçalho

    for (const record of history) {
      const dateStr = new Date(record.created_at).toLocaleString('pt-BR');
      
      const row = [
        `"${dateStr}"`,
        `"${record.inverter_id || ''}"`,
        `"${record.status || ''}"`,
        record.power || 0,
        record.voltage || 0,
        record.frequency || 0,
        record.generation_today || 0,
        record.generation_month || 0,
        record.generation_total || 0
      ];

      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    
    // Adiciona o BOM do UTF-8 para o Excel reconhecer os acentos
    const bom = '\uFEFF';

    // Retorna a resposta forçando o download
    return new NextResponse(bom + csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="historico_inversores.csv"'
      }
    });
    
  } catch (err: any) {
    console.error("Erro ao gerar CSV:", err);
    return new NextResponse(`Erro ao gerar arquivo CSV: ${err.message}`, { status: 500 });
  }
}
