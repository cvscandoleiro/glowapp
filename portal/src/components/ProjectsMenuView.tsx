import React, { useState } from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import type { Project } from '../types';
import { 
  Plus, 
  Trash, 
  PencilSimple, 
  X, 
  Briefcase,
  Eye,
  CaretDown,
  CaretUp
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

export const ProjectsMenuView: React.FC = () => {
  const {
    projects, addProject, updateProject, deleteProject,
    owners, steps, statuses, filters, setViewingProject, saving, canWrite, squad
  } = usePlanningStore();

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [projectForm, setProjectForm] = useState<Omit<Project, 'id'> & { id?: number; comments?: string | null }>({
    projectId: '', name: '', stepId: 1, statusId: 1, ownerId: 0, comments: ''
  });

  const getStepName   = (id: number) => steps.find(s => s.id === id)?.name    || `Etapa #${id}`;
  const getStatusName = (id: number) => statuses.find(s => s.id === id)?.name  || `Status #${id}`;
  const getOwnerName  = (id: number) => owners.find(o => o.id === id)?.name    || `Gestor #${id}`;

  const handleOpenModal = (entity?: any) => {
    if (entity) {
      setEditingId(entity.id);
      setProjectForm({
        projectId: entity.projectId,
        name:      entity.name,
        stepId:    entity.stepId    || (steps[0]?.id    || 1),
        statusId:  entity.statusId  || (statuses[0]?.id || 1),
        ownerId:   entity.ownerId   || (owners[0]?.id   || 0),
        comments:  entity.comments  || ''
      });
    } else {
      setEditingId(null);
      setProjectForm({ projectId: '', name: '', stepId: steps[0]?.id || 1, statusId: statuses[0]?.id || 1, ownerId: owners[0]?.id || 0, comments: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!projectForm.name.trim() || !projectForm.projectId.trim()) return;

    const loggedInUsername = localStorage.getItem('kairos_username') || '';
    const loggedInMember = squad.find(m => {
      if (!m.email) return false;
      const prefix = m.email.split('@')[0].toLowerCase().trim();
      return prefix === loggedInUsername.toLowerCase().trim();
    });

    const projData = {
      projectId: projectForm.projectId.trim(),
      name:      projectForm.name.trim(),
      stepId:    Number(projectForm.stepId),
      statusId:  Number(projectForm.statusId),
      ownerId:   Number(projectForm.ownerId),
      comments:  projectForm.comments || null,
      operationId: loggedInMember?.operationId || null
    };
    if (editingId !== null) {
      await updateProject({ id: editingId, ...projData });
    } else {
      await addProject(projData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number, label: string) => {
    if (!window.confirm(`Deseja realmente excluir "${label}"?`)) return;
    await deleteProject(id);
  };

  const filteredProjects = projects.filter(proj => {

    if (filters.projectCode?.trim()  && !proj.projectId.toLowerCase().includes(filters.projectCode.toLowerCase()))  return false;
    if (filters.projectName?.trim()  && !proj.name.toLowerCase().includes(filters.projectName.toLowerCase()))        return false;
    if (filters.projectSteps)    { const s = filters.projectSteps.split(',').map(Number);    if (!s.includes(proj.stepId))   return false; }
    if (filters.projectStatuses) { const s = filters.projectStatuses.split(',').map(Number); if (!s.includes(proj.statusId)) return false; }
    if (filters.projectOwners)   { const s = filters.projectOwners.split(',').map(Number);   if (!s.includes(proj.ownerId))  return false; }
    return true;
  });

  return (
    <div className="h-full flex flex-col animate-fade-in relative text-slate-800 bg-transparent overflow-hidden">

      {/* ── HEADER ── */}
      <div className={`px-8 border-b border-slate-200 bg-white flex justify-between items-center z-10 select-none transition-all duration-300 ${isHeaderCollapsed ? 'py-2' : 'py-5'}`}>
        <div>
          <h2 className={`font-extrabold text-[#64183f] transition-all duration-300 ${isHeaderCollapsed ? 'text-lg' : 'text-2xl'}`}>Cadastro de Projetos</h2>
          {!isHeaderCollapsed && (
            <p className="text-xs font-semibold text-slate-500 mt-1 transition-all duration-300">Gerencie os projetos cadastrados no Kairos Project Management</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <button
              onClick={() => handleOpenModal()}
              className="pl-5 pr-2 py-1.5 rounded-full text-white font-extrabold text-xs shadow-lg flex items-center justify-between select-none transition-all hover:scale-[1.02] active:scale-95 w-44 shrink-0"
              style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}
            >
              <span className="tracking-wide">Novo Projeto</span>
              <div className="w-6 h-6 rounded-full border-2 border-white/80 flex items-center justify-center bg-white/10 shadow-sm ml-2">
                <Plus size={12} weight="bold" />
              </div>
            </button>
          )}
          <button 
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#64183f] hover:border-[#64183f] hover:bg-pink-50 transition-all shrink-0"
            title={isHeaderCollapsed ? "Expandir cabeçalho" : "Contrair cabeçalho"}
          >
            {isHeaderCollapsed ? <CaretDown size={14} weight="bold" /> : <CaretUp size={14} weight="bold" />}
          </button>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-white/85 backdrop-blur-md flex flex-col">
        {/* ── LIST ── */}
        <div className="bg-white border border-slate-200/50 border-l-[6px] border-l-[#64183f] shadow-sm rounded-[2rem] overflow-hidden">

        {/* Column Headers */}
        <div 
          className="grid items-center gap-4 px-6 py-4"
          style={{ 
            gridTemplateColumns: '50px 110px 2fr 1.5fr 1.5fr 1.2fr auto', 
            background: 'linear-gradient(to right, #64183f 0%, #1a1f44 100%)' 
          }}
        >
          <div />
          <div className="text-[11px] font-black text-white uppercase tracking-widest text-center">Código</div>
          <div className="text-[11px] font-black text-white uppercase tracking-widest text-left">Projeto</div>
          <div className="text-[11px] font-black text-white uppercase tracking-widest text-center">Gestor</div>
          <div className="text-[11px] font-black text-white uppercase tracking-widest text-center">Etapa Atual</div>
          <div className="text-[11px] font-black text-white uppercase tracking-widest text-center">Status</div>
          <div className="text-[11px] font-black text-white uppercase tracking-widest text-center">Ações</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {filteredProjects.map(proj => {
            return (
              <div
                key={proj.id}
                className="grid items-center gap-4 px-6 py-3 transition-colors cursor-default"
                style={{ gridTemplateColumns: '50px 110px 2fr 1.5fr 1.5fr 1.2fr auto', backgroundColor: 'transparent' }}
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

                {/* Etapa Atual — gradiente azul escuro */}
                <div className="flex justify-center">
                  <span
                    className="inline-flex items-center justify-center px-4 py-1.5 rounded-full font-black text-[10px] w-fit text-white shadow-sm tracking-wider uppercase"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #172554 100%)' }}
                  >
                    {getStepName(proj.stepId)}
                  </span>
                </div>

                {/* Status — bolinha colorida + texto */}
                {(() => {
                  const originalStatusName = getStatusName(proj.statusId) || '';
                  const statusName = originalStatusName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  let dotColor = '#9ca3af'; // cinza (default)
                  if (statusName.includes('PENDENTE')) dotColor = '#eab308';       // amarelo
                  else if (statusName.includes('EXECUCAO') || statusName.includes('EXECUÇÃO') || statusName.includes('EXECU')) dotColor = '#3b82f6'; // azul
                  else if (statusName.includes('CONCLUIDO') || statusName.includes('CONCLUÍDO')) dotColor = '#22c55e'; // verde
                  else if (statusName.includes('REJEITADO')) dotColor = '#ef4444'; // vermelho
                  return (
                    <div className="flex justify-center">
                      <div className="flex items-center gap-1.5 w-fit">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm block"
                          style={{ background: dotColor }}
                        />
                        <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: dotColor }}>
                          {originalStatusName}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Ações — sempre visíveis, cores fixas, agrupadas */}
                <div className="flex items-center gap-1.5 justify-center">
                  <button
                    title="Visualizar"
                    onClick={() => setViewingProject(proj)}
                    className="p-1.5 rounded-lg hover:bg-[#64183f]/10 transition-colors"
                    style={{ color: '#64183f' }}
                  >
                    <Eye size={15} weight="bold" />
                  </button>
                  {canWrite && (
                    <button
                      title="Editar"
                      onClick={() => handleOpenModal(proj)}
                      className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <PencilSimple size={15} weight="bold" />
                    </button>
                  )}
                  {canWrite && (
                    <button
                      title="Excluir"
                      onClick={() => handleDelete(proj.id, proj.name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash size={15} weight="bold" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="px-6 py-16 text-center text-slate-400">
              <Briefcase size={40} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm font-semibold">Nenhum projeto encontrado para os filtros ativos.</p>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ── MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in text-slate-800 font-sans">
          <div className="w-[480px] rounded-[2.2rem] border border-slate-100 shadow-2xl relative bg-white flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#faf2ee] px-5 py-3 border-b border-[#e5d5cf]/60 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-extrabold text-[#64183f]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {editingId !== null ? 'Editar Projeto' : 'Novo Projeto'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-[#64183f] transition-colors"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Código do Projeto</label>
                  <input
                    type="text"
                    value={projectForm.projectId}
                    onChange={e => setProjectForm({...projectForm, projectId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed uppercase"
                    placeholder="ex. PRJ-101"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Nome do Projeto</label>
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={e => setProjectForm({...projectForm, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="ex. Novo Portal de Vendas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Etapa</label>
                  <select
                    value={projectForm.stepId}
                    onChange={e => setProjectForm({...projectForm, stepId: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all cursor-pointer font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {steps.map(s => <option key={s.id} value={s.id} className="bg-white text-slate-800 font-bold">{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={projectForm.statusId}
                    onChange={e => setProjectForm({...projectForm, statusId: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all cursor-pointer font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {statuses.map(st => <option key={st.id} value={st.id} className="bg-white text-slate-800 font-bold">{st.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Responsável (Gestor / PO)</label>
                <select
                  value={projectForm.ownerId}
                  onChange={e => setProjectForm({...projectForm, ownerId: Number(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all cursor-pointer font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="0" className="bg-white text-slate-800 font-bold">Selecione um gestor...</option>
                  {owners.map(o => <option key={o.id} value={o.id} className="bg-white text-slate-800 font-bold">{o.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Resumo (Breve Comentário)</label>
                <textarea
                  value={projectForm.comments || ''}
                  onChange={e => setProjectForm({...projectForm, comments: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed h-16 resize-none"
                  placeholder="Informe um breve resumo do projeto..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#faf2ee] px-5 py-3 border-t border-[#e5d5cf]/60 flex justify-end space-x-2 shrink-0">
              <button 
                disabled={saving}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#5c5856] hover:text-[#64183f] transition-colors"
              >
                Cancelar
              </button>
              <button 
                disabled={saving || !canWrite}
                onClick={handleSave}
                className="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-wider text-white hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#64183f" }}
              >
                {saving ? (
                  <>
                    <span className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
