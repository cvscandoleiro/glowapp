import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Tooltip, IconButton } from '@mui/material';
import { Calendar, CaretLeft, CaretRight, X, CaretDown, CaretUp } from '@phosphor-icons/react';
import { usePlanningStore } from '../store/PlanningStore';

interface Holiday {
  date: string;
  description: string;
  localityType: 'national' | 'regional';
  localityIds: number[];
}

interface Locality {
  id: number;
  state: string;
  city: string;
}

interface HolidayModal {
  open: boolean;
  mode: 'create' | 'edit';
  date: string;
  description: string;
  localityType: 'national' | 'regional';
  localityIds: number[];
}

export const CalendarView: React.FC = () => {
  const { canWrite } = usePlanningStore();
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalState, setModalState] = useState<HolidayModal>({
    open: false,
    mode: 'create',
    date: '',
    description: '',
    localityType: 'national',
    localityIds: []
  });
  const holidayListRef = useRef<HTMLDivElement>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const allLocalityIds = localities.map((locality) => locality.id);
  const allLocalitiesSelected = localities.length > 0 && modalState.localityIds.length === localities.length;
  const localityById = new Map(localities.map((locality) => [locality.id, locality]));

  const loadHolidays = () => {
    fetch('/api/holidays')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHolidays(data);
        }
      })
      .catch((err) => console.error('Erro ao buscar feriados:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  useEffect(() => {
    fetch('/api/localities')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLocalities(data);
        }
      })
      .catch((err) => console.error('Erro ao buscar localidades:', err));
  }, []);

  // Auto-scroll para próximo feriado
  useEffect(() => {
    if (!loading && holidays.length > 0 && holidayListRef.current) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureHolidays = holidays.filter(h => {
        if (!h.date) return false;
        const parts = h.date.split('-');
        if (parts.length !== 3) return false;
        const hDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return hDate >= today;
      });
      
      if (futureHolidays.length > 0) {
        const firstFutureIdx = holidays.findIndex(h => h.date === futureHolidays[0].date);
        if (firstFutureIdx !== -1) {
          const container = holidayListRef.current;
          const itemHeight = 60;
          const scrollPosition = firstFutureIdx * itemHeight;
          container.scrollTo({ top: scrollPosition, behavior: 'smooth' });
        }
      }
    }
  }, [loading, holidays, currentYear]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const calendarCardHeight = 168;

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const holidaysMap = new Map<string, string>();
  holidays.forEach(h => {
    if (!h.date) return;
    const parts = h.date.split('-');
    if (parts.length === 3 && Number(parts[0]) === currentYear) {
      const key = `${parts[1]}-${parts[2]}`;
      holidaysMap.set(key, h.description);
    }
  });

  const buildMonthCalendar = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const calendar: Array<{ day: number | null; holidayName?: string }> = [];

    for (let i = 0; i < firstDay; i++) {
      calendar.push({ day: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const holidayName = holidaysMap.get(key);
      calendar.push({ day, holidayName });
    }

    return calendar;
  };

  const holidayListThisYear = holidays.filter(h => {
    if (!h.date) return false;
    const parts = h.date.split('-');
    return parts.length === 3 && Number(parts[0]) === currentYear;
  });

  const handleDayDoubleClick = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const key = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingHoliday = holidaysMap.get(key);
    const existingHolidayDetails = holidays.find((holiday) => holiday.date === dateStr);
    
    if (!canWrite) {
      return;
    }
    
    setModalState({
      open: true,
      mode: existingHoliday ? 'edit' : 'create',
      date: dateStr,
      description: existingHoliday || '',
      localityType: existingHolidayDetails?.localityType || 'national',
      localityIds: existingHolidayDetails?.localityIds || []
    });
  };

  const handleModalClose = () => {
    setModalState({ open: false, mode: 'create', date: '', description: '', localityType: 'national', localityIds: [] });
  };

  const handleModalSave = async () => {
    if (!modalState.date || !modalState.description.trim()) {
      alert('Data e descrição são obrigatórios');
      return;
    }

    if (modalState.localityType === 'regional' && modalState.localityIds.length === 0) {
      alert('Selecione ao menos uma localidade para feriado regional');
      return;
    }

    const payload = {
      date: modalState.date,
      description: modalState.description,
      localityType: modalState.localityType,
      localityIds: modalState.localityType === 'regional' ? modalState.localityIds : []
    };

    try {
      if (modalState.mode === 'create') {
        const response = await fetch('/api/holidays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          let message = 'Erro ao criar feriado';
          try {
            const payload = await response.json();
            if (payload?.error) message = payload.error;
          } catch {}
          throw new Error(message);
        }
      } else {
        const response = await fetch(`/api/holidays/${modalState.date}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          let message = 'Erro ao atualizar feriado';
          try {
            const payload = await response.json();
            if (payload?.error) message = payload.error;
          } catch {}
          throw new Error(message);
        }
      }
      loadHolidays();
      handleModalClose();
    } catch (error) {
      console.error('Erro ao salvar feriado:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar feriado');
    }
  };

  const handleModalDelete = async () => {
    if (!confirm('Tem certeza que deseja remover este feriado?')) return;

    try {
      const response = await fetch(`/api/holidays/${modalState.date}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar feriado');
      loadHolidays();
      handleModalClose();
    } catch (error) {
      console.error('Erro ao deletar feriado:', error);
      alert('Erro ao deletar feriado');
    }
  };

  const handleSelectAllLocalities = () => {
    setModalState((prev) => ({
      ...prev,
      localityIds: allLocalityIds
    }));
  };

  const handleClearLocalities = () => {
    setModalState((prev) => ({
      ...prev,
      localityIds: []
    }));
  };

  const handleToggleLocality = (localityId: number) => {
    setModalState((prev) => {
      const exists = prev.localityIds.includes(localityId);
      if (exists) {
        return {
          ...prev,
          localityIds: prev.localityIds.filter((id) => id !== localityId)
        };
      }

      return {
        ...prev,
        localityIds: [...prev.localityIds, localityId]
      };
    });
  };

  const getRegionalCityLabel = (localityIds: number[]) => {
    const cityNames = localityIds
      .map((id) => localityById.get(id)?.city)
      .filter((city): city is string => Boolean(city));

    if (cityNames.length === 0) {
      return 'Regional';
    }

    return `Regional (${cityNames.join(', ')})`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
        <Typography variant="h6" sx={{ color: '#64183f' }}>Carregando calendário...</Typography>
      </Box>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in relative text-slate-800 bg-transparent overflow-hidden">

      {/* ── HEADER ── */}
      <div className={`px-8 border-b border-slate-200 bg-white flex justify-between items-center z-10 select-none transition-all duration-300 ${isHeaderCollapsed ? 'py-2' : 'py-5'}`}>
        <div>
          <h2 className={`font-extrabold text-[#64183f] transition-all duration-300 ${isHeaderCollapsed ? 'text-lg' : 'text-2xl'}`}>Calendário de Feriados</h2>
          {!isHeaderCollapsed && (
            <p className="text-xs font-semibold text-slate-500 mt-1 transition-all duration-300">Gerencie os feriados nacionais e regionais cadastrados no sistema.</p>
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
      <div className="flex-1 overflow-hidden p-3 lg:p-4 bg-white/85 backdrop-blur-md">
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      width: '100%', 
      height: '100%', 
      flexWrap: { xs: 'wrap', md: 'nowrap' },
      background: 'transparent',
      position: 'relative'
    }}>
      
      {/* Left side: Premium Stats Panel */}
      <Paper 
        sx={{ 
          px: 3,
          pb: 3,
          pt: 1.5,
          borderRadius: '20px', 
          background: 'transparent', 
          boxShadow: 'none',
          color: '#333',
          minWidth: { xs: '100%', md: '280px' },
          maxWidth: { xs: '100%', md: '320px' },
          display: 'flex',
          flexDirection: 'column',
          alignSelf: 'flex-start',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Year Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <IconButton 
            onClick={() => setCurrentYear(prev => prev - 1)} 
            sx={{ 
              color: '#64183f', 
              background: '#FAF4EF',
              border: '1px solid #E5D5C8',
              '&:hover': { 
                background: '#F5EDE5',
                transform: 'scale(1.1)',
                boxShadow: '0 2px 8px rgba(100, 24, 63, 0.15)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <CaretLeft size={24} weight="bold" />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar size={28} weight="duotone" color="#64183f" />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: '900', 
                fontFamily: "'Plus Jakarta Sans', 'Outfit', 'Inter', sans-serif",
                color: '#64183f',
                letterSpacing: '2px'
              }}
            >
              {currentYear}
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setCurrentYear(prev => prev + 1)} 
            sx={{ 
              color: '#64183f', 
              background: '#FAF4EF',
              border: '1px solid #E5D5C8',
              '&:hover': { 
                background: '#F5EDE5',
                transform: 'scale(1.1)',
                boxShadow: '0 2px 8px rgba(100, 24, 63, 0.15)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <CaretRight size={24} weight="bold" />
          </IconButton>
        </Box>

        {/* Stats Box */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2.5 }}>
          <Box sx={{ 
            p: 2, 
            background: '#FAF4EF', 
            borderRadius: '16px', 
            borderLeft: '4px solid #64183f',
            boxShadow: '0 2px 8px rgba(100, 24, 63, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Typography variant="caption" sx={{ color: '#64183f', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1.5px', fontSize: '0.7rem' }}>
              Feriados Ativos
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: '900', 
              mt: 0.5, 
              fontFamily: "'Plus Jakarta Sans', 'Outfit', 'Inter', sans-serif", 
              color: '#64183f',
              fontSize: '2.5rem'
            }}>
              {holidayListThisYear.length}
            </Typography>
          </Box>
        </Box>

        {/* Holidays List */}
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#64183f', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
          Lista de Feriados ({currentYear}):
        </Typography>
        <Box 
          ref={holidayListRef} 
          sx={{ 
            maxHeight: 'calc(100vh - 300px)', 
            overflowY: 'auto', 
            pr: 1, 
            '&::-webkit-scrollbar': { width: '6px' }, 
            '&::-webkit-scrollbar-track': {
              background: '#E5D5C8',
              borderRadius: '10px'
            },
            '&::-webkit-scrollbar-thumb': { 
              background: '#64183f', 
              borderRadius: '10px',
              '&:hover': {
                background: '#8B2456'
              }
            } 
          }}
        >
          {holidayListThisYear.length === 0 ? (
            <Typography sx={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic', textAlign: 'center', py: 3 }}>
              Nenhum feriado cadastrado para {currentYear}
            </Typography>
          ) : (
            holidayListThisYear.map((h, index) => {
              if (!h.date) return null;
              const parts = h.date.split('-');
              if (parts.length !== 3) return null;
              const dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;

              const hDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isPast = hDate < today;
              const isWeekend = hDate.getDay() === 0 || hDate.getDay() === 6;

              return (
                <Box 
                  key={index} 
                  sx={{ 
                    py: 1, 
                    borderBottom: '1px solid #E5D5C8', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    textDecoration: isPast ? 'line-through' : 'none', 
                    opacity: isPast ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: '#F5EDE5',
                      borderLeft: '3px solid #64183f',
                      pl: 1,
                      transform: 'translateX(5px)'
                    }
                  }}
                >
                  <Typography sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    color: isPast ? '#ef4444' : (isWeekend ? '#dc2626' : '#64183f'), 
                    textDecoration: 'inherit', 
                    fontFamily: "'Plus Jakarta Sans', 'Outfit', 'Inter', sans-serif",
                    background: isWeekend ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                    borderRadius: '6px',
                    px: isWeekend ? 0.7 : 0,
                    py: isWeekend ? 0.15 : 0,
                    alignSelf: 'flex-start'
                  }}>
                    {dateStr}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: isPast ? '#ef4444' : '#555', textDecoration: 'inherit' }}>
                    {h.description}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: '0.6rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase',
                      color: h.localityType === 'regional' ? '#7c3aed' : '#0f766e'
                    }}
                  >
                    {h.localityType === 'regional' ? getRegionalCityLabel(h.localityIds) : 'Nacional'}
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>
      </Paper>

      {/* Right side: Calendar grid */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 210px)' }}>
        
        {/* 12 Months Grid - 3 linhas de 4 */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: 1.5,
            alignContent: 'start'
          }}
        >
          {monthNames.map((monthName, mIdx) => {
            const monthCalendar = buildMonthCalendar(currentYear, mIdx);

            return (
              <Paper 
                key={mIdx}
                sx={{ 
                  p: 1.2, 
                  borderRadius: '16px', 
                  border: '1px solid #E5D5C8', 
                  borderLeft: '3px solid #64183f', 
                  background: '#FAF4EF', 
                  boxShadow: '0 2px 8px rgba(100, 24, 63, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: `${calendarCardHeight}px`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 4px 16px rgba(100, 24, 63, 0.15)',
                    border: '1px solid #C8B8A8'
                  }
                }}
              >
                {/* Month name */}
                <Typography sx={{ 
                  fontWeight: '800', 
                  color: '#64183f', 
                  mb: 1, 
                  fontSize: '0.7rem', 
                  borderBottom: '1px solid #E5D5C8', 
                  pb: 0.5, 
                  textTransform: 'uppercase', 
                  letterSpacing: 0.5,
                  fontFamily: "'Plus Jakarta Sans', 'Outfit', 'Inter', sans-serif"
                }}>
                  {monthName}
                </Typography>

                {/* Weekday labels */}
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    gap: 0.3, 
                    mb: 0.5, 
                    textAlign: 'center' 
                  }}
                >
                  {weekDays.map((dayLabel, index) => (
                    <Typography 
                      key={index}
                      sx={{ 
                        fontSize: '0.55rem', 
                        fontWeight: 'bold', 
                        color: index === 0 || index === 6 ? '#64183f' : '#666',
                        fontFamily: "'Plus Jakarta Sans', 'Outfit', 'Inter', sans-serif"
                      }}
                    >
                      {dayLabel}
                    </Typography>
                  ))}
                </Box>

                {/* Days grid */}
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    gap: 0.3, 
                    textAlign: 'center' 
                  }}
                >
                  {monthCalendar.map((item, idx) => {
                    const isHoliday = !!item.holidayName;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isToday = item.day !== null
                      && currentYear === today.getFullYear()
                      && mIdx === today.getMonth()
                      && item.day === today.getDate();
                    const isPastHoliday = item.day !== null && (() => {
                      const cellDate = new Date(currentYear, mIdx, item.day!);
                      return cellDate < today;
                    })();

                    return (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.day !== null ? (
                          <Tooltip title={isHoliday ? item.holidayName! : ''} disableHoverListener={!isHoliday} arrow>
                            <Box
                              onDoubleClick={() => handleDayDoubleClick(currentYear, mIdx, item.day!)}
                              sx={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.6rem',
                                  cursor: 'pointer',
                                fontWeight: isHoliday || isToday ? 'bold' : 'normal',
                                color: isToday
                                  ? '#fff'
                                  : (isHoliday 
                                  ? (isPastHoliday ? '#ef4444' : '#fff') 
                                  : '#333'),
                                background: isToday
                                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 55%, #1d4ed8 100%)'
                                  : (isHoliday 
                                  ? (isPastHoliday 
                                      ? 'rgba(239, 68, 68, 0.2)' 
                                      : '#64183f')
                                  : 'transparent'),
                                border: isToday ? '1px solid #1d4ed8' : (isHoliday ? '1px solid #64183f' : 'none'),
                                textDecoration: isPastHoliday ? 'line-through' : 'none',
                                boxShadow: isToday
                                  ? '0 2px 8px rgba(37, 99, 235, 0.5)'
                                  : (isHoliday && !isPastHoliday ? '0 2px 6px rgba(100, 24, 63, 0.3)' : 'none'),
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  background: isToday
                                    ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 55%, #2563eb 100%)'
                                    : (isHoliday 
                                    ? (isPastHoliday 
                                        ? 'rgba(239, 68, 68, 0.3)' 
                                        : '#8B2456')
                                    : '#E5D5C8'),
                                  transform: 'scale(1.15)',
                                  boxShadow: isToday
                                    ? '0 3px 10px rgba(37, 99, 235, 0.6)'
                                    : (isHoliday && !isPastHoliday ? '0 2px 8px rgba(100, 24, 63, 0.4)' : '0 1px 4px rgba(0, 0, 0, 0.1)'),
                                  color: isToday || isHoliday ? '#fff' : '#333',
                                  fontWeight: 'bold'
                                }
                              }}
                            >
                              {item.day}
                            </Box>
                          </Tooltip>
                        ) : (
                          <Box sx={{ width: '20px', height: '20px' }} />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Box>

      {/* Modal CRUD Feriado - Padrão Professional */}
      {modalState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in">
          <div className={`glass-resource-card p-8 rounded-[2.5rem] relative ${modalState.localityType === 'regional' ? 'w-[760px]' : 'w-[420px]'}`}>
            <button 
              onClick={handleModalClose}
              className="absolute top-5 right-5 text-slate-500 hover:text-[#64183f] transition-colors"
            >
              <X size={22} weight="bold" />
            </button>
            
            <div className="flex items-center space-x-4 mb-6">
              {/* Ícone Feriado */}
              <div 
                className="w-14 h-14 rounded-full p-[2px] flex items-center justify-center shadow-md shrink-0"
                style={{ 
                  background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)" 
                }}
              >
                <div className="w-full h-full rounded-full bg-white p-[1px]">
                  <div 
                    className="w-full h-full rounded-full flex items-center justify-center text-lg font-black text-white overflow-hidden"
                    style={{ 
                      background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)" 
                    }}
                  >
                    <Calendar size={20} weight="duotone" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-800">
                  {modalState.mode === 'create' ? 'Novo Feriado' : 'Editar Feriado'}
                </h3>
                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-0.5">Calendário</p>
              </div>
            </div>
            
            <div className={`${modalState.localityType === 'regional' ? 'grid grid-cols-[minmax(0,1fr)_280px] gap-5 items-start' : 'block'}`}>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-[#64183f] uppercase tracking-wider mb-2">Data</label>
                  <input 
                    type="date" 
                    value={modalState.date}
                    disabled
                    className="w-full bg-white/40 backdrop-blur-sm border border-white/40 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400 cursor-not-allowed opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#64183f] uppercase tracking-wider mb-2">Descrição do Feriado</label>
                  <input 
                    type="text" 
                    value={modalState.description}
                    onChange={(e) => setModalState({ ...modalState, description: e.target.value })}
                    disabled={!canWrite}
                    className="w-full bg-white/40 backdrop-blur-sm border border-white/40 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="ex. Natal, Ano Novo, Independência"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#64183f] uppercase tracking-wider mb-2">Abrangência</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={!canWrite}
                      onClick={() => setModalState((prev) => ({ ...prev, localityType: 'national' }))}
                      className={`rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${
                        modalState.localityType === 'national'
                          ? 'border-[#64183f] bg-[#64183f] text-white shadow-lg shadow-[#64183f]/20'
                          : 'border-white/40 bg-white/40 text-slate-600 hover:bg-white/50'
                      }`}
                    >
                      Nacional
                    </button>
                    <button
                      type="button"
                      disabled={!canWrite}
                      onClick={() => setModalState((prev) => ({ ...prev, localityType: 'regional' }))}
                      className={`rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${
                        modalState.localityType === 'regional'
                          ? 'border-[#64183f] bg-[#64183f] text-white shadow-lg shadow-[#64183f]/20'
                          : 'border-white/40 bg-white/40 text-slate-600 hover:bg-white/50'
                      }`}
                    >
                      Regional
                    </button>
                  </div>
                </div>
              </div>

              {modalState.localityType === 'regional' && (
                <div className="rounded-2xl border border-white/40 bg-white/20 p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="block text-[10px] font-black text-[#64183f] uppercase tracking-wider">Localidades</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!canWrite}
                        onClick={handleSelectAllLocalities}
                        className="rounded-lg bg-white/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64183f] transition-all hover:bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        disabled={!canWrite}
                        onClick={handleClearLocalities}
                        className="rounded-lg bg-white/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-all hover:bg-white/60 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        allLocalitiesSelected
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white/50 text-slate-500'
                      }`}
                    >
                      {allLocalitiesSelected
                        ? `Todas selecionadas (${modalState.localityIds.length})`
                        : `${modalState.localityIds.length} selecionadas`}
                    </span>
                  </div>
                  <div className="h-44 w-full overflow-y-auto rounded-xl border border-white/40 bg-white/40 px-2 py-2">
                    <label className="mb-1 flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/40">
                      <span className="text-xs font-black uppercase tracking-wider text-[#64183f]">TODAS AS LOCALIDADES</span>
                      <input
                        type="checkbox"
                        checked={allLocalitiesSelected}
                        disabled={!canWrite}
                        onChange={(event) => {
                          if (event.target.checked) {
                            handleSelectAllLocalities();
                          } else {
                            handleClearLocalities();
                          }
                        }}
                        className="h-4 w-4 accent-[#64183f] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </label>
                    {localities.map((locality) => {
                      const checked = modalState.localityIds.includes(locality.id);

                      return (
                        <label
                          key={locality.id}
                          className="mb-1 flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/40"
                        >
                          <span className="text-xs font-semibold text-slate-700">{`${locality.state} - ${locality.city}`}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canWrite}
                            onChange={() => handleToggleLocality(locality.id)}
                            className="h-4 w-4 accent-[#64183f] disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Marque as localidades desejadas ou use todas as localidades.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              {modalState.mode === 'edit' && (
                <button 
                  onClick={handleModalDelete}
                  disabled={!canWrite}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-red-500/20 flex-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  Remover
                </button>
              )}
              <button 
                onClick={handleModalClose}
                className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 bg-white/40 backdrop-blur-sm border border-white/40 hover:bg-white/50 transition-all flex-1"
              >
                Cancelar
              </button>
              <button 
                onClick={handleModalSave}
                disabled={!canWrite}
                className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#64183f] to-[#1a1f44] hover:from-[#8B2456] hover:to-[#2d2952] transition-all shadow-lg hover:shadow-[#64183f]/20 flex-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {modalState.mode === 'create' ? 'Criar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
      </div>{/* close CONTENT AREA */}
    </div>
  );
};
