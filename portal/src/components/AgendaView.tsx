import React, { useState, useMemo, useEffect } from 'react';
import {
  CaretLeft,
  CaretRight,
  Plus,
  CheckCircle,
  X,
  SlidersHorizontal,
  MapPin,
  ArrowLeft,
  Sparkle,
  PencilSimple,
  CalendarBlank,
  Clock,
  MagnifyingGlass,
  CheckSquare,
  Square,
  Trash,
  SealCheck,
  ArrowLineLeft,
  ArrowLineRight
} from '@phosphor-icons/react';

import { appointmentService, type Appointment } from '../services/appointmentService';
import { clientService, type ClientProfile } from '../services/clientService';
import { serviceService, type ServiceItem } from '../services/serviceService';

export interface ClientProcedure {
  id: string;
  name: string;
  category: string;
  sessions: string;
  date: string;
  status: 'concluido' | 'em_andamento' | 'agendado' | 'cancelado';
  colorScheme?: 'pink' | 'purple' | 'amber' | 'emerald' | 'blue';
  price?: number;
}

export interface AgendaGroup {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  clientName: string;
  clientId?: string;
  location?: string;
  color: string;
  status: 'confirmado' | 'em_andamento' | 'concluido' | 'pendente' | 'cancelado';
  notes?: string;
  appointments: Appointment[];
  services: ClientProcedure[];
  totalPrice: number;
}

export interface AgendaReturnContext {
  clientId?: string;
  clientName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentNotes?: string;
  selectedServiceIds?: string[];
}

export interface AgendaViewProps {
  onNavigateToClient?: (clientName: string) => void;
  onNavigateToNewClientAppointment?: (selectedDate?: string) => void;
  initialSelectedDate?: string;
  returnToClientContext?: AgendaReturnContext | null;
  onReturnToClientAppointment?: (context: AgendaReturnContext) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  onNavigateToClient: _onNavigateToClient,
  onNavigateToNewClientAppointment,
  initialSelectedDate,
  returnToClientContext,
  onReturnToClientAppointment
}) => {
  const parseInitialDate = () => {
    if (initialSelectedDate && initialSelectedDate.includes('-')) {
      const [y, m, d] = initialSelectedDate.split('-').map(Number);
      if (y && m && d) return new Date(y, m - 1, d);
    }
    return new Date();
  };

  // Current calendar navigation: Defaults to TODAY or initialSelectedDate
  const [currentDate, setCurrentDate] = useState<Date>(parseInitialDate);
  const [selectedDate, setSelectedDate] = useState<Date>(parseInitialDate);

  useEffect(() => {
    if (initialSelectedDate && initialSelectedDate.includes('-')) {
      const [y, m, d] = initialSelectedDate.split('-').map(Number);
      if (y && m && d) {
        const parsed = new Date(y, m - 1, d);
        setCurrentDate(parsed);
        setSelectedDate(parsed);
      }
    }
  }, [initialSelectedDate]);

  // Modal State for New Appointment
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [isEditDetailsCollapsed, setIsEditDetailsCollapsed] = useState(false);

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

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clientsList, setClientsList] = useState<ClientProfile[]>([]);

  // Load appointments and clients directly from database on mount or when initialSelectedDate updates
  useEffect(() => {
    appointmentService.getAppointments().then(loaded => {
      setAppointments(loaded || []);
    });

    clientService.getClients([]).then(loaded => {
      if (loaded && loaded.length > 0) {
        setClientsList(loaded);
      }
    });
  }, [initialSelectedDate]);

  // State to track which client's appointment is selected for procedures display
  const [selectedAppointmentForClient, setSelectedAppointmentForClient] = useState<Appointment | null>(null);

  // Month navigation helpers
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // Format date display (e.g., "18 Setembro")
  const formatDateHeader = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${day} ${monthNames[mIdx] || ''}`;
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

  // Groups of appointments for the SELECTED DATE, grouped by Horário + Nome and sorted
  const selectedDayGroups = useMemo<AgendaGroup[]>(() => {
    const dayApts = appointments.filter(a => a.date === selectedDateStr);
    const map = new Map<string, AgendaGroup>();

    dayApts.forEach(apt => {
      const clientKey = (apt.clientName || '').trim().toLowerCase();
      const timeKey = (apt.startTime || '').trim();
      const groupKey = `${timeKey}_${clientKey}`;

      const matchedClient = clientsList.find(c =>
        (apt.clientId && c.id === apt.clientId) ||
        (c.name && c.name.trim().toLowerCase() === clientKey)
      );

      let aptServices: ClientProcedure[] = [];
      if (apt.services && apt.services.length > 0) {
        aptServices = apt.services.map((srv, idx) => ({
          id: `${apt.id}-srv-${idx}`,
          name: srv.name,
          category: srv.category || apt.category || 'Estética Facial',
          sessions: '1 Sessão',
          date: `${formatDateHeader(apt.date)} • ${apt.startTime}`,
          status: (apt.status === 'concluido' ? 'concluido' : apt.status === 'cancelado' ? 'cancelado' : 'agendado') as any,
          price: srv.price || 0,
          colorScheme: 'purple'
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
          category: apt.category || 'Estética Facial',
          sessions: 'Sessão 1 de 1',
          date: `${formatDateHeader(apt.date)} • ${apt.startTime}`,
          status: (apt.status === 'concluido' ? 'concluido' : apt.status === 'cancelado' ? 'cancelado' : 'agendado') as any,
          price: srvPrice,
          colorScheme: 'purple'
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
          location: apt.location || 'Bela Vista, São Paulo - SP',
          color: apt.color,
          status: apt.status,
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

    const groups = Array.from(map.values());
    // Sort by Horário (startTime) then Nome (clientName)
    groups.sort((a, b) => {
      const timeComp = (a.startTime || '').localeCompare(b.startTime || '');
      if (timeComp !== 0) return timeComp;
      return (a.clientName || '').localeCompare(b.clientName || '', 'pt-BR', { sensitivity: 'base' });
    });

    return groups;
  }, [appointments, selectedDateStr, clientsList]);

  // Selected group state
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDayGroups.length > 0) {
      const exists = selectedDayGroups.some(g => g.id === selectedGroupId);
      if (!exists) {
        setSelectedGroupId(selectedDayGroups[0].id);
      }
    } else {
      setSelectedGroupId(null);
    }
  }, [selectedDayGroups, selectedGroupId]);

  const activeGroup = useMemo<AgendaGroup | null>(() => {
    if (!selectedGroupId) return selectedDayGroups[0] || null;
    return selectedDayGroups.find(g => g.id === selectedGroupId) || selectedDayGroups[0] || null;
  }, [selectedDayGroups, selectedGroupId]);

  // Load procedures of the active selected group / client directly from database
  const clientProcedures = useMemo<ClientProcedure[]>(() => {
    if (!activeGroup) return [];
    if (activeGroup.services && activeGroup.services.length > 0) {
      return activeGroup.services;
    }

    const targetName = (activeGroup.clientName || '').trim().toLowerCase();
    const targetClientId = activeGroup.clientId;

    // 1. Search in clients database
    const matchedClient = clientsList.find(c =>
      (targetClientId && c.id === targetClientId) ||
      (c.name && c.name.trim().toLowerCase() === targetName)
    );

    if (matchedClient && matchedClient.procedures && matchedClient.procedures.length > 0) {
      return matchedClient.procedures.map(p => ({
        id: p.id || `proc-${Math.random()}`,
        name: p.title || 'Serviço',
        category: p.subtitle || p.statusLabel || 'Procedimento',
        sessions: p.modules || 'Sessão 1 de 1',
        date: p.date ? `${p.date}${p.time ? ` • ${p.time}` : ''}` : 'Histórico Clínico',
        status: (p.status || 'agendado') as 'concluido' | 'em_andamento' | 'agendado' | 'cancelado',
        price: p.price || 0,
        colorScheme: (p.colorScheme as any) || 'purple'
      }));
    }

    // 2. Database appointment record fallback
    return [
      {
        id: `cp-${activeGroup.id}-1`,
        name: activeGroup.appointments[0]?.title || 'Atendimento',
        category: activeGroup.appointments[0]?.category || 'Estética Facial',
        sessions: 'Sessão 1 de 1',
        date: `${formatDateHeader(activeGroup.date)} • ${activeGroup.startTime}`,
        status: (activeGroup.status === 'concluido' ? 'concluido' : activeGroup.status === 'cancelado' ? 'cancelado' : 'agendado') as 'concluido' | 'cancelado' | 'agendado',
        price: activeGroup.totalPrice || 0,
        colorScheme: 'purple' as const
      }
    ];
  }, [activeGroup, clientsList]);

  // Edit Appointment Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AgendaGroup | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'confirmado' | 'em_andamento' | 'concluido' | 'cancelado'>('confirmado');
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleOpenEditAppointment = async (target: Appointment | AgendaGroup) => {
    try {
      // Always fetch latest data persisted in database
      const [services, freshClients, freshAppointments] = await Promise.all([
        serviceService.getServices(),
        clientService.getClients([]),
        appointmentService.getAppointments()
      ]);

      const allServices = services || [];
      setAvailableServices(allServices);
      if (freshClients && freshClients.length > 0) setClientsList(freshClients);
      if (freshAppointments && freshAppointments.length > 0) setAppointments(freshAppointments);

      // Determine the full group
      let group: AgendaGroup;
      if ('appointments' in target) {
        group = target;
      } else {
        const found = selectedDayGroups.find(g => g.appointments.some(a => a.id === target.id));
        group = found || {
          id: target.id,
          date: target.date,
          startTime: target.startTime,
          endTime: target.endTime,
          clientName: target.clientName,
          clientId: target.clientId,
          location: target.location,
          color: target.color,
          status: target.status,
          notes: target.notes,
          appointments: [target],
          services: target.services ? target.services.map((s, idx) => ({
            id: s.id || `${target.id}-srv-${idx}`,
            name: s.name,
            category: s.category || target.category || 'Geral',
            sessions: '1 Sessão',
            date: target.date,
            status: target.status as any,
            price: s.price || 0
          })) : [],
          totalPrice: target.price || 0
        };
      }

      const primaryApt = group.appointments[0] || {
        id: group.id,
        date: group.date,
        startTime: group.startTime,
        endTime: group.endTime,
        clientName: group.clientName,
        clientId: group.clientId,
        category: 'Geral',
        title: 'Atendimento',
        color: group.color || '#8b5cf6',
        status: group.status || 'confirmado',
        notes: group.notes || '',
        price: group.totalPrice || 0
      };

      setEditingGroup(group);
      setEditingAppointment(primaryApt);
      setEditDate(group.date);
      setEditStartTime(group.startTime);
      setEditEndTime(group.endTime || primaryApt.endTime || '');
      setEditNotes(group.notes || primaryApt.notes || '');
      setEditStatus(group.status === 'pendente' ? 'confirmado' : (group.status as any));
      setServiceSearch('');
      setIsEditDetailsCollapsed(false);
      setIsEditModalOpen(true);

      // Collect all service identifiers from all appointments in group and matched client procedures
      const matchedServiceIds = new Set<string>();

      // 1. From all appointments in group
      for (const apt of group.appointments) {
        if (apt.services && apt.services.length > 0) {
          for (const s of apt.services) {
            if (s.id && allServices.some(sv => sv.id === s.id)) {
              matchedServiceIds.add(s.id);
            }
            const matchByName = allServices.find(sv => sv.name.trim().toLowerCase() === s.name.trim().toLowerCase());
            if (matchByName) matchedServiceIds.add(matchByName.id);
          }
        }
        
        if (apt.title) {
          // Check exact match
          const exactMatch = allServices.find(sv => sv.name.trim().toLowerCase() === apt.title.trim().toLowerCase());
          if (exactMatch) {
            matchedServiceIds.add(exactMatch.id);
          } else {
            // Split by +, ,, / or &
            const parts = apt.title.split(/[+,/&]/).map(p => p.trim().toLowerCase()).filter(Boolean);
            for (const part of parts) {
              const match = allServices.find(sv => 
                sv.name.toLowerCase().includes(part) || part.includes(sv.name.toLowerCase())
              );
              if (match) matchedServiceIds.add(match.id);
            }
          }
        }
      }

      // 2. From group.services
      if (group.services && group.services.length > 0) {
        for (const srv of group.services) {
          if (srv.id && allServices.some(sv => sv.id === srv.id)) {
            matchedServiceIds.add(srv.id);
          }
          if (srv.name) {
            const matchByName = allServices.find(sv => sv.name.trim().toLowerCase() === srv.name.trim().toLowerCase());
            if (matchByName) {
              matchedServiceIds.add(matchByName.id);
            } else {
              const parts = srv.name.split(/[+,/&]/).map(p => p.trim().toLowerCase()).filter(Boolean);
              for (const part of parts) {
                const match = allServices.find(sv => 
                  sv.name.toLowerCase().includes(part) || part.includes(sv.name.toLowerCase())
                );
                if (match) matchedServiceIds.add(match.id);
              }
            }
          }
        }
      }

      // 3. From client procedures in the database
      const targetName = (group.clientName || '').trim().toLowerCase();
      const matchedClient = (freshClients || []).find(c =>
        (group.clientId && c.id === group.clientId) ||
        (c.name && c.name.trim().toLowerCase() === targetName)
      );

      if (matchedClient && matchedClient.procedures && matchedClient.procedures.length > 0) {
        const [y, m, d] = group.date.split('-');
        const dmyDate = (y && m && d) ? `${d}/${m}/${y}` : group.date;

        for (const proc of matchedClient.procedures) {
          const isDateMatch = !proc.date || proc.date.includes(dmyDate) || proc.date.includes(group.date);
          const isTimeMatch = !proc.time || proc.time === group.startTime;

          if (isDateMatch || isTimeMatch) {
            const matchByName = allServices.find(sv => 
              sv.name.trim().toLowerCase() === proc.title.trim().toLowerCase() ||
              sv.name.toLowerCase().includes(proc.title.toLowerCase()) ||
              proc.title.toLowerCase().includes(sv.name.toLowerCase())
            );
            if (matchByName) matchedServiceIds.add(matchByName.id);
          }
        }
      }

      if (matchedServiceIds.size > 0) {
        setSelectedServiceIds(Array.from(matchedServiceIds));
      } else if (allServices.length > 0) {
        setSelectedServiceIds([allServices[0].id]);
      } else {
        setSelectedServiceIds([]);
      }
    } catch (e) {
      console.warn('Erro ao carregar dados do agendamento:', e);
    }
  };

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAllServices = () => {
    if (selectedServiceIds.length === availableServices.length) {
      setSelectedServiceIds([]);
    } else {
      setSelectedServiceIds(availableServices.map(s => s.id));
    }
  };

  const handleSaveEditedAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    try {
      setIsSavingEdit(true);

      const chosenServices = availableServices.filter(s => selectedServiceIds.includes(s.id));
      const mainTitle = chosenServices.length > 0
        ? chosenServices.map(s => s.name).join(' + ')
        : editingAppointment.title;
      const mainCategory = chosenServices[0]?.category || editingAppointment.category || 'Geral';
      const totalPrice = chosenServices.reduce((acc, s) => acc + (s.price || 0), 0);

      let computedEndTime = editEndTime;
      if (!computedEndTime && editStartTime) {
        const [h, m] = editStartTime.split(':').map(Number);
        const totalDuration = chosenServices.reduce((acc, s) => acc + (s.durationMinutes || 60), 0);
        const endTotalM = (isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m) + totalDuration;
        const endH = Math.floor(endTotalM / 60) % 24;
        const endM = endTotalM % 60;
        computedEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }

      const updatedApt: Appointment = {
        ...editingAppointment,
        date: editDate,
        startTime: editStartTime,
        endTime: computedEndTime || editingAppointment.endTime,
        category: mainCategory,
        title: mainTitle,
        status: editStatus,
        notes: editNotes.trim(),
        price: totalPrice,
        services: chosenServices.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          category: s.category
        }))
      };

      // 1. If group had multiple appointment items in the database, delete the extra ones to consolidate
      if (editingGroup && editingGroup.appointments.length > 1) {
        for (let i = 1; i < editingGroup.appointments.length; i++) {
          await appointmentService.deleteAppointment(editingGroup.appointments[i].id);
        }
      }

      // 2. Save primary updated appointment to database
      await appointmentService.saveAppointment(updatedApt);

      // 3. Update client procedures directly in database
      const targetName = (updatedApt.clientName || '').trim().toLowerCase();
      const freshClients = await clientService.getClients([]);
      const matchedClient = (freshClients || []).find(c =>
        (updatedApt.clientId && c.id === updatedApt.clientId) ||
        (c.name && c.name.trim().toLowerCase() === targetName)
      );

      if (matchedClient) {
        const [year, month, day] = updatedApt.date.split('-');
        const formattedDate = (year && month && day) ? `${day}/${month}/${year}` : updatedApt.date;
        const statusMap = updatedApt.status === 'concluido' ? 'concluido' : updatedApt.status === 'cancelado' ? 'cancelado' : 'agendado';

        const colorPalettes: ('purple' | 'blue' | 'amber' | 'emerald' | 'pink')[] = [
          'purple', 'blue', 'amber', 'emerald', 'pink'
        ];

        // Build new procedures for each chosen service
        const newGroupProcs = chosenServices.map((s, idx) => ({
          id: `proc-${updatedApt.id}-${idx}`,
          title: s.name,
          subtitle: `Agendado para ${formattedDate} às ${updatedApt.startTime}${updatedApt.notes ? ` • ${updatedApt.notes}` : ''}`,
          modules: `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.price || 0)}`,
          status: statusMap as any,
          statusLabel: statusMap === 'concluido' ? 'Concluído' : statusMap === 'cancelado' ? 'Cancelado' : 'Agendado',
          colorScheme: colorPalettes[idx % colorPalettes.length],
          iconType: 'wand' as const,
          date: formattedDate,
          time: updatedApt.startTime,
          notes: updatedApt.notes,
          price: s.price
        }));

        // Remove old procedures associated with this group
        const existingGroupIds = new Set(editingGroup ? editingGroup.appointments.map(a => a.id) : [updatedApt.id]);
        const filteredOtherProcs = (matchedClient.procedures || []).filter(p => 
          !existingGroupIds.has(p.id) &&
          !(p.time === (editingGroup?.startTime || updatedApt.startTime) && p.date?.includes(formattedDate))
        );

        const updatedClient = {
          ...matchedClient,
          procedures: [...newGroupProcs, ...filteredOtherProcs]
        };

        await clientService.saveClient(updatedClient);
      }

      // 4. Reload all fresh data from database
      const [freshApts, reloadedClients] = await Promise.all([
        appointmentService.getAppointments(),
        clientService.getClients([])
      ]);
      setAppointments(freshApts || []);
      setClientsList(reloadedClients || []);

      if (selectedAppointmentForClient?.id === updatedApt.id) {
        setSelectedAppointmentForClient(updatedApt);
      }

      setIsEditModalOpen(false);
      setEditingAppointment(null);
      setEditingGroup(null);
      setNotification('Agendamento e serviços atualizados com sucesso!');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Erro ao salvar edição do agendamento:', err);
      setNotification('Erro ao atualizar agendamento. Tente novamente.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Appointment Group State & Handlers
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState<AgendaGroup | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const handleDeleteAppointmentGroup = (group: AgendaGroup) => {
    setDeleteConfirmGroup(group);
  };

  const handleConfirmDeleteAppointment = async () => {
    if (!deleteConfirmGroup) return;
    setIsDeletingGroup(true);
    try {
      const aptIds = new Set(deleteConfirmGroup.appointments.map(a => a.id));

      // 1. Delete all appointments in this group from appointmentService
      for (const apt of deleteConfirmGroup.appointments) {
        await appointmentService.deleteAppointment(apt.id);
      }

      // 2. Remove from local appointments state
      setAppointments(prev => prev.filter(a => !aptIds.has(a.id)));

      // 3. Update client procedure record if client matches
      const targetName = (deleteConfirmGroup.clientName || '').trim().toLowerCase();
      const targetClientId = deleteConfirmGroup.clientId;
      const matchedClient = clientsList.find(c =>
        (targetClientId && c.id === targetClientId) ||
        (c.name && c.name.trim().toLowerCase() === targetName)
      );

      if (matchedClient && matchedClient.procedures) {
        const updatedClient = {
          ...matchedClient,
          procedures: matchedClient.procedures.filter(p => !aptIds.has(p.id))
        };
        await clientService.saveClient(updatedClient);
        setClientsList(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      }

      if (isEditModalOpen) {
        setIsEditModalOpen(false);
        setEditingAppointment(null);
      }

      setDeleteConfirmGroup(null);
      setNotification('Agendamento removido com sucesso!');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err);
      setNotification('Erro ao remover agendamento. Tente novamente.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const [reopenConfirmGroup, setReopenConfirmGroup] = useState<AgendaGroup | null>(null);

  const executeSetGroupStatus = async (group: AgendaGroup, newStatus: 'confirmado' | 'concluido') => {
    try {
      const aptIds = new Set(group.appointments.map(a => a.id));
      
      // 1. Persist each appointment in group to Supabase / Storage
      for (const apt of group.appointments) {
        const updated: Appointment = {
          ...apt,
          status: newStatus
        };
        await appointmentService.saveAppointment(updated);
      }
      
      // 2. Update local appointments state
      setAppointments(prev => prev.map(a => aptIds.has(a.id) ? { ...a, status: newStatus } : a));
      
      // 3. Sync client procedures if client exists in clientsList
      const targetName = (group.clientName || '').trim().toLowerCase();
      const targetClientId = group.clientId;
      const matchedClient = clientsList.find(c =>
        (targetClientId && c.id === targetClientId) ||
        (c.name && c.name.trim().toLowerCase() === targetName)
      );

      if (matchedClient && matchedClient.procedures) {
        const updatedProcs = matchedClient.procedures.map(p => {
          if (aptIds.has(p.id) || group.appointments.some(a => a.title === p.title)) {
            return {
              ...p,
              status: (newStatus === 'concluido' ? 'concluido' : 'agendado') as 'concluido' | 'agendado' | 'em_andamento' | 'cancelado',
              statusLabel: newStatus === 'concluido' ? 'Concluído' : 'Agendado'
            };
          }
          return p;
        });
        const updatedClient = {
          ...matchedClient,
          procedures: updatedProcs
        };
        await clientService.saveClient(updatedClient);
        setClientsList(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      }

      setNotification(newStatus === 'concluido' ? 'Serviço concluído com sucesso!' : 'Serviço reaberto como agendado.');
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Erro ao atualizar status do serviço:', err);
      setNotification('Erro ao atualizar status. Tente novamente.');
      setTimeout(() => setNotification(null), 3500);
    } finally {
      setReopenConfirmGroup(null);
    }
  };

  const handleToggleGroupCompleted = (e: React.MouseEvent, group: AgendaGroup) => {
    e.stopPropagation();
    
    const isCurrentlyCompleted = group.status === 'concluido' || (group.appointments.length > 0 && group.appointments.every(a => a.status === 'concluido'));
    
    if (isCurrentlyCompleted) {
      // Se já estava concluído/fechado, perguntar se deseja reabrir
      setReopenConfirmGroup(group);
    } else {
      // Se estava aberto, conclui diretamente
      executeSetGroupStatus(group, 'concluido');
    }
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
    <div className="h-full w-full flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in text-stone-800">
      
      {/* Return to Client Appointment Banner */}
      {returnToClientContext && onReturnToClientAppointment && (
        <div className="max-w-7xl mx-auto w-full mb-4 bg-gradient-to-r from-amber-50 to-[#FAF6F0] border border-[#c5922a]/40 rounded-2xl px-5 py-3 shadow-sm flex items-center justify-between animate-fade-in shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white border border-[#c5922a]/40 flex items-center justify-center text-[#c5922a] shadow-xs">
              <Sparkle size={16} weight="fill" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#3D3028]">
                Agendamento em andamento para <span className="text-[#c5922a] font-extrabold">{returnToClientContext.clientName || 'Cliente'}</span>
              </p>
              <p className="text-[11px] text-[#8C7A6B]">
                Você veio da tela de agendamento de serviços. Clique ao lado para retornar e concluir.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onReturnToClientAppointment(returnToClientContext)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <ArrowLeft size={15} weight="bold" />
            <span>Voltar ao Agendamento</span>
          </button>
        </div>
      )}

      {/* 3-Column Glassmorphic Main Layout Container - Proportions 21% / 45% / 34% */}
      <div className="grid grid-cols-1 lg:grid-cols-[21fr_45fr_34fr] gap-4 sm:gap-5 items-stretch max-w-7xl mx-auto w-full">
        
        {/* ========================================================= */}
        {/* 1. LEFT COLUMN: CALENDAR (21% width, Height 540px)        */}
        {/* ========================================================= */}
        <div className="bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-[32px] p-4 sm:p-5 shadow-[0_15px_40px_-15px_rgba(180,155,130,0.14)] flex flex-col justify-between h-[540px]">
          
          <div>
            {/* Header: Month Year with Navigation Arrows (< Month Year >) */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#EBE4D8]/80">
              <button
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-full bg-[#F8F5F0] hover:bg-[#EFE9DF] text-[#4A3B31] flex items-center justify-center transition-all border border-[#E2D8CA] active:scale-95 shadow-sm shrink-0"
                title="Mês Anterior"
              >
                <CaretLeft size={14} weight="bold" />
              </button>

              <h2 className="text-base sm:text-lg font-black text-[#3D3028] tracking-tight text-center truncate px-1">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>

              <button
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-full bg-[#F8F5F0] hover:bg-[#EFE9DF] text-[#4A3B31] flex items-center justify-center transition-all border border-[#E2D8CA] active:scale-95 shadow-sm shrink-0"
                title="Próximo Mês"
              >
                <CaretRight size={14} weight="bold" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-0.5 text-center mb-2">
              {daysOfWeek.map((day, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-black text-[#8C6D46] uppercase tracking-wider py-1"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-2 gap-x-0.5 text-center">
              {calendarDays.map((item, idx) => {
                if (!item.isCurrentMonth) {
                  return <div key={idx} className="h-8 w-8 mx-auto" />;
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
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs transition-all relative ${
                        selected
                          ? 'bg-gradient-to-tr from-[#c5922a] via-[#dfa83b] to-[#f3cb69] text-[#241a06] shadow-md shadow-amber-500/30 font-black border border-amber-300 scale-105'
                          : today
                          ? 'border-2 border-[#c5922a] text-[#8C6418] font-extrabold bg-[#FAF5EC]'
                          : past
                          ? 'text-[#8A7B6E] font-bold line-through decoration-[#B59C86] decoration-[1.5px] hover:bg-[#F3ECE1] hover:text-[#4A3B31]'
                          : 'text-[#4A3B31] font-extrabold hover:bg-[#F3ECE1]'
                      }`}
                    >
                      {item.day}
                    </button>
                    {item.hasEvents && !selected && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${past ? 'bg-[#c5922a]/40' : 'bg-[#c5922a]'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Link: Configure view of calendar */}
          <div className="pt-3 border-t border-stone-100 text-center">
            <button
              onClick={() => setIsNewAppointmentModalOpen(true)}
              className="text-[11px] font-bold text-stone-500 hover:text-stone-900 transition-colors flex items-center justify-center space-x-1 mx-auto truncate"
            >
              <SlidersHorizontal size={13} />
              <span>Configurar calendário</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. MIDDLE COLUMN: YOUR AGENDA (45% width, Height 540px)   */}
        {/* ========================================================= */}
        <div className="bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-[32px] p-6 shadow-[0_15px_40px_-15px_rgba(180,155,130,0.14)] flex flex-col justify-between h-[540px] overflow-hidden">
          
          {/* Header: "Sua agenda" + Add Action */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100/80 shrink-0">
            <h2 className="text-xl sm:text-2xl font-black text-[#3D3028] tracking-tight">
              Sua agenda
            </h2>

            <div className="flex items-center space-x-2">
              {/* Add New Appointment Button with Algodão Egípcio + Gold Accent -> Navigates to Clientes */}
              <button
                onClick={() => {
                  if (onNavigateToNewClientAppointment) {
                    onNavigateToNewClientAppointment(selectedDateStr);
                  } else if (typeof window !== 'undefined' && (window as any).setActiveTab) {
                    (window as any).setActiveTab('clientes');
                  } else {
                    setIsNewAppointmentModalOpen(true);
                  }
                }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c5922a] to-[#966b1a] text-amber-50 border border-amber-200/90 flex items-center justify-center hover:from-[#d4a34b] hover:to-[#a77820] hover:scale-110 active:scale-95 transition-all shadow-md shadow-amber-900/15 cursor-pointer"
                title="Novo Agendamento de Cliente (Ir para Lista de Clientes)"
              >
                <Plus size={16} weight="bold" />
              </button>
            </div>
          </div>

          {/* Agenda Grouped by Selected Date - Scrollable Body */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 scrollbar-thin scrollbar-thumb-[#E2D8CA]/60 scrollbar-track-transparent my-2">
            
            {/* Selected Date Header: e.g. "18 Setembro :" */}
            <div className="flex items-center justify-between text-stone-500 pb-1 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black tracking-tight text-[#3D3028]">
                  {formatDateHeader(selectedDateStr)}
                </span>
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c5922a]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#dfa83b]" />
                </div>
              </div>
              <span className="text-[11px] font-bold text-stone-400">
                {selectedDayGroups.length} agendamento{selectedDayGroups.length !== 1 ? 's' : ''}
              </span>
            </div>

            {selectedDayGroups.length === 0 ? (
              <div className="py-14 flex flex-col items-center justify-center text-center space-y-2">
                <p className="text-xs font-bold text-stone-400">
                  Nenhum agendamento para este dia.
                </p>
                <button
                  onClick={() => {
                    if (onNavigateToNewClientAppointment) {
                      onNavigateToNewClientAppointment(selectedDateStr);
                    } else if (typeof window !== 'undefined' && (window as any).setActiveTab) {
                      (window as any).setActiveTab('clientes');
                    } else {
                      setIsNewAppointmentModalOpen(true);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-amber-50 border border-amber-200/90 font-extrabold text-xs transition-all shadow-md shadow-amber-900/15 hover:from-[#d4a34b] hover:to-[#a77820] hover:scale-105 active:scale-95 cursor-pointer"
                >
                  + Novo Agendamento de Cliente
                </button>
              </div>
            ) : (
              <div className="space-y-3 pl-0.5">
                {selectedDayGroups.map(group => {
                  const isSelectedClient = activeGroup?.id === group.id;
                  const isCompleted = group.status === 'concluido' || (group.appointments.length > 0 && group.appointments.every(a => a.status === 'concluido'));

                  return (
                    <div
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`flex items-start space-x-3.5 group cursor-pointer p-2.5 rounded-2xl transition-all border ${
                        isSelectedClient
                          ? 'bg-[#FAF6F0] border-[#D8C7B5] shadow-sm ring-1 ring-[#E2D8CA]'
                          : 'hover:bg-[#FAF8F5]/90 border-transparent hover:border-stone-100'
                      }`}
                    >
                      {/* 1. Time Column (Only Start Time) */}
                      <div className="w-11 shrink-0 flex items-center text-left">
                        <span className={`text-sm font-black tracking-tight transition-colors ${
                          isCompleted ? 'text-stone-400' : 'text-[#8C6418] group-hover:text-[#63450e]'
                        }`}>
                          {group.startTime}
                        </span>
                      </div>

                      {/* 2. Vertical Colored Accent Bar */}
                      <div
                        className={`w-1 self-stretch rounded-full shrink-0 transition-opacity ${
                          isCompleted ? 'opacity-40' : 'opacity-100'
                        }`}
                        style={{ backgroundColor: isCompleted ? '#10b981' : group.color }}
                      />

                      {/* 3. Details Content (Client Full Name, Location, Status Check, Actions) */}
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-[#3D3028] truncate leading-snug">
                            {group.clientName}
                          </div>
                          <div className="text-[11px] font-medium text-stone-500 mt-0.5 truncate flex items-center space-x-1">
                            <MapPin size={12} className="shrink-0 text-[#c5922a]" />
                            <span>{group.location || 'São Paulo - SP'}</span>
                          </div>
                        </div>

                        {/* Check de Serviço Realizado & Action Buttons */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {/* Botão Amigável de Serviço Concluído */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleGroupCompleted(e, group)}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all active:scale-95 cursor-pointer shrink-0 ${
                              isCompleted
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-emerald-600 shadow-sm shadow-emerald-500/25 ring-2 ring-emerald-400/20'
                                : 'bg-white hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 border-[#E2D8CA] hover:border-emerald-300 shadow-2xs'
                            }`}
                            title={isCompleted ? 'Serviço concluído! Clique para desmarcar e reabrir' : 'Clique para marcar este serviço como concluído'}
                          >
                            {isCompleted ? (
                              <>
                                <SealCheck size={16} weight="fill" className="text-emerald-100" />
                                <span>Concluído</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={15} weight="bold" className="text-stone-400 group-hover:text-emerald-600" />
                                <span className="hidden sm:inline">Concluir</span>
                              </>
                            )}
                          </button>

                          {/* Botões Editar e Remover: Ocultos quando o serviço for realizado */}
                          {!isCompleted && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditAppointment(group);
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#966b1a] border border-[#c5922a]/40 text-[11px] font-bold shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                                title="Editar agendamento e serviços"
                              >
                                <PencilSimple size={12} weight="bold" />
                                <span>Editar</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAppointmentGroup(group);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-xl bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-[#E2D8CA] hover:border-rose-300 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                                title="Remover este agendamento"
                              >
                                <Trash size={12} weight="bold" />
                              </button>
                            </>
                          )}
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
        {/* 3. RIGHT COLUMN: PROCEDURES (34% width, Height 540px)     */}
        {/* ========================================================= */}
        <div className="bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-[32px] p-6 shadow-[0_15px_40px_-15px_rgba(180,155,130,0.14)] flex flex-col justify-between h-[540px] overflow-hidden">
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-[#E2D8CA]/60">
            {/* Section A: Procedimentos da Pessoa Selecionada */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#EBE4D8]">
                <div className="min-w-0 pr-1">
                  <h3 className="text-xs font-black text-[#3D3028] uppercase tracking-wider">
                    Procedimentos
                  </h3>
                  {activeGroup && (
                    <p className="text-[11px] font-bold text-[#6A5A4D] truncate max-w-[200px]">
                      {activeGroup.clientName}
                    </p>
                  )}
                </div>
                {activeGroup && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FAF5EC] text-[#8C6418] border border-[#E2D8CA] shrink-0">
                    {clientProcedures.length} {clientProcedures.length === 1 ? 'item' : 'itens'}
                  </span>
                )}
              </div>

              {/* Total dos Serviços Banner */}
              {activeGroup && clientProcedures.length > 0 && (
                <div className="bg-gradient-to-r from-[#FAF5EC] via-[#F8F1E5] to-[#FAF5EC] border border-[#c5922a]/30 rounded-2xl p-3 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#c5922a]/40 flex items-center justify-center text-[#c5922a] shadow-xs shrink-0">
                      <Sparkle size={16} weight="fill" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#8C6D46] block leading-none">
                        Valor Total dos Serviços
                      </span>
                      <span className="text-[11px] font-bold text-[#6A5A4D]">
                        {clientProcedures.length} procedimento{clientProcedures.length !== 1 ? 's' : ''} agendado{clientProcedures.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-[#966b1a] tracking-tight">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        clientProcedures.reduce((sum, p) => sum + (p.price || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              {activeGroup && clientProcedures.length > 0 ? (
                <div className="space-y-2.5">
                  {clientProcedures.map(proc => {
                    const isDone = proc.status === 'concluido';
                    const isInProgress = proc.status === 'em_andamento';
                    const isCancelled = proc.status === 'cancelado';

                    return (
                      <div
                        key={proc.id}
                        className="p-3 rounded-2xl bg-white border border-[#EBE4D8] hover:border-[#D8C7B5] hover:shadow-md transition-all shadow-[0_2px_8px_-2px_rgba(180,155,130,0.12)] group flex items-center justify-between gap-3"
                      >
                        <h4 className="text-xs font-black text-[#3D3028] group-hover:text-[#c5922a] transition-colors leading-snug flex-1 min-w-0">
                          {proc.name}
                        </h4>
                        <div className="flex items-center space-x-2 shrink-0">
                          {proc.price !== undefined && proc.price > 0 && (
                            <span className="text-xs font-black text-[#966b1a]">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.price)}
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isInProgress
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : isCancelled
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-[#FAF5EC] text-[#8C6418] border-[#E2D8CA]'
                            }`}
                          >
                            {isDone ? 'Concluído' : isInProgress ? 'Em andamento' : isCancelled ? 'Cancelado' : 'Agendado'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-stone-400 text-xs font-semibold">
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
        <div className="fixed inset-0 z-[9999] bg-stone-950/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="relative bg-[#F6F3EE] rounded-[26px] overflow-hidden border border-[#E2D8CA] shadow-[0_25px_70px_-15px_rgba(180,155,130,0.25)] max-w-lg w-full my-auto">
            
            {/* Wallpaper overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
              style={{ backgroundImage: "url('/glowapp_background.png')" }}
            />

            <div className="relative z-10 p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-[#E2D8CA] pb-3 mb-4">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#c5922a]">
                    GlowApp Agenda
                  </span>
                  <h3 className="text-lg font-black text-[#3D3028]">
                    Novo Agendamento
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewAppointmentModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-stone-600 flex items-center justify-center border border-[#E2D8CA]"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              <form onSubmit={handleSaveNewAppointment} className="space-y-3 text-xs">
                {/* Cliente & Localização */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-[#4A3B31] mb-1">
                      Nome da Cliente
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="Ex: Clara Martin"
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-2 font-semibold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#4A3B31] mb-1">
                      Bairro, Cidade - UF
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Ex: Bela Vista, São Paulo - SP"
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-2 font-semibold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                    />
                  </div>
                </div>

                {/* Categoria & Procedimento */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-[#4A3B31] mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ex: Estética Facial"
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-2 font-semibold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#4A3B31] mb-1">
                      Procedimento / Título
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Harmonização Facial"
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-2 font-semibold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                    />
                  </div>
                </div>

                {/* Data e Horários */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-[#4A3B31] mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-2.5 py-2 font-semibold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#4A3B31] mb-1">
                      Início
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-2.5 py-2 font-semibold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#4A3B31] mb-1">
                      Término
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-2.5 py-2 font-semibold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm text-center"
                    />
                  </div>
                </div>

                {/* Cor do Marcador */}
                <div>
                  <label className="block font-bold text-[#4A3B31] mb-1">
                    Cor do Indicador
                  </label>
                  <div className="flex items-center space-x-3">
                    {['#c5922a', '#f97316', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c })}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          formData.color === c ? 'ring-2 ring-offset-2 ring-stone-800 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block font-bold text-[#4A3B31] mb-1">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Detalhes ou recomendações do agendamento..."
                    className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-2 font-semibold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                  />
                </div>

                {/* Botões */}
                <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[#E2D8CA] mt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewAppointmentModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E2D8CA] bg-white text-stone-700 font-extrabold hover:bg-stone-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-amber-50 font-extrabold shadow-md shadow-amber-900/15 flex items-center space-x-1.5 hover:from-[#d4a34b] hover:to-[#a77820]"
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
      {/* FLOATING NOTIFICATION BANNER                             */}
      {/* ========================================================= */}
      {notification && (
        <div className="fixed top-6 right-6 z-[10000] bg-white border border-emerald-300 rounded-2xl px-5 py-3.5 shadow-xl shadow-emerald-950/10 flex items-center space-x-3 text-emerald-800 animate-slide-in">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle size={20} weight="fill" />
          </div>
          <div>
            <h5 className="font-extrabold text-xs text-stone-900">Sucesso</h5>
            <p className="text-xs text-stone-600">{notification}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-600 ml-2 cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR AGENDAMENTO E SERVIÇOS                      */}
      {/* ========================================================= */}
      {isEditModalOpen && editingAppointment && (
        <div className="fixed inset-0 z-[9999] bg-stone-950/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fade-in">
          <div className="relative bg-[#F6F3EE] rounded-[28px] overflow-hidden border border-[#E2D8CA] shadow-[0_25px_70px_-15px_rgba(180,155,130,0.35)] max-w-4xl w-full my-auto flex flex-col max-h-[92vh]">
            
            {/* Wallpaper Texture */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none z-0"
              style={{ backgroundImage: "url('/glowapp_background.png')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/85 via-white/65 to-[#E8DFD3]/50 pointer-events-none z-0" />
            
            <div className="relative z-10 p-5 sm:p-6 flex flex-col flex-1 min-h-0">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E2D8CA] pb-3 mb-3.5 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FAF6F0] to-[#EAE2D5] border border-[#c5922a]/40 flex items-center justify-center text-[#c5922a] shadow-sm">
                    <PencilSimple size={18} weight="bold" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#c5922a]">
                      GlowApp Agenda
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#3D3028] tracking-tight">
                      Editar Agenda • {editingAppointment.clientName}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-600 border border-[#E2D8CA] flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Form Body - 2 Columns */}
              <form onSubmit={handleSaveEditedAppointment} className="flex flex-col space-y-3.5 flex-1 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 flex-1 min-h-0">
                  
                  {/* Left Column: Data, Horário, Status, Descrição */}
                  {!isEditDetailsCollapsed && (
                    <div className="md:col-span-5 flex flex-col justify-between space-y-2.5 bg-white/85 backdrop-blur-sm border border-[#E8DFD3] rounded-2xl p-3.5 shadow-sm overflow-y-auto animate-fade-in">
                      
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-[#EBE4D8] pb-1.5">
                          <div>
                            <h4 className="text-xs font-black text-[#3D3028] uppercase tracking-wider flex items-center space-x-1.5">
                              <CalendarBlank size={14} className="text-[#c5922a]" weight="bold" />
                              <span>Dados do Agendamento</span>
                            </h4>
                            <p className="text-[10px] text-[#8C7A6B] font-medium mt-0.5">
                              Defina a data, horário e detalhes
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsEditDetailsCollapsed(true)}
                            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/15 text-[#6d4d13] border border-[#c5922a]/40 hover:border-[#c5922a] transition-all flex items-center space-x-2 text-xs font-black cursor-pointer shadow-xs hover:shadow-sm group shrink-0 active:scale-95"
                            title="Retrair Dados do Agendamento para expandir a Lista de Serviços"
                          >
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-[#d4a34b] via-[#c5922a] to-[#966b1a] text-white flex items-center justify-center shadow-xs ring-2 ring-amber-400/25 group-hover:scale-105 group-hover:-translate-x-0.5 transition-all duration-200">
                              <ArrowLineLeft size={13} weight="bold" />
                            </div>
                            <span className="tracking-wide">Retrair</span>
                          </button>
                        </div>

                        {/* Data */}
                        <div>
                          <label className="flex items-center space-x-1.5 text-[11px] font-bold text-[#4A3B31] mb-1">
                            <CalendarBlank size={13} className="text-[#c5922a]" weight="bold" />
                            <span>Data do Agendamento *</span>
                          </label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                            required
                            className="w-full bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                          />
                        </div>

                        {/* Horário Início e Término */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="flex items-center space-x-1 text-[11px] font-bold text-[#4A3B31] mb-1">
                              <Clock size={13} className="text-[#c5922a]" weight="bold" />
                              <span>Início *</span>
                            </label>
                            <input
                              type="time"
                              value={editStartTime}
                              onChange={e => setEditStartTime(e.target.value)}
                              required
                              className="w-full bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                            />
                          </div>
                          <div>
                            <label className="flex items-center space-x-1 text-[11px] font-bold text-[#4A3B31] mb-1">
                              <Clock size={13} className="text-[#c5922a]" weight="bold" />
                              <span>Término</span>
                            </label>
                            <input
                              type="time"
                              value={editEndTime}
                              onChange={e => setEditEndTime(e.target.value)}
                              className="w-full bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                            />
                          </div>
                        </div>

                        {/* Status */}
                        <div>
                          <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                            Status do Agendamento
                          </label>
                          <select
                            value={editStatus}
                            onChange={e => setEditStatus(e.target.value as any)}
                            className="w-full bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                          >
                            <option value="confirmado">Confirmado / Agendado</option>
                            <option value="em_andamento">Em Andamento</option>
                            <option value="concluido">Concluído</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </div>

                        {/* Descrição / Observações */}
                        <div>
                          <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                            Descrição / Observações
                          </label>
                          <textarea
                            rows={2}
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            placeholder="Ex: 1ª Sessão, Retorno, Cuidados prévios..."
                            className="w-full bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl px-3 py-1.5 text-xs font-medium text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm resize-none"
                          />
                        </div>
                      </div>

                      {/* Resumo */}
                      <div className="bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl p-2.5 space-y-1 mt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#8C7A6B]">
                          <span>Serviços selecionados:</span>
                          <span className="font-bold text-[#3D3028]">{selectedServiceIds.length}</span>
                        </div>
                        <div className="pt-1 border-t border-[#E8DFD3] flex items-center justify-between">
                          <span className="text-xs font-bold text-[#4A3B31]">Total Previsto:</span>
                          <span className="text-sm font-black text-[#966b1a]">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              availableServices
                                .filter(s => selectedServiceIds.includes(s.id))
                                .reduce((acc, s) => acc + (s.price || 0), 0)
                            )}
                          </span>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Right Column: Services List */}
                  <div className={`${isEditDetailsCollapsed ? 'col-span-12' : 'md:col-span-7'} flex flex-col space-y-2 bg-white/85 backdrop-blur-sm border border-[#E8DFD3] rounded-2xl p-3.5 shadow-sm min-h-0 transition-all duration-300`}>
                    
                    {/* Header with Search and Expand Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBE4D8] pb-2 shrink-0">
                      <div className="flex items-center space-x-3">
                        {isEditDetailsCollapsed && (
                          <button
                            type="button"
                            onClick={() => setIsEditDetailsCollapsed(false)}
                            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/15 text-[#6d4d13] border border-[#c5922a]/40 hover:border-[#c5922a] transition-all flex items-center space-x-2 text-xs font-black cursor-pointer shadow-xs hover:shadow-sm group shrink-0 active:scale-95 animate-fade-in"
                            title="Expandir painel de Dados do Agendamento"
                          >
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-[#d4a34b] via-[#c5922a] to-[#966b1a] text-white flex items-center justify-center shadow-xs ring-2 ring-amber-400/25 group-hover:scale-105 group-hover:translate-x-0.5 transition-all duration-200">
                              <ArrowLineRight size={13} weight="bold" />
                            </div>
                            <span>Expandir Dados ({editDate ? editDate.split('-').reverse().join('/') : 'Data'} às {editStartTime || '--:--'})</span>
                          </button>
                        )}
                        <div>
                          <h4 className="text-xs font-black text-[#3D3028] uppercase tracking-wider flex items-center space-x-1.5">
                            <Sparkle size={14} className="text-[#c5922a]" weight="fill" />
                            <span>Lista de Serviços</span>
                          </h4>
                          <p className="text-[10px] text-[#8C7A6B] font-medium">
                            Selecione um ou mais procedimentos
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isEditDetailsCollapsed && (
                          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs shadow-2xs">
                            <span className="text-[#8C7A6B] font-bold">Total ({selectedServiceIds.length}):</span>
                            <span className="font-black text-[#966b1a]">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                availableServices
                                  .filter(s => selectedServiceIds.includes(s.id))
                                  .reduce((acc, s) => acc + (s.price || 0), 0)
                              )}
                            </span>
                          </div>
                        )}

                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Buscar serviço..."
                            value={serviceSearch}
                            onChange={e => setServiceSearch(e.target.value)}
                            className="bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl pl-7 pr-2.5 py-1 text-[11px] font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-1 focus:ring-amber-300 w-36 sm:w-44 shadow-2xs"
                          />
                          <MagnifyingGlass size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]" weight="bold" />
                        </div>

                        <button
                          type="button"
                          onClick={handleSelectAllServices}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#FAF6F0] hover:bg-[#EAE2D5] text-[#966b1a] border border-[#E2D8CA] transition-all shrink-0 cursor-pointer"
                        >
                          {selectedServiceIds.length === availableServices.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Services List */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-[#E2D8CA]/60 scrollbar-track-transparent min-h-[220px] max-h-[340px]">
                      {availableServices
                        .filter(s =>
                          s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                          (s.category && s.category.toLowerCase().includes(serviceSearch.toLowerCase()))
                        )
                        .map(service => {
                          const isSelected = selectedServiceIds.includes(service.id);

                          return (
                            <div
                              key={service.id}
                              onClick={() => handleToggleService(service.id)}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-[#FAF6F0] border-[#c5922a] shadow-xs ring-1 ring-[#c5922a]/30'
                                  : 'bg-white hover:bg-[#FAF8F5] border-[#E8DFD3]'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                <div className="shrink-0 text-[#c5922a]">
                                  {isSelected ? (
                                    <CheckSquare size={18} weight="fill" />
                                  ) : (
                                    <Square size={18} weight="regular" className="text-stone-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-xs font-bold text-[#3D3028] truncate">
                                      {service.name}
                                    </span>
                                    {service.category && (
                                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[#F4EFE6] text-[#8C6D46] shrink-0">
                                        {service.category}
                                      </span>
                                    )}
                                  </div>
                                  {service.description && (
                                    <p className="text-[10px] text-[#8C7A6B] truncate max-w-xs">
                                      {service.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-xs font-black text-[#966b1a] block">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price || 0)}
                                </span>
                                {service.durationMinutes && (
                                  <span className="text-[10px] text-[#8C7A6B] font-semibold">
                                    {service.durationMinutes} min
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E2D8CA] shrink-0">
                  <div>
                    {editingAppointment && (
                      <button
                        type="button"
                        onClick={() => {
                          const matchedGroup = selectedDayGroups.find(g => g.appointments.some(a => a.id === editingAppointment.id));
                          if (matchedGroup) {
                            handleDeleteAppointmentGroup(matchedGroup);
                          }
                        }}
                        className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Trash size={14} weight="bold" />
                        <span>Remover Agendamento</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-[#E2D8CA] bg-white text-stone-700 font-extrabold text-xs hover:bg-stone-50 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                    disabled={isSavingEdit || selectedServiceIds.length === 0}
                    className={`px-5 py-2 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 font-black text-xs shadow-md shadow-amber-900/15 flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer ${
                      isSavingEdit || selectedServiceIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <CheckCircle size={15} weight="bold" />
                    <span>{isSavingEdit ? 'Salvando Alterações...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </div>
            </form>

            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmGroup && (
        <div className="fixed inset-0 z-[10000] bg-stone-950/45 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF6F0] rounded-[24px] border border-[#E2D8CA] p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash size={20} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#3D3028]">Remover Agendamento</h3>
                <p className="text-xs text-[#8C7A6B] font-medium">Deseja realmente excluir este agendamento?</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E2D8CA] text-xs space-y-1">
              <p className="font-bold text-[#3D3028]">Data: <span className="font-medium text-[#6A5A4D]">{formatDateHeader(deleteConfirmGroup.date)} às {deleteConfirmGroup.startTime}</span></p>
              <p className="font-bold text-[#3D3028]">Cliente: <span className="font-medium text-[#6A5A4D]">{deleteConfirmGroup.clientName}</span></p>
              <p className="font-bold text-[#3D3028]">Serviços: <span className="font-medium text-[#6A5A4D]">{deleteConfirmGroup.services.length} procedimento(s)</span></p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmGroup(null)}
                disabled={isDeletingGroup}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E2D8CA] text-xs font-bold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAppointment}
                disabled={isDeletingGroup}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-900/20 transition-all active:scale-95 cursor-pointer"
              >
                {isDeletingGroup ? 'Removendo...' : 'Sim, Remover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRMAÇÃO DE REABERTURA DE SERVIÇO               */}
      {/* ========================================================= */}
      {reopenConfirmGroup && (
        <div className="fixed inset-0 z-[10000] bg-stone-950/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF6F0] rounded-[28px] border border-[#E2D8CA] p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center space-x-3 pb-3 border-b border-[#E2D8CA]">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-[#966b1a] shadow-xs shrink-0">
                <SealCheck size={22} weight="fill" className="text-[#c5922a]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#3D3028]">Reabrir Serviço</h3>
                <p className="text-[11px] text-[#8C7A6B] font-semibold">Alterar status do atendimento</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E2D8CA] space-y-2 text-xs">
              <p className="text-[#3D3028] font-bold">
                Deseja realmente reabrir o serviço de <strong className="text-[#966b1a]">{reopenConfirmGroup.clientName}</strong> como pendente?
              </p>
              <p className="text-[11px] text-stone-500 font-medium">
                Ao reabrir, os botões de <strong>Editar</strong> e <strong>Remover</strong> voltarão a ficar disponíveis.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-[#E2D8CA]">
              <button
                type="button"
                onClick={() => setReopenConfirmGroup(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#E2D8CA] text-xs font-bold text-stone-700 hover:bg-stone-100 transition-all cursor-pointer shadow-2xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executeSetGroupStatus(reopenConfirmGroup, 'confirmado')}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 text-xs font-black shadow-md shadow-amber-900/15 transition-all cursor-pointer active:scale-95"
              >
                Sim, Reabrir Serviço
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
