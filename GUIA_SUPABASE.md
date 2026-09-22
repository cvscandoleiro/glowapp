# 🚀 Guia Prático de Configuração do Supabase (GlowApp)

Este guia mostra como ativar o banco de dados em nuvem gratuito no **Supabase** em menos de 5 minutos, permitindo acessar o GlowApp no celular e notebook com sincronização instantânea.

---

## 1️⃣ Passo 1: Criar sua Conta e Projeto Gratuito
1. Acesse **[supabase.com](https://supabase.com)** e clique em **"Start your project"**.
2. Faça login com seu GitHub ou crie uma conta com e-mail e senha.
3. Clique em **"New Project"** (Novo Projeto).
4. Defina:
   - **Name**: `GlowApp`
   - **Database Password**: Escolha uma senha segura e guarde-a.
   - **Region**: Selecione `South America (São Paulo)` para máxima velocidade.
   - **Pricing Plan**: `Free` ($0/mês).
5. Clique em **"Create new project"** e aguarde cerca de 1 minuto até o banco inicializar.

---

## 2️⃣ Passo 2: Criar as Tabelas no Banco de Dados
1. No menu lateral esquerdo do Supabase, clique no ícone **SQL Editor** (ou [acesse aqui](https://supabase.com/dashboard/project/_/sql)).
2. Clique no botão **"New Query"**.
3. Abra o arquivo [supabase_schema.sql](file:///c:/Desenvolvimento/GlowApp/portal/supabase_schema.sql), copie todo o seu conteúdo e cole no editor SQL do Supabase.
4. Clique no botão verde **"Run"** (no canto inferior direito do editor).
5. Você verá a mensagem *"Success. No rows returned"*. Suas tabelas (`clients` e `appointments`) e índices já estão prontos e protegidos!

---

## 3️⃣ Passo 3: Copiar as Chaves de Acesso para o GlowApp
1. No menu lateral esquerdo do Supabase, clique no ícone de engrenagem **Project Settings** > **API**.
2. Copie os seguintes valores:
   - **Project URL** (ex: `https://abcdefghijk.supabase.co`)
   - **Project API Keys** > chave **`anon` `public`** (ex: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
3. Abra o arquivo [.env](file:///c:/Desenvolvimento/GlowApp/portal/.env) na pasta `portal` e cole os valores:

```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4️⃣ Passo 4: Hospedagem e Acesso no Celular / Domínio Próprio

Para acessar pelo celular e notebook com seu domínio (ex: `app.suaclinica.com.br`):
1. Crie uma conta gratuita na **[Vercel](https://vercel.com)** ou **[Netlify](https://netlify.com)**.
2. Conecte seu repositório Git ou suba a pasta compilada (`portal/dist`).
3. Nas configurações da Vercel/Netlify (**Environment Variables**), adicione as mesmas duas variáveis (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
4. Conecte seu domínio próprio nas opções de **Domains**.

---

### ✨ Recursos Ativos:
* ✅ **Sincronização em Tempo Real**: Alterações feitas no notebook refletem no celular automaticamente.
* ✅ **Modo Offline & Fallback**: Se o aparelho ficar temporariamente sem sinal de internet, os dados são preservados com segurança no armazenamento local.
