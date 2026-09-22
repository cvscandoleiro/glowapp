import React from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import { getAvatarById } from '../utils/avatarRepository';
import { Avatar, IconButton } from '@mui/material';
import { 
  ArrowLeft,
  Hourglass,
  ClipboardText,
  FileText,
  Play,
  Rocket,
  Gear,
  Users,
  Folder,
  Briefcase
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

export const AllBacklogView: React.FC = () => {
  const { squad, projects, setViewingAllBacklog, backlogTasks, setBacklogTasks, filters } = usePlanningStore();

  // Filter projects to only include active ones (PENDENTE = 1, EXECUCAO = 2)
  const activeProjects = React.useMemo(() => {
    return projects.filter(p => p.statusId === 1 || p.statusId === 2);
  }, [projects]);

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
      setBacklogTasks(allTasks);
    };

    if (activeProjects.length > 0 && squad.length > 0) {
      fetchAllActiveBacklogs();
    }
  }, [activeProjects, squad, setBacklogTasks]);

  const filteredTasks = React.useMemo(() => {
    return backlogTasks.filter(t => {
      if (filters.backlogProject) {
        const allowed = filters.backlogProject.split(',');
        if (!allowed.includes(t.projectName)) return false;
      }
      if (filters.backlogPhase) {
        const allowed = filters.backlogPhase.split(',');
        if (!allowed.includes(t.taskPhase)) return false;
      }
      if (filters.backlogTech) {
        const allowed = filters.backlogTech.split(',');
        if (!allowed.includes(t.taskTechnology)) return false;
      }
      if (filters.backlogRole) {
        const allowed = filters.backlogRole.split(',');
        if (!allowed.includes(t.perfil)) return false;
      }
      if (filters.backlogResource) {
        const allowed = filters.backlogResource.split(',');
        if (!allowed.includes(t.nome)) return false;
      }
      return true;
    });
  }, [backlogTasks, filters.backlogProject, filters.backlogPhase, filters.backlogTech, filters.backlogRole, filters.backlogResource]);

  const modalWaitingTasks = filteredTasks.filter(t => t.kanbanStatus === 'Waiting');
  const modalInProgressTasks = filteredTasks.filter(t => t.kanbanStatus === 'In Progress');
  const modalCompletedTasks = filteredTasks.filter(t => t.kanbanStatus === 'Completed');

  const totalCount = filteredTasks.length;
  const completedCount = modalCompletedTasks.length;
  const ongoingCount = modalInProgressTasks.length;
  const todoCount = modalWaitingTasks.length;

  const totalPoints = filteredTasks.reduce((acc, t) => acc + (t.pontos || 0), 0);
  const completedPoints = modalCompletedTasks.reduce((acc, t) => acc + (t.pontos || 0), 0);
  const ongoingPoints = modalInProgressTasks.reduce((acc, t) => acc + (t.pontos || 0), 0);
  const todoPoints = modalWaitingTasks.reduce((acc, t) => acc + (t.pontos || 0), 0);

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pointsProgressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  const circleRadius = 38;
  const strokeWidthVal = 7;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffsetVal = circleCircumference - (progressPercent / 100) * circleCircumference;
  const pointsStrokeDashoffsetVal = circleCircumference - (pointsProgressPercent / 100) * circleCircumference;

  const projectsInKanban = React.useMemo(() => {
    return Array.from(new Set(filteredTasks.map(t => t.projectName).filter(Boolean))).sort() as string[];
  }, [filteredTasks]);

  const modalColumns = [
    { id: 'Waiting', title: 'Waiting', items: modalWaitingTasks },
    { id: 'In Progress', title: 'In Progress', items: modalInProgressTasks },
    { id: 'Completed', title: 'Completed', items: modalCompletedTasks }
  ];

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-8 pt-20 lg:pt-8 text-slate-800 bg-white/85 backdrop-blur-md min-h-screen overflow-y-auto pb-12">
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

      {/* Header Row */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <IconButton 
          onClick={() => setViewingAllBacklog(false)}
          sx={{
            color: '#64183f',
            border: '1.5px solid #64183f',
            padding: '6px',
            '&:hover': {
              backgroundColor: 'rgba(100, 24, 63, 0.08)'
            }
          }}
        >
          <ArrowLeft size={18} weight="bold" />
        </IconButton>
        <div>
          <h2 className="text-xl font-black text-[#64183f] fontFamily-Outfit leading-none">Backlog em Execução</h2>
          <p className="text-xs text-slate-450 mt-1">Quadro Kanban unificado de todos os projetos ativos</p>
        </div>
      </div>

      {/* Projects List Badges Container */}
      <div className="flex flex-wrap gap-2 mb-6 items-center shrink-0">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Projetos no Quadro:</span>
        {projectsInKanban.length > 0 ? (
          projectsInKanban.map(projName => (
            <span 
              key={projName} 
              className="text-[10px] font-extrabold text-white border border-white/10 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 hover:opacity-90 transition-all duration-200"
              style={{ background: "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" }}
            >
              <Briefcase size={12} weight="bold" /> {projName}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-slate-400 italic">Carregando projetos...</span>
        )}
      </div>



      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 mb-4">
        {/* Left side: Kanban Columns Board */}
        <div className="flex-1 bg-[#EAE5EA]/70 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-3xl flex flex-col relative shadow-sm overflow-hidden">
          
          <div className="p-5 flex gap-5 overflow-x-auto" style={{ background: 'linear-gradient(90deg, rgba(100, 24, 63, 0.15) 0%, rgba(26, 31, 68, 0.15) 100%)' }}>
            {modalColumns.map(col => {
              const colColor = col.id === 'Waiting' ? '#c2410c' : col.id === 'In Progress' ? '#1d4ed8' : '#047857';
              return (
                <div 
                  key={col.id} 
                  className="flex-1 min-w-[200px] max-w-[380px] flex flex-col p-2"
                  style={{
                    borderLeft: `5px solid ${colColor}`,
                    background: 'transparent'
                  }}
                >
                  {/* Column Header */}
                  <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                    <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: colColor }}>
                      {col.title === 'Waiting' ? 'Waiting 🎯' : col.title === 'In Progress' ? 'In Progress ⚡' : 'Completed 🎉'}
                    </span>
                    <div 
                      className="flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-extrabold"
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
                  <div className="space-y-3.5 pr-1.5">
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
                            className={`flex flex-col p-4 rounded-2xl kanban-card ${isAttentionAlert ? 'kanban-card-alert' : ''} relative overflow-visible`}
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
                              <div className="mb-0.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider" title={t.projectName}>
                                  {t.projectName}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-800 font-semibold mb-2 leading-snug" title={t.task}>
                                {t.task}
                              </p>

                              <div className="text-[9px] text-extrabold text-[#64183f] uppercase tracking-wider mb-2">
                                {t.taskPhase || 'Sem Fase'} - {t.taskTechnology || 'Sem Tecnologia'}
                              </div>

                              <div className="flex items-center gap-1 mb-2.5 text-slate-500">
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-[10px] font-medium text-slate-500">
                                  {t.dtInicio ? formatKanbanDate(t.dtInicio) : '-'} a {t.dtFim ? formatKanbanDate(t.dtFim) : '-'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                                <div className="flex items-center space-x-1.5">
                                  {t.nome ? (
                                    <>
                                      <Avatar
                                        title={t.nome}
                                        sx={{
                                          width: 18,
                                          height: 18,
                                          fontSize: '0.5rem',
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
                                      <span className="text-[10px] font-bold text-slate-650 truncate max-w-[70px]">{t.nome.split(' ')[0]}</span>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 italic text-[9px]">Sem alocação</span>
                                  )}
                                </div>
                                <span className="text-[10px] font-black text-[#64183f] bg-[#64183f]/10 px-2 py-0.5 rounded">{t.pontos} pts</span>
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

        {/* Right side: UX Premium Sidebar */}
        <div className="w-full lg:w-[280px] flex flex-col gap-5 shrink-0 pr-1 h-fit">
          {/* Progresso Concluído circular charts card */}
          <div className="p-5 rounded-[2rem] border border-slate-200 bg-white flex flex-col border-l-4 border-l-[#64183f] shadow-sm" style={{ background: 'linear-gradient(90deg, rgba(100, 24, 63, 0.12) 0%, rgba(26, 31, 68, 0.12) 100%)' }}>
            <span className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-4 block">Progresso Concluído</span>
            <div className="flex justify-around items-center gap-3">
              {/* Tasks Circle */}
              <div className="flex flex-col items-center">
                <div className="relative inline-flex justify-center items-center">
                  <svg width="85" height="85" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={circleRadius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidthVal} />
                    <circle 
                      cx="50" cy="50" r={circleRadius} fill="transparent" stroke="#64183f" strokeWidth={strokeWidthVal}
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={strokeDashoffsetVal}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    />
                  </svg>
                  <span className="absolute font-black text-slate-800 text-sm">{progressPercent}%</span>
                </div>
                <span className="text-[10px] font-extrabold text-[#64183f] uppercase mt-1.5 tracking-wider">Tarefas</span>
              </div>

              {/* Points Circle */}
              <div className="flex flex-col items-center">
                <div className="relative inline-flex justify-center items-center">
                  <svg width="85" height="85" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={circleRadius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidthVal} />
                    <circle 
                      cx="50" cy="50" r={circleRadius} fill="transparent" stroke="#64183f" strokeWidth={strokeWidthVal}
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={pointsStrokeDashoffsetVal}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    />
                  </svg>
                  <span className="absolute font-black text-slate-800 text-sm">{pointsProgressPercent}%</span>
                </div>
                <span className="text-[10px] font-extrabold text-[#64183f] uppercase mt-1.5 tracking-wider">Pontos</span>
              </div>
            </div>
          </div>

          {/* Tasks Counter Grid card */}
          <div className="p-5 rounded-[2rem] border border-slate-200 bg-white flex flex-col border-l-4 border-l-[#64183f] shadow-sm" style={{ background: 'linear-gradient(90deg, rgba(100, 24, 63, 0.15) 0%, rgba(26, 31, 68, 0.15) 100%)' }}>
            <span className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-3 block">Tasks</span>
            <div className="grid grid-cols-2 gap-3">
              {/* Total */}
              <div className="p-3 bg-purple-50/50 rounded-xl border-l-4 border-l-purple-500 flex flex-col">
                <span className="text-[9px] font-bold text-purple-600 uppercase">Total</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-lg font-black text-purple-900">{totalCount}</span>
                  <span className="text-[10px] font-bold text-purple-700">{totalPoints} pts</span>
                </div>
              </div>

              {/* Waiting */}
              <div className="p-3 bg-orange-50/50 rounded-xl border-l-4 border-l-orange-500 flex flex-col">
                <span className="text-[9px] font-bold text-orange-600 uppercase">Waiting</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-lg font-black text-orange-950">{todoCount}</span>
                  <span className="text-[10px] font-bold text-orange-700">{todoPoints} pts</span>
                </div>
              </div>

              {/* In Progress */}
              <div className="p-3 bg-blue-50/50 rounded-xl border-l-4 border-l-blue-500 flex flex-col">
                <span className="text-[9px] font-bold text-blue-600 uppercase">In Progress</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-lg font-black text-blue-900">{ongoingCount}</span>
                  <span className="text-[10px] font-bold text-blue-700">{ongoingPoints} pts</span>
                </div>
              </div>

              {/* Completed */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border-l-4 border-l-emerald-500 flex flex-col">
                <span className="text-[9px] font-bold text-emerald-600 uppercase">Completed</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-lg font-black text-emerald-900">{completedCount}</span>
                  <span className="text-[10px] font-bold text-emerald-700">{completedPoints} pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
