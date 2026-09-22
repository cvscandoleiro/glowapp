import React, { useMemo } from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import type { Task } from '../types';
import { CaretLeft, CaretRight, CheckCircle, Clock, Hourglass } from '@phosphor-icons/react';
import { getAvatarById } from '../utils/avatarRepository';

export const KanbanView: React.FC = () => {
  const { tasks, updateTask, squad } = usePlanningStore();

  // Group tasks by status
  const backlogTasks = useMemo(() => tasks.filter(t => t.status === 'backlog'), [tasks]);
  const doingTasks = useMemo(() => tasks.filter(t => t.status === 'doing'), [tasks]);
  const doneTasks = useMemo(() => tasks.filter(t => t.status === 'done'), [tasks]);

  const columns = [
    {
      id: 'backlog' as const,
      title: 'BACKLOG',
      items: backlogTasks,
      bgColor: 'bg-slate-100/50',
      icon: <Hourglass size={18} className="text-slate-400" />
    },
    {
      id: 'doing' as const,
      title: 'DOING',
      items: doingTasks,
      bgColor: 'bg-amber-50/20',
      icon: <Clock size={18} className="text-amber-500" />
    },
    {
      id: 'done' as const,
      title: 'DONE',
      items: doneTasks,
      bgColor: 'bg-emerald-50/20',
      icon: <CheckCircle size={18} className="text-emerald-500" />
    }
  ];

  const moveTaskStatus = (task: Task, direction: 'prev' | 'next') => {
    const statusOrder: Task['status'][] = ['backlog', 'doing', 'done'];
    const currentIndex = statusOrder.indexOf(task.status);
    
    let newIndex = currentIndex;
    if (direction === 'prev') newIndex = Math.max(0, currentIndex - 1);
    if (direction === 'next') newIndex = Math.min(statusOrder.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      updateTask({
        ...task,
        status: statusOrder[newIndex]
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'NA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-1">Quadro Kanban</h2>
        <p className="text-slate-500">Fluxo ágil de execução. Avance ou retroceda o status das tarefas para re-planejar o cronograma.</p>
      </div>

      {/* Columns */}
      <div className="flex-grow flex gap-6 overflow-x-auto pb-4 items-start h-[calc(100vh-240px)]">
        {columns.map(col => (
          <div 
            key={col.id} 
            className="flex-1 min-w-[320px] max-w-[380px] flex flex-col bg-white border border-slate-100 shadow-sm rounded-[1.8rem] h-full overflow-hidden"
          >
            {/* Column Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center space-x-2">
                {col.icon}
                <h3 className="font-bold text-slate-700 tracking-wider text-xs uppercase">{col.title}</h3>
              </div>
              <span className="bg-slate-200/70 text-slate-650 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {col.items.length}
              </span>
            </div>

            {/* Task list container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {col.items.map(item => (
                <div 
                  key={item.id} 
                  className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl hover:border-primary/40 hover:bg-white hover:shadow transition-all relative overflow-hidden group"
                >
                  {/* Status left bar */}
                  <div className={`absolute left-0 top-0 w-1 h-full 
                    ${item.status === 'done' ? 'bg-emerald-500' : ''}
                    ${item.status === 'doing' ? 'bg-amber-500' : ''}
                    ${item.status === 'backlog' ? 'bg-indigo-400' : ''}
                  `}></div>

                  {/* Top info */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded font-bold">
                      {item.idJira}
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                      {item.pontos} pt
                    </span>
                  </div>

                  {/* Task Text */}
                  <p className="text-xs font-bold text-slate-700 mb-4 line-clamp-2 leading-relaxed">
                    {item.task}
                  </p>

                  {/* Lower metadata */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    {/* User profile avatar */}
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const member = squad.find(m => m.nome === item.nome);
                        return (
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm overflow-hidden shrink-0"
                            style={{ 
                              background: member?.avatar 
                                ? getAvatarById(member.avatar)?.gradient 
                                : "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" 
                            }}
                          >
                            {member?.avatar ? (
                              getAvatarById(member.avatar)?.icon
                            ) : (
                              getInitials(item.nome)
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-600 line-clamp-1">{item.nome}</span>
                        <span className="text-[8px] text-slate-400 font-semibold">{item.perfil}</span>
                      </div>
                    </div>

                    {/* Navigation controllers inside card */}
                    <div className="flex items-center space-x-1">
                      {item.status !== 'backlog' && (
                        <button 
                          onClick={() => moveTaskStatus(item, 'prev')}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-700 transition-colors"
                          title="Voltar Status"
                        >
                          <CaretLeft size={16} weight="bold" />
                        </button>
                      )}
                      {item.status !== 'done' && (
                        <button 
                          onClick={() => moveTaskStatus(item, 'next')}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-700 transition-colors"
                          title="Avançar Status"
                        >
                          <CaretRight size={16} weight="bold" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {col.items.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-slate-350 border border-dashed border-slate-200 rounded-2xl">
                  <span className="text-xs font-medium">Nenhuma tarefa nesta coluna</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
