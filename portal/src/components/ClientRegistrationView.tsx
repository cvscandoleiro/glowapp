import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Cake,
  EnvelopeSimple,
  PencilSimple,
  InstagramLogo,
  TwitterLogo,
  FacebookLogo,
  WhatsappLogo,
  CheckCircle,
  XCircle,
  X,
  Spinner,
  MapPinLine,
  Plus,
  ArrowLeft,
  Check,
  CalendarBlank,
  Calendar,
  Clock,
  MagnifyingGlass,
  Sparkle,
  Trash
} from '@phosphor-icons/react';
import { serviceService, type ServiceItem } from '../services/serviceService';

interface ProcedureItem {
  id: string;
  title: string;
  subtitle: string;
  modules: string;
  status: 'concluido' | 'em_andamento' | 'agendado' | 'cancelado';
  statusLabel: string;
  colorScheme: 'blue' | 'purple' | 'pink' | 'emerald' | 'amber';
  iconType: 'desktop' | 'mobile' | 'wand';
  date?: string;
  time?: string;
  notes?: string;
  price?: number;
}

interface ClientProfile {
  id: string;
  name: string;
  gender: 'female' | 'male';
  avatar: string;
  inscriptionDate: string;
  birthDate: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  location: string;
  phone: string;
  isWhatsapp: boolean;
  email: string;
  instagram: string;
  xTwitter: string;
  facebook: string;
  cardNumber: string;
  planName: string;
  planBenefits: string[];
  procedures: ProcedureItem[];
}

const getClientAvatar = (gender?: 'female' | 'male', avatar?: string): string => {
  if (avatar && avatar.trim() && !avatar.includes('default_avatar')) {
    return avatar;
  }
  if (gender === 'male') {
    return '/default_avatar_male.png';
  }
  return '/default_avatar_female.png';
};

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)})${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)})${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
};

const formatDate = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};

const createEmptyClient = (id?: string): ClientProfile => ({
  id: id || `cli-${Date.now()}`,
  name: '',
  gender: 'female',
  avatar: '/default_avatar_female.png',
  inscriptionDate: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
  birthDate: '',
  cep: '',
  address: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  location: '',
  phone: '',
  isWhatsapp: true,
  email: '',
  instagram: '',
  xTwitter: '',
  facebook: '',
  cardNumber: '',
  planName: '',
  planBenefits: [],
  procedures: []
});

export interface AppointmentDraftState {
  clientId?: string;
  clientName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentNotes?: string;
  selectedServiceIds?: string[];
}

export interface ClientRegistrationViewProps {
  initialClientId?: string;
  initialClientName?: string;
  initialOpenCreate?: boolean;
  initialOpenNewAppointment?: boolean;
  initialAppointmentDraft?: AppointmentDraftState | null;
  originFromAgenda?: boolean;
  onAppointmentSavedAndReturnToAgenda?: (date?: string) => void;
  onBackToList?: () => void;
  onNavigateToAgenda?: (
    date?: string,
    context?: AppointmentDraftState
  ) => void;
}

import { clientService } from '../services/clientService';
import { appointmentService, type Appointment } from '../services/appointmentService';

export const ClientRegistrationView: React.FC<ClientRegistrationViewProps> = ({
  initialClientId,
  initialClientName,
  initialOpenCreate,
  initialOpenNewAppointment,
  initialAppointmentDraft,
  originFromAgenda,
  onAppointmentSavedAndReturnToAgenda,
  onBackToList,
  onNavigateToAgenda
}) => {
  const [emptyClientTemplate] = useState<ClientProfile>(() => createEmptyClient());
  const [clients, setClients] = useState<ClientProfile[]>([]);

  // Load clients asynchronously from Supabase / localStorage on mount
  useEffect(() => {
    clientService.getClients([]).then(loaded => {
      if (loaded && loaded.length > 0) {
        setClients(loaded);
      }
    });
  }, []);

  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (initialClientId) return initialClientId;
    return '';
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // New Appointment / Agenda Modal State
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [editingAppointmentGroup, setEditingAppointmentGroup] = useState<GroupedAppointment | null>(null);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('14:00');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  const handleOpenNewAppointment = async () => {
    setEditingAppointmentGroup(null);
    setAppointmentDate(new Date().toISOString().split('T')[0]);
    setAppointmentTime('14:00');
    setAppointmentNotes('');
    setServiceSearch('');
    setSelectedServiceIds([]);
    setIsLoadingServices(true);
    setIsNewAppointmentOpen(true);

    try {
      const data = await serviceService.getServices();
      setAvailableServices(data || []);
    } catch (err) {
      console.error('Erro ao carregar serviços para o agendamento:', err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleOpenEditAppointment = async (group: GroupedAppointment) => {
    setEditingAppointmentGroup(group);

    // Convert DD/MM/YYYY to YYYY-MM-DD if needed
    let isoDate = group.dateStr;
    if (group.dateStr && group.dateStr.includes('/')) {
      const parts = group.dateStr.split('/');
      if (parts.length === 3) {
        const [d, m, y] = parts;
        isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }

    setAppointmentDate(isoDate || new Date().toISOString().split('T')[0]);
    setAppointmentTime(group.timeStr && group.timeStr !== '--:--' ? group.timeStr : '14:00');
    setAppointmentNotes(group.notes || '');
    setServiceSearch('');
    setIsLoadingServices(true);
    setIsNewAppointmentOpen(true);

    try {
      const data = await serviceService.getServices();
      const servicesList = data || [];
      setAvailableServices(servicesList);

      // Match selectedServiceIds from group.services
      const matchedIds: string[] = [];
      group.services.forEach(item => {
        const found = servicesList.find(s =>
          s.name.toLowerCase().trim() === item.title.toLowerCase().trim() ||
          s.id === item.id
        );
        if (found) {
          matchedIds.push(found.id);
        }
      });
      setSelectedServiceIds(matchedIds);
    } catch (err) {
      console.error('Erro ao carregar serviços para edição:', err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  // Delete Appointment Group State & Handlers
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState<GroupedAppointment | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const handleDeleteAppointmentGroup = (group: GroupedAppointment) => {
    setDeleteConfirmGroup(group);
  };

  const handleConfirmDeleteGroup = async () => {
    if (!deleteConfirmGroup) return;
    setIsDeletingGroup(true);
    try {
      const idsToRemove = new Set(deleteConfirmGroup.procedureIds || []);

      // 1. Delete each appointment from appointmentService
      for (const id of idsToRemove) {
        await appointmentService.deleteAppointment(id);
      }

      // 2. Remove procedures from current client
      const updatedProcedures = (currentClient.procedures || []).filter(p => !idsToRemove.has(p.id));
      const updatedClient: ClientProfile = {
        ...currentClient,
        procedures: updatedProcedures
      };

      const updatedClients = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
      setClients(updatedClients);
      await clientService.saveClient(updatedClient);

      if (isNewAppointmentOpen) {
        setIsNewAppointmentOpen(false);
        setEditingAppointmentGroup(null);
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

  const toggleSelectService = (serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSaveNewAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServiceIds.length === 0 || isSavingAppointment) return;

    const chosenServices = availableServices.filter(s => selectedServiceIds.includes(s.id));
    if (chosenServices.length === 0) return;

    setIsSavingAppointment(true);

    try {
      const [year, month, day] = appointmentDate.split('-');
      const formattedDate = (year && month && day) ? `${day}/${month}/${year}` : appointmentDate;

      const colorPalettes: ('purple' | 'blue' | 'amber' | 'emerald' | 'pink')[] = [
        'purple', 'blue', 'amber', 'emerald', 'pink'
      ];

      // 1. Determine Procedure IDs and build updated procedure items
      const existingIds = editingAppointmentGroup ? (editingAppointmentGroup.procedureIds || []) : [];

      const newProcedures: ProcedureItem[] = chosenServices.map((srv, idx) => {
        // Reuse existing ID on edit to guarantee UPDATE action instead of insert
        const procId = idx < existingIds.length ? existingIds[idx] : `proc-${Date.now()}-${idx}`;

        return {
          id: procId,
          title: srv.name,
          subtitle: `Agendado para ${formattedDate} às ${appointmentTime}${appointmentNotes.trim() ? ` • ${appointmentNotes.trim()}` : ''}`,
          modules: `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(srv.price)}`,
          status: 'agendado',
          statusLabel: 'Agendado',
          colorScheme: colorPalettes[idx % colorPalettes.length],
          iconType: 'wand',
          date: formattedDate,
          time: appointmentTime,
          notes: appointmentNotes.trim(),
          price: srv.price
        };
      });

      // If editing existing group, remove the old procedures belonging to that group
      let updatedProceduresList: ProcedureItem[];
      if (editingAppointmentGroup) {
        const idsToRemove = new Set(existingIds);
        const filteredOld = (currentClient.procedures || []).filter(p => !idsToRemove.has(p.id));
        updatedProceduresList = [...newProcedures, ...filteredOld];
      } else {
        updatedProceduresList = [...newProcedures, ...(currentClient.procedures || [])];
      }

      const updatedClient: ClientProfile = {
        ...currentClient,
        procedures: updatedProceduresList
      };

      const updatedClients = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
      setClients(updatedClients);

      // Save client update to Supabase / LocalStorage
      await clientService.saveClient(updatedClient);

      // 2. If services were removed during edit, delete removed appointment entries from database
      if (editingAppointmentGroup && existingIds.length > chosenServices.length) {
        const removedIds = existingIds.slice(chosenServices.length);
        for (const remId of removedIds) {
          const aptRemId = remId.startsWith('apt-') ? remId : `apt-${remId.replace('proc-', '')}`;
          await appointmentService.deleteAppointment(aptRemId);
        }
      }

      // 3. Save / Update individual appointments in appointments table (Agenda calendar)
      for (let idx = 0; idx < chosenServices.length; idx++) {
        const srv = chosenServices[idx];
        const procId = newProcedures[idx].id;
        const aptId = procId.startsWith('apt-') ? procId : `apt-${procId.replace('proc-', '')}`;

        const [startH, startM] = appointmentTime.split(':').map(Number);
        const duration = srv.durationMinutes || 60;
        const totalMinutes = (isNaN(startH) ? 14 : startH) * 60 + (isNaN(startM) ? 0 : startM) + duration;
        const endH = Math.floor(totalMinutes / 60) % 24;
        const endM = totalMinutes % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        const apptData: Appointment = {
          id: aptId,
          clientId: currentClient.id,
          date: appointmentDate,
          startTime: appointmentTime,
          endTime: endTime,
          category: srv.category || 'Estética Facial',
          title: srv.name,
          clientName: currentClient.name || 'Cliente',
          location: currentClient.location || (currentClient.city ? `${currentClient.neighborhood ? `${currentClient.neighborhood}, ` : ''}${currentClient.city} - ${currentClient.state || 'SP'}` : 'Bela Vista, São Paulo - SP'),
          clientAvatar: getClientAvatar(currentClient.gender, currentClient.avatar),
          color: srv.category === 'Injetáveis' ? '#8b5cf6' : srv.category === 'Corporal' ? '#c5922a' : '#ec4899',
          status: 'confirmado',
          notes: appointmentNotes.trim(),
          price: srv.price,
          services: [{ id: srv.id, name: srv.name, price: srv.price, category: srv.category }]
        };

        // Performs UPDATE on existing id or INSERT on new id
        await appointmentService.saveAppointment(apptData);
      }

      setIsNewAppointmentOpen(false);
      const successMsg = editingAppointmentGroup
        ? 'Agendamento atualizado com sucesso!'
        : chosenServices.length > 1
        ? `${chosenServices.length} procedimentos agendados e salvos com sucesso!`
        : `Procedimento "${chosenServices[0].name}" agendado e salvo com sucesso!`;
      setEditingAppointmentGroup(null);
      setNotification(successMsg);
      setTimeout(() => setNotification(null), 4000);

      // If originated from Agenda, return automatically to Agenda with fresh data
      if (originFromAgenda && onAppointmentSavedAndReturnToAgenda) {
        onAppointmentSavedAndReturnToAgenda(appointmentDate);
      }
    } catch (err) {
      console.error('Erro ao gravar agendamento na base:', err);
      setNotification('Erro ao salvar agendamento. Tente novamente.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsSavingAppointment(false);
    }
  };

  useEffect(() => {
    if (initialOpenCreate) {
      handleCreateNewClient();
    } else if (initialOpenNewAppointment) {
      if (initialAppointmentDraft) {
        if (initialAppointmentDraft.appointmentDate) {
          setAppointmentDate(initialAppointmentDraft.appointmentDate);
        }
        if (initialAppointmentDraft.appointmentTime) {
          setAppointmentTime(initialAppointmentDraft.appointmentTime);
        }
        if (initialAppointmentDraft.appointmentNotes !== undefined) {
          setAppointmentNotes(initialAppointmentDraft.appointmentNotes);
        }
        if (initialAppointmentDraft.selectedServiceIds) {
          setSelectedServiceIds(initialAppointmentDraft.selectedServiceIds);
        }
        setServiceSearch('');
        setIsLoadingServices(true);
        setIsNewAppointmentOpen(true);
        serviceService.getServices().then(data => {
          setAvailableServices(data || []);
        }).finally(() => {
          setIsLoadingServices(false);
        });
      } else {
        handleOpenNewAppointment();
      }
    } else {
      setIsNewAppointmentOpen(false);
      setEditingAppointmentGroup(null);
    }
  }, [initialOpenCreate, initialOpenNewAppointment, initialAppointmentDraft]);

  // Sync selected client if initialClientId or initialClientName changes
  React.useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId);
    } else if (initialClientName && clients.length > 0) {
      const found = clients.find(c =>
        c.name.toLowerCase().includes(initialClientName.toLowerCase()) ||
        initialClientName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (found) {
        setSelectedClientId(found.id);
      }
    }
  }, [initialClientId, initialClientName, clients]);

  const currentClient = (selectedClientId ? clients.find(c => c.id === selectedClientId) : null) || emptyClientTemplate;
  const [editFormData, setEditFormData] = useState<ClientProfile>(currentClient);

  // Sync editing form data when selected client changes
  React.useEffect(() => {
    if (currentClient) {
      setEditFormData(currentClient);
    }
  }, [selectedClientId, currentClient]);

  const handleCreateNewClient = () => {
    const newClient = createEmptyClient();
    setEditFormData(newClient);
    setIsCreatingNew(true);
    setIsEditing(true);
  };

  const handleOpenEdit = () => {
    if (!currentClient.name) {
      handleCreateNewClient();
    } else {
      setEditFormData({ ...currentClient });
      setIsCreatingNew(false);
      setIsEditing(true);
    }
  };

  // Handle CEP automatic search on blur (ViaCEP)
  const handleCepBlur = async (cepInput: string) => {
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setEditFormData(prev => ({
            ...prev,
            cep: cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2'),
            address: data.logradouro || prev.address,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
            location: `${data.localidade || prev.city}, ${data.uf || prev.state}`
          }));
        }
      } catch (err) {
        console.error('Erro ao consultar CEP:', err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name.trim()) return;

    const exists = clients.some(c => c.id === editFormData.id);
    let updatedList: ClientProfile[];
    if (exists) {
      updatedList = clients.map(c => (c.id === editFormData.id ? { ...editFormData } : c));
    } else {
      updatedList = [editFormData, ...clients];
    }

    setClients(updatedList);
    setSelectedClientId(editFormData.id);
    await clientService.saveClient(editFormData);
    setIsEditing(false);
    setIsCreatingNew(false);
    setNotification(exists ? 'Dados salvos com sucesso!' : 'Novo cliente cadastrado com sucesso!');
    setTimeout(() => setNotification(null), 4000);
  };

  interface GroupedAppointment {
    id: string;
    dateStr: string;
    timeStr: string;
    notes?: string;
    status: 'concluido' | 'agendado' | 'em_andamento' | 'cancelado';
    statusLabel: string;
    totalPriceFormatted: string;
    procedureIds: string[];
    services: {
      id: string;
      title: string;
      price: string;
      status: 'concluido' | 'agendado' | 'em_andamento' | 'cancelado';
      colorScheme: 'blue' | 'purple' | 'pink' | 'emerald' | 'amber';
      iconType: 'desktop' | 'mobile' | 'wand';
    }[];
  }

  const groupedAppointments = useMemo<GroupedAppointment[]>(() => {
    if (!currentClient.procedures || currentClient.procedures.length === 0) return [];

    const groups: Record<string, GroupedAppointment> = {};
    const groupOrder: string[] = [];

    currentClient.procedures.forEach((proc, index) => {
      let dateStr = proc.date || '';
      let timeStr = proc.time || '';
      let notes = proc.notes || '';

      // Fallback extraction from subtitle if date/time not explicitly set
      if (!dateStr || !timeStr) {
        const match = proc.subtitle.match(/Agendado para\s+([\d/.-]+)\s+às\s+([\d:]+)(?:\s*•\s*(.*))?/i);
        if (match) {
          dateStr = match[1];
          timeStr = match[2];
          if (match[3] && !notes) {
            notes = match[3].trim();
          }
        } else {
          const dateMatch = proc.subtitle.match(/(\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{2})/);
          const timeMatch = proc.subtitle.match(/(\d{1,2}:\d{2})/);
          dateStr = dateMatch ? dateMatch[1] : '';
          timeStr = timeMatch ? timeMatch[1] : '';
        }
      }

      const procStatus: 'concluido' | 'agendado' | 'em_andamento' | 'cancelado' =
        proc.status === 'concluido'
          ? 'concluido'
          : proc.status === 'cancelado'
          ? 'cancelado'
          : 'agendado';

      // Group key by date and time
      const key = dateStr && timeStr ? `${dateStr}__${timeStr}` : (dateStr || proc.subtitle || `proc-group-${index}`);

      if (!groups[key]) {
        groups[key] = {
          id: `grp-${key}-${index}`,
          dateStr: dateStr || 'Data a definir',
          timeStr: timeStr || '--:--',
          notes: notes || undefined,
          status: procStatus,
          statusLabel: proc.statusLabel || (procStatus === 'concluido' ? 'Concluído' : procStatus === 'cancelado' ? 'Cancelado' : 'Agendado'),
          totalPriceFormatted: '',
          procedureIds: [proc.id],
          services: []
        };
        groupOrder.push(key);
      } else {
        groups[key].procedureIds.push(proc.id);
        if (notes && !groups[key].notes) {
          groups[key].notes = notes;
        }
        if (procStatus === 'agendado') {
          groups[key].status = 'agendado';
          groups[key].statusLabel = 'Agendado';
        }
      }

      let priceFormatted = proc.modules || '';
      if (proc.price !== undefined && typeof proc.price === 'number') {
        priceFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.price);
      }

      groups[key].services.push({
        id: proc.id,
        title: proc.title,
        price: priceFormatted,
        status: procStatus,
        colorScheme: proc.colorScheme,
        iconType: proc.iconType
      });
    });

    return groupOrder.map(key => {
      const grp = groups[key];
      let sum = 0;
      let hasNumericPrice = false;

      grp.services.forEach(srv => {
        const clean = srv.price.replace(/[^\d,-]/g, '').replace(',', '.');
        const num = parseFloat(clean);
        if (!isNaN(num)) {
          sum += num;
          hasNumericPrice = true;
        }
      });

      grp.totalPriceFormatted = hasNumericPrice
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sum)
        : '';

      return grp;
    });
  }, [currentClient.procedures]);

  const renderStatusBadge = (
    status: 'concluido' | 'agendado' | 'em_andamento' | 'cancelado',
    label?: string,
    group?: GroupedAppointment
  ) => {
    if (status === 'concluido') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300/60 shadow-xs select-none">
          <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
          <span>{label || 'Concluído'}</span>
        </span>
      );
    }
    if (status === 'cancelado') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300/60 shadow-xs select-none">
          <XCircle size={14} weight="fill" className="text-rose-600 shrink-0" />
          <span>{label || 'Cancelado'}</span>
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (group) handleOpenEditAppointment(group);
        }}
        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FAF6F0] hover:bg-amber-100 text-[#966b1a] hover:text-[#7d5612] border border-[#c5922a]/40 hover:border-[#c5922a] shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer group/badge"
        title="Clique para editar este agendamento"
      >
        <Calendar size={14} weight="duotone" className="text-[#c5922a] shrink-0" />
        <span>{label || 'Agendado'}</span>
        <PencilSimple size={12} weight="bold" className="text-[#c5922a] opacity-70 group-hover/badge:opacity-100 transition-opacity ml-0.5" />
      </button>
    );
  };

  const renderServiceStatusIcon = (status: 'concluido' | 'agendado' | 'em_andamento' | 'cancelado') => {
    if (status === 'concluido') {
      return <CheckCircle size={16} weight="fill" className="text-emerald-600" />;
    }
    if (status === 'cancelado') {
      return <XCircle size={16} weight="fill" className="text-rose-600" />;
    }
    return <Calendar size={16} weight="duotone" className="text-[#c5922a]" />;
  };

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto px-4 sm:px-8 py-6 max-w-5xl mx-auto scrollbar-thin scrollbar-thumb-[#E2D8CA]/60 scrollbar-track-transparent">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-6 z-10 gap-3">
        <div className="flex items-center space-x-2.5">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="flex items-center space-x-2 px-4 py-2 bg-white/90 hover:bg-white text-[#3D3028] border border-[#E2D8CA] rounded-2xl text-xs font-black shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
              title="Voltar para a Lista de Clientes"
            >
              <ArrowLeft size={16} weight="bold" className="text-[#c5922a]" />
              <span>Voltar para Lista</span>
            </button>
          )}

          {originFromAgenda && onNavigateToAgenda && (
            <button
              type="button"
              onClick={() => onNavigateToAgenda()}
              className="flex items-center space-x-2 px-4 py-2 bg-[#FAF6F0] hover:bg-[#F2ECE1] text-[#8C6418] border border-[#c5922a]/40 rounded-2xl text-xs font-black shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
              title="Retornar à Agenda"
            >
              <Calendar size={16} weight="bold" className="text-[#c5922a]" />
              <span>Voltar para Agenda</span>
            </button>
          )}
        </div>

        {notification && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center space-x-3 bg-white/98 backdrop-blur-xl text-[#3D3028] border-2 border-emerald-500/50 px-5 py-3 rounded-2xl shadow-[0_15px_45px_-10px_rgba(16,185,129,0.3)] animate-fade-in transition-all">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle size={20} weight="fill" className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-black text-[#3D3028]">
                {notification}
              </p>
              <p className="text-[10px] text-[#8C7A6B] font-semibold">
                As informações foram gravadas e atualizadas na base.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="w-6 h-6 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors ml-2 cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6 pb-12">
        {/* ========================================================= */}
        {/* TOP PROFILE HERO CARD                                     */}
        {/* ========================================================= */}
        <div className="bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(180,155,130,0.12)] relative transition-all">
          
          {/* Top-Right Edit / Create Button */}
          <button
            onClick={handleOpenEdit}
            className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-xl bg-[#F8F5F0] hover:bg-[#EFE9DF] text-[#4A3B31] hover:text-[#2D231E] transition-all border border-[#E2D8CA] shadow-sm active:scale-95"
            title={currentClient.name ? "Editar Informações da Cliente" : "Cadastrar Cliente"}
          >
            <PencilSimple size={18} weight="bold" />
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 sm:gap-8">
            {/* Left Column: Circular Profile Avatar with Social Media Icons Aligned with Telefone */}
            <div className="flex flex-col items-center justify-between shrink-0 space-y-3 sm:space-y-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-[#dfc8b0]/60 via-[#f4ece1]/80 to-[#e2d6c3]/60 shadow-[0_10px_25px_rgba(180,155,130,0.20)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white flex items-center justify-center">
                  <img
                    src={getClientAvatar(currentClient.gender, currentClient.avatar)}
                    alt={currentClient.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getClientAvatar(currentClient.gender);
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Social / Channel Icon Badges (X, Instagram, Facebook, WhatsApp) */}
              <div className="flex items-center justify-center gap-2.5 pt-2">
                {/* X (Twitter) */}
                <a
                  href={`https://twitter.com/${currentClient.xTwitter.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`X: ${currentClient.xTwitter}`}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c5922a] to-[#966b1a] text-amber-50 border border-amber-200/90 flex items-center justify-center hover:from-[#d4a34b] hover:to-[#a77820] hover:scale-110 transition-all shadow-md shadow-amber-900/15"
                >
                  <TwitterLogo size={16} weight="fill" />
                </a>

                {/* Instagram */}
                <a
                  href={`https://instagram.com/${currentClient.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`Instagram: ${currentClient.instagram}`}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c5922a] to-[#966b1a] text-amber-50 border border-amber-200/90 flex items-center justify-center hover:from-[#d4a34b] hover:to-[#a77820] hover:scale-110 transition-all shadow-md shadow-amber-900/15"
                >
                  <InstagramLogo size={16} weight="bold" />
                </a>

                {/* Facebook */}
                <a
                  href={`https://facebook.com/${currentClient.facebook}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`Facebook: ${currentClient.facebook}`}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c5922a] to-[#966b1a] text-amber-50 border border-amber-200/90 flex items-center justify-center hover:from-[#d4a34b] hover:to-[#a77820] hover:scale-110 transition-all shadow-md shadow-amber-900/15"
                >
                  <FacebookLogo size={16} weight="fill" />
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/55${currentClient.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`WhatsApp: ${currentClient.phone}`}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c5922a] to-[#966b1a] text-amber-50 border border-amber-200/90 flex items-center justify-center hover:from-[#d4a34b] hover:to-[#a77820] hover:scale-110 transition-all shadow-md shadow-amber-900/15"
                >
                  <WhatsappLogo size={16} weight="fill" />
                </a>
              </div>
            </div>

            {/* Profile Info Details List */}
            <div className="flex-1 flex flex-col justify-between py-0.5 text-center md:text-left space-y-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#3D3028] tracking-tight">
                  {currentClient.name || 'Nova Cliente'}
                </h1>
                {!currentClient.name && (
                  <p className="text-xs text-stone-500 font-medium mt-1">
                    Nenhum cliente selecionado. Clique em Novo Cliente para cadastrar.
                  </p>
                )}
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm text-[#5C4A3E] font-medium">
                {/* 1. Bairro (Bairro, Cidade, UF) */}
                <div className="flex items-center justify-center md:justify-start space-x-2.5">
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-[#c5922a]" />
                  </div>
                  <span>
                    <strong className="text-[#3D3028] font-bold">Bairro :</strong>{' '}
                    {currentClient.neighborhood || currentClient.city
                      ? `${currentClient.neighborhood ? currentClient.neighborhood + ', ' : ''}${currentClient.city || ''}${currentClient.state ? ' - ' + currentClient.state : ''}`
                      : 'Não informado'}
                  </span>
                </div>

                {/* 2. Data Nascimento */}
                <div className="flex items-center justify-center md:justify-start space-x-2.5">
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <Cake size={18} className="text-[#c5922a]" />
                  </div>
                  <span>
                    <strong className="text-[#3D3028] font-bold">Data Nascimento :</strong>{' '}
                    {currentClient.birthDate || 'Não informado'}
                  </span>
                </div>

                {/* 3. Email */}
                <div className="flex items-center justify-center md:justify-start space-x-2.5">
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <EnvelopeSimple size={18} className="text-[#c5922a]" />
                  </div>
                  <span>
                    <strong className="text-[#3D3028] font-bold">E-mail :</strong>{' '}
                    {currentClient.email || 'Não informado'}
                  </span>
                </div>

                {/* 4. Telefone */}
                <div className="flex items-center justify-center md:justify-start space-x-2.5">
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <WhatsappLogo size={18} className="text-[#c5922a]" />
                  </div>
                  <span>
                    <strong className="text-[#3D3028] font-bold">Telefone :</strong>{' '}
                    {currentClient.phone || 'Não informado'}
                  </span>
                </div>
              </div>

              {!currentClient.name && (
                <div className="pt-2 flex justify-center md:justify-start">
                  <button
                    type="button"
                    onClick={handleCreateNewClient}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 text-xs font-bold shadow-md shadow-amber-900/15 hover:shadow-lg active:scale-95 transition-all"
                  >
                    <Plus size={15} weight="bold" />
                    <span>Cadastrar Dados da Cliente</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* HISTÓRICO DE AGENDAMENTOS / MINHAS AGENDAS                */}
        {/* ========================================================= */}
        <div className="bg-white/95 backdrop-blur-xl border border-[#EBE4D8] rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(180,155,130,0.12)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#3D3028] tracking-tight">
                Minhas Agendas
              </h2>
              <p className="text-xs text-[#8C7A6B] font-semibold mt-0.5">
                Histórico de agendamentos e procedimentos agrupados por data e hora
              </p>
            </div>

            {/* + Nova Agenda Button */}
            <button
              type="button"
              onClick={handleOpenNewAppointment}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 text-xs font-bold shadow-md shadow-amber-900/15 hover:shadow-lg active:scale-95 transition-all cursor-pointer shrink-0"
              title="Criar Novo Agendamento para esta Cliente"
            >
              <Plus size={16} weight="bold" />
              <span>Nova Agenda</span>
            </button>
          </div>

          {/* Vertical Timeline Container */}
          <div className="relative pl-6 space-y-6">
            {groupedAppointments && groupedAppointments.length > 0 ? (
              <>
                {/* Vertical connecting line */}
                <div className="absolute left-2.5 top-6 bottom-8 w-0.5 bg-[#d4a34b]/35" />

                {groupedAppointments.map((group) => {
                  const isConcluido = group.status === 'concluido';
                  const isCancelado = group.status === 'cancelado';

                  const nodeBg = isConcluido
                    ? 'bg-emerald-600 text-white'
                    : isCancelado
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#c5922a] text-white';

                  return (
                    <div key={group.id} className="relative">
                      {/* Timeline circular node marker with status icon */}
                      <div className={`absolute -left-6 top-6 w-5 h-5 rounded-full ${nodeBg} border-2 border-white shadow-sm z-10 flex items-center justify-center`}>
                        {isConcluido ? (
                          <Check size={11} weight="bold" />
                        ) : isCancelado ? (
                          <X size={11} weight="bold" />
                        ) : (
                          <CalendarBlank size={11} weight="bold" />
                        )}
                      </div>

                      {/* Grouped Appointment Card */}
                      <div className="w-full bg-[#FAF6F0]/95 backdrop-blur-md border border-[#E8DFD3] hover:border-[#c5922a]/40 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                        
                        {/* Header: Date & Time + Status & Total Price */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E8DFD3]/80">
                          <div className="flex items-center space-x-3.5">
                            {/* Main Status Icon Box */}
                            <div className="w-11 h-11 rounded-2xl bg-white border border-[#E2D8CA] flex items-center justify-center shrink-0 shadow-xs">
                              {isConcluido ? (
                                <CheckCircle size={24} weight="fill" className="text-emerald-600" />
                              ) : isCancelado ? (
                                <XCircle size={24} weight="fill" className="text-rose-600" />
                              ) : (
                                <Calendar size={24} weight="duotone" className="text-[#c5922a]" />
                              )}
                            </div>

                            <div>
                              {/* Date and Time Badges */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm sm:text-base font-black text-[#3D3028] flex items-center space-x-1.5">
                                  <CalendarBlank size={16} className="text-[#c5922a]" weight="bold" />
                                  <span>{group.dateStr}</span>
                                </span>
                                <span className="text-xs sm:text-sm font-extrabold text-[#966b1a] bg-white border border-[#E2D8CA] px-2.5 py-0.5 rounded-lg flex items-center space-x-1 shadow-2xs">
                                  <Clock size={14} className="text-[#c5922a]" weight="bold" />
                                  <span>{group.timeStr}</span>
                                </span>
                              </div>
                              {group.notes && (
                                <p className="text-xs text-[#8C7A6B] font-medium mt-1 italic">
                                  "{group.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Status badge, Total Price & Edit Action */}
                          <div className="flex items-center space-x-2.5 self-end sm:self-center shrink-0">
                            {group.totalPriceFormatted && (
                              <div className="text-right pr-1">
                                <span className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider block">
                                  Total Sessão
                                </span>
                                <span className="text-xs sm:text-sm font-black text-[#966b1a]">
                                  {group.totalPriceFormatted}
                                </span>
                              </div>
                            )}

                            {renderStatusBadge(group.status, group.statusLabel, group)}

                            {!isConcluido && !isCancelado && (
                              <div className="flex items-center space-x-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAppointment(group)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#966b1a] border border-[#c5922a]/40 text-xs font-bold shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer"
                                  title="Editar data, horário e serviços deste agendamento"
                                >
                                  <PencilSimple size={13} weight="bold" />
                                  <span>Editar</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAppointmentGroup(group)}
                                  className="w-7 h-7 flex items-center justify-center rounded-xl bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-[#E2D8CA] hover:border-rose-300 text-xs font-bold shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer"
                                  title="Remover este agendamento em aberto"
                                >
                                  <Trash size={13} weight="bold" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Body: Services in this Appointment */}
                        <div className="mt-3">
                          <div className="text-[10px] font-extrabold text-[#8C7A6B] uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Serviços Agendados ({group.services.length})</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {group.services.map((srv) => (
                              <div
                                key={srv.id}
                                className="flex items-center justify-between p-2.5 rounded-2xl bg-white/90 hover:bg-white border border-[#E8DFD3] transition-all shadow-2xs"
                              >
                                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                  <div className="w-7 h-7 rounded-xl bg-[#FAF6F0] border border-[#E2D8CA] flex items-center justify-center shrink-0">
                                    {renderServiceStatusIcon(srv.status)}
                                  </div>
                                  <span className="text-xs font-bold text-[#3D3028] truncate">
                                    {srv.title}
                                  </span>
                                </div>
                                <span className="text-xs font-black text-[#966b1a] shrink-0">
                                  {srv.price}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="py-8 text-center text-stone-400 text-xs font-semibold">
                Nenhum agendamento ou procedimento registrado para esta cliente.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* EDIT MODAL DIALOG (Algodão Egípcio Theme)                 */}
      {/* ========================================================= */}
      {/* Edit Client Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[9999] bg-stone-950/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          
          {/* Modal Container */}
          <div className="relative bg-[#F6F3EE] rounded-[26px] overflow-hidden border border-[#E2D8CA] shadow-[0_20px_60px_-15px_rgba(180,155,130,0.25)] max-w-2xl w-full my-auto">
            
            {/* 30% Opacity Wallpaper Background */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none z-0"
              style={{ backgroundImage: "url('/glowapp_background.png')" }}
            />
            {/* Ethereal Glow overlays */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/70 via-white/50 to-[#E8DFD3]/40 pointer-events-none z-0" />
            <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#c5922a]/10 blur-[90px] pointer-events-none z-0" />

            {/* Modal Content */}
            <div className="relative z-10 p-4 sm:p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E2D8CA] pb-2.5 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#c5922a]/40 shadow-sm shrink-0 bg-white">
                    <img
                      src={getClientAvatar(editFormData.gender, editFormData.avatar)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#c5922a]">
                      GlowApp Management
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-[#3D3028] tracking-tight leading-tight">
                      {isCreatingNew ? 'Novo Cadastro de Cliente' : 'Editar Informações da Cliente'}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border border-[#E2D8CA] flex items-center justify-center transition-all shadow-sm active:scale-95"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEdit} className="space-y-2.5 sm:space-y-3">
                
                {/* 1. Nome Completo & Sexo */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* Nome Completo (8 cols) */}
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                      placeholder="Nome completo da cliente"
                      required
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                    />
                  </div>

                  {/* Sexo (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                      Sexo
                    </label>
                    <div className="flex items-center space-x-1.5 bg-white/95 border border-[#E2D8CA] rounded-xl p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData(prev => ({
                            ...prev,
                            gender: 'female',
                            avatar:
                              !prev.avatar || prev.avatar.includes('default_avatar')
                                ? '/default_avatar_female.png'
                                : prev.avatar
                          }))
                        }
                        className={`flex-1 py-1 rounded-lg text-xs font-extrabold transition-all ${
                          editFormData.gender === 'female'
                            ? 'bg-[#c5922a] text-white shadow-sm'
                            : 'text-[#6A5A4D] hover:text-[#3D3028]'
                        }`}
                      >
                        Feminino
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData(prev => ({
                            ...prev,
                            gender: 'male',
                            avatar:
                              !prev.avatar || prev.avatar.includes('default_avatar')
                                ? '/default_avatar_male.png'
                                : prev.avatar
                          }))
                        }
                        className={`flex-1 py-1 rounded-lg text-xs font-extrabold transition-all ${
                          editFormData.gender === 'male'
                            ? 'bg-[#c5922a] text-white shadow-sm'
                            : 'text-[#6A5A4D] hover:text-[#3D3028]'
                        }`}
                      >
                        Masculino
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. CEP & Busca Automática */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* CEP (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1 flex items-center justify-between">
                      <span>CEP</span>
                      {isSearchingCep && (
                        <span className="text-[10px] text-[#c5922a] flex items-center space-x-1 font-semibold">
                          <Spinner size={12} className="animate-spin" />
                          <span>Buscando...</span>
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editFormData.cep}
                        onChange={e => setEditFormData({ ...editFormData, cep: formatCep(e.target.value) })}
                        onBlur={e => handleCepBlur(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                      />
                      <MapPinLine size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5922a] pointer-events-none" />
                    </div>
                  </div>

                  {/* Endereço (Logradouro) (8 cols) */}
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={editFormData.address}
                      onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                      placeholder="Rua, Avenida, Praça..."
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                    />
                  </div>
                </div>

                {/* 3. Número, Complemento & Bairro */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* Número (3 cols) */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={editFormData.number || ''}
                      onChange={e => setEditFormData({ ...editFormData, number: e.target.value })}
                      placeholder="123"
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                    />
                  </div>

                  {/* Complemento (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={editFormData.complement || ''}
                      onChange={e => setEditFormData({ ...editFormData, complement: e.target.value })}
                      placeholder="Apto, Bloco..."
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                    />
                  </div>

                  {/* Bairro (5 cols) */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={editFormData.neighborhood}
                      onChange={e => setEditFormData({ ...editFormData, neighborhood: e.target.value })}
                      placeholder="Bairro"
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                    />
                  </div>
                </div>

                {/* 4. Cidade & Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* Cidade (8 cols) */}
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={e => setEditFormData({ ...editFormData, city: e.target.value })}
                      placeholder="Cidade"
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                    />
                  </div>

                  {/* Estado / UF (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                      Estado (UF)
                    </label>
                    <input
                      type="text"
                      value={editFormData.state}
                      onChange={e => setEditFormData({ ...editFormData, state: e.target.value.toUpperCase() })}
                      placeholder="UF"
                      maxLength={2}
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] uppercase placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all text-center"
                    />
                  </div>
                </div>

                {/* 5. Data de Nascimento, Telefone (com check WhatsApp) & E-mail */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* Data de Nascimento (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                      Data Nascimento
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editFormData.birthDate}
                        onChange={e => setEditFormData({ ...editFormData, birthDate: formatDate(e.target.value) })}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                      />
                      <Cake size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5922a] pointer-events-none" />
                    </div>
                  </div>

                  {/* Telefone & WhatsApp (4 cols) */}
                  <div className="sm:col-span-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-[#4A3B31]">
                        Telefone
                      </label>
                      <label className="flex items-center space-x-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editFormData.isWhatsapp}
                          onChange={e => setEditFormData({ ...editFormData, isWhatsapp: e.target.checked })}
                          className="rounded text-[#c5922a] focus:ring-amber-400 border-[#E2D8CA] w-3 h-3"
                        />
                        <span className="text-[10px] font-extrabold text-emerald-700 flex items-center space-x-0.5">
                          <WhatsappLogo size={12} weight="fill" className="text-emerald-600" />
                          <span>WhatsApp</span>
                        </span>
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={editFormData.phone}
                        onChange={e => setEditFormData({ ...editFormData, phone: formatPhoneNumber(e.target.value) })}
                        placeholder="(41)99999-9999"
                        maxLength={14}
                        className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                      />
                      <WhatsappLogo size={15} weight="fill" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5922a] pointer-events-none" />
                    </div>
                  </div>

                  {/* E-mail (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                      E-mail
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                        placeholder="cliente@email.com"
                        required
                        className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                      />
                      <EnvelopeSimple size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5922a] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* 6. Redes Sociais: Instagram, X (Twitter) & Facebook */}
                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-[#4A3B31] mb-1.5">
                    Redes Sociais
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                    {/* Instagram */}
                    <div className="relative flex items-center">
                      <InstagramLogo size={15} className="absolute left-3 text-[#c5922a] pointer-events-none" weight="bold" />
                      <input
                        type="text"
                        value={editFormData.instagram}
                        onChange={e => setEditFormData({ ...editFormData, instagram: e.target.value })}
                        placeholder="@instagram"
                        className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                      />
                    </div>

                    {/* X (Twitter) */}
                    <div className="relative flex items-center">
                      <TwitterLogo size={15} className="absolute left-3 text-[#c5922a] pointer-events-none" weight="fill" />
                      <input
                        type="text"
                        value={editFormData.xTwitter}
                        onChange={e => setEditFormData({ ...editFormData, xTwitter: e.target.value })}
                        placeholder="@x_twitter"
                        className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                      />
                    </div>

                    {/* Facebook */}
                    <div className="relative flex items-center">
                      <FacebookLogo size={15} className="absolute left-3 text-[#c5922a] pointer-events-none" weight="fill" />
                      <input
                        type="text"
                        value={editFormData.facebook}
                        onChange={e => setEditFormData({ ...editFormData, facebook: e.target.value })}
                        placeholder="facebook.com/usuario"
                        className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[#E2D8CA] mt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-[#E2D8CA] bg-white/80 hover:bg-white text-stone-700 font-extrabold text-xs transition-all shadow-sm active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 font-extrabold text-xs shadow-md shadow-amber-900/15 transition-all active:scale-95 flex items-center space-x-2"
                  >
                    <CheckCircle size={15} weight="bold" />
                    <span>{isCreatingNew ? 'Cadastrar Cliente' : 'Salvar Alterações'}</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* NOVA AGENDA MODAL DIALOG (2-COLUMN SIDE-BY-SIDE)           */}
      {/* ========================================================= */}
      {isNewAppointmentOpen && (
        <div className="fixed inset-0 z-[9999] bg-stone-950/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fade-in">
          <div className="relative bg-[#F6F3EE] rounded-[28px] overflow-hidden border border-[#E2D8CA] shadow-[0_25px_70px_-15px_rgba(180,155,130,0.35)] max-w-4xl w-full my-auto flex flex-col max-h-[92vh]">
            
            {/* Background Texture & Glow */}
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
                    {editingAppointmentGroup ? (
                      <PencilSimple size={18} weight="bold" />
                    ) : (
                      <Plus size={18} weight="bold" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#c5922a]">
                      GlowApp Agenda
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#3D3028] tracking-tight">
                      {editingAppointmentGroup ? 'Editar Agenda' : 'Nova Agenda'} • {currentClient.name || 'Cliente'}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewAppointmentOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-600 border border-[#E2D8CA] flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Form Body - 2 Columns (Left: Date/Time/Description | Right: Services List) */}
              <form onSubmit={handleSaveNewAppointment} className="flex flex-col space-y-3.5 flex-1 min-h-0">
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 flex-1 min-h-0">
                  
                  {/* ========================================================= */}
                  {/* QUADRO À ESQUERDA: DATA, HORÁRIO E DESCRIÇÃO              */}
                  {/* ========================================================= */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-2.5 bg-white/85 backdrop-blur-sm border border-[#E8DFD3] rounded-2xl p-3.5 shadow-sm">
                    
                    <div className="space-y-2.5">
                      <div className="border-b border-[#EBE4D8] pb-1.5">
                        <h4 className="text-xs font-black text-[#3D3028] uppercase tracking-wider flex items-center space-x-1.5">
                          <CalendarBlank size={14} className="text-[#c5922a]" weight="bold" />
                          <span>Dados do Agendamento</span>
                        </h4>
                        <p className="text-[10px] text-[#8C7A6B] font-medium mt-0.5">
                          Defina a data, horário e detalhes
                        </p>
                      </div>

                      {/* Data com Botão Abrir Agenda */}
                      <div>
                        <label className="flex items-center space-x-1.5 text-[11px] font-bold text-[#4A3B31] mb-1">
                          <CalendarBlank size={13} className="text-[#c5922a]" weight="bold" />
                          <span>Data do Agendamento *</span>
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="date"
                            value={appointmentDate}
                            onChange={e => setAppointmentDate(e.target.value)}
                            required
                            className="flex-1 min-w-0 bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigateToAgenda) {
                                setIsNewAppointmentOpen(false);
                                onNavigateToAgenda(appointmentDate, {
                                  clientId: currentClient.id,
                                  clientName: currentClient.name,
                                  appointmentDate: appointmentDate,
                                  appointmentTime: appointmentTime,
                                  appointmentNotes: appointmentNotes,
                                  selectedServiceIds: selectedServiceIds
                                });
                              }
                            }}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 rounded-xl text-[11px] font-extrabold shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
                            title="Abrir Agenda na data selecionada"
                          >
                            <Calendar size={13} weight="bold" />
                            <span>Ver Agenda</span>
                          </button>
                        </div>
                      </div>

                      {/* Horário */}
                      <div>
                        <label className="flex items-center space-x-1.5 text-[11px] font-bold text-[#4A3B31] mb-1">
                          <Clock size={13} className="text-[#c5922a]" weight="bold" />
                          <span>Horário do Agendamento *</span>
                        </label>
                        <input
                          type="time"
                          value={appointmentTime}
                          onChange={e => setAppointmentTime(e.target.value)}
                          required
                          className="w-full bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm transition-all"
                        />
                      </div>

                      {/* Descrição / Observações */}
                      <div>
                        <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                          Descrição / Observações (opcional)
                        </label>
                        <textarea
                          rows={2}
                          value={appointmentNotes}
                          onChange={e => setAppointmentNotes(e.target.value)}
                          placeholder="Ex: 1ª Sessão, Retorno, Cuidados prévios..."
                          className="w-full bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl px-3 py-1.5 text-xs font-medium text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm resize-none"
                        />
                      </div>
                    </div>

                    {/* Resumo do Agendamento no Quadro Esquerdo */}
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

                  {/* ========================================================= */}
                  {/* QUADRO À DIREITA: LISTA DE SERVIÇOS PARA SELEÇÃO          */}
                  {/* ========================================================= */}
                  <div className="md:col-span-7 flex flex-col space-y-2 bg-white/85 backdrop-blur-sm border border-[#E8DFD3] rounded-2xl p-3.5 shadow-sm min-h-0">
                    
                    {/* Header do Quadro de Serviços com Busca */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBE4D8] pb-2 shrink-0">
                      <div>
                        <h4 className="text-xs font-black text-[#3D3028] uppercase tracking-wider flex items-center space-x-1.5">
                          <Sparkle size={14} className="text-[#c5922a]" weight="fill" />
                          <span>Lista de Serviços</span>
                        </h4>
                        <p className="text-[10px] text-[#8C7A6B] font-medium">
                          Marque para selecionar o serviço escolhido
                        </p>
                      </div>

                      {/* Search inside modal */}
                      <div className="relative min-w-[150px]">
                        <MagnifyingGlass size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#c5922a]" weight="bold" />
                        <input
                          type="text"
                          value={serviceSearch}
                          onChange={e => setServiceSearch(e.target.value)}
                          placeholder="Buscar serviço..."
                          className="w-full bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl pl-7 pr-2.5 py-1 text-[11px] font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                      </div>
                    </div>

                    {/* Services List Header */}
                    <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#8C7A6B] border-b border-[#EBE4D8] select-none shrink-0">
                      <div className="col-span-1 text-center">Sel.</div>
                      <div className="col-span-6">Serviço</div>
                      <div className="col-span-3 text-left">Preço</div>
                      <div className="col-span-2 text-right">Status</div>
                    </div>

                    {/* Services List / Table with Isolated Vertical Scroll */}
                    <div className="space-y-1.5 flex-1 min-h-0 max-h-[250px] sm:max-h-[280px] overflow-y-auto pr-1">
                      {isLoadingServices ? (
                        <div className="py-10 text-center text-xs font-bold text-[#8C7A6B] flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-[#c5922a] border-t-transparent rounded-full animate-spin" />
                          <span>Carregando serviços cadastrados...</span>
                        </div>
                      ) : availableServices.length === 0 ? (
                        <div className="py-8 text-center text-xs font-semibold text-stone-400">
                          Nenhum serviço cadastrado no sistema.
                        </div>
                      ) : (
                        availableServices
                          .filter(s =>
                            !serviceSearch.trim() ||
                            s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                            (s.category && s.category.toLowerCase().includes(serviceSearch.toLowerCase())) ||
                            (s.description && s.description.toLowerCase().includes(serviceSearch.toLowerCase()))
                          )
                          .map(srv => {
                            const isChecked = selectedServiceIds.includes(srv.id);

                            return (
                              <div
                                key={srv.id}
                                onClick={() => toggleSelectService(srv.id)}
                                className={`flex sm:grid sm:grid-cols-12 items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-[#FAF6F0] border-[#c5922a] ring-1 ring-[#c5922a]/50 shadow-sm'
                                    : 'bg-white/95 hover:bg-[#FAF7F2] border-[#E8DFD3]'
                                }`}
                              >
                                {/* Checkbox Column */}
                                <div className="sm:col-span-1 flex items-center justify-center shrink-0">
                                  <div
                                    className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                                      isChecked
                                        ? 'bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-white shadow-sm'
                                        : 'border-2 border-[#D8C8B5] bg-white'
                                    }`}
                                  >
                                    {isChecked && <Check size={11} weight="bold" />}
                                  </div>
                                </div>

                                {/* Service Name & Description */}
                                <div className="sm:col-span-6 min-w-0 flex-1">
                                  <div className="text-xs font-bold text-[#3D3028] truncate">
                                    {srv.name}
                                  </div>
                                  {srv.description && (
                                    <div className="text-[10px] text-[#8C7A6B] truncate font-medium">
                                      {srv.description}
                                    </div>
                                  )}
                                </div>

                                {/* Price Column */}
                                <div className="sm:col-span-3 text-left">
                                  <span className="text-xs font-black text-[#966b1a]">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(srv.price || 0)}
                                  </span>
                                </div>

                                {/* Status Column */}
                                <div className="sm:col-span-2 flex items-center justify-end shrink-0">
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                      srv.status === 'ativo'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-stone-200 text-stone-600'
                                    }`}
                                  >
                                    {srv.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>

                  </div>

                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E2D8CA] shrink-0">
                  <div>
                    {editingAppointmentGroup && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAppointmentGroup(editingAppointmentGroup)}
                        className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Trash size={14} weight="bold" />
                        <span>Remover Agendamento</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsNewAppointmentOpen(false)}
                      className="px-4 py-2 rounded-xl border border-[#E2D8CA] bg-white/80 hover:bg-white text-stone-700 font-extrabold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={selectedServiceIds.length === 0 || isSavingAppointment}
                      className={`px-5 py-2 rounded-xl text-amber-50 font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 ${
                        selectedServiceIds.length === 0 || isSavingAppointment
                          ? 'bg-stone-300 cursor-not-allowed opacity-60'
                          : 'bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] shadow-amber-900/15 active:scale-95 cursor-pointer'
                      }`}
                    >
                      {isSavingAppointment ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>{editingAppointmentGroup ? 'Salvando alterações...' : 'Gravando na base...'}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} weight="bold" />
                          <span>
                            {editingAppointmentGroup
                              ? 'Salvar Alterações da Agenda'
                              : selectedServiceIds.length > 1
                              ? `Confirmar (${selectedServiceIds.length}) Agendamentos`
                              : 'Confirmar Agendamento'}
                          </span>
                        </>
                      )}
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
              <p className="font-bold text-[#3D3028]">Data: <span className="font-medium text-[#6A5A4D]">{deleteConfirmGroup.dateStr} às {deleteConfirmGroup.timeStr}</span></p>
              <p className="font-bold text-[#3D3028]">Cliente: <span className="font-medium text-[#6A5A4D]">{currentClient.name}</span></p>
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
                onClick={handleConfirmDeleteGroup}
                disabled={isDeletingGroup}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-900/20 transition-all active:scale-95 cursor-pointer"
              >
                {isDeletingGroup ? 'Removendo...' : 'Sim, Remover'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
