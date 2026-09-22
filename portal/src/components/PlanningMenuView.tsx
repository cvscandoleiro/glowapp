import React from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import type { Project } from '../types';
import { 
  Briefcase, 
  ArrowRight
} from '@phosphor-icons/react';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)',
  'linear-gradient(135deg, #1a1f44 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
  'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)',
];

const getAvatarGradient = (id: number) => AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export const PlanningMenuView: React.FC = () => {
  const {
    projects,
    owners,
    steps,
    setViewingProject
  } = usePlanningStore();

  const getStepName = (id: number) => steps.find(s => s.id === id)?.name || `Etapa #${id}`;
  const getOwnerName = (id: number) => owners.find(o => o.id === id)?.name || `Gestor #${id}`;

  const handleSelectStep3 = (project: Project) => {
    // Setting the viewing project will open ProjectDetailsView.
    // In ProjectDetailsView, the state activePlanningStep is initialized to null by default,
    // which displays the three cards: Fases da Construção, Prioridade do Backlog, Seleção do Time.
    setViewingProject(project);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in relative text-slate-800 bg-transparent overflow-hidden">
      {/* ── HEADER ── */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white flex justify-between items-center z-10 select-none">
        <div>
          <h2 className="text-2xl font-extrabold text-[#64183f]">Planejamento</h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">Selecione um projeto na etapa de planejamento para definir escopo e recursos</p>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-white/85 backdrop-blur-md flex flex-col">
        <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
          {/* Column Headers */}
          <div 
            className="grid items-center gap-4 px-6 py-4 rounded-t-[2rem]"
            style={{ 
              gridTemplateColumns: '50px 110px 2fr 1.5fr 1.5fr auto', 
              background: 'linear-gradient(to right, #64183f 0%, #1a1f44 100%)' 
            }}
          >
            <div />
            <div className="text-[11px] font-black text-white uppercase tracking-widest text-center">Código</div>
            <div className="text-[11px] font-black text-white uppercase tracking-widest text-left">Projeto</div>
            <div className="text-[11px] font-black text-white uppercase tracking-widest text-center">Gestor</div>
            <div className="text-[11px] font-black text-white uppercase tracking-widest text-center">Etapa Atual</div>
            <div className="text-[11px] font-black text-white uppercase tracking-widest text-center">Planejamento</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {projects.map(proj => {
              const isStep3 = proj.stepId === 3;
              return (
                <div
                  key={proj.id}
                  className="grid items-center gap-4 px-6 py-4 transition-colors cursor-default"
                  style={{ gridTemplateColumns: '50px 110px 2fr 1.5fr 1.5fr auto', backgroundColor: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(100,24,63,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Avatar */}
                  <div className="flex justify-center">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-[11px] shrink-0 shadow-md"
                      style={{ background: getAvatarGradient(proj.id) }}
                    >
                      {getInitials(proj.name)}
                    </div>
                  </div>

                  {/* Código */}
                  <div className="flex justify-center">
                    <span
                      className="inline-block px-3 py-1 rounded-lg text-xs font-black tracking-wider border truncate text-center min-w-[75px]"
                      style={{ color: '#64183f', background: '#fdf2f8', borderColor: '#fbcfe8' }}
                    >
                      {proj.projectId}
                    </span>
                  </div>

                  {/* Projeto */}
                  <p className="font-bold text-sm text-slate-800 truncate text-left">{proj.name}</p>

                  {/* Gestor */}
                  <p className="text-sm font-semibold text-slate-400 truncate text-center">{getOwnerName(proj.ownerId)}</p>

                  {/* Etapa Atual */}
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full font-black text-[10px] w-fit shadow-sm tracking-wider uppercase ${
                        isStep3 ? 'text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                      style={isStep3 ? { background: 'linear-gradient(135deg, #1d4ed8 0%, #172554 100%)' } : undefined}
                    >
                      {getStepName(proj.stepId)}
                    </span>
                  </div>

                  {/* Planejamento Ação */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleSelectStep3(proj)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md ${
                        isStep3 
                          ? 'text-white bg-gradient-to-br from-[#64183f] to-[#1a1f44] hover:scale-[1.02] active:scale-95 cursor-pointer'
                          : 'text-slate-400 bg-slate-100 cursor-not-allowed opacity-50'
                      }`}
                      title={isStep3 ? "Acessar o Planejamento da Entrega" : "Projeto não está na etapa de Planejamento"}
                    >
                      <span>Step 03 (Planejamento)</span>
                      <ArrowRight size={12} weight="bold" />
                    </button>
                  </div>
                </div>
              );
            })}

            {projects.length === 0 && (
              <div className="px-6 py-16 text-center text-slate-400">
                <Briefcase size={40} className="mx-auto mb-3 opacity-25" />
                <p className="text-sm font-semibold">Nenhum projeto cadastrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
