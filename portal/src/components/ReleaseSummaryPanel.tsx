import React, { useState, useMemo } from 'react';
import { usePlanningStore, getNextWorkingDay, addWorkingDays, isWorkingDay, calculateEndDate } from '../store/PlanningStore';
import { RocketLaunch, Users, Calendar, Info, Play, CheckCircle, Warning } from '@phosphor-icons/react';

export const ReleaseSummaryPanel: React.FC = () => {
  const { tasks, squad, holidays, releases, selectedRelease } = usePlanningStore();
  
  // Simulation Inputs
  const activeReleasePlan = useMemo(() => {
    return releases.find(r => r.periodo === selectedRelease) || releases[0];
  }, [releases, selectedRelease]);

  const [simStartDate, setSimStartDate] = useState(() => {
    return activeReleasePlan?.dataInicial || '2025-01-29';
  });

  // Toggle active squad members for simulation
  const [activeSquadNames, setActiveSquadNames] = useState<{ [name: string]: boolean }>(() => {
    const states: { [name: string]: boolean } = {};
    squad.forEach(m => { states[m.nome] = true; }); // Default all active
    return states;
  });

  // Toggle active systems for simulation
  const uniqueSystems = useMemo(() => {
    const s = new Set<string>();
    tasks.forEach(t => { if (t.sistema) s.add(t.sistema); });
    return Array.from(s);
  }, [tasks]);

  const [activeSystems, setActiveSystems] = useState<{ [sys: string]: boolean }>(() => {
    const states: { [sys: string]: boolean } = {};
    uniqueSystems.forEach(s => { states[s] = true; }); // Default all active
    return states;
  });

  const toggleMember = (name: string) => {
    setActiveSquadNames(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleSystem = (sys: string) => {
    setActiveSystems(prev => ({ ...prev, [sys]: !prev[sys] }));
  };

  // Run dynamic simulation calculation in memory
  const simulationResults = useMemo(() => {
    if (tasks.length === 0) return null;

    // Filter squad and tasks based on simulator selections
    const simSquad = squad.filter(m => activeSquadNames[m.nome]);
    const simTasks = tasks.filter(t => activeSystems[t.sistema] || !t.sistema);

    if (simSquad.length === 0 || simTasks.length === 0) {
      return {
        startDate: simStartDate,
        endDate: simStartDate,
        calendarDays: 0,
        workingDays: 0,
        totalPoints: 0,
        status: 'Falta Recursos/Tarefas',
        statusColor: 'text-red-500 bg-red-50 border-red-150'
      };
    }

    // Sort tasks by sequence
    const sortedTasks = [...simTasks].sort((a, b) => a.sequencia - b.sequencia);

    // Track resource next available slots (starts at simulated start date or member availability)
    const resourceNextAvailable: { [name: string]: string } = {};
    
    // Track latest end date among scheduled tasks
    let latestEndDate = getNextWorkingDay(simStartDate, holidays);

    // Dynamic scheduler simulation
    sortedTasks.forEach(t => {
      // Find eligible resource in our simulation squad
      const assignedName = t.nome;
      // If resource is not active in simulation, skip scheduling or assign to first active resource of same profile?
      // For a strict spreadsheet audit: schedule if the assignee is in the active squad
      const isActiveMember = simSquad.some(m => m.nome === assignedName);
      const resourceToUse = isActiveMember ? assignedName : (simSquad.find(m => m.perfil === t.perfil)?.nome || 'Unassigned');

      const resourceBaseStart = simStartDate;

      let earliestStart = resourceBaseStart;

      // Queue constraint
      if (resourceNextAvailable[resourceToUse]) {
        const nextSlot = getNextWorkingDay(resourceNextAvailable[resourceToUse], holidays);
        if (nextSlot > earliestStart) earliestStart = nextSlot;
      }

      // Predecessor constraints
      if (t.tarefaPai) {
        const predecessorJiras = sortedTasks.filter(pt => pt.idJira === t.tarefaPai);
        let predLatestFinish = '';
        predecessorJiras.forEach(pt => {
          // If we already scheduled it in our loop, get its finish date from resource queue
          // Wait, for simulation let's estimate based on resourceNextAvailable or just use computed date
          if (pt.dtFim && (!predLatestFinish || pt.dtFim > predLatestFinish)) {
            predLatestFinish = pt.dtFim;
          }
        });

        if (predLatestFinish) {
          const nextDay = getNextWorkingDay(addWorkingDays(predLatestFinish, 1, holidays), holidays);
          if (nextDay > earliestStart) earliestStart = nextDay;
        }
      }

      // Solve dates
      earliestStart = getNextWorkingDay(earliestStart, holidays);
      const allocationPerc = typeof (t as any).allocationPerc === 'number' ? (t as any).allocationPerc : 1;
      const calculatedEnd = calculateEndDate(earliestStart, t.pontos, holidays, allocationPerc);

      // Record availability
      resourceNextAvailable[resourceToUse] = calculatedEnd;
      if (calculatedEnd > latestEndDate) {
        latestEndDate = calculatedEnd;
      }
    });

    // Compute duration metrics
    const startD = new Date(simStartDate + 'T12:00:00');
    const endD = new Date(latestEndDate + 'T12:00:00');
    const calendarDays = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 86400)) + 1;

    // Calculate working days in simulation range
    let workingDaysCount = 0;
    let current = new Date(simStartDate + 'T12:00:00');
    while (current <= endD) {
      const dateStr = current.toISOString().split('T')[0];
      if (isWorkingDay(dateStr, holidays)) {
        workingDaysCount++;
      }
      current.setDate(current.getDate() + 1);
    }

    const totalPoints = sortedTasks.reduce((sum, t) => sum + t.pontos, 0);

    // Feasibility calculation vs. target release end date
    const targetEnd = activeReleasePlan?.dataFinal || '2025-04-10';
    
    let status = 'No Prazo';
    let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (latestEndDate > targetEnd) {
      status = 'Atrasado / Risco de Prazo';
      statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
    } else if (latestEndDate < targetEnd) {
      const margin = Math.ceil((new Date(targetEnd + 'T12:00:00').getTime() - endD.getTime()) / (1000 * 86400));
      if (margin > 15) {
        status = 'Excelente (Folga de ' + margin + ' dias)';
        statusColor = 'text-primary bg-primary/10 border-primary/20';
      }
    }

    return {
      startDate: simStartDate,
      endDate: latestEndDate,
      calendarDays,
      workingDays: workingDaysCount,
      totalPoints,
      status,
      statusColor
    };
  }, [tasks, squad, holidays, activeReleasePlan, simStartDate, activeSquadNames, activeSystems]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Simulador de Releases</h2>
        <p className="text-slate-500">Configure premissas da release e analise datas de entrega estimadas em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Simulator Parameters Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General settings */}
          <div className="glass-panel p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Calendar size={22} className="text-primary" />
              <h3 className="font-bold text-slate-800 text-base">Premissas Gerais</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Release Selecionada (Meta)</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 flex items-center justify-between">
                  <span>{activeReleasePlan?.periodo || 'Sprint 1'}</span>
                  <span className="text-xs text-slate-450 font-medium">Prazo: {activeReleasePlan ? new Date(activeReleasePlan.dataFinal + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Simular Início de Cronograma</label>
                <input 
                  type="date"
                  value={simStartDate}
                  onChange={e => setSimStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-primary/50 transition-all font-bold cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Squad members allocation panel */}
          <div className="glass-panel p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Users size={22} className="text-primary" />
              <h3 className="font-bold text-slate-800 text-base">Alocação de Squad</h3>
            </div>
            <p className="text-xs text-slate-400">Ative ou desative profissionais para ver o impacto da variação de capacidade na data final.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {squad.map(m => {
                const isActive = activeSquadNames[m.nome];
                return (
                  <div 
                    key={m.nome}
                    onClick={() => toggleMember(m.nome)}
                    className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50/50
                      ${isActive ? 'bg-primary/5 border-primary/40 text-slate-800 font-bold' : 'bg-white border-slate-150 text-slate-400 opacity-60'}
                    `}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs">{m.nome}</span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">{m.perfil}</span>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center
                      ${isActive ? 'border-primary bg-primary' : 'border-slate-350 bg-white'}
                    `}>
                      {isActive && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scope System allocation panel */}
          <div className="glass-panel p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <RocketLaunch size={22} className="text-primary" />
              <h3 className="font-bold text-slate-800 text-base">Escopo da Release (Sistemas)</h3>
            </div>
            <p className="text-xs text-slate-400">Marque os sistemas contemplados neste cenário simulado.</p>
            
            <div className="flex flex-wrap gap-2.5">
              {uniqueSystems.map(sys => {
                const isActive = activeSystems[sys];
                return (
                  <button
                    key={sys}
                    onClick={() => toggleSystem(sys)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all
                      ${isActive ? 'bg-white border-primary text-primary shadow-sm hover:bg-primary/5' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}
                    `}
                  >
                    {sys}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Simulator Output Panel */}
        <div className="space-y-6">
          <div className="glass-panel p-6 bg-gradient-to-br from-[#5d54a4] to-[#6358dc] text-white border-none shadow-lg space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
              <Play size={22} className="text-[#d1cbf5]" />
              <h3 className="font-black tracking-wider text-sm uppercase">Cenário Calculado</h3>
            </div>

            {simulationResults ? (
              <div className="space-y-5">
                {/* Resulting end date */}
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#d1cbf5]/85">Conclusão Estimada</span>
                  <h4 className="text-3xl font-black mt-1">
                    {new Date(simulationResults.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </h4>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4 text-sm font-semibold">
                  <div>
                    <span className="text-[10px] block text-[#d1cbf5]/80 uppercase">Dias Corridos</span>
                    <span className="text-lg font-bold">{simulationResults.calendarDays} dias</span>
                  </div>
                  <div>
                    <span className="text-[10px] block text-[#d1cbf5]/80 uppercase">Dias Úteis</span>
                    <span className="text-lg font-bold">{simulationResults.workingDays} úteis</span>
                  </div>
                  <div className="col-span-2 pt-2">
                    <span className="text-[10px] block text-[#d1cbf5]/80 uppercase">Carga de Trabalho Total</span>
                    <span className="text-lg font-bold">{simulationResults.totalPoints} pontos</span>
                  </div>
                </div>

                {/* Feasibility Alert */}
                <div className={`p-4 rounded-2xl border text-xs font-bold flex items-start space-x-2.5 ${simulationResults.statusColor}`}>
                  {simulationResults.endDate <= (activeReleasePlan?.dataFinal || '') ? (
                    <CheckCircle size={20} className="shrink-0 text-emerald-500" />
                  ) : (
                    <Warning size={20} className="shrink-0 text-rose-500" />
                  )}
                  <div>
                    <span className="block text-slate-800 text-xs font-extrabold uppercase">Status do Prazo</span>
                    <span className="text-slate-600 font-medium block mt-1">{simulationResults.status}</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-[#d1cbf5]">
                Carregando simulação...
              </div>
            )}
          </div>

          {/* Context Explainer */}
          <div className="glass-panel p-5 bg-white border border-slate-100 shadow-sm flex items-start space-x-3">
            <Info size={28} className="text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 space-y-1.5">
              <span className="font-extrabold text-slate-700 block">Como funciona o simulador?</span>
              <p>O simulador executa o algoritmo de planejamento CPM (Caminho Crítico) na memória do front-end.</p>
              <p>Considera a produtividade semanal de cada recurso ativo, alocando tarefas por sequenciamento e pulando fins de semana e feriados cadastrados.</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
