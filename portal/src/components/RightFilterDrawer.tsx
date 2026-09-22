import React from 'react';
import { X } from 'lucide-react';
import { usePlanningStore } from '../store/PlanningStore';

const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: (val: boolean) => void; label: string }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1.5 select-none w-full">
      <span className="font-semibold text-sm text-white/90">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only"
        />
        <div 
          className="w-11 h-6 rounded-full transition-all duration-200 flex items-center px-1 relative"
          style={checked
            ? { background: 'linear-gradient(135deg, #64183f 0%, #38213f 60%, #1a1f44 100%)' }
            : { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
          }
        >
          {/* Label inside toggle */}
          <span 
            className={`text-[7px] font-black text-white absolute transition-opacity duration-200 uppercase ${
              checked ? 'left-2 opacity-100' : 'right-2 opacity-0'
            }`}
            style={{ fontSize: '7px' }}
          >
            ON
          </span>
          <span 
            className={`text-[7px] font-black text-white/50 absolute transition-opacity duration-200 uppercase ${
              checked ? 'left-2 opacity-0' : 'right-2 opacity-100'
            }`}
            style={{ fontSize: '7px' }}
          >
            OFF
          </span>
          {/* Slider knob */}
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
    </label>
  );
};

interface RightFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
}

export const RightFilterDrawer: React.FC<RightFilterDrawerProps> = ({ isOpen, onClose, activeTab }) => {
  const { filters, setFilters, projects, squad, owners, steps, statuses, backlogTasks } = usePlanningStore();
  const [operations, setOperations] = React.useState<Array<{ id: number; name: string }>>([]);

  React.useEffect(() => {
    if (isOpen && (activeTab === 'user-management' || activeTab === 'hierarchy' || activeTab === 'resources')) {
      fetch('/api/operations')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setOperations(data);
        })
        .catch(err => console.warn('Erro ao buscar operações no drawer de filtros:', err));
    }
  }, [isOpen, activeTab]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Dynamically decide what to show based on activeTab
  const renderFilters = () => {
    switch (activeTab) {
      case 'resources': {
        const isGestor = filters.resourceSubView === 'donos';

        const loggedInUsername = localStorage.getItem('kairos_username') || '';
        const loggedInMember = squad.find(m => {
          if (!m.email) return false;
          const prefix = m.email.split('@')[0].toLowerCase().trim();
          return prefix === loggedInUsername.toLowerCase().trim();
        });

        const filteredSquadForFilters = squad.filter(res => {
          if (loggedInMember && loggedInMember.operationId !== null && loggedInMember.operationId !== undefined) {
            return res.operationId === loggedInMember.operationId;
          }
          return true;
        });

        const uniqueProfiles = Array.from(new Set(filteredSquadForFilters.map(s => s.perfil)));
        const uniqueStatuses = ['ATIVO', 'INATIVO'];
        const uniqueStates = Array.from(new Set(filteredSquadForFilters.map(s => s.state).filter(Boolean))) as string[];
        const uniqueCities = Array.from(new Set(filteredSquadForFilters.map(s => s.city).filter(Boolean))) as string[];
        
        // Multi-select handler helper
        const handleMultiChange = (key: 'perfil' | 'status' | 'resourceStates' | 'resourceCities' | 'resourceOperations', val: string) => {
          const currentVals = filters[key] ? filters[key].split(',') : [];
          let updatedVals: string[];
          if (currentVals.includes(val)) {
            updatedVals = currentVals.filter(v => v !== val);
          } else {
            updatedVals = [...currentVals, val];
          }
          handleFilterChange(key, updatedVals.join(','));
        };

        const loggedInOps = loggedInMember ? [
          ...(Array.isArray(loggedInMember.operationIds) ? loggedInMember.operationIds : []),
          ...(loggedInMember.operationId !== undefined && loggedInMember.operationId !== null ? [Number(loggedInMember.operationId)] : [])
        ].map(Number).filter(Boolean) : [];

        const userPermissionsStr = localStorage.getItem('kairos_permissions') || '{}';
        let isAdmin = false;
        try {
          const perms = JSON.parse(userPermissionsStr);
          isAdmin = perms.role === 'admin' || perms.can_save === true;
        } catch (e) {}

        const visibleOperations = (isAdmin || loggedInOps.length === 0)
          ? operations
          : operations.filter(op => loggedInOps.includes(op.id));

        return (
          <div className="space-y-6">
            {/* Search Input - Name (ignore-case) */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">
                {isGestor ? 'Pesquisa por Nome' : 'Pesquisa por Nome'}
              </label>
              <input
                type="text"
                placeholder={isGestor ? 'Pesquisar gestor...' : 'Pesquisar profissional...'}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-palette-teal"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              />
            </div>

            {/* Profile Multi-Select Label / Checkbox list - Omitted if Gestor is active */}
            {!isGestor && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Perfil (Múltipla Seleção)</label>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                  {uniqueProfiles.map(prof => {
                    const isChecked = filters.perfil ? filters.perfil.split(',').includes(prof) : false;
                    return (
                      <label key={prof} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleMultiChange('perfil', prof)}
                          className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-semibold">{prof}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {!isGestor && visibleOperations.length > 0 && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Operação (Múltipla Seleção)</label>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                  {visibleOperations.map(op => {
                    const isChecked = filters.resourceOperations ? filters.resourceOperations.split(',').includes(String(op.id)) : false;
                    return (
                      <label key={op.id} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleMultiChange('resourceOperations', String(op.id))}
                          className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-semibold">{op.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {!isGestor && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Email</label>
                <input
                  type="text"
                  placeholder="Pesquisar email..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-palette-teal"
                  value={filters.resourceEmail || ''}
                  onChange={(e) => handleFilterChange('resourceEmail', e.target.value)}
                />
              </div>
            )}

            {!isGestor && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Matrícula</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="999999"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-palette-teal"
                  value={filters.resourceMatricula || ''}
                  onChange={(e) => handleFilterChange('resourceMatricula', e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
            )}

            {!isGestor && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">ID SAP (Vivo)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="99999999"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-palette-teal"
                  value={filters.resourceClientId || ''}
                  onChange={(e) => handleFilterChange('resourceClientId', e.target.value.replace(/\D/g, '').slice(0, 8))}
                />
              </div>
            )}

            {!isGestor && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Estado (Múltipla Seleção)</label>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                  {uniqueStates.map(state => {
                    const isChecked = filters.resourceStates ? filters.resourceStates.split(',').includes(state) : false;
                    return (
                      <label key={state} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleMultiChange('resourceStates', state)}
                          className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-semibold">{state}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {!isGestor && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Cidade (Múltipla Seleção)</label>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                  {uniqueCities.map(city => {
                    const isChecked = filters.resourceCities ? filters.resourceCities.split(',').includes(city) : false;
                    return (
                      <label key={city} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleMultiChange('resourceCities', city)}
                          className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-semibold">{city}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status Multi-Select Label / Checkbox list */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Status (Múltipla Seleção)</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 select-none">
                {uniqueStatuses.map(st => {
                  const isChecked = filters.status ? filters.status.split(',').includes(st) : false;
                  return (
                    <label key={st} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleMultiChange('status', st)}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">{st}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Sistema / Projeto</label>
              <select
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-palette-teal [&>option]:text-slate-800"
                value={filters.sistema}
                onChange={(e) => handleFilterChange('sistema', e.target.value)}
              >
                <option value="Todos">Todos</option>
                {projects.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Buscar</label>
              <input
                type="text"
                placeholder="Busca livre..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-palette-teal"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              />
            </div>
          </div>
        );
      case 'projetos-menu': {
        const uniqueProjectCodes = Array.from(new Set(projects.map(p => p.projectId)));
        const uniqueProjectNames = Array.from(new Set(projects.map(p => p.name)));

        const handleProjectMultiChange = (key: 'projectSteps' | 'projectStatuses' | 'projectOwners', val: string) => {
          const currentVals = filters[key] ? (filters[key] as string).split(',') : [];
          let updatedVals: string[];
          if (currentVals.includes(val)) {
            updatedVals = currentVals.filter(v => v !== val);
          } else {
            updatedVals = [...currentVals, val];
          }
          handleFilterChange(key, updatedVals.join(','));
        };

        return (
          <div className="space-y-6">
            {/* Cód. Projeto Autocomplete */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Cód. Projeto</label>
              <input
                type="text"
                list="project-codes-list"
                placeholder="Pesquisar por código..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-palette-teal"
                value={filters.projectCode || ''}
                onChange={(e) => handleFilterChange('projectCode', e.target.value)}
              />
              <datalist id="project-codes-list">
                {uniqueProjectCodes.map(code => (
                  <option key={code} value={code} />
                ))}
              </datalist>
            </div>

            {/* Nome do Projeto Autocomplete */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Nome do Projeto</label>
              <input
                type="text"
                list="project-names-list"
                placeholder="Pesquisar por nome..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-palette-teal"
                value={filters.projectName || ''}
                onChange={(e) => handleFilterChange('projectName', e.target.value)}
              />
              <datalist id="project-names-list">
                {uniqueProjectNames.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Etapa Atual Multi-Select Checkboxes */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Etapa Atual (Múltipla Seleção)</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                {steps.map(s => {
                  const isChecked = filters.projectSteps ? filters.projectSteps.split(',').includes(String(s.id)) : false;
                  return (
                    <label key={s.id} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleProjectMultiChange('projectSteps', String(s.id))}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">{s.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Status Multi-Select Checkboxes */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Status (Múltipla Seleção)</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 select-none">
                {statuses.map(st => {
                  const isChecked = filters.projectStatuses ? filters.projectStatuses.split(',').includes(String(st.id)) : false;
                  return (
                    <label key={st.id} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleProjectMultiChange('projectStatuses', String(st.id))}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">{st.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Dono do Projeto Multi-Select Checkboxes */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Dono do Projeto (Múltipla Seleção)</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                {owners.map(o => {
                  const isChecked = filters.projectOwners ? filters.projectOwners.split(',').includes(String(o.id)) : false;
                  return (
                    <label key={o.id} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleProjectMultiChange('projectOwners', String(o.id))}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">{o.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
      case 'workflow-menu':
        return (
          <div className="space-y-6">
            <p className="text-sm text-white/60">O Workflow é gerido globalmente. Os filtros aplicados aqui refletirão na visualização geral.</p>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Buscar Etapa</label>
              <input
                type="text"
                placeholder="Nome da etapa..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-palette-teal"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              />
            </div>
          </div>
        );
      case 'backlog':
        return (
          <div className="space-y-6">
            <p className="text-sm text-white/60">Filtre os requisitos do backlog carregado.</p>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Buscar Requisito</label>
              <input
                type="text"
                placeholder="Ex: JIR_01..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-palette-teal"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              />
            </div>
          </div>
        );
      case 'backlog-estimado': {
        const buildTechs = (window as any).backlogBuildTechs || [];
        const arqTechs = (window as any).backlogArqTechs || [];
        const macroReqs = (window as any).backlogMacroRequirements || [];

        const handleBacklogMultiChange = (key: 'backlogBuildTechs' | 'backlogArqTechs' | 'backlogComplexidades', val: string) => {
          const currentVals = filters[key] ? (filters[key] as string).split(',') : [];
          let updatedVals: string[];
          if (currentVals.includes(val)) {
            updatedVals = currentVals.filter(v => v !== val);
          } else {
            updatedVals = [...currentVals, val];
          }
          handleFilterChange(key, updatedVals.join(','));
        };

        return (
          <div className="space-y-6">
            {/* Requisitos Editable Combobox */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Requisito</label>
              <input
                type="text"
                list="backlog-macro-reqs-list"
                placeholder="Selecionar ou pesquisar requisito..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-palette-teal"
                value={filters.backlogMacroRequisito || ''}
                onChange={(e) => handleFilterChange('backlogMacroRequisito', e.target.value)}
              />
              <datalist id="backlog-macro-reqs-list">
                {macroReqs.map((req: string) => (
                  <option key={req} value={req} />
                ))}
              </datalist>
            </div>

            {/* Descrição Text Search */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Descrição</label>
              <input
                type="text"
                placeholder="Filtrar por descrição..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-palette-teal"
                value={filters.backlogTarefa || ''}
                onChange={(e) => handleFilterChange('backlogTarefa', e.target.value)}
              />
            </div>

            {/* Build Techs Checkbox List */}
            {buildTechs.length > 0 && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">BUILD</label>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                  {buildTechs.map((tech: string) => {
                    const isChecked = filters.backlogBuildTechs ? filters.backlogBuildTechs.split(',').includes(tech) : false;
                    return (
                      <label key={`build-${tech}`} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleBacklogMultiChange('backlogBuildTechs', tech)}
                          className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-semibold">{tech}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Arq & Design Techs Checkbox List */}
            {arqTechs.length > 0 && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">ARQ & DESIGN</label>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                  {arqTechs.map((tech: string) => {
                    const isChecked = filters.backlogArqTechs ? filters.backlogArqTechs.split(',').includes(tech) : false;
                    return (
                      <label key={`arq-${tech}`} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleBacklogMultiChange('backlogArqTechs', tech)}
                          className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-semibold">{tech}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Complexidade click-to-toggle Badges */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Complexidade</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-wrap gap-2.5 select-none">
                {[
                  { code: 'MS', label: 'MS (Muito Simples)', color: 'bg-purple-50 text-purple-700 border-purple-250/50' },
                  { code: 'S', label: 'S (Simples)', color: 'bg-emerald-50 text-emerald-700 border-emerald-250/50' },
                  { code: 'M', label: 'M (Média)', color: 'bg-amber-50 text-amber-700 border-amber-250/50' },
                  { code: 'C', label: 'C (Complexa)', color: 'bg-blue-50 text-blue-700 border-blue-250/50' }
                ].map(comp => {
                  const isChecked = filters.backlogComplexidades ? filters.backlogComplexidades.split(',').includes(comp.code) : false;
                  return (
                    <button
                      key={comp.code}
                      onClick={() => handleBacklogMultiChange('backlogComplexidades', comp.code)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm border transition-all select-none
                        ${isChecked 
                          ? `${comp.color} scale-[1.03] ring-1 ring-white/10` 
                          : 'bg-white/5 text-white/40 border-white/10 opacity-50 hover:opacity-85 hover:bg-white/10'
                        }
                      `}
                    >
                      {comp.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
      case 'ferries': {
        const uniqueProfiles = Array.from(new Set(squad.map(s => s.perfil))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
        const handleMultiChange = (key: 'perfil', val: string) => {
          const currentVals = filters[key] ? filters[key].split(',') : [];
          let updatedVals: string[];
          if (currentVals.includes(val)) {
            updatedVals = currentVals.filter(v => v !== val);
          } else {
            updatedVals = [...currentVals, val];
          }
          handleFilterChange(key, updatedVals.join(','));
        };

        return (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Perfil (Múltipla Seleção)</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-60 overflow-y-auto">
                {uniqueProfiles.map(prof => {
                  const isChecked = filters.perfil ? filters.perfil.split(',').includes(prof) : false;
                  return (
                    <label key={prof} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleMultiChange('perfil', prof)}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">{prof}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
      case 'all-backlog': {
        const uniqueProjects = Array.from(new Set(backlogTasks.map(t => t.projectName).filter(Boolean))).sort() as string[];
        const uniquePhases = Array.from(new Set(backlogTasks.map(t => t.taskPhase).filter(Boolean))).sort() as string[];
        const uniqueTechs = Array.from(new Set(backlogTasks.map(t => t.taskTechnology).filter(Boolean))).sort() as string[];
        const uniqueRoles = Array.from(new Set(backlogTasks.map(t => t.perfil).filter(Boolean))).sort() as string[];
        const uniqueResources = Array.from(new Set(backlogTasks.map(t => t.nome).filter(Boolean))).sort() as string[];

        const handleBacklogMultiChange = (key: 'backlogProject' | 'backlogPhase' | 'backlogTech' | 'backlogRole' | 'backlogResource', val: string) => {
          const currentVals = filters[key] ? (filters[key] as string).split(',') : [];
          let updatedVals: string[];
          if (currentVals.includes(val)) {
            updatedVals = currentVals.filter(v => v !== val);
          } else {
            updatedVals = [...currentVals, val];
          }
          handleFilterChange(key, updatedVals.join(','));
        };

        return (
          <div className="space-y-6">
            {/* Filter Project */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Projeto (Múltipla Seleção)</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                {uniqueProjects.map(p => {
                  const isChecked = filters.backlogProject ? filters.backlogProject.split(',').includes(p) : false;
                  return (
                    <label key={p} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleBacklogMultiChange('backlogProject', p)}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">{p}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter Phase */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Etapa (Múltipla Seleção)</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                {uniquePhases.map(ph => {
                  const isChecked = filters.backlogPhase ? filters.backlogPhase.split(',').includes(ph) : false;
                  return (
                    <label key={ph} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleBacklogMultiChange('backlogPhase', ph)}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">{ph}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter Tech */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Tecnologia (Múltipla Seleção)</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                {uniqueTechs.map(t => {
                  const isChecked = filters.backlogTech ? filters.backlogTech.split(',').includes(t) : false;
                  return (
                    <label key={t} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleBacklogMultiChange('backlogTech', t)}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">{t}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter Role */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Perfil do Profissional (Múltipla Seleção)</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                {uniqueRoles.map(r => {
                  const isChecked = filters.backlogRole ? filters.backlogRole.split(',').includes(r) : false;
                  return (
                    <label key={r} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleBacklogMultiChange('backlogRole', r)}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">{r}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter Resource */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">Nome do Profissional (Múltipla Seleção)</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
                {uniqueResources.map(res => {
                  const isChecked = filters.backlogResource ? filters.backlogResource.split(',').includes(res) : false;
                  return (
                    <label key={res} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleBacklogMultiChange('backlogResource', res)}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">{res}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
      case 'user-management': {
        const roles = [
          { id: 'admin', name: 'Administrador' },
          { id: 'gestor', name: 'Gestor' },
          { id: 'colaborador', name: 'Colaborador' },
          { id: 'visualizador', name: 'Visualizador' }
        ];
        
        const handleRoleChange = (roleId: string) => {
          const currentRoles = filters.userRoleQuery ? filters.userRoleQuery.split(',') : [];
          let updatedRoles: string[];
          if (currentRoles.includes(roleId)) {
            updatedRoles = currentRoles.filter(r => r !== roleId);
          } else {
            updatedRoles = [...currentRoles, roleId];
          }
          handleFilterChange('userRoleQuery', updatedRoles.join(','));
        };

        const handleOperationChange = (opId: number) => {
          const currentOps = filters.userOperationsQuery ? filters.userOperationsQuery.split(',') : [];
          const opIdStr = String(opId);
          let updatedOps: string[];
          if (currentOps.includes(opIdStr)) {
            updatedOps = currentOps.filter(o => o !== opIdStr);
          } else {
            updatedOps = [...currentOps, opIdStr];
          }
          handleFilterChange('userOperationsQuery', updatedOps.join(','));
        };

        return (
          <div className="space-y-6">
            {/* Search Input - Name, Username, Email */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">
                Pesquisa (Nome, Usuário ou E-mail)
              </label>
              <input
                type="text"
                placeholder="Pesquisar..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-palette-teal"
                value={filters.userSearchQuery || ''}
                onChange={(e) => handleFilterChange('userSearchQuery', e.target.value)}
              />
            </div>

            {/* Profile Multi-Select */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">
                Papel / Nível de Acesso
              </label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5">
                {roles.map(role => {
                  const isChecked = filters.userRoleQuery ? filters.userRoleQuery.split(',').includes(role.id) : false;
                  return (
                    <label key={role.id} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleRoleChange(role.id)}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">{role.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Operations Multi-Select */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">
                Operação / Time
              </label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5 max-h-48 overflow-y-auto">
                {operations.map(op => {
                  const isChecked = filters.userOperationsQuery ? filters.userOperationsQuery.split(',').includes(String(op.id)) : false;
                  return (
                    <label key={op.id} className="flex items-center space-x-3 cursor-pointer text-sm text-white/90 select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleOperationChange(op.id)}
                        className="rounded border-white/20 bg-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">{op.name}</span>
                    </label>
                  );
                })}
                {operations.length === 0 && (
                  <p className="text-[11px] italic text-white/40">Carregando operações...</p>
                )}
              </div>
            </div>
          </div>
        );
      }
      case 'hierarchy': {
        const loggedInUsername = localStorage.getItem('kairos_username') || '';
        const loggedInMember = squad.find(m => {
          if (!m.email) return false;
          const prefix = m.email.split('@')[0].toLowerCase().trim();
          return prefix === loggedInUsername.toLowerCase().trim();
        });

        let allowedOpIds: Set<number> = new Set();
        squad.forEach(res => {
          let isVisible = true;
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
              isVisible = loggedInOps.some(opId => resOps.includes(opId));
            }
          }

          if (isVisible) {
            if (res.operationId !== null && res.operationId !== undefined) {
              allowedOpIds.add(Number(res.operationId));
            }
            if (Array.isArray(res.operationIds)) {
              res.operationIds.forEach(id => allowedOpIds.add(Number(id)));
            }
          }
        });

        const allowedOperationsList = operations.filter(op => allowedOpIds.has(op.id));

        return (
          <div className="space-y-6">
            {/* Filter by Operation */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 mb-2">
                Filtrar por Operação
              </label>
              <select
                value={filters.hierarchyOperationId || ''}
                onChange={e => handleFilterChange('hierarchyOperationId', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-palette-teal cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                <option value="" className="text-slate-800">Todas as Operações ({allowedOperationsList.length})</option>
                {allowedOperationsList.map(op => (
                  <option key={op.id} value={op.id} className="text-slate-800">
                    {op.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkboxes Group with Switch Toggles */}
            <div className="space-y-4 pt-2">
              <ToggleSwitch
                label="Visualizar quantidade de liderados"
                checked={filters.hierarchyShowReportsCount === 'true'}
                onChange={val => handleFilterChange('hierarchyShowReportsCount', val ? 'true' : 'false')}
              />
              <ToggleSwitch
                label="Apenas subordinados diretos"
                checked={filters.hierarchyShowOnlyDirect === 'true'}
                onChange={val => handleFilterChange('hierarchyShowOnlyDirect', val ? 'true' : 'false')}
              />
            </div>
          </div>
        );
      }
      default:
        return <p className="text-sm text-white/60">Nenhum filtro disponível para esta tela.</p>;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[65] backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[320px] text-white border-l border-white/10 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: "linear-gradient(180deg, #64183f 0%, #1a1f44 100%)" }}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <h2 className="font-bold text-white tracking-wide">Filtros da Tela</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {renderFilters()}
        </div>
        
        <div className="p-6 border-t border-white/10 bg-black/20">
          <button 
            onClick={() => {
              if (activeTab === 'resources') {
                setFilters(prev => ({ 
                  sistema: 'Todos', 
                  perfil: '', 
                  searchQuery: '', 
                  status: 'ATIVO,INATIVO', 
                  resourceSubView: prev.resourceSubView 
                }));
              } else if (activeTab === 'projetos-menu') {
                setFilters(prev => ({ 
                  ...prev,
                  projectCode: '', 
                  projectName: '', 
                  projectSteps: '', 
                  projectStatuses: '', 
                  projectOwners: '' 
                }));
              } else if (activeTab === 'backlog-estimado') {
                setFilters(prev => ({ 
                  ...prev,
                  backlogMacroRequisito: '', 
                  backlogTarefa: '', 
                  backlogBuildTechs: '', 
                  backlogArqTechs: '', 
                  backlogComplexidades: '',
                  searchQuery: ''
                }));
                if (typeof (window as any).reloadBacklogFile === 'function') {
                  (window as any).reloadBacklogFile();
                }
              } else if (activeTab === 'all-backlog') {
                setFilters(prev => ({ 
                  ...prev,
                  backlogProject: '', 
                  backlogPhase: '', 
                  backlogTech: '', 
                  backlogRole: '', 
                  backlogResource: '' 
                }));
              } else if (activeTab === 'user-management') {
                setFilters(prev => ({
                  ...prev,
                  userSearchQuery: '',
                  userRoleQuery: '',
                  userOperationsQuery: ''
                }));
              } else if (activeTab === 'hierarchy') {
                setFilters(prev => ({
                  ...prev,
                  hierarchyOperationId: '',
                  hierarchyShowReportsCount: 'false',
                  hierarchyShowOnlyDirect: 'false'
                }));
              } else {
                setFilters(prev => ({ ...prev, sistema: 'Todos', perfil: 'Todos', searchQuery: '', status: '' }));
              }
            }}
            className="w-full py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/20 transition-colors shadow-sm"
          >
            Limpar Filtros
          </button>
        </div>
      </div>
    </>
  );
};
