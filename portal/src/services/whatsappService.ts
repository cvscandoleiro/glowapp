import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Appointment } from './appointmentService';
import type { ClientProfile } from './clientService';

export interface WhatsAppWebStatus {
  status: 'DISCONNECTED' | 'INITIALIZING' | 'QR_READY' | 'PAIRING_CODE_READY' | 'AUTHENTICATING' | 'CONNECTED' | 'ERROR';
  qrCodeDataUrl: string | null;
  qrCodeRaw: string | null;
  pairingCode?: string | null;
  user?: {
    pushname?: string;
    phone?: string;
    platform?: string;
    profilePicUrl?: string | null;
    connectedAt?: string;
  } | null;
  error?: string | null;
}

export interface WhatsAppConfig {
  autoReminderHours: number;
  serverUrl: string;
  isSimulationMode: boolean;
}

export interface WhatsAppMessageLog {
  id: string;
  appointmentId?: string;
  clientName: string;
  phone: string;
  messageType: 'lembrete' | 'confirmacao' | 'personalizado';
  messageContent: string;
  status: 'pendente' | 'enviado' | 'entregue' | 'lido' | 'falha' | 'simulado';
  errorMessage?: string;
  metaMessageId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WhatsAppAuditLog {
  id: string;
  appointmentId?: string;
  clientId?: string;
  clientName: string;
  phone: string;
  messageType: 'lembrete' | 'confirmacao' | 'automatica_agendada' | 'personalizado' | 'manual';
  dispatchType: 'manual' | 'agendado_automatico';
  scheduledTime?: string;
  daysInAdvance?: number;
  templateId?: string;
  templateName?: string;
  messageContent: string;
  status: 'pendente' | 'enviado' | 'entregue' | 'lido' | 'falha' | 'simulado';
  errorMessage?: string;
  metaMessageId?: string;
  deliveryAck?: number;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WhatsAppSchedulerConfig {
  enabled: boolean;
  scheduledTimes: string[]; // e.g. ['08:00', '14:00', '18:00']
  daysInAdvance: number; // 0 = hoje/mesmo dia, 1 = 1 dia antes (amanhã), 2 = 2 dias antes, etc.
  templateId: string;
  lastRunAt?: string | null;
  lastRunSummary?: {
    date: string;
    time: string;
    total: number;
    sent: number;
    failed: number;
    executedAt: string;
  } | null;
  history?: {
    id: string;
    date: string;
    time: string;
    total: number;
    sent: number;
    failed: number;
    daysInAdvance: number;
    executedAt: string;
  }[];
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  title: string;
  category: 'Lembrete' | 'Confirmação' | 'Pós-Procedimento' | 'Informativo';
  bodyText: string;
  variables: string[];
  example: string;
}

export interface TemplateFieldTag {
  tag: string;
  label: string;
  description: string;
  example: string;
}

export const TEMPLATE_FIELD_TAGS: TemplateFieldTag[] = [
  { tag: '{nome}', label: 'Nome do Cliente', description: 'Nome completo do cliente cadastrado', example: 'Maria Silva' },
  { tag: '{primeiro_nome}', label: 'Primeiro Nome', description: 'Apenas o primeiro nome para mensagens mais íntimas', example: 'Maria' },
  { tag: '{data}', label: 'Data', description: 'Data do agendamento (DD/MM/AAAA)', example: '24/09/2026' },
  { tag: '{horario}', label: 'Horário', description: 'Horário marcado para o atendimento', example: '14:30' },
  { tag: '{procedimentos}', label: 'Procedimentos', description: 'Nome do(s) procedimento(s) agendado(s)', example: 'Limpeza de Pele Glow' },
  { tag: '{valor}', label: 'Valor Total', description: 'Valor total dos serviços formatado em R$', example: 'R$ 280,00' },
  { tag: '{local}', label: 'Local da Clínica', description: 'Endereço ou unidade de atendimento', example: 'Bela Vista, São Paulo - SP' },
  { tag: '{telefone}', label: 'Telefone', description: 'Telefone/WhatsApp do cliente', example: '(11) 99999-8888' },
  { tag: '{observacoes}', label: 'Observações', description: 'Notas clínicas ou instruções do agendamento', example: 'Chegar em jejum de 2h' },
  { tag: '{clinica}', label: 'Nome da Clínica', description: 'Nome do estabelecimento', example: 'GlowApp Clínic' },
];

const CONFIG_STORAGE_KEY = 'glowapp_whatsapp_web_config';
const LOGS_STORAGE_KEY = 'glowapp_whatsapp_logs';
const AUDIT_STORAGE_KEY = 'glowapp_whatsapp_audit_logs';
const SCHEDULER_STORAGE_KEY = 'glowapp_whatsapp_scheduler_config';
const TEMPLATES_STORAGE_KEY = 'glowapp_whatsapp_templates';

const DEFAULT_CONFIG: WhatsAppConfig = {
  autoReminderHours: 24,
  serverUrl: 'http://localhost:3001',
  isSimulationMode: false,
};

const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'lembrete_agendamento_glowapp',
    title: 'Lembrete de Agendamento (Padrão)',
    category: 'Lembrete',
    bodyText:
      'Olá, {nome}! ✨ Lembramos que você tem um agendamento na {clinica} no dia {data} às {horario} para: {procedimentos}.\n\n📍 Local: {local}\n\nPor favor, responda com *1* para Confirmar ou *2* para Reagendar. Estamos te esperando! 🌸',
    variables: ['Nome do Cliente', 'Data', 'Horário', 'Procedimentos', 'Local da Clínica'],
    example:
      'Olá, Maria Silva! ✨ Lembramos que você tem um agendamento na GlowApp Clínic no dia 24/09/2026 às 14:30 para: Limpeza de Pele Glow.\n\n📍 Local: Bela Vista, São Paulo - SP\n\nPor favor, responda com *1* para Confirmar ou *2* para Reagendar. Estamos te esperando! 🌸',
  },
  {
    id: 'tmpl-2',
    name: 'confirmacao_agendamento_glowapp',
    title: 'Confirmação de Novo Agendamento',
    category: 'Confirmação',
    bodyText:
      'Olá, {nome}! Seu agendamento na {clinica} foi confirmado com sucesso para {data} às {horario}.\n\n💆 Procedimentos: {procedimentos}\n💰 Valor Total: {valor}\n\nQualquer dúvida, estamos à disposição por aqui! 💕',
    variables: ['Nome do Cliente', 'Data', 'Horário', 'Procedimentos', 'Valor Total'],
    example:
      'Olá, Juliana Paes! Seu agendamento na GlowApp Clínic foi confirmado com sucesso para 25/09/2026 às 10:00.\n\n💆 Procedimentos: Peeling Químico & Hidratação\n💰 Valor Total: R$ 380,00\n\nQualquer dúvida, estamos à disposição por aqui! 💕',
  },
  {
    id: 'tmpl-3',
    name: 'orientacoes_pre_procedimento',
    title: 'Orientações Pré-Procedimento',
    category: 'Informativo',
    bodyText:
      'Olá, {primeiro_nome}! Para que seu atendimento de {procedimentos} no dia {data} às {horario} seja perfeito, recomendamos:\n\n• Evitar exposição solar intensa 48h antes\n• Manter a pele bem hidratada e limpa\n• Chegar com 10 minutinhos de antecedência\n\nNos vemos em breve na {clinica}! ✨',
    variables: ['Primeiro Nome', 'Procedimentos', 'Data', 'Horário'],
    example:
      'Olá, Camila! Para que seu atendimento de Limpeza de Pele no dia 26/09/2026 às 15:00 seja perfeito, recomendamos:\n\n• Evitar exposição solar intensa 48h antes\n• Manter a pele bem hidratada e limpa\n• Chegar com 10 minutinhos de antecedência\n\nNos vemos em breve na GlowApp Clínic! ✨',
  },
  {
    id: 'tmpl-4',
    name: 'cuidados_pos_procedimento',
    title: 'Cuidados Pós-Procedimento',
    category: 'Pós-Procedimento',
    bodyText:
      'Olá, {primeiro_nome}! Como você está se sentindo após seu procedimento de {procedimentos}? 🌟\n\nLembre-se de usar protetor solar FPS 50+ a cada 3h e manter sua pele hidratada. Se tiver qualquer dúvida, conte conosco na {clinica}!',
    variables: ['Primeiro Nome', 'Procedimentos'],
    example:
      'Olá, Clara! Como você está se sentindo após seu procedimento de Peeling Renovador? 🌟\n\nLembre-se de usar protetor solar FPS 50+ a cada 3h e manter sua pele hidratada. Se tiver qualquer dúvida, conte conosco na GlowApp Clínic!',
  },
];

export const whatsappService = {
  // Helper to get backend base URL
  getBaseUrl(): string {
    try {
      const cached = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.serverUrl && parsed.serverUrl.trim()) {
          const cleanUrl = parsed.serverUrl.trim().replace(/\/+$/, '');
          if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
            return cleanUrl.endsWith('/api/whatsapp') ? cleanUrl : `${cleanUrl}/api/whatsapp`;
          }
        }
      }
    } catch (e) {}

    const envUrl = (import.meta as any).env?.VITE_WHATSAPP_SERVER_URL;
    if (envUrl && envUrl.trim()) {
      const cleanEnv = envUrl.trim().replace(/\/+$/, '');
      return cleanEnv.endsWith('/api/whatsapp') ? cleanEnv : `${cleanEnv}/api/whatsapp`;
    }

    return '/api/whatsapp';
  },

  // 1. Get WhatsApp Web Connection Status & QR Code
  async getStatus(): Promise<WhatsAppWebStatus> {
    const url = `${this.getBaseUrl()}/status`;
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      // If relative proxy failed and not on HTTPS custom server, try direct localhost
      if (url.startsWith('/api/whatsapp') && typeof window !== 'undefined' && window.location.protocol === 'http:') {
        try {
          const directResp = await fetch('http://localhost:3001/api/whatsapp/status');
          if (directResp.ok) return await directResp.json();
        } catch (e) {}
      }
    }

    return {
      status: 'DISCONNECTED',
      qrCodeDataUrl: null,
      qrCodeRaw: null,
      error: 'Servidor do WhatsApp não conectado. Configure o link do Render nas opções abaixo ou inicie o servidor.',
    };
  },

  // 2. Initialize / Request Connection (Generates QR Code)
  async initializeClient(): Promise<WhatsAppWebStatus> {
    const url = `${this.getBaseUrl()}/initialize`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      if (url.startsWith('/api/whatsapp') && typeof window !== 'undefined' && window.location.protocol === 'http:') {
        try {
          const directResp = await fetch('http://localhost:3001/api/whatsapp/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (directResp.ok) return await directResp.json();
        } catch (e) {}
      }
    }

    return {
      status: 'ERROR',
      qrCodeDataUrl: null,
      qrCodeRaw: null,
      error: 'Não foi possível conectar ao servidor WhatsApp Web. Verifique a URL do servidor.',
    };
  },

  // 2b. Request 8-Digit Pairing Code (Phone Number Pairing)
  async requestPairingCode(phoneNumber: string): Promise<WhatsAppWebStatus & { pairingCode?: string }> {
    const url = `${this.getBaseUrl()}/request-pairing-code`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      if (response.ok) {
        return await response.json();
      }
      const errData = await response.json().catch(() => ({}));
      return {
        status: 'ERROR',
        qrCodeDataUrl: null,
        qrCodeRaw: null,
        error: errData.error || 'Erro ao gerar código de pareamento no servidor.',
      };
    } catch (err: any) {
      return {
        status: 'ERROR',
        qrCodeDataUrl: null,
        qrCodeRaw: null,
        error: err?.message || 'Falha de conexão com o servidor.',
      };
    }
  },

  // 3. Disconnect / Logout
  async disconnectClient(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      try {
        const directResp = await fetch('http://localhost:3001/api/whatsapp/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (directResp.ok) return await directResp.json();
      } catch (e) {}
    }

    return { success: false, message: 'Erro ao desconectar sessão.' };
  },

  // 4. Get saved settings
  async getConfig(): Promise<WhatsAppConfig> {
    try {
      const cached = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(cached) };
      }
    } catch (e) {}
    return DEFAULT_CONFIG;
  },

  // 5. Save settings
  async saveConfig(config: WhatsAppConfig): Promise<void> {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {}
  },

  // 6. Format phone number to clean E.164 (e.g. 5511999998888)
  formatPhoneNumber(raw: string): string {
    if (!raw) return '';
    const digitsOnly = raw.replace(/\D/g, '');
    if (!digitsOnly) return '';
    if (digitsOnly.length === 10 || digitsOnly.length === 11) {
      return `55${digitsOnly}`;
    }
    return digitsOnly;
  },

  // 7. Generate direct WhatsApp Web / App link (wa.me)
  generateDirectLink(phone: string, text: string): string {
    const cleanPhone = this.formatPhoneNumber(phone);
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  },

  // 8. Interpolate dynamic template tags with real appointment & client data
  interpolateTemplate(
    templateText: string,
    appointment: Partial<Appointment>,
    client?: Partial<ClientProfile> | null
  ): string {
    if (!templateText) return '';

    const clientFullName = client?.name || appointment.clientName || 'Cliente';
    const clientFirstName = clientFullName.split(' ')[0] || clientFullName;
    const clientPhone = client?.phone || (appointment as any)?.phone || '';
    
    const procedures =
      appointment.services && appointment.services.length > 0
        ? appointment.services.map(s => s.name).join(', ')
        : appointment.title || 'Atendimento GlowApp';

    const location = appointment.location || 'Bela Vista, São Paulo - SP';

    let formattedDate = appointment.date || '';
    if (formattedDate && formattedDate.includes('-')) {
      const [y, m, d] = formattedDate.split('-');
      formattedDate = `${d}/${m}/${y}`;
    }

    const priceText =
      appointment.price && appointment.price > 0
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.price)
        : '';

    const notes = appointment.notes || '';
    const startTime = appointment.startTime || '';
    const clinicName = 'GlowApp Clínic';

    let result = templateText;

    // Replace named tags (case-insensitive)
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

    // Replace positional tags ({{1}}, {{2}}, etc.)
    result = result.replace(/\{\{1\}\}|\{1\}/g, clientFullName);
    result = result.replace(/\{\{2\}\}|\{2\}/g, formattedDate);
    result = result.replace(/\{\{3\}\}|\{3\}/g, startTime);
    result = result.replace(/\{\{4\}\}|\{4\}/g, procedures);
    result = result.replace(/\{\{5\}\}|\{5\}/g, location);

    return result;
  },

  // 9. Format standard text reminder for appointment
  formatReminderMessage(
    appointment: Appointment,
    client?: ClientProfile | null,
    customTemplateText?: string
  ): string {
    if (customTemplateText) {
      return this.interpolateTemplate(customTemplateText, appointment, client);
    }

    // Try reading default reminder template from saved templates
    try {
      const cached = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (cached) {
        const list: WhatsAppTemplate[] = JSON.parse(cached);
        const reminderTmpl = list.find(t => t.category === 'Lembrete' || t.id === 'tmpl-1');
        if (reminderTmpl?.bodyText) {
          return this.interpolateTemplate(reminderTmpl.bodyText, appointment, client);
        }
      }
    } catch (e) {}

    return this.interpolateTemplate(DEFAULT_TEMPLATES[0].bodyText, appointment, client);
  },

  // 10. Format confirmation message for appointment
  formatConfirmationMessage(
    appointment: Appointment,
    client?: ClientProfile | null,
    customTemplateText?: string
  ): string {
    if (customTemplateText) {
      return this.interpolateTemplate(customTemplateText, appointment, client);
    }

    try {
      const cached = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (cached) {
        const list: WhatsAppTemplate[] = JSON.parse(cached);
        const confirmTmpl = list.find(t => t.category === 'Confirmação' || t.id === 'tmpl-2');
        if (confirmTmpl?.bodyText) {
          return this.interpolateTemplate(confirmTmpl.bodyText, appointment, client);
        }
      }
    } catch (e) {}

    return this.interpolateTemplate(DEFAULT_TEMPLATES[1].bodyText, appointment, client);
  },

  // 11b. Send appointment reminder directly via WhatsApp Web / App (100% Free, Zero Server Maintenance)
  async sendDirectWhatsApp(
    appointment: Appointment,
    customText?: string,
    clientPhone?: string,
    clientProfile?: ClientProfile | null
  ): Promise<{ success: boolean; url: string; log: WhatsAppMessageLog }> {
    const phone = clientPhone || clientProfile?.phone || (appointment as any).phone || '';
    const cleanPhone = this.formatPhoneNumber(phone);
    const messageContent = customText || this.formatReminderMessage(appointment, clientProfile);
    const directUrl = this.generateDirectLink(cleanPhone, messageContent);

    const logEntry: WhatsAppMessageLog = {
      id: `wlog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      appointmentId: appointment.id,
      clientName: appointment.clientName || 'Cliente',
      phone: cleanPhone,
      messageType: 'lembrete',
      messageContent,
      status: 'enviado',
      createdAt: new Date().toISOString(),
    };

    // Salva o registro nos logs e auditoria do Supabase
    await this.saveLog(logEntry);

    // Abre a conversa do WhatsApp com o texto pronto
    if (typeof window !== 'undefined' && directUrl) {
      window.open(directUrl, '_blank');
    }

    return {
      success: true,
      url: directUrl,
      log: logEntry
    };
  },

  // 11. Send appointment reminder via WhatsApp Web
  async sendAppointmentReminder(
    appointment: Appointment,
    customText?: string,
    clientPhone?: string
  ): Promise<{ success: boolean; message: string; log: WhatsAppMessageLog }> {
    const config = await this.getConfig();
    const phone = clientPhone || (appointment as any).phone || '11999999999';
    const cleanPhone = this.formatPhoneNumber(phone);
    const messageContent = customText || this.formatReminderMessage(appointment);

    const logEntry: WhatsAppMessageLog = {
      id: `wlog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      appointmentId: appointment.id,
      clientName: appointment.clientName || 'Cliente',
      phone: cleanPhone,
      messageType: 'lembrete',
      messageContent,
      status: config.isSimulationMode ? 'simulado' : 'enviado',
      createdAt: new Date().toISOString(),
    };

    if (config.isSimulationMode) {
      await this.saveLog(logEntry);
      return {
        success: true,
        message: `Lembrete simulado com sucesso para ${appointment.clientName} (${cleanPhone}).`,
        log: logEntry,
      };
    }

    // Call WhatsApp Web backend
    try {
      const response = await fetch(`${this.getBaseUrl()}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, message: messageContent }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        logEntry.metaMessageId = data.messageId;
        logEntry.status = 'enviado';
        await this.saveLog(logEntry);
        return {
          success: true,
          message: data.isDuplicatePrevented
            ? `Lembrete já havia sido enviado para ${appointment.clientName}.`
            : `Lembrete enviado com sucesso via WhatsApp para ${appointment.clientName}!`,
          log: logEntry,
        };
      } else {
        const errorMsg = data?.error || 'Falha ao enviar mensagem pelo WhatsApp.';
        logEntry.status = 'falha';
        logEntry.errorMessage = errorMsg;
        await this.saveLog(logEntry);
        return {
          success: false,
          message: errorMsg,
          log: logEntry,
        };
      }
    } catch (err: any) {
      const errorMsg = 'Não foi possível comunicar com o servidor WhatsApp (porta 3001). Verifique se o servidor está ativo.';
      logEntry.status = 'falha';
      logEntry.errorMessage = errorMsg;
      await this.saveLog(logEntry);
      return {
        success: false,
        message: errorMsg,
        log: logEntry,
      };
    }
  },

  // 12. Send Bulk reminders via WhatsApp Web
  async sendBulkReminders(
    appointments: Appointment[],
    clientsList: ClientProfile[] = []
  ): Promise<{ total: number; sent: number; failed: number; logs: WhatsAppMessageLog[] }> {
    const config = await this.getConfig();

    const items = appointments.map(apt => {
      const matchedClient = clientsList.find(c =>
        (apt.clientId && c.id === apt.clientId) ||
        (c.name && c.name.trim().toLowerCase() === apt.clientName.trim().toLowerCase())
      );
      const phone = matchedClient?.phone || '11999999999';
      return {
        id: apt.id,
        clientName: apt.clientName,
        phone: this.formatPhoneNumber(phone),
        message: this.formatReminderMessage(apt, matchedClient),
      };
    });

    if (config.isSimulationMode) {
      const logs: WhatsAppMessageLog[] = [];
      for (const it of items) {
        const logEntry: WhatsAppMessageLog = {
          id: `wlog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          appointmentId: it.id,
          clientName: it.clientName,
          phone: it.phone,
          messageType: 'lembrete',
          messageContent: it.message,
          status: 'simulado',
          createdAt: new Date().toISOString(),
        };
        await this.saveLog(logEntry);
        logs.push(logEntry);
      }
      return { total: items.length, sent: items.length, failed: 0, logs };
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/send-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, delayMs: 2500 }),
      });

      const data = await response.json();
      const logs: WhatsAppMessageLog[] = [];

      if (data.results && Array.isArray(data.results)) {
        for (const res of data.results) {
          const orig = items.find(i => i.id === res.id);
          const logEntry: WhatsAppMessageLog = {
            id: `wlog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            appointmentId: res.id,
            clientName: res.clientName || 'Cliente',
            phone: res.phone,
            messageType: 'lembrete',
            messageContent: orig?.message || '',
            status: res.success ? (res.status || 'enviado') : 'falha',
            metaMessageId: res.messageId || null,
            errorMessage: res.error,
            createdAt: res.sentAt || new Date().toISOString(),
          };
          await this.saveLog(logEntry);
          logs.push(logEntry);
        }
      }

      return {
        total: items.length,
        sent: data.successCount || 0,
        failed: data.failureCount || 0,
        logs,
      };
    } catch (err: any) {
      return {
        total: items.length,
        sent: 0,
        failed: items.length,
        logs: [],
      };
    }
  },

  // 12a. Execute Scheduled Routine On Demand (calls server engine)
  async runScheduledRoutineNow(): Promise<{ success: boolean; total?: number; sent?: number; failed?: number; message?: string }> {
    try {
      const resp = await fetch(`${this.getBaseUrl()}/scheduler/run-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {}
    return { success: false, message: 'Erro ao comunicar com o servidor para disparo do agendador.' };
  },

  // 12b. Get Live Message Statuses from WhatsApp Web backend
  async getMessageStatuses(): Promise<Record<string, { messageId: string; status: 'pendente' | 'enviado' | 'entregue' | 'lido'; ack: number; updatedAt: string }>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/message-statuses`, {
        headers: { 'Accept': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return data.statuses || {};
      }
    } catch (err) {
      try {
        const directResp = await fetch('http://127.0.0.1:3001/api/whatsapp/message-statuses');
        if (directResp.ok) {
          const data = await directResp.json();
          return data.statuses || {};
        }
      } catch (e) {}
    }
    return {};
  },

  // 12c. Sync logs with live message statuses and persist to Supabase
  async syncMessageStatuses(currentLogs: WhatsAppMessageLog[]): Promise<WhatsAppMessageLog[]> {
    const statuses = await this.getMessageStatuses();
    const hasUpdates = Object.keys(statuses).length > 0;
    if (!hasUpdates) return currentLogs;

    let changed = false;
    const updatedLogs = currentLogs.map(log => {
      if (log.metaMessageId && statuses[log.metaMessageId]) {
        const live = statuses[log.metaMessageId];
        if (live.status && live.status !== log.status) {
          changed = true;
          return {
            ...log,
            status: live.status,
            updatedAt: live.updatedAt,
          };
        }
      }
      return log;
    });

    if (changed) {
      try {
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
      } catch (e) {}

      // Update Supabase in background
      if (isSupabaseConfigured && supabase) {
        for (const log of updatedLogs) {
          if (log.metaMessageId && statuses[log.metaMessageId]) {
            try {
              await supabase
                .from('whatsapp_logs')
                .update({ status: log.status })
                .eq('id', log.id);
            } catch (e) {}
          }
        }
      }
    }

    return updatedLogs;
  },

  // 12d. Sync Audit Logs with live message delivery/read statuses (ACKs) and persist to Supabase
  async syncAuditLogsStatuses(currentAudits: WhatsAppAuditLog[]): Promise<WhatsAppAuditLog[]> {
    const statuses = await this.getMessageStatuses();
    const hasUpdates = Object.keys(statuses).length > 0;
    if (!hasUpdates) return currentAudits;

    let changed = false;
    const updatedAudits = currentAudits.map(audit => {
      const match = audit.metaMessageId ? statuses[audit.metaMessageId] : null;
      if (match && match.status && match.status !== audit.status) {
        changed = true;
        const nowIso = match.updatedAt || new Date().toISOString();
        const updated: WhatsAppAuditLog = {
          ...audit,
          status: match.status,
          deliveryAck: match.ack,
          updatedAt: nowIso,
        };
        if (match.status === 'entregue' && !audit.deliveredAt) {
          updated.deliveredAt = nowIso;
        }
        if (match.status === 'lido') {
          if (!audit.deliveredAt) updated.deliveredAt = nowIso;
          updated.readAt = nowIso;
        }
        return updated;
      }
      return audit;
    });

    if (changed) {
      try {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updatedAudits));
      } catch (e) {}

      // Update Supabase in background
      if (isSupabaseConfigured && supabase) {
        for (const audit of updatedAudits) {
          if (audit.metaMessageId && statuses[audit.metaMessageId]) {
            const match = statuses[audit.metaMessageId];
            const nowIso = new Date().toISOString();
            const updatePayload: any = {
              status: match.status,
              delivery_ack: match.ack,
              updated_at: nowIso,
            };
            if (match.status === 'entregue' && !audit.deliveredAt) {
              updatePayload.delivered_at = nowIso;
            }
            if (match.status === 'lido') {
              if (!audit.deliveredAt) updatePayload.delivered_at = nowIso;
              updatePayload.read_at = nowIso;
            }

            try {
              await supabase
                .from('whatsapp_audit_logs')
                .update(updatePayload)
                .eq('id', audit.id);
            } catch (e) {}
          }
        }
      }
    }

    return updatedAudits;
  },

  // 13. Get all templates (Supabase or LocalStorage fallback)
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('whatsapp_templates')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: WhatsAppTemplate[] = data.map(d => ({
            id: d.id,
            name: d.name,
            title: d.title,
            category: d.category || 'Lembrete',
            bodyText: d.body_text,
            variables: d.variables || [],
            example: d.example || '',
          }));
          localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {}
    }

    try {
      const cached = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return DEFAULT_TEMPLATES;
  },

  // 14. Save or update a single template
  async saveTemplate(template: WhatsAppTemplate): Promise<void> {
    try {
      const cached = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      let list: WhatsAppTemplate[] = cached ? JSON.parse(cached) : [...DEFAULT_TEMPLATES];
      const index = list.findIndex(t => t.id === template.id);
      if (index >= 0) {
        list[index] = template;
      } else {
        list.push(template);
      }
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('whatsapp_templates').upsert(
          {
            id: template.id,
            name: template.name,
            title: template.title,
            category: template.category,
            body_text: template.bodyText,
            variables: template.variables || [],
            example: template.example || '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (err) {}
    }
  },

  // 15. Delete a template
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const cached = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (cached) {
        const list: WhatsAppTemplate[] = JSON.parse(cached);
        const filtered = list.filter(t => t.id !== templateId);
        localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (e) {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('whatsapp_templates').delete().eq('id', templateId);
      } catch (e) {}
    }
  },

  // 16. Reset templates to default
  async resetDefaultTemplates(): Promise<WhatsAppTemplate[]> {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
    if (isSupabaseConfigured && supabase) {
      try {
        for (const tmpl of DEFAULT_TEMPLATES) {
          await supabase.from('whatsapp_templates').upsert({
            id: tmpl.id,
            name: tmpl.name,
            title: tmpl.title,
            category: tmpl.category,
            body_text: tmpl.bodyText,
            variables: tmpl.variables,
            example: tmpl.example,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (e) {}
    }
    return DEFAULT_TEMPLATES;
  },

  // 17. Get all logs from database (whatsapp_logs)
  async getLogs(): Promise<WhatsAppMessageLog[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('whatsapp_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (!error && Array.isArray(data)) {
          const mapped: WhatsAppMessageLog[] = data.map(d => ({
            id: d.id,
            appointmentId: d.appointment_id,
            clientName: d.client_name,
            phone: d.phone,
            messageType: d.message_type,
            messageContent: d.message_content,
            status: d.status,
            errorMessage: d.error_message,
            metaMessageId: d.meta_message_id,
            createdAt: d.created_at,
          }));
          localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('[WhatsAppService] Falha ao buscar whatsapp_logs no banco:', err);
      }
    }

    try {
      const cached = localStorage.getItem(LOGS_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}

    return [];
  },

  // 18. Save a log entry & audit trail in database
  async saveLog(log: WhatsAppMessageLog): Promise<void> {
    try {
      const cached = localStorage.getItem(LOGS_STORAGE_KEY);
      const list: WhatsAppMessageLog[] = cached ? JSON.parse(cached) : [];
      list.unshift(log);
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(list.slice(0, 150)));
    } catch (e) {}

    // Also mirror to audit log
    const auditEntry: WhatsAppAuditLog = {
      id: `audit-${log.id}`,
      appointmentId: log.appointmentId,
      clientName: log.clientName,
      phone: log.phone,
      messageType: log.messageType,
      dispatchType: 'manual',
      messageContent: log.messageContent,
      status: log.status,
      errorMessage: log.errorMessage,
      metaMessageId: log.metaMessageId,
      sentAt: log.createdAt,
      createdAt: log.createdAt,
      updatedAt: log.createdAt,
    };
    await this.saveAuditLog(auditEntry);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('whatsapp_logs').upsert({
          id: log.id,
          appointment_id: log.appointmentId || null,
          client_name: log.clientName,
          phone: log.phone,
          message_type: log.messageType,
          message_content: log.messageContent,
          status: log.status,
          error_message: log.errorMessage || null,
          meta_message_id: log.metaMessageId || null,
          created_at: log.createdAt,
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('[WhatsAppService] Erro ao gravar whatsapp_logs no banco:', err);
      }
    }
  },

  // 19. Clear all logs
  async clearLogs(): Promise<void> {
    localStorage.removeItem(LOGS_STORAGE_KEY);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('whatsapp_logs').delete().neq('id', '');
      } catch (e) {}
    }
  },

  // 20. AUDIT TRAIL: Get all Audit Logs directly from Supabase (whatsapp_audit_logs)
  async getAuditLogs(): Promise<WhatsAppAuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('whatsapp_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(300);

        if (!error && Array.isArray(data)) {
          const mapped: WhatsAppAuditLog[] = data.map(d => ({
            id: d.id,
            appointmentId: d.appointment_id,
            clientId: d.client_id,
            clientName: d.client_name,
            phone: d.phone,
            messageType: d.message_type || 'lembrete',
            dispatchType: d.dispatch_type || 'manual',
            scheduledTime: d.scheduled_time,
            daysInAdvance: d.days_in_advance,
            templateId: d.template_id,
            templateName: d.template_name,
            messageContent: d.message_content,
            status: d.status,
            errorMessage: d.error_message,
            metaMessageId: d.meta_message_id,
            deliveryAck: d.delivery_ack,
            sentAt: d.sent_at,
            deliveredAt: d.delivered_at,
            readAt: d.read_at,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
          localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('[WhatsAppService] Falha ao buscar whatsapp_audit_logs no banco:', err);
      }
    }

    try {
      const cached = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}

    return [];
  },

  // 21. AUDIT TRAIL: Save an audit record to Supabase & localStorage
  async saveAuditLog(audit: WhatsAppAuditLog): Promise<void> {
    try {
      const cached = localStorage.getItem(AUDIT_STORAGE_KEY);
      const list: WhatsAppAuditLog[] = cached ? JSON.parse(cached) : [];
      const index = list.findIndex(a => a.id === audit.id || (audit.metaMessageId && a.metaMessageId === audit.metaMessageId));
      if (index >= 0) {
        list[index] = { ...list[index], ...audit, updatedAt: new Date().toISOString() };
      } else {
        list.unshift(audit);
      }
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(list.slice(0, 300)));
    } catch (e) {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('whatsapp_audit_logs').upsert(
          {
            id: audit.id,
            appointment_id: audit.appointmentId || null,
            client_id: audit.clientId || null,
            client_name: audit.clientName,
            phone: audit.phone,
            message_type: audit.messageType,
            dispatch_type: audit.dispatchType || 'manual',
            scheduled_time: audit.scheduledTime || null,
            days_in_advance: typeof audit.daysInAdvance === 'number' ? audit.daysInAdvance : null,
            template_id: audit.templateId || null,
            template_name: audit.templateName || null,
            message_content: audit.messageContent,
            status: audit.status,
            error_message: audit.errorMessage || null,
            meta_message_id: audit.metaMessageId || null,
            delivery_ack: audit.deliveryAck ?? 1,
            sent_at: audit.sentAt || new Date().toISOString(),
            delivered_at: audit.deliveredAt || null,
            read_at: audit.readAt || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (err) {}
    }
  },

  // 22. AUDIT TRAIL: Clear all audit logs
  async clearAuditLogs(): Promise<void> {
    localStorage.removeItem(AUDIT_STORAGE_KEY);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('whatsapp_audit_logs').delete().neq('id', '');
      } catch (e) {}
    }
  },

  // 23. SCHEDULER: Get Scheduler Configuration
  async getSchedulerConfig(): Promise<WhatsAppSchedulerConfig> {
    const defaultScheduler: WhatsAppSchedulerConfig = {
      enabled: false,
      scheduledTimes: ['08:00', '14:00', '18:00'],
      daysInAdvance: 1,
      templateId: 'tmpl-1',
      lastRunAt: null,
      lastRunSummary: null,
      history: [],
    };

    // Try WhatsApp backend
    try {
      const resp = await fetch(`${this.getBaseUrl()}/scheduler`, {
        headers: { 'Accept': 'application/json' },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.config) {
          localStorage.setItem(SCHEDULER_STORAGE_KEY, JSON.stringify(data.config));
          return { ...defaultScheduler, ...data.config };
        }
      }
    } catch (e) {}

    // Fallback to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('whatsapp_config')
          .select('*')
          .eq('id', 'default_config')
          .maybeSingle();

        if (!error && data) {
          const config: WhatsAppSchedulerConfig = {
            enabled: data.is_auto_scheduler_enabled ?? false,
            scheduledTimes: data.scheduled_times || ['08:00', '14:00', '18:00'],
            daysInAdvance: data.days_in_advance ?? 1,
            templateId: data.selected_template_id || 'tmpl-1',
            lastRunAt: data.last_run_at || null,
            lastRunSummary: data.last_run_summary || null,
            history: data.scheduler_history || [],
          };
          localStorage.setItem(SCHEDULER_STORAGE_KEY, JSON.stringify(config));
          return config;
        }
      } catch (err) {}
    }

    try {
      const cached = localStorage.getItem(SCHEDULER_STORAGE_KEY);
      if (cached) {
        return { ...defaultScheduler, ...JSON.parse(cached) };
      }
    } catch (e) {}

    return defaultScheduler;
  },

  // 24. SCHEDULER: Save Scheduler Configuration
  async saveSchedulerConfig(config: WhatsAppSchedulerConfig): Promise<void> {
    try {
      localStorage.setItem(SCHEDULER_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {}

    // Update backend
    try {
      await fetch(`${this.getBaseUrl()}/scheduler/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    } catch (e) {}

    // Update Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('whatsapp_config').upsert(
          {
            id: 'default_config',
            is_auto_scheduler_enabled: config.enabled,
            scheduled_times: config.scheduledTimes,
            days_in_advance: config.daysInAdvance,
            selected_template_id: config.templateId,
            last_run_at: config.lastRunAt || null,
            last_run_summary: config.lastRunSummary || null,
            scheduler_history: config.history || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (err) {}
    }
  },

  // 25. SCHEDULER: Log an automatic scheduled execution
  async logSchedulerExecution(
    summary: {
      targetDate: string;
      scheduledTime: string;
      daysInAdvance: number;
      total: number;
      sent: number;
      failed: number;
    }
  ): Promise<void> {
    const current = await this.getSchedulerConfig();
    const executedAt = new Date().toISOString();
    const historyItem = {
      id: `sched-run-${Date.now()}`,
      date: summary.targetDate,
      time: summary.scheduledTime,
      daysInAdvance: summary.daysInAdvance,
      total: summary.total,
      sent: summary.sent,
      failed: summary.failed,
      executedAt,
    };

    const summaryObj = {
      date: summary.targetDate,
      time: summary.scheduledTime,
      targetDate: summary.targetDate,
      scheduledTime: summary.scheduledTime,
      daysInAdvance: summary.daysInAdvance,
      total: summary.total,
      sent: summary.sent,
      failed: summary.failed,
      executedAt,
    };

    const updatedConfig: WhatsAppSchedulerConfig = {
      ...current,
      lastRunAt: executedAt,
      lastRunSummary: summaryObj,
      history: [historyItem, ...(current.history || [])].slice(0, 50),
    };

    await this.saveSchedulerConfig(updatedConfig);

    // Also notify backend
    try {
      await fetch(`${this.getBaseUrl()}/scheduler/log-execution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary),
      });
    } catch (e) {}
  },

  // 26. Predefined templates
  getPredefinedTemplates(): WhatsAppTemplate[] {
    return DEFAULT_TEMPLATES;
  },
};

