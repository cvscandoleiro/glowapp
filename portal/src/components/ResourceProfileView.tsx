import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import { getAvatarById } from '../utils/avatarRepository';
import { IconButton, Drawer, Divider, Box, Typography, Tooltip, Avatar } from '@mui/material';
import { 
  ArrowLeft,
  FolderSimple,
  ThumbsUp,
  ThumbsDown,
  CalendarBlank,
  Briefcase,
  X,
  Envelope,
  Phone,
  MapPin,
  IdentificationBadge,
  Hash,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react';

const formatKanbanDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
};
const formatTelephone = (val?: any) => {
  if (!val) return 'Não informado';
  const str = String(val);
  const d = str.replace(/\D/g, '');
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return str;
};


export const ResourceProfileView: React.FC<{ isSidebarExpanded?: boolean }> = ({ isSidebarExpanded = false }) => {
  const { projects, viewingSquadMember, setViewingSquadMember, holidays, squad } = usePlanningStore();
  const [memberTasks, setMemberTasks] = useState<any[]>([]);
  const [memberFerries, setMemberFerries] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const member = viewingSquadMember;

  // Filter projects to only include active ones (PENDENTE = 1, EXECUCAO = 2)
  const activeProjects = useMemo(() => {
    return projects.filter(p => p.statusId === 1 || p.statusId === 2);
  }, [projects]);

  const getKanbanStatus = (phase: string | null | undefined): 'Waiting' | 'In Progress' | 'Completed' => {
    if (!phase) return 'Waiting';
    const p = phase.trim().toLowerCase();
    if (p === 'on going' || p === 'in progress' || p === 'doing') return 'In Progress';
    if (p === 'completed' || p === 'done') return 'Completed';
    return 'Waiting';
  };

  useEffect(() => {
    const fetchMemberBacklogs = async () => {
      if (!member) return;
      setLoadingTasks(true);
      const allTasks: any[] = [];
      await Promise.all(
        projects.map(async (proj) => {
          try {
            const res = await fetch(`/api/projects/${proj.id}/backlog`);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                data.forEach((item: any) => {
                  // Filter by member id
                  if (item.resourceId && String(item.resourceId) === String(member.id)) {
                    allTasks.push({
                      id: String(item.id),
                      idJira: item.taskSequence || '',
                      task: item.taskName || '',
                      description: item.taskDescription || '',
                      dtInicio: item.initialDate,
                      dtFim: item.endDate,
                      pontos: item.taskPoints || 0,
                      nome: member.nome,
                      avatar: member.avatar,
                      perfil: member.perfil,
                      projectName: proj.name,
                      taskTechnology: item.taskTechnology || '',
                      status: item.kanbanPhase || 'Waiting',
                      kanbanStatus: getKanbanStatus(item.kanbanPhase),
                      taskPhase: item.taskPhase || ''
                    });
                  }
                });
              }
            }
          } catch (err) {
            console.error('Failed to fetch backlog for project:', proj.id, err);
          }
        })
      );
      allTasks.sort((a, b) => (a.dtInicio || '').localeCompare(b.dtInicio || ''));
      setMemberTasks(allTasks);
      setLoadingTasks(false);
    };

    const fetchMemberFerries = async () => {
      if (!member) return;
      try {
        const res = await fetch(`/api/ferries?year=${new Date().getFullYear()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const filtered = data.filter((f: any) => String(f.professionalId) === String(member.id));
            setMemberFerries(filtered);
          }
        }
      } catch (err) {
        console.error('Failed to fetch ferries:', err);
      }
    };

    if (member) {
      if (projects.length > 0) {
        fetchMemberBacklogs();
      } else {
        setLoadingTasks(false);
      }
      fetchMemberFerries();
    }
  }, [projects.length, member?.id]);

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  if (!member) return null;

  const initials = member.nome 
    ? member.nome.trim().split(/\s+/).slice(0, 2).map(p => p ? p[0] : '').join('').toUpperCase() 
    : '';

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = (task: any) => {
    if (task.kanbanStatus === 'Completed') return false;
    return task.dtFim && task.dtFim < todayStr;
  };

  // Calculations
  const totalPoints = memberTasks.reduce((acc, t) => acc + (t.pontos || 0), 0);
  const completedPoints = memberTasks.filter(t => t.kanbanStatus === 'Completed').reduce((acc, t) => acc + (t.pontos || 0), 0);
  const pendingPoints = totalPoints - completedPoints;
  const overduePoints = memberTasks.filter(isOverdue).reduce((acc, t) => acc + (t.pontos || 0), 0);

  const totalVacationDays = useMemo(() => {
    return memberFerries.reduce((total, f) => {
      if (!f.startDate || !f.endDate) return total;
      const s = new Date(f.startDate + 'T00:00:00');
      const e = new Date(f.endDate + 'T00:00:00');
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return total + diffDays;
    }, 0);
  }, [memberFerries]);

  return (
    <div className="h-full flex flex-col animate-fade-in relative text-slate-800 bg-transparent overflow-hidden">
      
      {/* ── HEADER ── */}
      <div className={`px-8 border-b border-slate-200 bg-white flex justify-between items-center z-10 select-none transition-all duration-300 ${isHeaderCollapsed ? 'py-2' : 'py-5'}`}>
        <div className="flex items-center gap-4">
          <IconButton 
            onClick={() => setViewingSquadMember(null)}
            sx={{
              color: '#64183f',
              border: '1.5px solid #64183f',
              padding: '6px',
              '&:hover': {
                backgroundColor: 'rgba(100, 24, 63, 0.08)'
              }
            }}
            title="Voltar para Profissionais"
          >
            <ArrowLeft size={18} weight="bold" />
          </IconButton>
          <div>
            <h2 className={`font-extrabold text-[#64183f] transition-all duration-300 ${isHeaderCollapsed ? 'text-lg' : 'text-2xl'}`}>Perfil Detalhado</h2>
            {!isHeaderCollapsed && (
              <p className="text-xs font-semibold text-slate-500 mt-1 transition-all duration-300">Colaborador Minsait / Visão de Atividades</p>
            )}
          </div>
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

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-white/85 backdrop-blur-md pb-12">
        
        {/* 1. Top Wide Profile Header Card */}
      <div className="bg-[#EAE5EA]/70 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-[2rem] py-3 px-6 shadow-sm flex flex-col gap-2 mb-6 w-full h-fit relative">
        
        {/* Top section: Avatar + Name + Perfil + contact inline */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div 
            className="rounded-full p-0.5 flex items-center justify-center shadow-md bg-slate-100 shrink-0"
            style={{ width: '72px', height: '72px' }}
          >
            <div 
              className="w-full h-full rounded-full flex items-center justify-center text-2xl font-black text-white overflow-hidden"
              style={{ 
                background: member.avatarImage
                  ? 'transparent'
                  : member.avatar 
                    ? getAvatarById(member.avatar)?.gradient 
                    : "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" 
              }}
            >
              {member.avatarImage ? (
                <img 
                  src={member.avatarImage} 
                  alt={member.nome} 
                  className="w-full h-full object-cover object-top rounded-full" 
                />
              ) : member.avatar ? (
                getAvatarById(member.avatar)?.icon
              ) : (
                initials
              )}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h3 className="text-xl font-black text-slate-800 leading-none mb-1">{member.nome}</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">{member.perfil}</span>
            {/* Contact row with icons */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Tooltip title={member.email || 'Não informado'} arrow>
                <a
                  href={`mailto:${member.email || ''}`}
                  className="flex items-center gap-1 text-slate-500 hover:text-[#64183f] transition-colors min-w-0"
                >
                  <Envelope size={13} weight="bold" className="shrink-0 text-[#64183f]/70" />
                  <span className="text-[11px] font-semibold truncate max-w-[160px]">{member.email || 'Não informado'}</span>
                </a>
              </Tooltip>
              <Tooltip title={formatTelephone(member.telephoneContact || undefined)} arrow>
                <span className="flex items-center gap-1 text-slate-500 min-w-0">
                  <Phone size={13} weight="bold" className="shrink-0 text-[#64183f]/70" />
                  <span className="text-[11px] font-semibold">{formatTelephone(member.telephoneContact || undefined)}</span>
                </span>
              </Tooltip>
              <Tooltip title={`${member.city || ''}${member.city && member.state ? ' - ' : ''}${member.state || ''}`} arrow>
                <span className="flex items-center gap-1 text-slate-500 min-w-0">
                  <MapPin size={13} weight="bold" className="shrink-0 text-[#64183f]/70" />
                  <span className="text-[11px] font-semibold truncate max-w-[120px]">{member.city ? `${member.city} - ` : ''}{member.state || 'Não informado'}</span>
                </span>
              </Tooltip>
              <Tooltip title={`Matrícula: ${member.matricula || 'Não informada'}`} arrow>
                <span className="flex items-center gap-1 text-slate-500 min-w-0">
                  <IdentificationBadge size={13} weight="bold" className="shrink-0 text-[#64183f]/70" />
                  <span className="text-[11px] font-semibold">{member.matricula || 'Não informada'}</span>
                </span>
              </Tooltip>
              <Tooltip title={`ID SAP (Vivo): ${member.clientId || 'Não informado'}`} arrow>
                <span className="flex items-center gap-1 text-slate-500 min-w-0">
                  <Hash size={13} weight="bold" className="shrink-0 text-[#64183f]/70" />
                  <span className="text-[11px] font-semibold">{member.clientId || 'Não informado'}</span>
                </span>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Status Badge positioned absolutely at top right */}
        <div className="absolute top-3 right-5 shrink-0">
          <div 
            className="flex items-center pl-3 pr-1 py-0.5 rounded-full shadow-sm text-white font-bold select-none text-[8.5px]"
            style={{
              background: member.status === 'INATIVO' 
                ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' 
                : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)',
              width: '100px'
            }}
          >
            <span className="tracking-wide uppercase flex-1 text-center pl-1.5">{member.status || 'ATIVO'}</span>
            
            {/* White circle with status icon (Like/Dislike) */}
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
              {member.status === 'INATIVO' ? (
                <ThumbsDown 
                  size={11} 
                  weight="fill" 
                  className="text-red-500"
                />
              ) : (
                <ThumbsUp 
                  size={11} 
                  weight="fill" 
                  className="text-emerald-500"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Metrics Row (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
        {/* Card 1: Projetos Ativos */}
        <div className="bg-gradient-to-r from-[#64183f]/15 to-[#1a1f44]/15 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="text-[#64183f] shrink-0 p-0.5">
            <Briefcase size={22} weight="bold" />
          </div>
          <div className="w-[1.5px] h-[32px] bg-[#64183f]/40 mx-1" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#64183f]/80">Projetos Ativos</span>
            <span className="text-2xl font-black text-slate-800 leading-none mt-1">{activeProjects.length}</span>
          </div>
        </div>

        {/* Card 2: Pontuação em Execução/A Vencer */}
        <div className="bg-gradient-to-r from-[#64183f]/15 to-[#1a1f44]/15 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="text-[#64183f] shrink-0 p-0.5">
            <FolderSimple size={22} weight="bold" />
          </div>
          <div className="w-[1.5px] h-[32px] bg-[#64183f]/40 mx-1" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#64183f]/80">Pontos em Execução</span>
            <span className="text-2xl font-black text-slate-800 leading-none mt-1">{pendingPoints}</span>
            <span className="text-[9px] font-semibold text-slate-500 mt-1.5 block leading-tight">
              Pontos em Atraso: {overduePoints} pt
            </span>
          </div>
        </div>

        {/* Card 3: Férias Programadas */}
        <div className="bg-gradient-to-r from-[#64183f]/15 to-[#1a1f44]/15 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="text-[#64183f] shrink-0 p-0.5">
            <CalendarBlank size={22} weight="bold" />
          </div>
          <div className="w-[1.5px] h-[32px] bg-[#64183f]/40 mx-1" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#64183f]/80">Férias Programadas</span>
            <span className="text-2xl font-black text-slate-800 leading-none mt-1">{memberFerries.length}</span>
            <span className="text-[9px] font-semibold text-slate-500 mt-1.5 block leading-tight">
              Dias Programados: {totalVacationDays} dias
            </span>
          </div>
        </div>
      </div>

      {/* 3. Third Row: Tabbed Content & Search/Table */}
      <ProfileTabbedContent 
        member={member} 
        memberTasks={memberTasks} 
        memberFerries={memberFerries}
        loadingTasks={loadingTasks}
        completedPoints={completedPoints}
        totalPoints={totalPoints}
        holidays={holidays}
        isSidebarExpanded={isSidebarExpanded}
        squad={squad}
      />
      </div>
    </div>
  );
 };

 // Sub-component for the tabbed views to keep things clean
 interface ProfileTabbedContentProps {
  member: any;
  memberTasks: any[];
  memberFerries: any[];
  loadingTasks: boolean;
  completedPoints: number;
  totalPoints: number;
  holidays: any[];
  isSidebarExpanded?: boolean;
  squad: any[];
 }

const ProfileTabbedContent: React.FC<ProfileTabbedContentProps> = ({
  member: _member,
  memberTasks,
  memberFerries,
  loadingTasks,
  completedPoints,
  totalPoints,
  holidays,
  isSidebarExpanded = false,
  squad
}) => {
  const [activeTab, setActiveTab] = useState<'planning' | 'kanban' | 'ferias'>('planning');
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  // Gantt scroll sync: header follows body scroll
  const ganttHeaderRef = useRef<HTMLDivElement>(null);
  const ganttBodyRef = useRef<HTMLDivElement>(null);
  const handleGanttScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (ganttHeaderRef.current) {
      ganttHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const getVacationDaysInMonth = (mIdx: number) => {
    const monthStart = new Date(currentYear, mIdx, 1);
    const monthEnd = new Date(currentYear, mIdx + 1, 0);

    return memberFerries.reduce((total, f) => {
      if (!f.startDate || !f.endDate) return total;
      const s = new Date(f.startDate + 'T00:00:00');
      const e = new Date(f.endDate + 'T00:00:00');

      if (s <= monthEnd && e >= monthStart) {
        const overlapStart = s < monthStart ? monthStart : s;
        const overlapEnd = e > monthEnd ? monthEnd : e;
        const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return total + diffDays;
      }
      return total;
    }, 0);
  };

  const isDateToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const isDateHoliday = (d: Date) => {
    if (!holidays || !Array.isArray(holidays)) return false;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return holidays.some(h => h.date === dateStr);
  };

  const isVacationDay = (d: Date) => {
    return memberFerries.some(f => {
      if (!f.startDate || !f.endDate) return false;
      const s = new Date(f.startDate + 'T12:00:00');
      const e = new Date(f.endDate + 'T12:00:00');
      
      const cellDate = new Date(d);
      cellDate.setHours(12, 0, 0, 0);
      s.setHours(12, 0, 0, 0);
      e.setHours(12, 0, 0, 0);
      
      return cellDate >= s && cellDate <= e;
    });
  };

  const renderCalendarGrid = (year: number, month: number) => {
    const monthCalendar: Array<{ day: number | null }> = [];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      monthCalendar.push({ day: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      monthCalendar.push({ day });
    }

    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
      <div 
        className="p-5 rounded-3xl border border-[#E5D5C8] border-l-[4px] border-l-[#64183f] bg-[#FAF4EF] shadow-sm flex flex-col flex-1 h-full select-none transition-all hover:translate-y-[-2px] hover:shadow-md justify-between"
      >
        {/* Month name */}
        <h5 className="font-extrabold text-[#64183f] mb-3 text-xs border-b border-[#E5D5C8] pb-1.5 text-center uppercase tracking-widest font-Outfit">
          {getMonthNamePt(month)} {year}
        </h5>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
          {weekDays.map((dayLabel, index) => (
            <span 
              key={index}
              className={`text-[9px] md:text-[10px] font-bold ${
                index === 0 || index === 6 ? 'text-[#64183f]' : 'text-slate-500'
              }`}
            >
              {dayLabel}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center flex-1 items-center align-middle">
          {monthCalendar.map((item, idx) => {
            if (item.day === null) {
              return <div key={idx} className="w-full aspect-square max-w-[34px] mx-auto" />;
            }

            const cellDate = new Date(year, month, item.day);
            const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
            const isVac = isVacationDay(cellDate);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isToday = currentYear === today.getFullYear()
              && month === today.getMonth()
              && item.day === today.getDate();

            const isVacPassed = isVac && cellDate < today;

            const holiday = holidays.find(h => h.date === `${year}-${String(month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`);

            return (
              <div key={idx} className="flex items-center justify-center w-full">
                <Tooltip 
                  title={
                    isVac 
                      ? (isVacPassed ? "Férias Tiradas" : "Férias Programadas")
                      : holiday 
                        ? holiday.description 
                        : ""
                  }
                  disableHoverListener={!isVac && !holiday}
                  arrow
                >
                  <div 
                    className="w-full aspect-square max-w-[34px] rounded-full flex items-center justify-center text-[10px] md:text-xs transition-all font-bold cursor-pointer relative"
                    style={{
                      color: isToday
                        ? '#fff'
                        : isVac
                          ? '#fff'
                          : holiday
                            ? '#fff'
                            : isWeekend
                              ? '#64183f'
                              : '#333',
                      background: isToday
                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 55%, #1d4ed8 100%)'
                        : isVac
                          ? (isVacPassed 
                              ? 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)' 
                              : 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)')
                          : holiday
                            ? '#64183f'
                            : 'transparent',
                      border: isToday 
                        ? '1px solid #1d4ed8' 
                        : isVac 
                          ? (isVacPassed ? '1px solid #94a3b8' : '1px solid #f97316')
                          : holiday 
                            ? '1px solid #64183f' 
                            : 'none',
                      boxShadow: isToday
                        ? '0 2px 6px rgba(37, 99, 235, 0.4)'
                        : isVac
                          ? (isVacPassed 
                              ? '0 2px 6px rgba(148, 163, 184, 0.4)' 
                              : '0 2px 6px rgba(249, 115, 22, 0.4)')
                          : holiday
                            ? '0 2px 6px rgba(100, 24, 63, 0.4)'
                            : 'none'
                    }}
                  >
                    {item.day}
                    {isVacPassed && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10b981] border border-white flex items-center justify-center shadow-sm z-10">
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Tab 3 Vacation Month selection state
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // Date and coordinate helper values
  const colWidth = 48;
  const getDayLetter = (dayIndex: number) => {
    const letters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    return letters[dayIndex];
  };

  const getMonthNamePt = (mIdx: number) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[mIdx];
  };

  // Check if a month has scheduled vacations
  const monthHasVacation = (mIdx: number) => {
    const start = new Date(currentYear, mIdx, 1);
    const end = new Date(currentYear, mIdx + 1, 0);
    return memberFerries.some(f => {
      if (!f.startDate || !f.endDate) return false;
      const s = new Date(f.startDate + 'T12:00:00');
      const e = new Date(f.endDate + 'T12:00:00');
      return s <= end && e >= start;
    });
  };

  // Auto-select the first month of the year that has planned vacations
  useEffect(() => {
    if (memberFerries.length > 0) {
      for (let mIdx = 0; mIdx < 12; mIdx++) {
        if (monthHasVacation(mIdx)) {
          setSelectedMonth(mIdx);
          break;
        }
      }
    }
  }, [memberFerries]);


  // --- PLANNING GANTT PREPARATIONS ---
  const planningTimelineRange = useMemo(() => {
    if (memberTasks.length === 0) {
      const start = new Date();
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 2);
      return { start, end, days: 60 };
    }
    const dates = memberTasks.flatMap(t => [
      t.dtInicio ? new Date(t.dtInicio + 'T12:00:00') : new Date(),
      t.dtFim ? new Date(t.dtFim + 'T12:00:00') : new Date()
    ]).map(d => d.getTime());

    const minTime = Math.min(...dates);
    const maxTime = Math.max(...dates);

    // Pad by 3 days
    const start = new Date(minTime - 3 * 24 * 60 * 60 * 1000);
    const end = new Date(maxTime + 3 * 24 * 60 * 60 * 1000);
    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return { start, end, days };
  }, [memberTasks]);

  const planningDaysScale = useMemo(() => {
    const scale = [];
    const curr = new Date(planningTimelineRange.start);
    for (let i = 0; i < planningTimelineRange.days; i++) {
      const d = new Date(curr);
      scale.push({
        date: d,
        dayNum: d.getDate(),
        monthLabel: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
        dayLetter: getDayLetter(d.getDay()),
        isWeekend: d.getDay() === 0 || d.getDay() === 6
      });
      curr.setDate(curr.getDate() + 1);
    }
    return scale;
  }, [planningTimelineRange]);

  const getPlanningX = (dateStr: string) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr + 'T12:00:00');
    const diff = d.getTime() - planningTimelineRange.start.getTime();
    const days = diff / (24 * 60 * 60 * 1000);
    return days * colWidth;
  };

  const getPlanningWidth = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return colWidth;
    const s = new Date(startStr + 'T12:00:00');
    const e = new Date(endStr + 'T12:00:00');
    const diff = e.getTime() - s.getTime();
    const days = Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)) + 1);
    return days * colWidth;
  };

  // Group tasks by project
  const tasksByProject = useMemo(() => {
    const groups: { [projName: string]: any[] } = {};
    memberTasks.forEach(t => {
      const proj = t.projectName || 'Sem Projeto';
      if (!groups[proj]) groups[proj] = [];
      groups[proj].push(t);
    });
    return Object.entries(groups).map(([projectName, tasks]) => ({
      projectName,
      tasks: tasks.sort((a, b) => (a.dtInicio || '').localeCompare(b.dtInicio || ''))
    }));
  }, [memberTasks]);

  // Today marker offset in Planning Gantt
  const planningTodayOffset = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    if (today < planningTimelineRange.start || today > planningTimelineRange.end) return null;
    const diff = today.getTime() - planningTimelineRange.start.getTime();
    return (diff / (24 * 60 * 60 * 1000)) * colWidth;
  }, [planningTimelineRange]);



  return (
    <div className="bg-[#EAE5EA]/70 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-[2rem] p-6 shadow-sm flex flex-col flex-1 w-full">
      
      {/* 1. Styled Tab Headers matching fullscreen-gantt style */}
      <div className="flex items-center gap-1 border-b border-slate-300/60 pb-px mb-6">
        <button
          onClick={() => setActiveTab('planning')}
          className={`px-5 py-2.5 font-black text-sm rounded-t-xl transition-all border flex items-center gap-2 z-10 -mb-px ${
            activeTab === 'planning'
              ? 'border-slate-300/80 border-b-[#EAE5EA] bg-[#EAE5EA] text-[#64183f]'
              : 'border-transparent bg-[#EAE5EA]/40 text-slate-500 hover:bg-[#EAE5EA]/80 hover:text-slate-700'
          }`}
        >
          <CalendarBlank size={16} weight="bold" />
          Tarefas Planejadas
        </button>
        <button
          onClick={() => setActiveTab('kanban')}
          className={`px-5 py-2.5 font-black text-sm rounded-t-xl transition-all border flex items-center gap-2 z-10 -mb-px ${
            activeTab === 'kanban'
              ? 'border-slate-300/80 border-b-[#EAE5EA] bg-[#EAE5EA] text-[#64183f]'
              : 'border-transparent bg-[#EAE5EA]/40 text-slate-500 hover:bg-[#EAE5EA]/80 hover:text-slate-700'
          }`}
        >
          <Briefcase size={16} weight="bold" />
          Kanban
        </button>
        <button
          onClick={() => setActiveTab('ferias')}
          className={`px-5 py-2.5 font-black text-sm rounded-t-xl transition-all border flex items-center gap-2 z-10 -mb-px ${
            activeTab === 'ferias'
              ? 'border-slate-300/80 border-b-[#EAE5EA] bg-[#EAE5EA] text-[#64183f]'
              : 'border-transparent bg-[#EAE5EA]/40 text-slate-500 hover:bg-[#EAE5EA]/80 hover:text-slate-700'
          }`}
        >
          <CalendarBlank size={16} weight="fill" />
          Férias
        </button>
      </div>

      {/* 2. Tab Contents */}
      {loadingTasks ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
          <span className="w-8 h-8 border-3 border-[#64183f] border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-bold uppercase tracking-wider">Carregando dados do perfil...</span>
        </div>
      ) : (
        <div className="flex-1 w-full">
          
          {/* TAB 1: PLANNING GANTT */}
          {activeTab === 'planning' && (
            <div className="w-full flex flex-col">
              {memberTasks.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <span className="text-sm font-bold">Nenhuma atividade vinculada a este profissional.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {/* Legend referencing color x kanban phase */}
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200/50 rounded-xl p-2 px-3 w-fit select-none">
                    <span className="text-slate-400 uppercase tracking-wider mr-1">Fases Kanban:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#e25c1d] border border-white shadow-sm" />
                      <span>Waiting</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#1d4ed8] border border-white shadow-sm" />
                      <span>In Progress</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#10b981] border border-white shadow-sm" />
                      <span>Completed</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 flex flex-col">

                    {/* Gantt Date Header — fixed, no scrollbar, synced via ref */}
                    <div
                      ref={ganttHeaderRef}
                      className="overflow-x-hidden shrink-0"
                    >
                      <div className="flex shrink-0 border-b border-slate-200 relative bg-slate-100/80" style={{ width: `calc(200px + ${planningDaysScale.length * colWidth}px)` }}>
                        <div className="w-[200px] border-r border-slate-200 shrink-0 bg-slate-100 p-4 font-black text-xs text-[#64183f] uppercase tracking-wider flex items-center">
                          Projeto / Atividade
                        </div>
                        <div className="flex">
                          {planningDaysScale.map((col, idx) => {
                            const today = isDateToday(col.date);
                            const holiday = isDateHoliday(col.date);
                            const highlight = col.isWeekend || today || holiday;
                            return (
                              <div 
                                key={idx} 
                                className={`flex flex-col items-center justify-center py-2 border-r border-slate-200/60 font-bold select-none shrink-0 ${
                                  highlight ? 'bg-[#f25c5c] text-white' : 'bg-white text-slate-700'
                                }`}
                                style={{ width: colWidth }}
                              >
                                <span className={`text-[7.5px] font-extrabold uppercase ${highlight ? 'text-white/80' : 'text-slate-400'}`}>
                                  {col.monthLabel}
                                </span>
                                <span className={`text-[11px] leading-none mt-0.5 ${highlight ? 'text-white' : 'text-slate-700'}`}>{col.dayNum}</span>
                                <span className={`text-[8.5px] leading-none mt-1 font-extrabold ${
                                  highlight ? 'text-white/95' : col.isWeekend ? 'text-red-500' : 'text-slate-400'
                                }`}>
                                  {col.dayLetter}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Gantt Body — scrollbar appears at top (between header and rows) via rotateX trick */}
                    <div
                      ref={ganttBodyRef}
                      className="overflow-x-auto relative flex flex-col w-full custom-scrollbar"
                      style={{ transform: 'rotateX(180deg)' }}
                      onScroll={handleGanttScroll}
                    >
                      <div className="relative flex flex-col w-full" style={{ transform: 'rotateX(180deg)', width: `calc(200px + ${planningDaysScale.length * colWidth}px)` }}>
                        {/* Vertical Grid Lines */}
                        <div className="absolute inset-y-0 left-[200px] right-0 pointer-events-none flex">
                          {planningDaysScale.map((col, idx) => {
                            const holiday = isDateHoliday(col.date);
                            const isSpecial = col.isWeekend || holiday;
                            return (
                              <div 
                                key={idx} 
                                className={`border-r border-slate-200/30 h-full shrink-0 ${isSpecial ? 'bg-[#f25c5c]/50' : ''}`} 
                                style={{ width: colWidth }} 
                              />
                            );
                          })}
                        </div>

                        {/* Today indicator line */}
                        {planningTodayOffset !== null && (
                          <div 
                            className="absolute inset-y-0 w-0.5 bg-orange-500 z-10 pointer-events-none"
                            style={{ left: `calc(200px + ${planningTodayOffset}px)` }}
                          />
                        )}

                        {/* Rows mapped by project */}
                        {tasksByProject.map((projGroup, pIdx) => (
                          <div key={pIdx} className="flex flex-col border-b border-slate-100 last:border-0">
                            {/* Project header row */}
                            <div className="flex items-center bg-slate-100/40 py-2 border-b border-slate-100">
                              <div className="w-[200px] pl-4 shrink-0 font-black text-xs text-slate-700 flex items-center gap-1.5 truncate">
                                <FolderSimple size={13} className="text-[#64183f]" />
                                <span className="truncate">{projGroup.projectName}</span>
                              </div>
                            </div>

                            {/* Task rows */}
                            {projGroup.tasks.map((task, tIdx) => {
                              const left = getPlanningX(task.dtInicio);
                              const width = getPlanningWidth(task.dtInicio, task.dtFim);
                              
                              const barColor = task.kanbanStatus === 'Completed' 
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                                : task.kanbanStatus === 'In Progress'
                                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                  : 'linear-gradient(135deg, #f97316 0%, #e25c1d 100%)';

                              return (
                                <div key={tIdx} className="flex items-center min-h-[38px] hover:bg-slate-50/40 relative">
                                  <div className="w-[200px] pl-8 pr-2 border-r border-slate-200/80 shrink-0 font-bold text-[10px] text-slate-500 truncate flex items-center" title={task.task}>
                                    <span className="truncate">{task.task}</span>
                                  </div>

                                  <div className="flex-1 relative h-[38px] flex items-center">
                                    {task.dtInicio && task.dtFim && (
                                      <div 
                                        onClick={() => {
                                          setSelectedTask(task);
                                          setIsDrawerOpen(true);
                                        }}
                                        className="absolute rounded-lg h-6 shadow-sm flex items-center justify-between px-2 text-[8px] font-black text-white select-none overflow-hidden cursor-pointer hover:brightness-95 transition-all"
                                        style={{ 
                                          left: left, 
                                          width: Math.max(40, width),
                                          background: barColor
                                        }}
                                        title={`${task.task} (${task.taskPhase})\nPeríodo: ${formatKanbanDate(task.dtInicio)} a ${formatKanbanDate(task.dtFim)}\nPontos: ${task.pontos}`}
                                      >
                                        <span className="truncate mr-1 font-semibold">{task.taskPhase || 'Backlog'}</span>
                                        <span className="bg-white/20 px-1 py-0.5 rounded shrink-0">{task.pontos} pts</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KANBAN BOARD */}
          {activeTab === 'kanban' && (
            <div className={`w-full flex flex-col ${isSidebarExpanded ? 'xl:flex-row' : 'lg:flex-row'} gap-6 items-start`}>
              
              {/* Left Side: 3 Columns taking up 70% width */}
              <div className={`flex-1 grid grid-cols-1 md:grid-cols-3 ${isSidebarExpanded ? 'gap-3' : 'gap-5'}`}>
                
                {/* Column 1: Waiting */}
                <div className="flex gap-2">
                  {/* Thick vertical line */}
                  <div className="w-[5px] rounded-full self-stretch bg-[#e25c1d] shrink-0" />
                  
                  <div className={`flex-1 bg-slate-50/50 border border-slate-200/50 rounded-3xl ${isSidebarExpanded ? 'p-3' : 'p-4'} flex flex-col min-h-[420px]`}>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-4 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-[#e25c1d] uppercase tracking-wider">Waiting</h4>
                        <span className="text-[11px]">🎯</span>
                      </div>
                      <span className="bg-orange-100 text-orange-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {memberTasks.filter(t => t.kanbanStatus === 'Waiting').length} ({memberTasks.filter(t => t.kanbanStatus === 'Waiting').reduce((acc, t) => acc + (t.pontos || 0), 0)} pts)
                      </span>
                    </div>
                    <div className={`flex flex-col ${isSidebarExpanded ? 'gap-2.5' : 'gap-3.5'} pr-1 flex-1`}>
                      {memberTasks.filter(t => t.kanbanStatus === 'Waiting').map(t => (
                        <KanbanCard key={t.id} task={t} isSidebarExpanded={isSidebarExpanded} />
                      ))}
                      {memberTasks.filter(t => t.kanbanStatus === 'Waiting').length === 0 && (
                        <div className="flex-1 flex items-center justify-center py-12 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          Sem itens
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="flex gap-2">
                  {/* Thick vertical line */}
                  <div className="w-[5px] rounded-full self-stretch bg-[#1d4ed8] shrink-0" />
                  
                  <div className={`flex-1 bg-slate-50/50 border border-slate-200/50 rounded-3xl ${isSidebarExpanded ? 'p-3' : 'p-4'} flex flex-col min-h-[420px]`}>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-4 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-[#1d4ed8] uppercase tracking-wider">In Progress</h4>
                        <span className="text-[11px]">⚡</span>
                      </div>
                      <span className="bg-blue-100 text-blue-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {memberTasks.filter(t => t.kanbanStatus === 'In Progress').length} ({memberTasks.filter(t => t.kanbanStatus === 'In Progress').reduce((acc, t) => acc + (t.pontos || 0), 0)} pts)
                      </span>
                    </div>
                    <div className={`flex flex-col ${isSidebarExpanded ? 'gap-2.5' : 'gap-3.5'} pr-1 flex-1`}>
                      {memberTasks.filter(t => t.kanbanStatus === 'In Progress').map(t => (
                        <KanbanCard key={t.id} task={t} isSidebarExpanded={isSidebarExpanded} />
                      ))}
                      {memberTasks.filter(t => t.kanbanStatus === 'In Progress').length === 0 && (
                        <div className="flex-1 flex items-center justify-center py-12 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          Sem itens
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 3: Completed */}
                <div className="flex gap-2">
                  {/* Thick vertical line */}
                  <div className="w-[5px] rounded-full self-stretch bg-[#10b981] shrink-0" />
                  
                  <div className={`flex-1 bg-slate-50/50 border border-slate-200/50 rounded-3xl ${isSidebarExpanded ? 'p-3' : 'p-4'} flex flex-col min-h-[420px]`}>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-4 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-[#10b981] uppercase tracking-wider">Completed</h4>
                        <span className="text-[11px]">🎉</span>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {memberTasks.filter(t => t.kanbanStatus === 'Completed').length} ({memberTasks.filter(t => t.kanbanStatus === 'Completed').reduce((acc, t) => acc + (t.pontos || 0), 0)} pts)
                      </span>
                    </div>
                    <div className={`flex flex-col ${isSidebarExpanded ? 'gap-2.5' : 'gap-3.5'} pr-1 flex-1`}>
                      {memberTasks.filter(t => t.kanbanStatus === 'Completed').map(t => (
                        <KanbanCard key={t.id} task={t} isSidebarExpanded={isSidebarExpanded} />
                      ))}
                      {memberTasks.filter(t => t.kanbanStatus === 'Completed').length === 0 && (
                        <div className="flex-1 flex items-center justify-center py-12 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          Sem itens
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Side Panel: Indicators Panel (30% width) */}
              <div className={`w-full ${isSidebarExpanded ? 'xl:w-[320px]' : 'lg:w-[320px]'} shrink-0 flex flex-col gap-5`}>
                
                {/* 1. PROGRESSO CONCLUÍDO Circular Gauges */}
                <div className="bg-[#EAE5EA]/70 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-3xl p-5 shadow-sm">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">Progresso Concluído</h4>
                  
                  <div className="flex items-center justify-around gap-4 py-2">
                    {/* Gauge 1: TAREFAS */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative flex items-center justify-center w-20 h-20">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            className="text-slate-200/60"
                            strokeWidth="6"
                            stroke="currentColor"
                            fill="transparent"
                            r="28"
                            cx="40"
                            cy="40"
                          />
                          <circle
                            className="text-[#64183f]"
                            strokeWidth="6"
                            strokeDasharray={175.9}
                            strokeDashoffset={175.9 - (175.9 * (memberTasks.length > 0 ? memberTasks.filter(t => t.kanbanStatus === 'Completed').length / memberTasks.length : 0))}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="28"
                            cx="40"
                            cy="40"
                          />
                        </svg>
                        <span className="absolute text-xs font-black text-slate-800">
                          {memberTasks.length > 0 ? Math.round((memberTasks.filter(t => t.kanbanStatus === 'Completed').length / memberTasks.length) * 100) : 0}%
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold text-[#64183f]/80 uppercase tracking-widest">Tarefas</span>
                    </div>

                    {/* Gauge 2: PONTOS */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative flex items-center justify-center w-20 h-20">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            className="text-slate-200/60"
                            strokeWidth="6"
                            stroke="currentColor"
                            fill="transparent"
                            r="28"
                            cx="40"
                            cy="40"
                          />
                          <circle
                            className="text-[#64183f]"
                            strokeWidth="6"
                            strokeDasharray={175.9}
                            strokeDashoffset={175.9 - (175.9 * (totalPoints > 0 ? completedPoints / totalPoints : 0))}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="28"
                            cx="40"
                            cy="40"
                          />
                        </svg>
                        <span className="absolute text-xs font-black text-slate-800">
                          {totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0}%
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold text-[#64183f]/80 uppercase tracking-widest">Pontos</span>
                    </div>
                  </div>
                </div>

                {/* 2. TASKS Metrics Grid */}
                <div className="bg-[#EAE5EA]/70 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-3xl p-5 shadow-sm">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">Tasks</h4>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Widget 1: TOTAL */}
                    <div className="bg-white rounded-2xl p-3 border border-slate-200/30 flex flex-col justify-between min-h-[76px] shadow-sm">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-black text-slate-800">{memberTasks.length}</span>
                        <span className="text-[9.5px] font-black text-indigo-500">{totalPoints} pts</span>
                      </div>
                    </div>

                    {/* Widget 2: WAITING */}
                    <div className="bg-white rounded-2xl p-3 border border-slate-200/30 flex flex-col justify-between min-h-[76px] shadow-sm">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Waiting</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-black text-slate-800">
                          {memberTasks.filter(t => t.kanbanStatus === 'Waiting').length}
                        </span>
                        <span className="text-[9.5px] font-black text-orange-500">
                          {memberTasks.filter(t => t.kanbanStatus === 'Waiting').reduce((acc, t) => acc + (t.pontos || 0), 0)} pts
                        </span>
                      </div>
                    </div>

                    {/* Widget 3: IN PROGRESS */}
                    <div className="bg-white rounded-2xl p-3 border border-slate-200/30 flex flex-col justify-between min-h-[76px] shadow-sm">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">In Progress</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-black text-slate-800">
                          {memberTasks.filter(t => t.kanbanStatus === 'In Progress').length}
                        </span>
                        <span className="text-[9.5px] font-black text-blue-600">
                          {memberTasks.filter(t => t.kanbanStatus === 'In Progress').reduce((acc, t) => acc + (t.pontos || 0), 0)} pts
                        </span>
                      </div>
                    </div>

                    {/* Widget 4: COMPLETED */}
                    <div className="bg-white rounded-2xl p-3 border border-slate-200/30 flex flex-col justify-between min-h-[76px] shadow-sm">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Completed</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-black text-slate-800">
                          {memberTasks.filter(t => t.kanbanStatus === 'Completed').length}
                        </span>
                        <span className="text-[9.5px] font-black text-emerald-600">
                          {completedPoints} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: VACATION GANTT */}
          {activeTab === 'ferias' && (
            <div className="w-full flex flex-col md:flex-row gap-6">
              
              {/* Left sidebar: Planned Months list */}
              <div className="w-full md:w-[220px] shrink-0 flex flex-col gap-2 border-r border-slate-200/80 pr-4">
                <span className="text-[10px] font-black text-[#64183f]/60 uppercase tracking-wider mb-1">Meses de {currentYear}</span>
                {(() => {
                  const activeMonths = Array.from({ length: 12 })
                    .map((_, mIdx) => mIdx)
                    .filter(mIdx => monthHasVacation(mIdx));

                  if (activeMonths.length === 0) {
                    return (
                      <span className="text-xs text-slate-400 italic px-3 py-2">
                        Nenhum mês planejado
                      </span>
                    );
                  }

                  return activeMonths.map((mIdx) => {
                    const isSel = selectedMonth === mIdx;

                    // Collect substitutes with vacations in this month
                    const profsInMonth = memberFerries
                      .filter(f => {
                        if (!f.startDate || !f.endDate) return false;
                        if (!f.substituteName) return false; // only show if substitute is set
                        const s = new Date(f.startDate + 'T12:00:00');
                        const e = new Date(f.endDate + 'T12:00:00');
                        const mStart = new Date(currentYear, mIdx, 1);
                        const mEnd = new Date(currentYear, mIdx + 1, 0);
                        return s <= mEnd && e >= mStart;
                      })
                      .map(f => {
                        const subMember = squad.find(s => s.nome === f.substituteName || s.id === f.substituteId);
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isPassed = f.endDate && f.endDate < todayStr;
                        return {
                          name: f.substituteName || '',
                          avatar: subMember?.avatar || f.substituteAvatar || null,
                          avatarImage: subMember?.avatarImage || f.substituteAvatarImage || null,
                          isPassed: !!isPassed
                        };
                      });

                    // Deduplicate by name
                    const uniqueProfs = profsInMonth.filter(
                      (p, idx, arr) => arr.findIndex(x => x.name === p.name) === idx
                    );

                    const totalDays = getVacationDaysInMonth(mIdx);
                    const isMonthPassed = profsInMonth.length > 0 && profsInMonth.every(p => p.isPassed);

                    return (
                      <Box
                        key={mIdx}
                        onClick={() => setSelectedMonth(mIdx)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.2,
                          px: 1.5,
                          py: 1.2,
                          borderRadius: '12px',
                          position: 'relative',
                          background: isSel
                            ? 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)'
                            : 'rgba(255, 255, 255, 0.7)',
                          border: isSel ? '1px solid #64183f' : '1px solid rgba(229, 213, 200, 0.6)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSel ? '0 4px 14px rgba(100, 24, 63, 0.25)' : 'none',
                          '&:hover': {
                            background: isSel
                              ? 'linear-gradient(135deg, #7a1e4e 0%, #232866 100%)'
                              : '#ffffff',
                            boxShadow: '0 4px 12px rgba(100, 24, 63, 0.10)',
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        {isMonthPassed && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -4,
                              right: -4,
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              bgcolor: '#10b981',
                              border: '1.5px solid white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                              zIndex: 20
                            }}
                          >
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </Box>
                        )}
                        {/* Month name + days */}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{
                              fontSize: '0.76rem',
                              fontWeight: 900,
                              fontFamily: 'Outfit',
                              color: isSel ? '#ffffff' : '#1E293B',
                              lineHeight: 1.2
                            }}
                          >
                            {getMonthNamePt(mIdx)}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.58rem',
                              fontWeight: 600,
                              color: isSel ? 'rgba(255,255,255,0.75)' : '#94A3B8',
                              mt: 0.2
                            }}
                          >
                            {totalDays} {totalDays === 1 ? 'dia' : 'dias'}
                          </Typography>
                        </Box>

                        {/* Stacked avatars */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {uniqueProfs.slice(0, 3).map((pro, idx) => {
                            const avObj = pro.avatar ? getAvatarById(pro.avatar) : null;
                            const ini = pro.name.trim().split(/\s+/).slice(0, 2).map((p: string) => p ? p[0] : '').join('').toUpperCase();
                            return (
                              <Tooltip key={pro.name} title={pro.name} arrow>
                                <Avatar
                                  sx={{
                                    width: 22,
                                    height: 22,
                                    fontSize: '0.5rem',
                                    fontWeight: 800,
                                    background: pro.avatarImage
                                      ? 'transparent'
                                      : avObj?.gradient || 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)',
                                    border: `2px solid ${isSel ? 'rgba(255,255,255,0.5)' : '#FAF4EF'}`,
                                    ml: idx === 0 ? 0 : '-7px',
                                    zIndex: 3 - idx,
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                                  }}
                                >
                                  {pro.avatarImage ? (
                                    <img 
                                      src={pro.avatarImage} 
                                      alt={pro.name} 
                                      className="w-full h-full object-cover object-top rounded-full" 
                                    />
                                  ) : avObj ? (
                                    avObj.icon
                                  ) : (
                                    ini
                                  )}
                                </Avatar>
                              </Tooltip>
                            );
                          })}
                          {uniqueProfs.length > 3 && (
                            <Avatar
                              sx={{
                                width: 22,
                                height: 22,
                                fontSize: '0.45rem',
                                fontWeight: 800,
                                bgcolor: isSel ? 'rgba(255,255,255,0.2)' : '#E5D5C8',
                                color: isSel ? '#fff' : '#64183f',
                                border: `2px solid ${isSel ? 'rgba(255,255,255,0.4)' : '#FAF4EF'}`,
                                ml: '-7px',
                                zIndex: 0
                              }}
                            >
                              +{uniqueProfs.length - 3}
                            </Avatar>
                          )}
                        </Box>

                        {/* Active dot */}
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            bgcolor: isSel ? 'rgba(255,255,255,0.8)' : '#22c55e',
                            flexShrink: 0,
                            boxShadow: isSel ? 'none' : '0 0 6px rgba(34, 197, 94, 0.5)'
                          }}
                        />
                      </Box>
                    );
                  });
                })()}
              </div>

              {/* Right area: Two side-by-side Monthly Calendars */}
              <div className="flex-1 border border-slate-200 rounded-3xl p-6 bg-slate-50/30 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h4 className="text-xs font-black text-[#64183f] uppercase tracking-wider font-Outfit">
                    Férias Programadas • Calendários de {getMonthNamePt(selectedMonth)} e {getMonthNamePt((selectedMonth + 1) % 12)} {selectedMonth === 11 ? currentYear + 1 : currentYear}
                  </h4>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                  {/* Calendar 1: Selected Month */}
                  {renderCalendarGrid(currentYear, selectedMonth)}

                  {/* Calendar 2: Next Month */}
                  {renderCalendarGrid(selectedMonth === 11 ? currentYear + 1 : currentYear, (selectedMonth + 1) % 12)}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Task Detail Side Panel Drawer */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: 380, p: 3, borderLeft: '1px solid #e2e8f0' } } }}
      >
        {selectedTask && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: '#64183f', fontWeight: 'black', fontFamily: 'Outfit' }}>
                Detalhes da Tarefa
              </Typography>
              <IconButton onClick={() => setIsDrawerOpen(false)} sx={{ color: 'slate.500' }}>
                <X size={18} weight="bold" />
              </IconButton>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, overflowY: 'auto' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'slate.400', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px' }}>Requisito / Tarefa</Typography>
                <Typography variant="body1" sx={{ color: 'slate.800', fontWeight: 'bold', mt: 0.5, fontSize: '14px', lineHeight: 1.4 }}>
                  {selectedTask.idJira ? `[${selectedTask.idJira}] ` : ''}{selectedTask.task}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'slate.400', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px' }}>Projeto</Typography>
                <Typography variant="body2" sx={{ color: 'slate.700', fontWeight: 'semibold', mt: 0.5 }}>
                  {selectedTask.projectName || 'Sem Projeto'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'slate.400', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px' }}>Descrição</Typography>
                <Typography variant="body2" sx={{ color: 'slate.600', mt: 0.5, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {selectedTask.description || 'Nenhuma descrição fornecida.'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'slate.400', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px' }}>Datas</Typography>
                <Typography variant="body2" sx={{ color: 'slate.700', fontWeight: 'semibold', mt: 0.5 }}>
                  📅 {selectedTask.dtInicio ? formatKanbanDate(selectedTask.dtInicio) : ''} a {selectedTask.dtFim ? formatKanbanDate(selectedTask.dtFim) : ''}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'slate.400', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px' }}>Fase</Typography>
                  <Typography variant="body2" sx={{ color: 'slate.700', fontWeight: 'semibold', mt: 0.5 }}>
                    {selectedTask.taskPhase || 'Backlog'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'slate.400', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px' }}>Tecnologia</Typography>
                  <Typography variant="body2" sx={{ color: 'slate.700', fontWeight: 'semibold', mt: 0.5 }}>
                    {selectedTask.taskTechnology || 'Não informada'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'slate.400', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px' }}>Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <span 
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        selectedTask.kanbanStatus === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedTask.kanbanStatus === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {selectedTask.kanbanStatus}
                    </span>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'slate.400', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px' }}>Pontos</Typography>
                  <Typography variant="body2" sx={{ color: 'slate.700', fontWeight: 'semibold', mt: 0.5 }}>
                    {selectedTask.pontos} pts
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Drawer>

    </div>
  );
};

// Compact sub-component representing a task in the Kanban column
const KanbanCard: React.FC<{ task: any; isSidebarExpanded?: boolean }> = ({ task, isSidebarExpanded = false }) => {
  const isCompleted = task.kanbanStatus === 'Completed';
  
  // Format dates to DD/MM
  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const getPhaseColor = (status: string) => {
    if (status === 'Waiting') return '#e25c1d';
    if (status === 'In Progress') return '#1d4ed8';
    if (status === 'Completed') return '#10b981';
    return '#64183f';
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isAttentionAlert = !isCompleted && task.dtFim && task.dtFim < todayStr;

  return (
    <div 
      className={`bg-white border-y border-r border-l-[8px] rounded-2xl ${isSidebarExpanded ? 'p-2.5 gap-1' : 'p-3 gap-1.5'} shadow-sm hover:shadow-md transition-all flex flex-col relative`}
      style={{ 
        borderLeftColor: getPhaseColor(task.kanbanStatus),
        animation: isAttentionAlert ? 'kanban-blink-alert 0.8s infinite alternate' : 'none',
        borderLeftWidth: isAttentionAlert ? '10px' : '8px',
        borderWidth: isAttentionAlert ? '2.5px' : '1px'
      }}
    >
      <style>{`
        @keyframes kanban-blink-alert {
          0% { 
            box-shadow: 0 0 4px rgba(255, 102, 0, 0.3);
            border-color: rgba(255, 102, 0, 0.4); 
          }
          100% { 
            box-shadow: 0 0 16px rgba(255, 102, 0, 0.95);
            border-color: #ff6600; 
          }
        }
      `}</style>

      {/* Completed Check Badge */}
      {isCompleted && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm z-10">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Title / Requirement at the top in bold + Jira ID */}
      <div className="flex items-start justify-between gap-2">
        <h5 className={`font-bold text-slate-800 leading-snug ${isSidebarExpanded ? 'text-[10px]' : 'text-[11px]'}`}>
          {task.task}
        </h5>
        {task.idJira && (
          <span className="text-[10px] text-slate-400 font-bold shrink-0">{task.idJira}</span>
        )}
      </div>

      {/* Phase + Technology row (both not bold / font-normal) */}
      <div className="text-[9px] text-slate-500 flex items-center gap-1.5 font-normal uppercase tracking-wider">
        <span className="font-normal">{task.taskPhase || 'Backlog'}</span>
        {task.taskTechnology && (
          <>
            <span className="text-slate-300">•</span>
            <span className="text-[#64183f] font-normal">{task.taskTechnology}</span>
          </>
        )}
      </div>

      {/* Date period with Calendar icon + Points aligned right (both regular / font-normal) */}
      <div className="flex items-center justify-between text-[9.5px] font-normal text-slate-400 mt-1">
        <div className="flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{formatShortDate(task.dtInicio)} - {formatShortDate(task.dtFim)}</span>
        </div>
        
        <span className="bg-red-50 text-red-600 font-normal text-[9.5px] px-2 py-0.5 rounded-full shadow-sm shrink-0">
          {task.pontos} pts
        </span>
      </div>
    </div>
  );
};
