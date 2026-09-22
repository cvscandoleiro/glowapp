import React from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import { getAvatarById } from '../utils/avatarRepository';
import { Avatar } from '@mui/material';
import { 
  RocketLaunch, 
  ChartLineUp, 
  Users, 
  Folder,
  ArrowRight,
  DotsSix,
  CaretDown,
  CaretUp,
  CaretRight,
  DotsThreeVertical,
  Hourglass,
  Clock,
  ClipboardText,
  FileText,
  Play,
  Rocket,
  Gear
} from '@phosphor-icons/react';

const formatKanbanDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
};

const getCardIdx = (phase: string, tech: string) => {
  const str = `${phase}||${tech}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const getStep3CardIcon = (idx: number) => {
  const size = 36;
  const props = {
    size,
    weight: "duotone" as const,
    style: {
      position: 'absolute' as const,
      right: '-4px',
      bottom: '-4px',
      color: '#64183f',
      opacity: 0.06,
      transform: 'rotate(-12deg)',
      pointerEvents: 'none' as const,
      userSelect: 'none' as const,
      zIndex: 0
    }
  };
  switch (idx % 8) {
    case 0: return <ClipboardText {...props} />;
    case 1: return <FileText {...props} />;
    case 2: return <Users {...props} />;
    case 3: return <Play {...props} />;
    case 4: return <Rocket {...props} />;
    case 5: return <Hourglass {...props} />;
    case 6: return <Folder {...props} />;
    default: return <Gear {...props} />;
  }
};

export const DashboardView: React.FC = () => {
  const { tasks, squad, projects, steps, setViewingAllBacklog } = usePlanningStore();
  const [selectedMember, setSelectedMember] = React.useState<string | null>(null);
  const [isDashboardHeaderCollapsed, setIsDashboardHeaderCollapsed] = React.useState(false);
  const [expandedProjects, setExpandedProjects] = React.useState<Record<string, boolean>>({});
  const [projectBacklogs, setProjectBacklogs] = React.useState<Record<number, any[]>>({});
  const [dbTasks, setDbTasks] = React.useState<any[]>([]);
  const [currentUser, setCurrentUser] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/connection-status');
        if (res.ok) {
          const data = await res.json();
          if (data.osUser) {
            setCurrentUser(data.osUser);
          }
        }
      } catch (err) {
        console.error('Failed to fetch connection status / current user:', err);
      }
    };
    fetchUser();
  }, []);

  const greetingName = React.useMemo(() => {
    if (!currentUser) return 'Planejador';
    
    // Normalize currentUser (e.g. cvieira or DOMAIN\cvieira)
    let normalizedUser = currentUser.trim().toLowerCase();
    if (normalizedUser.includes('\\')) {
      normalizedUser = normalizedUser.split('\\')[1];
    }
    if (normalizedUser.includes('/')) {
      normalizedUser = normalizedUser.split('/').pop() || normalizedUser;
    }
    
    if (squad.length === 0) return currentUser;

    // Find in squad by matching email prefix
    const matchedMember = squad.find(member => {
      if (!member.email) return false;
      const emailPart = member.email.split('@')[0].trim().toLowerCase();
      return emailPart === normalizedUser;
    });
    
    if (matchedMember) {
      return matchedMember.nome;
    }
    
    return currentUser;
  }, [currentUser, squad]);

  const toggleProject = async (projId: number) => {
    const isExpanded = !!expandedProjects[projId];
    if (!isExpanded && !projectBacklogs[projId]) {
      try {
        const res = await fetch(`/api/projects/${projId}/backlog`);
        if (res.ok) {
          const data = await res.json();
          setProjectBacklogs(prev => ({ ...prev, [projId]: data }));
        }
      } catch (err) {
        console.error('Failed to fetch project backlog:', err);
      }
    }
    setExpandedProjects(prev => ({ ...prev, [projId]: !isExpanded }));
  };

  // Filter projects to only include active ones (PENDENTE = 1, EXECUCAO = 2)
  const activeProjects = React.useMemo(() => {
    return projects.filter(p => p.statusId === 1 || p.statusId === 2);
  }, [projects]);


  // 1. Calculate KPI Metrics
  const totalPoints = activeProjects.reduce((acc, p) => acc + (p.totalTaskPoints || 0), 0);
  
  // Dev Done (Sum of completed task points from active projects in manager_oss_backlog)
  const completedPointsTotal = activeProjects.reduce((acc, p) => acc + (p.completedTaskPoints || 0), 0);
  const completedPointsPercentage = totalPoints > 0 ? Math.round((completedPointsTotal / totalPoints) * 100) : 0;

  // Resolve connected user's operationId
  const loggedInUsername = localStorage.getItem('kairos_username') || '';
  const loggedInMember = React.useMemo(() => {
    return squad.find(m => {
      if (!m.email) return false;
      const prefix = m.email.split('@')[0].toLowerCase().trim();
      return prefix === loggedInUsername.toLowerCase().trim();
    });
  }, [squad, loggedInUsername]);

  const filteredSquadForDashboard = React.useMemo(() => {
    return squad.filter(member => {
      if (loggedInMember && Array.isArray(loggedInMember.operationIds) && loggedInMember.operationIds.length > 0) {
        const memOps = member.operationIds || [];
        return loggedInMember.operationIds.some(opId => memOps.includes(opId));
      }
      return true;
    });
  }, [squad, loggedInMember]);

  // Filter active project tasks to only include completed tasks started in the last 30 days (matching SQL reference)
  const activeProjectsTasksLast30Days = React.useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    today.setHours(23, 59, 59, 999);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    return dbTasks.filter(t => {
      // Must be completed (Completed)
      if (t.status !== 'Completed') return false;

      // dtInicio (initial_date) must be between sysdate-30 and sysdate
      if (!t.dtInicio) return false;
      const taskDate = new Date(t.dtInicio + 'T12:00:00');
      if (taskDate < thirtyDaysAgo || taskDate > today) return false;

      // Filter tasks to only include those assigned to squad members in the filtered list
      const isAssignedToFilteredMember = filteredSquadForDashboard.some(m => m.nome === t.nome);
      return isAssignedToFilteredMember;
    });
  }, [dbTasks, filteredSquadForDashboard]);

  const totalPointsLast30Days = React.useMemo(() => {
    return activeProjectsTasksLast30Days.reduce((acc, t) => acc + t.pontos, 0);
  }, [activeProjectsTasksLast30Days]);

  // 2. Resource Allocation Data (Top 5 performers) - Last 30 Days
  const topPerformers = filteredSquadForDashboard
    .filter(member => (member.status || 'ATIVO') === 'ATIVO')
    .map(member => {
      const memberTasks = activeProjectsTasksLast30Days.filter(t => t.nome === member.nome);
      const memberPoints = memberTasks.reduce((acc, t) => acc + t.pontos, 0);
      const completedPoints = memberPoints;
      const percentage = totalPointsLast30Days > 0 ? Math.round((memberPoints / totalPointsLast30Days) * 100) : 0;
      return {
        ...member,
        points: memberPoints,
        completedPoints,
        tasksCount: memberTasks.length,
        percentage
      };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);


  const getKanbanStatus = (phase: string | null | undefined): 'Waiting' | 'In Progress' | 'Completed' => {
    if (!phase) return 'Waiting';
    const p = phase.trim().toLowerCase();
    if (p === 'on going' || p === 'in progress' || p === 'doing') return 'In Progress';
    if (p === 'completed' || p === 'done') return 'Completed';
    return 'Waiting';
  };

  React.useEffect(() => {
    const fetchAllActiveBacklogs = async () => {
      const allTasks: any[] = [];
      await Promise.all(
        activeProjects.map(async (proj) => {
          try {
            const res = await fetch(`/api/projects/${proj.id}/backlog`);
            if (res.ok) {
              const data = await res.json();
              data.forEach((item: any) => {
                const member = item.resourceId ? squad.find(s => String(s.id) === String(item.resourceId)) : null;
                allTasks.push({
                  id: String(item.id),
                  idJira: item.taskSequence || '',
                  task: item.taskName || '',
                  dtInicio: item.initialDate,
                  dtFim: item.endDate,
                  pontos: item.taskPoints || 0,
                  nome: member ? member.nome : '',
                  avatar: member ? member.avatar : null,
                  avatarImage: member ? member.avatarImage : null,
                  perfil: member ? member.perfil : '',
                  projectName: proj.name,
                  taskTechnology: item.taskTechnology || '',
                  status: item.kanbanPhase || 'Waiting',
                  kanbanStatus: getKanbanStatus(item.kanbanPhase),
                  taskPhase: item.taskPhase || ''
                });
              });
            }
          } catch (err) {
            console.error('Failed to fetch backlog for project:', proj.id, err);
          }
        })
      );
      setDbTasks(allTasks);

      setDbTasks(allTasks);
    };

    if (activeProjects.length > 0 && squad.length > 0) {
      fetchAllActiveBacklogs();
    }
  }, [activeProjects, squad]);

  const top5PointsSum = topPerformers.reduce((acc, m) => acc + m.points, 0);
  const top5Percentage = totalPointsLast30Days > 0 ? Math.round((top5PointsSum / totalPointsLast30Days) * 100) : 0;

  const kanbanColumns = React.useMemo(() => {
    const todo = dbTasks.filter(t => t.kanbanStatus === 'Waiting');
    const ongoing = dbTasks.filter(t => t.kanbanStatus === 'In Progress');
    return [
      { id: 'Waiting', title: 'Waiting', items: todo, icon: <Hourglass size={14} className="text-orange-500" />, borderColor: 'border-l-orange-500', bgColor: 'bg-orange-50/10' },
      { id: 'In Progress', title: 'In Progress', items: ongoing, icon: <Clock size={14} className="text-blue-500" />, borderColor: 'border-l-blue-500', bgColor: 'bg-blue-50/10' }
    ];
  }, [dbTasks]);



  return (
    <div className="h-full flex flex-col animate-fade-in relative text-slate-800 bg-transparent overflow-hidden">

      {/* ── HEADER ── */}
      <div className={`px-8 border-b border-slate-200 bg-white flex justify-between items-center z-10 select-none transition-all duration-300 ${isDashboardHeaderCollapsed ? 'py-2' : 'py-5'}`}>
        <div>
          <h2 className={`font-extrabold text-[#64183f] transition-all duration-300 ${isDashboardHeaderCollapsed ? 'text-lg' : 'text-2xl'}`}>Olá, {greetingName}! 👋</h2>
          {!isDashboardHeaderCollapsed && (
            <p className="text-xs font-semibold text-slate-500 mt-1 transition-all duration-300">Aqui está o andamento atual do planejamento dos projetos.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDashboardHeaderCollapsed(!isDashboardHeaderCollapsed)}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#64183f] hover:border-[#64183f] hover:bg-pink-50 transition-all shrink-0"
            title={isDashboardHeaderCollapsed ? "Expandir cabeçalho" : "Contrair cabeçalho"}
          >
            {isDashboardHeaderCollapsed ? <CaretDown size={14} weight="bold" /> : <CaretUp size={14} weight="bold" />}
          </button>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-white/85 backdrop-blur-md">
      <div className="space-y-6 pb-10">

      {/* Row 1: Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Projetos Ativos */}
        <div className="bg-[#EAE5EA]/70 border border-slate-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center border-l-[6px] border-l-[#64183f] h-[96px]">
          <div className="flex items-center w-full">
            <div className="text-[#64183f] shrink-0 mr-4">
              <Folder size={24} weight="bold" />
            </div>
            <div className="w-[1px] h-8 bg-slate-400/40 mr-4"></div>
            <div>
              <span className="text-[10px] font-extrabold text-[#64183f]/80 uppercase tracking-widest block leading-none">Projetos Ativos</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{activeProjects.length}</h3>
            </div>
          </div>
        </div>

        {/* Card 2: Pontos Planejados */}
        <div className="bg-[#EAE5EA]/70 border border-slate-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center border-l-[6px] border-l-[#64183f] h-[96px]">
          <div className="flex items-center w-full">
            <div className="text-[#64183f] shrink-0 mr-4">
              <RocketLaunch size={24} weight="bold" />
            </div>
            <div className="w-[1px] h-8 bg-slate-400/40 mr-4"></div>
            <div>
              <span className="text-[10px] font-extrabold text-[#64183f]/80 uppercase tracking-widest block leading-none">Pontos Planejados</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalPoints}</h3>
            </div>
          </div>
        </div>

        {/* Card 3: Profissionais Alocados */}
        <div className="bg-[#EAE5EA]/70 border border-slate-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center border-l-[6px] border-l-[#64183f] h-[96px]">
          <div className="flex items-center w-full">
            <div className="text-[#64183f] shrink-0 mr-4">
              <Users size={24} weight="bold" />
            </div>
            <div className="w-[1px] h-8 bg-slate-400/40 mr-4"></div>
            <div>
              <span className="text-[10px] font-extrabold text-[#64183f]/80 uppercase tracking-widest block leading-none">Profissionais Alocados</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{filteredSquadForDashboard.length}</h3>
            </div>
          </div>
        </div>

        {/* Card 4: Pontos Done */}
        <div className="bg-[#EAE5EA]/70 border border-slate-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center border-l-[6px] border-l-[#64183f] h-[96px]">
          <div className="flex items-center w-full">
            <div className="text-[#64183f] shrink-0 mr-4">
              <ChartLineUp size={24} weight="bold" />
            </div>
            <div className="w-[1px] h-8 bg-slate-400/40 mr-4"></div>
            <div>
              <span className="text-[10px] font-extrabold text-[#64183f]/80 uppercase tracking-widest block leading-none">Pontos Done</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{completedPointsPercentage}%</h3>
            </div>
          </div>
        </div>
      </div>
      {/* Row 2: Active Projects */}
      <div className="bg-[#FAF4EF]/50 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-[2rem] p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-black text-[#64183f]">Projetos Ativos em Andamento</h4>
          </div>
        </div>
        {/* Modern Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          
          {/* Table Headers */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#64183f] to-[#1a1f44] text-[10px] font-black text-white uppercase tracking-widest">
                  <th className="py-2.5 px-2.5 w-10 text-center"></th>
                  <th className="py-2.5 px-2.5">Projeto</th>
                  <th className="py-2.5 px-2.5 text-center">Inicio da Execução</th>
                  <th className="py-2.5 px-2.5 text-center">Fim da Execução</th>
                  <th className="py-2.5 px-2.5 text-center">Pontuação Total</th>
                  <th className="py-2.5 px-2.5 text-center">(%) Dev Done</th>
                  <th className="py-2.5 px-2.5 text-center">Time</th>
                  <th className="py-2.5 px-2.5 text-center">Etapa</th>
                  <th className="py-2.5 px-2.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {activeProjects.map(proj => {
                  const projTasks = tasks.filter(t => t.sistema === proj.projectId);
                  const isExpanded = !!expandedProjects[proj.id];
                  const dbItems = projectBacklogs[proj.id];
                  
                  // Get team members using teamResourceIds from db project if available
                  const teamMembers = (() => {
                    const idsStr = proj.teamResourceIds || '';
                    if (idsStr) {
                      const ids = idsStr.split(';').map(id => String(id.trim())).filter(Boolean);
                      return ids.map(id => squad.find(m => String(m.id) === id)).filter(Boolean) as any[];
                    }
                    const activeResourceNames = Array.from(
                      new Set(projTasks.map(t => t.nome).filter(Boolean))
                    ) as string[];
                    return activeResourceNames.map(name => squad.find(m => m.nome === name)).filter(Boolean) as any[];
                  })();

                  // Find min/max date for tasks in this project
                  const { minDateStr, maxDateStr } = (() => {
                    if (dbItems && dbItems.length > 0) {
                      const startDates = dbItems.map(item => item.initialDate).filter(Boolean).map(d => new Date(d + 'T12:00:00'));
                      const endDates = dbItems.map(item => item.endDate).filter(Boolean).map(d => new Date(d + 'T12:00:00'));
                      
                      const minD = startDates.length > 0 
                        ? new Date(Math.min(...startDates.map(d => d.getTime()))).toLocaleDateString('pt-BR') 
                        : '-';
                      const maxD = endDates.length > 0 
                        ? new Date(Math.max(...endDates.map(d => d.getTime()))).toLocaleDateString('pt-BR') 
                        : '-';
                      return { minDateStr: minD, maxDateStr: maxD };
                    } else {
                      const formatDateBR = (dateStr: string | null | undefined) => {
                        if (!dateStr) return '-';
                        const parts = dateStr.split('-');
                        if (parts.length === 3) {
                          return `${parts[2]}/${parts[1]}/${parts[0]}`;
                        }
                        return dateStr;
                      };
                      return {
                        minDateStr: formatDateBR(proj.startDate),
                        maxDateStr: formatDateBR(proj.endDate)
                      };
                    }
                  })();

                  const currentStepName = steps.find(s => s.id === proj.stepId)?.name || 'Sem etapa';

                  // Calculate Total Points & Dev Done (percentage of completed points vs total points)
                  const totalProjPoints = dbItems
                    ? dbItems.reduce((acc, item) => acc + (item.taskPoints || 0), 0)
                    : (proj.totalTaskPoints ?? 0);
                  let devDonePercentage = 0;
                  if (dbItems) {
                    const totalPointsFromDb = dbItems.reduce((acc, item) => acc + (item.taskPoints || 0), 0);
                    const completedPointsFromDb = dbItems
                      .filter(item => item.kanbanPhase === 'Completed')
                          .reduce((acc, item) => acc + (item.taskPoints || 0), 0);
                    devDonePercentage = totalPointsFromDb > 0
                      ? Math.round((completedPointsFromDb / totalPointsFromDb) * 100)
                      : 0;
                  } else {
                    const totalTaskPointsVal = proj.totalTaskPoints ?? 0;
                    devDonePercentage = totalTaskPointsVal > 0
                      ? Math.round(((proj.completedTaskPoints ?? 0) / totalTaskPointsVal) * 100)
                      : 0;
                  }

                  // Priority/Etapa color dot
                  let dotColor = 'bg-slate-400';
                  if (proj.stepId <= 2) dotColor = 'bg-amber-500'; // Estimativa
                  else if (proj.stepId <= 4) dotColor = 'bg-blue-500'; // Planejamento
                  else if (proj.stepId === 5) dotColor = 'bg-purple-500'; // Execução
                  else if (proj.stepId === 6) dotColor = 'bg-emerald-500'; // Teste

                  // Project logo gradient index helper
                  const gradients = [
                    'from-blue-400 to-indigo-600',
                    'from-rose-400 to-[#64183f]',
                    'from-amber-400 to-orange-600',
                    'from-emerald-400 to-teal-700'
                  ];
                  const gradientClass = gradients[proj.id % gradients.length];

                  return (
                    <React.Fragment key={proj.id}>
                      {/* Project Row */}
                      <tr 
                        className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50/20' : ''}`}
                        onClick={() => toggleProject(proj.id)}
                      >
                        <td className="py-2 px-2.5 text-center">
                          <div className="flex justify-center text-slate-400">
                            {isExpanded ? <CaretDown size={14} weight="bold" className="text-[#64183f]" /> : <CaretRight size={14} weight="bold" />}
                          </div>
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="flex items-center space-x-3">
                            {/* Project Logo/Icon */}
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-extrabold text-[11px] shadow-sm shrink-0`}>
                              {proj.projectId.slice(0, 3)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 truncate">{proj.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold">ID: {proj.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2.5 text-center text-slate-500 font-bold">{minDateStr}</td>
                        <td className="py-2 px-2.5 text-center text-slate-500 font-bold">{maxDateStr}</td>
                        <td className="py-2 px-2.5 text-center font-extrabold text-slate-800">{totalProjPoints} pts</td>
                        <td className="py-2 px-2.5 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="font-extrabold text-emerald-600">{devDonePercentage}%</span>
                            <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden shrink-0 border border-slate-200">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${devDonePercentage}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="flex justify-center">
                            {teamMembers.length > 0 ? (
                              <div className="flex -space-x-1.5">
                                {teamMembers.slice(0, 10).map(member => {
                                  const avatarObj = member.avatar ? getAvatarById(member.avatar) : null;
                                  return (
                                    <Avatar
                                      key={member.nome}
                                      title={member.nome}
                                      sx={{
                                        width: 22,
                                        height: 22,
                                        fontSize: '0.55rem',
                                        fontWeight: 900,
                                        border: '1.5px solid #fff',
                                        background: member.avatarImage
                                          ? 'transparent'
                                          : avatarObj 
                                            ? avatarObj.gradient 
                                            : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)'
                                      }}
                                    >
                                      {member.avatarImage ? (
                                        <img 
                                          src={member.avatarImage} 
                                          alt={member.nome} 
                                          className="w-full h-full object-cover object-top rounded-full" 
                                        />
                                      ) : avatarObj ? (
                                        avatarObj.icon
                                      ) : (
                                        member.nome.slice(0, 2).toUpperCase()
                                      )}
                                    </Avatar>
                                  );
                                })}
                                {teamMembers.length > 10 && (
                                  <div className="w-5.5 h-5.5 rounded-full border border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 shrink-0">
                                    +{teamMembers.length - 10}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Sem time</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="flex items-center justify-center space-x-1.5">
                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                            <span className="font-bold text-slate-700">{currentStepName}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <button 
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProject(proj.id);
                            }}
                          >
                            <DotsThreeVertical size={18} weight="bold" />
                          </button>
                        </td>
                      </tr>

                      {/* Project Tasks Collapsible Sub-table */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-4 bg-slate-50/40 border-t border-b border-slate-100">
                            {(() => {
                              const dbItems = projectBacklogs[proj.id];
                              const displayTasks = dbItems
                                ? dbItems.map(item => {
                                    const member = item.resourceId ? squad.find(s => String(s.id) === String(item.resourceId)) : null;
                                    return {
                                      id: String(item.id),
                                      idJira: item.taskSequence || '',
                                      task: item.taskName || '',
                                      dtInicio: item.initialDate,
                                      dtFim: item.endDate,
                                      pontos: item.taskPoints || 0,
                                      nome: member ? member.nome : '',
                                      status: item.kanbanPhase || 'Waiting'
                                    };
                                  })
                                : projTasks.map(t => ({
                                    id: t.id,
                                    idJira: t.idJira,
                                    task: t.task,
                                    dtInicio: t.dtInicio,
                                    dtFim: t.dtFim,
                                    pontos: t.pontos,
                                    nome: t.nome,
                                    status: t.status === 'done' ? 'Completed' : t.status === 'doing' ? 'On Going' : 'Waiting'
                                  }));

                              return displayTasks.length > 0 ? (
                                <div className="bg-white rounded-xl border border-slate-150 shadow-inner overflow-hidden max-w-5xl mx-auto">
                                  <table className="w-full text-left border-collapse text-[11px]">
                                    <thead>
                                      <tr className="bg-[#64183f]/50 text-white font-bold uppercase tracking-wider text-[9px]">
                                        <th className="py-2 px-4">ID</th>
                                        <th className="py-2 px-4">Tarefa</th>
                                        <th className="py-2 px-4 text-center">Início</th>
                                        <th className="py-2 px-4 text-center">Fim</th>
                                        <th className="py-2 px-4 text-center">Esforço (Pts)</th>
                                        <th className="py-2 px-4">Responsável</th>
                                        <th className="py-2 px-4 text-right">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-slate-600">
                                      {displayTasks.map(t => {
                                        const tStart = t.dtInicio ? new Date(t.dtInicio + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
                                        const tFim = t.dtFim ? new Date(t.dtFim + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
                                        const member = t.nome ? squad.find(m => m.nome === t.nome) : null;
                                        const avatarObj = member?.avatar ? getAvatarById(member.avatar) : null;
                                        
                                        let statusColor = 'text-amber-600 bg-amber-50 border-amber-100'; // Default is Waiting/To Do
                                        if (t.status === 'On Going' || t.status === 'doing') statusColor = 'text-blue-600 bg-blue-50 border-blue-100';
                                        else if (t.status === 'Completed' || t.status === 'done') statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';

                                        return (
                                          <tr key={t.id} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-4 font-bold text-[#64183f]">{t.idJira}</td>
                                            <td className="py-2 px-4 font-semibold text-slate-800" title={t.task}>{t.task}</td>
                                            <td className="py-2 px-4 text-center font-bold text-slate-500">{tStart}</td>
                                            <td className="py-2 px-4 text-center font-bold text-slate-500">{tFim}</td>
                                            <td className="py-2 px-4 text-center font-extrabold text-slate-700">{t.pontos}</td>
                                            <td className="py-2 px-4">
                                              <div className="flex items-center space-x-1.5">
                                                {t.nome ? (
                                                  <>
                                                    <Avatar
                                                      sx={{
                                                        width: 18,
                                                        height: 18,
                                                        fontSize: '0.5rem',
                                                        fontWeight: 900,
                                                        background: member?.avatarImage
                                                          ? 'transparent'
                                                          : avatarObj 
                                                            ? avatarObj.gradient 
                                                            : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)'
                                                      }}
                                                    >
                                                      {member?.avatarImage ? (
                                                        <img 
                                                          src={member.avatarImage} 
                                                          alt={t.nome} 
                                                          className="w-full h-full object-cover object-top rounded-full" 
                                                        />
                                                      ) : avatarObj ? (
                                                        avatarObj.icon
                                                      ) : (
                                                        t.nome.slice(0, 2).toUpperCase()
                                                      )}
                                                    </Avatar>
                                                    <span className="font-semibold text-slate-700">{t.nome}</span>
                                                  </>
                                                ) : (
                                                  <span className="text-slate-400 italic">Sem alocação</span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="py-2 px-4 text-right">
                                              <span className={`inline-block px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${statusColor}`}>
                                                {t.status}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-slate-400 text-xs italic bg-white rounded-xl border border-slate-100">
                                  Nenhuma tarefa vinculada ao backlog deste projeto.
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Resource Allocation Panel in reference image layout */}
        <div className="bg-[#EAE5EA]/70 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-3xl p-6 shadow-sm w-full lg:w-fit shrink-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-baseline gap-3 mb-0.5">
                <span className="text-lg font-black text-[#64183f]">{top5PointsSum} ({top5Percentage}%) de {totalPointsLast30Days} pts</span>
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Top 5 pontuadores (Últimos 30 dias)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {topPerformers.map((member) => {
              const avatarObj = member.avatar ? getAvatarById(member.avatar) : null;
              const isSelected = selectedMember === member.nome;
              
              // Determine color class for percentage and bar based on performance
              let perfColorClass = 'text-red-500';
              const barColorClass = 'bg-gradient-to-r from-blue-400 to-indigo-600';
              if (member.percentage >= 70) {
                perfColorClass = 'text-emerald-600';
              } else if (member.percentage >= 40) {
                perfColorClass = 'text-orange-500';
              }

              // Segmented progress bar rendering
              const totalSegments = 24;
              const hasPoints = member.points > 0;
              const filledSegments = hasPoints ? Math.round((member.percentage / 100) * totalSegments) : 0;

              return (
                <div 
                  key={member.nome} 
                  onClick={() => setSelectedMember(isSelected ? null : member.nome)}
                  className={`flex flex-col py-1.5 px-3 border border-slate-200/50 border-l-[4px] border-l-[#64183f] rounded-2xl cursor-pointer transition-all duration-200 select-none w-full lg:w-[280px] ${
                    isSelected 
                      ? 'bg-[#64183f]/15 shadow-inner scale-[1.02]' 
                      : 'bg-white hover:bg-slate-50 hover:scale-[1.01] hover:shadow-sm'
                  }`}
                  style={{
                    boxShadow: isSelected ? 'inset 0 1px 0 rgba(100, 24, 63, 0.2)' : undefined,
                  }}
                >
                  {/* Member info & percentage */}
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center space-x-2 min-w-0">
                      <DotsSix size={14} className="text-slate-400/80 shrink-0 cursor-grab" weight="bold" />
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: '0.6rem',
                          fontWeight: 900,
                          background: member.avatarImage
                            ? 'transparent'
                            : avatarObj 
                              ? avatarObj.gradient 
                              : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)'
                        }}
                      >
                        {member.avatarImage ? (
                          <img 
                            src={member.avatarImage} 
                            alt={member.nome} 
                            className="w-full h-full object-cover object-top rounded-full" 
                          />
                        ) : avatarObj ? (
                          avatarObj.icon
                        ) : (
                          member.nome.slice(0, 2).toUpperCase()
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[11px] font-extrabold text-slate-800 truncate leading-tight">{member.nome}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">{member.perfil}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-black shrink-0 ${perfColorClass}`}>
                      {member.percentage}%
                    </div>
                  </div>

                  {/* Segmented Bar */}
                  <div className="flex items-center w-full gap-[2px] my-0.5">
                    {Array.from({ length: totalSegments }).map((_, idx) => {
                      let segmentBg = 'bg-slate-100'; // Empty/unallocated space
                      if (hasPoints) {
                        if (idx < filledSegments) {
                          segmentBg = barColorClass;
                        } else {
                          segmentBg = 'bg-[#cbd5e1]'; // Potential (grey)
                        }
                      }
                      return (
                        <div
                          key={idx}
                          className={`h-1.5 w-full rounded-[1px] transition-colors duration-300 ${segmentBg}`}
                        />
                      );
                    })}
                  </div>

                  {/* Footer details: Points / Tasks */}
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold mt-0.5">
                    <span>{member.points} Pontos | {member.tasksCount} Tasks</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        <div className="bg-[#EAE5EA]/70 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-3xl flex flex-col overflow-hidden relative shadow-sm flex-1">

          {/* Embedded Styles for custom animations and hover states */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes blink-alert {
              0% { box-shadow: 0 0 4px rgba(255, 102, 0, 0.3); border-color: rgba(255, 102, 0, 0.4); }
              100% { box-shadow: 0 0 16px rgba(255, 102, 0, 0.95); border-color: #ff6600; }
            }
            .kanban-card {
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .kanban-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
            }
            .kanban-card-alert:hover {
              transform: translateY(-2px);
              box-shadow: 0 0 18px rgba(255, 102, 0, 0.95) !important;
            }
          `}} />

          <div className="p-6 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-md font-black text-[#64183f]">Backlog em Execução</h4>
                <p className="text-xs text-slate-400">Atividades em execução no momento.</p>
              </div>
              <div 
                onClick={() => setViewingAllBacklog(true)}
                className="text-xs font-extrabold text-[#64183f] flex items-center gap-0.5 hover:underline cursor-pointer select-none"
              >
                Ver Todas <ArrowRight size={12} weight="bold" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 flex-1">
              {kanbanColumns.map(col => {
                const colColor = col.id === 'Waiting' ? '#c2410c' : col.id === 'In Progress' ? '#1d4ed8' : '#047857';
                return (
                  <div 
                    key={col.id} 
                    className="flex flex-col p-2 min-h-[400px]"
                    style={{
                      borderLeft: `5px solid ${colColor}`,
                      background: 'transparent'
                    }}
                  >
                    {/* Column Header */}
                    <div className="flex justify-between items-center mb-4 px-1">
                      <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: colColor }}>
                        {col.title === 'Waiting' ? 'Waiting 🎯' : col.title === 'In Progress' ? 'In Progress ⚡' : 'Completed 🎉'}
                      </span>
                      <div 
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold"
                        style={{
                          backgroundColor: col.id === 'Waiting' ? 'rgba(249, 115, 22, 0.15)' : col.id === 'In Progress' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: colColor
                        }}
                      >
                        <span>{col.items.length}</span>
                        <span className="opacity-75 text-[8px]">({col.items.reduce((acc, t) => acc + (t.pontos || 0), 0)} pts)</span>
                      </div>
                    </div>

                    {/* Card List */}
                    <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                      {col.items.length > 0 ? (
                        col.items.map(t => {
                          const avatarObj = t.avatar ? getAvatarById(t.avatar) : null;
                          const cardIdx = getCardIdx(t.taskPhase || '', t.taskTechnology || '');
                          
                          // Check attention alert condition
                          const isAttentionAlert = (() => {
                            if (!t.dtInicio || !t.dtFim) return false;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const initial = new Date(t.dtInicio + 'T12:00:00');
                            initial.setHours(0, 0, 0, 0);

                            const end = new Date(t.dtFim + 'T12:00:00');
                            end.setHours(0, 0, 0, 0);

                            if (col.id === 'Waiting' && initial.getTime() < today.getTime()) {
                              return true;
                            }
                            if (col.id === 'In Progress' && today.getTime() > end.getTime()) {
                              return true;
                            }
                            return false;
                          })();

                          return (
                            <div 
                              key={t.id} 
                              className={`flex flex-col p-3 rounded-xl kanban-card ${isAttentionAlert ? 'kanban-card-alert' : ''} relative overflow-visible`}
                              style={{
                                background: '#FDFCF7',
                                border: isAttentionAlert ? '4px solid #ff6600' : '1px solid #cbd5e1',
                                borderLeft: `8px solid ${isAttentionAlert ? '#ff6600' : colColor}`,
                                boxShadow: isAttentionAlert ? '0 0 12px rgba(255, 102, 0, 0.8)' : '0 4px 12px rgba(0,0,0,0.05)',
                                animation: isAttentionAlert ? 'blink-alert 0.8s infinite alternate' : 'none'
                              }}
                            >
                              {/* Green Check Badge for Completed Cards */}
                              {col.id === 'Completed' && (
                                <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#10b981] border-2 border-white flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.15)] z-30">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}

                              {/* Curved Wave Layers */}
                              <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-0" viewBox="0 0 200 100" preserveAspectRatio="none">
                                <path d="M 0 100 C 60 90, 100 45, 200 15 L 200 100 Z" fill="rgba(100, 24, 63, 0.02)" />
                                <path d="M 0 100 C 80 85, 120 60, 200 38 L 200 100 Z" fill="rgba(100, 24, 63, 0.04)" />
                                <path d="M 0 100 C 110 95, 145 82, 200 68 L 200 100 Z" fill="rgba(100, 24, 63, 0.01)" />
                              </svg>

                              {/* Sparkling Stars */}
                              <div className="absolute inset-0 pointer-events-none select-none z-0">
                                <svg className="absolute left-[15%] top-[15%] w-2.5 h-2.5 text-[#64183f] opacity-15" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                                </svg>
                                <svg className="absolute right-[25%] bottom-[20%] w-2 h-2 text-[#64183f] opacity-10" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                                </svg>
                              </div>

                              {/* Background Illustration Icon */}
                              {getStep3CardIcon(cardIdx)}

                              {/* Card Content above waves */}
                              <div className="relative z-10 flex flex-col">
                                {/* Card Top Row: Sequence on the right, Project Name on the left */}
                                <div className="mb-0.5">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider" title={t.projectName}>
                                    {t.projectName}
                                  </span>
                                </div>

                                {/* Header: Task Name */}
                                <p className="text-[10px] text-slate-800 font-semibold mb-1.5 leading-snug" title={t.task}>
                                  {t.task}
                                </p>

                                {/* Subheader: Phase - Tech */}
                                <div className="text-[8px] text-extrabold text-[#64183f] uppercase tracking-wider mb-1.5">
                                  {t.taskPhase || 'Sem Fase'} - {t.taskTechnology || 'Sem Tecnologia'}
                                </div>

                                {/* Calendar Dates */}
                                <div className="flex items-center gap-1 mb-2 text-slate-500">
                                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-[9px] font-medium text-slate-500">
                                    {t.dtInicio ? formatKanbanDate(t.dtInicio) : '-'} a {t.dtFim ? formatKanbanDate(t.dtFim) : '-'}
                                  </span>
                                </div>

                                {/* Footer: Assignee & Points */}
                                <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60">
                                  <div className="flex items-center space-x-1">
                                    {t.nome ? (
                                      <>
                                        <Avatar
                                          title={t.nome}
                                          sx={{
                                            width: 16,
                                            height: 16,
                                            fontSize: '0.45rem',
                                            fontWeight: 900,
                                            background: t.avatarImage
                                              ? 'transparent'
                                              : avatarObj 
                                                ? avatarObj.gradient 
                                                : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)',
                                            border: '1px solid #cbd5e1'
                                          }}
                                        >
                                          {t.avatarImage ? (
                                            <img 
                                              src={t.avatarImage} 
                                              alt={t.nome} 
                                              className="w-full h-full object-cover object-top rounded-full" 
                                            />
                                          ) : avatarObj ? (
                                            avatarObj.icon
                                          ) : (
                                            t.nome.slice(0, 2).toUpperCase()
                                          )}
                                        </Avatar>
                                        <span className="text-[9px] font-bold text-slate-650 truncate max-w-[60px]">{t.nome.split(' ')[0]}</span>
                                      </>
                                    ) : (
                                      <span className="text-slate-400 italic text-[8px]">Sem alocação</span>
                                    )}
                                  </div>
                                  <span className="text-[9px] font-black text-[#64183f] bg-[#64183f]/10 px-1.5 py-0.5 rounded">{t.pontos} pts</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-6 text-center text-slate-400 text-[10px] italic">
                          Sem tarefas
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      </div>{/* close space-y-6 */}
      </div>{/* close CONTENT AREA */}

    </div>
  );
};
