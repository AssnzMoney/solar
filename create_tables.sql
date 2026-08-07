-- Cria a tabela de inversores
CREATE TABLE IF NOT EXISTS inverters (
    id TEXT PRIMARY KEY,
    plant_name TEXT NOT NULL,
    status TEXT NOT NULL,
    power NUMERIC NOT NULL,
    voltage NUMERIC NOT NULL,
    frequency NUMERIC NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Cria a tabela de logs da IA
CREATE TABLE IF NOT EXISTS ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Desativa bloqueios de segurança (RLS) para permitir que nosso servidor grave dados sem login obrigatório
ALTER TABLE inverters DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs DISABLE ROW LEVEL SECURITY;

-- Cria a tabela de histórico de geração para desenhar o gráfico
CREATE TABLE IF NOT EXISTS inverters_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inverter_id TEXT NOT NULL,
    power NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE inverters_history DISABLE ROW LEVEL SECURITY;
