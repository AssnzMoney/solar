import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 1. Busca os dados reais dos inversores salvos no banco
    const { data: inverters } = await supabase.from('inverters').select('*');
    if (!inverters || inverters.length === 0) {
      return NextResponse.json({ message: 'Nenhum inversor encontrado para análise' });
    }

    // 2. Inicializa OpenAI (ChatGPT 4)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // 3. Envia para a Inteligência Artificial analisar
    const prompt = `Analise os seguintes dados de usinas solares: ${JSON.stringify(inverters)}.
Se houver alguma usina offline, com potência menor que o esperado (próxima a 0W) ou em estado de atenção, crie uma mensagem de alerta curta e urgente para o técnico via WhatsApp, informando exatamente qual usina está com problema e o dado anômalo.
Se estiver tudo perfeitamente normal, retorne a string exata: 'NORMAL'.
Responda de forma direta e sem firulas.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Usa o modelo GPT-4 mais avançado e rápido (equivalente ao que você mencionou)
      messages: [{ role: "user", content: prompt }]
    });

    const aiMessage = response.choices[0].message.content?.trim() || "";

    if (aiMessage !== 'NORMAL') {
      // Se houver problema, salva o log como Alerta no Painel
      await supabase.from('ai_logs').insert({
        type: 'alert',
        message: aiMessage
      });

      // 4. Dispara o WhatsApp via UAZAPI
      const uazapiUrl = process.env.UAZAPI_URL; // Ex: https://api.uazapi.com/instance...
      const uazapiToken = process.env.UAZAPI_TOKEN;
      const phone = process.env.WHATSAPP_PHONE;

      if (uazapiUrl && uazapiToken && phone) {
        await fetch(`${uazapiUrl}/send/text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': uazapiToken,
            'api-key': uazapiToken,
            'Authorization': `Bearer ${uazapiToken}`,
            'token': uazapiToken,
            'Client-Token': uazapiToken,
            'instance_token': uazapiToken
          },
          body: JSON.stringify({
            number: phone,
            text: `*[LacerdaSolar IA]*\n\n${aiMessage}`
          })
        });
      }
      
      return NextResponse.json({ status: 'alert_sent', message: aiMessage });
    }

    // Se estiver tudo bem, salva log de sucesso na tela
    await supabase.from('ai_logs').insert({
      type: 'success',
      message: 'Análise de rotina concluída. Todos os inversores estão operando de forma ideal.'
    });

    return NextResponse.json({ status: 'normal' });
  } catch (error) {
    console.error("Erro na análise da IA:", error);
    return NextResponse.json({ error: 'Erro interno na IA' }, { status: 500 });
  }
}
