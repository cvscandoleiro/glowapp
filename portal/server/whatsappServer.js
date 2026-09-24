import express from 'express';
import cors from 'cors';
import qrcode from 'qrcode';
import pkg from 'whatsapp-web.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const { Client, LocalAuth } = pkg;

const app = express();
const PORT = process.env.PORT || process.env.PORT_WHATSAPP || 3001;

app.use(cors());
app.use(express.json());

// Initialize Supabase client in Node.js
let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
      const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
      if (urlMatch && urlMatch[1]) supabaseUrl = urlMatch[1].trim();
      if (keyMatch && keyMatch[1]) supabaseKey = keyMatch[1].trim();
    }
  } catch (e) {
    console.warn('[WhatsApp Server] Aviso ao carregar .env:', e.message);
  }
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
if (supabase) {
  console.log('[WhatsApp Server] Conexão com Supabase inicializada para Auditoria e Agendamento Automático.');
} else {
  console.warn('[WhatsApp Server] Supabase não configurado. Modo de persistência em memória ativo.');
}

// Global State
let client = null;
let connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED' | 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATING' | 'CONNECTED' | 'ERROR'
let currentQrCode = null;
let currentQrDataUrl = null;
let connectedUser = null;
let lastError = null;

// In-memory store for message status tracking
const messageStatusStore = {};

// Deduplication store: prevents sending the exact same message to the same recipient twice within 15 seconds
const recentDispatches = new Map();

// Automated Scheduler State
let schedulerConfig = {
  enabled: false,
  scheduledTimes: ['08:00', '14:00', '18:00'],
  daysInAdvance: 1, // 0 = mesmo dia, 1 = 1 dia antes, 2 = 2 dias antes, etc.
  templateId: 'tmpl-1',
  lastRunAt: null,
  lastRunSummary: null,
  history: []
};

// Helper to get local date in Brazil (YYYY-MM-DD)
function getLocalDateString(daysInAdvance = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysInAdvance);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Helper to interpolate message templates
function interpolateTemplate(templateText, appointment, client) {
  if (!templateText) return '';
  const clientFullName = client?.name || appointment.client_name || appointment.clientName || 'Cliente';
  const clientFirstName = clientFullName.split(' ')[0] || clientFullName;
  const clientPhone = client?.phone || appointment.phone || '';

  let procedures = 'Atendimento GlowApp';
  if (Array.isArray(appointment.services) && appointment.services.length > 0) {
    procedures = appointment.services.map(s => (typeof s === 'string' ? s : s.name || s.title || '')).filter(Boolean).join(', ');
  } else if (appointment.title) {
    procedures = appointment.title;
  }

  const location = appointment.location || 'Bela Vista, São Paulo - SP';
  let formattedDate = appointment.date || '';
  if (formattedDate && formattedDate.includes('-')) {
    const [y, m, d] = formattedDate.split('-');
    formattedDate = `${d}/${m}/${y}`;
  }

  let priceText = '';
  if (appointment.price && appointment.price > 0) {
    priceText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.price);
  }

  const notes = appointment.notes || '';
  const startTime = appointment.start_time || appointment.startTime || '';
  const clinicName = 'GlowApp Clínic';

  let result = templateText;
  result = result.replace(/\{nome\}|\{\{nome\}\}/gi, clientFullName);
  result = result.replace(/\{primeiro_nome\}|\{\{primeiro_nome\}\}/gi, clientFirstName);
  result = result.replace(/\{data\}|\{\{data\}\}/gi, formattedDate);
  result = result.replace(/\{horario\}|\{\{horario\}\}|\{hora\}|\{\{hora\}\}/gi, startTime);
  result = result.replace(/\{procedimentos\}|\{\{procedimentos\}\}|\{procedimento\}|\{\{procedimento\}\}|\{servicos\}|\{\{servicos\}\}/gi, procedures);
  result = result.replace(/\{valor\}|\{\{valor\}\}|\{preco\}|\{\{preco\}\}/gi, priceText);
  result = result.replace(/\{local\}|\{\{local\}\}|\{endereco\}|\{\{endereco\}\}/gi, location);
  result = result.replace(/\{telefone\}|\{\{telefone\}\}|\{whatsapp\}|\{\{whatsapp\}\}/gi, clientPhone);
  result = result.replace(/\{observacoes\}|\{\{observacoes\}\}|\{obs\}|\{\{obs\}\}/gi, notes);
  result = result.replace(/\{clinica\}|\{\{clinica\}\}/gi, clinicName);

  return result;
}

// Default Template fallback
const DEFAULT_REMINDER_TEMPLATE =
  'Olá, {nome}! ✨ Lembramos que você tem um agendamento na {clinica} no dia {data} às {horario} para: {procedimentos}.\n\n📍 Local: {local}\n\nPor favor, responda com *1* para Confirmar ou *2* para Reagendar. Estamos te esperando! 🌸';

// Load scheduler config from Supabase on startup
async function loadSchedulerConfigFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('id', 'default_config')
      .maybeSingle();

    if (!error && data) {
      if (typeof data.is_auto_scheduler_enabled === 'boolean') {
        schedulerConfig.enabled = data.is_auto_scheduler_enabled;
      }
      if (Array.isArray(data.scheduled_times) && data.scheduled_times.length > 0) {
        schedulerConfig.scheduledTimes = data.scheduled_times;
      }
      if (typeof data.days_in_advance === 'number') {
        schedulerConfig.daysInAdvance = data.days_in_advance;
      }
      if (data.selected_template_id) {
        schedulerConfig.templateId = data.selected_template_id;
      }
      if (data.last_run_at) {
        schedulerConfig.lastRunAt = data.last_run_at;
      }
      if (data.last_run_summary) {
        schedulerConfig.lastRunSummary = data.last_run_summary;
      }
      if (Array.isArray(data.scheduler_history)) {
        schedulerConfig.history = data.scheduler_history;
      }
      console.log('[WhatsApp Server] Configuração do agendador carregada do Supabase. Ativo:', schedulerConfig.enabled, 'Horários:', schedulerConfig.scheduledTimes);
    }
  } catch (err) {
    console.warn('[WhatsApp Server] Aviso ao carregar config do Supabase:', err.message);
  }
}

// Helper para encontrar automaticamente o Chrome no sistema (Windows/Linux) ou Render
function findChromeExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.platform === 'linux') {
    const linuxPaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser'
    ];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

// Initialize WhatsApp Web Client
function initializeWhatsAppClient() {
  if (client && (connectionStatus === 'CONNECTED' || connectionStatus === 'INITIALIZING' || connectionStatus === 'QR_READY')) {
    console.log('[WhatsApp Server] Cliente já está em execução ou conectando. Status:', connectionStatus);
    return;
  }

  console.log('[WhatsApp Server] Inicializando cliente WhatsApp Web (whatsapp-web.js)...');
  connectionStatus = 'INITIALIZING';
  currentQrCode = null;
  currentQrDataUrl = null;
  lastError = null;

  try {
    const detectedChromePath = findChromeExecutablePath();
    const puppeteerOptions = {
      headless: true,
      executablePath: detectedChromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
      ]
    };

    // Limpar locks antigos residuais do Chromium se houver
    try {
      const sessionPath = path.resolve(process.cwd(), '.wwebjs_auth', 'session');
      if (fs.existsSync(sessionPath)) {
        const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort'];
        for (const file of lockFiles) {
          const filePath = path.join(sessionPath, file);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
          }
        }
      }
    } catch (lockErr) {
      console.warn('[WhatsApp Server] Aviso ao limpar locks de sessão:', lockErr.message);
    }

    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
      }),
      puppeteer: puppeteerOptions,
      webVersionCache: {
        type: 'none'
      }
    });

    client.on('qr', async (qr) => {
      console.log('[WhatsApp Server] Novo QR Code gerado. Aguardando leitura...');
      currentQrCode = qr;
      connectionStatus = 'QR_READY';
      try {
        currentQrDataUrl = await qrcode.toDataURL(qr, {
          margin: 2,
          width: 300,
          color: {
            dark: '#2c1e13',
            light: '#ffffff'
          }
        });
      } catch (err) {
        console.error('[WhatsApp Server] Erro ao converter QR Code para DataURL:', err);
      }
    });

    client.on('authenticated', () => {
      console.log('[WhatsApp Server] Autenticação realizada com sucesso!');
      connectionStatus = 'AUTHENTICATING';
      currentQrCode = null;
      currentQrDataUrl = null;
    });

    client.on('ready', async () => {
      console.log('[WhatsApp Server] WhatsApp Web está PRONTO e CONECTADO!');
      connectionStatus = 'CONNECTED';
      currentQrCode = null;
      currentQrDataUrl = null;

      try {
        const info = client.info;
        connectedUser = {
          pushname: info?.pushname || 'Usuário WhatsApp',
          phone: info?.wid?.user || '',
          platform: info?.platform || 'whatsapp-web',
          connectedAt: new Date().toISOString()
        };
        console.log('[WhatsApp Server] Usuário Conectado:', connectedUser);
      } catch (e) {
        connectedUser = {
          pushname: 'WhatsApp Conectado',
          phone: '',
          connectedAt: new Date().toISOString()
        };
      }
    });

    // Listen to Message Status changes (ACK updates: sent -> delivered -> read)
    client.on('message_ack', (msg, ack) => {
      const msgId = msg.id?._serialized || msg.id?.id;
      const rawId = msg.id?.id;
      const serializedId = msg.id?._serialized;

      const ackMap = {
        [-1]: 'falha',
        0: 'pendente',
        1: 'enviado',
        2: 'entregue',
        3: 'lido',
        4: 'lido'
      };
      const newStatus = ackMap[ack] || 'enviado';
      console.log(`[WhatsApp Server] 📩 Status WhatsApp atualizado: msgId=${msgId} ack=${ack} (${newStatus})`);

      if (msgId) {
        const statusEntry = {
          messageId: msgId,
          rawId,
          serializedId,
          status: newStatus,
          ack,
          updatedAt: new Date().toISOString()
        };

        messageStatusStore[msgId] = statusEntry;
        if (rawId) messageStatusStore[rawId] = statusEntry;
        if (serializedId) messageStatusStore[serializedId] = statusEntry;

        // Update Supabase audit log and logs if available
        if (supabase) {
          const nowIso = new Date().toISOString();
          const updatePayload = {
            status: newStatus,
            delivery_ack: ack,
            updated_at: nowIso
          };
          if (newStatus === 'entregue') updatePayload.delivered_at = nowIso;
          if (newStatus === 'lido') {
            updatePayload.delivered_at = nowIso;
            updatePayload.read_at = nowIso;
          }

          // 1. Update Audit Log by serializedId or rawId
          let auditQuery = supabase.from('whatsapp_audit_logs').update(updatePayload);
          if (serializedId && rawId && serializedId !== rawId) {
            auditQuery = auditQuery.or(`meta_message_id.eq.${serializedId},meta_message_id.eq.${rawId}`);
          } else {
            auditQuery = auditQuery.eq('meta_message_id', msgId);
          }
          auditQuery
            .then(() => {})
            .catch((e) => console.warn('[WhatsApp Server] Erro ao atualizar whatsapp_audit_logs ACK:', e.message));

          // 2. Update Simple Message Log
          let logsQuery = supabase.from('whatsapp_logs').update({ status: newStatus });
          if (serializedId && rawId && serializedId !== rawId) {
            logsQuery = logsQuery.or(`meta_message_id.eq.${serializedId},meta_message_id.eq.${rawId}`);
          } else {
            logsQuery = logsQuery.eq('meta_message_id', msgId);
          }
          logsQuery
            .then(() => {})
            .catch((e) => console.warn('[WhatsApp Server] Erro ao atualizar whatsapp_logs ACK:', e.message));
        }
      }
    });

    client.on('auth_failure', (msg) => {
      console.error('[WhatsApp Server] Falha na autenticação:', msg);
      connectionStatus = 'DISCONNECTED';
      lastError = msg || 'Falha de autenticação. Tente escanear o QR Code novamente.';
      currentQrCode = null;
      currentQrDataUrl = null;
    });

    client.on('disconnected', (reason) => {
      console.log('[WhatsApp Server] WhatsApp desconectado. Motivo:', reason);
      connectionStatus = 'DISCONNECTED';
      connectedUser = null;
      currentQrCode = null;
      currentQrDataUrl = null;
      try {
        client.destroy();
      } catch (e) {}
      client = null;
    });

    client.initialize().catch((err) => {
      console.error('[WhatsApp Server] Erro ao chamar client.initialize():', err);
      connectionStatus = 'DISCONNECTED';
      lastError = err.message || 'Erro ao inicializar navegador Chromium';
    });

  } catch (err) {
    console.error('[WhatsApp Server] Exceção ao instanciar cliente:', err);
    connectionStatus = 'DISCONNECTED';
    lastError = err.message || 'Erro interno ao iniciar';
  }
}

// Format and validate phone numbers for WhatsApp JID
async function resolveWhatsAppJid(phoneNumber) {
  let cleaned = (phoneNumber || '').replace(/\D/g, '');
  if (!cleaned) return null;

  if (!cleaned.startsWith('55') && (cleaned.length === 10 || cleaned.length === 11)) {
    cleaned = '55' + cleaned;
  }

  if (client && connectionStatus === 'CONNECTED') {
    try {
      let numberDetails = await client.getNumberId(cleaned);
      if (numberDetails && numberDetails._serialized) {
        return numberDetails._serialized;
      }

      if (cleaned.startsWith('55') && cleaned.length === 13) {
        const without9 = cleaned.substring(0, 4) + cleaned.substring(5);
        numberDetails = await client.getNumberId(without9);
        if (numberDetails && numberDetails._serialized) {
          return numberDetails._serialized;
        }
      }

      if (cleaned.startsWith('55') && cleaned.length === 12) {
        const with9 = cleaned.substring(0, 4) + '9' + cleaned.substring(4);
        numberDetails = await client.getNumberId(with9);
        if (numberDetails && numberDetails._serialized) {
          return numberDetails._serialized;
        }
      }
    } catch (e) {
      console.warn('[WhatsApp Server] Aviso ao verificar getNumberId para ' + cleaned + ':', e.message);
    }
  }

  return `${cleaned}@c.us`;
}

// Execute Server-Side Scheduled Routine
async function executeServerScheduledRoutine(isManualTrigger = false) {
  if (connectionStatus !== 'CONNECTED' || !client) {
    console.log('[Auto Scheduler Server] WhatsApp não está conectado. Execução ignorada.');
    return { success: false, message: 'WhatsApp não está conectado.' };
  }

  const targetDate = getLocalDateString(schedulerConfig.daysInAdvance);
  console.log(`[Auto Scheduler Server] Iniciando rotina para data alvo: ${targetDate} (${schedulerConfig.daysInAdvance} dias antes)...`);

  if (!supabase) {
    console.warn('[Auto Scheduler Server] Supabase não está configurado. Não é possível ler agendamentos do banco.');
    return { success: false, message: 'Supabase não configurado no servidor.' };
  }

  try {
    // 1. Fetch appointments for targetDate
    const { data: appointments, error: aptError } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', targetDate)
      .neq('status', 'cancelado');

    if (aptError || !appointments || appointments.length === 0) {
      console.log(`[Auto Scheduler Server] Nenhum agendamento ativo encontrado para ${targetDate}.`);
      return { success: true, total: 0, sent: 0, failed: 0, message: 'Nenhum agendamento para a data alvo.' };
    }

    // 2. Fetch existing audit logs and message logs to ensure strictly unnotified appointments are sent
    const { data: existingAudits } = await supabase
      .from('whatsapp_audit_logs')
      .select('appointment_id, client_name, phone, status')
      .in('status', ['enviado', 'entregue', 'lido', 'simulado', 'pendente']);

    const { data: existingLogs } = await supabase
      .from('whatsapp_logs')
      .select('appointment_id, client_name, phone, status')
      .in('status', ['enviado', 'entregue', 'lido', 'simulado', 'pendente']);

    const alreadyNotifiedIds = new Set();
    const alreadyNotifiedPhones = new Set();
    const alreadyNotifiedNames = new Set();

    (existingAudits || []).forEach(a => {
      if (a.appointment_id) alreadyNotifiedIds.add(a.appointment_id);
      if (a.phone) alreadyNotifiedPhones.add((a.phone || '').replace(/\D/g, ''));
      if (a.client_name) alreadyNotifiedNames.add((a.client_name || '').trim().toLowerCase());
    });

    (existingLogs || []).forEach(l => {
      if (l.appointment_id) alreadyNotifiedIds.add(l.appointment_id);
      if (l.phone) alreadyNotifiedPhones.add((l.phone || '').replace(/\D/g, ''));
      if (l.client_name) alreadyNotifiedNames.add((l.client_name || '').trim().toLowerCase());
    });

    const unnotified = appointments.filter(apt => {
      // 1. Direct ID match
      if (alreadyNotifiedIds.has(apt.id)) return false;

      // 2. Client Name match
      const cName = (apt.client_name || apt.clientName || '').trim().toLowerCase();
      if (cName && alreadyNotifiedNames.has(cName)) return false;

      // 3. Phone match
      const cPhone = (apt.phone || '').replace(/\D/g, '');
      if (cPhone && alreadyNotifiedPhones.has(cPhone)) return false;

      return true;
    });

    console.log(`[Auto Scheduler Server] Diagnóstico da data ${targetDate}: ${appointments.length} agendamentos totais, ${appointments.length - unnotified.length} já notificados, ${unnotified.length} estritamente pendentes.`);

    if (unnotified.length === 0) {
      console.log(`[Auto Scheduler Server] Todos os ${appointments.length} agendamentos de ${targetDate} já foram notificados anteriormente.`);
      return {
        success: true,
        total: appointments.length,
        sent: 0,
        failed: 0,
        message: `Todos os ${appointments.length} agendamentos da data alvo já receberam lembrete.`
      };
    }

    // 3. Fetch template
    let templateText = DEFAULT_REMINDER_TEMPLATE;
    let templateName = 'Lembrete Padrão';
    try {
      const { data: tmplData } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('id', schedulerConfig.templateId)
        .maybeSingle();

      if (tmplData && tmplData.body_text) {
        templateText = tmplData.body_text;
        templateName = tmplData.title || tmplData.name || 'Modelo Personalizado';
      }
    } catch (e) {}

    // 4. Fetch clients phone lookup map
    const clientIds = unnotified.map(a => a.client_id).filter(Boolean);
    let clientsMap = {};
    if (clientIds.length > 0) {
      try {
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, name, phone')
          .in('id', clientIds);

        if (clientsData) {
          clientsData.forEach(c => { clientsMap[c.id] = c; });
        }
      } catch (e) {}
    }

    let sentCount = 0;
    let failedCount = 0;
    const executionLogs = [];

    // 5. Send message sequentially
    for (let i = 0; i < unnotified.length; i++) {
      const apt = unnotified[i];
      const matchedClient = clientsMap[apt.client_id] || { name: apt.client_name, phone: apt.phone };
      const rawPhone = matchedClient?.phone || apt.phone || '11999999999';
      const cleanPhone = (rawPhone || '').replace(/\D/g, '');
      const messageBody = interpolateTemplate(templateText, apt, matchedClient);

      const dedupeKey = `${cleanPhone}_${messageBody.trim()}`;
      if (recentDispatches.has(dedupeKey)) {
        console.log(`[Auto Scheduler Server] ⚠️ Mensagem duplicada detectada para ${cleanPhone}. Pulando envio.`);
        continue;
      }

      try {
        const jid = await resolveWhatsAppJid(cleanPhone);
        if (!jid) throw new Error('Número de telefone inválido.');

        console.log(`[Auto Scheduler Server] Disparando lembrete para ${apt.client_name} (${jid})...`);
        const sent = await client.sendMessage(jid, messageBody);
        const msgId = sent?.id?._serialized || sent?.id?.id || `sched-${Date.now()}`;
        const ack = sent?.ack ?? 1;

        recentDispatches.set(dedupeKey, { msgId, jid, timestamp: Date.now() });
        setTimeout(() => recentDispatches.delete(dedupeKey), 20000);

        // Save to audit log
        const auditRecord = {
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          appointment_id: apt.id,
          client_id: apt.client_id || null,
          client_name: apt.client_name,
          phone: cleanPhone,
          message_type: 'automatica_agendada',
          dispatch_type: isManualTrigger ? 'manual' : 'agendado_automatico',
          scheduled_time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          days_in_advance: schedulerConfig.daysInAdvance,
          template_id: schedulerConfig.templateId,
          template_name: templateName,
          message_content: messageBody,
          status: 'enviado',
          meta_message_id: msgId,
          delivery_ack: ack,
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // 1. Grava na tabela de auditoria completa
        await supabase.from('whatsapp_audit_logs').insert(auditRecord);

        // 2. Grava na tabela de histórico simples (whatsapp_logs)
        await supabase.from('whatsapp_logs').insert({
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          appointment_id: apt.id,
          client_name: apt.client_name,
          phone: cleanPhone,
          message_type: 'automatica_agendada',
          message_content: messageBody,
          status: 'enviado',
          meta_message_id: msgId,
          created_at: new Date().toISOString()
        }).catch((e) => console.warn('[Auto Scheduler] Erro ao gravar whatsapp_logs:', e.message));

        sentCount++;
        executionLogs.push({ id: apt.id, clientName: apt.client_name, success: true });
      } catch (sendErr) {
        console.error(`[Auto Scheduler Server] Erro ao enviar para ${apt.client_name}:`, sendErr.message);
        failedCount++;

        const auditRecord = {
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          appointment_id: apt.id,
          client_id: apt.client_id || null,
          client_name: apt.client_name,
          phone: cleanPhone,
          message_type: 'automatica_agendada',
          dispatch_type: isManualTrigger ? 'manual' : 'agendado_automatico',
          scheduled_time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          days_in_advance: schedulerConfig.daysInAdvance,
          template_id: schedulerConfig.templateId,
          template_name: templateName,
          message_content: messageBody,
          status: 'falha',
          error_message: sendErr.message,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await supabase.from('whatsapp_audit_logs').insert(auditRecord).catch(() => {});

        await supabase.from('whatsapp_logs').insert({
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          appointment_id: apt.id,
          client_name: apt.client_name,
          phone: cleanPhone,
          message_type: 'automatica_agendada',
          message_content: messageBody,
          status: 'falha',
          error_message: sendErr.message,
          created_at: new Date().toISOString()
        }).catch(() => {});

        executionLogs.push({ id: apt.id, clientName: apt.client_name, success: false, error: sendErr.message });
      }

      // 2 seconds pause between messages
      if (i < unnotified.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // 6. Record execution history
    const summary = {
      date: targetDate,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      targetDate,
      scheduledTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      daysInAdvance: schedulerConfig.daysInAdvance,
      total: unnotified.length,
      sent: sentCount,
      failed: failedCount,
      executedAt: new Date().toISOString()
    };

    schedulerConfig.lastRunAt = summary.executedAt;
    schedulerConfig.lastRunSummary = summary;
    schedulerConfig.history.unshift({
      id: `sched-run-${Date.now()}`,
      ...summary
    });
    if (schedulerConfig.history.length > 50) {
      schedulerConfig.history = schedulerConfig.history.slice(0, 50);
    }

    // Persist to supabase whatsapp_config
    await supabase.from('whatsapp_config').upsert({
      id: 'default_config',
      is_auto_scheduler_enabled: schedulerConfig.enabled,
      scheduled_times: schedulerConfig.scheduledTimes,
      days_in_advance: schedulerConfig.daysInAdvance,
      selected_template_id: schedulerConfig.templateId,
      last_run_at: summary.executedAt,
      last_run_summary: summary,
      scheduler_history: schedulerConfig.history,
      updated_at: new Date().toISOString()
    }).catch(() => {});

    console.log(`[Auto Scheduler Server] Rotina concluída: ${sentCount} enviados com sucesso, ${failedCount} falhas.`);
    return {
      success: true,
      total: unnotified.length,
      sent: sentCount,
      failed: failedCount,
      summary,
      logs: executionLogs
    };
  } catch (err) {
    console.error('[Auto Scheduler Server] Erro geral na rotina:', err);
    return { success: false, error: err.message };
  }
}

// Server-side autonomous cron loop (runs 24/7 every 20 seconds)
let lastExecutedSlot = '';
setInterval(async () => {
  if (!schedulerConfig.enabled) return;
  if (connectionStatus !== 'CONNECTED') return;

  const now = new Date();
  const currentH = String(now.getHours()).padStart(2, '0');
  const currentM = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentH}:${currentM}`;
  const today = getLocalDateString(0);
  const slotKey = `${today}_${currentTime}`;

  if (schedulerConfig.scheduledTimes.includes(currentTime) && lastExecutedSlot !== slotKey) {
    lastExecutedSlot = slotKey;
    console.log(`\n[Auto Scheduler Server] ⏰ Horário programado atingido: ${currentTime}. Executando disparo automático...`);
    await executeServerScheduledRoutine(false);
  }
}, 20000);

// Health Check & Root
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GlowApp WhatsApp Server',
    connectionStatus,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// 1. Get Connection Status & QR Code
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: connectionStatus,
    qrCodeDataUrl: currentQrDataUrl,
    qrCodeRaw: currentQrCode,
    user: connectedUser,
    error: lastError
  });
});

// 1b. Get Live Message Delivery & Read Statuses (ACKs)
app.get('/api/whatsapp/message-statuses', (req, res) => {
  res.json({
    success: true,
    count: Object.keys(messageStatusStore).length,
    statuses: messageStatusStore
  });
});

// 2. Initialize / Request Connection (Generates QR Code)
app.post('/api/whatsapp/initialize', (req, res) => {
  if (connectionStatus === 'CONNECTED') {
    return res.json({
      success: true,
      message: 'WhatsApp já está conectado.',
      status: connectionStatus,
      user: connectedUser
    });
  }

  initializeWhatsAppClient();
  res.json({
    success: true,
    message: 'Inicialização iniciada. Aguarde a geração do QR Code.',
    status: connectionStatus
  });
});

// 3. Disconnect / Logout
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    if (client) {
      console.log('[WhatsApp Server] Desconectando e encerrando sessão...');
      await client.logout().catch(() => {});
      await client.destroy().catch(() => {});
      client = null;
    }
    try {
      const authPath = path.resolve(process.cwd(), '.wwebjs_auth');
      if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log('[WhatsApp Server] Sessão .wwebjs_auth limpa com sucesso.');
      }
    } catch (cleanErr) {
      console.warn('[WhatsApp Server] Aviso ao limpar auth:', cleanErr.message);
    }
    connectionStatus = 'DISCONNECTED';
    connectedUser = null;
    currentQrCode = null;
    currentQrDataUrl = null;

    res.json({
      success: true,
      message: 'Sessão do WhatsApp desconectada com sucesso.'
    });
  } catch (err) {
    console.error('[WhatsApp Server] Erro ao desconectar:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Erro ao desconectar sessão.'
    });
  }
});

// 4. Send a single WhatsApp Message (with server-side deduplication)
app.post('/api/whatsapp/send', async (req, res) => {
  const { phone, message } = req.body;

  if (connectionStatus !== 'CONNECTED' || !client) {
    return res.status(400).json({
      success: false,
      error: 'WhatsApp Web não está conectado. Escaneie o QR Code primeiro nas configurações.'
    });
  }

  if (!phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'Telefone e mensagem são obrigatórios.'
    });
  }

  const cleanPhone = (phone || '').replace(/\D/g, '');
  const dedupeKey = `${cleanPhone}_${message.trim()}`;

  // Check deduplication (prevents double sending within 15 seconds)
  const existing = recentDispatches.get(dedupeKey);
  if (existing && Date.now() - existing.timestamp < 15000) {
    console.log(`[WhatsApp Server] ⚠️ Mensagem duplicada prevenida para ${cleanPhone}. Retornando ID do envio anterior.`);
    return res.json({
      success: true,
      messageId: existing.msgId,
      recipient: existing.jid || `${cleanPhone}@c.us`,
      status: 'enviado',
      ack: 1,
      isDuplicatePrevented: true,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const jid = await resolveWhatsAppJid(cleanPhone);
    if (!jid) {
      return res.status(400).json({
        success: false,
        error: 'Número de telefone inválido.'
      });
    }

    console.log(`[WhatsApp Server] Enviando mensagem para ${jid}...`);
    let sent = null;
    try {
      sent = await client.sendMessage(jid, message);
    } catch (sendErr) {
      console.warn(`[WhatsApp Server] Aviso no primeiro disparo para ${jid}: ${sendErr.message}. Tentando envio com JID alternativo...`);
      // Tentativa alternativa com formato com/sem 9º dígito se for número brasileiro
      if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
        const altJid = cleanPhone.substring(0, 4) + cleanPhone.substring(5) + '@c.us';
        sent = await client.sendMessage(altJid, message);
      } else if (cleanPhone.startsWith('55') && cleanPhone.length === 12) {
        const altJid = cleanPhone.substring(0, 4) + '9' + cleanPhone.substring(4) + '@c.us';
        sent = await client.sendMessage(altJid, message);
      } else {
        throw sendErr;
      }
    }

    const msgId = sent?.id?._serialized || sent?.id?.id || 'msg-' + Date.now();
    const ack = sent?.ack ?? 1;
    const ackMap = { 0: 'pendente', 1: 'enviado', 2: 'entregue', 3: 'lido', 4: 'lido' };
    const initialStatus = ackMap[ack] || 'enviado';

    // Store in deduplication cache
    recentDispatches.set(dedupeKey, { msgId, jid, timestamp: Date.now() });
    setTimeout(() => recentDispatches.delete(dedupeKey), 20000);

    messageStatusStore[msgId] = {
      messageId: msgId,
      status: initialStatus,
      ack,
      updatedAt: new Date().toISOString()
    };

    console.log(`[WhatsApp Server] ✅ Mensagem despachada com sucesso. ID: ${msgId} para ${jid}`);

    res.json({
      success: true,
      messageId: msgId,
      recipient: jid,
      status: initialStatus,
      ack,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[WhatsApp Server] Erro ao enviar mensagem:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Falha ao enviar mensagem pelo WhatsApp.'
    });
  }
});

// 5. Send Bulk WhatsApp Messages sequentially with delay
app.post('/api/whatsapp/send-bulk', async (req, res) => {
  const { items, delayMs = 2500 } = req.body;

  if (connectionStatus !== 'CONNECTED' || !client) {
    return res.status(400).json({
      success: false,
      error: 'WhatsApp Web não está conectado.'
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Lista de mensagens para envio em lote está vazia.'
    });
  }

  console.log(`[WhatsApp Server] Iniciando envio em lote de ${items.length} mensagens com intervalo de ${delayMs}ms...`);
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const cleanPhone = (item.phone || '').replace(/\D/g, '');
    const dedupeKey = `${cleanPhone}_${(item.message || '').trim()}`;

    const existing = recentDispatches.get(dedupeKey);
    if (existing && Date.now() - existing.timestamp < 15000) {
      console.log(`[WhatsApp Server] ⚠️ Mensagem em lote duplicada prevenida para ${item.clientName}.`);
      results.push({
        id: item.id,
        clientName: item.clientName,
        phone: item.phone,
        messageId: existing.msgId,
        status: 'enviado',
        success: true,
        isDuplicatePrevented: true,
        sentAt: new Date().toISOString()
      });
      continue;
    }

    try {
      const jid = await resolveWhatsAppJid(cleanPhone);
      if (!jid) {
        results.push({
          id: item.id,
          clientName: item.clientName,
          phone: item.phone,
          success: false,
          error: 'Número de telefone inválido'
        });
        continue;
      }

      const sent = await client.sendMessage(jid, item.message);
      const msgId = sent?.id?._serialized || sent?.id?.id || 'msg-' + Date.now();
      const ack = sent?.ack ?? 1;
      const ackMap = { 0: 'pendente', 1: 'enviado', 2: 'entregue', 3: 'lido', 4: 'lido' };
      const initialStatus = ackMap[ack] || 'enviado';

      recentDispatches.set(dedupeKey, { msgId, jid, timestamp: Date.now() });
      setTimeout(() => recentDispatches.delete(dedupeKey), 20000);

      if (msgId) {
        messageStatusStore[msgId] = {
          messageId: msgId,
          status: initialStatus,
          ack,
          updatedAt: new Date().toISOString()
        };
      }

      results.push({
        id: item.id,
        clientName: item.clientName,
        phone: item.phone,
        messageId: msgId,
        status: initialStatus,
        success: true,
        sentAt: new Date().toISOString()
      });

      if (i < items.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (err) {
      console.error(`[WhatsApp Server] Erro ao enviar para ${item.clientName}:`, err);
      results.push({
        id: item.id,
        clientName: item.clientName,
        phone: item.phone,
        success: false,
        error: err.message || 'Falha no envio'
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  res.json({
    success: true,
    total: results.length,
    successCount,
    failureCount,
    results
  });
});

// 6. Get Message Statuses (live tracking)
app.get('/api/whatsapp/message-statuses', (req, res) => {
  res.json({
    success: true,
    statuses: messageStatusStore
  });
});

// 7. Get Scheduler Configuration & Status
app.get('/api/whatsapp/scheduler', (req, res) => {
  res.json({
    success: true,
    config: schedulerConfig,
    isConnected: connectionStatus === 'CONNECTED'
  });
});

// 8. Update Scheduler Configuration
app.post('/api/whatsapp/scheduler/config', async (req, res) => {
  const { enabled, scheduledTimes, daysInAdvance, templateId } = req.body;

  if (typeof enabled === 'boolean') {
    schedulerConfig.enabled = enabled;
  }
  if (Array.isArray(scheduledTimes)) {
    schedulerConfig.scheduledTimes = Array.from(
      new Set(
        scheduledTimes
          .filter(t => typeof t === 'string' && /^\d{2}:\d{2}$/.test(t.trim()))
          .map(t => t.trim())
      )
    ).sort();
  }
  if (typeof daysInAdvance === 'number' && daysInAdvance >= 0) {
    schedulerConfig.daysInAdvance = Math.floor(daysInAdvance);
  }
  if (typeof templateId === 'string' && templateId.trim()) {
    schedulerConfig.templateId = templateId.trim();
  }

  console.log('[WhatsApp Server] Configuração do Agendador Automático atualizada:', schedulerConfig);

  // Persist to Supabase whatsapp_config
  if (supabase) {
    try {
      await supabase.from('whatsapp_config').upsert({
        id: 'default_config',
        is_auto_scheduler_enabled: schedulerConfig.enabled,
        scheduled_times: schedulerConfig.scheduledTimes,
        days_in_advance: schedulerConfig.daysInAdvance,
        selected_template_id: schedulerConfig.templateId,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('[WhatsApp Server] Aviso ao sincronizar config no Supabase:', e.message);
    }
  }

  res.json({
    success: true,
    message: 'Configuração do agendador automático salva com sucesso.',
    config: schedulerConfig
  });
});

// 9. Execute Scheduled Routine On Demand (Manual Test / Trigger Now)
app.post('/api/whatsapp/scheduler/run-now', async (req, res) => {
  console.log('[WhatsApp Server] Solicitação de disparo manual da rotina de agendamento recebida.');
  const result = await executeServerScheduledRoutine(true);
  res.json(result);
});

// 10. Log Execution of Scheduled Routine
app.post('/api/whatsapp/scheduler/log-execution', async (req, res) => {
  const { targetDate, scheduledTime, daysInAdvance, total, sent, failed } = req.body;

  const summary = {
    date: targetDate || getLocalDateString(0),
    time: scheduledTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    targetDate: targetDate || getLocalDateString(0),
    scheduledTime: scheduledTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    daysInAdvance: typeof daysInAdvance === 'number' ? daysInAdvance : schedulerConfig.daysInAdvance,
    total: Number(total) || 0,
    sent: Number(sent) || 0,
    failed: Number(failed) || 0,
    executedAt: new Date().toISOString()
  };

  schedulerConfig.lastRunAt = summary.executedAt;
  schedulerConfig.lastRunSummary = summary;

  const historyItem = {
    id: `sched-run-${Date.now()}`,
    ...summary
  };

  schedulerConfig.history.unshift(historyItem);
  if (schedulerConfig.history.length > 50) {
    schedulerConfig.history = schedulerConfig.history.slice(0, 50);
  }

  if (supabase) {
    try {
      await supabase.from('whatsapp_config').upsert({
        id: 'default_config',
        last_run_at: summary.executedAt,
        last_run_summary: summary,
        scheduler_history: schedulerConfig.history,
        updated_at: new Date().toISOString()
      });
    } catch (e) {}
  }

  res.json({
    success: true,
    config: schedulerConfig
  });
});

// Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(` [WhatsApp Server] Microserviço rodando na porta ${PORT}`);
  console.log(` API disponível em: http://127.0.0.1:${PORT}/api/whatsapp`);
  console.log(`======================================================\n`);
  
  // Load configuration from Supabase
  loadSchedulerConfigFromSupabase();

  // Start client on startup
  initializeWhatsAppClient();
});
