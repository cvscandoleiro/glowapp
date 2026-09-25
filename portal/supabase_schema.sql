-- =========================================================
-- GLOWAPP - ESTRUTURA DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- Script 100% idempotente (pode ser executado várias vezes sem erros)
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
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    date TEXT NOT NULL, -- Formato YYYY-MM-DD
    start_time TEXT NOT NULL, -- Formato HH:mm
    end_time TEXT NOT NULL, -- Formato HH:mm
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    location TEXT,
    client_avatar TEXT,
    color TEXT DEFAULT '#8b5cf6',
    status TEXT DEFAULT 'confirmado', -- 'confirmado', 'em_andamento', 'concluido', 'pendente', 'cancelado'
    notes TEXT,
    price NUMERIC(10, 2) DEFAULT 0,
    services JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrações seguras caso a tabela appointments já existisse previamente
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;

-- 3. TABELA DE SERVIÇOS
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) DEFAULT 0,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'ativo', -- 'ativo', 'inativo'
    category TEXT DEFAULT 'Estética',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE CONFIGURAÇÃO DO WHATSAPP
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
    id TEXT PRIMARY KEY DEFAULT 'default_config',
    phone_number_id TEXT,
    waba_id TEXT,
    access_token TEXT,
    template_reminder_name TEXT DEFAULT 'lembrete_agendamento_glowapp',
    template_confirm_name TEXT DEFAULT 'confirmacao_agendamento_glowapp',
    language_code TEXT DEFAULT 'pt_BR',
    auto_reminder_hours INTEGER DEFAULT 24,
    is_simulation_mode BOOLEAN DEFAULT false,
    is_auto_scheduler_enabled BOOLEAN DEFAULT false,
    scheduled_times JSONB DEFAULT '["08:00", "14:00", "18:00"]'::jsonb,
    days_in_advance INTEGER DEFAULT 1,
    selected_template_id TEXT DEFAULT 'tmpl-1',
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_run_summary JSONB,
    scheduler_history JSONB DEFAULT '[]'::jsonb,
    server_url TEXT DEFAULT 'http://localhost:3001',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrações seguras caso whatsapp_config já exista
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS server_url TEXT DEFAULT 'http://localhost:3001';
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS is_auto_scheduler_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS scheduled_times JSONB DEFAULT '["08:00", "14:00", "18:00"]'::jsonb;
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS days_in_advance INTEGER DEFAULT 1;
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS selected_template_id TEXT DEFAULT 'tmpl-1';
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS last_run_summary JSONB;
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS scheduler_history JSONB DEFAULT '[]'::jsonb;

-- 5. TABELA DE HISTÓRICO E LOGS DE ENVIOS DO WHATSAPP
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id TEXT PRIMARY KEY,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    message_type TEXT NOT NULL, -- 'lembrete', 'confirmacao', 'personalizado'
    message_content TEXT,
    status TEXT DEFAULT 'enviado', -- 'enviado', 'entregue', 'lido', 'falha', 'simulado'
    error_message TEXT,
    meta_message_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE MODELOS DE MENSAGENS DO WHATSAPP (TEMPLATES)
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Lembrete',
    body_text TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    example TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABELA DE AUDITORIA DE MENSAGENS DO WHATSAPP (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS public.whatsapp_audit_logs (
    id TEXT PRIMARY KEY,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    message_type TEXT DEFAULT 'lembrete', -- 'lembrete', 'confirmacao', 'automatica_agendada', 'personalizado', 'manual'
    dispatch_type TEXT DEFAULT 'manual', -- 'manual', 'agendado_automatico'
    scheduled_time TEXT, -- ex: '08:00', '14:00'
    days_in_advance INTEGER, -- 0, 1, 2, etc.
    template_id TEXT,
    template_name TEXT,
    message_content TEXT NOT NULL,
    status TEXT DEFAULT 'enviado', -- 'pendente', 'enviado', 'entregue', 'lido', 'falha', 'simulado'
    error_message TEXT,
    meta_message_id TEXT,
    delivery_ack INTEGER DEFAULT 1,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrações seguras para whatsapp_audit_logs
ALTER TABLE public.whatsapp_audit_logs ADD COLUMN IF NOT EXISTS dispatch_type TEXT DEFAULT 'manual';
ALTER TABLE public.whatsapp_audit_logs ADD COLUMN IF NOT EXISTS scheduled_time TEXT;
ALTER TABLE public.whatsapp_audit_logs ADD COLUMN IF NOT EXISTS days_in_advance INTEGER;
ALTER TABLE public.whatsapp_audit_logs ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE public.whatsapp_audit_logs ADD COLUMN IF NOT EXISTS template_name TEXT;
ALTER TABLE public.whatsapp_audit_logs ADD COLUMN IF NOT EXISTS delivery_ack INTEGER DEFAULT 1;
ALTER TABLE public.whatsapp_audit_logs ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.whatsapp_audit_logs ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.whatsapp_audit_logs ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 8. TABELA DE USUÁRIOS AUTORIZADOS (GESTÃO DE ACESSOS GMAIL & PERFIS)
CREATE TABLE IF NOT EXISTS public.authorized_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'profissional', -- 'admin', 'profissional', 'recepcao'
    status TEXT DEFAULT 'ativo', -- 'ativo', 'inativo'
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Migrações seguras para authorized_users
ALTER TABLE public.authorized_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'profissional';
ALTER TABLE public.authorized_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
ALTER TABLE public.authorized_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.authorized_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- =========================================================
-- ÍNDICES PARA ALTA PERFORMANCE
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients (name);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients (phone);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments (date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_name ON public.appointments (client_name);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments (client_id);
CREATE INDEX IF NOT EXISTS idx_services_name ON public.services (name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON public.whatsapp_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON public.whatsapp_logs (phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_audit_created_at ON public.whatsapp_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_audit_status ON public.whatsapp_audit_logs (status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_audit_phone ON public.whatsapp_audit_logs (phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_audit_appointment_id ON public.whatsapp_audit_logs (appointment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_name ON public.whatsapp_templates (name);
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON public.authorized_users (email);
CREATE INDEX IF NOT EXISTS idx_authorized_users_role ON public.authorized_users (role);
CREATE INDEX IF NOT EXISTS idx_authorized_users_status ON public.authorized_users (status);

-- =========================================================
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- =========================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

-- Remove políticas anteriores antes de recriar para evitar erro 42710
DROP POLICY IF EXISTS "Permitir acesso completo a templates whatsapp" ON public.whatsapp_templates;
CREATE POLICY "Permitir acesso completo a templates whatsapp" 
ON public.whatsapp_templates 
FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a logs whatsapp" ON public.whatsapp_logs;
CREATE POLICY "Permitir acesso completo a logs whatsapp" 
ON public.whatsapp_logs 
FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a auditoria whatsapp" ON public.whatsapp_audit_logs;
CREATE POLICY "Permitir acesso completo a auditoria whatsapp" 
ON public.whatsapp_audit_logs 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Remove políticas anteriores antes de recriar para evitar erro 42710
DROP POLICY IF EXISTS "Permitir acesso completo aos clientes" ON public.clients;
CREATE POLICY "Permitir acesso completo aos clientes" 
ON public.clients 
FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo aos agendamentos" ON public.appointments;
CREATE POLICY "Permitir acesso completo aos agendamentos" 
ON public.appointments 
FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo aos servicos" ON public.services;
CREATE POLICY "Permitir acesso completo aos servicos" 
ON public.services 
FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a config whatsapp" ON public.whatsapp_config;
CREATE POLICY "Permitir acesso completo a config whatsapp" 
ON public.whatsapp_config 
FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo aos logs whatsapp" ON public.whatsapp_logs;
CREATE POLICY "Permitir acesso completo aos logs whatsapp" 
ON public.whatsapp_logs 
FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo aos usuarios autorizados" ON public.authorized_users;
CREATE POLICY "Permitir acesso completo aos usuarios autorizados" 
ON public.authorized_users 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- =========================================================
-- HABILITAR REALTIME SEGURO (Sincronização instantânea)
-- =========================================================
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_logs;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_audit_logs;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_config;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_templates;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.authorized_users;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- =========================================================
-- SEED INICIAL: USUÁRIOS ADMINISTRADORES
-- =========================================================
INSERT INTO public.authorized_users (id, email, name, role, status, avatar_url)
VALUES 
    ('user-admin-scandoleiro', 'scandoleiro@gmail.com', 'Claudio Vieira (Scandoleiro)', 'admin', 'ativo', '/default_avatar_male.png'),
    ('user-admin-hemillyn', 'hemillyncosta@gmail.com', 'Hemillyn Costa', 'admin', 'ativo', '/default_avatar_female.png')
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', status = 'ativo';


