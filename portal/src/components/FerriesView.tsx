import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper, IconButton, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, MenuItem, FormControl, InputLabel, Select, OutlinedInput, Checkbox, ListItemText, Snackbar, Alert, Tooltip, Drawer } from '@mui/material';
import { Plus, Users, X, CaretLeft, CaretRight, Calendar, CaretDown, CaretUp } from '@phosphor-icons/react';
import { usePlanningStore } from '../store/PlanningStore';
import type { SquadMember } from '../types';
import { getAvatarById } from '../utils/avatarRepository';

interface Ferrie {
  id?: number;
  professionalId: number;
  professionalName: string;
  professionalAvatar?: string | null;
  professionalAvatarImage?: string | null;
  professionalProfile?: string;
  substituteId?: number;
  substituteName?: string;
  substituteAvatar?: string | null;
  substituteAvatarImage?: string | null;
  substituteProfile?: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'planned' | 'approved' | 'completed';
}

function ArcRing({ size }: { size: number }) {
  const r_outer = (size / 2) - 1;
  const cx = size / 2;
  const cy = size / 2;
  const r_mid = r_outer - 5;
  const strokeWidthThick = 9;

  const c1 = '#64183f';
  const c2 = '#ec4899';
  const gradId = `arc-grad-substitute-${size}`;

  return (
    <svg
      width={size}
      height={size}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      
      <circle
        cx={cx}
        cy={cy}
        r={r_outer - 1}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.5"
      />

      <path
        d={`M ${cx - r_mid} ${cy} A ${r_mid} ${r_mid} 0 0 0 ${cx + r_mid} ${cy}`}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidthThick}
        strokeLinecap="butt"
      />
    </svg>
  );
}

export const FerriesView: React.FC = () => {
  const { squad, filters, canWrite } = usePlanningStore();
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // Refs for syncing Gantt header + body horizontal scroll
  const ganttHeaderRef = useRef<HTMLDivElement>(null);
  const ganttBodyRef = useRef<HTMLDivElement>(null);

  const handleGanttBodyScroll = useCallback(() => {
    if (ganttBodyRef.current && ganttHeaderRef.current) {
      ganttHeaderRef.current.scrollLeft = ganttBodyRef.current.scrollLeft;
    }
  }, []);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null);
  const [ferries, setFerries] = useState<Ferrie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFerrie, setEditingFerrie] = useState<Ferrie | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState<'professional' | 'substitute' | null>(null);
  const [selectedProfileFilters, setSelectedProfileFilters] = useState<string[]>([]);
  const [nameSearchFilter, setNameSearchFilter] = useState('');
  const mainProfileFilters = filters.perfil ? filters.perfil.split(',').filter(Boolean) : [];
  const [startDateInputType, setStartDateInputType] = useState<'text' | 'date'>('text');
  const [endDateInputType, setEndDateInputType] = useState<'text' | 'date'>('text');
  const [formData, setFormData] = useState<{
    professionalId: number;
    professionalName: string;
    professionalAvatar: string | null;
    professionalAvatarImage: string | null;
    professionalProfile: string;
    substituteId: number;
    substituteName: string;
    substituteAvatar: string | null;
    substituteAvatarImage: string | null;
    substituteProfile: string;
    startDate: string;
    endDate: string;
    description: string;
    status: Ferrie['status'];
  }>({
    professionalId: 0,
    professionalName: '',
    professionalAvatar: null,
    professionalAvatarImage: null,
    professionalProfile: '',
    substituteId: 0,
    substituteName: '',
    substituteAvatar: null,
    substituteAvatarImage: null,
    substituteProfile: '',
    startDate: '',
    endDate: '',
    description: '',
    status: 'planned'
  });

  const activeMinsaitProfessionals = squad
    .filter((member) => (member.status || 'ATIVO') === 'ATIVO')
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const profileOptions = Array.from(new Set(activeMinsaitProfessionals.map((member) => member.perfil))).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  let filteredMinsaitProfessionals = selectedProfileFilters.length > 0
    ? activeMinsaitProfessionals.filter((member) => selectedProfileFilters.includes(member.perfil))
    : activeMinsaitProfessionals;

  if (nameSearchFilter.trim() !== '') {
    const searchLower = nameSearchFilter.toLowerCase();
    filteredMinsaitProfessionals = filteredMinsaitProfessionals.filter((member) =>
      member.nome.toLowerCase().includes(searchLower)
    );
  }

  const loadFerries = async () => {
    try {
      const response = await fetch(`/api/ferries?year=${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        setFerries(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar férias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadFerries();
  }, [currentYear]);

  const handleOpenModal = (ferrie?: Ferrie) => {
    if (!canWrite) return;
    if (ferrie) {
      setEditingFerrie(ferrie);
      setStartDateInputType(ferrie.startDate ? 'date' : 'text');
      setEndDateInputType(ferrie.endDate ? 'date' : 'text');
      setFormData({
        professionalId: ferrie.professionalId,
        professionalName: ferrie.professionalName,
        professionalAvatar: ferrie.professionalAvatar || null,
        professionalAvatarImage: ferrie.professionalAvatarImage || null,
        professionalProfile: ferrie.professionalProfile || '',
        substituteId: ferrie.substituteId || 0,
        substituteName: ferrie.substituteName || '',
        substituteAvatar: ferrie.substituteAvatar || null,
        substituteAvatarImage: ferrie.substituteAvatarImage || null,
        substituteProfile: ferrie.substituteProfile || '',
        startDate: ferrie.startDate,
        endDate: ferrie.endDate,
        description: ferrie.description,
        status: ferrie.status
      });
    } else {
      setEditingFerrie(null);
      setStartDateInputType('text');
      setEndDateInputType('text');
      setFormData({
        professionalId: 0,
        professionalName: '',
        professionalAvatar: null,
        professionalAvatarImage: null,
        professionalProfile: '',
        substituteId: 0,
        substituteName: '',
        substituteAvatar: null,
        substituteAvatarImage: null,
        substituteProfile: '',
        startDate: '',
        endDate: '',
        description: '',
        status: 'planned'
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingFerrie(null);
    setSelectorOpen(false);
    setSelectorTarget(null);
    setSelectedProfileFilters([]);
    setNameSearchFilter('');
  };

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOpenDrawer = (ferrie: Ferrie) => {
    if (!canWrite) return;
    setEditingFerrie(ferrie);
    setStartDateInputType(ferrie.startDate ? 'date' : 'text');
    setEndDateInputType(ferrie.endDate ? 'date' : 'text');
    setFormData({
      professionalId: ferrie.professionalId,
      professionalName: ferrie.professionalName,
      professionalAvatar: ferrie.professionalAvatar || null,
      professionalAvatarImage: ferrie.professionalAvatarImage || null,
      professionalProfile: ferrie.professionalProfile || '',
      substituteId: ferrie.substituteId || 0,
      substituteName: ferrie.substituteName || '',
      substituteAvatar: ferrie.substituteAvatar || null,
      substituteAvatarImage: ferrie.substituteAvatarImage || null,
      substituteProfile: ferrie.substituteProfile || '',
      startDate: ferrie.startDate,
      endDate: ferrie.endDate,
      description: ferrie.description,
      status: ferrie.status
    });
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingFerrie(null);
    setSelectorOpen(false);
    setSelectorTarget(null);
    setSelectedProfileFilters([]);
    setNameSearchFilter('');
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(part => {
      const lower = part.toLowerCase();
      return !['de', 'da', 'do', 'das', 'dos', 'e'].includes(lower);
    });
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return '';
  };

  const handleOpenSelector = (target: 'professional' | 'substitute') => {
    setSelectorTarget(target);
    setSelectedProfileFilters([]);
    setNameSearchFilter('');
    setSelectorOpen(true);
  };

  const handleSelectMember = (member: SquadMember) => {
    if (!selectorTarget) return;

    if (selectorTarget === 'professional') {
      setFormData((prev) => ({
        ...prev,
        professionalId: member.id || 0,
        professionalName: member.nome,
        professionalAvatar: member.avatar || null,
        professionalAvatarImage: member.avatarImage || null,
        professionalProfile: member.perfil || ''
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        substituteId: member.id || 0,
        substituteName: member.nome,
        substituteAvatar: member.avatar || null,
        substituteAvatarImage: member.avatarImage || null,
        substituteProfile: member.perfil || ''
      }));
    }

    setSelectorOpen(false);
    setSelectorTarget(null);
    setSelectedProfileFilters([]);
    setNameSearchFilter('');
  };


  const renderAvatarOnly = (
    member: { nome: string; perfil: string; avatar: string | null; avatarImage?: string | null } | null,
    targetLabel: string,
    onClick?: () => void,
    onRemove?: () => void
  ) => {
    const hasMember = !!member && !!member.nome;
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          width: '120px'
        }}
      >
        {hasMember ? (
          <Box 
            onClick={canWrite ? onClick : undefined}
            sx={{ 
              position: 'relative', 
              cursor: (onClick && canWrite) ? 'pointer' : 'default',
              mb: 1.5,
              width: 77,
              height: 77,
              transition: 'transform 0.2s ease',
              '&:hover': (onClick && canWrite) ? {
                transform: 'scale(1.05)',
              } : {}
            }}
          >
            {/* Photo circle */}
            <Box
              sx={{
                borderRadius: '50%',
                overflow: 'hidden',
                bgcolor: '#1e1e2e',
                position: 'absolute',
                width: 61,
                height: 61,
                top: 8,
                left: 8,
              }}
            >
              {member.avatarImage ? (
                <img src={member.avatarImage} alt={member.nome} className="w-full h-full object-cover object-top" />
              ) : member.avatar ? (
                <div className="w-full h-full flex items-center justify-center text-white" style={{ background: getAvatarById(member.avatar)?.gradient }}>
                  <div className="scale-150 flex items-center justify-center w-full h-full">
                    {getAvatarById(member.avatar)?.icon}
                  </div>
                </div>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-black"
                  style={{
                    background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)',
                    fontSize: 61 * 0.28,
                  }}
                >
                  {getInitials(member.nome) || <Users size={20} />}
                </div>
              )}
            </Box>
            <ArcRing size={77} />
            {(onRemove && canWrite) && (
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove();
                }}
                sx={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 20,
                  height: 20,
                  background: '#ef4444',
                  color: 'white',
                  border: '2px solid white',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  zIndex: 20,
                  '&:hover': {
                    background: '#dc2626'
                  }
                }}
                title="Remover"
              >
                <X size={10} weight="bold" />
              </IconButton>
            )}
          </Box>
        ) : (
          <Box
            onClick={canWrite ? onClick : undefined}
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '2px dashed #C8AFC0',
              background: '#FDF9F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (onClick && canWrite) ? 'pointer' : 'default',
              mb: 1.5,
              color: '#64183f',
              transition: 'all 0.2s ease',
              opacity: canWrite ? 1 : 0.6,
              '&:hover': (onClick && canWrite) ? {
                borderColor: '#64183f',
                background: '#FAF4EF',
                transform: 'scale(1.05)',
                boxShadow: '0 6px 14px rgba(100, 24, 63, 0.1)'
              } : {}
            }}
          >
            <Plus size={20} weight="bold" />
          </Box>
        )}

        <Typography
          sx={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: hasMember ? '#1f2937' : '#9ca3af',
            lineHeight: 1.25,
            mb: 0.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            height: '2rem',
            width: '100%'
          }}
        >
          {hasMember ? member.nome : 'Selecionar'}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.62rem',
            fontWeight: 700,
            color: '#64183f',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%',
            opacity: hasMember ? 1 : 0.5
          }}
        >
          {hasMember ? member.perfil : targetLabel}
        </Typography>
      </Box>
    );
  };




  const handleSave = async () => {
    if (!formData.professionalId || !formData.professionalName || !formData.startDate || !formData.endDate) {
      alert('Campos obrigatórios: Profissional Minsait, Data de Início e Data de Término.');
      return;
    }

    const payload = {
      resourceId: formData.professionalId,
      reserveResourceId: formData.substituteId || null,
      initialDate: formData.startDate,
      endDate: formData.endDate,
      comments: formData.description || ''
    };

    try {
      setIsSaving(true);
      const url = editingFerrie
        ? `/api/ferries/${editingFerrie.id}`
        : '/api/ferries';
      
      const method = editingFerrie ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro ao salvar férias');
      
      loadFerries();
      handleCloseModal();
      handleCloseDrawer();
      setToast({ message: 'Gravação efetuada com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Erro ao salvar férias:', error);
      setToast({ message: 'Erro ao salvar férias.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta féria?')) return;

    try {
      const response = await fetch(`/api/ferries/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar féria');
      loadFerries();
      handleCloseModal();
      handleCloseDrawer();
    } catch (error) {
      console.error('Erro ao deletar féria:', error);
      alert('Erro ao deletar féria');
    }
  };



  const getVacationDaysPreview = (): number | null => {
    if (!formData.startDate || !formData.endDate) return null;
    const startDate = new Date(`${formData.startDate}T00:00:00`);
    const endDate = new Date(`${formData.endDate}T00:00:00`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
    const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const parseIsoDateLocal = (value: string): Date => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const selectedMonthStart = new Date(currentYear, selectedMonth, 1);
  const selectedMonthEnd = new Date(currentYear, selectedMonth + 1, 0);
  const selectedMonthDays = selectedMonthEnd.getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === selectedMonth;
  const todayDay = today.getDate();
  const todayPct = isCurrentMonth ? ((todayDay - 0.5) / selectedMonthDays) * 100 : 0;

  const getBarColors = (seed: string): { bg: string; text: string; border: string } => {
    const palette = [
      { bg: '#0d9488', text: '#ffffff', border: '#0f766e' }, // Teal
      { bg: '#0284c7', text: '#ffffff', border: '#0369a1' }, // Blue
      { bg: '#10b981', text: '#ffffff', border: '#059669' }, // Emerald
      { bg: '#6d28d9', text: '#ffffff', border: '#7c3aed' }, // Purple
      { bg: '#d97706', text: '#ffffff', border: '#b45309' }, // Amber
      { bg: '#ea580c', text: '#ffffff', border: '#c2410c' }  // Orange
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  };

  const monthFerries = ferries.filter((ferrie) => {
    const start = parseIsoDateLocal(ferrie.startDate);
    const end = parseIsoDateLocal(ferrie.endDate);
    return start <= selectedMonthEnd && end >= selectedMonthStart;
  });

  const ganttRows = monthFerries.reduce<Array<{
    professionalId: number;
    professionalName: string;
    profile: string;
    avatar: string | null;
    avatarImage: string | null;
    bars: Array<{
      id: string;
      label: string;
      subtitle: string;
      substituteName: string;
      substituteAvatar: string | null;
      substituteAvatarImage: string | null;
      leftPct: number;
      widthPct: number;
      colors: { bg: string; text: string; border: string };
      startLabel: string;
      endLabel: string;
      isEdgeStart: boolean;
      isEdgeEnd: boolean;
      originalFerrie: Ferrie;
    }>;
  }>>((acc, ferrie) => {
    const existing = acc.find((row) => row.professionalId === ferrie.professionalId);
    const start = parseIsoDateLocal(ferrie.startDate);
    const end = parseIsoDateLocal(ferrie.endDate);

    const visibleStart = start < selectedMonthStart ? selectedMonthStart : start;
    const visibleEnd = end > selectedMonthEnd ? selectedMonthEnd : end;

    const dayStart = visibleStart.getDate();
    const dayEnd = visibleEnd.getDate();
    const leftPct = ((dayStart - 1) / selectedMonthDays) * 100;
    const widthPct = (Math.max(1, dayEnd - dayStart + 1) / selectedMonthDays) * 100;
    const member = squad.find((resource) => resource.id === ferrie.professionalId || resource.nome === ferrie.professionalName);
    const subMember = squad.find((resource) => resource.id === ferrie.substituteId || resource.nome === ferrie.substituteName);
    const barSeed = `${ferrie.id || ferrie.professionalId}-${ferrie.professionalName}-${ferrie.startDate}-${ferrie.endDate}`;
    const colors = getBarColors(barSeed);

    const bar = {
      id: `${ferrie.id || ferrie.professionalId}-${ferrie.startDate}-${ferrie.endDate}`,
      label: ferrie.description || 'Férias',
      subtitle: ferrie.substituteName ? `Substituto: ${ferrie.substituteName}` : 'Férias Programadas',
      substituteName: ferrie.substituteName || '',
      substituteAvatar: ferrie.substituteAvatar || null,
      substituteAvatarImage: subMember?.avatarImage || ferrie.substituteAvatarImage || null,
      leftPct,
      widthPct,
      colors,
      startLabel: new Date(`${ferrie.startDate}T00:00:00`).toLocaleDateString('pt-BR'),
      endLabel: new Date(`${ferrie.endDate}T00:00:00`).toLocaleDateString('pt-BR'),
      isEdgeStart: start < selectedMonthStart,
      isEdgeEnd: end > selectedMonthEnd,
      originalFerrie: ferrie
    };

    if (existing) {
      existing.bars.push(bar);
      return acc;
    }

    acc.push({
      professionalId: ferrie.professionalId,
      professionalName: ferrie.professionalName,
      profile: member?.perfil || ferrie.professionalProfile || 'Recurso',
      avatar: member?.avatar || ferrie.professionalAvatar || null,
      avatarImage: member?.avatarImage || ferrie.professionalAvatarImage || null,
      bars: [bar]
    });

    return acc;
  }, []).sort((a, b) => a.professionalName.localeCompare(b.professionalName, 'pt-BR'));

  const filteredGanttRows = mainProfileFilters.length > 0
    ? ganttRows.filter((row) => mainProfileFilters.includes(row.profile))
    : ganttRows;

  const getGanttInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter((part) => {
      const lower = part.toLowerCase();
      return !['de', 'da', 'do', 'das', 'dos', 'e'].includes(lower);
    });
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return '';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
        <Typography variant="h6" sx={{ color: '#64183f' }}>Carregando férias...</Typography>
      </Box>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in relative text-slate-800 bg-transparent overflow-hidden">

      {/* ── HEADER ── */}
      <div className={`px-8 border-b border-slate-200 bg-white flex justify-between items-center z-10 select-none transition-all duration-300 ${isHeaderCollapsed ? 'py-2' : 'py-5'}`}>
        <div>
          <h2 className={`font-extrabold text-[#64183f] transition-all duration-300 ${isHeaderCollapsed ? 'text-lg' : 'text-2xl'}`}>Gestão de Férias</h2>
          {!isHeaderCollapsed && (
            <p className="text-xs font-semibold text-slate-500 mt-1 transition-all duration-300">Planeje e acompanhe as férias dos profissionais da equipe.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#64183f] hover:border-[#64183f] hover:bg-pink-50 transition-all shrink-0"
            title={isHeaderCollapsed ? 'Expandir cabeçalho' : 'Contrair cabeçalho'}
          >
            {isHeaderCollapsed ? <CaretDown size={14} weight="bold" /> : <CaretUp size={14} weight="bold" />}
          </button>
        </div>
      </div>

      {/* ── CONTENT AREA (adaptive, no scroll) ── */}
      <div className="flex-1 overflow-hidden p-2 lg:p-3 bg-white/85 backdrop-blur-md">
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      width: '100%', 
      height: '100%', 
      background: 'transparent',
      p: 0,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1, position: 'relative' }}>
        <Box sx={{
          background: '#FAF4EF',
          border: '1px solid #E5D5C8',
          borderLeft: '6px solid #64183f',
          borderRadius: '16px',
          p: '8px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: '180px',
          height: '64px',
          boxShadow: '0 2px 8px rgba(100, 24, 63, 0.04)'
        }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#64183f', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            Férias Programadas
          </Typography>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#64183f', lineHeight: 1.1, mt: 0.2, fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            {monthFerries.length}
          </Typography>
        </Box>

        {/* Central Month/Year Selector */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          position: { xs: 'static', md: 'absolute' },
          left: { md: '50%' },
          transform: { md: 'translateX(-50%)' },
          zIndex: 2
        }}>
          <IconButton 
            onClick={handlePrevMonth}
            sx={{ 
              color: '#64183f', 
              background: '#FAF4EF',
              border: '1px solid #E5D5C8',
              width: 38,
              height: 38,
              boxShadow: '0 2px 6px rgba(100, 24, 63, 0.04)',
              '&:hover': { background: '#F2E6DC' }
            }}
          >
            <CaretLeft size={18} weight="bold" />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Calendar size={24} weight="bold" color="#64183f" />
            <Typography sx={{ 
              fontSize: '1.2rem', 
              fontWeight: 900, 
              color: '#64183f', 
              fontFamily: "'Outfit', 'Inter', sans-serif",
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              {monthNames[selectedMonth]}, {currentYear}
            </Typography>
          </Box>

          <IconButton 
            onClick={handleNextMonth}
            sx={{ 
              color: '#64183f', 
              background: '#FAF4EF',
              border: '1px solid #E5D5C8',
              width: 38,
              height: 38,
              boxShadow: '0 2px 6px rgba(100, 24, 63, 0.04)',
              '&:hover': { background: '#F2E6DC' }
            }}
          >
            <CaretRight size={18} weight="bold" />
          </IconButton>
        </Box>

        {canWrite && (
          <button
            onClick={() => handleOpenModal()}
            className="pl-5 pr-2 py-1.5 rounded-full text-white font-extrabold text-xs shadow-lg flex items-center justify-between select-none transition-all hover:scale-[1.02] active:scale-95 w-56"
            style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}
          >
            <div className="flex items-center space-x-2.5">
              <X size={14} className="rotate-45 text-white/70" weight="bold" />
              <span className="tracking-wide">Novas Férias</span>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-white/80 flex items-center justify-center bg-white/10 shadow-sm ml-2">
              <Plus size={12} weight="bold" />
            </div>
          </button>
        )}
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', gap: 3, position: 'relative', zIndex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left Sidebar: Active Vacations List */}
        <Paper
          sx={{
            width: '280px',
            borderRadius: '14px',
            border: '1px solid #E5D5C8',
            borderLeft: '6px solid #64183f',
            background: '#FAF4EF',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            shrink: 0,
            overflowY: 'auto'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5D5C8', pb: 1.5 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 900, color: '#64183f', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Meses de {currentYear}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <Select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                sx={{
                  fontFamily: 'Outfit',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#64183f',
                  borderRadius: '10px',
                  bgcolor: '#fff',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E5D5C8',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#64183f',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#64183f',
                  },
                  '.MuiSelect-select': {
                    py: '4px',
                    px: '8px'
                  }
                }}
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <MenuItem key={y} value={y} sx={{ fontFamily: 'Outfit', fontSize: '0.75rem', fontWeight: 700 }}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            {(() => {
              // Build month → { totalDays, professionals[] } map
              const monthMap = new Map<number, {
                totalDays: number;
                professionals: Array<{ name: string; avatar: string | null }>;
              }>();

              for (const f of ferries) {
                if (!f.startDate || !f.endDate) continue;
                const start = parseIsoDateLocal(f.startDate);
                const end = parseIsoDateLocal(f.endDate);

                // Iterate through each month this vacation spans
                const cur = new Date(start.getFullYear(), start.getMonth(), 1);
                while (cur <= end) {
                  const yr = cur.getFullYear();
                  const mo = cur.getMonth();
                  if (yr === currentYear) {
                    const monthStart = new Date(yr, mo, 1);
                    const monthEnd = new Date(yr, mo + 1, 0);
                    const visStart = start < monthStart ? monthStart : start;
                    const visEnd = end > monthEnd ? monthEnd : end;
                    const days = Math.floor((visEnd.getTime() - visStart.getTime()) / 86400000) + 1;
                    if (!monthMap.has(mo)) {
                      monthMap.set(mo, { totalDays: 0, professionals: [] });
                    }
                    const entry = monthMap.get(mo)!;
                    entry.totalDays += days;
                    if (!entry.professionals.find(p => p.name === f.professionalName)) {
                      entry.professionals.push({ name: f.professionalName, avatar: f.professionalAvatar || null });
                    }
                  }
                  cur.setMonth(cur.getMonth() + 1);
                }
              }

              const activeMonths = Array.from(monthMap.entries()).sort((a, b) => a[0] - b[0]);

              if (activeMonths.length === 0) {
                return (
                  <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                    Nenhuma férias no ano de {currentYear}.
                  </Typography>
                );
              }

              return activeMonths.map(([moIdx, data]) => {
                const isActive = selectedMonth === moIdx;
                return (
                  <Box
                    key={moIdx}
                    onClick={() => { setSelectedMonth(moIdx); }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.2,
                      px: 1.5,
                      py: 1.2,
                      borderRadius: '12px',
                      background: isActive
                        ? 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)'
                        : 'rgba(255, 255, 255, 0.7)',
                      border: isActive ? '1px solid #64183f' : '1px solid rgba(229, 213, 200, 0.6)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 4px 14px rgba(100, 24, 63, 0.25)' : 'none',
                      '&:hover': {
                        background: isActive
                          ? 'linear-gradient(135deg, #7a1e4e 0%, #232866 100%)'
                          : '#ffffff',
                        boxShadow: '0 4px 12px rgba(100, 24, 63, 0.10)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    {/* Month name + days */}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          fontFamily: 'Outfit',
                          color: isActive ? '#ffffff' : '#1E293B',
                          lineHeight: 1.2
                        }}
                      >
                        {monthNames[moIdx]}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          color: isActive ? 'rgba(255,255,255,0.75)' : '#94A3B8',
                          mt: 0.2
                        }}
                      >
                        {data.totalDays} {data.totalDays === 1 ? 'dia' : 'dias'}
                      </Typography>
                    </Box>

                    {/* Stacked avatars of professionals */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {data.professionals.slice(0, 3).map((pro, idx) => {
                        const avObj = pro.avatar ? getAvatarById(pro.avatar) : null;
                        const ini = pro.name.trim().split(/\s+/).slice(0, 2).map(p => p ? p[0] : '').join('').toUpperCase();
                        return (
                          <Tooltip key={pro.name} title={pro.name} arrow>
                            <Avatar
                              sx={{
                                width: 26,
                                height: 26,
                                fontSize: '0.55rem',
                                fontWeight: 800,
                                background: avObj?.gradient || 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)',
                                border: `2px solid ${isActive ? 'rgba(255,255,255,0.5)' : '#FAF4EF'}`,
                                ml: idx === 0 ? 0 : '-8px',
                                zIndex: 3 - idx,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                              }}
                            >
                              {avObj?.icon || ini}
                            </Avatar>
                          </Tooltip>
                        );
                      })}
                      {data.professionals.length > 3 && (
                        <Avatar
                          sx={{
                            width: 26,
                            height: 26,
                            fontSize: '0.5rem',
                            fontWeight: 800,
                            bgcolor: isActive ? 'rgba(255,255,255,0.2)' : '#E5D5C8',
                            color: isActive ? '#fff' : '#64183f',
                            border: `2px solid ${isActive ? 'rgba(255,255,255,0.4)' : '#FAF4EF'}`,
                            ml: '-8px',
                            zIndex: 0
                          }}
                        >
                          +{data.professionals.length - 3}
                        </Avatar>
                      )}
                    </Box>

                    {/* Active indicator dot */}
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: isActive ? 'rgba(255,255,255,0.8)' : '#22c55e',
                        flexShrink: 0,
                        boxShadow: isActive ? 'none' : '0 0 6px rgba(34, 197, 94, 0.5)'
                      }}
                    />
                  </Box>
                );
              });
            })()}
          </Box>
        </Paper>

        {/* Right Main Grid */}
        <Paper
          sx={{
            borderRadius: '14px',
            border: '1px solid #E5D5C8',
            borderLeft: '6px solid #64183f',
            background: '#FAF4EF',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            position: 'relative'
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: '182px 1fr', borderBottom: '1px solid #E2E8F0', background: '#FAF4EF' }}>
            <Box sx={{ px: 2, py: 1, borderRight: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                background: '#FAF4EF', 
                borderRadius: '20px', 
                p: '5px 15px',
                border: '1px solid #E5D5C8',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                 <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#64183f', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                  Profissionais
                </Typography>
              </Box>
            </Box>
            <Box ref={ganttHeaderRef} sx={{ overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${selectedMonthDays}, minmax(22px, 1fr))`, minWidth: `${selectedMonthDays * 22}px` }}>
              {Array.from({ length: selectedMonthDays }, (_, dayIdx) => {
                const currentDate = new Date(currentYear, selectedMonth, dayIdx + 1);
                const weekDay = currentDate.getDay();
                const isWeekend = weekDay === 0 || weekDay === 6;
                const weekdaysPt = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
                const weekdayLetter = weekdaysPt[weekDay];
                const monthLabel = monthNames[selectedMonth].substring(0, 3).toUpperCase();

                return (
                  <Box
                    key={dayIdx}
                    sx={{
                      py: 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderLeft: dayIdx === 0 ? 'none' : '1px solid #E2E8F0',
                      background: isWeekend ? '#f25f5c' : 'transparent',
                      color: isWeekend ? '#fff' : '#1f2937',
                      minWidth: 0
                    }}
                  >
                    <Typography sx={{ fontSize: '0.5rem', color: isWeekend ? 'rgba(255,255,255,0.85)' : '#94A3B8', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>
                      {monthLabel}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: isWeekend ? '#fff' : '#1E293B', fontWeight: 900, my: 0.2, lineHeight: 1 }}>
                      {dayIdx + 1}
                    </Typography>
                    <Typography sx={{ fontSize: '0.55rem', color: isWeekend ? 'rgba(255,255,255,0.85)' : '#94A3B8', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>
                      {weekdayLetter}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            </Box>{/* close header scroll wrapper */}
          </Box>

          <Box ref={ganttBodyRef} onScroll={handleGanttBodyScroll} sx={{ overflowY: 'auto', overflowX: 'auto', flex: 1, position: 'relative' }}>
            {filteredGanttRows.length === 0 ? (
              <Box sx={{ py: 8, px: 3, textAlign: 'center' }}>
                <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                  Nenhuma férias registrada para {monthNames[selectedMonth]} de {currentYear}.
                </Typography>
              </Box>
            ) : (
              filteredGanttRows.map((row) => {
                const rowHeight = row.bars.length * 30;
                const isSelected = selectedProfessionalId === row.professionalId;
                const avatarObj = row.avatar ? getAvatarById(row.avatar) : null;

                return (
                  <Box
                    key={row.professionalId}
                    onClick={() => setSelectedProfessionalId(isSelected ? null : row.professionalId)}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '182px 1fr',
                      borderBottom: isSelected ? '1px solid #64183f' : '1px solid #F1F5F9',
                      minHeight: `${rowHeight}px`,
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'rgba(100, 24, 63, 0.05)' : 'transparent',
                      boxShadow: isSelected ? 'inset 0 1px 0 rgba(100, 24, 63, 0.1)' : 'none',
                      '&:hover': {
                        bgcolor: isSelected ? 'rgba(100, 24, 63, 0.08)' : 'rgba(100, 24, 63, 0.02)'
                      }
                    }}
                  >
                    <Box sx={{ px: 2, py: 0.6, borderRight: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1, pl: 2 }}>
                      {/* Grip Dots/Drag Handle for Premium look */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', color: '#cbd5e1', cursor: 'grab', pr: 0.5 }}>
                        <Box sx={{ display: 'flex', gap: '3px' }}><Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'currentColor' }} /><Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'currentColor' }} /></Box>
                        <Box sx={{ display: 'flex', gap: '3px' }}><Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'currentColor' }} /><Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'currentColor' }} /></Box>
                        <Box sx={{ display: 'flex', gap: '3px' }}><Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'currentColor' }} /><Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'currentColor' }} /></Box>
                      </Box>

                      <Avatar
                        alt={row.professionalName}
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: '0.62rem',
                          background: row.avatarImage
                            ? 'transparent'
                            : avatarObj 
                              ? avatarObj.gradient 
                              : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)'
                        }}
                      >
                        {row.avatarImage ? (
                          <img 
                            src={row.avatarImage} 
                            alt={row.professionalName} 
                            className="w-full h-full object-cover object-top rounded-full"
                          />
                        ) : avatarObj ? (
                          avatarObj.icon 
                        ) : (
                          getGanttInitials(row.professionalName)
                        )}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.2 }}>
                        <Typography noWrap sx={{ fontWeight: 800, color: '#1E293B', fontSize: '0.62rem' }}>
                          {row.professionalName}
                        </Typography>
                        <Typography noWrap sx={{ color: '#64748B', display: 'block', fontSize: '0.6rem', fontWeight: 500 }}>
                          {row.profile}
                        </Typography>
                      </Box>
                    </Box>
 
                    <Box sx={{ position: 'relative', px: 0.5, py: 0.4 }}>
                      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${selectedMonthDays}, minmax(22px, 1fr))`, minWidth: `${selectedMonthDays * 22}px` }}>
                        {Array.from({ length: selectedMonthDays }, (_, dayIdx) => {
                          const currentDate = new Date(currentYear, selectedMonth, dayIdx + 1);
                          const weekDay = currentDate.getDay();
                          const isWeekend = weekDay === 0 || weekDay === 6;
 
                          return (
                            <Box
                              key={dayIdx}
                              sx={{
                                borderLeft: dayIdx === 0 ? 'none' : '1px solid #F8FAFC',
                                background: isWeekend ? 'rgba(242, 95, 92, 0.08)' : 'transparent'
                              }}
                            />
                          );
                        })}
                      </Box>
 
                      {row.bars.map((bar, index) => {
                        const subAvatarObj = bar.substituteAvatar ? getAvatarById(bar.substituteAvatar) : null;
                        const start = parseIsoDateLocal(bar.originalFerrie.startDate);
                        const end = parseIsoDateLocal(bar.originalFerrie.endDate);
                        end.setHours(23, 59, 59, 999);
                        const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
                        
                        let barBg = bar.colors.bg;
                        let barOpacity = 1;
 
                        if (isCurrentMonth) {
                          if (start > todayMid) {
                            barOpacity = 0.5;
                          } else if (end > todayMid) {
                            const totalMs = end.getTime() - start.getTime();
                            const pastMs = todayMid.getTime() - start.getTime();
                            if (totalMs > 0 && pastMs > 0) {
                              const splitPct = (pastMs / totalMs) * 100;
                              const solidColor = bar.colors.bg;
                              const transparentColor = solidColor.startsWith('#') ? `${solidColor}80` : solidColor;
                              barBg = `linear-gradient(90deg, ${solidColor} 0%, ${solidColor} ${splitPct}%, ${transparentColor} ${splitPct}%, ${transparentColor} 100%)`;
                            }
                          }
                        }
                        return (
                          <Tooltip
                            key={bar.id}
                            arrow
                            title={`${bar.label} | ${bar.startLabel} até ${bar.endLabel}`}
                          >
                            <Box
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDrawer(bar.originalFerrie);
                              }}
                              sx={{
                                position: 'absolute',
                                left: `${bar.leftPct}%`,
                                width: `${bar.widthPct}%`,
                                top: `${1 + index * 30}px`,
                                height: '28px',
                                borderRadius: '8px',
                                border: `1px solid ${bar.colors.border}`,
                                background: barBg,
                                opacity: barOpacity,
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 1,
                                px: 0.8,
                                color: bar.colors.text,
                                overflow: 'hidden',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                '&:hover': {
                                  transform: 'scale(1.01)',
                                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                                },
                                '&::before': bar.isEdgeStart ? {
                                  content: '""',
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: '6px',
                                  background: 'rgba(0,0,0,0.05)'
                                } : undefined,
                                '&::after': bar.isEdgeEnd ? {
                                  content: '""',
                                  position: 'absolute',
                                  right: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: '6px',
                                  background: 'rgba(0,0,0,0.05)'
                                } : undefined
                              }}
                            >
                              <Avatar
                                alt={bar.substituteName || 'Sem Substituto'}
                                sx={{
                                  width: 18,
                                  height: 18,
                                  fontSize: '0.52rem',
                                  fontWeight: 800,
                                  border: `1px solid ${bar.colors.border}`,
                                  background: bar.substituteAvatarImage
                                    ? 'transparent'
                                    : subAvatarObj 
                                      ? subAvatarObj.gradient 
                                      : (bar.substituteName ? 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' : 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'),
                                  flexShrink: 0
                                }}
                              >
                                {bar.substituteAvatarImage ? (
                                  <img 
                                    src={bar.substituteAvatarImage} 
                                    alt={bar.substituteName} 
                                    className="w-full h-full object-cover object-top rounded-full"
                                  />
                                ) : subAvatarObj ? (
                                  subAvatarObj.icon 
                                ) : bar.substituteName ? (
                                  getGanttInitials(bar.substituteName) 
                                ) : (
                                  '?'
                                )}
                              </Avatar>
                              <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography sx={{ fontSize: '0.60rem', fontWeight: 800, color: 'inherit', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'left' }}>
                                  {bar.substituteName ? `Sub: ${bar.substituteName}` : 'Sem Substituto'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.50rem', fontWeight: 500, color: 'inherit', opacity: 0.85, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'left' }}>
                                  {bar.label}
                                </Typography>
                              </Box>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })
            )}
            {isCurrentMonth && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `calc(182px + ${todayPct}% - 182px * ${todayPct / 100})`,
                  width: '2px',
                  bgcolor: '#ff764d',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
              />
            )}
          </Box>
        </Paper>
      </Box>

      {/* Right Drawer for Editing Ferrie */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 420 },
              background: '#FFF',
              borderLeft: '2px solid #E5D5C8',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }
          }
        }}
      >
        <Box sx={{ p: 3, borderBottom: '2px solid #E5D5C8', background: '#FAF4EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#64183f' }}>
            Editar Férias
          </Typography>
          <IconButton onClick={handleCloseDrawer} size="small" sx={{ color: '#64183f' }}>
            <X size={20} weight="bold" />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, background: '#FFF' }}>
          {/* Professional and Substitute Side-by-Side */}
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            {/* Professional Information */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ alignSelf: 'flex-start', color: '#64183f', fontSize: '0.68rem', fontWeight: 800, mb: 1, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Profissional Minsait
              </Typography>
              {renderAvatarOnly({ 
                nome: formData.professionalName, 
                perfil: formData.professionalProfile || 'Profissional', 
                avatar: formData.professionalAvatar,
                avatarImage: formData.professionalAvatarImage
              }, 'Profissional')}
            </Box>

            {/* Substitute Selection */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ alignSelf: 'flex-start', color: '#64183f', fontSize: '0.68rem', fontWeight: 800, mb: 1, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Substituto
              </Typography>
              {renderAvatarOnly(
                formData.substituteName ? {
                  nome: formData.substituteName,
                  perfil: formData.substituteProfile || 'Substituto',
                  avatar: formData.substituteAvatar,
                  avatarImage: formData.substituteAvatarImage
                } : null,
                'Substituto',
                () => handleOpenSelector('substitute'),
                formData.substituteName ? () => setFormData((prev) => ({
                  ...prev,
                  substituteId: 0,
                  substituteName: '',
                  substituteAvatar: null,
                  substituteAvatarImage: null,
                  substituteProfile: ''
                })) : undefined
              )}
            </Box>
          </Box>

          {/* Dates and Days in same line */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 1.2, alignItems: 'center', mt: 3.5 }}>
            <TextField
              fullWidth
              label="Data de Início"
              type={startDateInputType}
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              onFocus={() => setStartDateInputType('date')}
              onBlur={() => {
                if (!formData.startDate) setStartDateInputType('text');
              }}
              size="small"
              disabled={!canWrite}
              sx={{ '& input': { fontSize: '0.72rem' } }}
            />
            <TextField
              fullWidth
              label="Data de Término"
              type={endDateInputType}
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              onFocus={() => setEndDateInputType('date')}
              onBlur={() => {
                if (!formData.endDate) setEndDateInputType('text');
              }}
              size="small"
              disabled={!canWrite}
              sx={{ '& input': { fontSize: '0.72rem' } }}
            />
            <Box
              sx={{
                width: '90px',
                height: '40px',
                borderRadius: '8px',
                border: '1px solid #D4C4B8',
                background: '#FAF4EF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Typography sx={{ fontSize: '0.56rem', fontWeight: 800, color: '#6B5A66', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1 }}>
                Dias
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, color: '#64183f', lineHeight: 1.1, mt: 0.2 }}>
                {getVacationDaysPreview() ?? '-'}
              </Typography>
            </Box>
          </Box>

          {/* Observation */}
          <TextField
            fullWidth
            label="Observações"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={2}
            size="small"
            disabled={!canWrite}
          />
        </Box>

        <Box sx={{ p: 3, borderTop: '2px solid #E5D5C8', background: '#FAF4EF', display: 'flex', gap: 2 }}>
          {editingFerrie?.id && (
            <Button
              disabled={!canWrite}
              onClick={() => handleDelete(editingFerrie.id!)}
              variant="outlined"
              color="error"
              sx={{ flex: 1, borderColor: '#ef4444', color: '#ef4444', fontWeight: 'bold' }}
            >
              Remover
            </Button>
          )}
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isSaving || !canWrite}
            sx={{ flex: 2, background: 'linear-gradient(135deg, #64183f 0%, #8B2456 100%)', color: 'white', fontWeight: 'bold' }}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </Box>
      </Drawer>

      {/* Modal for Create/Edit Ferrie */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#64183f', background: '#FAF4EF', borderBottom: '2px solid #E5D5C8' }}>
          {editingFerrie ? 'Editar Férias' : 'Nova Férias'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ mt: 1, mb: 3, display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {/* Professional Information */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ alignSelf: 'flex-start', color: '#64183f', fontSize: '0.68rem', fontWeight: 800, mb: 1, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Profissional Minsait
              </Typography>
              {renderAvatarOnly({ 
                nome: formData.professionalName, 
                perfil: formData.professionalProfile || 'Profissional', 
                avatar: formData.professionalAvatar,
                avatarImage: formData.professionalAvatarImage
              }, 'Profissional', () => handleOpenSelector('professional'))}
            </Box>

            {/* Substitute Selection */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ alignSelf: 'flex-start', color: '#64183f', fontSize: '0.68rem', fontWeight: 800, mb: 1, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Substituto
              </Typography>
              {renderAvatarOnly(
                formData.substituteName ? {
                  nome: formData.substituteName,
                  perfil: formData.substituteProfile || 'Substituto',
                  avatar: formData.substituteAvatar,
                  avatarImage: formData.substituteAvatarImage
                } : null,
                'Substituto',
                () => handleOpenSelector('substitute'),
                formData.substituteName ? () => setFormData((prev) => ({
                  ...prev,
                  substituteId: 0,
                  substituteName: '',
                  substituteAvatar: null,
                  substituteAvatarImage: null,
                  substituteProfile: ''
                })) : undefined
              )}
            </Box>
          </Box>          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' }, gap: 1.2, alignItems: 'center' }}>
            <TextField
              fullWidth
              label="Data de Início"
              type={startDateInputType}
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              onFocus={() => setStartDateInputType('date')}
              onBlur={() => {
                if (!formData.startDate) setStartDateInputType('text');
              }}
              margin="dense"
              disabled={!canWrite}
              sx={{ '& input': { fontSize: '0.75rem' } }}
            />
            <TextField
              fullWidth
              label="Data de Término"
              type={endDateInputType}
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              onFocus={() => setEndDateInputType('date')}
              onBlur={() => {
                if (!formData.endDate) setEndDateInputType('text');
              }}
              margin="dense"
              disabled={!canWrite}
              sx={{ '& input': { fontSize: '0.75rem' } }}
            />
            <Box
              sx={{
                minWidth: 132,
                height: '56px',
                borderRadius: '8px',
                border: '1px solid #D4C4B8',
                background: '#FAF4EF',
                px: 1.5,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                mt: '4px'
              }}
            >
              <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: '#6B5A66', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Dias de férias
              </Typography>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: '#64183f', lineHeight: 1, textAlign: 'center', width: '100%' }}>
                {getVacationDaysPreview() ?? '-'}
              </Typography>
            </Box>
          </Box>
          <TextField
            fullWidth
            label="Observações"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="dense"
            multiline
            rows={1}
            disabled={!canWrite}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, background: '#FAF4EF', borderTop: '2px solid #E5D5C8' }}>
          <Button onClick={handleCloseModal} sx={{ color: '#666' }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            disabled={isSaving || !canWrite}
            sx={{ background: 'linear-gradient(135deg, #64183f 0%, #8B2456 100%)', color: 'white' }}
          >
            {isSaving ? 'Gravando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={selectorOpen} onClose={() => setSelectorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#64183f', background: '#FAF4EF', borderBottom: '2px solid #E5D5C8' }}>
          Selecionar {selectorTarget === 'substitute' ? 'Substituto' : 'Profissional Minsait'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5, pb: 2.5 }}>
          <Typography sx={{ color: '#6b7280', fontSize: '0.78rem', mb: 1.5 }}>
            Selecione o perfil para filtrar e clique no card para confirmar.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Pesquisar por Nome"
              size="small"
              value={nameSearchFilter}
              onChange={(e) => setNameSearchFilter(e.target.value)}
              placeholder="Digite o nome..."
              fullWidth
              variant="outlined"
            />
            <FormControl fullWidth size="small">
              <InputLabel id="profile-filter-multi-label">Filtro de Perfil (Múltipla Seleção)</InputLabel>
              <Select
                labelId="profile-filter-multi-label"
                multiple
                value={selectedProfileFilters}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedProfileFilters(typeof value === 'string' ? value.split(',') : value);
                }}
                input={<OutlinedInput label="Filtro de Perfil (Múltipla Seleção)" />}
                renderValue={(selected) => {
                  if (selected.length === 0) return 'Todos os perfis';
                  return selected.join(', ');
                }}
              >
                {profileOptions.map((profile) => (
                  <MenuItem key={profile} value={profile}>
                    <Checkbox checked={selectedProfileFilters.includes(profile)} size="small" />
                    <ListItemText primary={profile} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {filteredMinsaitProfessionals.length === 0 ? (
            <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9ca3af' }}>
              <Users size={42} />
              <Typography sx={{ mt: 1, fontWeight: 700, fontSize: '0.85rem' }}>
                Nenhum profissional encontrado para o filtro selecionado.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 2.5, maxHeight: '55vh', overflowY: 'auto', p: 1, pr: 0.5 }}>
              {filteredMinsaitProfessionals.map((member) => {
                const avatarObj = member.avatar ? getAvatarById(member.avatar) : null;
                const initials = getInitials(member.nome);
                const ringSize = 77;
                const photoSize = 61;

                return (
                  <Box
                    key={member.nome}
                    onClick={() => handleSelectMember(member)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                      p: 1.5,
                      borderRadius: '16px',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        background: 'rgba(100, 24, 63, 0.04)',
                      }
                    }}
                  >
                    {/* Avatar with arc ring */}
                    <Box sx={{ position: 'relative', width: ringSize, height: ringSize }}>
                      {/* Photo circle */}
                      <Box
                        sx={{
                          borderRadius: '50%',
                          overflow: 'hidden',
                          bgcolor: '#1e1e2e',
                          position: 'absolute',
                          width: photoSize,
                          height: photoSize,
                          top: (ringSize - photoSize) / 2,
                          left: (ringSize - photoSize) / 2,
                        }}
                      >
                        {member.avatarImage ? (
                          <img src={member.avatarImage} alt={member.nome} className="w-full h-full object-cover object-top" />
                        ) : avatarObj ? (
                          <div className="w-full h-full flex items-center justify-center text-white" style={{ background: avatarObj.gradient }}>
                            <div className="scale-150 flex items-center justify-center w-full h-full">
                              {avatarObj.icon}
                            </div>
                          </div>
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white font-black"
                            style={{
                              background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)',
                              fontSize: photoSize * 0.28,
                            }}
                          >
                            {initials || <Users size={20} />}
                          </div>
                        )}
                      </Box>
                      <ArcRing size={ringSize} />
                    </Box>

                    {/* Name + Profile */}
                    <Box sx={{ mt: 1, textCenter: 'center', px: 0.5, maxWidth: ringSize + 25, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 900, color: '#1f2937', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {member.nome}
                      </Typography>
                      <Typography sx={{ fontSize: '0.52rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', mt: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.perfil}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, background: '#FAF4EF', borderTop: '2px solid #E5D5C8' }}>
          <Button onClick={() => setSelectorOpen(false)} sx={{ color: '#666' }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={toast?.type || 'success'}
          onClose={() => setToast(null)}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
      </div>{/* close CONTENT AREA */}
    </div>
  );
};
