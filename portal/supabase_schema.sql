-- =========================================================
-- GLOWAPP - ESTRUTURA DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- =========================================================

-- 1. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT DEFAULT 'female',
    avatar TEXT,
    inscription_date TEXT,
    birth_date TEXT,
    cep TEXT,
    address TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    location TEXT,
    phone TEXT,
    is_whatsapp BOOLEAN DEFAULT true,
    email TEXT,
    instagram TEXT,
    x_twitter TEXT,
    facebook TEXT,
    card_number TEXT,
    plan_name TEXT,
    plan_benefits JSONB DEFAULT '[]'::jsonb,
    procedures JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE AGENDAMENTOS (AGENDA)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL, -- Formato YYYY-MM-DD
    start_time TEXT NOT NULL, -- Formato HH:mm
    end_time TEXT NOT NULL, -- Formato HH:mm
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    location TEXT,
    client_avatar TEXT,
    color TEXT DEFAULT '#8b5cf6',
    status TEXT DEFAULT 'confirmado', -- 'confirmado', 'em_andamento', 'concluido', 'pendente'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================
-- ÍNDICES PARA ALTA PERFORMANCE
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients (name);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients (phone);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments (date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_name ON public.appointments (client_name);

-- =========================================================
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- Permite leitura e gravação anônima ou autenticada segura
-- =========================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso completo aos clientes" 
ON public.clients 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir acesso completo aos agendamentos" 
ON public.appointments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Habilitar Realtime para as tabelas (Sincronização instantânea Celular <-> Computador)
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
