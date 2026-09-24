import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BellRinging,
  WhatsappLogo,
  PaperPlaneTilt,
  CheckCircle,
  Clock,
  CalendarBlank,
  QrCode,
  ChatCircleDots,
  ListBullets,
  MagnifyingGlass,
  ArrowSquareOut,
  Eye,
  X,
  Trash,
  Check,
  Checks,
  XCircle,
  Warning,
  Info,
  ArrowsClockwise,
  SignOut,
  DeviceMobile,
  PencilSimple,
  Plus,
  ArrowCounterClockwise,
  FloppyDisk,
  Tag,
  Timer,
  Play,
  ShieldCheck,
  Robot,
  User,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';

import {
  whatsappService,
  TEMPLATE_FIELD_TAGS,
  type WhatsAppConfig,
  type WhatsAppMessageLog,
  type WhatsAppAuditLog,
  type WhatsAppSchedulerConfig,
  type WhatsAppTemplate,
  type WhatsAppWebStatus
} from '../services/whatsappService';
import { appointmentService, type Appointment } from '../services/appointmentService';
import { clientService, type ClientProfile } from '../services/clientService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ReminderGroup {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  clientName: string;
  clientId?: string;
  clientAvatar?: string;
  location?: string;
  notes?: string;
  appointments: Appointment[];
  services: { id?: string; name: string; price?: number; category?: string }[];
  combinedTitle: string;
  totalPrice: number;
  phone: string;
  hasPhone: boolean;
  isNotified: boolean;
  latestStatus?: string;
  primaryAppointment: Appointment;
}

export const RemindersView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'scheduler' | 'templates' | 'logs' | 'connection'>('queue');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clientsList, setClientsList] = useState<ClientProfile[]>([]);
  const [config, setConfig] = useState<WhatsAppConfig>({
    autoReminderHours: 24,
    serverUrl: 'http://localhost:3001',
    isSimulationMode: false,
  });
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<WhatsAppAuditLog[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);

  // Custom Server URL state
  const [customServerUrl, setCustomServerUrl] = useState('');
  const [isTestingServer, setIsTestingServer] = useState(false);

  // Scheduler Automation State
  const [schedulerConfig, setSchedulerConfig] = useState<WhatsAppSchedulerConfig>({
    enabled: false,
    scheduledTimes: ['08:00', '14:00', '18:00'],
    daysInAdvance: 1,
    templateId: 'tmpl-1',
    lastRunAt: null,
    lastRunSummary: null,
    history: [],
  });
  const [newTimeInput, setNewTimeInput] = useState('09:00');
  const [isSavingScheduler, setIsSavingScheduler] = useState(false);
  const [isRunningScheduledManual, setIsRunningScheduledManual] = useState(false);

  // Audit Logs Filters & State
  const [auditFilterType, setAuditFilterType] = useState<'all' | 'manual' | 'agendado_automatico'>('all');
  const [auditFilterStatus, setAuditFilterStatus] = useState<'all' | 'pendente' | 'enviado' | 'entregue' | 'lido' | 'falha'>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [selectedAuditDetail, setSelectedAuditDetail] = useState<WhatsAppAuditLog | null>(null);
  const [isRefreshingAudits, setIsRefreshingAudits] = useState(false);
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [auditSelectedRowId, setAuditSelectedRowId] = useState<string | null>(null);
  const auditItemsPerPage = 10;

  // WhatsApp Web Session State
  const [webStatus, setWebStatus] = useState<WhatsAppWebStatus>({
    status: 'DISCONNECTED',
    qrCodeDataUrl: null,
    qrCodeRaw: null,
    user: null,
    error: null,
  });
  const [isInitializingClient, setIsInitializingClient] = useState(false);
  const [isDisconnectingClient, setIsDisconnectingClient] = useState(false);
  const tabContentRef = useRef<HTMLDivElement>(null);

  // Reset scroll of the active tab content when switching tabs to prevent unwanted page jumps
  useEffect(() => {
    if (tabContentRef.current) {
      tabContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  // Filters state for Queue
  const [queueFilter, setQueueFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');

  // Notification toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Sending status
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Preview & Custom message modal
  const [previewAppointment, setPreviewAppointment] = useState<Appointment | null>(null);
  const [previewText, setPreviewText] = useState('');
  const [previewPhone, setPreviewPhone] = useState('');

  // Resend confirmation modal state
  const [resendConfirmAppointment, setResendConfirmAppointment] = useState<Appointment | null>(null);

  // Template Editing Modal State
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<{
    id: string;
    name: string;
    title: string;
    category: 'Lembrete' | 'Confirmação' | 'Pós-Procedimento' | 'Informativo';
    bodyText: string;
  }>({
    id: '',
    name: '',
    title: '',
    category: 'Lembrete',
    bodyText: '',
  });
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastExecutedMinuteRef = useRef<string>('');

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Helper date functions (Local Timezone based)
  const getLocalDateString = (daysOffset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getTodayIso = () => getLocalDateString(0);
  const getTomorrowIso = () => getLocalDateString(1);
  const getIn7DaysIso = () => getLocalDateString(7);

  // Render visual status badge for pending reception, sent, delivered, read
  const renderMessageStatusBadge = (status?: WhatsAppMessageLog['status']) => {
    switch (status) {
      case 'pendente':
        return (
          <span
            className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs"
            title="Mensagem em fila, aguardando confirmação do servidor"
          >
            <Clock size={12} weight="bold" className="text-amber-600" />
            <span>Pendente Recepção</span>
          </span>
        );
      case 'enviado':
        return (
          <span
            className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
            title="Lembrete enviado ao cliente via WhatsApp"
          >
            <CheckCircle size={12} weight="fill" className="text-emerald-600" />
            <span>Enviado</span>
          </span>
        );
      case 'entregue':
        return (
          <span
            className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shadow-2xs"
            title="Entregue no aparelho do cliente"
          >
            <Checks size={13} weight="bold" className="text-emerald-600" />
            <span>Entregue</span>
          </span>
        );
      case 'lido':
        return (
          <span
            className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-black shadow-2xs"
            title="Lido / Visualizado pelo cliente"
          >
            <Checks size={13} weight="bold" className="text-emerald-600" />
            <span>Lido</span>
          </span>
        );
      case 'falha':
        return (
          <span
            className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200"
            title="Falha no envio da mensagem"
          >
            <XCircle size={12} weight="fill" className="text-rose-600" />
            <span>Falha no Envio</span>
          </span>
        );
      case 'simulado':
        return (
          <span
            className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
            title="Modo de simulação ativado"
          >
            <CheckCircle size={12} weight="fill" className="text-amber-600" />
            <span>Simulado</span>
          </span>
        );
      default:
        return (
          <span
            className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-50 text-[#8C7A6B] border border-[#E2D8CA]"
            title="Nenhum lembrete disparado ainda para este agendamento"
          >
            <Clock size={12} weight="bold" className="text-stone-400" />
            <span>Não Enviado</span>
          </span>
        );
    }
  };

  // Polling for live WhatsApp Message delivery/read status updates (ACKs: entregue / lido)
  useEffect(() => {
    const timer = setInterval(async () => {
      if (logs.length > 0) {
        try {
          const synced = await whatsappService.syncMessageStatuses(logs);
          if (synced && synced !== logs) {
            setLogs(synced);
          }
        } catch (e) {}
      }
      if (auditLogs.length > 0) {
        try {
          const syncedAudits = await whatsappService.syncAuditLogsStatuses(auditLogs);
          if (syncedAudits && syncedAudits !== auditLogs) {
            setAuditLogs(syncedAudits);
          }
        } catch (e) {}
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [logs, auditLogs]);

  // Check connection status
  const refreshStatus = async () => {
    try {
      const status = await whatsappService.getStatus();
      setWebStatus(status);
    } catch (e) {
      console.warn('Erro ao checar status do WhatsApp:', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        loadedApts,
        loadedClients,
        loadedConfig,
        loadedLogs,
        loadedAudits,
        status,
        loadedTemplates,
        loadedScheduler
      ] = await Promise.all([
        appointmentService.getAppointments(),
        clientService.getClients([]),
        whatsappService.getConfig(),
        whatsappService.getLogs(),
        whatsappService.getAuditLogs(),
        whatsappService.getStatus(),
        whatsappService.getTemplates(),
        whatsappService.getSchedulerConfig(),
      ]);

      setAppointments(loadedApts || []);
      setClientsList(loadedClients || []);
      setConfig(loadedConfig);
      if (loadedConfig.serverUrl) {
        setCustomServerUrl(loadedConfig.serverUrl);
      }
      setLogs(loadedLogs || []);
      setAuditLogs(loadedAudits || []);
      setWebStatus(status);
      setTemplates(loadedTemplates || []);
      setSchedulerConfig(loadedScheduler);
    } catch (err) {
      console.error('Erro ao carregar dados de lembretes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Sincronização em tempo real baseada nas tabelas do banco de dados
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('realtime_whatsapp_reminders_status')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'whatsapp_audit_logs' },
          async () => {
            const updatedAudits = await whatsappService.getAuditLogs();
            setAuditLogs(updatedAudits);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'whatsapp_logs' },
          async () => {
            const updatedLogs = await whatsappService.getLogs();
            setLogs(updatedLogs);
          }
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, []);

  // Target date calculation for automated scheduler
  const getTargetDateForScheduler = (daysAdvance: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAdvance);
    return d.toISOString().split('T')[0];
  };

  // Next scheduled dispatch info calculation
  const nextScheduledTimeInfo = useMemo(() => {
    if (!schedulerConfig.enabled || schedulerConfig.scheduledTimes.length === 0) {
      return { text: 'Agendador Desativado', isToday: false, time: '' };
    }
    const now = new Date();
    const currentH = now.getHours().toString().padStart(2, '0');
    const currentM = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentH}:${currentM}`;

    const upcomingToday = schedulerConfig.scheduledTimes.find(t => t > currentTimeStr);
    if (upcomingToday) {
      return { text: `Hoje às ${upcomingToday}`, isToday: true, time: upcomingToday };
    } else {
      const firstTomorrow = schedulerConfig.scheduledTimes[0];
      return { text: `Amanhã às ${firstTomorrow}`, isToday: false, time: firstTomorrow };
    }
  }, [schedulerConfig.enabled, schedulerConfig.scheduledTimes]);

  // Appointments targeted by current scheduler advance rule
  const scheduledTargetAppointments = useMemo(() => {
    const targetDate = getTargetDateForScheduler(schedulerConfig.daysInAdvance);
    return appointments.filter(apt => apt.status !== 'cancelado' && apt.date === targetDate);
  }, [appointments, schedulerConfig.daysInAdvance]);

  // Toggle scheduler active / inactive
  const handleToggleScheduler = async (newVal: boolean) => {
    const updated = { ...schedulerConfig, enabled: newVal };
    setSchedulerConfig(updated);
    try {
      await whatsappService.saveSchedulerConfig(updated);
      showToast(
        newVal ? 'Disparo automático do WhatsApp ativado!' : 'Disparo automático pausado.',
        newVal ? 'success' : 'info'
      );
    } catch (e) {
      showToast('Erro ao atualizar status do agendamento.', 'error');
    }
  };

  // Add scheduled hour
  const handleAddScheduledTime = (timeToAdd: string) => {
    const cleaned = timeToAdd.trim();
    if (!/^\d{2}:\d{2}$/.test(cleaned)) {
      showToast('Formato de horário inválido (use HH:mm).', 'error');
      return;
    }
    if (schedulerConfig.scheduledTimes.includes(cleaned)) {
      showToast('Este horário já está na lista programada.', 'info');
      return;
    }
    const updatedTimes = [...schedulerConfig.scheduledTimes, cleaned].sort();
    setSchedulerConfig(prev => ({ ...prev, scheduledTimes: updatedTimes }));
  };

  // Remove scheduled hour
  const handleRemoveScheduledTime = (timeToRemove: string) => {
    if (schedulerConfig.scheduledTimes.length <= 1) {
      showToast('Mantenha ao menos um horário programado na lista.', 'info');
      return;
    }
    const updatedTimes = schedulerConfig.scheduledTimes.filter(t => t !== timeToRemove);
    setSchedulerConfig(prev => ({ ...prev, scheduledTimes: updatedTimes }));
  };

  // Save scheduler settings
  const handleSaveSchedulerSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingScheduler(true);
    try {
      await whatsappService.saveSchedulerConfig(schedulerConfig);
      showToast('Configurações de agendamento salvas com sucesso!', 'success');
    } catch (err: any) {
      showToast(`Erro ao salvar: ${err.message || err}`, 'error');
    } finally {
      setIsSavingScheduler(false);
    }
  };

  // Execute scheduled routine (calls server engine or simulation loop)
  const executeScheduledRoutine = async (isManualTest = false) => {
    if (webStatus.status !== 'CONNECTED' && !config.isSimulationMode) {
      showToast('Conecte o WhatsApp na aba "Conexão WhatsApp" antes de disparar.', 'error');
      return;
    }

    if (isManualTest) {
      setIsRunningScheduledManual(true);
    }

    try {
      // 1. If connected to real WhatsApp, run authoritative server-side routine
      if (webStatus.status === 'CONNECTED' && !config.isSimulationMode) {
        const serverResult = await whatsappService.runScheduledRoutineNow();
        if (serverResult.success) {
          const reloadedAudits = await whatsappService.getAuditLogs();
          setAuditLogs(reloadedAudits);
          const reloadedScheduler = await whatsappService.getSchedulerConfig();
          setSchedulerConfig(reloadedScheduler);

          if (serverResult.total === 0) {
            showToast(serverResult.message || 'Nenhum agendamento pendente para a data alvo.', 'info');
          } else {
            showToast(
              `Disparo automático concluído: ${serverResult.sent} enviados com sucesso (${serverResult.failed} falhas).`,
              serverResult.failed && serverResult.failed > 0 ? 'info' : 'success'
            );
          }
          return;
        }
      }

      // 2. Simulation Mode fallback
      const targetDate = getTargetDateForScheduler(schedulerConfig.daysInAdvance);
      const targetApts = appointments.filter(apt => apt.status !== 'cancelado' && apt.date === targetDate);

      if (targetApts.length === 0) {
        if (isManualTest) {
          showToast(`Nenhum agendamento encontrado para a data alvo (${targetDate}).`, 'info');
        }
        return;
      }

      const unnotified = targetApts.filter(apt => {
        const hasLog = logs.some(
          l =>
            l.appointmentId === apt.id &&
            (l.status === 'enviado' || l.status === 'entregue' || l.status === 'lido' || l.status === 'simulado')
        );
        return !hasLog;
      });

      if (unnotified.length === 0) {
        if (isManualTest) {
          showToast(`Todos os ${targetApts.length} agendamentos de ${targetDate} já receberam lembrete!`, 'info');
        }
        return;
      }

      const selectedTmpl = templates.find(t => t.id === schedulerConfig.templateId) || templates[0];
      const customTemplateText = selectedTmpl?.bodyText;

      let sentCount = 0;
      let failedCount = 0;
      const newLogs: WhatsAppMessageLog[] = [];

      for (const apt of unnotified) {
        const matchedClient = getClientForAppointment(apt);
        const phone = matchedClient?.phone || '11999999999';
        const formattedMsg = whatsappService.formatReminderMessage(apt, matchedClient, customTemplateText);

        const res = await whatsappService.sendAppointmentReminder(apt, formattedMsg, phone);
        if (res.success) {
          sentCount++;
        } else {
          failedCount++;
        }
        newLogs.push(res.log);
      }

      await whatsappService.logSchedulerExecution({
        targetDate,
        scheduledTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        daysInAdvance: schedulerConfig.daysInAdvance,
        total: unnotified.length,
        sent: sentCount,
        failed: failedCount,
      });

      setLogs(prev => [...newLogs, ...prev]);
      const reloadedAudits = await whatsappService.getAuditLogs();
      setAuditLogs(reloadedAudits);
      const reloadedScheduler = await whatsappService.getSchedulerConfig();
      setSchedulerConfig(reloadedScheduler);

      showToast(
        `Disparo simulado: ${sentCount} lembretes enviados para ${targetDate}.`,
        'success'
      );
    } catch (err: any) {
      showToast(`Erro na rotina de agendamento: ${err.message || err}`, 'error');
    } finally {
      if (isManualTest) {
        setIsRunningScheduledManual(false);
      }
    }
  };

  // Autonomous background runner loop
  useEffect(() => {
    if (!schedulerConfig.enabled) return;

    const interval = setInterval(() => {
      if (webStatus.status !== 'CONNECTED' && !config.isSimulationMode) return;

      const now = new Date();
      const currentH = now.getHours().toString().padStart(2, '0');
      const currentM = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${currentH}:${currentM}`;
      const dateStr = now.toISOString().split('T')[0];
      const slotKey = `${dateStr}_${timeStr}`;

      if (schedulerConfig.scheduledTimes.includes(timeStr) && lastExecutedMinuteRef.current !== slotKey) {
        lastExecutedMinuteRef.current = slotKey;
        console.log(`[Auto Scheduler] Horário programado atingido: ${timeStr}. Disparando rotina automática...`);
        executeScheduledRoutine(false);
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [schedulerConfig, webStatus.status, config.isSimulationMode, appointments, logs, templates]);

  // Polling interval for WhatsApp Web status & QR Code
  useEffect(() => {
    const intervalMs =
      webStatus.status === 'QR_READY' || webStatus.status === 'INITIALIZING' || webStatus.status === 'AUTHENTICATING'
        ? 3000
        : 10000;
    const timer = setInterval(() => {
      refreshStatus();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [webStatus.status]);

  // Start WhatsApp Client / Request QR Code
  const handleStartWhatsApp = async () => {
    setIsInitializingClient(true);
    try {
      const res = await whatsappService.initializeClient();
      setWebStatus(res);
      showToast('Inicializando WhatsApp Web... O QR Code aparecerá na tela.', 'info');
    } catch (err: any) {
      showToast(`Erro ao iniciar WhatsApp Web: ${err.message || err}`, 'error');
    } finally {
      setIsInitializingClient(false);
    }
  };

  // Disconnect WhatsApp
  const handleDisconnectWhatsApp = async () => {
    if (!confirm('Deseja realmente desconectar a sessão do WhatsApp?')) return;
    setIsDisconnectingClient(true);
    try {
      await whatsappService.disconnectClient();
      await refreshStatus();
      showToast('Sessão do WhatsApp desconectada.', 'info');
    } catch (err: any) {
      showToast(`Erro ao desconectar: ${err.message || err}`, 'error');
    } finally {
      setIsDisconnectingClient(false);
    }
  };

  // Helper to check if an appointment already received a reminder strictly based on database tables
  const getAppointmentReminderStatus = (apt: Appointment) => {
    const matchedClient = getClientForAppointment(apt);
    const cleanPhone = (matchedClient?.phone || '').replace(/\D/g, '');
    const cleanClientName = (apt.clientName || '').trim().toLowerCase();
    const aptDate = apt.date; // YYYY-MM-DD

    const validStatuses = ['enviado', 'entregue', 'lido', 'simulado', 'pendente'];

    // 1. Check in auditLogs first (tabela whatsapp_audit_logs)
    const audit = auditLogs.find(a => {
      if (!a) return false;
      // Direct appointment_id match
      if (a.appointmentId && a.appointmentId === apt.id) return true;
      // Match by client_id on the same date
      if (apt.clientId && a.clientId && a.clientId === apt.clientId && (a.createdAt?.startsWith(aptDate) || a.sentAt?.startsWith(aptDate))) return true;
      // Match by phone on the same date
      const logPhone = (a.phone || '').replace(/\D/g, '');
      if (cleanPhone && logPhone && logPhone === cleanPhone && (a.createdAt?.startsWith(aptDate) || a.sentAt?.startsWith(aptDate))) return true;
      // Match by client name on the same date
      const logName = (a.clientName || '').trim().toLowerCase();
      if (cleanClientName && logName && logName === cleanClientName && (a.createdAt?.startsWith(aptDate) || a.sentAt?.startsWith(aptDate))) return true;
      return false;
    });

    if (audit && validStatuses.includes(audit.status)) {
      return { isNotified: true, status: audit.status, latestLog: audit };
    }

    // 2. Check in standard logs (tabela whatsapp_logs)
    const log = logs.find(l => {
      if (!l) return false;
      // Direct appointment_id match
      if (l.appointmentId && l.appointmentId === apt.id) return true;
      // Match by phone on the same date
      const logPhone = (l.phone || '').replace(/\D/g, '');
      if (cleanPhone && logPhone && logPhone === cleanPhone && l.createdAt?.startsWith(aptDate)) return true;
      // Match by client name on the same date
      const logName = (l.clientName || '').trim().toLowerCase();
      if (cleanClientName && logName && logName === cleanClientName && l.createdAt?.startsWith(aptDate)) return true;
      return false;
    });

    if (log && validStatuses.includes(log.status)) {
      return { isNotified: true, status: log.status, latestLog: log };
    }

    return { isNotified: false, status: log?.status || audit?.status, latestLog: log || audit };
  };

  // Helper to find client phone
  const getClientForAppointment = (apt: Partial<Appointment>): ClientProfile | undefined => {
    const targetName = (apt.clientName || '').trim().toLowerCase();
    return clientsList.find(
      c =>
        (apt.clientId && c.id === apt.clientId) ||
        (c.name && c.name.trim().toLowerCase() === targetName)
    );
  };

  // Filtered and GROUPED appointments for reminders queue (grouped by Date + Horário + Cliente)
  const filteredReminderGroups = useMemo<ReminderGroup[]>(() => {
    const today = getTodayIso();
    const tomorrow = getTomorrowIso();
    const in7Days = getIn7DaysIso();

    // 1. Filter raw appointments
    const validApts = appointments.filter(apt => {
      if (apt.status === 'cancelado') return false;
      if (queueFilter === 'today' && apt.date !== today) return false;
      if (queueFilter === 'tomorrow' && apt.date !== tomorrow) return false;
      if (queueFilter === 'week' && (apt.date < today || apt.date > in7Days)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const clientName = (apt.clientName || '').toLowerCase();
        const title = (apt.title || '').toLowerCase();
        const location = (apt.location || '').toLowerCase();
        return clientName.includes(q) || title.includes(q) || location.includes(q);
      }

      return true;
    });

    // 2. Group by date + startTime + clientName
    const map = new Map<string, {
      id: string;
      date: string;
      startTime: string;
      endTime?: string;
      clientName: string;
      clientId?: string;
      clientAvatar?: string;
      location?: string;
      notes?: string;
      appointments: Appointment[];
      services: { id?: string; name: string; price?: number; category?: string }[];
      totalPrice: number;
    }>();

    validApts.forEach(apt => {
      const clientKey = (apt.clientName || '').trim().toLowerCase();
      const timeKey = (apt.startTime || '').trim();
      const dateKey = apt.date;
      const groupKey = `${dateKey}_${timeKey}_${clientKey}`;

      const matchedClient = clientsList.find(
        c => (apt.clientId && c.id === apt.clientId) || (c.name && c.name.trim().toLowerCase() === clientKey)
      );

      let aptServices: { id?: string; name: string; price?: number; category?: string }[] = [];
      if (apt.services && apt.services.length > 0) {
        aptServices = apt.services.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price || 0,
          category: s.category || apt.category
        }));
      } else {
        let srvPrice = apt.price || 0;
        if (srvPrice === 0 && matchedClient && matchedClient.procedures) {
          const matchProc = matchedClient.procedures.find(p => p.title.toLowerCase() === apt.title.toLowerCase());
          if (matchProc && matchProc.price) {
            srvPrice = matchProc.price;
          }
        }
        aptServices = [{
          id: apt.id,
          name: apt.title,
          price: srvPrice,
          category: apt.category
        }];
      }

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          id: apt.id,
          date: apt.date,
          startTime: apt.startTime,
          endTime: apt.endTime,
          clientName: apt.clientName,
          clientId: apt.clientId,
          clientAvatar: apt.clientAvatar,
          location: apt.location || 'Bela Vista, São Paulo - SP',
          notes: apt.notes,
          appointments: [apt],
          services: [...aptServices],
          totalPrice: aptServices.reduce((sum, s) => sum + (s.price || 0), 0)
        });
      } else {
        const existing = map.get(groupKey)!;
        existing.appointments.push(apt);
        existing.services.push(...aptServices);
        existing.totalPrice += aptServices.reduce((sum, s) => sum + (s.price || 0), 0);
      }
    });

    const groups: ReminderGroup[] = Array.from(map.values()).map(g => {
      const matchedClient = clientsList.find(
        c => (g.clientId && c.id === g.clientId) || (c.name && c.name.trim().toLowerCase() === g.clientName.trim().toLowerCase())
      );
      const phone = matchedClient?.phone || 'Telefone não cadastrado';
      const hasPhone = Boolean(phone && phone !== 'Telefone não cadastrado');

      // Check notification status across all appointments in the group
      let isNotified = false;
      let latestStatus: string | undefined = undefined;

      for (const apt of g.appointments) {
        const statusCheck = getAppointmentReminderStatus(apt);
        if (statusCheck.isNotified) {
          isNotified = true;
          latestStatus = statusCheck.status;
          break;
        }
      }

      // Unique service names
      const uniqueServiceNames: string[] = [];
      g.services.forEach(s => {
        if (!uniqueServiceNames.includes(s.name)) {
          uniqueServiceNames.push(s.name);
        }
      });
      const combinedTitle = uniqueServiceNames.join(' + ');

      // Primary consolidated appointment for sending/preview
      const primaryAppointment: Appointment = {
        ...g.appointments[0],
        date: g.date,
        startTime: g.startTime,
        endTime: g.endTime || g.appointments[0]?.endTime || '',
        clientName: g.clientName,
        clientId: g.clientId,
        location: g.location,
        title: combinedTitle || g.appointments[0]?.title || 'Atendimento',
        price: g.totalPrice,
        notes: g.notes || g.appointments[0]?.notes || '',
        services: g.services.map((s, idx) => ({
          id: s.id || `srv-${idx}`,
          name: s.name,
          price: s.price || 0,
          category: s.category || 'Geral'
        }))
      };

      return {
        ...g,
        combinedTitle,
        phone,
        hasPhone,
        isNotified,
        latestStatus,
        primaryAppointment
      };
    });

    // Sort by Date then Horário
    groups.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    return groups;
  }, [appointments, queueFilter, searchQuery, clientsList, auditLogs, logs]);

  // Strictly pending reminder groups in current queue
  const pendingReminderGroups = useMemo(() => {
    return filteredReminderGroups.filter(g => !g.isNotified);
  }, [filteredReminderGroups]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(item => {
      if (auditFilterType !== 'all' && item.dispatchType !== auditFilterType) return false;
      if (auditFilterStatus !== 'all' && item.status !== auditFilterStatus) return false;
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase();
        const client = (item.clientName || '').toLowerCase();
        const phone = (item.phone || '').toLowerCase();
        const content = (item.messageContent || '').toLowerCase();
        const tmpl = (item.templateName || '').toLowerCase();
        return client.includes(q) || phone.includes(q) || content.includes(q) || tmpl.includes(q);
      }
      return true;
    });
  }, [auditLogs, auditFilterType, auditFilterStatus, auditSearchQuery]);

  // Pagination calculation for Audit Logs (matching ClientListView)
  const auditTotalPages = Math.ceil(filteredAuditLogs.length / auditItemsPerPage) || 1;
  const auditStartIndex = (auditCurrentPage - 1) * auditItemsPerPage;
  const paginatedAuditLogs = useMemo(() => {
    return filteredAuditLogs.slice(auditStartIndex, auditStartIndex + auditItemsPerPage);
  }, [filteredAuditLogs, auditStartIndex, auditItemsPerPage]);

  // Metrics for Audit Logs
  const auditMetrics = useMemo(() => {
    const total = auditLogs.length;
    const autoCount = auditLogs.filter(a => a.dispatchType === 'agendado_automatico').length;
    const manualCount = auditLogs.filter(a => a.dispatchType === 'manual' || !a.dispatchType).length;
    const deliveredOrRead = auditLogs.filter(a => a.status === 'entregue' || a.status === 'lido').length;
    const failedCount = auditLogs.filter(a => a.status === 'falha').length;
    return { total, autoCount, manualCount, deliveredOrRead, failedCount };
  }, [auditLogs]);

  // Refresh Audit Logs from Database
  const handleRefreshAuditLogs = async () => {
    setIsRefreshingAudits(true);
    try {
      const audits = await whatsappService.getAuditLogs();
      setAuditLogs(audits);
      const standardLogs = await whatsappService.getLogs();
      setLogs(standardLogs);
      showToast('Tabela de auditoria atualizada com sucesso!', 'success');
    } catch (err: any) {
      showToast(`Erro ao atualizar auditoria: ${err.message || err}`, 'error');
    } finally {
      setIsRefreshingAudits(false);
    }
  };

  // Clear Audit Logs from Database
  const handleClearAuditLogs = async () => {
    if (confirm('Deseja realmente limpar permanentemente todos os registros de auditoria da base de dados?')) {
      await whatsappService.clearAuditLogs();
      await whatsappService.clearLogs();
      setAuditLogs([]);
      setLogs([]);
      showToast('Auditoria e registros excluídos da base de dados.', 'info');
    }
  };

  // Single reminder send handler (supports both Background Server and Direct 1-Click Free WhatsApp)
  const executeSendReminder = async (apt: Appointment) => {
    setSendingId(apt.id);
    const matchedClient = getClientForAppointment(apt);
    const phone = matchedClient?.phone || '11999999999';

    try {
      if (webStatus.status === 'CONNECTED' && !config.isSimulationMode) {
        // Envio via robô backend
        const res = await whatsappService.sendAppointmentReminder(apt, undefined, phone);
        if (res.success) {
          showToast(res.message, 'success');
          setLogs(prev => [res.log, ...prev]);
          const reloaded = await whatsappService.getAuditLogs();
          setAuditLogs(reloaded);
        } else {
          // Fallback para envio direto se o servidor falhar
          await whatsappService.sendDirectWhatsApp(apt, undefined, phone, matchedClient);
          showToast(`Servidor offline. Abrindo WhatsApp Direto para ${apt.clientName}...`, 'info');
          const reloaded = await whatsappService.getAuditLogs();
          setAuditLogs(reloaded);
        }
      } else {
        // Modo 100% Gratuito: Envio Direto via WhatsApp Web/App
        const res = await whatsappService.sendDirectWhatsApp(apt, undefined, phone, matchedClient);
        showToast(`Abrindo WhatsApp para ${apt.clientName}... Lembrete registrado como enviado!`, 'success');
        setLogs(prev => [res.log, ...prev]);
        const reloaded = await whatsappService.getAuditLogs();
        setAuditLogs(reloaded);
      }
    } catch (err: any) {
      showToast(`Erro ao disparar lembrete: ${err.message || err}`, 'error');
    } finally {
      setSendingId(null);
      setResendConfirmAppointment(null);
    }
  };

  // Click on reminder action button in queue list
  const handleReminderButtonClick = (apt: Appointment, hasSent: boolean) => {
    if (hasSent) {
      setResendConfirmAppointment(apt);
    } else {
      executeSendReminder(apt);
    }
  };

  // Bulk send reminders handler (strictly pending reminder groups)
  const handleSendBulk = async () => {
    if (pendingReminderGroups.length === 0) {
      showToast('Todos os agendamentos da lista já receberam lembrete!', 'info');
      return;
    }

    if (webStatus.status === 'CONNECTED' && !config.isSimulationMode) {
      setIsSendingBulk(true);
      try {
        const consolidatedApts = pendingReminderGroups.map(g => g.primaryAppointment);
        const res = await whatsappService.sendBulkReminders(consolidatedApts, clientsList);
        showToast(
          `Disparos concluídos: ${res.sent} enviados com sucesso, ${res.failed} falhas.`,
          res.failed > 0 ? 'info' : 'success'
        );
        setLogs(prev => [...res.logs, ...prev]);
        const reloaded = await whatsappService.getAuditLogs();
        setAuditLogs(reloaded);
      } catch (err: any) {
        showToast(`Erro no disparo em massa: ${err.message || err}`, 'error');
      } finally {
        setIsSendingBulk(false);
      }
    } else {
      // Modo Gratuito: Abre o primeiro pendente e orienta o usuário
      const firstGroup = pendingReminderGroups[0];
      const matchedClient = getClientForAppointment(firstGroup.primaryAppointment);
      await whatsappService.sendDirectWhatsApp(
        firstGroup.primaryAppointment,
        undefined,
        firstGroup.phone,
        matchedClient
      );
      showToast(
        `Abrindo 1º lembrete (${firstGroup.clientName}). Clique nos botões "Disparar" de cada cliente para enviar os próximos.`,
        'info'
      );
      const reloaded = await whatsappService.getAuditLogs();
      setAuditLogs(reloaded);
    }
  };

  // Open preview modal
  const handleOpenPreview = (apt: Appointment) => {
    const matchedClient = getClientForAppointment(apt);
    const text = whatsappService.formatReminderMessage(apt, matchedClient);
    const phone = matchedClient?.phone || '11999999999';

    setPreviewAppointment(apt);
    setPreviewText(text);
    setPreviewPhone(phone);
  };

  // Send from preview modal
  const handleSendFromPreview = async () => {
    if (!previewAppointment) return;

    setSendingId(previewAppointment.id);
    try {
      if (webStatus.status === 'CONNECTED' && !config.isSimulationMode) {
        const res = await whatsappService.sendAppointmentReminder(previewAppointment, previewText, previewPhone);
        if (res.success) {
          showToast(res.message, 'success');
          setLogs(prev => [res.log, ...prev]);
          setPreviewAppointment(null);
          const reloaded = await whatsappService.getAuditLogs();
          setAuditLogs(reloaded);
        } else {
          await whatsappService.sendDirectWhatsApp(previewAppointment, previewText, previewPhone);
          showToast('Abrindo WhatsApp Direto...', 'info');
          setPreviewAppointment(null);
          const reloaded = await whatsappService.getAuditLogs();
          setAuditLogs(reloaded);
        }
      } else {
        // Envio direto gratuito
        const res = await whatsappService.sendDirectWhatsApp(previewAppointment, previewText, previewPhone);
        showToast(`Abrindo WhatsApp para ${previewAppointment.clientName}... Mensagem registrada!`, 'success');
        setLogs(prev => [res.log, ...prev]);
        setPreviewAppointment(null);
        const reloaded = await whatsappService.getAuditLogs();
        setAuditLogs(reloaded);
      }
    } catch (err: any) {
      showToast(`Erro ao enviar: ${err.message || err}`, 'error');
    } finally {
      setSendingId(null);
    }
  };

  // Template Management Handlers
  const handleOpenEditTemplate = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      id: template.id,
      name: template.name,
      title: template.title,
      category: template.category,
      bodyText: template.bodyText,
    });
  };

  const handleOpenCreateTemplate = () => {
    const newId = `tmpl-${Date.now()}`;
    const newTmpl: WhatsAppTemplate = {
      id: newId,
      name: `modelo_personalizado_${Date.now()}`,
      title: 'Novo Modelo de Mensagem',
      category: 'Lembrete',
      bodyText: 'Olá, {nome}! ✨ Mensagem da {clinica} sobre seu agendamento em {data} às {horario}.',
      variables: ['Nome do Cliente', 'Nome da Clínica', 'Data', 'Horário'],
      example: '',
    };
    setEditingTemplate(newTmpl);
    setTemplateForm({
      id: newTmpl.id,
      name: newTmpl.name,
      title: newTmpl.title,
      category: newTmpl.category,
      bodyText: newTmpl.bodyText,
    });
  };

  // Insert tag into textarea at cursor position
  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setTemplateForm(prev => ({ ...prev, bodyText: prev.bodyText + tag }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const oldText = templateForm.bodyText;
    const newText = oldText.substring(0, start) + tag + oldText.substring(end);

    setTemplateForm(prev => ({ ...prev, bodyText: newText }));

    // Reposition cursor after tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Save template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.title.trim() || !templateForm.bodyText.trim()) {
      showToast('Preencha o título e o texto do modelo.', 'error');
      return;
    }

    setIsSavingTemplate(true);
    try {
      const updatedTemplate: WhatsAppTemplate = {
        id: templateForm.id,
        name: templateForm.name || `tmpl_${Date.now()}`,
        title: templateForm.title.trim(),
        category: templateForm.category,
        bodyText: templateForm.bodyText.trim(),
        variables: ['Campos Dinâmicos'],
        example: whatsappService.interpolateTemplate(templateForm.bodyText.trim(), {
          clientName: 'Maria Silva',
          date: '2026-09-24',
          startTime: '14:30',
          title: 'Limpeza de Pele Glow',
          location: 'Bela Vista, São Paulo - SP',
          price: 280,
        }),
      };

      await whatsappService.saveTemplate(updatedTemplate);
      const reloaded = await whatsappService.getTemplates();
      setTemplates(reloaded);
      setEditingTemplate(null);
      showToast('Modelo de mensagem salvo com sucesso!', 'success');
    } catch (err: any) {
      showToast(`Erro ao salvar modelo: ${err.message || err}`, 'error');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Reset to default templates
  const handleResetTemplates = async () => {
    if (!confirm('Deseja restaurar todos os modelos para as mensagens padrão do sistema?')) return;
    try {
      const defaults = await whatsappService.resetDefaultTemplates();
      setTemplates(defaults);
      showToast('Modelos restaurados para o padrão original.', 'info');
    } catch (err: any) {
      showToast(`Erro ao restaurar: ${err.message || err}`, 'error');
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Deseja realmente excluir este modelo?')) return;
    try {
      await whatsappService.deleteTemplate(templateId);
      const reloaded = await whatsappService.getTemplates();
      setTemplates(reloaded);
      showToast('Modelo excluído com sucesso.', 'info');
    } catch (err: any) {
      showToast(`Erro ao excluir modelo: ${err.message || err}`, 'error');
    }
  };

  const isConnected = webStatus.status === 'CONNECTED';

  // Dynamic preview text for template editor
  const dynamicPreviewText = useMemo(() => {
    if (!templateForm.bodyText) return '';
    return whatsappService.interpolateTemplate(templateForm.bodyText, {
      clientName: 'Maria Silva',
      date: '2026-09-24',
      startTime: '14:30',
      title: 'Limpeza de Pele Glow',
      location: 'Bela Vista, São Paulo - SP',
      price: 280,
      notes: 'Chegar com 10min de antecedência',
    }, {
      name: 'Maria Silva',
      phone: '(11) 98765-4321',
    });
  }, [templateForm.bodyText]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden px-4 sm:px-8 pt-4 pb-2 max-w-7xl mx-auto text-stone-800 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center space-x-3 bg-white/98 backdrop-blur-xl text-[#3D3028] border-2 border-[#c5922a]/50 px-5 py-3 rounded-2xl shadow-[0_15px_45px_-10px_rgba(197,146,42,0.35)] animate-fade-in transition-all max-w-md">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 shadow-xs text-[#c5922a]">
            {notification.type === 'success' ? (
              <CheckCircle size={20} weight="fill" className="text-emerald-600" />
            ) : (
              <Warning size={20} weight="fill" className="text-amber-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-[#3D3028] leading-tight">{notification.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="w-6 h-6 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TOP HERO HEADER (Fixed Top)                               */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#c5922a] to-[#966b1a] text-amber-50 border border-amber-200/90 flex items-center justify-center shadow-md shadow-amber-900/15 shrink-0">
            <BellRinging size={22} weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3D3028] tracking-tight">
              Lembretes &amp; WhatsApp
            </h1>
            <p className="text-xs text-[#8C7A6B] font-semibold mt-0.5">
              Envio automático de lembretes e confirmações de agendamentos para clientes
            </p>
          </div>
        </div>

        {/* Quick Bulk Send Button */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleSendBulk}
            disabled={isSendingBulk || pendingReminderGroups.length === 0}
            className={`flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 rounded-2xl text-xs font-black shadow-md shadow-amber-900/15 hover:shadow-lg active:scale-95 transition-all cursor-pointer ${
              isSendingBulk || pendingReminderGroups.length === 0 ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {isSendingBulk ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Disparando...</span>
              </>
            ) : (
              <>
                <PaperPlaneTilt size={15} weight="bold" />
                <span>Disparar ({pendingReminderGroups.length}) Pendentes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* NAVIGATION TABS (Fixed Top Bar)                           */}
      {/* 1. Fila | 2. Auditoria & Logs | 3. Modelos | 4. Agendador | 5. Conexão */}
      {/* ========================================================= */}
      <div className="flex items-center space-x-2 border-b border-[#E2D8CA]/80 pb-2.5 mb-4 overflow-x-auto shrink-0 scrollbar-none">
        {/* TAB 1: Fila de Lembretes */}
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'queue'
              ? 'bg-[#3D3028] text-amber-50 shadow-sm'
              : 'text-[#6A5A4D] hover:bg-[#FAF6F0] hover:text-[#3D3028]'
          }`}
        >
          <ListBullets size={16} weight="bold" />
          <span>Fila de Lembretes</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'queue' ? 'bg-white/20 text-amber-100' : 'bg-[#EFE9DF] text-[#8C7A6B]'
            }`}
          >
            {pendingReminderGroups.length > 0 ? `${pendingReminderGroups.length} pendentes` : filteredReminderGroups.length}
          </span>
        </button>

        {/* TAB 2: Auditoria & Logs */}
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'logs'
              ? 'bg-[#3D3028] text-amber-50 shadow-sm'
              : 'text-[#6A5A4D] hover:bg-[#FAF6F0] hover:text-[#3D3028]'
          }`}
        >
          <Clock size={16} weight="bold" />
          <span>Auditoria &amp; Logs</span>
          {(auditLogs.length > 0 || logs.length > 0) && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'logs' ? 'bg-white/20 text-amber-100' : 'bg-[#EFE9DF] text-[#8C7A6B]'
              }`}
            >
              {auditLogs.length || logs.length}
            </span>
          )}
        </button>

        {/* TAB 3: Modelos de Mensagens */}
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'templates'
              ? 'bg-[#3D3028] text-amber-50 shadow-sm'
              : 'text-[#6A5A4D] hover:bg-[#FAF6F0] hover:text-[#3D3028]'
          }`}
        >
          <ChatCircleDots size={16} weight="bold" />
          <span>Modelos de Mensagens</span>
        </button>

        {/* TAB 4: Agendamento Automático */}
        <button
          type="button"
          onClick={() => setActiveTab('scheduler')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'scheduler'
              ? 'bg-[#3D3028] text-amber-50 shadow-sm'
              : 'text-[#6A5A4D] hover:bg-[#FAF6F0] hover:text-[#3D3028]'
          }`}
        >
          <Timer size={16} weight="bold" />
          <span>Agendamento Automático</span>
          {schedulerConfig.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Agendamento Ativo" />
          )}
        </button>

        {/* TAB 5: Conexão WhatsApp */}
        <button
          type="button"
          onClick={() => setActiveTab('connection')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'connection'
              ? 'bg-[#3D3028] text-amber-50 shadow-sm'
              : 'text-[#6A5A4D] hover:bg-[#FAF6F0] hover:text-[#3D3028]'
          }`}
        >
          <QrCode size={16} weight="bold" />
          <span>Conexão WhatsApp</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SCROLLABLE TAB CONTENT CONTAINER                          */}
      {/* ========================================================= */}
      <div ref={tabContentRef} className="flex-1 min-h-0 overflow-y-auto pr-1 pb-6 scrollbar-thin scrollbar-thumb-[#E2D8CA]/60 scrollbar-track-transparent">
        {/* ========================================================= */}
        {/* TAB 1: FILA DE LEMBRETES (QUEUE)                         */}
        {/* ========================================================= */}
        {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Free 1-Click WhatsApp Direct Mode Banner */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-[#FAF6F0] border border-emerald-500/20 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                <WhatsappLogo size={22} weight="fill" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#3D3028] flex items-center space-x-2">
                  <span>Envio Inteligente via WhatsApp (100% Gratuito)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">Ativo</span>
                </h4>
                <p className="text-[11px] text-[#8C7A6B] font-medium mt-0.5">
                  Clique em <strong>Disparar</strong> em qualquer cliente abaixo para abrir a conversa com a mensagem pronta. O envio é registrado automaticamente na auditoria e no histórico.
                </p>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-3xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setQueueFilter('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  queueFilter === 'today'
                    ? 'bg-[#c5922a] text-amber-50 shadow-xs'
                    : 'bg-[#FAF6F0] text-[#6A5A4D] hover:bg-[#EFE9DF]'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setQueueFilter('tomorrow')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  queueFilter === 'tomorrow'
                    ? 'bg-[#c5922a] text-amber-50 shadow-xs'
                    : 'bg-[#FAF6F0] text-[#6A5A4D] hover:bg-[#EFE9DF]'
                }`}
              >
                Amanhã
              </button>
              <button
                type="button"
                onClick={() => setQueueFilter('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  queueFilter === 'week'
                    ? 'bg-[#c5922a] text-amber-50 shadow-xs'
                    : 'bg-[#FAF6F0] text-[#6A5A4D] hover:bg-[#EFE9DF]'
                }`}
              >
                Próximos 7 Dias
              </button>
              <button
                type="button"
                onClick={() => setQueueFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  queueFilter === 'all'
                    ? 'bg-[#c5922a] text-amber-50 shadow-xs'
                    : 'bg-[#FAF6F0] text-[#6A5A4D] hover:bg-[#EFE9DF]'
                }`}
              >
                Todos
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <MagnifyingGlass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, procedimento ou local..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs font-medium bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X size={13} weight="bold" />
                </button>
              )}
            </div>
          </div>

          {/* List of Appointments in Queue */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#c5922a]/30 border-t-[#c5922a] rounded-full animate-spin" />
              <span className="text-xs font-bold text-stone-500">Carregando agendamentos...</span>
            </div>
          ) : filteredReminderGroups.length === 0 ? (
            <div className="bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-3xl p-12 text-center text-stone-400 shadow-sm flex flex-col items-center justify-center space-y-3">
              <CalendarBlank size={40} weight="duotone" className="text-stone-300" />
              <p className="text-sm font-bold text-[#6A5A4D]">Nenhum agendamento encontrado para este período.</p>
              <p className="text-xs text-[#A6978A]">Altere o filtro acima ou crie novos agendamentos na Agenda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReminderGroups.map(group => {
                const matchedClient = getClientForAppointment(group.primaryAppointment);
                const isSendingThis = sendingId === group.primaryAppointment.id;
                const directLink = whatsappService.generateDirectLink(
                  group.phone,
                  whatsappService.formatReminderMessage(group.primaryAppointment, matchedClient)
                );

                return (
                  <div
                    key={group.id}
                    className={`bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 border-2 shadow-xs hover:shadow-md ${
                      group.isNotified
                        ? 'border-emerald-500 bg-gradient-to-r from-emerald-50/20 via-white to-white shadow-emerald-500/10'
                        : 'border-amber-400 bg-gradient-to-r from-amber-50/20 via-white to-white shadow-amber-400/10'
                    }`}
                  >
                    {/* Left Info: Avatar + Details */}
                    <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-[#FAF6F0] border border-[#E2D8CA] flex items-center justify-center text-[#966b1a] shrink-0 font-black text-sm shadow-2xs relative">
                        {group.clientAvatar ? (
                          <img
                            src={group.clientAvatar}
                            alt={group.clientName}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          <span>{(group.clientName || 'C')[0].toUpperCase()}</span>
                        )}
                        {group.isNotified && (
                          <span
                            className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs"
                            title="Lembrete WhatsApp Já Enviado"
                          >
                            <Check size={10} weight="bold" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-[#3D3028] truncate">{group.clientName}</h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8C7A6B] font-medium mt-1">
                          <span className="flex items-center space-x-1">
                            <WhatsappLogo size={13} weight="fill" className="text-emerald-600" />
                            <span>{group.phone}</span>
                          </span>

                          <span className="text-stone-300">•</span>

                          <span className="flex items-center space-x-1">
                            <CalendarBlank size={13} className="text-[#c5922a]" />
                            <span>{group.date}</span>
                          </span>

                          <span className="text-stone-300">•</span>

                          <span className="flex items-center space-x-1 text-[#966b1a] font-bold">
                            <Clock size={13} />
                            <span>{group.startTime}</span>
                          </span>

                          {group.location && (
                            <>
                              <span className="text-stone-300">•</span>
                              <span className="truncate max-w-xs text-stone-500">{group.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Actions: Preview, Direct WhatsApp, Send/Resend via WhatsApp */}
                    <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(group.primaryAppointment)}
                        className="px-3 py-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#EFE9DF] text-[#6A5A4D] hover:text-[#3D3028] border border-[#E2D8CA] text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                        title="Pré-visualizar e editar mensagem"
                      >
                        <Eye size={14} weight="bold" />
                        <span className="hidden sm:inline">Ver Mensagem</span>
                      </button>

                      {group.hasPhone && (
                        <a
                          href={directLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                          title="Abrir no WhatsApp Web / Celular"
                        >
                          <ArrowSquareOut size={14} weight="bold" />
                          <span className="hidden sm:inline">WhatsApp Direto</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleReminderButtonClick(group.primaryAppointment, group.isNotified)}
                        disabled={isSendingThis}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs hover:shadow transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                          group.isNotified
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50'
                        } ${isSendingThis ? 'opacity-60 cursor-not-allowed' : ''}`}
                        title={group.isNotified ? 'Clique para reenviar lembrete pelo WhatsApp' : 'Disparar lembrete pelo WhatsApp'}
                      >
                        {isSendingThis ? (
                          <>
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : group.isNotified ? (
                          <>
                            <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                            <span>Enviado</span>
                            <span title="Clique para reenviar" className="inline-flex items-center">
                              <ArrowsClockwise size={11} weight="bold" className="text-emerald-700 opacity-70 ml-0.5" />
                            </span>
                          </>
                        ) : (
                          <>
                            <PaperPlaneTilt size={14} weight="bold" />
                            <span>Disparar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: AGENDAMENTO AUTOMÁTICO DE NOTIFICAÇÕES (SCHEDULER) */}
      {/* ========================================================= */}
      {activeTab === 'scheduler' && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Status & Hero Overview */}
          <div className="bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#EBE4D8]">
              <div className="flex items-start space-x-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  schedulerConfig.enabled
                    ? 'bg-gradient-to-br from-[#c5922a] to-[#966b1a] text-amber-50 shadow-amber-900/15'
                    : 'bg-stone-200 text-stone-500'
                }`}>
                  <Timer size={28} weight="bold" />
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg sm:text-xl font-black text-[#3D3028]">
                      Rotina de Agendamento Automático
                    </h3>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      schedulerConfig.enabled
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border-stone-200'
                    }`}>
                      {schedulerConfig.enabled ? 'Ativo e Operante' : 'Pausado'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8C7A6B] font-medium mt-1">
                    Envio programado e automático de notificações no WhatsApp sem necessidade de intervenção manual
                  </p>
                  <p className="text-xs font-bold text-[#966b1a] mt-2 flex items-center space-x-1.5">
                    <Clock size={14} weight="bold" />
                    <span>Próximo Disparo Previsto: <strong>{nextScheduledTimeInfo.text}</strong></span>
                  </p>
                </div>
              </div>

              {/* Master Enable / Disable Switch */}
              <div className="flex items-center space-x-3 self-start md:self-center bg-[#FAF6F0] border border-[#E2D8CA] p-3.5 rounded-2xl">
                <span className="text-xs font-black text-[#3D3028]">
                  {schedulerConfig.enabled ? 'Automação Ativada' : 'Automação Desativada'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleScheduler(!schedulerConfig.enabled)}
                  className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer ${
                    schedulerConfig.enabled ? 'bg-[#c5922a]' : 'bg-stone-300'
                  }`}
                  title="Ativar/desativar envio automático"
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                      schedulerConfig.enabled ? 'left-7.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Quick summary strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#E2D8CA]">
                <span className="text-[10px] font-black uppercase text-[#8C7A6B]">Antecedência de Envio</span>
                <p className="text-sm font-black text-[#3D3028] mt-0.5">
                  {schedulerConfig.daysInAdvance === 0
                    ? 'Mesmo dia do atendimento (Hoje)'
                    : `${schedulerConfig.daysInAdvance} dia(s) antes (Data Alvo: ${getTargetDateForScheduler(schedulerConfig.daysInAdvance)})`}
                </p>
              </div>

              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#E2D8CA]">
                <span className="text-[10px] font-black uppercase text-[#8C7A6B]">Horários no Dia</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {schedulerConfig.scheduledTimes.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-lg bg-white border border-[#E2D8CA] font-mono font-bold text-[#3D3028]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#E2D8CA]">
                <span className="text-[10px] font-black uppercase text-[#8C7A6B]">Modelo Utilizado</span>
                <p className="text-sm font-black text-[#3D3028] mt-0.5 truncate">
                  {templates.find(t => t.id === schedulerConfig.templateId)?.title || 'Lembrete de Agendamento (Padrão)'}
                </p>
              </div>
            </div>
          </div>

          {/* Config form & Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Settings Configuration */}
            <div className="lg:col-span-7 bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="pb-3 border-b border-[#EBE4D8]">
                <h4 className="text-base font-black text-[#3D3028]">Regras de Programação de Envio</h4>
                <p className="text-xs text-[#8C7A6B] font-medium mt-0.5">
                  Defina os horários do dia e a antecedência em dias para filtrar os agendamentos
                </p>
              </div>

              <form onSubmit={handleSaveSchedulerSettings} className="space-y-5">
                {/* 1. Days in Advance Selector */}
                <div>
                  <label className="block text-xs font-black text-[#3D3028] uppercase tracking-wider mb-2">
                    1. Com quantos dias de antecedência entrará no filtro de envio?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { days: 0, label: 'No mesmo dia', sub: 'Hoje' },
                      { days: 1, label: '1 dia antes', sub: 'Amanhã (24h) ⭐' },
                      { days: 2, label: '2 dias antes', sub: '48h antes' },
                      { days: 3, label: '3 dias antes', sub: '72h antes' },
                      { days: 7, label: '7 dias antes', sub: '1 semana antes' },
                    ].map(opt => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setSchedulerConfig(prev => ({ ...prev, daysInAdvance: opt.days }))}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          schedulerConfig.daysInAdvance === opt.days
                            ? 'bg-amber-50 border-[#c5922a] text-[#3D3028] shadow-xs ring-1 ring-[#c5922a]'
                            : 'bg-[#FAF6F0] border-[#E2D8CA] text-[#6A5A4D] hover:bg-[#FAF0DE]'
                        }`}
                      >
                        <p className="text-xs font-black">{opt.label}</p>
                        <p className="text-[10px] text-[#8C7A6B] font-semibold mt-0.5">{opt.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Scheduled Hours (Multiple per day) */}
                <div>
                  <label className="block text-xs font-black text-[#3D3028] uppercase tracking-wider mb-2">
                    2. Horários programados para envio no dia (1 ou mais horários):
                  </label>

                  {/* Active times list */}
                  <div className="p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#E2D8CA] space-y-3 mb-3">
                    <span className="text-[11px] font-bold text-[#8C7A6B] block">
                      Horários Ativos configurados para disparo diário:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {schedulerConfig.scheduledTimes.map(time => (
                        <div
                          key={time}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2D8CA] text-xs font-mono font-black text-[#3D3028] shadow-2xs group"
                        >
                          <Clock size={13} className="text-[#c5922a]" />
                          <span>{time}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveScheduledTime(time)}
                            className="text-stone-400 hover:text-rose-600 ml-1 cursor-pointer transition-colors"
                            title={`Remover horário ${time}`}
                          >
                            <X size={12} weight="bold" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add time input + shortcuts */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="time"
                      value={newTimeInput}
                      onChange={e => setNewTimeInput(e.target.value)}
                      className="bg-white border border-[#E2D8CA] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleAddScheduledTime(newTimeInput);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#FAF6F0] hover:bg-[#FAF0DE] border border-[#E2D8CA] text-xs font-black text-[#3D3028] transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus size={14} weight="bold" className="text-[#c5922a]" />
                      <span>Adicionar Horário</span>
                    </button>
                  </div>

                  {/* Quick shortcuts */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="text-[10px] font-bold text-stone-400 mr-1">Atalhos rápidos:</span>
                    {['08:00', '12:00', '15:00', '18:00', '20:00'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleAddScheduledTime(t)}
                        className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-[10px] font-mono font-bold text-stone-600 hover:text-amber-900 transition-colors cursor-pointer"
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Message Template Selection */}
                <div>
                  <label className="block text-xs font-black text-[#3D3028] uppercase tracking-wider mb-1">
                    3. Modelo de Mensagem a ser disparado:
                  </label>
                  <select
                    value={schedulerConfig.templateId}
                    onChange={e => setSchedulerConfig(prev => ({ ...prev, templateId: e.target.value }))}
                    className="w-full bg-white border border-[#E2D8CA] rounded-xl px-3.5 py-2 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-2xs"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Save Button */}
                <div className="pt-3 border-t border-[#EBE4D8] flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingScheduler}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 text-xs font-black shadow-md shadow-amber-900/15 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <FloppyDisk size={16} weight="bold" />
                    <span>{isSavingScheduler ? 'Salvando...' : 'Salvar Regras de Agendamento'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Target Queue Preview & Manual Trigger Test */}
            <div className="lg:col-span-5 space-y-5">
              {/* Preview of Appointments Target for Next Run */}
              <div className="bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#EBE4D8]">
                  <div>
                    <h4 className="text-sm font-black text-[#3D3028]">Fila Prevista para Próximo Disparo</h4>
                    <p className="text-[11px] text-[#8C7A6B] font-semibold">
                      Agendamentos de <strong>{getTargetDateForScheduler(schedulerConfig.daysInAdvance)}</strong> ({schedulerConfig.daysInAdvance === 0 ? 'Hoje' : `${schedulerConfig.daysInAdvance} dia(s) de antecedência`})
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[#c5922a] text-xs font-black">
                    {scheduledTargetAppointments.length} clientes
                  </span>
                </div>

                {scheduledTargetAppointments.length === 0 ? (
                  <div className="py-8 text-center text-stone-400 text-xs font-medium space-y-1">
                    <CalendarBlank size={28} className="mx-auto text-stone-300" />
                    <p>Nenhum agendamento encontrado para a data alvo.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                    {scheduledTargetAppointments.map(apt => {
                      const matched = getClientForAppointment(apt);
                      const phone = matched?.phone || 'Sem telefone';
                      return (
                        <div
                          key={apt.id}
                          className="bg-[#FAF6F0] rounded-xl p-2.5 border border-[#E2D8CA] flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#3D3028] truncate">{apt.clientName}</p>
                            <p className="text-[10px] text-[#8C7A6B]">{apt.startTime} • {phone}</p>
                          </div>
                          <span className="text-[10px] font-semibold text-stone-500 truncate max-w-[120px]">
                            {apt.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Manual Test Action Button */}
                <div className="pt-3 border-t border-[#EBE4D8]">
                  <button
                    type="button"
                    onClick={() => executeScheduledRoutine(true)}
                    disabled={isRunningScheduledManual || scheduledTargetAppointments.length === 0}
                    className={`w-full py-2.5 rounded-2xl bg-[#FAF6F0] hover:bg-[#FAF0DE] border border-[#E2D8CA] text-[#3D3028] text-xs font-black shadow-2xs hover:shadow transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      isRunningScheduledManual || scheduledTargetAppointments.length === 0 ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {isRunningScheduledManual ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-[#c5922a] border-t-transparent rounded-full animate-spin" />
                        <span>Disparando Rotina de Teste...</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} weight="fill" className="text-[#c5922a]" />
                        <span>Executar Disparo de Teste Agora</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Execution History */}
              <div className="bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#EBE4D8]">
                  <h4 className="text-sm font-black text-[#3D3028]">Histórico das Execuções Automáticas</h4>
                  <Clock size={16} className="text-stone-400" />
                </div>

                {(!schedulerConfig.history || schedulerConfig.history.length === 0) ? (
                  <p className="text-xs text-stone-400 text-center py-4 font-medium">
                    Nenhuma execução automática registrada ainda.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1 text-xs">
                    {schedulerConfig.history.map(item => (
                      <div
                        key={item.id}
                        className="bg-[#FAF6F0] p-2.5 rounded-xl border border-[#E2D8CA] flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-[#3D3028]">
                            {new Date(item.executedAt).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-[10px] text-[#8C7A6B]">
                            Data Alvo: {item.date} ({item.daysInAdvance} dias antes)
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.sent} enviados
                          </span>
                          {item.failed > 0 && (
                            <span className="ml-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              {item.failed} falhas
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MODELOS DE MENSAGENS (TEMPLATES)                   */}
      {/* ========================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#EBE4D8]">
              <div>
                <h3 className="text-lg font-black text-[#3D3028]">Modelos de Mensagens WhatsApp</h3>
                <p className="text-xs text-[#8C7A6B] font-medium mt-0.5">
                  Personalize os textos e insira campos chaves do cadastro de clientes e agendamentos
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleResetTemplates}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#EFE9DF] text-[#6A5A4D] border border-[#E2D8CA] text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Restaurar textos padrão originais"
                >
                  <ArrowCounterClockwise size={14} weight="bold" />
                  <span>Restaurar Padrões</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateTemplate}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 text-xs font-black shadow-xs hover:shadow transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus size={14} weight="bold" />
                  <span>Novo Modelo</span>
                </button>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {templates.map(tmpl => {
                const samplePreview = whatsappService.interpolateTemplate(tmpl.bodyText, {
                  clientName: 'Maria Silva',
                  date: '2026-09-24',
                  startTime: '14:30',
                  title: 'Limpeza de Pele Glow',
                  location: 'Bela Vista, São Paulo - SP',
                  price: 280,
                }, {
                  name: 'Maria Silva',
                  phone: '(11) 98765-4321',
                });

                return (
                  <div
                    key={tmpl.id}
                    className="bg-[#FAF6F0]/80 rounded-2xl border border-[#E8DFD3] p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all relative overflow-hidden"
                  >
                    <div>
                      {/* Header: Title + Category + Edit Button */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F4EFE6] text-[#8C6D46] border border-[#E2D8CA] block w-fit mb-1">
                            {tmpl.category}
                          </span>
                          <h4 className="text-sm font-black text-[#3D3028]">{tmpl.title}</h4>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTemplate(tmpl)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 border border-[#E2D8CA] text-xs font-bold text-[#8C6418] transition-all flex items-center space-x-1 cursor-pointer shadow-2xs"
                            title="Editar texto e campos do modelo"
                          >
                            <PencilSimple size={13} weight="bold" />
                            <span>Editar</span>
                          </button>

                          {templates.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(tmpl.id)}
                              className="p-1 rounded-lg bg-white hover:bg-rose-50 border border-[#E2D8CA] text-stone-400 hover:text-rose-600 transition-all cursor-pointer shadow-2xs"
                              title="Excluir modelo"
                            >
                              <Trash size={13} weight="bold" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Smartphone-style Chat Bubble */}
                      <div className="bg-[#E7F8E8] border border-[#BDECC0] rounded-2xl p-3.5 shadow-2xs text-xs text-stone-800 leading-relaxed font-sans whitespace-pre-line relative">
                        <div className="absolute -top-1.5 left-4 w-3 h-3 bg-[#E7F8E8] border-t border-l border-[#BDECC0] rotate-45" />
                        {samplePreview || tmpl.bodyText}
                        <div className="text-[10px] text-right text-stone-400 mt-2 font-medium flex items-center justify-end space-x-1">
                          <span>Hoje 09:30</span>
                          <Check size={12} weight="bold" className="text-emerald-600" />
                        </div>
                      </div>
                    </div>

                    {/* Raw Template Preview */}
                    <div className="pt-2 border-t border-[#E8DFD3] text-[11px] text-[#6A5A4D] font-mono bg-white/70 rounded-xl p-2.5 border border-[#E2D8CA]/60 line-clamp-2">
                      {tmpl.bodyText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CONEXÃO WHATSAPP (QR CODE)                        */}
      {/* ========================================================= */}
      {activeTab === 'connection' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Main QR Code & Connection Card */}
          <div className="lg:col-span-8 bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EBE4D8]">
              <div>
                <h3 className="text-lg font-black text-[#3D3028]">Autenticação do WhatsApp via QR Code</h3>
                <p className="text-xs text-[#8C7A6B] font-medium mt-0.5">
                  Conecte o WhatsApp diretamente pelo navegador sem custos de API externa
                </p>
              </div>

              {/* Clean Status Badge */}
              <div
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-black self-start sm:self-center border ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : webStatus.status === 'QR_READY'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected
                      ? 'bg-emerald-500'
                      : webStatus.status === 'QR_READY'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <span>
                  {isConnected
                    ? 'Sessão Ativa e Pronta'
                    : webStatus.status === 'QR_READY'
                    ? 'Aguardando Leitura do QR'
                    : webStatus.status === 'INITIALIZING'
                    ? 'Inicializando...'
                    : 'Desconectado'}
                </span>
              </div>
            </div>

            {/* Connection States */}
            {isConnected ? (
              /* CONNECTED STATE (Clean, no specific individual names) */
              <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#E2D8CA] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                    <WhatsappLogo size={36} weight="fill" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#3D3028]">
                      WhatsApp Conectado com Sucesso
                    </h4>
                    <p className="text-xs text-[#8C7A6B] font-semibold mt-0.5">
                      Sessão salva localmente no navegador e pronta para envios de lembretes.
                    </p>
                    <p className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center space-x-1">
                      <CheckCircle size={13} weight="fill" />
                      <span>Autenticação ativa e persistente</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnectWhatsApp}
                  disabled={isDisconnectingClient}
                  className="px-4 py-2.5 rounded-2xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-black shadow-xs hover:shadow transition-all flex items-center space-x-2 cursor-pointer shrink-0"
                >
                  <SignOut size={16} weight="bold" />
                  <span>{isDisconnectingClient ? 'Desconectando...' : 'Desconectar Sessão'}</span>
                </button>
              </div>
            ) : webStatus.status === 'QR_READY' && webStatus.qrCodeDataUrl ? (
              /* QR CODE READY STATE */
              <div className="flex flex-col items-center justify-center space-y-6 py-4">
                <div className="p-4 bg-white rounded-3xl border-2 border-[#c5922a]/40 shadow-xl relative group">
                  <img
                    src={webStatus.qrCodeDataUrl}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-2xl"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={refreshStatus}
                    className="px-4 py-2 rounded-xl bg-[#FAF6F0] hover:bg-[#EFE9DF] border border-[#E2D8CA] text-xs font-bold text-[#3D3028] transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <ArrowsClockwise size={14} weight="bold" />
                    <span>Atualizar Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartWhatsApp}
                    disabled={isInitializingClient}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-amber-50 text-xs font-black shadow-xs hover:shadow transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <QrCode size={14} weight="bold" />
                    <span>Gerar Novo QR Code</span>
                  </button>
                </div>
              </div>
            ) : (
              /* DISCONNECTED / INITIALIZING STATE */
              <div className="p-8 rounded-3xl bg-[#FAF6F0] border border-[#E2D8CA] text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-200 flex items-center justify-center text-[#c5922a] shadow-xs">
                  <DeviceMobile size={32} weight="duotone" />
                </div>

                <div className="max-w-md">
                  <h4 className="text-base font-black text-[#3D3028]">Nenhuma conta conectada</h4>
                  <p className="text-xs text-[#8C7A6B] font-medium mt-1">
                    Clique no botão abaixo para gerar o QR Code de autenticação no seu WhatsApp.
                  </p>
                </div>

                {webStatus.error && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-[#8C6D46] text-xs font-semibold max-w-md text-left space-y-1">
                    <div className="flex items-center space-x-1.5 font-black text-[#966b1a]">
                      <Info size={16} weight="fill" />
                      <span>Status da Conexão do Servidor</span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed break-words">
                      {webStatus.error.includes('Could not find Chrome') ? (
                        <>
                          O servidor no Render está ativo, mas o Chromium ainda está finalizando o deploy. No Render, clique em <strong>Manual Deploy &gt; Clear build cache &amp; deploy</strong> para concluir a instalação do Chrome.
                        </>
                      ) : (
                        webStatus.error
                      )}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleStartWhatsApp}
                  disabled={isInitializingClient}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 text-xs font-black shadow-md shadow-amber-900/15 hover:shadow-lg active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  {isInitializingClient ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Gerando QR Code...</span>
                    </>
                  ) : (
                    <>
                      <QrCode size={18} weight="bold" />
                      <span>Conectar WhatsApp &amp; Gerar QR Code</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Remote Backend Server Configuration (Render.com / Custom URL) */}
            <div className="p-5 rounded-3xl bg-[#FAF6F0] border border-[#E2D8CA] space-y-3 shadow-xs">
              <div className="flex items-center space-x-2 text-[#966b1a]">
                <Robot size={20} weight="fill" />
                <h4 className="text-xs font-black text-[#3D3028]">Servidor do Robô WhatsApp (Render / Nuvem)</h4>
              </div>
              <p className="text-[11px] text-[#8C7A6B] font-medium leading-relaxed">
                Insira a URL do seu serviço gerado no <strong>Render.com</strong> para manter a conexão ativa 24h na nuvem:
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  placeholder="https://seu-servico-whatsapp.onrender.com"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#E2D8CA] text-xs text-[#3D3028] placeholder-stone-400 focus:outline-none focus:border-[#c5922a] font-mono shadow-2xs"
                />
                <button
                  type="button"
                  disabled={isTestingServer}
                  onClick={async () => {
                    setIsTestingServer(true);
                    try {
                      const updatedConfig = { ...config, serverUrl: customServerUrl.trim() };
                      setConfig(updatedConfig);
                      await whatsappService.saveConfig(updatedConfig);
                      const testStatus = await whatsappService.getStatus();
                      setWebStatus(testStatus);
                      if (testStatus.status === 'CONNECTED' || testStatus.status === 'QR_READY' || testStatus.status === 'DISCONNECTED') {
                        showToast('Servidor salvo e conectado com sucesso!', 'success');
                      } else {
                        showToast('Servidor salvo. Clique em "Conectar WhatsApp" para gerar o QR Code.', 'info');
                      }
                    } catch (e: any) {
                      showToast('Servidor salvo no perfil local.', 'info');
                    } finally {
                      setIsTestingServer(false);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#c5922a] hover:bg-[#b38222] text-amber-50 text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5 shrink-0 shadow-2xs"
                >
                  {isTestingServer ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FloppyDisk size={14} weight="bold" />
                  )}
                  <span>Salvar &amp; Conectar</span>
                </button>
              </div>
            </div>

            {/* Simulation Mode Switch */}
            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E2D8CA] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-[#3D3028]">Modo de Simulação (Testes Locais)</h4>
                <p className="text-[11px] text-[#8C7A6B] font-medium">
                  Permite simular o disparo de lembretes e registrar histórico mesmo se o WhatsApp estiver desconectado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...config, isSimulationMode: !config.isSimulationMode };
                  setConfig(updated);
                  whatsappService.saveConfig(updated);
                  showToast(
                    updated.isSimulationMode ? 'Modo de Simulação ativado.' : 'Modo de Simulação desativado.',
                    'info'
                  );
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  config.isSimulationMode ? 'bg-[#c5922a]' : 'bg-stone-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                    config.isSimulationMode ? 'left-6.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Step-by-step Instructions Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#FAF6F0]/90 border border-[#E2D8CA] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2.5 text-[#966b1a]">
                <Info size={20} weight="fill" />
                <h4 className="text-sm font-black text-[#3D3028]">Como conectar seu WhatsApp?</h4>
              </div>

              <div className="space-y-3.5 text-xs text-[#5C4A3E] font-medium leading-relaxed">
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#c5922a] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    Abra o aplicativo do <strong>WhatsApp</strong> no seu celular.
                  </p>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#c5922a] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    Toque em <strong>Configurações</strong> (no iPhone) ou nos <strong>três pontinhos</strong> (no Android) e selecione <strong>Aparelhos Conectados</strong>.
                  </p>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#c5922a] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    Toque em <strong>Conectar um Aparelho</strong> e aponte a câmera do seu celular para o <strong>QR Code</strong>.
                  </p>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#c5922a] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </div>
                  <p>
                    Pronto! A sessão fica salva de forma persistente para disparar lembretes a qualquer momento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AUDITORIA & LOGS DE MENSAGENS (GRID FORMAT)         */}
      {/* ========================================================= */}
      {activeTab === 'logs' && (
        <div className="flex-1 flex flex-col justify-between space-y-4">
          {/* Top Bar: Filter Tabs + Counter */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2D8CA]/80 pb-2.5 mb-1">
            <div className="flex items-center space-x-2 sm:space-x-2.5 overflow-x-auto py-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setAuditFilterType('all');
                  setAuditFilterStatus('all');
                  setAuditCurrentPage(1);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
                  auditFilterType === 'all' && auditFilterStatus === 'all'
                    ? 'bg-[#3D3028] text-amber-50 shadow-sm'
                    : 'text-[#6A5A4D] hover:text-[#3D3028] hover:bg-white/60'
                }`}
              >
                <span>Todas as mensagens</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  auditFilterType === 'all' && auditFilterStatus === 'all' ? 'bg-amber-200/30 text-amber-100' : 'bg-[#EAE2D5] text-[#6A5A4D]'
                }`}>
                  {auditLogs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuditFilterType('agendado_automatico');
                  setAuditFilterStatus('all');
                  setAuditCurrentPage(1);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
                  auditFilterType === 'agendado_automatico'
                    ? 'bg-[#3D3028] text-amber-50 shadow-sm'
                    : 'text-[#6A5A4D] hover:text-[#3D3028] hover:bg-white/60'
                }`}
              >
                <Robot size={13} weight="fill" className={auditFilterType === 'agendado_automatico' ? 'text-purple-300' : 'text-purple-600'} />
                <span>Automáticos</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  auditFilterType === 'agendado_automatico' ? 'bg-amber-200/30 text-amber-100' : 'bg-[#EAE2D5] text-[#6A5A4D]'
                }`}>
                  {auditMetrics.autoCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuditFilterType('manual');
                  setAuditFilterStatus('all');
                  setAuditCurrentPage(1);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
                  auditFilterType === 'manual'
                    ? 'bg-[#3D3028] text-amber-50 shadow-sm'
                    : 'text-[#6A5A4D] hover:text-[#3D3028] hover:bg-white/60'
                }`}
              >
                <User size={13} weight="bold" className={auditFilterType === 'manual' ? 'text-blue-300' : 'text-blue-600'} />
                <span>Manuais</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  auditFilterType === 'manual' ? 'bg-amber-200/30 text-amber-100' : 'bg-[#EAE2D5] text-[#6A5A4D]'
                }`}>
                  {auditMetrics.manualCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuditFilterType('all');
                  setAuditFilterStatus('lido');
                  setAuditCurrentPage(1);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
                  auditFilterStatus === 'lido' || auditFilterStatus === 'entregue'
                    ? 'bg-[#3D3028] text-amber-50 shadow-sm'
                    : 'text-[#6A5A4D] hover:text-[#3D3028] hover:bg-white/60'
                }`}
              >
                <Checks size={13} weight="bold" className="text-emerald-500" />
                <span>Entregues / Lidos</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  auditFilterStatus === 'lido' || auditFilterStatus === 'entregue' ? 'bg-amber-200/30 text-amber-100' : 'bg-[#EAE2D5] text-[#6A5A4D]'
                }`}>
                  {auditMetrics.deliveredOrRead}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuditFilterType('all');
                  setAuditFilterStatus('falha');
                  setAuditCurrentPage(1);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
                  auditFilterStatus === 'falha'
                    ? 'bg-[#3D3028] text-amber-50 shadow-sm'
                    : 'text-[#6A5A4D] hover:text-[#3D3028] hover:bg-white/60'
                }`}
              >
                <XCircle size={13} weight="fill" className="text-rose-500" />
                <span>Falhas</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  auditFilterStatus === 'falha' ? 'bg-amber-200/30 text-amber-100' : 'bg-[#EAE2D5] text-[#6A5A4D]'
                }`}>
                  {auditMetrics.failedCount}
                </span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleRefreshAuditLogs}
                disabled={isRefreshingAudits}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF6F0] text-[#3D3028] border border-[#E2D8CA] text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                title="Recarregar registros do banco de dados"
              >
                <ArrowsClockwise size={13} weight="bold" className={isRefreshingAudits ? 'animate-spin' : ''} />
                <span>{isRefreshingAudits ? 'Atualizando...' : 'Atualizar'}</span>
              </button>

              {(auditLogs.length > 0 || logs.length > 0) && (
                <button
                  type="button"
                  onClick={handleClearAuditLogs}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Excluir histórico de auditoria da base"
                >
                  <Trash size={13} weight="bold" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar Row */}
          <div className="relative w-full">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Pesquisar por cliente, telefone, modelo ou trecho de mensagem..."
              value={auditSearchQuery}
              onChange={e => {
                setAuditSearchQuery(e.target.value);
                setAuditCurrentPage(1);
              }}
              className="w-full bg-white/95 border border-[#E2D8CA] rounded-2xl pl-9 pr-8 py-2 text-xs font-semibold text-[#3D3028] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-2xs"
            />
            {auditSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setAuditSearchQuery('');
                  setAuditCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer"
              >
                <X size={13} weight="bold" />
              </button>
            )}
          </div>

          {/* Table Header Row (12-Column Grid Layout matching ClientListView) */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#8C7A6B] select-none">
            <div className="col-span-3">Destinatário / Cliente</div>
            <div className="col-span-2">Processo WhatsApp</div>
            <div className="col-span-3">Procedimento &amp; Valor</div>
            <div className="col-span-2">Data / Hora</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Ações</div>
          </div>

          {/* Empty State */}
          {filteredAuditLogs.length === 0 && (
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-10 text-center border border-[#EBE4D8] shadow-sm flex flex-col items-center justify-center space-y-3 my-2">
              <div className="w-14 h-14 rounded-full bg-[#F6F3EE] border border-[#E2D8CA] flex items-center justify-center text-[#c5922a]">
                <ShieldCheck size={30} weight="duotone" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#3D3028]">Nenhum registro de auditoria encontrado</h3>
                <p className="text-xs text-[#8C7A6B] mt-1 max-w-sm">
                  {auditSearchQuery
                    ? `Não foram encontradas mensagens com o termo "${auditSearchQuery}".`
                    : 'Nenhuma mensagem enviada nos filtros selecionados.'}
                </p>
              </div>
              {(auditFilterType !== 'all' || auditFilterStatus !== 'all' || auditSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setAuditFilterType('all');
                    setAuditFilterStatus('all');
                    setAuditSearchQuery('');
                    setAuditCurrentPage(1);
                  }}
                  className="text-xs font-bold text-[#966b1a] underline hover:text-[#c5922a] cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          )}

          {/* Grid Rows List (Cards matching ClientListView layout & styling) */}
          {paginatedAuditLogs.length > 0 && (
            <div className="space-y-2">
              {paginatedAuditLogs.map((item) => {
                const isSelected = auditSelectedRowId === item.id;
                const matchedApt = appointments.find(
                  a => a.id === item.appointmentId || (a.clientName && a.clientName.trim().toLowerCase() === (item.clientName || '').trim().toLowerCase())
                );
                const procedureTitle = matchedApt?.title || item.templateName || 'Atendimento GlowApp';
                const procedurePrice = matchedApt?.price;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAuditDetail(item)}
                    onMouseEnter={() => setAuditSelectedRowId(item.id)}
                    className={`relative group rounded-2xl transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-amber-50 border-amber-300/40 shadow-[0_10px_25px_-5px_rgba(197,146,42,0.35)] scale-[1.006]'
                        : 'bg-white/95 hover:bg-white text-[#3D3028] border-[#EBE4D8] hover:border-[#c5922a]/50 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="p-3 sm:p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center">
                      {/* Column 1: Destinatário / Cliente (Avatar + Name + Phone) */}
                      <div className="col-span-1 md:col-span-3 flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-2xs ${
                            isSelected
                              ? 'bg-white/20 border-white/40 text-white'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          }`}
                        >
                          <WhatsappLogo size={20} weight="fill" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs sm:text-sm font-black truncate ${isSelected ? 'text-white' : 'text-[#3D3028]'}`}>
                            {item.clientName || 'Cliente'}
                          </h4>
                          <p className={`text-[11px] font-mono font-bold truncate ${isSelected ? 'text-amber-100/90' : 'text-[#8C7A6B]'}`}>
                            {item.phone || 'Sem telefone'}
                          </p>
                        </div>
                      </div>

                      {/* Column 2: Processo WhatsApp (Identificação do Tipo de Disparo) */}
                      <div className="col-span-1 md:col-span-2 flex items-center">
                        {item.dispatchType === 'agendado_automatico' ? (
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center space-x-1.5 border truncate ${
                              isSelected
                                ? 'bg-white/20 text-white border-white/40 shadow-sm'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            <Robot size={13} weight="fill" className={isSelected ? 'text-white' : 'text-purple-600'} />
                            <span className="truncate">
                              Auto {item.scheduledTime ? `(${item.scheduledTime})` : ''}
                            </span>
                          </span>
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center space-x-1.5 border truncate ${
                              isSelected
                                ? 'bg-white/20 text-white border-white/40 shadow-sm'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            <User size={13} weight="bold" className={isSelected ? 'text-white' : 'text-blue-600'} />
                            <span>Manual</span>
                          </span>
                        )}
                      </div>

                      {/* Column 3: Procedimento & Valor Referencial */}
                      <div className="col-span-1 md:col-span-3 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[11px] font-black truncate ${isSelected ? 'text-white' : 'text-[#3D3028]'}`}>
                            {procedureTitle}
                          </span>
                          {procedurePrice !== undefined && procedurePrice > 0 && (
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md border shrink-0 ${
                                isSelected
                                  ? 'bg-white/20 text-white border-white/40'
                                  : 'bg-amber-50 text-[#966b1a] border-amber-200/90'
                              }`}
                            >
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(procedurePrice)}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] font-medium truncate mt-0.5 ${
                            isSelected ? 'text-amber-50/85' : 'text-[#8C7A6B]'
                          }`}
                          title={item.messageContent}
                        >
                          {item.messageContent}
                        </p>
                      </div>

                      {/* Column 4: Data / Hora */}
                      <div className="col-span-1 md:col-span-2 text-xs">
                        <span className={`font-bold block truncate ${isSelected ? 'text-white' : 'text-[#3D3028]'}`}>
                          {new Date(item.sentAt || item.createdAt).toLocaleDateString('pt-BR')} às {new Date(item.sentAt || item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`text-[10px] font-mono block truncate ${isSelected ? 'text-amber-100/80' : 'text-stone-400'}`}>
                          audit_id: {item.id.replace('audit-wlog-', '')}
                        </span>
                      </div>

                      {/* Column 5: Status */}
                      <div className="col-span-1 md:col-span-1 flex items-center justify-start md:justify-center">
                        {renderMessageStatusBadge(item.status)}
                      </div>

                      {/* Column 6: Ações (Caret Button) */}
                      <div className="col-span-1 md:col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAuditDetail(item);
                          }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                            isSelected
                              ? 'bg-white/25 hover:bg-white/35 text-white border border-white/40 shadow-sm'
                              : 'bg-[#F6F3EE] hover:bg-[#EFE9DF] text-[#6A5A4D] hover:text-[#3D3028] border border-[#E2D8CA]'
                          }`}
                          title="Ver Detalhes da Mensagem na Base de Auditoria"
                        >
                          <CaretRight size={15} weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================= */}
          {/* BOTTOM PAGINATION CONTROLS (Matching ClientListView)      */}
          {/* ========================================================= */}
          {filteredAuditLogs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-[#E2D8CA]/80">
              <div className="text-xs font-semibold text-[#8C7A6B]">
                Mostrando <strong className="text-[#3D3028]">{auditStartIndex + 1}</strong> a{' '}
                <strong className="text-[#3D3028]">
                  {Math.min(auditStartIndex + auditItemsPerPage, filteredAuditLogs.length)}
                </strong>{' '}
                de <strong className="text-[#3D3028]">{filteredAuditLogs.length}</strong> mensagens
              </div>

              {auditTotalPages > 1 && (
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    disabled={auditCurrentPage === 1}
                    onClick={() => setAuditCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="w-8 h-8 rounded-xl border border-[#E2D8CA] bg-white/90 text-[#5C4A3E] hover:bg-white flex items-center justify-center text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                  >
                    <CaretLeft size={14} weight="bold" />
                  </button>

                  {Array.from({ length: auditTotalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setAuditCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer ${
                        auditCurrentPage === page
                          ? 'bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-amber-50 shadow-md shadow-amber-900/15'
                          : 'border border-[#E2D8CA] bg-white/90 text-[#5C4A3E] hover:bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={auditCurrentPage === auditTotalPages}
                    onClick={() => setAuditCurrentPage(prev => Math.min(prev + 1, auditTotalPages))}
                    className="w-8 h-8 rounded-xl border border-[#E2D8CA] bg-white/90 text-[#5C4A3E] hover:bg-white flex items-center justify-center text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                  >
                    <CaretRight size={14} weight="bold" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: DETALHES COMPLETOS DA AUDITORIA                     */}
      {/* ========================================================= */}
      {selectedAuditDetail && (
        <div className="fixed inset-0 z-[10000] bg-stone-950/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF6F0] rounded-[32px] border border-[#E2D8CA] p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2D8CA]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#c5922a] to-[#966b1a] text-amber-50 flex items-center justify-center shadow-sm">
                  <ShieldCheck size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#3D3028]">Registro de Auditoria de Mensagem</h3>
                  <p className="text-xs text-[#8C7A6B] font-semibold">ID: {selectedAuditDetail.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditDetail(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-200/60 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-[#E2D8CA]">
                <span className="text-[10px] font-black uppercase text-[#8C7A6B] block">Cliente</span>
                <p className="font-bold text-[#3D3028] text-sm mt-0.5">{selectedAuditDetail.clientName}</p>
                <p className="text-stone-500 font-mono mt-0.5">{selectedAuditDetail.phone}</p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E2D8CA]">
                <span className="text-[10px] font-black uppercase text-[#8C7A6B] block">Tipo de Disparo</span>
                <p className="font-bold text-[#3D3028] text-sm mt-0.5">
                  {selectedAuditDetail.dispatchType === 'agendado_automatico'
                    ? 'Agendamento Automático'
                    : 'Disparo Manual'}
                </p>
                {selectedAuditDetail.scheduledTime && (
                  <p className="text-stone-500 mt-0.5">
                    Horário Programado: {selectedAuditDetail.scheduledTime} ({selectedAuditDetail.daysInAdvance} dias antes)
                  </p>
                )}
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E2D8CA]">
                <span className="text-[10px] font-black uppercase text-[#8C7A6B] block">Status de Entrega</span>
                <div className="mt-1.5">{renderMessageStatusBadge(selectedAuditDetail.status)}</div>
                {selectedAuditDetail.errorMessage && (
                  <p className="text-rose-600 text-[11px] font-semibold mt-1">
                    ⚠️ {selectedAuditDetail.errorMessage}
                  </p>
                )}
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E2D8CA]">
                <span className="text-[10px] font-black uppercase text-[#8C7A6B] block">Data e Hora do Envio</span>
                <p className="font-bold text-[#3D3028] text-xs mt-1.5 flex items-center space-x-1.5">
                  <Clock size={14} className="text-[#c5922a]" />
                  <span>{new Date(selectedAuditDetail.sentAt || selectedAuditDetail.createdAt).toLocaleString('pt-BR')}</span>
                </p>
              </div>
            </div>

            {/* Template Info if any */}
            {selectedAuditDetail.templateName && (
              <div className="p-3 bg-[#FAF6F0] rounded-2xl border border-[#E2D8CA] text-xs">
                <span className="text-[10px] font-black uppercase text-[#8C7A6B] block mb-0.5">Modelo Utilizado</span>
                <p className="font-bold text-[#3D3028]">{selectedAuditDetail.templateName}</p>
              </div>
            )}

            {/* Message Bubble Preview */}
            <div>
              <span className="text-[11px] font-black uppercase text-[#8C7A6B] block mb-1.5">
                Conteúdo da Mensagem Enviada:
              </span>
              <div className="bg-[#E7F8E8] border border-[#BDECC0] rounded-2xl p-4 shadow-2xs text-xs text-stone-800 leading-relaxed font-sans whitespace-pre-line relative">
                <div className="absolute -top-1.5 left-4 w-3 h-3 bg-[#E7F8E8] border-t border-l border-[#BDECC0] rotate-45" />
                {selectedAuditDetail.messageContent}
                <div className="text-[10px] text-right text-stone-400 mt-2 font-medium flex items-center justify-end space-x-1">
                  <span>{new Date(selectedAuditDetail.sentAt || selectedAuditDetail.createdAt).toLocaleTimeString('pt-BR')}</span>
                  <Check size={12} weight="bold" className="text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Technical Metadata */}
            {selectedAuditDetail.metaMessageId && (
              <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-[11px] font-mono text-stone-600 break-all">
                <strong>ID Técnico WhatsApp:</strong> {selectedAuditDetail.metaMessageId}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end pt-3 border-t border-[#E2D8CA]">
              <button
                type="button"
                onClick={() => setSelectedAuditDetail(null)}
                className="px-5 py-2 rounded-xl bg-[#3D3028] text-amber-50 text-xs font-black shadow-sm hover:bg-[#4E3E34] transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT TEMPLATE MODAL (WITH KEY FIELD TAGS INSERTION)      */}
      {/* ========================================================= */}
      {editingTemplate && (
        <div className="fixed inset-0 z-[10000] bg-stone-950/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF6F0] rounded-[32px] border border-[#E2D8CA] p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2D8CA]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#c5922a] to-[#966b1a] text-amber-50 flex items-center justify-center shadow-sm">
                  <PencilSimple size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#3D3028]">Editar Modelo de Mensagem</h3>
                  <p className="text-xs text-[#8C7A6B] font-semibold">
                    Personalize o texto e clique nas tags abaixo para inserir dados do cadastro
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-200/60 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              {/* Row: Title + Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-[#3D3028] uppercase tracking-wider mb-1">
                    Título do Modelo
                  </label>
                  <input
                    type="text"
                    value={templateForm.title}
                    onChange={e => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Lembrete de Agendamento (Padrão)"
                    className="w-full bg-white border border-[#E2D8CA] rounded-xl px-3.5 py-2 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#3D3028] uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <select
                    value={templateForm.category}
                    onChange={e =>
                      setTemplateForm(prev => ({
                        ...prev,
                        category: e.target.value as any,
                      }))
                    }
                    className="w-full bg-white border border-[#E2D8CA] rounded-xl px-3 py-2 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-2xs"
                  >
                    <option value="Lembrete">Lembrete</option>
                    <option value="Confirmação">Confirmação</option>
                    <option value="Pós-Procedimento">Pós-Procedimento</option>
                    <option value="Informativo">Informativo</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Field Tags Toolbar */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#E2D8CA] shadow-2xs space-y-2">
                <div className="flex items-center space-x-1.5 text-[#966b1a]">
                  <Tag size={15} weight="bold" />
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Campos Chaves do Cadastro (Clique para inserir no texto):
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {TEMPLATE_FIELD_TAGS.map(f => (
                    <button
                      key={f.tag}
                      type="button"
                      onClick={() => handleInsertTag(f.tag)}
                      className="px-2.5 py-1 rounded-lg bg-[#FAF6F0] hover:bg-[#FAF0DE] border border-[#E2D8CA] hover:border-[#c5922a] text-[#3D3028] text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer active:scale-95 shadow-2xs group"
                      title={`${f.description} (Ex: ${f.example})`}
                    >
                      <Plus size={12} weight="bold" className="text-[#c5922a] group-hover:scale-110 transition-transform" />
                      <span>{f.label}</span>
                      <span className="font-mono text-[10px] text-stone-400 group-hover:text-[#966b1a]">{f.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea for Message Template Body */}
              <div>
                <label className="block text-xs font-black text-[#3D3028] uppercase tracking-wider mb-1">
                  Texto da Mensagem
                </label>
                <textarea
                  ref={textareaRef}
                  rows={5}
                  value={templateForm.bodyText}
                  onChange={e => setTemplateForm(prev => ({ ...prev, bodyText: e.target.value }))}
                  placeholder="Digite o texto da mensagem..."
                  className="w-full bg-white border border-[#E2D8CA] rounded-2xl p-3.5 text-xs font-medium text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 leading-relaxed resize-none shadow-2xs font-sans"
                />
              </div>

              {/* Live Preview Bubble */}
              <div>
                <span className="block text-[11px] font-black uppercase text-[#8C6D46] mb-1">
                  Pré-visualização em Tempo Real (WhatsApp):
                </span>
                <div className="bg-[#E7F8E8] border border-[#BDECC0] rounded-2xl p-4 shadow-2xs text-xs text-stone-800 leading-relaxed font-sans whitespace-pre-line relative">
                  <div className="absolute -top-1.5 left-4 w-3 h-3 bg-[#E7F8E8] border-t border-l border-[#BDECC0] rotate-45" />
                  {dynamicPreviewText || 'O texto preenchido aparecerá aqui...'}
                  <div className="text-[10px] text-right text-stone-400 mt-2 font-medium flex items-center justify-end space-x-1">
                    <span>Hoje 09:30</span>
                    <Check size={12} weight="bold" className="text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E2D8CA]">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E2D8CA] text-xs font-bold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSavingTemplate}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 text-xs font-black shadow-md shadow-amber-900/15 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <FloppyDisk size={15} weight="bold" />
                  <span>{isSavingTemplate ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PREVIEW & CUSTOM MESSAGE MODAL (BEFORE SENDING)           */}
      {/* ========================================================= */}
      {previewAppointment && (
        <div className="fixed inset-0 z-[10000] bg-stone-950/45 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF6F0] rounded-[28px] border border-[#E2D8CA] p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2D8CA]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                  <WhatsappLogo size={18} weight="fill" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#3D3028]">Pré-visualizar Lembrete</h3>
                  <p className="text-[11px] text-[#8C7A6B] font-semibold">Cliente: {previewAppointment.clientName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAppointment(null)}
                className="w-7 h-7 rounded-full hover:bg-stone-200/60 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-[#8C6D46] mb-1">
                  Número de WhatsApp
                </label>
                <input
                  type="text"
                  value={previewPhone}
                  onChange={e => setPreviewPhone(e.target.value)}
                  className="w-full bg-white border border-[#E2D8CA] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-1 focus:ring-amber-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-[#8C6D46] mb-1">
                  Conteúdo da Mensagem (Personalizável)
                </label>
                <textarea
                  rows={6}
                  value={previewText}
                  onChange={e => setPreviewText(e.target.value)}
                  className="w-full bg-white border border-[#E2D8CA] rounded-xl p-3 text-xs font-semibold text-[#3D3028] focus:outline-none focus:ring-1 focus:ring-amber-300 leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E2D8CA]">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(previewText);
                    showToast('Texto da mensagem copiado para a área de transferência!', 'success');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E2D8CA] text-xs font-bold text-[#6A5A4D] hover:bg-stone-50 transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Copiar texto para colar manualmente"
                >
                  <FloppyDisk size={14} weight="bold" />
                  <span>Copiar Texto</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPreviewAppointment(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E2D8CA] text-xs font-bold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleSendFromPreview}
                  disabled={sendingId === previewAppointment.id}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-900/15 hover:shadow-lg active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <WhatsappLogo size={16} weight="fill" />
                  <span>Abrir &amp; Enviar no WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRMAÇÃO DE REENVIO DE LEMBRETE                 */}
      {/* ========================================================= */}
      {resendConfirmAppointment && (
        <div className="fixed inset-0 z-[10000] bg-stone-950/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF6F0] rounded-[30px] border border-[#E2D8CA] p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center space-x-3 pb-3 border-b border-[#E2D8CA]">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-[#966b1a] shadow-xs shrink-0">
                <ArrowsClockwise size={22} weight="bold" className="text-[#c5922a]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#3D3028]">Reenviar Lembrete</h3>
                <p className="text-[11px] text-[#8C7A6B] font-semibold">Confirmação de disparo via WhatsApp</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E2D8CA] space-y-2 text-xs">
              <p className="text-[#3D3028] font-bold">
                Deseja realmente reenviar a mensagem de WhatsApp para <strong className="text-[#966b1a]">{resendConfirmAppointment.clientName}</strong>?
              </p>
              <div className="text-[11px] text-stone-500 space-y-1 pt-2 border-t border-stone-100 font-medium">
                <div><strong>📅 Data:</strong> {resendConfirmAppointment.date} às {resendConfirmAppointment.startTime}</div>
                <div><strong>✨ Procedimento:</strong> {resendConfirmAppointment.title}</div>
                <div><strong>📱 Telefone:</strong> {getClientForAppointment(resendConfirmAppointment)?.phone || 'Telefone não cadastrado'}</div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-[#E2D8CA]">
              <button
                type="button"
                onClick={() => setResendConfirmAppointment(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#E2D8CA] text-xs font-bold text-stone-700 hover:bg-stone-100 transition-all cursor-pointer shadow-2xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={sendingId === resendConfirmAppointment.id}
                onClick={() => executeSendReminder(resendConfirmAppointment)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 text-xs font-black shadow-md shadow-amber-900/15 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                {sendingId === resendConfirmAppointment.id ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Reenviando...</span>
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt size={14} weight="bold" />
                    <span>Sim, Reenviar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
