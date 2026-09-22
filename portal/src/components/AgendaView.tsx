import React, { useState, useMemo, useEffect } from 'react';
import {
  CaretLeft,
  CaretRight,
  Plus,
  CheckCircle,
  X,
  SlidersHorizontal,
  MapPin,
  ArrowSquareOut
} from '@phosphor-icons/react';

import { appointmentService } from '../services/appointmentService';

export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: string;
  title: string;
  clientName: string;
  location?: string; // Bairro, Cidade - UF
  clientAvatar?: string;
  color: string;
  status: 'confirmado' | 'em_andamento' | 'concluido' | 'pendente';
  notes?: string;
}

export interface ClientProcedure {
  id: string;
  name: string;
  category: string;
  sessions: string;
  date: string;
  status: 'concluido' | 'em_andamento' | 'agendado';
  colorScheme: 'pink' | 'purple' | 'amber' | 'emerald';
}

export interface AgendaViewProps {
  onNavigateToClient?: (clientName: string) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ onNavigateToClient }) => {
  // Current calendar navigation: Defaults to TODAY
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Modal State for New Appointment & Details
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Helper to format Date to YYYY-MM-DD
  const formatIsoDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form State for new appointment
  const [formData, setFormData] = useState({
    clientName: '',
    category: 'Estética Facial',
    title: 'Limpeza de Pele Profunda',
    location: 'Bela Vista, São Paulo - SP',
    date: formatIsoDate(new Date()),
    startTime: '09:00',
    endTime: '10:00',
    color: '#8b5cf6',
    notes: ''
  });

  // Default initial appointments
  const getDefaultAppointments = (): Appointment[] => {
    const now = new Date();
    const todayStr = formatIsoDate(now);

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = formatIsoDate(tomorrow);

    const afterTomorrow = new Date(now);
    afterTomorrow.setDate(now.getDate() + 2);
    const afterTomorrowStr = formatIsoDate(afterTomorrow);

    return [
      {
        id: 'apt-1',
        date: todayStr,
        startTime: '08:30',
        endTime: '09:00',
        category: 'Estética Facial',
        title: 'Limpeza de Pele Profunda & Glow',
        clientName: 'Clara Martin',
        location: 'Bela Vista, São Paulo - SP',
        color: '#f97316',
        status: 'concluido'
      },
      {
        id: 'apt-2',
        date: todayStr,
        startTime: '09:30',
        endTime: '11:45',
        category: 'Harmonização Facial',
        title: 'Aplicação de Toxina & Preenchimento',
        clientName: 'Dra. Camila Vasconcelos',
        location: 'Jardins, São Paulo - SP',
        color: '#8b5cf6',
        status: 'em_andamento'
      },
      {
        id: 'apt-3',
        date: tomorrowStr,
        startTime: '11:00',
        endTime: '12:15',
        category: 'Design & Sobrancelhas',
        title: 'Micropigmentação Shadow Line',
        clientName: 'Fernanda Martins',
        location: 'Pinheiros, São Paulo - SP',
        color: '#ef4444',
        status: 'confirmado'
      },
      {
        id: 'apt-4',
        date: tomorrowStr,
        startTime: '14:30',
        endTime: '16:20',
        category: 'Tratamento Corporal',
        title: 'Drenagem Linfática & Modeladora',
        clientName: 'Mariana Lima Santos',
        location: 'Copacabana, Rio de Janeiro - RJ',
        color: '#3b82f6',
        status: 'confirmado'
      },
      {
        id: 'apt-5',
        date: afterTomorrowStr,
        startTime: '17:00',
        endTime: '17:15',
        category: 'Consulta Rápida',
        title: 'Avaliação de Retorno e Skincare',
        clientName: 'Luciana Queiroz',
        location: 'Moema, São Paulo - SP',
        color: '#10b981',
        status: 'confirmado'
      },
      {
        id: 'apt-6',
        date: afterTomorrowStr,
        startTime: '17:30',
        endTime: '18:00',
        category: 'Estética Avançada',
        title: 'Peeling Químico Iluminador',
        clientName: 'Juliana Paes Ferreira',
        location: 'Barra da Tijuca, Rio de Janeiro - RJ',
        color: '#f59e0b',
        status: 'confirmado'
      }
    ];
  };

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>(getDefaultAppointments);

  // Load appointments from Supabase / localStorage on mount
  useEffect(() => {
    appointmentService.getAppointments(getDefaultAppointments()).then(loaded => {
      if (loaded && loaded.length > 0) {
        setAppointments(loaded);
      }
    });
  }, []);

  // Mock Procedures Database Mapped by Client Name
  const clientProceduresMap: Record<string, ClientProcedure[]> = {
    'Clara Martin': [
      { id: 'cp-1', name: 'Limpeza de Pele Profunda & Glow', category: 'Estética Facial', sessions: 'Sessão 2 de 4', date: 'Hoje, 08:30', status: 'em_andamento', colorScheme: 'pink' },
      { id: 'cp-2', name: 'Peeling Químico Renovador', category: 'Renovação Celular', sessions: '1ª Sessão', date: '12/09/2026', status: 'concluido', colorScheme: 'amber' },
      { id: 'cp-2b', name: 'Máscara de Ouro & Hidratação', category: 'Nutrição Facial', sessions: 'Concluído', date: '28/08/2026', status: 'concluido', colorScheme: 'emerald' }
    ],
    'Dra. Camila Vasconcelos': [
      { id: 'cp-3', name: 'Harmonização Facial Full Face', category: 'Harmonização Facial', sessions: 'Sessão 2 de 3', date: 'Hoje, 09:30', status: 'em_andamento', colorScheme: 'purple' },
      { id: 'cp-4', name: 'Aplicação de Toxina Botulínica', category: 'Injetáveis', sessions: 'Manutenção 6m', date: '15/08/2026', status: 'concluido', colorScheme: 'pink' },
      { id: 'cp-5', name: 'Bioestimulador de Colágeno', category: 'Rejuvenescimento', sessions: '1ª Sessão', date: '28/07/2026', status: 'concluido', colorScheme: 'emerald' }
    ],
    'Fernanda Martins': [
      { id: 'cp-6', name: 'Micropigmentação Shadow Line', category: 'Design & Sobrancelhas', sessions: 'Sessão Inicial', date: 'Amanhã, 11:00', status: 'agendado', colorScheme: 'pink' },
      { id: 'cp-7', name: 'Design Personalizado com Henna', category: 'Design Facial', sessions: 'Manutenção', date: '05/09/2026', status: 'concluido', colorScheme: 'amber' }
    ],
    'Mariana Lima Santos': [
      { id: 'cp-8', name: 'Drenagem Linfática & Modeladora', category: 'Tratamento Corporal', sessions: 'Sessão 4 de 8', date: 'Amanhã, 14:30', status: 'agendado', colorScheme: 'purple' },
      { id: 'cp-9', name: 'Massagem Relaxante com Óleos Essenciais', category: 'Bem-estar', sessions: 'Sessão Única', date: '10/09/2026', status: 'concluido', colorScheme: 'emerald' },
      { id: 'cp-10', name: 'Detox Corporal & Manta Térmica', category: 'Corporal', sessions: 'Protocolo Completo', date: '01/09/2026', status: 'concluido', colorScheme: 'pink' }
    ],
    'Luciana Queiroz': [
      { id: 'cp-11', name: 'Avaliação de Retorno e Skincare', category: 'Consulta Rápida', sessions: 'Check-up Trimestral', date: 'Em 2 dias', status: 'agendado', colorScheme: 'emerald' },
      { id: 'cp-12', name: 'Limpeza de Pele Profunda com Fototerapia', category: 'Estética Facial', sessions: 'Realizada', date: '18/08/2026', status: 'concluido', colorScheme: 'pink' }
    ],
    'Juliana Paes Ferreira': [
      { id: 'cp-13', name: 'Peeling Químico Iluminador', category: 'Estética Avançada', sessions: 'Sessão 1 de 3', date: 'Em 2 dias', status: 'agendado', colorScheme: 'amber' },
      { id: 'cp-14', name: 'Microagulhamento Drug Delivery', category: 'Regeneração', sessions: 'Revisão', date: '30/08/2026', status: 'concluido', colorScheme: 'purple' }
    ]
  };

  // State to track which client's appointment is selected for procedures display
  const [selectedAppointmentForClient, setSelectedAppointmentForClient] = useState<Appointment | null>(null);

  // Month navigation helpers
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate calendar grid days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { day: number; date: Date; isCurrentMonth: boolean; hasEvents: boolean }[] = [];

    // Empty previous days padding
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: 0, date: new Date(year, month, 0), isCurrentMonth: false, hasEvents: false });
    }

    // Days of current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const thisDate = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasEvents = appointments.some(a => a.date === dateStr);
      days.push({
        day: d,
        date: thisDate,
        isCurrentMonth: true,
        hasEvents
      });
    }

    return days;
  }, [currentDate, appointments]);

  // Selected Date in YYYY-MM-DD format
  const selectedDateStr = useMemo(() => formatIsoDate(selectedDate), [selectedDate]);

  // Appointments filtered strictly for the SELECTED DATE
  const selectedDayAppointments = useMemo(() => {
    const filtered = appointments.filter(a => a.date === selectedDateStr);
    // Sort by startTime
    filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return filtered;
  }, [appointments, selectedDateStr]);

  // Synchronize selected client appointment when day changes or list updates
  useEffect(() => {
    if (selectedDayAppointments.length > 0) {
      const exists = selectedDayAppointments.some(a => a.id === selectedAppointmentForClient?.id);
      if (!exists) {
        setSelectedAppointmentForClient(selectedDayAppointments[0]);
      }
    } else {
      setSelectedAppointmentForClient(null);
    }
  }, [selectedDayAppointments, selectedAppointmentForClient]);

  // Load procedures of the selected client
  const clientProcedures = useMemo(() => {
    if (!selectedAppointmentForClient) return [];

    const known = clientProceduresMap[selectedAppointmentForClient.clientName];
    if (known && known.length > 0) {
      return known;
    }

    // Dynamic procedures fallback for custom/new appointments
    return [
      {
        id: `cp-${selectedAppointmentForClient.id}-1`,
        name: selectedAppointmentForClient.title,
        category: selectedAppointmentForClient.category,
        sessions: 'Sessão 1 de 1',
        date: `${formatDateHeader(selectedAppointmentForClient.date)} • ${selectedAppointmentForClient.startTime}`,
        status: selectedAppointmentForClient.status === 'concluido' ? 'concluido' : 'agendado',
        colorScheme: 'purple' as const
      },
      {
        id: `cp-${selectedAppointmentForClient.id}-2`,
        name: 'Anamnese e Avaliação Facial',
        category: 'Consulta Estética',
        sessions: 'Protocolo Glow Ativo',
        date: 'Histórico Clínico',
        status: 'concluido' as const,
        colorScheme: 'emerald' as const
      }
    ];
  }, [selectedAppointmentForClient, clientProceduresMap]);

  // Format date display (e.g., "18 Setembro")
  const formatDateHeader = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${day} ${monthNames[mIdx]}`;
    }
    return dateStr;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return target < today;
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleSaveNewAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      category: formData.category,
      title: formData.title,
      clientName: formData.clientName || 'Cliente Agendada',
      location: formData.location || 'Bela Vista, São Paulo - SP',
      color: formData.color,
      status: 'confirmado',
      notes: formData.notes
    };

    setAppointments(prev => [...prev, newApt]);
    await appointmentService.saveAppointment(newApt);
    setIsNewAppointmentModalOpen(false);
    setFormData({
      clientName: '',
      category: 'Estética Facial',
      title: 'Limpeza de Pele Profunda',
      location: 'Bela Vista, São Paulo - SP',
      date: formatIsoDate(new Date()),
      startTime: '09:00',
      endTime: '10:00',
      color: '#8b5cf6',
      notes: ''
    });
  };

  return (
    <div className="h-full w-full flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in text-slate-800">
      
      {/* 3-Column Glassmorphic Main Layout Container - SAME HEIGHT (h-[540px]) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch max-w-7xl mx-auto w-full">
        
        {/* ========================================================= */}
        {/* 1. LEFT COLUMN: CALENDAR (Height 540px)                   */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 bg-white/95 backdrop-blur-xl border border-rose-100/90 rounded-[32px] p-6 shadow-[0_15px_40px_-15px_rgba(244,114,182,0.18)] flex flex-col justify-between h-[540px]">
          
          <div>
            {/* Header: Month Year with Navigation Arrows (< Month Year >) */}
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-rose-100/60">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 flex items-center justify-center transition-all border border-rose-200/80 active:scale-95 shadow-sm"
                title="Mês Anterior"
              >
                <CaretLeft size={16} weight="bold" />
              </button>

              <h2 className="text-lg sm:text-xl font-black text-[#64183f] tracking-tight text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>

              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 flex items-center justify-center transition-all border border-rose-200/80 active:scale-95 shadow-sm"
                title="Próximo Mês"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>

            {/* Days of Week Header - Dark Rose (Original size: 11px) */}
            <div className="grid grid-cols-7 gap-1 text-center mb-3">
              {daysOfWeek.map((day, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-black text-[#9d174d] uppercase tracking-wider py-1"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Grid - Original Font Size, Dark Rose Month Days & Golden Selected Day */}
            <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
              {calendarDays.map((item, idx) => {
                if (!item.isCurrentMonth) {
                  return <div key={idx} className="h-9 w-9 mx-auto" />;
                }

                const selected = isSelected(item.date);
                const today = isToday(item.date);
                const past = isPast(item.date);

                return (
                  <div key={idx} className="flex flex-col items-center justify-center">
                    <button
                      onClick={() => {
                        setSelectedDate(item.date);
                        setFormData(prev => ({ ...prev, date: formatIsoDate(item.date) }));
                      }}
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-xs transition-all relative ${
                        selected
                          ? 'bg-gradient-to-tr from-[#eab308] via-[#f59e0b] to-[#fbbf24] text-slate-950 shadow-md shadow-amber-500/30 font-black border border-amber-300 scale-105'
                          : today
                          ? 'border-2 border-rose-500 text-rose-700 font-extrabold bg-rose-50/50'
                          : past
                          ? 'text-[#831843]/60 font-bold line-through decoration-[#9d174d] decoration-[1.5px] hover:bg-rose-100/60 hover:text-[#831843]'
                          : 'text-[#831843] font-extrabold hover:bg-rose-100/70'
                      }`}
                    >
                      {item.day}
                    </button>
                    {item.hasEvents && !selected && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${past ? 'bg-[#9d174d]/40' : 'bg-[#9d174d]'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Link: Configure view of calendar */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => setIsNewAppointmentModalOpen(true)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center space-x-1.5 mx-auto"
            >
              <SlidersHorizontal size={14} />
              <span>Configurar visualização do calendário</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. MIDDLE COLUMN: YOUR AGENDA (Height 540px with scroll)  */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-white/95 backdrop-blur-xl border border-rose-100/90 rounded-[32px] p-6 shadow-[0_15px_40px_-15px_rgba(244,114,182,0.18)] flex flex-col justify-between h-[540px] overflow-hidden">
          
          {/* Header: "Sua agenda" + Add Action */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100/80 shrink-0">
            <h2 className="text-xl sm:text-2xl font-black text-[#64183f] tracking-tight">
              Sua agenda
            </h2>

            <div className="flex items-center space-x-2">
              {/* Add New Appointment Button with Social Media Icon Styling */}
              <button
                onClick={() => setIsNewAppointmentModalOpen(true)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f472b6] to-[#db2777] text-[#fef08a] border border-amber-200/90 flex items-center justify-center hover:from-[#f472b6] hover:to-[#be185d] hover:text-amber-100 hover:border-amber-100 hover:scale-110 active:scale-95 transition-all shadow-md shadow-pink-500/20"
                title="Novo Agendamento"
              >
                <Plus size={16} weight="bold" />
              </button>
            </div>
          </div>

          {/* Agenda Grouped by Selected Date - Scrollable Body */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 scrollbar-thin scrollbar-thumb-rose-200/50 scrollbar-track-transparent my-2">
            
            {/* Selected Date Header: e.g. "18 Setembro :" */}
            <div className="flex items-center justify-between text-slate-500 pb-1 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black tracking-tight text-[#64183f]">
                  {formatDateHeader(selectedDateStr)}
                </span>
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-300" />
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {selectedDayAppointments.length} agendamento{selectedDayAppointments.length !== 1 ? 's' : ''}
              </span>
            </div>

            {selectedDayAppointments.length === 0 ? (
              <div className="py-14 flex flex-col items-center justify-center text-center space-y-2">
                <p className="text-xs font-bold text-slate-400">
                  Nenhum agendamento para este dia.
                </p>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, date: selectedDateStr }));
                    setIsNewAppointmentModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f472b6] to-[#db2777] text-[#fef08a] border border-amber-200/90 font-extrabold text-xs transition-all shadow-md shadow-pink-500/20 hover:from-[#f472b6] hover:to-[#be185d] hover:text-amber-100 hover:scale-105 active:scale-95"
                >
                  + Agendar horário
                </button>
              </div>
            ) : (
              <div className="space-y-3 pl-0.5">
                {selectedDayAppointments.map(apt => {
                  const isSelectedClient = selectedAppointmentForClient?.id === apt.id;

                  return (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointmentForClient(apt)}
                      className={`flex items-start space-x-4 group cursor-pointer p-2 rounded-2xl transition-all border ${
                        isSelectedClient
                          ? 'bg-rose-50/90 border-rose-300/90 shadow-sm ring-1 ring-rose-200'
                          : 'hover:bg-slate-50/90 border-transparent hover:border-slate-100'
                      }`}
                    >
                      {/* 1. Time Column */}
                      <div className="w-12 shrink-0 flex flex-col text-left">
                        <span className="text-sm font-black text-[#3730a3] tracking-tight group-hover:text-rose-600 transition-colors">
                          {apt.startTime}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {apt.endTime}
                        </span>
                      </div>

                      {/* 2. Vertical Colored Accent Bar */}
                      <div
                        className="w-1 self-stretch rounded-full shrink-0"
                        style={{ backgroundColor: apt.color }}
                      />

                      {/* 3. Details Content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-rose-500/90 leading-none mb-1">
                          {apt.category}
                        </div>
                        <div className="text-xs font-black text-[#64183f] truncate leading-snug">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNavigateToClient) {
                                onNavigateToClient(apt.clientName);
                              } else if (typeof window !== 'undefined' && (window as any).setActiveTab) {
                                (window as any).setActiveTab('clientes');
                              }
                            }}
                            className="hover:underline hover:text-[#9d174d] transition-all text-left inline-flex items-center group/link cursor-pointer font-black decoration-rose-400 underline-offset-2"
                            title={`Acessar cadastro de ${apt.clientName}`}
                          >
                            <span>{apt.clientName}</span>
                            <ArrowSquareOut size={12} className="ml-1 opacity-60 group-hover/link:opacity-100 transition-opacity text-rose-500 shrink-0 inline" weight="bold" />
                          </button>
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate flex items-center space-x-1">
                          <MapPin size={12} className="shrink-0 text-rose-400" />
                          <span>{apt.location || 'São Paulo - SP'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. RIGHT COLUMN: PROCEDURES (Height 540px)                */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 bg-white/95 backdrop-blur-xl border border-rose-100/90 rounded-[32px] p-6 shadow-[0_15px_40px_-15px_rgba(244,114,182,0.18)] flex flex-col justify-between h-[540px] overflow-hidden">
          
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin scrollbar-thumb-rose-200/50">
            {/* Section A: Procedimentos da Pessoa Selecionada */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-rose-100/70">
                <div className="min-w-0 pr-1">
                  <h3 className="text-xs font-black text-[#64183f] uppercase tracking-wider">
                    Procedimentos
                  </h3>
                  {selectedAppointmentForClient && (
                    <p className="text-[11px] font-bold text-[#831843] truncate max-w-[155px]">
                      {selectedAppointmentForClient.clientName}
                    </p>
                  )}
                </div>
                {selectedAppointmentForClient && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100/80 text-[#831843] border border-rose-200 shrink-0">
                    {clientProcedures.length} {clientProcedures.length === 1 ? 'item' : 'itens'}
                  </span>
                )}
              </div>

              {selectedAppointmentForClient && clientProcedures.length > 0 ? (
                <div className="space-y-2.5">
                  {clientProcedures.map(proc => {
                    const isDone = proc.status === 'concluido';
                    const isInProgress = proc.status === 'em_andamento';

                    return (
                      <div
                        key={proc.id}
                        className="p-2.5 rounded-2xl bg-white border border-rose-100/90 hover:border-rose-300 hover:shadow-md transition-all shadow-[0_2px_8px_-2px_rgba(244,114,182,0.12)] group flex flex-col space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider block">
                              {proc.category}
                            </span>
                            <h4 className="text-xs font-black text-[#64183f] group-hover:text-rose-600 transition-colors leading-snug line-clamp-1">
                              {proc.name}
                            </h4>
                          </div>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isInProgress
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-purple-50 text-[#3730a3] border-purple-200'
                            }`}
                          >
                            {isDone ? 'Concluído' : isInProgress ? 'Em andamento' : 'Agendado'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-0.5 border-t border-slate-50">
                          <span className="text-[#831843]/90 font-bold">{proc.sessions}</span>
                          <span>{proc.date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                  Selecione um agendamento na agenda para carregar os procedimentos.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL: NOVO AGENDAMENTO                                  */}
      {/* ========================================================= */}
      {isNewAppointmentModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="relative bg-[#fdf0f4] rounded-[26px] overflow-hidden border border-rose-200/80 shadow-[0_25px_70px_-15px_rgba(244,114,182,0.35)] max-w-lg w-full my-auto">
            
            {/* Wallpaper overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
              style={{ backgroundImage: "url('/glowapp_background.png')" }}
            />

            <div className="relative z-10 p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-rose-200/70 pb-3 mb-4">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-rose-500">
                    GlowApp Agenda
                  </span>
                  <h3 className="text-lg font-black text-[#64183f]">
                    Novo Agendamento
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewAppointmentModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-rose-600 flex items-center justify-center border border-rose-200"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              <form onSubmit={handleSaveNewAppointment} className="space-y-3 text-xs">
                {/* Cliente & Localização */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-rose-900 mb-1">
                      Nome da Cliente
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="Ex: Clara Martin"
                      className="w-full bg-white/95 border border-rose-200 rounded-xl px-3.5 py-2 font-semibold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-rose-900 mb-1">
                      Bairro, Cidade - UF
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Ex: Bela Vista, São Paulo - SP"
                      className="w-full bg-white/95 border border-rose-200 rounded-xl px-3.5 py-2 font-semibold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm"
                    />
                  </div>
                </div>

                {/* Categoria & Procedimento */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-rose-900 mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ex: Estética Facial"
                      className="w-full bg-white/95 border border-rose-200 rounded-xl px-3.5 py-2 font-semibold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-rose-900 mb-1">
                      Procedimento / Título
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Harmonização Facial"
                      className="w-full bg-white/95 border border-rose-200 rounded-xl px-3.5 py-2 font-semibold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm"
                    />
                  </div>
                </div>

                {/* Data e Horários */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-rose-900 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-white/95 border border-rose-200 rounded-xl px-2.5 py-2 font-semibold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-rose-900 mb-1">
                      Início
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full bg-white/95 border border-rose-200 rounded-xl px-2.5 py-2 font-semibold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-rose-900 mb-1">
                      Término
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full bg-white/95 border border-rose-200 rounded-xl px-2.5 py-2 font-semibold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm text-center"
                    />
                  </div>
                </div>

                {/* Cor do Marcador */}
                <div>
                  <label className="block font-bold text-rose-900 mb-1">
                    Cor do Indicador
                  </label>
                  <div className="flex items-center space-x-3">
                    {['#f97316', '#8b5cf6', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c })}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          formData.color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block font-bold text-rose-900 mb-1">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Detalhes ou recomendações do agendamento..."
                    className="w-full bg-white/95 border border-rose-200 rounded-xl px-3.5 py-2 font-semibold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm"
                  />
                </div>

                {/* Botões */}
                <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-rose-200/70 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewAppointmentModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-rose-300 bg-white text-rose-800 font-extrabold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold shadow-md shadow-rose-500/25 flex items-center space-x-1.5"
                  >
                    <CheckCircle size={15} weight="bold" />
                    <span>Salvar Agendamento</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETALHES DO AGENDAMENTO SELECIONADO               */}
      {/* ========================================================= */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="relative bg-[#fdf0f4] rounded-[26px] overflow-hidden border border-rose-200/80 shadow-[0_25px_70px_-15px_rgba(244,114,182,0.35)] max-w-md w-full my-auto">
            <div className="relative z-10 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-rose-200/70 pb-3">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedAppointment.color }}
                  />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500">
                    {selectedAppointment.category}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-rose-600 flex items-center justify-center border border-rose-200"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-black text-[#64183f]">
                  {selectedAppointment.title}
                </h3>
                <p className="text-xs font-bold text-rose-800/80 mt-1">
                  Cliente: <span className="text-[#64183f] font-extrabold">{selectedAppointment.clientName}</span>
                </p>
              </div>

              <div className="bg-white/80 p-3 rounded-2xl border border-rose-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-rose-900/70 font-semibold">Data:</span>
                  <span className="font-extrabold text-rose-950">{formatDateHeader(selectedAppointment.date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-rose-900/70 font-semibold">Horário:</span>
                  <span className="font-extrabold text-[#3730a3]">
                    {selectedAppointment.startTime} às {selectedAppointment.endTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-rose-900/70 font-semibold">Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-xs shadow-md"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
