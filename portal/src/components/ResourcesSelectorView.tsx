import React, { useState, useEffect } from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import { ResourcesView } from './ResourcesView';
import type { Owner } from '../types';
import { ArrowLeft, Users, Plus, Trash, X, ThumbsUp, ThumbsDown, CaretDown, CaretUp } from '@phosphor-icons/react';
import { AVATAR_LIST, getAvatarById } from '../utils/avatarRepository';

interface ResourcesSelectorViewProps {
  onBackToDashboard?: () => void;
}

export const ResourcesSelectorView: React.FC<ResourcesSelectorViewProps> = () => {
  const { filters, setFilters, squad, owners, canWrite } = usePlanningStore();

  const loggedInUsername = localStorage.getItem('kairos_username') || '';
  const loggedInMember = squad.find(m => {
    if (!m.email) return false;
    const prefix = m.email.split('@')[0].toLowerCase().trim();
    return prefix === loggedInUsername.toLowerCase().trim();
  });

  const filteredSquad = squad.filter(res => {
    if (loggedInMember) {
      const loggedInOps = [
        ...(Array.isArray(loggedInMember.operationIds) ? loggedInMember.operationIds : []),
        ...(loggedInMember.operationId !== undefined && loggedInMember.operationId !== null ? [Number(loggedInMember.operationId)] : [])
      ].filter(Boolean);

      if (loggedInOps.length > 0) {
        const resOps = [
          ...(Array.isArray(res.operationIds) ? res.operationIds : []),
          ...(res.operationId !== undefined && res.operationId !== null ? [Number(res.operationId)] : [])
        ].filter(Boolean);

        return loggedInOps.some(opId => resOps.includes(opId));
      }
    }
    return true;
  });

  const activeCount = filteredSquad.filter(s => (s.status || 'ATIVO') === 'ATIVO').length;
  const inactiveCount = filteredSquad.filter(s => s.status === 'INATIVO').length;
  const activeOwnersCount = owners.filter(o => (o.status || 'ATIVO') === 'ATIVO').length;
  const inactiveOwnersCount = owners.filter(o => o.status === 'INATIVO').length;
  const [subView, setSubView] = useState<'menu' | 'profissionais' | 'donos'>(
    (filters.resourceSubView as 'menu' | 'profissionais' | 'donos') || 'menu'
  );
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [addTrigger, setAddTrigger] = useState(0);
  const [addOwnerTrigger, setAddOwnerTrigger] = useState(0);

  useEffect(() => {
    setFilters(prev => ({ 
      ...prev, 
      resourceSubView: subView,
      searchQuery: '',
      status: 'ATIVO',
      perfil: '',
      resourceEmail: '',
      resourceMatricula: '',
      resourceClientId: '',
      resourceStates: '',
      resourceCities: ''
    }));
  }, [subView, setFilters]);

  return (
    <div className="h-full flex flex-col animate-fade-in relative text-slate-800 bg-transparent overflow-hidden">
      {/* ── HEADER ── */}
      <div className={`px-8 border-b border-slate-200 bg-white flex justify-between items-center z-10 select-none transition-all duration-300 ${isHeaderCollapsed ? 'py-2' : 'py-5'}`}>
        <div>
          <h2 className={`font-extrabold text-[#64183f] transition-all duration-300 ${isHeaderCollapsed ? 'text-lg' : 'text-2xl'}`}>Gerenciamento de Recursos</h2>
          {!isHeaderCollapsed && (
            <div className="mt-1">
              {subView !== 'menu' ? (
                <button
                  onClick={() => setSubView('menu')}
                  className="flex items-center gap-1.5 text-[#64183f] hover:text-[#4a0f2d] font-bold text-xs uppercase transition-all tracking-wider hover:underline"
                >
                  <ArrowLeft size={14} weight="bold" />
                  <span>Voltar ao Seletor de Recursos</span>
                </button>
              ) : (
                <p className="text-xs font-semibold text-slate-500 transition-all duration-300">
                  Selecione uma das pastas abaixo para acessar a base de Profissionais ou os Gestores do Projeto.
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {subView === 'profissionais' && (
            <div className="flex flex-col items-end gap-1.5 mr-2">
              {canWrite && (
                <button 
                  onClick={() => setAddTrigger(prev => prev + 1)}
                  className="pl-4 pr-1.5 py-1 rounded-full text-white font-extrabold text-[11px] shadow-sm flex items-center justify-between select-none transition-all hover:scale-[1.02] active:scale-95 w-44 shrink-0"
                  style={{ background: "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" }}
                >
                  <div className="flex items-center space-x-1.5">
                    <Plus size={12} className="text-white" weight="bold" />
                    <span className="tracking-wide">Novo Profissional</span>
                  </div>
                  
                  <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center bg-white/10 shadow-sm ml-2">
                    <Plus size={8} weight="bold" />
                  </div>
                </button>
              )}

              {/* Active and Inactive statistics below the button */}
              <div className="flex items-center space-x-2">
                {/* Active stats */}
                <div 
                  className="flex items-center pl-2.5 pr-1 py-0.5 rounded-full shadow-sm text-white font-bold text-[8.5px] space-x-1.5"
                  style={{ background: 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)' }}
                >
                  <span className="uppercase tracking-wide">Ativos: {activeCount}</span>
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <ThumbsUp size={9} weight="fill" className="text-emerald-500" />
                  </div>
                </div>

                {/* Inactive stats */}
                <div 
                  className="flex items-center pl-2.5 pr-1 py-0.5 rounded-full shadow-sm text-white font-bold text-[8.5px] space-x-1.5"
                  style={{ background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' }}
                >
                  <span className="uppercase tracking-wide">Inativos: {inactiveCount}</span>
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <ThumbsDown size={9} weight="fill" className="text-red-500" />
                  </div>
                </div>
              </div>
            </div>
          )}
          {subView === 'donos' && (
            <div className="flex flex-col items-end gap-1.5 mr-2">
              {canWrite && (
                <button 
                  onClick={() => setAddOwnerTrigger(prev => prev + 1)}
                  className="pl-4 pr-1.5 py-1 rounded-full text-white font-extrabold text-[11px] shadow-sm flex items-center justify-between select-none transition-all hover:scale-[1.02] active:scale-95 w-44 shrink-0"
                  style={{ background: "linear-gradient(135deg, #552586 0%, #1a1f44 100%)" }}
                >
                  <div className="flex items-center space-x-1.5">
                    <Plus size={12} className="text-white" weight="bold" />
                    <span className="tracking-wide">Novo Gestor</span>
                  </div>
                  
                  <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center bg-white/10 shadow-sm ml-2">
                    <Plus size={8} weight="bold" />
                  </div>
                </button>
              )}

              {/* Active and Inactive statistics below the button */}
              <div className="flex items-center space-x-2">
                {/* Active stats */}
                <div 
                  className="flex items-center pl-2.5 pr-1 py-0.5 rounded-full shadow-sm text-white font-bold text-[8.5px] space-x-1.5"
                  style={{ background: 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)' }}
                >
                  <span className="uppercase tracking-wide">Ativos: {activeOwnersCount}</span>
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <ThumbsUp size={9} weight="fill" className="text-emerald-500" />
                  </div>
                </div>

                {/* Inactive stats */}
                <div 
                  className="flex items-center pl-2.5 pr-1 py-0.5 rounded-full shadow-sm text-white font-bold text-[8.5px] space-x-1.5"
                  style={{ background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' }}
                >
                  <span className="uppercase tracking-wide">Inativos: {inactiveOwnersCount}</span>
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <ThumbsDown size={9} weight="fill" className="text-red-500" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#64183f] hover:border-[#64183f] hover:bg-pink-50 transition-all shrink-0"
            title={isHeaderCollapsed ? 'Expandir cabeçalho' : 'Contrair cabeçalho'}
          >
            {isHeaderCollapsed ? <CaretDown size={14} weight="bold" /> : <CaretUp size={14} weight="bold" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-white/85 backdrop-blur-md flex flex-col">
        {subView === 'menu' && (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full px-6">
              {/* Pasta 1: Profissionais Minsait */}
              <div 
                onClick={() => setSubView('profissionais')}
                className="bg-white border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden flex flex-col relative group cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:border-[#64183f]/30"
                style={{ minHeight: '260px' }}
              >
                <div 
                  className="h-28 w-full relative flex items-center justify-center"
                  style={{ background: "linear-gradient(180deg, #64183f 0%, #1a1f44 100%)" }}
                >
                  <svg className="absolute bottom-0 left-0 w-full text-white/90 fill-current" viewBox="0 0 1440 220" preserveAspectRatio="none" style={{ height: '24px' }}>
                    <path d="M0,96 L120,112 C240,128,480,160,720,160 C960,160,1200,128,1320,112 L1440,96 L1440,220 L1320,220 C1200,220,960,220,720,220 C480,220,240,220,120,220 L0,220 Z"></path>
                  </svg>
                  <img 
                    src="/minsait_logo.png" 
                    alt="Minsait Logo" 
                    className="h-5 object-contain brightness-0 invert opacity-90 transition-transform group-hover:scale-105" 
                  />
                </div>
                <div className="flex flex-col p-6 flex-grow justify-between bg-white">
                  <div className="flex-grow flex items-center justify-center">
                    <h3 className="text-xl font-black text-slate-800 text-center">
                      Profissionais Minsait
                    </h3>
                  </div>
                </div>
              </div>

              {/* Pasta 2: Gestor do Projeto */}
              <div 
                onClick={() => setSubView('donos')}
                className="bg-white border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden flex flex-col relative group cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:border-[#552586]/30"
                style={{ minHeight: '260px' }}
              >
                <div 
                  className="h-28 w-full relative flex items-center justify-center"
                  style={{ background: "linear-gradient(180deg, #552586 0%, #1a1f44 100%)" }}
                >
                  <svg className="absolute bottom-0 left-0 w-full text-white/90 fill-current" viewBox="0 0 1440 220" preserveAspectRatio="none" style={{ height: '24px' }}>
                    <path d="M0,96 L120,112 C240,128,480,160,720,160 C960,160,1200,128,1320,112 L1440,96 L1440,220 L1320,220 C1200,220,960,220,720,220 C480,220,240,220,120,220 L0,220 Z"></path>
                  </svg>
                  <img 
                    src="/gestor2.png" 
                    alt="Gestor Icon" 
                    className="h-16 object-contain transition-transform group-hover:scale-105" 
                    style={{ filter: 'invert(1)', mixBlendMode: 'screen' }}
                  />
                </div>
                <div className="flex flex-col p-6 flex-grow justify-between bg-white">
                  <div className="flex-grow flex items-center justify-center">
                    <h3 className="text-xl font-black text-slate-800 text-center">
                      Gestor do Projeto
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {subView === 'profissionais' && (
          <div className="flex-1 min-h-0 w-full flex flex-col">
            <ResourcesView addTrigger={addTrigger} />
          </div>
        )}

        {subView === 'donos' && (
          <div className="flex-1 min-h-0 w-full flex flex-col">
            <ProjectsMenuViewMode defaultView="owners" addTrigger={addOwnerTrigger} />
          </div>
        )}
      </div>
    </div>
  );
};

interface ProjectsMenuViewModeProps {
  defaultView: 'projetos' | 'owners';
  addTrigger?: number;
}

const ProjectsMenuViewMode: React.FC<ProjectsMenuViewModeProps> = ({ defaultView, addTrigger }) => {
  const {
    owners, addOwner, updateOwner, deleteOwner, filters, canWrite
  } = usePlanningStore();

  const currentView = defaultView;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [flippingCard, setFlippingCard] = useState<number | null>(null);

  useEffect(() => {
    if (addTrigger && addTrigger > 0) {
      handleOpenModal();
    }
  }, [addTrigger]);

  // Form States
  const [ownerForm, setOwnerForm] = useState<Omit<Owner, 'id'> & { id?: number; avatar?: string | null }>({ name: '', status: 'ATIVO', avatar: '' });

  const handleCardClick = (owner: Owner) => {
    setFlippingCard(owner.id);
    setTimeout(() => {
      handleOpenModal(owner);
      setFlippingCard(null);
    }, 300);
  };

  const handleOpenModal = (entity?: any) => {
    if (currentView === 'owners') {
      if (entity) {
        setEditingId(entity.id);
        setOwnerForm({ name: entity.name, status: entity.status, avatar: entity.avatar || '' });
      } else {
        setEditingId(null);
        setOwnerForm({ name: '', status: 'ATIVO', avatar: '' });
      }
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (currentView === 'owners') {
      if (!ownerForm.name.trim()) return;
      if (editingId !== null) {
        await updateOwner({ id: editingId, name: ownerForm.name.trim(), status: ownerForm.status, avatar: ownerForm.avatar || null });
      } else {
        await addOwner({ name: ownerForm.name.trim(), status: ownerForm.status, avatar: ownerForm.avatar || null });
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number, label: string) => {
    const confirm = window.confirm(`Deseja realmente excluir "${label}"?`);
    if (!confirm) return;

    if (currentView === 'owners') {
      await deleteOwner(id);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(part => {
      const lower = part.toLowerCase();
      return !['de', 'da', 'do', 'das', 'dos', 'e'].includes(lower);
    });
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return '';
  };

  // Filtered List
  const activeOwners = owners.filter(owner => {
    // 1. Search Query filter (ignore case, like %%)
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      if (!owner.name.toLowerCase().includes(query)) {
        return false;
      }
    }

    // 2. Status filter (multi-selection)
    if (filters.status) {
      const selectedStatuses = filters.status.split(',');
      const currentStatus = owner.status || 'ATIVO';
      if (!selectedStatuses.includes(currentStatus)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-6 animate-fade-in relative pb-10 text-slate-800">
      
      {currentView === 'owners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start pb-6">
          {activeOwners.map(owner => (
              <div 
                key={owner.id} 
                onClick={() => handleCardClick(owner)}
                className={`glass-resource-card rounded-[1.5rem] overflow-hidden flex flex-col relative group cursor-pointer perspective-1000 transform-style-3d ${
                  flippingCard === owner.id ? 'animate-flip-3d' : ''
                } mx-auto w-full`}
                style={{ minHeight: '160px', maxWidth: '300px' }}
              >
                {/* Top gradient cover section matching template image (using #552586 gradient) */}
                <div 
                  className="h-20 w-full relative flex items-center justify-center animate-pulse-slow"
                  style={{ background: "linear-gradient(180deg, #552586 0%, #1a1f44 100%)" }}
                >
                  {/* Delete button styled as visual card options on top right */}
                  {canWrite && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(owner.id, owner.name);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm z-[2]"
                      title="Excluir Gestor"
                    >
                      <Trash size={12} />
                    </button>
                  )}

                  {/* Curve divider effect with high-contrast gradient transitioning from header colors to solid white */}
                  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none translate-y-[1px] pointer-events-none select-none z-[1]">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-5 relative block">
                      <defs>
                        <linearGradient id={`divider-gradient-owner-${owner.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#1a1f44" stopOpacity="1" />
                          <stop offset="50%" stopColor="#552586" stopOpacity="1" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z" 
                        fill={`url(#divider-gradient-owner-${owner.id})`}
                      />
                    </svg>
                  </div>
                </div>

                {/* Avatar positioned half on top (purple cover) and half on bottom (white card body), size increased by 50% (84px) */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ top: '80px' }}
                >
                  <div 
                    className="rounded-full p-[2px] flex items-center justify-center shadow-md"
                    style={{ 
                      width: '84px',
                      height: '84px',
                      background: owner.avatar 
                        ? getAvatarById(owner.avatar)?.gradient 
                        : "linear-gradient(135deg, #552586 0%, #1a1f44 100%)" 
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-white p-[1px]">
                      <div 
                        className="w-full h-full rounded-full flex items-center justify-center text-2xl font-black text-white overflow-hidden"
                        style={{ 
                          background: owner.avatar 
                            ? getAvatarById(owner.avatar)?.gradient 
                            : "linear-gradient(135deg, #552586 0%, #1a1f44 100%)" 
                        }}
                      >
                        {owner.avatar ? (
                          <div className="scale-150 flex items-center justify-center w-full h-full">
                            {getAvatarById(owner.avatar)?.icon}
                          </div>
                        ) : (
                          getInitials(owner.name)
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom details area - solid white bg to eliminate muddy gray and increase contrast */}
                <div className="flex flex-col items-center px-4 pb-3 pt-12 flex-grow relative bg-white justify-center">
                  <div className="text-center mb-0.5">
                    <h3 className="text-sm font-extrabold text-slate-800 transition-colors mb-0.5 line-clamp-1">
                      {owner.name}
                    </h3>
                    <p className="text-[10px] font-bold tracking-wider text-[#552586] uppercase">
                      Gestor
                    </p>
                  </div>

                  {/* Status pill button matching the gradient template - tightly spaced */}
                  <div className="mt-2 w-full px-2 flex justify-center">
                    <div 
                      className="flex items-center pl-3 pr-1 py-0.5 rounded-full shadow-sm text-white font-bold select-none text-[7.5px] w-full max-w-[90px]"
                      style={{
                        background: owner.status === 'INATIVO' 
                          ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' 
                          : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)'
                      }}
                    >
                      <span className="tracking-wide uppercase flex-1 text-center pl-2">{owner.status || 'ATIVO'}</span>
                      
                      {/* White circle with status icon (Like/Dislike) */}
                      <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm ml-1 shrink-0">
                        {owner.status === 'INATIVO' ? (
                          <ThumbsDown 
                            size={9} 
                            weight="fill" 
                            className="text-red-500"
                          />
                        ) : (
                          <ThumbsUp 
                            size={9} 
                            weight="fill" 
                            className="text-emerald-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {activeOwners.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
                <Users size={52} className="mb-4 opacity-40" />
                <p className="text-sm font-semibold">Nenhum gestor ativo cadastrado.</p>
              </div>
            )}
          </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in text-slate-800">
          <div className="bg-white w-[320px] rounded-[1.25rem] shadow-2xl border border-slate-100 relative animate-zoom-in flex flex-col justify-between overflow-hidden max-h-[90vh]">
            
            {/* Modal Title */}
            <div className="bg-[#f3effa] px-4 py-2.5 border-b border-[#e2d5f3]/60 flex justify-between items-center shrink-0">
              <h3 className="text-xs font-extrabold text-[#552586]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {editingId !== null ? 'Editar Gestor' : 'Novo Gestor'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-[#552586] transition-colors"
              >
                <X size={12} weight="bold" />
              </button>
            </div>
            
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3.5 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="flex flex-col items-center gap-3">
                
                {/* Center: Avatar */}
                <div 
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="w-[72px] h-[72px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#552586]/30 via-purple-500/20 to-[#06b6d4]/30 hover:from-[#552586] hover:to-[#06b6d4] transition-all duration-300 shadow-md hover:shadow-[0_0_10px_rgba(85,37,134,0.25)] cursor-pointer group"
                  title="Clique para selecionar avatar"
                >
                  <div className="w-full h-full rounded-full bg-white overflow-hidden relative flex items-center justify-center">
                    <div 
                      className="w-full h-full rounded-full flex items-center justify-center text-xs font-black text-white overflow-hidden relative"
                      style={{ 
                        background: ownerForm.avatar 
                          ? getAvatarById(ownerForm.avatar)?.gradient 
                          : "linear-gradient(135deg, #552586 0%, #1a1f44 100%)" 
                      }}
                    >
                      {ownerForm.avatar ? (
                        getAvatarById(ownerForm.avatar)?.icon
                      ) : (
                        getInitials(ownerForm.name || 'G')
                      )}
                      
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[7px] font-black uppercase tracking-wider text-white">
                        Mudar
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sliding toggle switch below the profile picture */}
                <div className="flex flex-col items-center mt-0.5 select-none">
                  <div 
                    onClick={() => canWrite && setOwnerForm(prev => ({ ...prev, status: prev.status === 'ATIVO' ? 'INATIVO' : 'ATIVO' }))}
                    className="w-[44px] h-5 rounded-full p-0.5 cursor-pointer transition-all duration-300 relative flex items-center shadow-inner"
                    style={{
                      background: ownerForm.status === 'INATIVO' 
                        ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' 
                        : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)'
                    }}
                  >
                    {/* Sliding Thumb */}
                    <div 
                      className={`w-[14px] h-[14px] rounded-full bg-white flex items-center justify-center shadow-md transform transition-transform duration-300 ${
                        ownerForm.status === 'ATIVO' ? 'translate-x-[24px]' : 'translate-x-0'
                      }`}
                    >
                      {ownerForm.status === 'INATIVO' ? (
                        <ThumbsDown 
                          size={8} 
                          weight="fill" 
                          className="text-red-500 animate-fade-in"
                        />
                      ) : (
                        <ThumbsUp 
                          size={8} 
                          weight="fill" 
                          className="text-[#06b6d4] animate-fade-in"
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-[6px] font-black text-[#552586] mt-0.5 uppercase tracking-wider">
                    {ownerForm.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Name row below */}
                <div className="w-full space-y-2 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[8px] font-black text-[#552586] uppercase tracking-wider mb-1 text-center">Nome Completo</label>
                    <input 
                      type="text" 
                      value={ownerForm.name}
                      onChange={e => setOwnerForm({...ownerForm, name: e.target.value})}
                      disabled={!canWrite}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[9px] text-slate-800 outline-none focus:border-[#552586]/50 transition-all font-bold placeholder-slate-400 text-center disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="ex. Maria de Souza"
                      autoFocus
                    />
                  </div>
                </div>

              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-[#f3effa] px-4 py-2.5 border-t border-[#e2d5f3]/60 flex justify-end space-x-2 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-[#5c5856] hover:text-[#552586] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={!canWrite}
                className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-white hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#552586" }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal para Seleção de Avatar do Gestor */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in text-slate-800 font-sans">
          <div className="glass-resource-card p-6 w-[420px] rounded-[2rem] border border-slate-100 shadow-2xl relative bg-white">
            <button 
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} weight="bold" />
            </button>
            
            <h3 className="text-lg font-black text-slate-800 mb-1">Selecione um Avatar</h3>
            <p className="text-xs text-slate-500 mb-5">Escolha uma das ilustrações de perfil para o gestor.</p>
            
            {/* Avatars Grid */}
            <div className="grid grid-cols-4 gap-3.5 max-h-[260px] overflow-y-auto pr-1">
              {AVATAR_LIST.map(avatar => {
                const isSelected = ownerForm.avatar === avatar.id;
                return (
                  <div 
                    key={avatar.id}
                    onClick={() => {
                      setOwnerForm({ ...ownerForm, avatar: avatar.id });
                      setIsAvatarModalOpen(false);
                    }}
                    className={`aspect-square rounded-2xl p-[2px] cursor-pointer transition-all duration-300 hover:scale-105 ${
                      isSelected ? 'ring-4 ring-[#552586]' : 'hover:shadow-md'
                    }`}
                    style={{ background: avatar.gradient }}
                    title={avatar.name}
                  >
                    <div className="w-full h-full rounded-2xl bg-white p-[1px]">
                      <div 
                        className="w-full h-full rounded-2xl flex items-center justify-center overflow-hidden"
                        style={{ background: avatar.gradient }}
                      >
                        {avatar.icon}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  setOwnerForm({ ...ownerForm, avatar: '' });
                  setIsAvatarModalOpen(false);
                }}
                className="text-xs font-black text-rose-500 hover:underline uppercase tracking-wide"
              >
                Remover Avatar
              </button>
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-6 py-2 rounded-xl text-xs font-black text-white shadow-md hover:opacity-90 transition-all uppercase tracking-wider"
                style={{ background: "linear-gradient(135deg, #552586 0%, #1a1f44 100%)" }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
